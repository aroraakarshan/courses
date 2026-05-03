import { z } from 'zod';
import { orderCreateSchema, validate, generateErrorId } from '$lib/schema';
import { validateCoupon } from './coupons';
import { normalizeProduct } from './products';

export type OrderResult = {
  valid: true;
  data: z.infer<typeof orderCreateSchema>;
  product: Record<string, unknown>;
  amount: number;
  couponApplied: string;
  pricing: string;
  suggestedPrice: number;
} | {
  valid: false;
  error: string;
}

export async function validateOrder(db: any, body: any): Promise<OrderResult> {
  const v = validate(orderCreateSchema, body);
  if (!v.valid) return { valid: false, error: v.error };

  const d = v.data;

  // Fetch product
  const product = await db.prepare(
    'SELECT p.*, pc.duration_minutes FROM products p LEFT JOIN product_calls pc ON p.id = pc.product_id WHERE p.slug=? AND p.active=1'
  ).bind(d.product_slug).first();

  if (!product) return { valid: false, error: 'Product not found or inactive' };

  // Validate call-specific fields
  if (product.kind === 'call') {
    if (!d.date || !d.time) {
      return { valid: false, error: 'Date and time required for calls' };
    }
  }

  // Validate mandatory questions
  const normalized = normalizeProduct(product);
  if (normalized.questions.length > 0) {
    const answers = d.answers || {};
    const missing = normalized.questions
      .filter((q: any) => q.mandatory && !(answers as Record<string, string>)[q.question]?.trim())
      .map((q: any) => q.question);
    if (missing.length > 0) {
      return { valid: false, error: `Required: ${missing.join(', ')}` };
    }
  }

  // Calculate price — no implicit fallbacks
  const isPwyw = product.pricing === 'pay-what-you-want';
  let amount: number;

  if (isPwyw) {
    if (d.price === undefined) {
      return { valid: false, error: 'Price is required for pay-what-you-want products' };
    }
    amount = d.price;
  } else {
    if (d.price !== undefined) {
      return { valid: false, error: 'Fixed-price products do not accept a price parameter' };
    }
    amount = Number(product.price);
  }

  let couponApplied = '';
  const suggestedPrice = isPwyw ? Number(product.suggested_price ?? 0) : 0;

  if (d.coupon_code) {
    const couponResult = await validateCoupon(db, d.coupon_code, d.product_slug, amount, d.email);
    if (!couponResult.valid) return couponResult;
    amount = couponResult.discountedPrice;
    couponApplied = couponResult.code;
  }

  return { valid: true, data: d, product, amount, couponApplied, pricing: product.pricing, suggestedPrice };
}

export interface ConfirmOrderEnv {
  DB: any;
  RESEND_API_KEY?: string;
  ADMIN_EMAIL?: string;
  RAZORPAY_KEY_ID?: string;
}

export async function confirmOrder(purchaseId: string, env: ConfirmOrderEnv): Promise<{ ok: true } | { ok: false; error: string }> {
  const { DB: db } = env;
  if (!db) return { ok: false, error: 'Database unavailable' };

  const order = await db.prepare(
    'SELECT * FROM orders WHERE purchase_id=?'
  ).bind(purchaseId).first() as any;

  if (!order) return { ok: false, error: 'Order not found' };
  if (order.status === 'confirmed') return { ok: true };

  // For calls, check no conflicting booking exists
  if (order.product_kind === 'call' && order.booking_time) {
    const conflict = await db.prepare(
      "SELECT id FROM orders WHERE product_slug=? AND booking_date=? AND booking_time=? AND status IN ('confirmed', 'completed') AND purchase_id!=?"
    ).bind(order.product_slug, order.booking_date, order.booking_time, order.purchase_id).first();
    if (conflict) {
      await db.prepare(
        "UPDATE orders SET status='failed', updated_at=datetime('now') WHERE purchase_id=?"
      ).bind(order.purchase_id).run();
      return { ok: false, error: 'This time slot has already been booked' };
    }
  }

  await db.prepare(
    "UPDATE orders SET status='confirmed', updated_at=datetime('now') WHERE purchase_id=?"
  ).bind(purchaseId).run();

  if (env.RESEND_API_KEY) {
    const { sendCustomerReceipt, sendAdminNotification } = await import('./email');

    const amount = order.amount_paid || 0;
    const originalPrice = order.original_price || amount;

    // Fetch meet_link from product_calls for calls
    let meetLink = '';
    if (order.product_kind === 'call') {
      const pc = await db.prepare(
        'SELECT meet_link FROM product_calls pc JOIN products p ON p.id = pc.product_id WHERE p.slug=?'
      ).bind(order.product_slug).first() as any;
      meetLink = pc?.meet_link || '';
    }

    // Format answers as HTML rows for email + plain text for calendar
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

    sendCustomerReceipt({
      to: order.customer_email,
      customerName: order.customer_name,
      productName: order.product_name,
      amount,
      originalPrice: originalPrice > amount ? originalPrice : undefined,
      couponCode: order.coupon_code || undefined,
      purchaseId: order.purchase_id,
      bookingId: order.booking_id || undefined,
      paymentId: order.payment_id || '',
      merchant: order.merchant || 'courses',
      productKind: order.product_kind,
      bookingDate: order.booking_date || undefined,
      bookingTime: order.booking_time || undefined,
      bookingEndTime: order.booking_end_time || undefined,
      meetLink,
    }, { RESEND_API_KEY: env.RESEND_API_KEY! }).catch(() => {});

    sendAdminNotification({
      adminEmail: env.ADMIN_EMAIL || 'akarshanarora@gmail.com',
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone || '',
      productName: order.product_name,
      productKind: order.product_kind,
      amount,
      originalPrice: originalPrice > amount ? originalPrice : undefined,
      couponCode: order.coupon_code || undefined,
      purchaseId: order.purchase_id,
      bookingId: order.booking_id || undefined,
      paymentId: order.payment_id || '',
      merchant: order.merchant || 'courses',
      merchantOrderId: order.merchant_order_id || '',
      bookingDate: order.booking_date || undefined,
      bookingTime: order.booking_time || undefined,
      bookingEndTime: order.booking_end_time || undefined,
      meetLink,
      answersHtml: answersHtml || undefined,
      answersText: answersText || undefined,
    }, { RESEND_API_KEY: env.RESEND_API_KEY! }).catch(() => {});
  }

  return { ok: true };
}

export async function updateOrderPayment(
  db: any,
  purchaseId: string,
  paymentId: string,
  merchantOrderId: string,
  amountPaid: number,
  env: ConfirmOrderEnv,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await db.prepare('SELECT * FROM orders WHERE purchase_id=?').bind(purchaseId).first() as any;

  if (!order) return { ok: false, error: 'Order not found' };
  if (order.status !== 'pending') return { ok: false, error: `Order already ${order.status}` };

  await db.prepare(
    'UPDATE orders SET payment_id=?, merchant_order_id=?, amount_paid=?, updated_at=datetime(\'now\') WHERE purchase_id=?',
  ).bind(paymentId, merchantOrderId, amountPaid, purchaseId).run();

  return confirmOrder(purchaseId, env);
}
