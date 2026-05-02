globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, f as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute, d as renderScript } from '../../chunks/astro/server_C0dJqwLY.mjs';
import { r as resources } from '../../chunks/resources_CqjKq1_t.mjs';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_BxMdf4w7.mjs';
/* empty css                                       */
export { renderers } from '../../renderers.mjs';

const $$Download = createComponent(async ($$result, $$props, $$slots) => {
  const titles = Object.fromEntries(resources.map((r) => [r.file, r.title]));
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Download", "data-astro-cid-s25gzsaj": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<nav data-astro-cid-s25gzsaj> <a href="https://akarshanarora.com" class="nav-brand" data-astro-cid-s25gzsaj>Akarshan Arora</a> <div class="nav-links" data-astro-cid-s25gzsaj> <a href="https://akarshanarora.com" data-astro-cid-s25gzsaj>Who am I</a> <a href="https://www.linkedin.com/in/aroraakarshan/" target="_blank" rel="noopener" data-astro-cid-s25gzsaj>LinkedIn</a> <a href="https://topmate.io/akarshanarora" target="_blank" rel="noopener" class="nav-cta" data-astro-cid-s25gzsaj>Book a 1:1</a> </div> </nav>  <div class="container" data-astro-cid-s25gzsaj> <a href="/resources/" class="back-link" data-astro-cid-s25gzsaj>&larr; Guides</a> <h1 id="resource-title" data-astro-cid-s25gzsaj>Download</h1> <p class="subtitle" data-astro-cid-s25gzsaj>Enter your details to get the PDF.</p> <form id="download-form" data-astro-cid-s25gzsaj> <div class="field" data-astro-cid-s25gzsaj> <label data-astro-cid-s25gzsaj>Name</label> <input type="text" name="name" required placeholder="Your full name" data-astro-cid-s25gzsaj> <div class="error" data-astro-cid-s25gzsaj>Please enter your name.</div> </div> <div class="field" data-astro-cid-s25gzsaj> <label data-astro-cid-s25gzsaj>Email</label> <input type="email" name="email" required placeholder="you@example.com" data-astro-cid-s25gzsaj> <div class="error" data-astro-cid-s25gzsaj>Please enter a valid email address.</div> </div> <div class="field" data-astro-cid-s25gzsaj> <label data-astro-cid-s25gzsaj>Phone &mdash; optional</label> <input type="tel" name="phone" placeholder="+91 99999 99999" data-astro-cid-s25gzsaj> </div> <button type="submit" class="btn" data-astro-cid-s25gzsaj>Download PDF</button> </form> </div> <span id="titles-data" hidden${addAttribute(JSON.stringify(titles), "data-titles")} data-astro-cid-s25gzsaj></span> ${renderScript($$result2, "/Users/akarshanarora/Developers/courses/src/pages/resources/download.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/akarshanarora/Developers/courses/src/pages/resources/download.astro", void 0);

const $$file = "/Users/akarshanarora/Developers/courses/src/pages/resources/download.astro";
const $$url = "/resources/download";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Download,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
