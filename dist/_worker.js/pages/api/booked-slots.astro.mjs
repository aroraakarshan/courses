globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ url, locals }) => {
  const env = locals.runtime.env;
  const date = url.searchParams.get("date");
  if (!date || !env.DB) return new Response(JSON.stringify({ slots: [] }), { headers: { "Content-Type": "application/json" } });
  const rows = await env.DB.prepare("SELECT time FROM contacts WHERE date = ? AND status = 'confirmed'").bind(date).all();
  return new Response(JSON.stringify({ slots: (rows.results || []).map((r) => r.time) }), { headers: { "Content-Type": "application/json" } });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
