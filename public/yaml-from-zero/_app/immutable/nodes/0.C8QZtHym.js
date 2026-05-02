import{t as e}from"../chunks/LYDb2PK_.js";import{B as t,C as n,D as r,E as i,I as a,K as o,L as s,N as c,O as l,P as u,R as d,S as f,U as p,V as m,X as h,Y as g,_,b as v,d as y,f as b,g as x,h as S,i as C,j as w,k as T,l as E,p as D,q as O,s as k,u as A,w as j,x as M,y as N}from"../chunks/DI_erTYQ.js";import{c as P,t as F}from"../chunks/CIdJaYxM.js";import"../chunks/ibwe1TAv.js";import{t as I}from"../chunks/yuzUcMeU.js";import{t as L}from"../chunks/DVSG734W.js";var R=e({prerender:()=>!0}),z=`<script>
import { base } from '$app/paths';
import { onMount } from 'svelte';
import BundleCard from '$lib/components/BundleCard.svelte';

onMount(() => {
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  document.querySelectorAll('#lesson-content p > strong:first-child').forEach((s) => {
    const p = s.parentElement;
    if (p && !p.id) p.id = slug(s.textContent || '');
  });
  if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
<\/script>

# Glossary

A quick, plain-English lookup for every technical word that appears in the tutorial. Use it whenever a term feels fuzzy — no shame in coming back here often.

---

## YAML core terms

**YAML** — a plain-text format for storing configuration. Stands for "YAML Ain't Markup Language". *Lesson 1*

**Key** — the label on the left of a colon. In \`voltage: 1.2\`, the key is \`voltage\`. *Lesson 2*

**Value** — what's on the right of a colon. In \`voltage: 1.2\`, the value is \`1.2\`. *Lesson 2*

**Key-value pair** — a key together with its value, e.g. \`frequency_mhz: 100\`. The basic building block of YAML. *Lesson 2*

**Scalar** — a single, simple value: text, a number, or true/false. Not a list or a group. *Lesson 2*

**String** — a piece of text, usually wrapped in quotes: \`"TitanCore"\`. *Lesson 2*

**Integer** — a whole number with no decimal point: \`100\`, \`25\`, \`-7\`. *Lesson 2*

**Float** — a number with a decimal point: \`1.2\`, \`3.14\`. *Lesson 2*

**Boolean** — a true/false value. YAML accepts \`true\` and \`false\` (lowercase). *Lesson 2*

**Comment** — text starting with \`#\` that the computer ignores; only humans read it. *Lesson 2*

**Indentation** — the spaces at the start of a line. YAML uses indentation to show grouping. Always **spaces**, never tabs. *Lesson 3*

**Nested** — placed inside something else. A block of keys indented under a parent key is nested. *Lesson 3*

**List** — an ordered series of items, each starting with a dash (\`-\`). *Lesson 4*

**Object** — a group of related key-value pairs, e.g. one chip's complete spec. Sometimes called a "dictionary" or "mapping". *Lesson 4*

**Multi-line text** — text that spans several lines. YAML uses \`|\` to keep line breaks and \`>\` to fold them into one line. *Lesson 5*

**Block style** — the readable, multi-line YAML format that uses indentation. Opposite of flow style. *Lesson 5*

**Flow style** — the compact one-line YAML format using \`[…]\` and \`{…}\`. Valid but harder to read. *Lesson 12*

**Anchor** — a named template marker. Created with \`&name\`. *Lesson 9*

**Alias** — a reference back to an anchor. Written as \`*name\`. *Lesson 9*

**Merge key** — \`<<:\` followed by an alias. Copies all key-value pairs from the anchored block into the current block. *Lesson 9*

---

## Errors and validation

**Syntax** — the rules for how a language must be written. A "syntax error" means you broke one of those rules. *Lesson 7*

**Validate / validation** — check whether a file follows the rules. A YAML validator tells you if your file is well-formed. *Lesson 8*

**Parse** — read a file and turn it into a structure the computer can use. \`yaml.safe_load()\` parses YAML. *Lesson 12*

**Duplicate key** — using the same key twice at the same level. The second one silently overwrites the first — a common bug. *Lesson 7*

---

## Coding terms (Part 4)

**Script** — a plain text file with instructions for the computer (e.g. \`run_synth.py\`). You can open it in any editor. *Lesson 11*

**Terminal** (also: shell, command line, console) — the text window where you type commands. Same idea as Cadence's Tcl prompt. *Lesson 11*

**File path** — the address of a file on disk. Relative: \`chip.yaml\`. Absolute: \`/home/alice/chip.yaml\`. *Lesson 11*

**Library** — reusable code somebody else wrote. Python's \`yaml\` library reads and writes YAML files for you. *Lesson 11*

**\`pip\`** — Python's package installer. \`pip install pyyaml\` downloads the YAML library. *Lesson 11*

**\`import\`** — Python keyword that loads a library. \`import yaml\` makes the YAML library available in the script. *Lesson 11*

**Function** — a named piece of code you can call to do a task. \`yaml.safe_load(f)\` calls the \`safe_load\` function with \`f\` as input. *Lesson 12*

**Argument** — a value you pass into a function. In \`yaml.dump(data, f)\`, \`data\` and \`f\` are arguments. *Lesson 13*

**Dictionary (dict)** — Python's name for a collection of key-value pairs. When Python reads a YAML file, the result is a dictionary. *Lesson 12*

**Index** — a number that picks an item from a list. Lists start at 0 — \`team[0]\` is the first item, \`team[1]\` is the second. *Lesson 12*

**Exception / error** — when something goes wrong, Python raises an exception that stops the program. \`YAMLError\` and \`FileNotFoundError\` are examples. *Lesson 14*

**\`try / except\`** — Python's way of handling exceptions gracefully instead of crashing. *Lesson 14*

---

## Hardware / EDA terms (used as analogies)

**SDC** — Synopsys Design Constraints. A text file telling synthesis tools about clocks and timing. Conceptually similar to a YAML config — both feed parameters into a tool.

**Liberty (\`.lib\`)** — a text file describing standard cell timing/power. Like YAML, it's plain text packed with key-value-style information.

**Verilog/VHDL** — hardware description languages. Many design teams generate per-block Verilog parameters from a central YAML config.

**Testbench** — verification code that exercises a design. Often configured by YAML files specifying which tests to run and with what parameters.

**EDA tool** — Electronic Design Automation tool (Cadence, Synopsys, Mentor). They typically read configs (YAML, Tcl, SDC) and produce reports.

---

<BundleCard />

<div class="not-prose" style="margin-top:2rem;display:flex;justify-content:center;">
  <a href="{base}/" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.65rem 1.25rem;border-radius:8px;font-weight:600;font-size:0.85rem;text-decoration:none;background:var(--color-accent);color:white;font-family:var(--font-ui);transition:all 0.25s ease;">
    ← Back to Home
  </a>
</div>
`;function B(e){let t=[],n=/^\*\*([^*]+)\*\*\s*[—-]\s*([^\n]+)$/gm,r;for(;(r=n.exec(e))!==null;){let e=r[1].trim(),n=r[2].replace(/\*Lesson[^*]*\*/g,``).trim();t.push({type:`glossary`,title:e,subtitle:n,url:`/glossary#${e.toLowerCase().replace(/[^a-z0-9]+/g,`-`)}`,haystack:(e+` `+n).toLowerCase()})}return t}var V=[...I.flatMap(e=>e.lessons.map(t=>({type:`lesson`,title:t.title,subtitle:`Part ${e.id} · ${e.title}`,url:`/${t.slug}`,haystack:(t.title+` `+t.description+` `+e.title).toLowerCase()}))),{type:`lesson`,title:`Glossary`,subtitle:`Every technical word in plain English`,url:`/glossary`,haystack:`glossary terms definitions reference lookup`},...B(z)];function H(e,t=12){let n=e.trim().toLowerCase();if(!n)return[];let r=n.split(/\s+/),i=[];for(let e of V){let t=0,n=!0;for(let i of r){let r=e.haystack.indexOf(i);if(r===-1){n=!1;break}t+=100-Math.min(r,90),e.title.toLowerCase().includes(i)&&(t+=50),e.title.toLowerCase().startsWith(i)&&(t+=30)}n&&i.push({e,score:t})}return i.sort((e,t)=>t.score-e.score),i.slice(0,t).map(e=>e.e)}var U=n(`<div class="search-hint svelte-yyldap">Type to search. Use <kbd class="svelte-yyldap">↑</kbd><kbd class="svelte-yyldap">↓</kbd> to move, <kbd class="svelte-yyldap">↵</kbd> to open.</div>`),W=n(`<div class="search-hint svelte-yyldap"> </div>`),G=n(`<div><span> </span> <div class="search-hit-body svelte-yyldap"><div class="search-hit-title svelte-yyldap"> </div> <div class="search-hit-sub svelte-yyldap"> </div></div></div>`),K=n(`<div class="search-backdrop svelte-yyldap"></div> <div class="search-modal svelte-yyldap" role="dialog" aria-label="Search"><div class="search-input-row svelte-yyldap"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" stroke="currentColor" stroke-width="1.6"></circle><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg> <input type="text" placeholder="Search lessons and glossary…" autocomplete="off" spellcheck="false" class="svelte-yyldap"/> <kbd class="search-esc svelte-yyldap">Esc</kbd></div> <div class="search-results svelte-yyldap"><!></div></div>`,1),q=n(`<button class="search-trigger svelte-yyldap" aria-label="Search"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" stroke="currentColor" stroke-width="1.6"></circle><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg> <span class="search-trigger-label svelte-yyldap">Search</span> <kbd class="search-trigger-kbd svelte-yyldap">/</kbd></button> <!>`,1);function J(e,n){O(n,!0);let i=m(!1),y=m(``),b=m(0),S=m(null),j=p(()=>H(T(y)));u(()=>{T(y),t(b,0)});async function P(){t(i,!0),await w(),T(S)?.focus()}function I(){t(i,!1),t(y,``)}function L(e){let n=e.target,r=n?.tagName,a=r===`INPUT`||r===`TEXTAREA`||n?.isContentEditable;if(!T(i)&&!a&&(e.key===`/`||(e.metaKey||e.ctrlKey)&&e.key===`k`)){e.preventDefault(),P();return}if(T(i)){if(e.key===`Escape`)e.preventDefault(),I();else if(e.key===`ArrowDown`)e.preventDefault(),T(j).length&&t(b,(T(b)+1)%T(j).length);else if(e.key===`ArrowUp`)e.preventDefault(),T(j).length&&t(b,(T(b)-1+T(j).length)%T(j).length);else if(e.key===`Enter`){e.preventDefault();let t=T(j)[T(b)];t&&R(t)}}}function R(e){I(),F(e.url)}C(()=>(window.addEventListener(`keydown`,L),()=>window.removeEventListener(`keydown`,L)));var z=q(),B=s(z),V=d(B,2),J=e=>{var n=K(),i=s(n),o=d(i,2),u=a(o),m=d(a(u),2);A(m),k(m,e=>t(S,e),()=>T(S)),g(2),h(u);var C=d(u,2),w=a(C),O=e=>{M(e,U())},P=p(()=>!T(y).trim()),F=e=>{var t=W(),n=a(t);h(t),c(()=>v(n,`No matches for "${T(y)??``}".`)),M(e,t)},L=e=>{var n=f();x(s(n),17,()=>T(j),_,(e,n,i)=>{var o=G();let s;var u=a(o);let f;var p=a(u,!0);h(u);var m=d(u,2),g=a(m),_=a(g,!0);h(g);var y=d(g,2),x=a(y,!0);h(y),h(m),h(o),c(()=>{s=D(o,1,`search-hit svelte-yyldap`,null,s,{active:i===T(b)}),f=D(u,1,`search-hit-tag svelte-yyldap`,null,f,{glossary:T(n).type===`glossary`}),v(p,T(n).type===`lesson`?`Lesson`:`Term`),v(_,T(n).title),v(x,T(n).subtitle)}),l(`mouseenter`,o,()=>t(b,i,!0)),r(`click`,o,()=>R(T(n))),M(e,o)}),M(e,n)};N(w,e=>{T(P)?e(O):T(j).length===0?e(F,1):e(L,-1)}),h(C),h(o),r(`click`,i,I),E(m,()=>T(y),e=>t(y,e)),M(e,n)};N(V,e=>{T(i)&&e(J)}),r(`click`,B,P),M(e,z),o()}i([`click`]);var Y=j(`<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5"></path>`),X=j(`<path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5"></path>`),Z=n(`<div class="sidebar-backdrop svelte-129hoe0"></div>`),Q=n(`<a><span class="sidebar-num svelte-129hoe0"> </span> <span class="sidebar-link-title svelte-129hoe0"> </span></a>`),$=n(`<div class="sidebar-module svelte-129hoe0"><span class="sidebar-module-label svelte-129hoe0"> </span> <!></div>`),ee=n(`<button class="sidebar-toggle svelte-129hoe0" aria-label="Toggle menu"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><!></svg></button>  <!> <aside><a class="sidebar-logo svelte-129hoe0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" stroke="var(--color-accent)" stroke-width="1.5"></rect><text x="12" y="16" text-anchor="middle" fill="var(--color-accent)" font-size="11" font-weight="700" font-family="JetBrains Mono, monospace">Y</text></svg> <span class="sidebar-title svelte-129hoe0">YAML from Zero</span></a> <div class="sidebar-search svelte-129hoe0"><!></div> <nav class="sidebar-nav svelte-129hoe0"><!> <div class="sidebar-module svelte-129hoe0"><span class="sidebar-module-label svelte-129hoe0">Reference</span> <a><span class="sidebar-num svelte-129hoe0">§</span> <span class="sidebar-link-title svelte-129hoe0">Glossary</span></a></div></nav></aside>`,1);function te(e,n){O(n,!0);let i=m(!1),l=p(()=>L.url.pathname);function u(e){return T(l)===`${P}/${e}`||T(l)===`/${e}`}let f=p(()=>I.flatMap(e=>e.lessons));function g(){t(i,!1)}async function b(){t(i,!0),await w();let e=document.querySelector(`.sidebar .sidebar-link.active`);e&&e.scrollIntoView({block:`center`,behavior:`auto`})}var S=ee(),C=s(S),E=a(C),k=a(E),A=e=>{M(e,Y())},j=e=>{M(e,X())};N(k,e=>{T(i)?e(A):e(j,-1)}),h(E),h(C);var F=d(C,2),R=e=>{var t=Z();r(`click`,t,g),M(e,t)};N(F,e=>{T(i)&&e(R)});var z=d(F,2);let B;var V=a(z),H=d(V,2);J(a(H),{}),h(H);var U=d(H,2),W=a(U);x(W,17,()=>I,_,(e,t)=>{var n=$(),i=a(n),o=a(i);h(i),x(d(i,2),17,()=>T(t).lessons,_,(e,t)=>{let n=p(()=>T(f).indexOf(T(t))+1);var i=Q();let o;var s=a(i),l=a(s,!0);h(s);var m=d(s,2),_=a(m,!0);h(m),h(i),c((e,n)=>{y(i,`href`,`${P??``}/${T(t).slug??``}`),o=D(i,1,`sidebar-link svelte-129hoe0`,null,o,e),v(l,n),v(_,T(t).title)},[()=>({active:u(T(t).slug)}),()=>String(T(n)).padStart(2,`0`)]),r(`click`,i,g),M(e,i)}),h(n),c(()=>v(o,`Part ${T(t).id??``} · ${T(t).title??``}`)),M(e,n)});var G=d(W,2),K=d(a(G),2);let q;h(G),h(U),h(z),c(e=>{B=D(z,1,`sidebar svelte-129hoe0`,null,B,{open:T(i)}),y(V,`href`,`${P??``}/`),y(K,`href`,`${P??``}/glossary`),q=D(K,1,`sidebar-link svelte-129hoe0`,null,q,e)},[()=>({active:u(`glossary`)})]),r(`click`,C,()=>T(i)?g():b()),r(`click`,V,g),r(`click`,K,g),M(e,S),o()}i([`click`]);var ne=n(`<div class="scroll-progress svelte-abzm2"></div>`);function re(e,n){O(n,!0);let r=m(0);C(()=>{let e=document.getElementById(`main-scroll`);if(!e)return;function n(){let{scrollTop:n,scrollHeight:i,clientHeight:a}=e,o=i-a;t(r,o>0?n/o*100:0,!0)}return e.addEventListener(`scroll`,n,{passive:!0}),()=>e.removeEventListener(`scroll`,n)});var i=ne();c(()=>b(i,`width: ${T(r)??``}%`)),M(e,i),o()}var ie=n(`<!> <div class="app-shell svelte-12qhfyh"><!> <main class="main-content svelte-12qhfyh" id="main-scroll"><div class="content-inner svelte-12qhfyh"><article class="prose max-w-none" id="lesson-content"><!></article></div></main> <aside class="toc svelte-12qhfyh" id="toc-sidebar"><div class="toc-title svelte-12qhfyh">On this page</div> <nav class="toc-nav" id="toc-nav"></nav></aside></div>`,1);function ae(e,t){O(t,!0),C(()=>{let e=document.getElementById(`main-scroll`),t=new IntersectionObserver(e=>{for(let t of e)t.isIntersecting?t.target.classList.add(`visible`):t.boundingClientRect.top>0&&t.target.classList.remove(`visible`)},{root:e,threshold:.1});function n(){document.querySelectorAll(`.prose > h1, .prose > h2, .prose > h3, .prose > p, .prose > table, .prose > blockquote, .prose > ul, .prose > ol, .prose > hr, .prose > pre, .prose > .not-prose, .prose > div`).forEach((e,n)=>{e.classList.contains(`animate-in`)||(e.classList.add(`animate-in`),e.style.transitionDelay=`${Math.min(n*.04,.2)}s`,t.observe(e))})}function r(){let e=document.getElementById(`toc-nav`);e&&(e.innerHTML=``,document.querySelectorAll(`#lesson-content h2, #lesson-content h3`).forEach((t,n)=>{let r=t.id||`heading-${n}`;t.id=r;let i=document.createElement(`a`);i.href=`#${r}`,i.textContent=t.textContent||``,t.tagName===`H3`&&i.classList.add(`toc-h3`),i.addEventListener(`click`,e=>{e.preventDefault(),document.getElementById(r)?.scrollIntoView({behavior:`smooth`})}),e.appendChild(i)}))}let i;function a(){let t=document.getElementById(`toc-nav`);if(!t)return;let n=t.querySelectorAll(`a`);i&&i.disconnect(),i=new IntersectionObserver(e=>{for(let r of e)if(r.isIntersecting){n.forEach(e=>e.classList.remove(`active`));let e=t.querySelector(`a[href="#${r.target.id}"]`);e&&e.classList.add(`active`)}},{root:e,rootMargin:`-10% 0px -80% 0px`}),document.querySelectorAll(`#lesson-content h2, #lesson-content h3`).forEach(e=>{i.observe(e)})}return n(),r(),a(),u(()=>{L.url.pathname,requestAnimationFrame(()=>{n(),r(),a();let e=document.getElementById(`main-scroll`);e&&(e.scrollTop=0)})}),()=>{t.disconnect(),i&&i.disconnect()}});var n=ie(),r=s(n);re(r,{});var i=d(r,2),c=a(i);te(c,{});var l=d(c,2),f=a(l),p=a(f);S(a(p),()=>t.children),h(p),h(f),h(l),g(2),h(i),M(e,n),o()}export{ae as component,R as universal};