globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, r as renderTemplate, e as defineScriptVars, d as renderScript, f as renderComponent, a as createAstro, m as maybeRenderHead, g as addAttribute } from '../../chunks/astro/server_C0dJqwLY.mjs';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_BxMdf4w7.mjs';
/* empty css                                       */
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Schedule = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Schedule;
  const url = Astro2.url;
  const svc = url.searchParams.get("s") || "";
  const svcName = url.searchParams.get("n") || "";
  const dur = parseInt(url.searchParams.get("d") || "55");
  if (!svc || !svcName) return Astro2.redirect("/book/");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buffer = 5;
  let price = 0;
  let slotData = {};
  let dates = [];
  try {
    const DB = Astro2.locals.runtime.env.DB;
    const s = await DB.prepare("SELECT price FROM services WHERE slug = ? AND active = 1").bind(svc).first();
    if (s) price = s.price;
    const rows = await DB.prepare("SELECT day_of_week, start_time, end_time FROM availability").all();
    for (const r of rows.results || []) {
      const [sh, sm] = r.start_time.split(":").map(Number);
      const [eh, em] = r.end_time.split(":").map(Number);
      let cur = sh * 60 + sm, end = eh * 60 + em;
      while (cur + dur <= end) {
        const h = Math.floor(cur / 60), m = cur % 60;
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const time = h12 + ":" + String(m).padStart(2, "0") + " " + ampm;
        (slotData[r.day_of_week] ||= []).push(time);
        cur += dur + buffer;
      }
    }
    const availDays = Object.keys(slotData).map(Number);
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    let d = new Date(today);
    d.setDate(d.getDate() + 1);
    while (dates.length < 5) {
      if (availDays.includes(d.getDay())) {
        dates.push({ iso: d.toISOString().split("T")[0], day: d.getDate(), dow: d.getDay(), dowName: dayNames[d.getDay()], month: monthNames[d.getMonth()] });
      }
      d.setDate(d.getDate() + 1);
    }
  } catch {
  }
  const pageData = JSON.stringify({ svc, svcName, price, slotData });
  return renderTemplate(_a || (_a = __template(["", "  ", " <script>(function(){", `
(function(){
  const PD = JSON.parse(pageData);
  const svc = PD.svc, svcName = PD.svcName, price = PD.price;
  const slotMap = {};
  for (const [k, v] of Object.entries(PD.slotData || {})) slotMap[parseInt(k)] = v;

  let selDate = null, selTime = null, oPrice = price, dPrice = price, appliedCoupon = null;

  function u() {
    const btn = document.getElementById('pay-btn');
    if (dPrice < oPrice) btn.innerHTML = '\u20B9' + dPrice.toLocaleString('en-IN') + ' <s style="opacity:0.6;font-weight:400;">\u20B9' + oPrice.toLocaleString('en-IN') + '</s>';
    else btn.textContent = oPrice ? '\u20B9' + oPrice.toLocaleString('en-IN') : '\u20B9 \u2014';
  }

  document.querySelectorAll('.date-pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.date-pill').forEach(d => d.classList.remove('sel'));
      btn.classList.add('sel'); selDate = btn.dataset.date;
      document.getElementById('date-error').style.display = 'none';
      const c = document.getElementById('time-slots');
      selTime = null; document.getElementById('time-error').style.display = 'none'; c.innerHTML = '';
      const times = slotMap[parseInt(btn.dataset.dow)] || [];
      if (!times.length) { c.innerHTML = '<span class="no-slots">No slots for this day.</span>'; return; }
      fetch('/api/booked-slots?date=' + encodeURIComponent(selDate)).then(r => r.json()).then(d => {
        const booked = new Set(d.slots || []); c.innerHTML = ''; let any = false;
        times.forEach(t => {
          if (booked.has(t)) return; any = true;
          const el = document.createElement('span'); el.className = 'slot'; el.textContent = t; el.dataset.time = t;
          el.onclick = () => { c.querySelectorAll('.slot').forEach(x => x.classList.remove('sel')); el.classList.add('sel'); selTime = t; document.getElementById('time-error').style.display = 'none'; };
          c.appendChild(el);
        });
        if (!any) c.innerHTML = '<span class="no-slots">All slots booked.</span>';
      }).catch(() => { c.innerHTML = '<span class="no-slots">Could not load slots.</span>'; });
    };
  });

  document.getElementById('apply-coupon').onclick = async () => {
    const code = document.getElementById('coupon').value.trim();
    const msg = document.getElementById('coupon-msg');
    if (!code) { msg.textContent = ''; return; }
    msg.style.color = 'var(--muted)'; msg.textContent = 'Checking...';
    try {
      const r = await fetch('/api/validate-coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, service: svc, price: oPrice }) });
      const data = await r.json();
      if (data.valid) { dPrice = data.discountedPrice; appliedCoupon = code; msg.style.color = '#3A5A40'; msg.textContent = data.discountPercent + '% off'; }
      else { dPrice = oPrice; appliedCoupon = null; msg.style.color = '#9A3324'; msg.textContent = data.error; }
      u();
    } catch (_) { msg.textContent = 'Error checking coupon.'; }
  };
  document.getElementById('coupon').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('apply-coupon').click(); } };

  document.getElementById('pay-btn').onclick = async () => {
    const n = document.getElementById('name').value.trim();
    const e = document.getElementById('email').value.trim();
    const ph = document.getElementById('phone').value.trim();
    const about = document.getElementById('about').value.trim();
    const exp = document.getElementById('experience').value.trim();
    const comp = document.getElementById('company').value.trim();
    const ans = JSON.stringify({ about, experience: exp, company: comp });
    let ok = true;
    if(!selDate){ document.getElementById('date-error').style.display='block'; ok=false; }
    if(!selTime){ document.getElementById('time-error').style.display='block'; ok=false; }
    if(!n || !e || !e.includes('@')){ alert('Enter name and valid email.'); ok=false; }
    if(!about){ alert('Tell us what the call is about.'); ok=false; }
    if(!exp){ alert('Enter your industry experience.'); ok=false; }
    if(!comp){ alert('Enter your current company.'); ok=false; }
    if(!ok) return;
    const btn = document.getElementById('pay-btn');
    btn.textContent = 'Processing...'; btn.disabled = true;
    try {
      const r = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service: svc, serviceName: svcName, price: dPrice, originalPrice: oPrice, date: selDate, time: selTime, name: n, email: e, phone: ph, answersJson: ans, couponCode: appliedCoupon }) });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      if (data.free) { location.href = '/book/confirmed/?orderId=' + data.orderId; return; }
      new Razorpay({ key: 'rzp_test_SkCAElXSARTppL', amount: dPrice * 100, currency: 'INR', name: svcName, description: selDate + ' at ' + selTime, order_id: data.orderId, handler: (resp) => { location.href = '/book/confirmed/?orderId=' + data.orderId + '&paymentId=' + resp.razorpay_payment_id + '&signature=' + resp.razorpay_signature; }, prefill: { name: n, email: e, contact: ph }, theme: { color: '#C45D2C' } }).open();
    } catch (_) { alert('Something went wrong. Try again.'); }
    u(); btn.disabled = false;
  };
})();
})();<\/script>`])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": `Book \u2014 ${svcName}`, "data-astro-cid-piw3woh4": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<nav data-astro-cid-piw3woh4> <a href="https://akarshanarora.com" class="nav-brand" data-astro-cid-piw3woh4>Akarshan Arora</a> <div class="nav-links" data-astro-cid-piw3woh4> <a href="https://akarshanarora.com" data-astro-cid-piw3woh4>Who am I</a> <a href="https://www.linkedin.com/in/aroraakarshan/" target="_blank" rel="noopener" data-astro-cid-piw3woh4>LinkedIn</a> <a href="https://topmate.io/akarshanarora" target="_blank" rel="noopener" class="nav-cta" data-astro-cid-piw3woh4>Book a 1:1</a> </div> </nav> <div class="container" data-astro-cid-piw3woh4> <a href="/book/" class="back-link" data-astro-cid-piw3woh4>&larr; Back</a> <p class="eyebrow" data-astro-cid-piw3woh4>1-on-1 Session</p> <h1 data-astro-cid-piw3woh4>${svcName}</h1> <p class="service-meta" data-astro-cid-piw3woh4>${dur} min &middot; ${price ? "\u20B9" + price.toLocaleString("en-IN") : "\u2014"}</p> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Pick a date</label> <div id="date-error" class="err" data-astro-cid-piw3woh4>Select a date to continue.</div> <div class="date-pills" id="date-pills" data-astro-cid-piw3woh4> ${dates.map((d) => renderTemplate`<button type="button" class="date-pill"${addAttribute(d.iso, "data-date")}${addAttribute(d.dow, "data-dow")} data-astro-cid-piw3woh4> <span class="date-pill-dow" data-astro-cid-piw3woh4>${d.dowName}</span> <span class="date-pill-num" data-astro-cid-piw3woh4>${d.day} ${d.month}</span> </button>`)} </div> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Pick a time</label> <div id="time-error" class="err" data-astro-cid-piw3woh4>Select a time slot.</div> <div id="time-slots" data-astro-cid-piw3woh4></div> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Name</label> <input type="text" id="name" required placeholder="Your full name" data-astro-cid-piw3woh4> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Email</label> <input type="email" id="email" required placeholder="you@example.com" data-astro-cid-piw3woh4> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Phone (optional)</label> <input type="tel" id="phone" placeholder="+91 99999 99999" data-astro-cid-piw3woh4> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>What is the call about? <span style="color:#C45D2C" data-astro-cid-piw3woh4>*</span></label> <textarea id="about" required rows="3" placeholder="Topics you want to discuss, questions, goals..." style="width:100%;padding:0.7rem 0.85rem;background:var(--surface);border:1px solid var(--hairline);border-radius:8px;color:var(--ink);font-size:0.9rem;font-family:inherit;resize:vertical;" data-astro-cid-piw3woh4></textarea> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Industry Experience <span style="color:#C45D2C" data-astro-cid-piw3woh4>*</span></label> <input type="text" id="experience" required placeholder="e.g. 2.5 years, 5+ years" data-astro-cid-piw3woh4> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Current Company <span style="color:#C45D2C" data-astro-cid-piw3woh4>*</span></label> <input type="text" id="company" required placeholder="e.g. Synopsys, Intel" data-astro-cid-piw3woh4> </div> <div class="field" data-astro-cid-piw3woh4> <label data-astro-cid-piw3woh4>Coupon code (optional)</label> <div style="display:flex; gap:0.5rem;" data-astro-cid-piw3woh4> <input type="text" id="coupon" placeholder="Enter code" style="flex:1;" data-astro-cid-piw3woh4> <button type="button" id="apply-coupon" class="btn" style="width:auto; padding:0.7rem 1.2rem; font-size:0.82rem;" data-astro-cid-piw3woh4>Apply</button> </div> <div id="coupon-msg" style="font-size:0.78rem; margin-top:0.3rem;" data-astro-cid-piw3woh4></div> </div> <button type="button" id="pay-btn" class="btn" data-astro-cid-piw3woh4>${price ? "\u20B9" + price.toLocaleString("en-IN") : "\u20B9 \u2014"}</button> </div> <footer data-astro-cid-piw3woh4> <a href="https://akarshanarora.com" data-astro-cid-piw3woh4>akarshanarora.com</a> &nbsp;&middot;&nbsp; <a href="/" data-astro-cid-piw3woh4>Courses</a> &nbsp;&middot;&nbsp; <a href="/resources/" data-astro-cid-piw3woh4>Guides</a> </footer> ` }), renderScript($$result, "/Users/akarshanarora/Developers/courses/src/pages/book/schedule.astro?astro&type=script&index=0&lang.ts"), defineScriptVars({ pageData }));
}, "/Users/akarshanarora/Developers/courses/src/pages/book/schedule.astro", void 0);

const $$file = "/Users/akarshanarora/Developers/courses/src/pages/book/schedule.astro";
const $$url = "/book/schedule";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Schedule,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
