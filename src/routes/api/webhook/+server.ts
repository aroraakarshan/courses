import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateErrorId } from '$lib/schema';
import { verifyWebhookSignature } from '$lib/server/razorpay';
import { updateOrderPayment, type ConfirmOrderEnv } from '$lib/server/orders';

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const db = platform?.env.DB;
    if (!db) {
      const errorId = generateErrorId();
      console.error(`[${errorId}] DB not available for webhook`);
      return json({ error: 'DB unavailable' }, { status: 500 });
    }

    const secret = platform!.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not configured');
      return json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-webhook-signature') || '';

    if (!await verifyWebhookSignature(rawBody, signature, secret)) {
      console.error('[webhook] Invalid signature');
      return json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[webhook] ${eventType}`);

    const purchaseId = payload.payment_link?.entity?.notes?.purchase_id
      || payload.payment?.entity?.notes?.purchase_id;
    const paymentLinkId = payload.payment_link?.entity?.id;
    const paymentId = payload.payment?.entity?.id;

    let order = null;
    if (purchaseId) {
      order = await db.prepare('SELECT * FROM orders WHERE purchase_id=?').bind(purchaseId).first() as any;
    }
    if (!order && paymentLinkId) {
      order = await db.prepare('SELECT * FROM orders WHERE payment_link_id=?').bind(paymentLinkId).first() as any;
    }
    if (!order && paymentId) {
      order = await db.prepare('SELECT * FROM orders WHERE payment_id=?').bind(paymentId).first() as any;
    }

    if (!order) {
      console.log(`[webhook] No order found — purchase_id=${purchaseId || '—'}, payment_link=${paymentLinkId || '—'}, payment=${paymentId || '—'}`);
      return json({ ok: true });
    }

    switch (eventType) {
      case 'payment_link.paid':
      case 'payment.captured': {
        const amount = payload.payment?.entity?.amount
          || payload.payment_link?.entity?.amount
          || order.amount_paid * 100;

        const result = await updateOrderPayment(db, order.purchase_id, paymentId || order.payment_id, payload.payment?.entity?.order_id || order.merchant_order_id, amount / 100, {
          DB: db,
          RESEND_API_KEY: platform!.env.RESEND_API_KEY,
          ADMIN_EMAIL: platform!.env.ADMIN_EMAIL,
          RAZORPAY_KEY_ID: platform!.env.RAZORPAY_KEY_ID,
        });

        if (result.ok) {
          console.log(`[webhook] Order ${order.purchase_id} confirmed`);
        } else {
          console.log(`[webhook] ${result.error}`);
        }
        break;
      }

      case 'payment.failed':
      case 'payment_link.cancelled': {
        await db.prepare(
          "UPDATE orders SET status='failed', updated_at=datetime('now') WHERE purchase_id=?"
        ).bind(order.purchase_id).run();

        if (platform!.env.RESEND_API_KEY) {
          const { sendAdminNotification } = await import('$lib/server/email');

          let meetLink = '';
          if (order.product_kind === 'call') {
            const pc = await db.prepare(
              'SELECT meet_link FROM product_calls pc JOIN products p ON p.id = pc.product_id WHERE p.slug=?'
            ).bind(order.product_slug).first() as any;
            meetLink = pc?.meet_link || '';
          }

          let answersHtml = '';
          let answersText = '';
          if (order.answers && order.answers !== '{}') {
            try {
              const answers = typeof order.answers === 'string' ? JSON.parse(order.answers) : order.answers;
              const entries = Object.entries(answers).filter(([_, v]) => v && String(v).trim());
              if (entries.length > 0) {
                answersHtml = entries.map(([q, a]) => `<tr><td style="padding: 0.3rem 0; font-size: 0.82rem; font-weight: 600; color: #64748b;">${q}</td></tr><tr><td style="padding: 0 0 0.75rem; font-size: 0.85rem; color: #0f172a;">${a}</td></tr>`).join('');
                answersText = entries.map(([q, a]) => `${q}: ${a}`).join('\n');
              }
            } catch {}
          }

          sendAdminNotification({
            adminEmail: platform!.env.ADMIN_EMAIL || 'akarshanarora@gmail.com',
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone || '',
            productName: order.product_name,
            productKind: order.product_kind,
            amount: order.amount_paid || 0,
            originalPrice: order.original_price || undefined,
            couponCode: order.coupon_code || undefined,
            purchaseId: order.purchase_id,
            bookingId: order.booking_id || undefined,
            paymentId: payload.payment?.entity?.id || '',
            merchant: order.merchant || 'courses',
            merchantOrderId: order.merchant_order_id || '',
            status: 'failed',
            bookingDate: order.booking_date || undefined,
            bookingTime: order.booking_time || undefined,
            bookingEndTime: order.booking_end_time || undefined,
            meetLink,
            answersHtml: answersHtml || undefined,
            answersText: answersText || undefined,
          }, { RESEND_API_KEY: platform!.env.RESEND_API_KEY! }).catch(() => {});
        }

        console.log(`[webhook] Order ${order.purchase_id} failed`);
        break;
      }

      case 'payment.refunded':
      case 'payment_link.refunded': {
        await db.prepare(
          "UPDATE orders SET status='refunded', updated_at=datetime('now') WHERE purchase_id=?"
        ).bind(order.purchase_id).run();
        console.log(`[webhook] Order ${order.purchase_id} refunded`);
        break;
      }

      default:
        console.log(`[webhook] Unhandled: ${eventType}`);
    }

    return json({ ok: true });
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`[${errorId}] POST /api/webhook failed:`, error);
    return json({ error: 'Webhook processing failed', errorId }, { status: 500 });
  }
};
