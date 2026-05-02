<script>
  let { data } = $props();
  let code = $state(''), discount = $state(0), service = $state(''), max_uses = $state(0);
  const products = data.products || [];

  async function add() {
    await fetch('/admin/api/coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, discount_percent: discount, product_slug: service, max_uses }) });
    code = ''; discount = 0; service = ''; max_uses = 0; location.reload();
  }

  async function del(c) {
    await fetch('/admin/api/coupon', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c }) });
    location.reload();
  }

  let coupons = $state([]);
  async function loadCp() {
    const r = await fetch('/admin/api/coupons');
    coupons = await r.json();
  }
  $effect(() => { loadCp(); });
</script>

<div class="page">
  <div class="header"><div><h1>Coupons</h1><p>{coupons.length} active</p></div></div>

  <div class="form-card">
    <div style="display:flex;gap:.5rem;align-items:end;flex-wrap:wrap;">
      <div class="field"><label>Code</label><input bind:value={code} placeholder="SAVE20"/></div>
      <div class="field" style="width:100px;"><label>Discount %</label><input type="number" bind:value={discount}/></div>
      <div class="field" style="min-width:200px;"><label>Product (optional)</label>
        <select bind:value={service}>
          <option value="">All paid products</option>
          {#each products as p}<option value={p.slug}>{p.name} — ₹{p.price}</option>{/each}
        </select>
      </div>
      <div class="field" style="width:90px;"><label>Max Uses</label><input type="number" bind:value={max_uses}/></div>
      <button onclick={add} class="btn-primary">Add</button>
    </div>
  </div>

  <div class="coupon-list">
    {#each coupons as c}
      <div class="coupon-card">
        <div class="coupon-left">
          <div class="coupon-code">{c.code}</div>
          <div class="coupon-detail">{c.discount_percent}% off · {c.product_slug || 'All products'} · {c.used}/{c.max_uses || '∞'} used</div>
        </div>
        <button onclick={() => del(c.code)} class="btn-remove">Remove</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .page { max-width:700px; margin:0 auto; }
  .header { margin-bottom:1.5rem; }
  .header h1 { font-size:1.5rem; font-weight:800; margin:0; }
  .header p { color:#888; font-size:.82rem; margin:2px 0 0; }
  .form-card { background:#fff; border:1px solid #eee; border-radius:14px; padding:1.25rem; margin-bottom:1.5rem; }
  .field { display:flex; flex-direction:column; gap:.25rem; }
  .field label { font-size:.72rem; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.04em; }
  .field input, .field select { padding:.5rem .7rem; border:1.5px solid #e5e5e0; border-radius:8px; font-size:.84rem; font-family:inherit; }
  .field input:focus, .field select:focus { outline:none; border-color:var(--accent); }
  .btn-primary { padding:.55rem 1.3rem; background:var(--accent); color:#fff; border:none; border-radius:8px; font-size:.84rem; font-weight:600; cursor:pointer; }
  .coupon-list { display:grid; gap:.5rem; }
  .coupon-card { background:#fff; border:1px solid #eee; border-radius:12px; padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center; }
  .coupon-code { font-weight:700; font-size:1rem; }
  .coupon-detail { font-size:.8rem; color:var(--muted); margin-top:2px; }
  .btn-remove { padding:.35rem .9rem; background:#fef2f2; color:#dc2626; border:none; border-radius:6px; font-size:.75rem; font-weight:600; cursor:pointer; }
</style>
