import { safeJsonParse } from '$lib/utils.js';
import { sendConfirmationEmail, notifyAdmin } from '$lib/email.js';

const MEET_LINK = 'https://meet.google.com/axa-gbem-pgj';

export async function POST({ platform, request }) {
  try {
    const { orderId, paymentId } = await request.json();
    if (!orderId || !paymentId) return new Response(JSON.stringify({ verified: false, error: 'Missing details' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const env = platform?.env;
    const auth = btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET);
    const p = await (await fetch('https://api.razorpay.com/v1/payments/' + paymentId, { headers: { Authorization: 'Basic ' + auth } })).json();
    if (!p || p.status !== 'captured') return new Response(JSON.stringify({ verified: false, error: 'Payment not captured' }), { headers: { 'Content-Type': 'application/json' } });
    if (p.order_id !== orderId) return new Response(JSON.stringify({ verified: false, error: 'Order mismatch' }), { headers: { 'Content-Type': 'application/json' } });

    if (!env?.DB) return new Response(JSON.stringify({ verified: true, meetLink: MEET_LINK }), { headers: { 'Content-Type': 'application/json' } });
    const booking = await env.DB.prepare("SELECT * FROM contacts WHERE order_id = ? AND status = 'pending'").bind(orderId).first();
    if (!booking) return new Response(JSON.stringify({ verified: true, meetLink: MEET_LINK }), { headers: { 'Content-Type': 'application/json' } });

    await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ?, meet_link = ? WHERE order_id = ? AND status = 'pending'").bind('confirmed', paymentId, MEET_LINK, orderId).run();

    if (env.RESEND_API_KEY) {
      await sendConfirmationEmail(booking, MEET_LINK, env);
      const answers = safeJsonParse(booking.answers_json);
      await notifyAdmin(env, 'booking', { service_name: booking.service_name, name: booking.name, email: booking.email, date: booking.date, time: booking.time, price: booking.price, meet_link: MEET_LINK, coupon_code: booking.coupon_code || '', order_id: booking.order_id, payment_id: paymentId, about: answers.about || '', experience: answers.experience || '', company: answers.company || '' });
    }
    return new Response(JSON.stringify({ verified: true, meetLink: MEET_LINK }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) { return new Response(JSON.stringify({ verified: false, error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
}
