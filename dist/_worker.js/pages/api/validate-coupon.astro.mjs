globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const { code, service, price } = await request.json();
  if (!code || !price) return new Response(JSON.stringify({ valid: false, error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
  let actualPrice = price;
  if (env.DB && service) {
    const svc = await env.DB.prepare("SELECT price FROM services WHERE slug = ? AND active = 1").bind(service).first();
    if (svc) actualPrice = svc.price;
  }
  if (env.DB) {
    const coupon = await env.DB.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1 AND (max_uses = 0 OR used < max_uses) AND (service = '' OR service = ?)").bind(code.toUpperCase().trim(), service || "").first();
    if (coupon) {
      const discounted = Math.round(actualPrice * (100 - coupon.discount_percent) / 100);
      return new Response(JSON.stringify({ valid: true, originalPrice: actualPrice, discountedPrice: discounted, discountPercent: coupon.discount_percent }), { headers: { "Content-Type": "application/json" } });
    }
  }
  return new Response(JSON.stringify({ valid: false, error: "Invalid or expired coupon" }), { headers: { "Content-Type": "application/json" } });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
