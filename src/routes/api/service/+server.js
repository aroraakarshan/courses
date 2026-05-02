export async function GET({ platform, url }) {
  const slug = url.searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  try {
    const DB = platform?.env?.DB;
    if (!DB) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    const svc = await DB.prepare('SELECT slug, name, price FROM services WHERE slug = ? AND active = 1').bind(slug).first();
    if (!svc) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(svc), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ error: 'Not found' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
}
