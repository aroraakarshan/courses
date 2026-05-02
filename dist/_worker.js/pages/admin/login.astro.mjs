globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request, locals }) => {
  const env = locals.runtime.env;
  let password = "";
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    ({ password } = await request.json());
  } else {
    const form = await request.formData();
    password = form.get("password");
  }
  if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
    return new Response(null, { status: 302, headers: { Location: "/admin?e=1" } });
  }
  const exp = String(Date.now() + 864e5);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_PASSWORD), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(exp));
  const hex = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
  const token = exp + "|" + hex;
  return new Response(null, {
    status: 302,
    headers: { "Set-Cookie": "admin_session=" + token + "; Path=/; Max-Age=86400", "Location": "/admin" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
