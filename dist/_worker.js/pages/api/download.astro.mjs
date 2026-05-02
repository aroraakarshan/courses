globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const { name, email, phone, resource } = await request.json();
  if (!name || !email || !resource) return new Response(JSON.stringify({ error: "required fields missing" }), { status: 400, headers: { "Content-Type": "application/json" } });
  if (resource.includes("..") || resource.includes("/") || resource.includes("\\")) return new Response(JSON.stringify({ error: "invalid resource" }), { status: 400, headers: { "Content-Type": "application/json" } });
  if (env.DB) await env.DB.prepare("INSERT INTO contacts (name, email, phone, resource, source, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(name, email, phone || "", resource, "courses", "downloaded", Date.now()).run();
  let body = null, headers = new Headers();
  if (env.RESOURCES) {
    const obj = await env.RESOURCES.get(resource);
    if (obj) {
      body = obj.body;
      headers.set("Content-Type", obj.httpMetadata?.contentType || "application/pdf");
      obj.writeHttpMetadata(headers);
    }
  }
  if (!body) {
    const r = await env.ASSETS.fetch(new Request(new URL("/resources/" + resource, request.url)));
    if (r.status !== 200) return new Response(JSON.stringify({ error: "file not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    body = r.body;
    headers = new Headers(r.headers);
  }
  headers.set("Content-Disposition", 'attachment; filename="' + resource + '"');
  return new Response(body, { status: 200, headers });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
