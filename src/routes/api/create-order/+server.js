const MEET_LINK = 'https://meet.google.com/axa-gbem-pgj';

export async function POST({ platform, request }) {
  try {
    const { service, serviceName, price, date, time, name, email, phone, couponCode, answersJson } = await request.json();
    if (!service || !date || !time || !name || !email) return new Response(JSON.stringify({ error: 'required fields missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const env = platform?.env;
    if (!env?.DB) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    const existing = await env.DB.prepare("SELECT id FROM contacts WHERE date = ? AND time = ? AND status = 'confirmed'").bind(date, time).first();
    if (existing) return new Response(JSON.stringify({ error: 'This time slot is already booked.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });

    const svc = await env.DB.prepare('SELECT price FROM services WHERE slug = ? AND active = 1').bind(service).first();
    if (!svc) return new Response(JSON.stringify({ error: 'invalid service' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    let actualPrice = svc.price;

    if (couponCode) {
      const coupon = await env.DB.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1 AND (max_uses = 0 OR used < max_uses) AND (service = '' OR service = ?)").bind(couponCode.toUpperCase().trim(), service).first();
      if (coupon) {
        actualPrice = Math.round(actualPrice * (100 - coupon.discount_percent) / 100);
        await env.DB.prepare("UPDATE coupons SET used = used + 1 WHERE id = ? AND active = 1 AND (max_uses = 0 OR used < max_uses)").bind(coupon.id).run();
      }
    }

    if (actualPrice === 0) {
      const orderId = 'free-' + service + '-' + Date.now();
      await env.DB.prepare("INSERT INTO contacts (order_id, service, service_name, price, date, time, name, email, phone, answers_json, coupon_code, source, status, created_at, meet_link, payment_id) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 'courses', 'confirmed', ?, ?, 'free')").bind(orderId, service, serviceName, date, time, name, email, phone || '', answersJson || '', couponCode || '', Date.now(), MEET_LINK).run();
      return new Response(JSON.stringify({ free: true, orderId, meetLink: MEET_LINK }), { headers: { 'Content-Type': 'application/json' } });
    }

    const auth = btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET);
    const order = await (await fetch('https://api.razorpay.com/v1/orders', { method:'POST', headers:{ Authorization:'Basic '+auth, 'Content-Type':'application/json' }, body: JSON.stringify({ amount:actualPrice*100, currency:'INR', receipt:service+'-'+Date.now(), notes:{ service, serviceName, date, time, name, email, phone, couponCode:couponCode||'' } }) })).json();
    if (!order.id) return new Response(JSON.stringify({ error: 'order creation failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    await env.DB.prepare("INSERT INTO contacts (order_id, service, service_name, price, date, time, name, email, phone, answers_json, coupon_code, source, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)").bind(order.id, service, serviceName, actualPrice, date, time, name, email, phone || '', answersJson || '', couponCode || '', 'courses', Date.now()).run();
    return new Response(JSON.stringify({ orderId: order.id }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
}
