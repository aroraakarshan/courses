globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, b as renderHead, d as renderScript, r as renderTemplate } from '../../chunks/astro/server_C0dJqwLY.mjs';
/* empty css                                        */
export { renderers } from '../../renderers.mjs';

const $$Confirmed = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en" data-astro-cid-2idzcayr> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Booking Confirmed — Akarshan Arora</title><link rel="icon" type="image/svg+xml" href="/favicon.svg">${renderHead()}</head> <body data-astro-cid-2idzcayr> <div id="content" data-astro-cid-2idzcayr> <div class="spinner" data-astro-cid-2idzcayr></div> <h1 id="heading" data-astro-cid-2idzcayr>Verifying payment...</h1> <p id="msg" data-astro-cid-2idzcayr>Give us a moment.</p> </div> <a href="/" style="display:none;" id="back-link" data-astro-cid-2idzcayr>Back to Courses</a> ${renderScript($$result, "/Users/akarshanarora/Developers/courses/src/pages/book/confirmed.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/akarshanarora/Developers/courses/src/pages/book/confirmed.astro", void 0);

const $$file = "/Users/akarshanarora/Developers/courses/src/pages/book/confirmed.astro";
const $$url = "/book/confirmed";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Confirmed,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
