export async function load({ platform, url }) {
  const slug = url.searchParams.get('slug');
  const DB = platform?.env?.DB;
  if (!DB) return { product: null };
  if (slug) {
    const p = await DB.prepare('SELECT * FROM products WHERE slug=?').bind(slug).first();
    return { product: p || null };
  }
  return { product: null };
}
