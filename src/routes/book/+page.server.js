export async function load({ platform }) {
  let services = [];
  try {
    const DB = platform?.env?.DB;
    if (DB) {
      const result = await DB.prepare('SELECT slug, name, price FROM services WHERE active = 1 ORDER BY price').all();
      services = result.results || [];
    }
  } catch {}
  return { services };
}
