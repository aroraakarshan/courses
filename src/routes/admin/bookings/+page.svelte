<script>
  let { data } = $props();
  let bookings = $state(data.bookings || []);
  let filter = $state('all');
  let search = $state('');
  let updating = $state(null);

  const filtered = $derived(bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.name?.toLowerCase().includes(search.toLowerCase()) && !b.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }));

  function fp(n) { return '₹' + (n||0).toLocaleString('en-IN'); }
  const statuses = ['all','pending','confirmed','cancelled','refunded','downloaded','failed'];

  async function updateStatus(id, status) {
    updating = id;
    await fetch('/admin/api/update-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    bookings = bookings.map(b => b.id === id ? { ...b, status } : b);
    updating = null;
  }
</script>

<div class="page">
  <div class="header">
    <div><h1>Bookings</h1><p>{filtered.length} {filter !== 'all' ? filter : 'total'}</p></div>
  </div>

  <div class="filters">
    <input type="text" bind:value={search} placeholder="Search by name or email..." class="search"/>
    <div class="status-filters">
      {#each statuses as s}
        <button class="filter-btn" class:active={filter === s} onclick={() => filter = s}>{s === 'all' ? 'All' : s}</button>
      {/each}
    </div>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Booking</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {#each filtered as b}
            <tr>
              <td>
                <div class="date">{b.date || '—'}</div>
                <div class="time">{b.time || '—'} {b.end_time ? '→ ' + b.end_time : ''}</div>
                <div class="ids">
                  {#if b.purchase_id}<span title="Purchase ID">🛒 {b.purchase_id.slice(0,12)}</span>{/if}
                  {#if b.booking_id}<span title="Booking ID">📅 {b.booking_id.slice(0,12)}</span>{/if}
                  {#if b.payment_id && b.payment_id !== 'free'}<span title="Payment ID" class="pid">💳 {b.payment_id}</span>{/if}
                </div>
              </td>
              <td>
                <div class="name">{b.name}</div>
                <div class="email">{b.email}</div>
                {#if b.phone}<div class="phone">{b.phone}</div>{/if}
              </td>
              <td>
                <div class="product-name">{b.product_name}</div>
                <span class="kind-tag tag-{b.product_kind}">{b.product_kind}</span>
              </td>
              <td class="price-cell">{fp(b.price)}</td>
              <td><span class="badge badge-{b.status}">{b.status}</span></td>
              <td>
                <div class="actions">
                  {#if b.status === 'pending'}
                    <button onclick={() => updateStatus(b.id, 'confirmed')} disabled={updating === b.id} class="btn-act btn-confirm">{updating === b.id ? '...' : 'Confirm'}</button>
                    <button onclick={() => updateStatus(b.id, 'cancelled')} disabled={updating === b.id} class="btn-act btn-cancel">Cancel</button>
                  {:else if b.status === 'confirmed'}
                    <button onclick={() => updateStatus(b.id, 'cancelled')} disabled={updating === b.id} class="btn-act btn-cancel">Cancel</button>
                    <button onclick={async () => { updating = b.id; await fetch('/admin/api/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id }) }); bookings = bookings.map(x => x.id === b.id ? { ...x, status: 'refunded' } : x); updating = null; }} disabled={updating === b.id} class="btn-act btn-refund">Refund</button>
                  {:else if b.status === 'cancelled'}
                    <button onclick={() => updateStatus(b.id, 'confirmed')} disabled={updating === b.id} class="btn-act btn-confirm">Restore</button>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr><td colspan="6" class="empty">No bookings found</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .page { max-width:1200px; margin:0 auto; }
  .header { margin-bottom:1.5rem; }
  .header h1 { font-size:1.5rem; font-weight:800; margin:0; }
  .header p { color:#888; font-size:.82rem; margin:2px 0 0; }
  .filters { display:flex; gap:1rem; margin-bottom:1rem; flex-wrap:wrap; align-items:center; }
  .search { padding:.5rem .75rem; border:1.5px solid #e5e5e0; border-radius:8px; font-size:.84rem; font-family:inherit; width:250px; }
  .search:focus { outline:none; border-color:var(--accent); }
  .status-filters { display:flex; gap:.25rem; flex-wrap:wrap; }
  .filter-btn { padding:.3rem .7rem; border:1px solid #e5e5e0; border-radius:6px; background:#fff; font-size:.75rem; cursor:pointer; text-transform:capitalize; font-weight:500; }
  .filter-btn.active { background:var(--accent); color:#fff; border-color:var(--accent); }
  .card { background:#fff; border:1px solid #eee; border-radius:14px; overflow:hidden; }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; }
  th { padding:.65rem 1rem; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:#999; text-align:left; background:#fafaf9; border-bottom:1px solid #f0f0f0; }
  td { padding:.75rem 1rem; font-size:.84rem; border-bottom:1px solid #f5f5f5; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .date { font-weight:600; }
  .time { font-size:.8rem; color:var(--muted); }
  .ids { display:flex; flex-direction:column; gap:2px; margin-top:4px; }
  .ids span { font-size:.68rem; color:#bbb; font-family:monospace; }
  .ids .pid { color:var(--accent); }
  .name { font-weight:600; }
  .email { font-size:.8rem; color:var(--muted); }
  .phone { font-size:.78rem; color:var(--muted); }
  .product-name { font-weight:500; margin-bottom:4px; }
  .kind-tag { display:inline-block; padding:2px 6px; border-radius:4px; font-size:.65rem; font-weight:600; text-transform:uppercase; }
  .tag-call { background:#fdf5f3; color:var(--accent); }
  .tag-resource { background:#eff6ff; color:#2563eb; }
  .tag-course { background:#ecfdf5; color:#059669; }
  .price-cell { font-weight:600; }
  .badge { display:inline-block; padding:3px 8px; border-radius:5px; font-size:.7rem; font-weight:600; text-transform:uppercase; }
  .badge-confirmed { background:#ecfdf5; color:#059669; }
  .badge-pending { background:#fffbeb; color:#d97706; }
  .badge-cancelled { background:#fef2f2; color:#dc2626; }
  .badge-downloaded { background:#eff6ff; color:#2563eb; }
  .badge-refunded { background:#faf5ff; color:#7c3aed; }
  .badge-failed { background:#fef2f2; color:#991b1b; }
  .actions { display:flex; gap:.35rem; flex-wrap:wrap; }
  .btn-act { padding:.3rem .7rem; border:none; border-radius:6px; font-size:.72rem; font-weight:600; cursor:pointer; }
  .btn-act:disabled { opacity:0.4; }
  .btn-confirm { background:#ecfdf5; color:#059669; }
  .btn-confirm:hover { background:#d1fae5; }
  .btn-cancel { background:#fef2f2; color:#dc2626; }
  .btn-cancel:hover { background:#fee2e2; }
  .btn-refund { background:#faf5ff; color:#7c3aed; }
  .btn-refund:hover { background:#f3e8ff; }
  .empty { text-align:center; color:#bbb; padding:2rem; }
</style>
