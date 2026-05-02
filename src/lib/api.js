import { Hono } from 'hono';
import { orderSchema, couponSchema, verifySchema, validate } from '$lib/schema.js';
import { createOrder, verifyPayment } from '$lib/core/orders.js';
import { listProducts, getProduct, listAvailability, getBookedSlots } from '$lib/core/products.js';

const api = new Hono();

// ═══ Admin Auth ═══

async function signToken(secret) {
  const exp = String(Date.now() + 86400000); // 24h
  const data = new TextEncoder().encode(exp);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const hex = Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
  return btoa(exp) + '.' + btoa(hex);
}

async function verifyToken(token, secret) {
  try {
    const [expB64, hexB64] = token.split('.');
    const exp = atob(expB64), hex = atob(hexB64);
    if (parseInt(exp) < Date.now()) return false;
    const sig = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(exp));
  } catch { return false; }
}

api.post('/admin/login', async (c) => {
  const { password } = await c.req.json();
  if (!c.env.ADMIN_PASSWORD || password !== c.env.ADMIN_PASSWORD) return c.json({ error: 'Invalid password' }, 401);
  const token = await signToken(c.env.ADMIN_PASSWORD);
  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'admin_token=' + token + '; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly' },
  });
});

api.use('/admin/api/*', async (c, next) => {
  const auth = c.req.header('Authorization') || '';
  const cookieHeader = c.req.header('Cookie') || '';
  const cookieToken = (cookieHeader.match(/admin_token=([^;]+)/) || [])[1];
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : (cookieToken || '');
  if (!token || !(await verifyToken(token, c.env.ADMIN_PASSWORD))) return c.json({ error: 'Unauthorized' }, 401);
  return next();
});

function uid() { return crypto.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2); }
function computeEndTime(time, mins) {
  const [t, ap] = time.split(' ');
  let [h, m] = (t||'0:00').split(':').map(Number);
  if (ap==='PM'&&h!==12) h+=12; if (ap==='AM'&&h===12) h=0;
  const total = h*60+m+mins, nh=Math.floor(total/60)%24, nm=total%60;
  const napm = nh>=12?'PM':'AM', nh12 = nh>12?nh-12:(nh===0?12:nh);
  return nh12+':'+String(nm).padStart(2,'0')+' '+napm;
}

// ═══ Public APIs ═══

api.get('/api/services', async (c) => c.json(await listProducts(c.env)));
api.get('/api/service', async (c) => { const p = await getProduct(c.req.query('slug'), c.env); return p ? c.json(p) : c.json({error:'Not found'},404); });
api.get('/api/availability', async (c) => c.json(await listAvailability(c.req.query('product_slug'), c.env)));
api.get('/api/booked-slots', async (c) => c.json({slots: await getBookedSlots(c.req.query('date'), c.env)}));

api.post('/api/validate-coupon', async (c) => {
  const { code, product_slug, price } = await c.req.json();
  if (!code||!price) return c.json({valid:false,error:'Missing fields'},400);
  const DB = c.env.DB;
  if (!DB) return c.json({valid:false,error:'Invalid coupon'});

  let actualPrice = price;
  if (product_slug) {
    const prod = await DB.prepare('SELECT price FROM products WHERE slug=? AND active=1').bind(product_slug).first();
    if (prod) actualPrice = prod.price;
  }
  const cp = await DB.prepare("SELECT * FROM coupons WHERE code=? AND active=1 AND (max_uses=0 OR used<max_uses) AND (product_slug='' OR product_slug=?)").bind(code.toUpperCase().trim(), product_slug||'').first();
  if (!cp) return c.json({valid:false,error:'Invalid or expired coupon'});
  const discounted = Math.round(actualPrice*(100-cp.discount_percent)/100);
  return c.json({valid:true,originalPrice:actualPrice,discountedPrice:discounted,discountPercent:cp.discount_percent});
});

api.post('/api/create-order', async (c) => {
  const body = await c.req.json();
  const v = validate(orderSchema, body);
  if (!v.valid) return c.json({error:v.error},400);
  const result = await createOrder(v.data, c.env);
  if (result.file) return new Response(result.file.body, {status:200, headers: result.file.headers});
  if (result.error) return c.json({error:result.error}, result.status||500);
  return c.json(result);
});

