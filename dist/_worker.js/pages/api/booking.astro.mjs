globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ url, locals }) => {
  const env = locals.runtime.env;
  const orderId = url.searchParams.get("orderId");
  if (!orderId || !env.DB) return new Response(JSON.stringify({ status: "unknown" }), { headers: { "Content-Type": "application/json" } });
  const b = await env.DB.prepare("SELECT status, meet_link, service_name, date, time FROM contacts WHERE order_id = ?").bind(orderId).first();
  return new Response(JSON.stringify(b || { status: "not_found" }), { headers: { "Content-Type": "application/json" } });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
