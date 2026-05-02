globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, f as renderComponent, r as renderTemplate, a as createAstro, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_C0dJqwLY.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BxMdf4w7.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Book = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Book;
  let services = [];
  try {
    const DB = Astro2.locals.runtime.env.DB;
    const result = await DB.prepare("SELECT slug, name, price FROM services WHERE active = 1 ORDER BY price").all();
    services = result.results || [];
  } catch {
  }
  const fmt = (p) => "\u20B9" + p.toLocaleString("en-IN");
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Book a Session" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<nav> <a href="https://akarshanarora.com" class="nav-brand">Akarshan Arora</a> <div class="nav-links"> <a href="https://akarshanarora.com">Who am I</a> <a href="https://www.linkedin.com/in/aroraakarshan/" target="_blank" rel="noopener">LinkedIn</a> <a href="https://topmate.io/akarshanarora" target="_blank" rel="noopener" class="nav-cta">Book a 1:1</a> </div> </nav> <div style="max-width:1000px;margin:0 auto;padding:2rem 2rem 0;"> <a href="/" class="back-link">&larr; Courses</a> </div> <section class="hero"> <div class="hero-eyebrow">1-on-1 Sessions</div> <h1>Pick a topic.</h1> </section> <div class="grid"> ${services.length === 0 ? renderTemplate`<div style="text-align:center;grid-column:1/-1;color:var(--muted);padding:2rem;">No sessions available right now.</div>` : services.map((s) => renderTemplate`<a${addAttribute(`/book/schedule/?s=${s.slug}&n=${encodeURIComponent(s.name)}&d=55`, "href")} class="card"> <div class="card-body"> <div class="card-tag">55 min &middot; ${fmt(s.price)}</div> <h2>${s.name}</h2> <p>1-on-1 session. Get personalised guidance from an industry professional.</p> </div> <div class="card-footer"><span>Select &rarr;</span></div> </a>`)} </div> <footer> <a href="https://akarshanarora.com">akarshanarora.com</a> &nbsp;&middot;&nbsp; <a href="/">Courses</a> &nbsp;&middot;&nbsp; <a href="/resources/">Guides</a> </footer> ` })}`;
}, "/Users/akarshanarora/Developers/courses/src/pages/book.astro", void 0);

const $$file = "/Users/akarshanarora/Developers/courses/src/pages/book.astro";
const $$url = "/book";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Book,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
