export async function load({ platform }) {
  const DB = platform?.env?.DB;
  if (!DB) return { products: [] };
  try {
    const rows = await DB.prepare('SELECT * FROM products ORDER BY kind, price').all();
    return { products: rows.results || [] };
  } catch { return { products: [] }; }
}
