globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, f as renderComponent, r as renderTemplate, g as addAttribute, m as maybeRenderHead } from '../chunks/astro/server_C0dJqwLY.mjs';
import { r as resources } from '../chunks/resources_CqjKq1_t.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BxMdf4w7.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Guides", "data-astro-cid-fmgelhwa": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<nav data-astro-cid-fmgelhwa> <a href="https://akarshanarora.com" class="nav-brand" data-astro-cid-fmgelhwa>Akarshan Arora</a> <div class="nav-links" data-astro-cid-fmgelhwa> <a href="https://akarshanarora.com" data-astro-cid-fmgelhwa>Who am I</a> <a href="https://www.linkedin.com/in/aroraakarshan/" target="_blank" rel="noopener" data-astro-cid-fmgelhwa>LinkedIn</a> <a href="https://topmate.io/akarshanarora" target="_blank" rel="noopener" class="nav-cta" data-astro-cid-fmgelhwa>Book a 1:1</a> </div> </nav> <div style="max-width:1000px;margin:0 auto;padding:2rem 2rem 0;" data-astro-cid-fmgelhwa> <a href="/" class="back-link" data-astro-cid-fmgelhwa>&larr; Courses</a> </div> <section class="hero" data-astro-cid-fmgelhwa> <div class="hero-eyebrow" data-astro-cid-fmgelhwa>Guides</div> <h1 data-astro-cid-fmgelhwa>Guides for VLSI engineers.</h1> <p data-astro-cid-fmgelhwa>Practical references built from real project experience.</p> </section> <div class="grid" data-astro-cid-fmgelhwa> ', ' </div> <section class="support" data-astro-cid-fmgelhwa> <h3 data-astro-cid-fmgelhwa>Support this work</h3> <p data-astro-cid-fmgelhwa>Creating resources takes time. If you find them valuable, consider contributing.</p> <form data-astro-cid-fmgelhwa><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_Sk52NHQhnivoGx" async><\/script></form> </section> <footer data-astro-cid-fmgelhwa> <a href="https://akarshanarora.com" data-astro-cid-fmgelhwa>akarshanarora.com</a> &nbsp;\xB7&nbsp; <a href="/" data-astro-cid-fmgelhwa>Courses</a> &nbsp;\xB7&nbsp; <a href="/resources/" data-astro-cid-fmgelhwa>Resources</a> </footer> '])), maybeRenderHead(), resources.map((r) => renderTemplate`<div class="card" data-astro-cid-fmgelhwa> <div class="card-body" data-astro-cid-fmgelhwa> <h2 data-astro-cid-fmgelhwa>${r.title}</h2> <p data-astro-cid-fmgelhwa>${r.description}</p> </div> <div class="card-footer" data-astro-cid-fmgelhwa> <a${addAttribute(`/resources/download/?r=${r.file}`, "href")} style="color:inherit;text-decoration:none;" data-astro-cid-fmgelhwa><span data-astro-cid-fmgelhwa>Download →</span></a> </div> </div>`)) })} `;
}, "/Users/akarshanarora/Developers/courses/src/pages/resources/index.astro", void 0);

const $$file = "/Users/akarshanarora/Developers/courses/src/pages/resources/index.astro";
const $$url = "/resources";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
