import { Hono } from 'hono'
import { logError, verifyRazorpaySignature, safeJsonParse } from './src/lib/utils.js'
import { sendConfirmationEmail, notifyAdmin } from './src/lib/email.js'
import { ADMIN_HTML } from './src/lib/admin.js'

const MEET_LINK = 'https://meet.google.com/axa-gbem-pgj'
const app = new Hono()

// ═══ Public APIs ═══

app.post('/api/download', async (c) => {
  const { name, email, phone, resource } = await c.req.json()
  if (!name || !email || !resource) return c.json({ error: 'required fields missing' }, 400)
  if (resource.includes('..') || resource.includes('/') || resource.includes('\\')) return c.json({ error: 'invalid resource' }, 400)

  const env = c.env
  if (env.DB) await env.DB.prepare(
    'INSERT INTO contacts (name, email, phone, resource, source, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(name, email, phone || '', resource, 'courses', 'downloaded', Date.now()).run()

  if (env.RESEND_API_KEY) notifyAdmin(env, 'download', { name, email, phone: phone || '', resource })

  let body, headers
  if (env.RESOURCES) {
    const obj = await env.RESOURCES.get(resource)
    if (obj) { body = obj.body; headers = new Headers(); headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/pdf'); obj.writeHttpMetadata(headers) }
  }
  if (!body) {
    const r = await env.ASSETS.fetch(new Request(new URL('/resources/' + resource, c.req.url)))
    if (r.status !== 200) return c.json({ error: 'file not found' }, 404)
    body = r.body; headers = new Headers(r.headers)
  }
  headers.set('Content-Disposition', 'attachment; filename="' + resource + '"')
  return new Response(body, { status: 200, headers })
})

app.get('/api/services', async (c) => {
  if (!c.env.DB) return c.json([])
  const rows = await c.env.DB.prepare('SELECT slug, name, price FROM services WHERE active = 1 ORDER BY price').all()
  return c.json(rows.results || [])
})

app.get('/api/availability', async (c) => {
  if (!c.env.DB) return c.json([])
  const rows = await c.env.DB.prepare('SELECT day_of_week, start_time, end_time FROM availability').all()
  return c.json(rows.results || [])
})

app.get('/api/service', async (c) => {
  const slug = c.req.query('slug')
  if (!slug || !c.env.DB) return c.json({ error: 'Not found' }, 404)
  const svc = await c.env.DB.prepare('SELECT slug, name, price FROM services WHERE slug = ? AND active = 1').bind(slug).first()
  return svc ? c.json(svc) : c.json({ error: 'Not found' }, 404)
})

app.post('/api/validate-coupon', async (c) => {
  const { code, service, price } = await c.req.json()
  if (!code || !price) return c.json({ valid: false, error: 'Missing fields' }, 400)
  const env = c.env

  let actualPrice = price
  if (env.DB && service) {
    const svc = await env.DB.prepare('SELECT price FROM services WHERE slug = ? AND active = 1').bind(service).first()
    if (svc) actualPrice = svc.price
  }
  if (env.DB) {
    const coupon = await env.DB.prepare(
      "SELECT * FROM coupons WHERE code = ? AND active = 1 AND (max_uses = 0 OR used < max_uses) AND (service = '' OR service = ?)"
    ).bind(code.toUpperCase().trim(), service || '').first()
    if (coupon) {
      const discounted = Math.round(actualPrice * (100 - coupon.discount_percent) / 100)
      return c.json({ valid: true, originalPrice: actualPrice, discountedPrice: discounted, discountPercent: coupon.discount_percent })
    }
  }
  return c.json({ valid: false, error: 'Invalid or expired coupon' })
})

app.post('/api/verify-payment', async (c) => {
  const { orderId, paymentId } = await c.req.json()
  if (!orderId || !paymentId) return c.json({ verified: false, error: 'Missing details' }, 400)

  const env = c.env
  const auth = btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET)
  const p = await (await fetch('https://api.razorpay.com/v1/payments/' + paymentId, { headers: { Authorization: 'Basic ' + auth } })).json()
  if (!p || p.status !== 'captured') return c.json({ verified: false, error: 'Payment not captured' })
  if (p.order_id !== orderId) return c.json({ verified: false, error: 'Order mismatch' })

  if (!env.DB) return c.json({ verified: true, meetLink: MEET_LINK })
  const booking = await env.DB.prepare("SELECT * FROM contacts WHERE order_id = ? AND status = 'pending'").bind(orderId).first()
  if (!booking) return c.json({ verified: true, meetLink: MEET_LINK })

  await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ?, meet_link = ? WHERE order_id = ? AND status = 'pending'")
    .bind('confirmed', paymentId, MEET_LINK, orderId).run()

  if (env.RESEND_API_KEY) {
    await sendConfirmationEmail(booking, MEET_LINK, env)
    const answers = safeJsonParse(booking.answers_json)
    await notifyAdmin(env, 'booking', {
      service_name: booking.service_name, name: booking.name, email: booking.email,
      date: booking.date, time: booking.time, price: booking.price, meet_link: MEET_LINK,
      coupon_code: booking.coupon_code || '', order_id: booking.order_id, payment_id: paymentId,
      about: answers.about || '', experience: answers.experience || '', company: answers.company || '',
    })
  }
  return c.json({ verified: true, meetLink: MEET_LINK })
})

app.post('/api/create-order', async (c) => {
  const { service, serviceName, price, date, time, name, email, phone, couponCode, answersJson } = await c.req.json()
  if (!service || !date || !time || !name || !email) return c.json({ error: 'required fields missing' }, 400)

  const env = c.env
  if (env.DB) {
    const existing = await env.DB.prepare("SELECT id FROM contacts WHERE date = ? AND time = ? AND status = 'confirmed'").bind(date, time).first()
    if (existing) return c.json({ error: 'This time slot is already booked.' }, 409)
  }

  let actualPrice = price
  if (env.DB) {
    const svc = await env.DB.prepare('SELECT price FROM services WHERE slug = ? AND active = 1').bind(service).first()
    if (!svc) return c.json({ error: 'invalid service' }, 400)
    actualPrice = svc.price
  }

  if (couponCode && env.DB) {
    const coupon = await env.DB.prepare(
      "SELECT * FROM coupons WHERE code = ? AND active = 1 AND (max_uses = 0 OR used < max_uses) AND (service = '' OR service = ?)"
    ).bind(couponCode.toUpperCase().trim(), service).first()
    if (coupon) {
      actualPrice = Math.round(actualPrice * (100 - coupon.discount_percent) / 100)
      const r = await env.DB.prepare("UPDATE coupons SET used = used + 1 WHERE id = ? AND active = 1 AND (max_uses = 0 OR used < max_uses)").bind(coupon.id).run()
      if (r.meta.changes === 0) return c.json({ error: 'Coupon no longer available' }, 400)
    }
  }

  // Free booking
  if (actualPrice === 0) {
    const orderId = 'free-' + service + '-' + Date.now()
    if (env.DB) {
      const booking = { order_id: orderId, service, service_name: serviceName, price: 0, date, time, name, email, phone: phone || '', answers_json: answersJson || '', coupon_code: couponCode || '' }
      await env.DB.prepare(
        "INSERT INTO contacts (order_id, service, service_name, price, date, time, name, email, phone, answers_json, coupon_code, source, status, created_at, meet_link, payment_id) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 'courses', 'confirmed', ?, ?, 'free')"
      ).bind(orderId, service, serviceName, date, time, name, email, phone || '', answersJson || '', couponCode || '', Date.now(), MEET_LINK).run()
      if (env.RESEND_API_KEY) {
        try {
          await sendConfirmationEmail(booking, MEET_LINK, env)
          const a = safeJsonParse(answersJson)
          await notifyAdmin(env, 'booking', { service_name: serviceName, name, email, date, time, price: 0, meet_link: MEET_LINK, coupon_code: couponCode || '', order_id: orderId, payment_id: 'free', about: a.about || '', experience: a.experience || '', company: a.company || '' })
        } catch (e) { await logError(env, 'free-booking-email', { orderId }, e) }
      }
    }
    return c.json({ free: true, orderId, meetLink: MEET_LINK })
  }

  // Paid booking
  const auth = btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET)
  const order = await (await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST', headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: actualPrice * 100, currency: 'INR', receipt: service + '-' + Date.now(), notes: { service, serviceName, date, time, name, email, phone, couponCode: couponCode || '' } }),
  })).json()
  if (!order.id) return c.json({ error: 'order creation failed' }, 500)

  if (env.DB) await env.DB.prepare(
    "INSERT INTO contacts (order_id, service, service_name, price, date, time, name, email, phone, answers_json, coupon_code, source, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
  ).bind(order.id, service, serviceName, actualPrice, date, time, name, email, phone || '', answersJson || '', couponCode || '', 'courses', Date.now()).run()

  return c.json({ orderId: order.id })
})

