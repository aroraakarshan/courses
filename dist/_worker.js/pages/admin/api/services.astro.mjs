globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ locals }) => {
  const env = locals.runtime.env;
  if (!env.DB) return new Response("[]", { headers: { "Content-Type": "application/json" } });
  const rows = await env.DB.prepare("SELECT slug, name, price FROM services WHERE active = 1 ORDER BY price").all();
  return new Response(JSON.stringify(rows.results || []), { headers: { "Content-Type": "application/json" } });
};
const POST = async ({ request, locals }) => {
  const { slug, name, price } = await request.json();
  if (!slug || !name || !price) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
  await locals.runtime.env.DB.prepare("INSERT OR REPLACE INTO services (slug, name, price, active) VALUES (?, ?, ?, 1)").bind(slug, name, price).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
const DELETE = async ({ request, locals }) => {
  const { slug } = await request.json();
  await locals.runtime.env.DB.prepare("UPDATE services SET active = 0 WHERE slug = ?").bind(slug).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
