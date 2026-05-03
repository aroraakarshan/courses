import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateErrorId } from '$lib/schema';
import { requireDb } from '$lib/server/helpers';

export const GET: RequestHandler = async ({ params, platform }) => {
  try {
    const dbCheck = requireDb(platform?.env.DB);
    if (dbCheck.response) return dbCheck.response;

    const purchaseId = params.purchaseId;
    if (!purchaseId) return json({ error: 'Missing purchase ID' }, { status: 400 });

    const order = await platform!.env.DB.prepare(
      'SELECT o.purchase_id, o.product_name, o.product_kind, o.product_slug, o.customer_name, o.customer_email, o.customer_phone, o.amount_paid, o.original_price, o.status, o.payment_id, o.booking_date, o.booking_time, o.booking_end_time, o.answers, pc.meet_link, o.created_at FROM orders o LEFT JOIN product_calls pc ON o.product_kind = \'call\' AND pc.product_id = (SELECT id FROM products WHERE slug = o.product_slug) WHERE o.purchase_id=?',
    ).bind(purchaseId).first() as any;

    if (!order) return json({ error: 'Order not found' }, { status: 404 });

    const result: Record<string, unknown> = {
      purchaseId: order.purchase_id,
      productName: order.product_name,
      productKind: order.product_kind,
      productSlug: order.product_slug,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      amountPaid: order.amount_paid,
      originalPrice: order.original_price,
      status: order.status,
      paymentId: order.payment_id,
      bookingDate: order.booking_date || undefined,
      bookingTime: order.booking_time || undefined,
      bookingEndTime: order.booking_end_time || undefined,
      createdAt: order.created_at,
    };

    let answers: Record<string, string> | null = null;
    if (order.answers && order.answers !== '{}') {
      try {
        answers = typeof order.answers === 'string' ? JSON.parse(order.answers) : order.answers;
      } catch {}
    }
    if (answers) result.answers = answers;

    if (order.status === 'confirmed' || order.status === 'completed' || order.status === 'downloaded') {
      result.confirmedAt = order.created_at;
      if (order.product_kind === 'resource') {
        result.downloadUrl = `/api/resources/download?purchase_id=${order.purchase_id}`;
      } else if (order.product_kind === 'call') {
        result.meetLink = order.meet_link || '';
      }
    }

    return json(result);
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`[${errorId}] GET /api/orders/:purchaseId failed:`, error);
    return json({ error: 'Failed to fetch order', errorId }, { status: 500 });
  }
};
