import { z } from 'zod';

// ═══ Order — create a booking or download ═══
export const orderSchema = z.object({
  product_slug: z.string().min(1, 'Product slug is required'),
  product_name: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  price: z.number().optional(),
  couponCode: z.string().optional(),
  answersJson: z.string().optional(),
  fileServe: z.boolean().optional(),
});

// ═══ Coupon validation ═══
export const couponSchema = z.object({
  code: z.string().min(1),
  product_slug: z.string().optional(),
  price: z.number().min(0),
});

// ═══ Payment verification ═══
export const verifySchema = z.object({
  orderId: z.string().optional(),
  paymentId: z.string().optional(),
  purchaseId: z.string().optional(),
});

// ═══ Admin: Product CRUD ═══
export const productSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['call','resource','course','package','dm','webinar']),
  price: z.number().min(0),
  pricing: z.enum(['fixed','pwyw']).optional(),
  min_price: z.number().min(0).optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  duration_minutes: z.number().min(0).optional(),
  file: z.string().optional(),
  meet_link: z.string().optional(),
  description: z.string().optional(),
  questions: z.string().optional(),
  config: z.string().optional(),
});

// ═══ Admin: Availability ═══
export const availabilitySchema = z.object({
  product_slug: z.string().nullable().optional(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{1,2}:\d{2}$/, 'HH:MM format'),
  end_time: z.string().regex(/^\d{1,2}:\d{2}$/, 'HH:MM format'),
});

// ═══ Admin: Coupon ═══
export const adminCouponSchema = z.object({
  code: z.string().min(1),
  discount_percent: z.number().min(1).max(100),
  product_slug: z.string().optional(),
  max_uses: z.number().min(0).optional(),
});

// ═══ Admin: Update status ═══
export const statusSchema = z.object({
  id: z.number(),
  status: z.enum(['pending','confirmed','downloaded','cancelled','refunded','failed']),
});

// ═══ Validate helper ═══
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map(i => i.path.join('.') + ': ' + i.message).join(', ');
    return { valid: false, error: errors };
  }
  return { valid: true, data: result.data };
}
