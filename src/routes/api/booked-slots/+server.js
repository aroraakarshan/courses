export async function GET({ platform, url }) {
  const date = url.searchParams.get('date');
  if (!date) return new Response(JSON.stringify({ slots: [] }), { headers: { 'Content-Type': 'application/json' } });
  try {
    const DB = platform?.env?.DB;
    if (!DB) return new Response(JSON.stringify({ slots: [] }), { headers: { 'Content-Type': 'application/json' } });
    const rows = await DB.prepare("SELECT time FROM contacts WHERE date = ? AND status = 'confirmed'").bind(date).all();
    return new Response(JSON.stringify({ slots: (rows.results || []).map(r => r.time) }), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ slots: [] }), { headers: { 'Content-Type': 'application/json' } }); }
}
