import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, platform }) => {
  const purchaseId = url.searchParams.get('p');
  if (!purchaseId) return { purchaseId: '', order: null };

  const db = platform?.env.DB;
  if (!db) return { purchaseId, order: null };

  const order = await db.prepare(
    'SELECT purchase_id, product_name, product_kind, product_slug, customer_name, customer_email, customer_phone, amount_paid, original_price, status, payment_id, booking_date, booking_time, booking_end_time, answers, created_at FROM orders WHERE purchase_id=?'
  ).bind(purchaseId).first() as any;

  if (!order) return { purchaseId, order: null };

  let meetLink = '';
  if (order.product_kind === 'call') {
    const pc = await db.prepare(
      'SELECT meet_link FROM product_calls pc JOIN products p ON p.id = pc.product_id WHERE p.slug=?'
    ).bind(order.product_slug).first() as any;
    meetLink = pc?.meet_link || '';
  }

  let answers: Record<string, string> | null = null;
  if (order.answers && order.answers !== '{}') {
    try {
      answers = typeof order.answers === 'string' ? JSON.parse(order.answers) : order.answers;
    } catch {}
  }

  return {
    purchaseId,
    order: {
      productName: order.product_name,
      productKind: order.product_kind,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      amountPaid: order.amount_paid,
      originalPrice: order.original_price,
      status: order.status,
      paymentId: order.payment_id,
      bookingDate: order.booking_date,
      bookingTime: order.booking_time,
      bookingEndTime: order.booking_end_time,
      meetLink,
      answers,
      createdAt: order.created_at,
    },
  };
};
