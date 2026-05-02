globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, r as renderTemplate, h as renderSlot, b as renderHead, a as createAstro } from './astro/server_C0dJqwLY.mjs';
/* empty css                        */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>', ' \u2014 Akarshan Arora</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"><script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="{&quot;token&quot;: &quot;8c66faf9f1da4e7a986ef54dc0a2a326&quot;}"><\/script><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">', "</head> <body> ", " </body></html>"])), title, renderHead(), renderSlot($$result, $$slots["default"]));
}, "/Users/akarshanarora/Developers/courses/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
