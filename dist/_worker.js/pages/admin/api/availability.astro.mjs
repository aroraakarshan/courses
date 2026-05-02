globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ locals }) => {
  const env = locals.runtime.env;
  if (!env.DB) return new Response("[]", { headers: { "Content-Type": "application/json" } });
  const rows = await env.DB.prepare("SELECT day_of_week, start_time, end_time FROM availability").all();
  return new Response(JSON.stringify(rows.results || []), { headers: { "Content-Type": "application/json" } });
};
const POST = async ({ request, locals }) => {
  const { day_of_week, start_time, end_time } = await request.json();
  await locals.runtime.env.DB.prepare("INSERT OR REPLACE INTO availability (day_of_week, start_time, end_time) VALUES (?, ?, ?)").bind(day_of_week, start_time, end_time).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
const DELETE = async ({ request, locals }) => {
  const { day_of_week } = await request.json();
  await locals.runtime.env.DB.prepare("DELETE FROM availability WHERE day_of_week = ?").bind(day_of_week).run();
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
