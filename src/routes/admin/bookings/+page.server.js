export async function load({ platform }) {
  const DB = platform?.env?.DB;
  if (!DB) return { bookings: [], products: [] };
  try {
    const [bookings, products] = await Promise.all([
      DB.prepare("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 100").all(),
      DB.prepare('SELECT slug, name FROM products WHERE kind=\'call\' AND active=1 ORDER BY name').all(),
    ]);
    return { bookings: bookings.results || [], products: products.results || [] };
  } catch { return { bookings: [], products: [] }; }
}
