<script>
  let { data } = $props();
  const s = data.stats || {};
  const fn = (n) => (n||0).toLocaleString('en-IN');
  const fp = (n) => '₹' + (n||0).toLocaleString('en-IN');
  const recent = data.recent || [];
  let updating = $state(null);

  async function updateStatus(id, status) {
    updating = id;
    await fetch('/admin/api/update-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    updating = null;
  }
</script>

<div class="page">
  <div class="header">
    <div>
      <h1>Dashboard</h1>
      <p>Overview of your business</p>
    </div>
    <a href="/admin/products" class="btn-primary">+ New Product</a>
  </div>

  <div class="stats-grid">
    <div class="stat">
      <div class="stat-num">{fn(s.products)}</div>
      <div class="stat-label">Active Products</div>
    </div>
    <div class="stat">
      <div class="stat-num">{fn(s.bookings)}</div>
      <div class="stat-label">Total Bookings</div>
    </div>
    <div class="stat">
      <div class="stat-num">{fn(s.downloads)}</div>
      <div class="stat-label">Downloads</div>
    </div>
    <div class="stat highlight">
      <div class="stat-num">{fp(s.revenue)}</div>
      <div class="stat-label">Revenue</div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <h2>Recent Activity</h2>
      <a href="/admin/bookings">View all →</a>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Date</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          {#each recent as r}
            <tr>
              <td class="date-cell">{r.date || '—'}<span>{r.time || '—'}</span></td>
              <td class="cust-cell">{r.name}<span>{r.email}</span></td>
              <td>{r.product_name || r.resource || '—'}</td>
              <td class="price-cell">{fp(r.price)}</td>
              <td><span class="badge badge-{r.status}">{r.status}</span></td>
              <td class="actions">
                {#if r.status === 'pending'}
                  <button onclick={() => updateStatus(r.id, 'confirmed')} disabled={updating === r.id} class="btn-sm btn-confirm">{updating === r.id ? '...' : 'Confirm'}</button>
                  <button onclick={() => updateStatus(r.id, 'cancelled')} disabled={updating === r.id} class="btn-sm btn-cancel">Cancel</button>
                {:else if r.status === 'confirmed'}
                  <button onclick={() => updateStatus(r.id, 'cancelled')} disabled={updating === r.id} class="btn-sm btn-cancel">Cancel</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .page { max-width:1100px; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:start; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; }
  .header h1 { font-size:1.6rem; font-weight:800; letter-spacing:-0.03em; margin:0; }
  .header p { color:#888; font-size:.85rem; margin:2px 0 0; }
  .btn-primary { display:inline-block; padding:.55rem 1.25rem; background:var(--accent); color:#fff; border-radius:8px; text-decoration:none; font-size:.84rem; font-weight:600; transition:filter .15s; }
  .btn-primary:hover { filter:brightness(0.9); }
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
  .stat { background:#fff; border:1px solid #eee; border-radius:12px; padding:1.5rem; transition:box-shadow .2s; }
  .stat:hover { box-shadow:0 2px 12px rgba(0,0,0,0.04); }
  .stat-num { font-size:1.8rem; font-weight:800; letter-spacing:-0.02em; }
  .stat-label { font-size:.82rem; color:#888; margin-top:4px; }
  .stat.highlight { background:var(--accent); border-color:var(--accent); }
  .stat.highlight .stat-num,.stat.highlight .stat-label { color:#fff; }
  .stat.highlight .stat-label { opacity:0.8; }
  .card { background:#fff; border:1px solid #eee; border-radius:14px; overflow:hidden; }
  .card-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-bottom:1px solid #f0f0f0; }
  .card-header h2 { font-size:1rem; font-weight:700; margin:0; }
  .card-header a { font-size:.82rem; color:var(--accent); text-decoration:none; font-weight:600; }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; }
  th { padding:.6rem 1rem; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:#999; text-align:left; background:#fafaf9; }
  td { padding:.7rem 1rem; font-size:.84rem; border-top:1px solid #f5f5f5; }
  .date-cell span, .cust-cell span { display:block; font-size:.75rem; color:#aaa; }
  .price-cell { font-weight:600; }
  .badge { display:inline-block; padding:3px 8px; border-radius:5px; font-size:.7rem; font-weight:600; text-transform:uppercase; }
  .badge-confirmed { background:#ecfdf5; color:#059669; }
  .badge-pending { background:#fffbeb; color:#d97706; }
  .badge-downloaded { background:#eff6ff; color:#2563eb; }
  .badge-cancelled { background:#fef2f2; color:#dc2626; }
  .badge-refunded { background:#faf5ff; color:#7c3aed; }
  .badge-failed { background:#fef2f2; color:#991b1b; }
  .actions { display:flex; gap:.35rem; }
  .btn-sm { padding:.3rem .75rem; border:none; border-radius:6px; font-size:.73rem; font-weight:600; cursor:pointer; transition:opacity .15s; }
  .btn-sm:disabled { opacity:0.5; cursor:default; }
  .btn-confirm { background:#ecfdf5; color:#059669; }
  .btn-confirm:hover { background:#d1fae5; }
  .btn-cancel { background:#fef2f2; color:#dc2626; }
  .btn-cancel:hover { background:#fee2e2; }
  @media(max-width:768px){ .stats-grid{grid-template-columns:repeat(2,1fr)} }
</style>