app.post('/api/payment-webhook', async (c) => {
  const body = await c.req.json()
  const env = c.env
  if (!(await verifyRazorpaySignature(body, c.req.header('x-razorpay-signature'), env.RAZORPAY_WEBHOOK_SECRET)))
    return new Response('invalid signature', { status: 403 })

  const p = body.payload?.payment?.entity
  const orderId = p?.order_id, paymentId = p?.id
  if (!orderId || !env.DB) return new Response('ok')

  if (body.event === 'payment.captured') {
    const booking = await env.DB.prepare('SELECT * FROM contacts WHERE order_id = ?').bind(orderId).first()
    if (booking) {
      await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ?, meet_link = ? WHERE order_id = ?").bind('confirmed', paymentId, MEET_LINK, orderId).run()
      if (env.RESEND_API_KEY) await sendConfirmationEmail(booking, MEET_LINK, env)
    }
  } else if (body.event === 'payment.failed') {
    await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ? WHERE order_id = ? AND status = 'pending'").bind('failed', paymentId, orderId).run()
  } else if (body.event === 'refund.created' || body.event === 'refund.processed') {
    await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ? WHERE order_id = ? AND status = 'confirmed'").bind('refunded', paymentId, orderId).run()
  }
  return new Response('ok')
})

app.get('/api/booking', async (c) => {
  const orderId = c.req.query('orderId')
  if (!orderId || !c.env.DB) return c.json({ status: 'unknown' })
  const b = await c.env.DB.prepare('SELECT status, meet_link, service_name, date, time FROM contacts WHERE order_id = ?').bind(orderId).first()
  return c.json(b || { status: 'not_found' })
})

