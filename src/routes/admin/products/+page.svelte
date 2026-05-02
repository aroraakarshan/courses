<script>
  let { data } = $props();
  const products = data.products || [];
  function fp(n) { return '₹' + (n||0).toLocaleString('en-IN'); }
  async function toggle(slug) { await fetch('/admin/api/product', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) }); location.reload(); }
</script>

<div class="page">
  <div class="header">
    <div><h1>Products</h1><p>{products.length} active</p></div>
    <a href="/admin/products/edit" class="btn-primary">+ Create Product</a>
  </div>

  <div class="product-grid">
    {#each products as p}
      <a href="/admin/products/edit?slug={p.slug}" class="product-card" class:inactive={!p.active}>
        <div class="card-top">
          <span class="kind-tag tag-{p.kind}">{p.kind === 'call' ? '1:1 Call' : p.kind === 'resource' ? 'Resource' : p.kind}</span>
          <span class="status-dot" class:active-dot={p.active}></span>
        </div>
        <h3>{p.name}</h3>
        <div class="card-meta">
          <span class="price">{p.pricing === 'pwyw' ? 'From ' + fp(p.min_price) : fp(p.price)}</span>
          {#if p.pricing === 'pwyw' && p.initial_price > 0}<span class="suggested">Suggested {fp(p.initial_price)}</span>{/if}
          {#if p.discount_percent > 0}<span class="discount">-{p.discount_percent}%</span>{/if}
          {#if p.kind === 'call'}<span class="duration">{p.duration_minutes} min</span>{/if}
        </div>
        {#if p.description}<p class="desc">{p.description}</p>{/if}
        <div class="card-footer">
          <span class="questions-count">{p.questions ? JSON.parse(p.questions||'[]').length : 0} questions</span>
        </div>
      </a>
    {/each}
  </div>
</div>

<style>
  .page { max-width:1100px; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
  .header h1 { font-size:1.5rem; font-weight:800; margin:0; }
  .header p { color:#888; font-size:.82rem; margin:2px 0 0; }
  .btn-primary { padding:.55rem 1.3rem; background:var(--accent); color:#fff; border-radius:8px; text-decoration:none; font-size:.84rem; font-weight:600; display:inline-block; }
  .product-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }
  .product-card { background:#fff; border:1px solid #eee; border-radius:14px; padding:1.25rem; text-decoration:none; color:inherit; display:block; transition:box-shadow .2s, border-color .2s; }
  .product-card:hover { box-shadow:0 4px 20px rgba(0,0,0,0.08); border-color:#ddd; }
  .product-card.inactive { opacity:0.5; }
  .card-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
  .kind-tag { display:inline-block; padding:3px 8px; border-radius:5px; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; }
  .tag-call { background:#fdf5f3; color:var(--accent); }
  .tag-resource { background:#eff6ff; color:#2563eb; }
  .tag-course { background:#ecfdf5; color:#059669; }
  .tag-package { background:#faf5ff; color:#7c3aed; }
  .tag-dm { background:#fffbeb; color:#d97706; }
  .tag-webinar { background:#fef2f2; color:#dc2626; }
  .status-dot { width:8px; height:8px; border-radius:50%; background:#ddd; }
  .status-dot.active-dot { background:#22c55e; }
  .product-card h3 { font-size:.95rem; font-weight:700; margin:0 0 .5rem; }
  .card-meta { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; margin-bottom:.5rem; }
  .price { font-weight:700; color:var(--accent); font-size:.9rem; }
  .suggested { font-size:.72rem; color:var(--muted); }
  .discount { background:#fef2f2; color:#dc2626; padding:1px 6px; border-radius:4px; font-size:.7rem; font-weight:600; }
  .duration { color:#888; font-size:.8rem; }
  .desc { font-size:.8rem; color:#888; line-height:1.5; margin:0 0 .75rem; }
  .card-footer { border-top:1px solid #f5f5f5; padding-top:.75rem; }
  .questions-count { font-size:.72rem; color:#bbb; }
</style>
