export async function GET({ platform }) {
  try {
    const DB = platform?.env?.DB;
    if (!DB) return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    const rows = await DB.prepare('SELECT day_of_week, start_time, end_time FROM availability').all();
    return new Response(JSON.stringify(rows.results || []), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response('[]', { headers: { 'Content-Type': 'application/json' } }); }
}