app.get('/api/booked-slots', async (c) => {
  const date = c.req.query('date')
  if (!date || !c.env.DB) return c.json({ slots: [] })
  const rows = await c.env.DB.prepare("SELECT time FROM contacts WHERE date = ? AND status = 'confirmed'").bind(date).all()
  return c.json({ slots: (rows.results || []).map(r => r.time) })
})

// ═══ Admin ═══

app.get('/admin', (c) => c.html(ADMIN_HTML))
app.get('/admin/*', (c) => c.html(ADMIN_HTML))

app.post('/admin/api/services', async (c) => {
  const { slug, name, price } = await c.req.json()
  if (!slug || !name || !price) return c.json({ error: 'Missing fields' }, 400)
  await c.env.DB.prepare('INSERT OR REPLACE INTO services (slug, name, price, active) VALUES (?, ?, ?, 1)').bind(slug, name, price).run()
  return c.json({ ok: true })
})

app.delete('/admin/api/services', async (c) => {
  const { slug } = await c.req.json()
  await c.env.DB.prepare('UPDATE services SET active = 0 WHERE slug = ?').bind(slug).run()
  return c.json({ ok: true })
})

app.post('/admin/api/coupons', async (c) => {
  const { code, discount_percent, service, max_uses } = await c.req.json()
  if (!code || !discount_percent) return c.json({ error: 'Missing fields' }, 400)
  await c.env.DB.prepare('INSERT OR REPLACE INTO coupons (code, discount_percent, service, max_uses, active) VALUES (?, ?, ?, ?, 1)').bind(code.toUpperCase(), discount_percent, service || '', max_uses || 0).run()
  return c.json({ ok: true })
})

app.delete('/admin/api/coupons', async (c) => {
  const { code } = await c.req.json()
  await c.env.DB.prepare('UPDATE coupons SET active = 0 WHERE code = ?').bind(code).run()
  return c.json({ ok: true })
})

app.get('/admin/api/coupons', async (c) => {
  if (!c.env.DB) return c.json([])
  const rows = await c.env.DB.prepare('SELECT * FROM coupons WHERE active = 1 ORDER BY code').all()
  return c.json(rows.results || [])
})

app.post('/admin/api/availability', async (c) => {
  const { day_of_week, start_time, end_time } = await c.req.json()
  await c.env.DB.prepare('INSERT OR REPLACE INTO availability (day_of_week, start_time, end_time) VALUES (?, ?, ?)').bind(day_of_week, start_time, end_time).run()
  return c.json({ ok: true })
})

app.delete('/admin/api/availability', async (c) => {
  const { day_of_week } = await c.req.json()
  await c.env.DB.prepare('DELETE FROM availability WHERE day_of_week = ?').bind(day_of_week).run()
  return c.json({ ok: true })
})

app.get('/admin/api/contacts', async (c) => {
  if (!c.env.DB) return c.json([])
  const rows = await c.env.DB.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 50').all()
  return c.json(rows.results || [])
})

// ═══ Static fallback ═══

app.get('/resources/*', (c) => {
  const path = c.req.path
  if (path.endsWith('.pdf')) return c.redirect('/resources/download/?r=' + path.split('/').pop(), 302)
})

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
