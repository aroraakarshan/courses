globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C0dJqwLY.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BxMdf4w7.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Courses" }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<nav> <a href="https://akarshanarora.com" class="nav-brand">Akarshan Arora</a> <div class="nav-links"> <a href="https://akarshanarora.com">Who am I</a> <a href="https://www.linkedin.com/in/aroraakarshan/" target="_blank" rel="noopener">LinkedIn</a> <a href="https://topmate.io/akarshanarora" target="_blank" rel="noopener" class="nav-cta">Book a 1:1</a> </div> </nav> <section class="hero"> <div class="hero-eyebrow">Learn by doing</div> <h1>Tutorials that make complex concepts click.</h1> <p>Interactive, visual, and built from real industry experience. No sign-up. No paywall.</p> </section> <div class="grid"> <a href="/yaml-from-zero/" class="card"> <div class="card-body"> <div class="card-tag">Tutorial &middot; Free</div> <h2>YAML from Zero</h2> <p>Learn YAML from absolute basics to advanced features \u2014 live examples, built-in playground, and quizzes to test your understanding.</p> </div> <div class="card-footer"><span>Start Learning \u2192</span></div> </a> <a href="/resources/" class="card"> <div class="card-body"> <div class="card-tag">Downloads</div> <h2>Guides</h2> <p>Quick-reference guides for VLSI engineers \u2014 EMIR fundamentals, PDN checklists, and more. Downloadable PDFs for your second screen.</p> </div> <div class="card-footer"><span>Browse Guides \u2192</span></div> </a> <a href="/book/" class="card"> <div class="card-body"> <div class="card-tag">1-on-1</div> <h2>Book a Session</h2> <p>Get personalised guidance on Python for VLSI, PDN, Redhawk SeaScape, or your career path. 55-minute live sessions.</p> </div> <div class="card-footer"><span>Book Now \u2192</span></div> </a> </div> <section class="support"> <h3>Support this work</h3> <p>Creating resources takes time. If you find them valuable, consider contributing.</p> <form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_Sk52NHQhnivoGx" async><\/script></form> </section> <footer> <a href="https://akarshanarora.com">akarshanarora.com</a> &nbsp;\xB7&nbsp; <a href="/">Courses</a> &nbsp;\xB7&nbsp; <a href="/resources/">Guides</a> </footer> '])), maybeRenderHead()) })}`;
}, "/Users/akarshanarora/Developers/courses/src/pages/index.astro", void 0);

const $$file = "/Users/akarshanarora/Developers/courses/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
