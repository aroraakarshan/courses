globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ locals }) => {
  const env = locals.runtime.env;
  if (!env.DB) return new Response("[]", { headers: { "Content-Type": "application/json" } });
  const rows = await env.DB.prepare("SELECT slug, name, price FROM services WHERE active = 1 ORDER BY price").all();
  return new Response(JSON.stringify(rows.results || []), { headers: { "Content-Type": "application/json" } });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
