export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ─── API: Download form → store lead → return PDF ───
    if (url.pathname === '/api/download' && request.method === 'POST') {
      try {
        const { name, email, phone, resource } = await request.json();
        if (!name || !email || !resource) {
          return new Response(JSON.stringify({ error: 'required fields missing' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (resource.includes('..') || resource.includes('/') || resource.includes('\\')) {
          return new Response(JSON.stringify({ error: 'invalid resource' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }

        if (env.DB) {
          await env.DB.prepare(
            'INSERT INTO contacts (name, email, phone, resource, source, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(name, email, phone || '', resource, 'courses', 'downloaded', Date.now()).run();
        }

        if (env.RESEND_API_KEY) {
          await notifyAdmin(env, 'download', { name, email, phone: phone || '', resource });
        }

        let pdfBody, pdfHeaders;
        if (env.RESOURCES) {
          const obj = await env.RESOURCES.get(resource);
          if (obj) {
            pdfBody = obj.body;
            pdfHeaders = new Headers();
            pdfHeaders.set('Content-Type', obj.httpMetadata?.contentType || 'application/pdf');
            obj.writeHttpMetadata(pdfHeaders);
          }
        }
        if (!pdfBody) {
          return new Response(JSON.stringify({ error: 'file not found' }), {
            status: 404, headers: { 'Content-Type': 'application/json' },
          });
        }

        pdfHeaders.set('Content-Disposition', `attachment; filename="${resource}"`);
        return new Response(pdfBody, { status: 200, headers: pdfHeaders });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'Internal error' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ─── API: Get service details ───
    if (url.pathname === '/api/service' && request.method === 'GET') {
      const slug = url.searchParams.get('slug');
      if (!slug || !env.DB) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      const svc = await env.DB.prepare(
        'SELECT slug, name, price FROM services WHERE slug = ? AND active = 1'
      ).bind(slug).first();
      if (!svc) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(svc), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ─── API: Validate coupon ───
    if (url.pathname === '/api/validate-coupon' && request.method === 'POST') {
      try {
        const { code, service, price } = await request.json();
        if (!code || !price) {
          return new Response(JSON.stringify({ valid: false, error: 'Missing fields' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }

        // Fetch real price from D1 so client can't fake it
        let actualPrice = price;
        if (env.DB && service) {
          const svc = await env.DB.prepare(
            'SELECT price FROM services WHERE slug = ? AND active = 1'
          ).bind(service).first();
          if (svc) actualPrice = svc.price;
        }

        if (env.DB) {
          const coupon = await env.DB.prepare(
            "SELECT * FROM coupons WHERE code = ? AND active = 1 AND (max_uses = 0 OR used < max_uses) AND (service = '' OR service = ?)"
          ).bind(code.toUpperCase().trim(), service || '').first();

          if (coupon) {
            const discounted = Math.round(actualPrice * (100 - coupon.discount_percent) / 100);
            return new Response(JSON.stringify({
              valid: true,
              originalPrice: actualPrice,
              discountedPrice: discounted,
              discountPercent: coupon.discount_percent,
            }), { headers: { 'Content-Type': 'application/json' } });
          }
        }

        return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired coupon' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Internal error' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ─── API: Verify payment & confirm booking ───
    if (url.pathname === '/api/verify-payment' && request.method === 'POST') {
      try {
        const { orderId, paymentId, signature } = await request.json();
        if (!orderId || !paymentId) {
          return new Response(JSON.stringify({ verified: false, error: 'Missing details' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }

        // Verify payment with Razorpay
        const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
        const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': `Basic ${auth}` },
        });
        const payment = await rzpRes.json();

        if (!payment || payment.status !== 'captured') {
          return new Response(JSON.stringify({ verified: false, error: 'Payment not captured' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (payment.order_id !== orderId) {
          return new Response(JSON.stringify({ verified: false, error: 'Order mismatch' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        let meetLink = `https://meet.google.com/axa-gbem-pgj`;
        if (env.DB) {
          const booking = await env.DB.prepare(
            "SELECT * FROM contacts WHERE order_id = ? AND status = 'pending'"
          ).bind(orderId).first();

          if (booking) {
            if (env.GOOGLE_SERVICE_ACCOUNT_KEY) {
              try { meetLink = await createGoogleMeet(booking, env); } catch (e) { console.log('Meet failed:', e.message); }
            }

            await env.DB.prepare(
              "UPDATE contacts SET status = ?, payment_id = ?, meet_link = ? WHERE order_id = ? AND status = 'pending'"
            ).bind('confirmed', paymentId, meetLink, orderId).run();

            if (env.RESEND_API_KEY) {
              await sendConfirmationEmail(booking, meetLink, env);
              const answers = safeJsonParse(booking.answers_json);
              await notifyAdmin(env, 'booking', {
                service_name: booking.service_name,
                name: booking.name,
                email: booking.email,
                date: booking.date,
                time: booking.time,
                price: booking.price,
                coupon_code: booking.coupon_code || '',
                order_id: booking.order_id,
                payment_id: paymentId,
                about: answers.about || '',
                experience: answers.experience || '',
                company: answers.company || '',
              });
            }
          }
        }

        return new Response(JSON.stringify({ verified: true, meetLink: meetLink || '' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ verified: false, error: e.message }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ─── API: Create Razorpay order ───
    if (url.pathname === '/api/create-order' && request.method === 'POST') {
      try {
        const { service, serviceName, price, originalPrice, date, time, name, email, phone, couponCode, answersJson } = await request.json();
        if (!service || !date || !time || !name || !email) {
          return new Response(JSON.stringify({ error: 'required fields missing' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          });
        }

        // Fetch real price from D1 — client price is display-only, never trusted
        let actualPrice = price;
        if (env.DB) {
          const svc = await env.DB.prepare(
            'SELECT price FROM services WHERE slug = ? AND active = 1'
          ).bind(service).first();
          if (!svc) {
            return new Response(JSON.stringify({ error: 'invalid service' }), {
              status: 400, headers: { 'Content-Type': 'application/json' },
            });
          }
          actualPrice = svc.price;
        }

        // Validate coupon if provided and increment usage
        if (couponCode && env.DB) {
          const coupon = await env.DB.prepare(
            "SELECT * FROM coupons WHERE code = ? AND active = 1 AND (max_uses = 0 OR used < max_uses) AND (service = '' OR service = ?)"
          ).bind(couponCode.toUpperCase().trim(), service).first();

          if (coupon) {
            actualPrice = Math.round(actualPrice * (100 - coupon.discount_percent) / 100);
            const result = await env.DB.prepare(
              "UPDATE coupons SET used = used + 1 WHERE id = ? AND active = 1 AND (max_uses = 0 OR used < max_uses)"
            ).bind(coupon.id).run();
            if (result.meta.changes === 0) {
              return new Response(JSON.stringify({ error: 'Coupon no longer available' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
              });
            }
          }
        }

        // Create Razorpay order
        const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: actualPrice * 100,
            currency: 'INR',
            receipt: `${service}-${Date.now()}`,
            notes: { service, serviceName, date, time, name, email, phone, couponCode: couponCode || '' },
          }),
        });

        const order = await rzpRes.json();
        if (!order.id) {
          return new Response(JSON.stringify({ error: 'order creation failed' }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          });
        }

        // Store pending booking
        if (env.DB) {
          await env.DB.prepare(
            `INSERT INTO contacts (order_id, service, service_name, price, date, time, name, email, phone, answers_json, coupon_code, source, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
          ).bind(order.id, service, serviceName, actualPrice, date, time, name, email, phone || '', answersJson || '', couponCode || '', 'courses', Date.now()).run();
        }

        return new Response(JSON.stringify({ orderId: order.id }), {
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'Internal error' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ─── API: Razorpay payment webhook ───
    if (url.pathname === '/api/payment-webhook' && request.method === 'POST') {
      try {
        const body = await request.json();

        // Verify webhook signature
        const signature = request.headers.get('x-razorpay-signature');
        const isValid = await verifyRazorpaySignature(body, signature, env.RAZORPAY_WEBHOOK_SECRET);
        if (!isValid) {
          return new Response('invalid signature', { status: 403 });
        }

        const event = body.event;
        const payment = body.payload?.payment?.entity;
        const orderId = payment?.order_id;
        const paymentId = payment?.id;

        if (!orderId || !env.DB) return new Response('ok');

        if (event === 'payment.captured') {
          const booking = await env.DB.prepare(
            'SELECT * FROM contacts WHERE order_id = ?'
          ).bind(orderId).first();

          if (booking) {
            let meetLink = `https://meet.google.com/axa-gbem-pgj`;
            if (env.GOOGLE_SERVICE_ACCOUNT_KEY) {
              try {
                meetLink = await createGoogleMeet(booking, env);
              } catch (e) {
                console.log('Meet creation failed:', e.message);
              }
            }

            await env.DB.prepare(
              'UPDATE contacts SET status = ?, payment_id = ?, meet_link = ? WHERE order_id = ?'
            ).bind('confirmed', paymentId, meetLink, orderId).run();

            if (env.RESEND_API_KEY) {
              await sendConfirmationEmail(booking, meetLink, env);
            }
          }
        } else if (event === 'payment.failed') {
          await env.DB.prepare(
            "UPDATE contacts SET status = ?, payment_id = ? WHERE order_id = ? AND status = 'pending'"
          ).bind('failed', paymentId, orderId).run();

        } else if (event === 'refund.created' || event === 'refund.processed') {
          await env.DB.prepare(
            "UPDATE contacts SET status = ?, payment_id = ? WHERE order_id = ? AND status = 'confirmed'"
          ).bind('refunded', paymentId, orderId).run();
        } else if (event === 'refund.failed') {
          // Refund didn't go through — booking stays confirmed, nothing to do
        }

        return new Response('ok');

      } catch (e) {
        console.log('Webhook error:', e.message);
        return new Response('error', { status: 400 });
      }
    }

    // ─── API: Get booking status ───
    if (url.pathname === '/api/booking' && request.method === 'GET') {
      const orderId = url.searchParams.get('orderId');
      if (!orderId || !env.DB) {
        return new Response(JSON.stringify({ status: 'unknown' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const booking = await env.DB.prepare(
        'SELECT status, meet_link, service_name, date, time FROM contacts WHERE order_id = ?'
      ).bind(orderId).first();

      return new Response(JSON.stringify(booking || { status: 'not_found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ─── API: Get booked slots for a date ───
    if (url.pathname === '/api/booked-slots' && request.method === 'GET') {
      const date = url.searchParams.get('date');
      if (!date || !env.DB) {
        return new Response(JSON.stringify({ slots: [] }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const rows = await env.DB.prepare(
        "SELECT time FROM contacts WHERE date = ? AND status = 'confirmed'"
      ).bind(date).all();
      const slots = (rows.results || []).map(r => r.time);
      return new Response(JSON.stringify({ slots }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Block direct PDF access
    if (url.pathname.startsWith('/resources/') && url.pathname.endsWith('.pdf')) {
      const filename = url.pathname.split('/').pop();
      return Response.redirect(`${url.origin}/resources/download/?r=${filename}`, 302);
    }

    // Serve static
    return env.ASSETS.fetch(request);
  },
};

// ─── Helpers ───

async function verifyRazorpaySignature(body, signature, secret) {
  if (!secret || !signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const signedPayload = body.payload ? JSON.stringify(body.payload) : JSON.stringify(body);
  return crypto.subtle.verify(
    'HMAC', key,
    hexToBytes(signature),
    encoder.encode(signedPayload)
  );
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function createGoogleMeet(booking, env) {
  const key = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const token = await getGoogleAccessToken(key);

  const startTime = parseDateTime(booking.date, booking.time);
  const endTime = new Date(startTime.getTime() + 55 * 60000);

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: `1:1 — ${booking.service_name} with ${booking.name}`,
      description: `Session: ${booking.service_name}\nName: ${booking.name}\nEmail: ${booking.email}\nPhone: ${booking.phone || 'N/A'}`,
      start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Kolkata' },
      end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Kolkata' },
      conferenceData: {
        createRequest: { requestId: `booking-${booking.order_id}`, conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
    }),
  });

  const event = await res.json();
  return event.conferenceData?.entryPoints?.[0]?.uri || '';
}

async function getGoogleAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const jwt = await signJWT(header, claim, key.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  return data.access_token;
}

async function signJWT(header, payload, privateKey) {
  const encoder = new TextEncoder();
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(toSign)
  );

  return `${toSign}.${b64urlRaw(signature)}`;
}

function b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlRaw(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function parseDateTime(date, timeSlot) {
  const hour = parseInt(timeSlot.split(':')[0]);
  const isPM = timeSlot.includes('PM') && hour !== 12;
  const isAM = timeSlot.includes('AM') && hour === 12;
  const h = isPM ? hour + 12 : isAM ? 0 : hour;
  const d = new Date(date + 'T00:00:00+05:30');
  d.setHours(h, 0, 0, 0);
  return d;
}

function safeJsonParse(str) {
  try { return JSON.parse(str || '{}'); } catch { return {}; }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function generateICS(booking, meetLink) {
  const start = parseDateTime(booking.date, booking.time);
  const end = new Date(start.getTime() + 55 * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Akarshan Arora//Courses//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:1:1 — ${booking.service_name} with ${booking.name}`,
    `DESCRIPTION:Session: ${booking.service_name}\\nName: ${booking.name}\\nEmail: ${booking.email}\\nPhone: ${booking.phone || 'N/A'}\\nMeet: ${meetLink}`,
    `LOCATION:${meetLink}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
}

function btoaSafe(str) {
  // btoa only handles Latin1 — encode Unicode safely
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function emailShell(content) {
  return `<!DOCTYPE html><html><body style="font-family:'Inter',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a;line-height:1.6;background:#fafaf7">${content}</body></html>`;
}

async function sendConfirmationEmail(booking, meetLink, env) {
  const svc = escapeHtml(booking.service_name);
  const nm = escapeHtml(booking.name);
  const em = escapeHtml(booking.email);
  const ph = escapeHtml(booking.phone || 'N/A');
  const dt = escapeHtml(booking.date);
  const tm = escapeHtml(booking.time);
  const ml = escapeHtml(meetLink);

  const html = emailShell(`
    <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e0">
      <div style="font-size:32px;margin-bottom:12px">&#x1F44B;</div>
      <h2 style="font-weight:800;font-size:22px;margin:0 0 4px">Booking Confirmed</h2>
      <p style="color:#6b6b66;margin:0 0 24px;font-size:15px">${svc}</p>

      <div style="background:#fdf8f5;border:1px solid #f0d6c2;border-radius:10px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a1a1a">${dt} at ${tm} IST</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b6b66;font-size:14px;width:80px">Duration</td><td style="padding:6px 0;font-size:14px;font-weight:600">55 minutes</td></tr>
          ${meetLink ? `<tr><td style="padding:6px 0;color:#6b6b66;font-size:14px">Meet link</td><td style="padding:6px 0;font-size:14px"><a href="${ml}" style="color:#C45D2C;font-weight:600;text-decoration:none">Join Call &rarr;</a></td></tr>` : ''}
        </table>
      </div>

      <p style="font-size:14px;color:#6b6b66;margin:0 0 20px">Hi <strong style="color:#1a1a1a">${nm}</strong> — looking forward to our session. A calendar invite is attached. Reply to this email if you need to reschedule.</p>

      <hr style="border:none;border-top:1px solid #e5e5e0;margin:0 0 16px">
      <p style="font-size:13px;color:#a3a39e;margin:0">— Akarshan Arora</p>
    </div>
  `);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Akarshan Arora <booking@akarshanarora.com>',
      to: [booking.email],
      subject: `Confirmed: ${booking.service_name} on ${booking.date}`,
      html,
      attachments: [{
        filename: 'session.ics',
        content: btoaSafe(generateICS(booking, meetLink)),
        content_type: 'text/calendar; charset=utf-8; method=REQUEST',
      }],
    }),
  });
}

async function notifyAdmin(env, type, data) {
  // Escape all user-supplied values for HTML context
  const d = {};
  for (const [k, v] of Object.entries(data)) {
    d[k] = escapeHtml(v);
  }

  let html;
  if (type === 'booking') {
    html = emailShell(`
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e0">
        <div style="background:#C45D2C;color:#fff;border-radius:8px;padding:4px 12px;display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px">New Booking</div>

        <h2 style="font-weight:800;font-size:20px;margin:0 0 2px">${d.service_name}</h2>
        <p style="color:#C45D2C;font-size:15px;font-weight:700;margin:0 0 20px">${d.date} at ${d.time} &middot; &#8377;${d.price}</p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:7px 0;color:#6b6b66;font-size:14px;width:90px">Name</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.name}</td></tr>
          <tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Email</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.email}</td></tr>
          <tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Phone</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.phone || '—'}</td></tr>
          ${d.company ? `<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Company</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.company}</td></tr>` : ''}
          ${d.experience ? `<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Experience</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.experience}</td></tr>` : ''}
          ${d.coupon_code ? `<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Coupon</td><td style="padding:7px 0;font-size:14px;font-weight:600;color:#3A5A40">${d.coupon_code}</td></tr>` : ''}
        </table>

        ${d.about ? `<div style="background:#f8f8f5;border-radius:8px;padding:14px 16px;margin-bottom:16px"><p style="margin:0;color:#6b6b66;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Call about</p><p style="margin:0;font-size:14px;font-weight:500;line-height:1.5">${d.about}</p></div>` : ''}

        <div style="background:#f8f8f5;border-radius:8px;padding:12px 16px;margin-bottom:4px">
          <p style="margin:0;color:#6b6b66;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Payment</p>
          <p style="margin:0;font-size:12px;font-family:monospace">${d.order_id}${d.payment_id ? ' &middot; ' + d.payment_id : ''}</p>
        </div>
      </div>
    `);
  } else {
    html = emailShell(`
      <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e0">
        <div style="background:#3A5A40;color:#fff;border-radius:8px;padding:4px 12px;display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px">New Download</div>
        <h2 style="font-weight:800;font-size:20px;margin:0 0 16px">${d.resource}</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:7px 0;color:#6b6b66;font-size:14px;width:70px">Name</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.name}</td></tr>
          <tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Email</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.email}</td></tr>
          ${d.phone ? `<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Phone</td><td style="padding:7px 0;font-size:14px;font-weight:600">${d.phone}</td></tr>` : ''}
        </table>
      </div>
    `);
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Courses <booking@akarshanarora.com>',
      to: [env.ADMIN_EMAIL],
      subject: type === 'booking' ? `Booking: ${data.service_name} — ${data.name}` : `Download: ${data.resource} — ${data.name}`,
      html,
      ...(type === 'booking' ? {
        attachments: [{
          filename: `${data.service_name}-${data.date}.ics`,
          content: btoaSafe(generateICS({
            service_name: data.service_name,
            name: data.name,
            email: data.email,
            phone: '',
            date: data.date,
            time: data.time,
          }, `https://meet.jit.si/akarshan-session`)),
          content_type: 'text/calendar; charset=utf-8; method=REQUEST',
        }],
      } : {}),
    }),
  });
}
