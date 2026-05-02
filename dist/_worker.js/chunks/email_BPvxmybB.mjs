globalThis.process ??= {}; globalThis.process.env ??= {};
function parseDateTime(date, timeSlot) {
  const hour = parseInt(timeSlot.split(':')[0]);
  const isPM = timeSlot.includes('PM') && hour !== 12;
  const isAM = timeSlot.includes('AM') && hour === 12;
  const h = isPM ? hour + 12 : isAM ? 0 : hour;
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d) + (h * 60 - 330) * 60000)
}

function safeJsonParse(str) {
  try { return JSON.parse(str || '{}') } catch { return {} }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

function btoaSafe(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary)
}

function emailShell(content) {
  return '<!DOCTYPE html><html><body style="font-family:\'Inter\',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a;line-height:1.6;background:#fafaf7">'+content+'</body></html>'
}

function generateICS(booking, meetLink) {
  const start = parseDateTime(booking.date, booking.time);
  const end = new Date(start.getTime() + 55 * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Akarshan Arora//Courses//EN',
    'BEGIN:VEVENT',
    'DTSTART:'+fmt(start),'DTEND:'+fmt(end),
    'SUMMARY:1:1 — '+booking.service_name+' with '+booking.name,
    'DESCRIPTION:Session: '+booking.service_name+'\\nName: '+booking.name+'\\nEmail: '+booking.email+'\\nPhone: '+(booking.phone||'N/A')+'\\nMeet: '+meetLink,
    'LOCATION:'+meetLink,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n')
}

const MEET_LINK = 'https://meet.google.com/axa-gbem-pgj';

async function sendConfirmationEmail(booking, meetLink, env) {
  const esc = (s) => escapeHtml(s || '');
  const html = emailShell(
    '<div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e0">'+
    '<div style="font-size:32px;margin-bottom:12px">&#x1F44B;</div>'+
    '<h2 style="font-weight:800;font-size:22px;margin:0 0 4px">Booking Confirmed</h2>'+
    '<p style="color:#6b6b66;margin:0 0 24px;font-size:15px">'+esc(booking.service_name)+'</p>'+
    '<div style="background:#fdf8f5;border:1px solid #f0d6c2;border-radius:10px;padding:20px;margin-bottom:24px">'+
    '<p style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1a1a1a">'+esc(booking.date)+' at '+esc(booking.time)+' IST</p>'+
    '<table style="width:100%;border-collapse:collapse">'+
    '<tr><td style="padding:6px 0;color:#6b6b66;font-size:14px;width:80px">Duration</td><td style="padding:6px 0;font-size:14px;font-weight:600">55 minutes</td></tr>'+
    '<tr><td style="padding:6px 0;color:#6b6b66;font-size:14px">Meet link</td><td style="padding:6px 0;font-size:14px"><a href="'+esc(meetLink)+'" style="color:#C45D2C;font-weight:600;text-decoration:none">Join Call &rarr;</a></td></tr>'+
    '</table></div>'+
    '<p style="font-size:14px;color:#6b6b66;margin:0 0 20px">Hi <strong style="color:#1a1a1a">'+esc(booking.name)+'</strong> — looking forward to our session. A calendar invite is attached. Reply to this email if you need to reschedule.</p>'+
    '<hr style="border:none;border-top:1px solid #e5e5e0;margin:0 0 16px">'+
    '<p style="font-size:13px;color:#a3a39e;margin:0">— Akarshan Arora</p></div>'
  );
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer '+env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Akarshan Arora <booking@akarshanarora.com>', to: [booking.email],
      subject: 'Confirmed: '+booking.service_name+' on '+booking.date, html,
      attachments: [{ filename: 'session.ics', content: btoaSafe(generateICS(booking, meetLink)), content_type: 'text/calendar; charset=utf-8; method=REQUEST' }],
    }),
  });
}

async function notifyAdmin(env, type, data) {
  const d = {};
  for (const [k, v] of Object.entries(data)) d[k] = escapeHtml(v);
  let html, subject;
  {
    subject = 'Booking: '+data.service_name+' — '+data.name;
    html = emailShell(
      '<div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e0">'+
      '<div style="background:#C45D2C;color:#fff;border-radius:8px;padding:4px 12px;display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px">New Booking</div>'+
      '<h2 style="font-weight:800;font-size:20px;margin:0 0 2px">'+d.service_name+'</h2>'+
      '<p style="color:#C45D2C;font-size:15px;font-weight:700;margin:0 0 20px">'+d.date+' at '+d.time+' &middot; &#8377;'+d.price+'</p>'+
      '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">'+
      '<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px;width:90px">Name</td><td style="padding:7px 0;font-size:14px;font-weight:600">'+d.name+'</td></tr>'+
      '<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Email</td><td style="padding:7px 0;font-size:14px;font-weight:600">'+d.email+'</td></tr>'+
      '<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Phone</td><td style="padding:7px 0;font-size:14px;font-weight:600">'+(d.phone||'—')+'</td></tr>'+
      (d.company?'<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Company</td><td style="padding:7px 0;font-size:14px;font-weight:600">'+d.company+'</td></tr>':'')+
      (d.experience?'<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Experience</td><td style="padding:7px 0;font-size:14px;font-weight:600">'+d.experience+'</td></tr>':'')+
      (d.coupon_code?'<tr><td style="padding:7px 0;color:#6b6b66;font-size:14px">Coupon</td><td style="padding:7px 0;font-size:14px;font-weight:600;color:#3A5A40">'+d.coupon_code+'</td></tr>':'')+
      '</table>'+
      (d.about?'<div style="background:#f8f8f5;border-radius:8px;padding:14px 16px;margin-bottom:16px"><p style="margin:0;color:#6b6b66;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Call about</p><p style="margin:0;font-size:14px;font-weight:500;line-height:1.5">'+d.about+'</p></div>':'')+
      '<div style="background:#fdf8f5;border:1px solid #f0d6c2;border-radius:8px;padding:12px 16px;margin-bottom:12px"><p style="margin:0;color:#6b6b66;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Meet link</p><a href="'+d.meet_link+'" style="color:#C45D2C;font-weight:600;font-size:14px;text-decoration:none">Join Call &rarr;</a></div>'+
      '<div style="background:#f8f8f5;border-radius:8px;padding:12px 16px;margin-bottom:4px"><p style="margin:0;color:#6b6b66;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Payment</p><p style="margin:0;font-size:12px;font-family:monospace">'+d.order_id+(d.payment_id?' &middot; '+d.payment_id:'')+'</p></div>'+
      '</div>'
    );
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer '+env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Courses <booking@akarshanarora.com>', to: [env.ADMIN_EMAIL], subject, html,
      ...({ attachments: [{ filename: data.service_name+'-'+data.date+'.ics', content: btoaSafe(generateICS(data, MEET_LINK)), content_type: 'text/calendar; charset=utf-8; method=REQUEST' }] } ),
    }),
  });
}

const email = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  notifyAdmin,
  sendConfirmationEmail
}, Symbol.toStringTag, { value: 'Module' }));

export { safeJsonParse as a, email as e, notifyAdmin as n, sendConfirmationEmail as s };
