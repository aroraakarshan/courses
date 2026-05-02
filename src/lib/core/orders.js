import { sendConfirmationEmail, notifyAdmin } from '$lib/email.js';
import { safeJsonParse } from '$lib/utils.js';

const MEET_LINK = 'https://meet.google.com/axa-gbem-pgj';

function uid() { return crypto.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2); }
function computeEndTime(time, mins) {
  if (!time || !mins) return time || '';
  const [t, ap] = time.split(' ');
  let [h, m] = (t||'0:00').split(':').map(Number);
  if (ap==='PM'&&h!==12) h+=12; if (ap==='AM'&&h===12) h=0;
  const total = h*60+m+mins, nh=Math.floor(total/60)%24, nm=total%60;
  const napm = nh>=12?'PM':'AM', nh12 = nh>12?nh-12:(nh===0?12:nh);
  return nh12+':'+String(nm).padStart(2,'0')+' '+napm;
}

// ═══ createOrder ═══
// params: { product_slug, name, email, phone?, date?, time?, price?, couponCode?, answersJson?, fileServe? }
// env: { DB, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RESEND_API_KEY, ADMIN_EMAIL, RESOURCES }
export async function createOrder(params, env) {
  const { product_slug, name, email, phone, date, time, price, couponCode, answersJson, fileServe } = params;
  if (!env.DB) return { error: 'DB unavailable', status: 500 };

  const prod = await env.DB.prepare('SELECT * FROM products WHERE slug=? AND active=1').bind(product_slug).first();
  if (!prod) return { error: 'Invalid product', status: 400 };

  const now = new Date();
  const dateStr = date||now.toISOString().split('T')[0];
  const timeStr = time||now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  const purchaseId = uid();
  const answers = answersJson||'{}';
  const dur = prod.duration_minutes||55;
  const et = time ? computeEndTime(time, dur) : timeStr;

  // RESOURCE download
  if (prod.kind==='resource') {
    await env.DB.prepare(
      'INSERT INTO contacts (purchase_id,product_slug,product_name,product_kind,date,time,end_time,duration_minutes,name,email,phone,price,answers_json,status,source,created_at) VALUES (?,?,?,?,?,?,?,0,?,?,?,0,?,\'downloaded\',\'courses\',?)'
    ).bind(purchaseId,prod.slug,prod.name,prod.kind,dateStr,timeStr,et,name,email,phone||'',answers,Date.now()).run();

    if (env.RESEND_API_KEY) {
      import('$lib/email.js').then(m=>m.notifyAdmin(env,'download',{name,email,phone:phone||'',resource:prod.slug})).catch(()=>{});
      fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:'Akarshan Arora <'+env.ADMIN_EMAIL+'>',to:[email],subject:'Download: '+prod.name,html:'<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2>Thanks!</h2><p>Hi '+name+',</p><p><strong>'+prod.name+'</strong> should start automatically.</p><p style="color:#a3a39e;">— Akarshan Arora</p></div>'})}).catch(()=>{});
    }

    if (fileServe&&env.RESOURCES&&prod.file) {
      const obj = await env.RESOURCES.get(prod.file);
      if (obj) { const h=new Headers(); h.set('Content-Type',obj.httpMetadata?.contentType||'application/pdf'); obj.writeHttpMetadata(h); h.set('Content-Disposition','attachment; filename="'+prod.file+'"'); return { file: { body: obj.body, headers: h } }; }
    }
    return { ok: true, purchaseId, kind: 'resource' };
  }

  // CALL booking
  if (!date||!time) return { error: 'Date and time required for calls', status: 400 };

  const expiry = Date.now() - 900000;
  const overlap = await env.DB.prepare("SELECT id FROM contacts WHERE date=? AND end_time>? AND time<? AND product_kind='call' AND (status='confirmed' OR (status='pending' AND created_at>?)) LIMIT 1").bind(date,time,et,expiry).first();
  if (overlap) return { error: 'Time slot overlaps with existing booking', status: 409 };

  let actualPrice = prod.price;

  if (prod.pricing==='pwyw') {
    if (price && price < prod.min_price) return { error: 'Minimum price is ₹'+prod.min_price, status: 400 };
    if (price > 0) actualPrice = price;
  }

  if (prod.discount_percent > 0) actualPrice = Math.round(actualPrice * (100 - prod.discount_percent) / 100);

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
    return { free: true, purchaseId, bookingId, meetLink: prod.meet_link||MEET_LINK };
  }

  const auth = btoa(env.RAZORPAY_KEY_ID+':'+env.RAZORPAY_KEY_SECRET);
  const pl = await(await fetch('https://api.razorpay.com/v1/payment_links',{method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/json'},body:JSON.stringify({amount:actualPrice*100,currency:'INR',description:prod.name+' — '+date+' '+time,customer:{name,email,contact:phone||undefined},notes:{purchase_id:purchaseId,product_slug:prod.slug,date,time},callback_url:'https://courses.akarshanarora.workers.dev/book/confirmed?purchaseId='+purchaseId,callback_method:'get'})})).json();
  if (!pl.id) return { error: 'Payment link creation failed', status: 500 };

  await env.DB.prepare("INSERT INTO contacts (purchase_id,booking_id,product_slug,product_name,product_kind,date,time,end_time,duration_minutes,name,email,phone,price,answers_json,coupon_code,payment_id,status,source,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending','courses',?)").bind(purchaseId,bookingId,prod.slug,prod.name,prod.kind,date,time,et,dur,name,email,phone||'',actualPrice,answers,couponCode||'',pl.id,Date.now()).run();
  return { purchaseId, bookingId, paymentLink: pl.short_url, paymentLinkId: pl.id };
}

// ═══ verifyPayment ═══
export async function verifyPayment({ orderId, paymentId, purchaseId }, env) {
  if (!env.RAZORPAY_KEY_ID) return { verified: false, error: 'Payment not configured' };
  const auth = btoa(env.RAZORPAY_KEY_ID+':'+env.RAZORPAY_KEY_SECRET);
  const id = paymentId || orderId;
  if (!id) return { verified: false, error: 'Missing payment identifier' };

  const p = await(await fetch('https://api.razorpay.com/v1/payments/'+id,{headers:{Authorization:'Basic '+auth}})).json();
  if (!p||p.status!=='captured') return { verified: false, error: 'Payment not captured' };

  if (!env.DB) return { verified: true, meetLink: MEET_LINK };
  const booking = purchaseId
    ? await env.DB.prepare("SELECT * FROM contacts WHERE purchase_id=? AND status='pending'").bind(purchaseId).first()
    : await env.DB.prepare("SELECT * FROM contacts WHERE payment_id=? AND status='pending'").bind(id).first();
  if (!booking) return { verified: true, meetLink: MEET_LINK };

  await env.DB.prepare("UPDATE contacts SET status='confirmed',payment_id=? WHERE id=?").bind(id,booking.id).run();
  if (env.RESEND_API_KEY) {
    await sendConfirmationEmail(booking,MEET_LINK,env);
    const a=safeJsonParse(booking.answers_json);
    await notifyAdmin(env,'booking',{service_name:booking.product_name,name:booking.name,email:booking.email,date:booking.date,time:booking.time,price:booking.price,meet_link:MEET_LINK,order_id:booking.purchase_id,payment_id:id,about:a.about||'',experience:a.experience||'',company:a.company||''});
  }
  return { verified: true, meetLink: MEET_LINK };
}