api.post('/api/verify-payment', async (c) => {
  const { orderId, paymentId } = await c.req.json();
  if (!orderId||!paymentId) return c.json({verified:false,error:'Missing details'},400);
  const env = c.env;
  const auth = btoa(env.RAZORPAY_KEY_ID+':'+env.RAZORPAY_KEY_SECRET);
  const p = await(await fetch('https://api.razorpay.com/v1/payments/'+paymentId,{headers:{Authorization:'Basic '+auth}})).json();
  if (!p||p.status!=='captured') return c.json({verified:false,error:'Payment not captured'});
  if (p.order_id!==orderId) return c.json({verified:false,error:'Order mismatch'});

  if (!env.DB) return c.json({verified:true,meetLink:MEET_LINK});
  const booking = await env.DB.prepare("SELECT * FROM contacts WHERE payment_id=? AND status='pending'").bind(orderId).first();
  if (!booking) return c.json({verified:true,meetLink:MEET_LINK});

  await env.DB.prepare("UPDATE contacts SET status='confirmed' WHERE payment_id=? AND status='pending'").bind(orderId).run();
  if (env.RESEND_API_KEY) {
    await sendConfirmationEmail(booking,prod.meet_link||MEET_LINK,env);
    const a=safeJsonParse(booking.answers_json);
    await notifyAdmin(env,'booking',{service_name:booking.product_name,name:booking.name,email:booking.email,date:booking.date,time:booking.time,price:booking.price,meet_link:MEET_LINK,coupon_code:booking.coupon_code||'',order_id:booking.purchase_id,payment_id:paymentId,about:a.about||'',experience:a.experience||'',company:a.company||''});
  }
  return c.json({verified:true,meetLink:MEET_LINK});
});

api.post('/api/payment-webhook', async (c) => {
  const env = c.env;
  const body = await c.req.json();
  if (env.RAZORPAY_WEBHOOK_SECRET) {
    const sig = c.req.header('x-razorpay-signature');
    if (sig) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw',enc.encode(env.RAZORPAY_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
      const h2b=(h)=>{const b=new Uint8Array(h.length/2);for(let i=0;i<h.length;i+=2)b[i/2]=parseInt(h.substring(i,i+2),16);return b};
      const signed = body.payload?JSON.stringify(body.payload):JSON.stringify(body);
      if (!await crypto.subtle.verify('HMAC',key,h2b(sig),enc.encode(signed))) return new Response('invalid signature',{status:403});
    }
  }
  // Payment link events come via payment_link.entity, order events via payment.entity
  const pl = body.payload?.payment_link?.entity || body.payload?.payment?.entity;
  const linkId = pl?.id, paymentId = body.payload?.payment?.entity?.id;
  const notes = pl?.notes || pl?.notes_json ? (typeof pl?.notes==='string'?JSON.parse(pl.notes):pl?.notes) : {};
  const purchaseId = notes?.purchase_id;

  if (!env.DB) return new Response('ok');

  if (body.event==='payment.captured'||body.event==='payment_link.paid') {
    if (linkId) {
      const booking = await env.DB.prepare('SELECT * FROM contacts WHERE payment_id=?').bind(linkId).first();
      if (booking) { await env.DB.prepare("UPDATE contacts SET status='confirmed',payment_id=? WHERE payment_id=?").bind(linkId,linkId).run(); if (env.RESEND_API_KEY) { const { sendConfirmationEmail } = await import('$lib/email.js'); await sendConfirmationEmail(booking,MEET_LINK,env); } }
    } else if (paymentId) {
      const booking = await env.DB.prepare("SELECT * FROM contacts WHERE payment_id=? AND status='pending'").bind(paymentId).first();
      if (booking) { await env.DB.prepare("UPDATE contacts SET status='confirmed' WHERE payment_id=?").bind(paymentId).run(); if (env.RESEND_API_KEY) { const { sendConfirmationEmail } = await import('$lib/email.js'); await sendConfirmationEmail(booking,MEET_LINK,env); } }
    }
  } else if (body.event==='payment.failed'||body.event==='payment_link.cancelled') {
    if (linkId) await env.DB.prepare("UPDATE contacts SET status='failed' WHERE payment_id=? AND status='pending'").bind(linkId).run();
  } else if (body.event==='refund.created'||body.event==='refund.processed') {
    if (linkId) await env.DB.prepare("UPDATE contacts SET status='refunded' WHERE payment_id=? AND status='confirmed'").bind(linkId).run();
  }
  return new Response('ok');
});

