<script>
  let { data } = $props();
  import { onMount } from 'svelte';

  let selDate = $state(null), selTime = $state(null);
  let oPrice = $state(data.price), dPrice = $state(data.price), coupon = $state(null);
  let couponMsg = $state(''), couponValid = $state(false);
  let loading = $state(false);

  let slotMap = $state({});
  $effect(() => { const m = {}; if (data.slotData) for (const [k, v] of Object.entries(data.slotData)) m[+k] = v; slotMap = m; });

  function fmt(p) { return '₹' + (p || 0).toLocaleString('en-IN'); }

  function selectDate(e) {
    const btn = e.currentTarget;
    document.querySelectorAll('.date-pill').forEach(d => d.classList.remove('sel'));
    btn.classList.add('sel');
    selDate = btn.dataset.date;
    selTime = null;
    document.getElementById('time-error').style.display = 'none';
    const dow = parseInt(btn.dataset.dow);
    const times = slotMap[dow] || [];
    if (!times.length) { document.getElementById('time-slots').innerHTML = '<span class="no-slots">No slots for this day.</span>'; return; }
    document.getElementById('time-slots').innerHTML = '';
    fetch('/api/booked-slots?date=' + encodeURIComponent(selDate)).then(r => r.json()).then(d => {
      const booked = new Set(d.slots || []);
      const c = document.getElementById('time-slots'); c.innerHTML = ''; let any = false;
      times.forEach(t => {
        if (booked.has(t)) return; any = true;
        const el = document.createElement('span'); el.className = 'slot'; el.textContent = t; el.dataset.time = t;
        el.onclick = () => { c.querySelectorAll('.slot').forEach(x => x.classList.remove('sel')); el.classList.add('sel'); selTime = t; };
        c.appendChild(el);
      });
      if (!any) c.innerHTML = '<span class="no-slots">All slots booked.</span>';
    });
  }

  async function applyCoupon() {
    const code = document.getElementById('coupon').value.trim();
    if (!code) { couponMsg = ''; couponValid = false; return; }
    couponMsg = 'Checking...'; couponValid = false;
    try {
      const r = await fetch('/api/validate-coupon', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, service: data.svc, price: oPrice }) });
      const d = await r.json();
      if (d.valid) { dPrice = d.discountedPrice; coupon = code; couponMsg = d.discountPercent + '% off'; couponValid = true; }
      else { dPrice = oPrice; coupon = null; couponMsg = d.error || 'Invalid'; couponValid = false; }
    } catch { couponMsg = 'Error checking coupon.'; }
  }

  async function pay() {
    const n = document.getElementById('name').value.trim();
    const e = document.getElementById('email').value.trim();
    const ph = document.getElementById('phone').value.trim();
    const about = document.getElementById('about').value.trim();
    const exp = document.getElementById('experience').value.trim();
    const comp = document.getElementById('company').value.trim();
    if (!selDate) { document.getElementById('date-error').style.display='block'; return; }
    if (!selTime) { document.getElementById('time-error').style.display='block'; return; }
    if (!n || !e || !e.includes('@')) { alert('Enter name and valid email.'); return; }
    if (!about) { alert('Tell us what the call is about.'); return; }
    if (!exp) { alert('Enter your industry experience.'); return; }
    if (!comp) { alert('Enter your current company.'); return; }
    loading = true;
    try {
      const ans = JSON.stringify({ about, experience: exp, company: comp });
      const r = await fetch('/api/create-order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ service: data.svc, serviceName: data.svcName, price: dPrice, originalPrice: oPrice, date: selDate, time: selTime, name: n, email: e, phone: ph, answersJson: ans, couponCode: coupon }) });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      if (d.free) { location.href = '/book/confirmed?orderId=' + d.orderId; return; }
      new Razorpay({ key:'rzp_test_SkCAElXSARTppL', amount:dPrice*100, currency:'INR', name:data.svcName, description:selDate+' at '+selTime, order_id:d.orderId, handler:(r) => { location.href='/book/confirmed?orderId='+d.orderId+'&paymentId='+r.razorpay_payment_id+'&signature='+r.razorpay_signature; }, prefill:{name:n,email:e,contact:ph}, theme:{color:'#C45D2C'} }).open();
    } catch { alert('Something went wrong. Try again.'); }
    loading = false;
  }

  onMount(() => { document.getElementById('coupon').onkeydown = e => { if (e.key==='Enter') { e.preventDefault(); applyCoupon(); } }; });
</script>

<svelte:head>
  <title>Book — {data.svcName} — Akarshan Arora</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</svelte:head>

<div class="container">
  <a href="/book/" class="back-link">← Back</a>
  <p class="eyebrow">1-on-1 Session</p>
  <h1>{data.svcName}</h1>
  <p class="svc-meta">{data.dur} min · {data.price ? fmt(data.price) : '—'}</p>

  <div class="field">
    <label>Pick a date</label>
    <div id="date-error" class="err">Select a date to continue.</div>
    <div class="date-pills">
      {#each data.dates as d}
        <button type="button" class="date-pill" data-date={d.iso} data-dow={d.dow} onclick={selectDate}>
          <span class="date-pill-dow">{d.dowName}</span>
          <span class="date-pill-num">{d.day} {d.month}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="field">
    <label>Pick a time</label>
    <div id="time-error" class="err">Select a time slot.</div>
    <div id="time-slots"></div>
  </div>

  <div class="field"><label>Name</label><input type="text" id="name" required placeholder="Your full name" /></div>
  <div class="field"><label>Email</label><input type="email" id="email" required placeholder="you@example.com" /></div>
  <div class="field"><label>Phone (optional)</label><input type="tel" id="phone" placeholder="+91 99999 99999" /></div>

  <div class="field"><label>What is the call about? <span style="color:#C45D2C">*</span></label><textarea id="about" required rows="3" placeholder="Topics you want to discuss, questions, goals..." style="width:100%;padding:0.7rem 0.85rem;background:var(--surface);border:1px solid var(--hairline);border-radius:8px;color:var(--ink);font-size:0.9rem;font-family:inherit;resize:vertical;"></textarea></div>
  <div class="field"><label>Industry Experience <span style="color:#C45D2C">*</span></label><input type="text" id="experience" required placeholder="e.g. 2.5 years, 5+ years" /></div>
  <div class="field"><label>Current Company <span style="color:#C45D2C">*</span></label><input type="text" id="company" required placeholder="e.g. Synopsys, Intel" /></div>

  <div class="field">
    <label>Coupon code (optional)</label>
    <div style="display:flex;gap:0.5rem;">
      <input type="text" id="coupon" placeholder="Enter code" style="flex:1;" />
      <button type="button" id="apply-coupon" class="btn" style="width:auto;padding:0.7rem 1.2rem;font-size:0.82rem;" onclick={applyCoupon}>Apply</button>
    </div>
    {#if couponMsg}
      <div style="font-size:0.78rem;margin-top:0.3rem;color:{couponValid ? '#3A5A40' : '#9A3324'}">{couponMsg}</div>
    {/if}
  </div>

  <button type="button" id="pay-btn" class="btn" onclick={pay} disabled={loading}>
    {#if dPrice < oPrice}
      {@html '₹' + dPrice.toLocaleString('en-IN') + ' <s style="opacity:0.6;font-weight:400;">₹' + oPrice.toLocaleString('en-IN') + '</s>'}
    {:else if oPrice}
      {fmt(oPrice)}
    {:else}
      ₹ —
    {/if}
  </button>
</div>

<style>
  .container { max-width:480px;margin:0 auto;padding:2rem 1.5rem 4rem; }
  .eyebrow { font-family:'JetBrains Mono',monospace;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.2em;color:var(--accent);margin-bottom:0.5rem; }
  h1 { font-size:2rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.2rem; }
  .svc-meta { color:var(--muted);margin-bottom:2rem; }
  .err { display:none;color:#9A3324;font-size:0.78rem;margin-bottom:0.5rem;margin-top:0.35rem; }
  .date-pills { display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;scrollbar-width:none; }
  .date-pill { flex:0 0 auto;display:flex;flex-direction:column;align-items:center;padding:0.55rem 0.9rem;border:1.5px solid var(--hairline);border-radius:12px;background:var(--surface);cursor:pointer;font-family:inherit;transition:all 0.15s;min-width:68px; }
  .date-pill:hover { border-color:var(--accent);background:#fdf8f5; }
  .date-pill.sel { background:var(--accent);border-color:var(--accent);color:#fff; }
  .date-pill-dow { font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;opacity:0.7; }
  .date-pill.sel .date-pill-dow { opacity:0.85; }
  .date-pill-num { font-size:0.92rem;font-weight:700;margin-top:1px; }
  #time-slots { display:flex;flex-wrap:wrap;gap:0.45rem;min-height:2.5rem;align-items:center; }
  :global(.slot) { display:inline-block;padding:0.55rem 1.1rem;border:1.5px solid var(--hairline);border-radius:10px;font-size:0.88rem;cursor:pointer;background:var(--surface);font-family:'JetBrains Mono',monospace;font-weight:500;transition:all 0.12s; }
  :global(.slot:hover) { border-color:var(--accent);background:#fdf8f5; }
  :global(.slot.sel) { background:var(--accent);color:#fff;border-color:var(--accent);font-weight:700; }
  :global(.no-slots) { color:var(--muted);font-size:0.85rem;font-style:italic; }
  .field { margin-bottom:1rem; }
  .field label { display:block;font-family:'JetBrains Mono',monospace;font-size:0.68rem;font-weight:500;color:#A3A39E;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.4rem; }
  .field input { width:100%;padding:0.7rem 0.85rem;background:var(--surface);border:1px solid var(--hairline);border-radius:8px;color:var(--ink);font-size:0.9rem;font-family:inherit; }
  .field input:focus { outline:none;border-color:var(--accent); }
  .btn { width:100%;padding:0.8rem;margin-top:0.5rem;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:0.92rem;font-weight:600;font-family:inherit;cursor:pointer;white-space:normal; }
  .btn:hover { background:#a84c1f; }
  .btn:disabled { opacity:0.5;pointer-events:none; }
  .back-link { color:var(--tertiary);text-decoration:none;font-size:0.85rem;display:inline-block;margin-bottom:2rem; }
</style>
