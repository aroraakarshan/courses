export async function POST({ platform, request }) {
  try {
    const { code, service, price } = await request.json();
    if (!code || !price) return new Response(JSON.stringify({ valid: false, error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const env = platform?.env;
    if (!env?.DB) return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired coupon' }), { headers: { 'Content-Type': 'application/json' } });

    let actualPrice = price;
    if (service) {
      const svc = await env.DB.prepare('SELECT price FROM services WHERE slug = ? AND active = 1').bind(service).first();
      if (svc) actualPrice = svc.price;
    }

    const coupon = await env.DB.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1 AND (max_uses = 0 OR used < max_uses) AND (service = '' OR service = ?)").bind(code.toUpperCase().trim(), service || '').first();
    if (coupon) {
      const discounted = Math.round(actualPrice * (100 - coupon.discount_percent) / 100);
      return new Response(JSON.stringify({ valid: true, originalPrice: actualPrice, discountedPrice: discounted, discountPercent: coupon.discount_percent }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired coupon' }), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
}