api.get('/api/booking', async (c) => {
  const id = c.req.query('orderId')||c.req.query('purchaseId');
  if (!id||!c.env.DB) return c.json({status:'unknown'});
  const b = await c.env.DB.prepare('SELECT status,meet_link,product_name,date,time FROM contacts WHERE purchase_id=? OR payment_id=?').bind(id,id).first();
  return c.json(b||{status:'not_found'});
});

// ═══ Admin APIs ═══

api.get('/admin/api/contacts', async (c) => {
  if (!c.env.DB) return c.json([]);
  const rows = await c.env.DB.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 50').all();
  return c.json(rows.results||[]);
});

api.get('/admin/api/products', async (c) => {
  if (!c.env.DB) return c.json([]);
  const rows = await c.env.DB.prepare('SELECT * FROM products ORDER BY kind,price').all();
  return c.json(rows.results||[]);
});

api.post('/admin/api/product', async (c) => {
  const body = await c.req.json();
  await c.env.DB.prepare('INSERT OR REPLACE INTO products (slug,name,kind,price,pricing,min_price,discount_percent,duration_minutes,file,meet_link,description,questions,config,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)').bind(body.slug,body.name,body.kind,body.price||0,body.pricing||'fixed',body.min_price||0,body.discount_percent||0,body.duration_minutes||55,body.file||'',body.meet_link||'',body.description||'',body.questions||'[]',body.config||'{}').run();
  return c.json({ok:true});
});

api.delete('/admin/api/product', async (c) => {
  const { slug } = await c.req.json();
  await c.env.DB.prepare('UPDATE products SET active=0 WHERE slug=?').bind(slug).run();
  return c.json({ok:true});
});

api.get('/admin/api/availability', async (c) => {
  if (!c.env.DB) return c.json([]);
  const rows = await c.env.DB.prepare('SELECT * FROM availability WHERE active=1 ORDER BY group_name,product_slug,day_of_week').all();
  return c.json(rows.results||[]);
});

api.post('/admin/api/availability', async (c) => {
  const { group_name, product_slug, day_of_week, start_time, end_time } = await c.req.json();
  await c.env.DB.prepare('INSERT OR REPLACE INTO availability (group_name,product_slug,day_of_week,start_time,end_time,active) VALUES (?,?,?,?,?,1)').bind(group_name||'Default',product_slug||null,day_of_week,start_time,end_time).run();
  return c.json({ok:true});
});

api.delete('/admin/api/availability', async (c) => {
  const { id } = await c.req.json();
  await c.env.DB.prepare('DELETE FROM availability WHERE id=?').bind(id).run();
  return c.json({ok:true});
});

api.get('/admin/api/coupons', async (c) => {
  if (!c.env.DB) return c.json([]);
  const rows = await c.env.DB.prepare('SELECT * FROM coupons WHERE active=1 ORDER BY code').all();
  return c.json(rows.results||[]);
});

api.post('/admin/api/coupon', async (c) => {
  const { code, discount_percent, product_slug, max_uses } = await c.req.json();
  await c.env.DB.prepare('INSERT OR REPLACE INTO coupons (code,discount_percent,product_slug,max_uses,active) VALUES (?,?,?,?,1)').bind(code.toUpperCase(),discount_percent,product_slug||'',max_uses||0).run();
  return c.json({ok:true});
});

api.delete('/admin/api/coupon', async (c) => {
  const { code } = await c.req.json();
  await c.env.DB.prepare('UPDATE coupons SET active=0 WHERE code=?').bind(code).run();
  return c.json({ok:true});
});

api.post('/admin/api/update-status', async (c) => {
  const { id, status } = await c.req.json();
  await c.env.DB.prepare('UPDATE contacts SET status=? WHERE id=?').bind(status,id).run();
  return c.json({ok:true});
});

api.post('/admin/api/refund', async (c) => {
  const { id } = await c.req.json();
  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id=?').bind(id).first();
  if (!contact || !contact.payment_id || contact.payment_id === 'free') return c.json({error:'No payment to refund'},400);
  const auth = btoa(c.env.RAZORPAY_KEY_ID+':'+c.env.RAZORPAY_KEY_SECRET);
  const rzp = await(await fetch('https://api.razorpay.com/v1/payments/'+contact.payment_id+'/refund',{method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/json'},body:JSON.stringify({})})).json();
  if (rzp.id) {
    await c.env.DB.prepare("UPDATE contacts SET status='refunded' WHERE id=?").bind(id).run();
    return c.json({ok:true,refundId:rzp.id});
  }
  return c.json({error:rzp.error?.description||'Refund failed'},400);
});

export { api };
