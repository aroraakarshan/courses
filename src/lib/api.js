import { Hono } from 'hono';
import { sendConfirmationEmail, notifyAdmin } from '$lib/email.js';
import { safeJsonParse } from '$lib/utils.js';
import { orderSchema, couponSchema, verifySchema, productSchema, availabilitySchema, adminCouponSchema, statusSchema, validate } from '$lib/schema.js';

const MEET_LINK = 'https://meet.google.com/axa-gbem-pgj';
const api = new Hono();

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

api.get('/api/services', async (c) => {
  const DB = c.env.DB;
  if (!DB) return c.json([]);
  const rows = await DB.prepare('SELECT slug, name, kind, price, duration_minutes, description FROM products WHERE active=1 ORDER BY kind, price').all();
  return c.json(rows.results||[]);
});

api.get('/api/service', async (c) => {
  const slug = c.req.query('slug');
  const DB = c.env.DB;
  if (!slug||!DB) return c.json({error:'Not found'},404);
  const p = await DB.prepare('SELECT * FROM products WHERE slug=? AND active=1').bind(slug).first();
  return p ? c.json(p) : c.json({error:'Not found'},404);
});

api.get('/api/availability', async (c) => {
  const DB = c.env.DB;
  if (!DB) return c.json([]);
  const slug = c.req.query('product_slug')||null;
  const rows = await DB.prepare('SELECT * FROM availability WHERE active=1 AND (product_slug=? OR product_slug IS NULL) ORDER BY day_of_week').bind(slug).all();
  return c.json(rows.results||[]);
});

