// ═══ listProducts ═══
export async function listProducts(env) {
  if (!env.DB) return [];
  const rows = await env.DB.prepare('SELECT slug, name, kind, price, duration_minutes, description FROM products WHERE active=1 ORDER BY kind, price').all();
  return rows.results||[];
}

// ═══ getProduct ═══
export async function getProduct(slug, env) {
  if (!slug||!env.DB) return null;
  return await env.DB.prepare('SELECT * FROM products WHERE slug=? AND active=1').bind(slug).first();
}

// ═══ listAvailability ═══
export async function listAvailability(productSlug, env) {
  if (!env.DB) return [];
  const rows = await env.DB.prepare('SELECT * FROM availability WHERE active=1 AND (product_slug=? OR product_slug IS NULL) ORDER BY day_of_week').bind(productSlug||null).all();
  return rows.results||[];
}

// ═══ getBookedSlots ═══
export async function getBookedSlots(date, env) {
  if (!date||!env.DB) return [];
  const rows = await env.DB.prepare("SELECT time,end_time FROM contacts WHERE date=? AND status IN ('pending','confirmed') AND product_kind='call'").bind(date).all();
  return rows.results||[];
}
