globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ locals }) => {
  const env = locals.runtime.env;
  if (!env.DB) return new Response("[]", { headers: { "Content-Type": "application/json" } });
  const rows = await env.DB.prepare("SELECT * FROM coupons WHERE active = 1 ORDER BY code").all();
  return new Response(JSON.stringify(rows.results || []), { headers: { "Content-Type": "application/json" } });
};
const POST = async ({ request, locals }) => {
  const { code, discount_percent, service, max_uses } = await request.json();
  if (!code || !discount_percent) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
  await locals.runtime.env.DB.prepare("INSERT OR REPLACE INTO coupons (code, discount_percent, service, max_uses, active) VALUES (?, ?, ?, ?, 1)").bind(code.toUpperCase(), discount_percent, service || "", max_uses || 0).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
const DELETE = async ({ request, locals }) => {
  const { code } = await request.json();
  await locals.runtime.env.DB.prepare("UPDATE coupons SET active = 0 WHERE code = ?").bind(code).run();
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
