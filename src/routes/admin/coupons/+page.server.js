export async function load({ platform }) {
  const DB = platform?.env?.DB;
  if (!DB) return { products: [] };
  const rows = await DB.prepare('SELECT slug, name, price FROM products WHERE active=1 AND price > 0 ORDER BY name').all();
  return { products: rows.results || [] };
}