api.get('/api/booked-slots', async (c) => {
  const date = c.req.query('date');
  const DB = c.env.DB;
  if (!date||!DB) return c.json({slots:[]});
  const rows = await DB.prepare("SELECT time, end_time FROM contacts WHERE date=? AND status IN ('pending','confirmed') AND product_kind='call'").bind(date).all();
  return c.json({slots:rows.results||[]});
});

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
  const { product_slug, product_name, price, date, time, name, email, phone, couponCode, answersJson, fileServe } = v.data;
  const env = c.env;
  if (!env.DB) return c.json({error:'DB unavailable'},500);

  const prod = await env.DB.prepare('SELECT * FROM products WHERE slug=? AND active=1').bind(product_slug).first();
  if (!prod) return c.json({error:'invalid product'},400);

  const now = new Date();
  const dateStr = date||now.toISOString().split('T')[0];
  const timeStr = time||now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  const purchaseId = uid();
  const answers = answersJson||'{}';
  const dur = prod.duration_minutes||55;
  const et = time ? computeEndTime(time, dur) : timeStr;

  // RESOURCE
  if (prod.kind==='resource') {
    await env.DB.prepare(
      'INSERT INTO contacts (purchase_id,product_slug,product_name,product_kind,date,time,end_time,duration_minutes,name,email,phone,price,answers_json,status,source,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(purchaseId,prod.slug,prod.name,prod.kind,dateStr,timeStr,et,0,name,email,phone||'',0,answers,'downloaded','courses',Date.now()).run();

    if (env.RESEND_API_KEY) {
      import('$lib/email.js').then(m=>m.notifyAdmin(env,'download',{name,email,phone:phone||'',resource:prod.slug})).catch(()=>{});
      fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:'Akarshan Arora <'+env.ADMIN_EMAIL+'>',to:[email],subject:'Your download: '+prod.name,html:'<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2>Thanks for downloading!</h2><p>Hi '+name+',</p><p><strong>'+prod.name+'</strong> should start automatically.</p><p style="color:#a3a39e;">— Akarshan Arora</p></div>'})}).catch(()=>{});
    }

    if (fileServe&&env.RESOURCES&&prod.file) {
      const obj = await env.RESOURCES.get(prod.file);
      if (obj) { const h=new Headers(); h.set('Content-Type',obj.httpMetadata?.contentType||'application/pdf'); obj.writeHttpMetadata(h); h.set('Content-Disposition','attachment; filename="'+prod.file+'"'); return new Response(obj.body,{status:200,headers:h}); }
    }
    return c.json({ok:true,purchaseId,kind:'resource'});
  }

  // CALL
  if (!date||!time) return c.json({error:'date and time required for calls'},400);

  const overlap = await env.DB.prepare("SELECT id FROM contacts WHERE date=? AND end_time>? AND time<? AND status IN ('pending','confirmed') AND product_kind='call' LIMIT 1").bind(date,time,et).first();
  if (overlap) return c.json({error:'Time slot overlaps with existing booking'},409);

  let actualPrice = prod.price;

  // Pay-what-you-want: validate min_price
  if (prod.pricing==='pwyw') {
    if (price && price < prod.min_price) return c.json({error:'Minimum price is ₹'+prod.min_price},400);
    if (price > 0) actualPrice = price; // user-chosen amount
  }

  // Auto discount from product
  if (prod.discount_percent > 0) {
    actualPrice = Math.round(actualPrice * (100 - prod.discount_percent) / 100);
  }

  // Coupon discount (stacks on top of auto discount)
  if (couponCode) {
    const cp = await env.DB.prepare("SELECT * FROM coupons WHERE code=? AND active=1 AND (max_uses=0 OR used<max_uses) AND (product_slug='' OR product_slug=?)").bind(couponCode.toUpperCase().trim(),prod.slug).first();
    if (cp) { actualPrice=Math.round(actualPrice*(100-cp.discount_percent)/100); await env.DB.prepare("UPDATE coupons SET used=used+1 WHERE id=? AND active=1 AND (max_uses=0 OR used<max_uses)").bind(cp.id).run(); }
  }

  const bookingId = uid();

  if (actualPrice===0) {
    await env.DB.prepare("INSERT INTO contacts (purchase_id,booking_id,product_slug,product_name,product_kind,date,time,end_time,duration_minutes,name,email,phone,price,answers_json,coupon_code,status,source,created_at,meet_link,payment_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,'confirmed','courses',?,?,'free')").bind(purchaseId,bookingId,prod.slug,prod.name,prod.kind,date,time,et,dur,name,email,phone||'',answers,couponCode||'',Date.now(),prod.meet_link||MEET_LINK).run();
    if (env.RESEND_API_KEY) {
      const b={order_id:purchaseId,service_name:prod.name,name,email,phone:phone||'',date,time,price:0,answers_json:answers,coupon_code:couponCode||''};
      try{await sendConfirmationEmail(b,prod.meet_link||MEET_LINK,env);const a=safeJsonParse(answers);await notifyAdmin(env,'booking',{service_name:prod.name,name,email,date,time,price:0,meet_link:prod.meet_link||MEET_LINK,coupon_code:couponCode||'',order_id:purchaseId,payment_id:'free',about:a.about||'',experience:a.experience||'',company:a.company||''});}catch{}
    }
    return c.json({free:true,purchaseId,bookingId,meetLink:prod.meet_link||MEET_LINK});
  }

  // Create Razorpay Payment Link — works in browser, curl, terminal, everywhere
  const auth = btoa(env.RAZORPAY_KEY_ID+':'+env.RAZORPAY_KEY_SECRET);
  const pl = await(await fetch('https://api.razorpay.com/v1/payment_links',{
    method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/json'},
    body:JSON.stringify({
      amount:actualPrice*100,currency:'INR',
      description:prod.name+' on '+date+' at '+time,
      customer:{name,email,contact:phone||undefined},
      notes:{purchase_id:purchaseId,product_slug:prod.slug,date,time},
      callback_url:c.req.url.replace('/api/create-order','')+'/book/confirmed?purchaseId='+purchaseId,
      callback_method:'get'
    })
  })).json();
  if (!pl.id) return c.json({error:'payment link creation failed'},500);

  await env.DB.prepare("INSERT INTO contacts (purchase_id,booking_id,product_slug,product_name,product_kind,date,time,end_time,duration_minutes,name,email,phone,price,answers_json,coupon_code,payment_id,status,source,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','courses',?)").bind(purchaseId,bookingId,prod.slug,prod.name,prod.kind,date,time,et,dur,name,email,phone||'',actualPrice,answers,couponCode||'',pl.id,Date.now()).run();
  return c.json({purchaseId,bookingId,paymentLink:pl.short_url,paymentLinkId:pl.id});
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
  const rows = await c.env.DB.prepare('SELECT * FROM availability ORDER BY product_slug,day_of_week').all();
  return c.json(rows.results||[]);
});

api.post('/admin/api/availability', async (c) => {
  const { product_slug, day_of_week, start_time, end_time } = await c.req.json();
  await c.env.DB.prepare('INSERT OR REPLACE INTO availability (product_slug,day_of_week,start_time,end_time,active) VALUES (?,?,?,?,1)').bind(product_slug||null,day_of_week,start_time,end_time).run();
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

export { api };
