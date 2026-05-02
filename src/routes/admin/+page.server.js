export async function load({ platform }) {
  const DB = platform?.env?.DB;
  if (!DB) return { stats: {}, recent: [] };
  try {
    const [stats, recent] = await Promise.all([
      DB.prepare("SELECT (SELECT COUNT(*) FROM products WHERE active=1) as products, (SELECT COUNT(*) FROM contacts WHERE status='confirmed') as bookings, (SELECT COUNT(*) FROM contacts WHERE status='downloaded') as downloads, COALESCE((SELECT SUM(price) FROM contacts WHERE status='confirmed'),0) as revenue").first(),
      DB.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 20').all(),
    ]);
    return { stats, recent: recent.results || [] };
  } catch { return { stats: {}, recent: [] }; }
}
