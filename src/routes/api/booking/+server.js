export async function GET({ platform, url }) {
  const orderId = url.searchParams.get('orderId');
  if (!orderId) return new Response(JSON.stringify({ status: 'unknown' }), { headers: { 'Content-Type': 'application/json' } });
  try {
    const DB = platform?.env?.DB;
    if (!DB) return new Response(JSON.stringify({ status: 'unknown' }), { headers: { 'Content-Type': 'application/json' } });
    const b = await DB.prepare('SELECT status, meet_link, service_name, date, time FROM contacts WHERE order_id = ?').bind(orderId).first();
    return new Response(JSON.stringify(b || { status: 'not_found' }), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ status: 'unknown' }), { headers: { 'Content-Type': 'application/json' } }); }
}
