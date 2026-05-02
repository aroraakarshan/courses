const MEET_LINK = 'https://meet.google.com/axa-gbem-pgj';

export async function POST({ platform, request }) {
  try {
    const env = platform?.env;
    const body = await request.json();
    if (env?.RAZORPAY_WEBHOOK_SECRET) {
      const sig = request.headers.get('x-razorpay-signature');
      if (sig) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(env.RAZORPAY_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
        const hexToBytes = (h) => { const b = new Uint8Array(h.length/2); for (let i = 0; i < h.length; i += 2) b[i/2] = parseInt(h.substring(i, i+2), 16); return b; };
        const signed = body.payload ? JSON.stringify(body.payload) : JSON.stringify(body);
        const valid = await crypto.subtle.verify('HMAC', key, hexToBytes(sig), encoder.encode(signed));
        if (!valid) return new Response('invalid signature', { status: 403 });
      }
    }
    const p = body.payload?.payment?.entity;
    const orderId = p?.order_id, paymentId = p?.id;
    if (!orderId || !env?.DB) return new Response('ok');

    if (body.event === 'payment.captured') {
      const booking = await env.DB.prepare('SELECT * FROM contacts WHERE order_id = ?').bind(orderId).first();
      if (booking) {
        await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ?, meet_link = ? WHERE order_id = ?").bind('confirmed', paymentId, MEET_LINK, orderId).run();
        if (env.RESEND_API_KEY) { const { sendConfirmationEmail } = await import('$lib/email.js'); await sendConfirmationEmail(booking, MEET_LINK, env); }
      }
    } else if (body.event === 'payment.failed') {
      await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ? WHERE order_id = ? AND status = 'pending'").bind('failed', paymentId, orderId).run();
    } else if (body.event === 'refund.created' || body.event === 'refund.processed') {
      await env.DB.prepare("UPDATE contacts SET status = ?, payment_id = ? WHERE order_id = ? AND status = 'confirmed'").bind('refunded', paymentId, orderId).run();
    }
    return new Response('ok');
  } catch { return new Response('error', { status: 400 }); }
}
