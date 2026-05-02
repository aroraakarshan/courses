<script>
  let { data, form } = $props();
  let authed = $state(false);
  let stats = $state({ services:0, bookings:0, downloads:0, revenue:0 });
  let recent = $state([]);
  let services = $state([]);
  let availability = $state([]);
  let coupons = $state([]);
  let error = $state(false);
  let tab = $state('dashboard');

  $effect(() => {
    if (form?.authed) {
      authed = true; error = false;
      stats = form.stats; recent = form.recent;
      services = form.services; availability = form.availability; coupons = form.coupons;
    } else if (form?.error) { error = true; }
  });

  function fmt(n) { return n?.toLocaleString('en-IN') || '0'; }
  function fmtPrice(n) { return '₹' + (n || 0).toLocaleString('en-IN'); }
  function fmtDate(ts) { if (!ts) return '—'; const d = new Date(ts); return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
  function fmtRowDate(r) { return r.date || fmtDate(r.created_at); }
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
</script>

<svelte:head><title>Admin — Courses</title></svelte:head>

{#if authed}
  <div style="padding:1.5rem 2rem;max-width:1100px;margin:0 auto;">
    <!-- Top bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
      <h1 style="font-size:1.3rem;font-weight:800;margin:0;">Admin</h1>
      <div style="display:flex;gap:0.25rem;">
        {#each [{k:'dashboard',l:'Dashboard'},{k:'services',l:'Services'},{k:'availability',l:'Availability'},{k:'coupons',l:'Coupons'}] as t}
          <button on:click={() => tab = t.k} style="padding:.45rem 1rem;border:1px solid var(--hairline);background:{tab===t.k?'var(--accent)':'#fff'};color:{tab===t.k?'#fff':'var(--ink)'};border-radius:6px;font-size:.82rem;font-weight:600;cursor:pointer;">{t.l}</button>
        {/each}
        <a href="/" style="padding:.45rem 1rem;border:1px solid var(--hairline);background:#fff;border-radius:6px;font-size:.82rem;text-decoration:none;color:var(--ink);margin-left:0.5rem;">← Site</a>
      </div>
    </div>

    {#if tab === 'dashboard'}
      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem;">
        {#each [{label:'Services',v:stats.services},{label:'Bookings',v:stats.bookings},{label:'Downloads',v:stats.downloads},{label:'Revenue',v:fmtPrice(stats.revenue)}] as s}
          <div style="background:#fff;border:1px solid #e5e5e0;border-radius:10px;padding:1.25rem;">
            <div style="font-size:1.8rem;font-weight:800;">{s.v}</div>
            <div style="color:var(--muted);font-size:0.82rem;">{s.label}</div>
          </div>
        {/each}
      </div>

      <!-- Recent table -->
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:0.75rem;">Recent Activity</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden;font-size:0.84rem;">
          <thead><tr style="background:#f8f8f5;">
            <th style="padding:.5rem .7rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;">Date</th>
            <th style="padding:.5rem .7rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;">Time</th>
            <th style="padding:.5rem .7rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;">Name</th>
            <th style="padding:.5rem .7rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;">Email</th>
            <th style="padding:.5rem .7rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;">Service</th>
            <th style="padding:.5rem .7rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;">Price</th>
            <th style="padding:.5rem .7rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#6b6b66;">Status</th>
          </tr></thead>
          <tbody>
            {#each recent as r}
              <tr style="border-top:1px solid #f0f0eb;">
                <td style="padding:.5rem .7rem;">{r.date || '—'}</td>
                <td style="padding:.5rem .7rem;">{r.time || '—'}</td>
                <td style="padding:.5rem .7rem;font-weight:600;">{r.name}</td>
                <td style="padding:.5rem .7rem;">{r.email}</td>
                <td style="padding:.5rem .7rem;">{r.service_name || r.resource || '—'}</td>
                <td style="padding:.5rem .7rem;">{fmtPrice(r.price)}</td>
                <td style="padding:.5rem .7rem;">
                <form method="POST" action="?/updateStatus" style="display:inline;">
                  <input type="hidden" name="id" value={r.id}/>
                  <select name="status" on:change={(e) => e.currentTarget.form.requestSubmit()} style="padding:2px 4px;border:1px solid #e5e5e0;border-radius:4px;font-size:.72rem;background:{r.status==='confirmed'?'#e8f5e9':r.status==='pending'?'#fff3e0':r.status==='downloaded'?'#e3f2fd':'#fbe9e7'};color:{r.status==='confirmed'?'#2e7d32':r.status==='pending'?'#e65100':r.status==='downloaded'?'#1565c0':'#c62828'};font-weight:600;">
                    <option value="confirmed" selected={r.status==='confirmed'}>confirmed</option>
                    <option value="pending" selected={r.status==='pending'}>pending</option>
                    <option value="downloaded" selected={r.status==='downloaded'}>downloaded</option>
                    <option value="cancelled" selected={r.status==='cancelled'}>cancelled</option>
                    <option value="refunded" selected={r.status==='refunded'}>refunded</option>
                  </select>
                </form>
              </td></tr>
            {/each}
          </tbody>
        </table>
      </div>

    {:else if tab === 'services'}
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Services</h2>
      <form method="POST" action="?/addService" style="display:flex;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <input name="slug" placeholder="slug" required style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;"/>
        <input name="name" placeholder="name" required style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;flex:1;min-width:150px;"/>
        <input name="price" type="number" placeholder="₹" required style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;width:90px;"/>
        <button style="padding:.5rem 1.2rem;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:.84rem;font-weight:600;cursor:pointer;">Save</button>
      </form>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden;font-size:.84rem;">
        <thead><tr style="background:#f8f8f5;"><th style="padding:.5rem .7rem;text-align:left;">Slug</th><th style="padding:.5rem .7rem;text-align:left;">Name</th><th style="padding:.5rem .7rem;text-align:left;">Price</th><th style="padding:.5rem .7rem;"></th></tr></thead>
        <tbody>
          {#each services as s}
            <tr style="border-top:1px solid #f0f0eb;"><td style="padding:.5rem .7rem;">{s.slug}</td><td style="padding:.5rem .7rem;">{s.name}</td><td style="padding:.5rem .7rem;">{fmtPrice(s.price)}</td><td style="padding:.5rem .7rem;"><form method="POST" action="?/delService"><input type="hidden" name="slug" value={s.slug}/><button style="padding:.3rem .8rem;background:#9A3324;color:#fff;border:none;border-radius:4px;font-size:.75rem;cursor:pointer;">×</button></form></td></tr>
          {/each}
        </tbody>
      </table>

    {:else if tab === 'availability'}
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Availability</h2>
      <form method="POST" action="?/addAvail" style="display:flex;gap:0.5rem;margin-bottom:1.5rem;align-items:center;flex-wrap:wrap;">
        <select name="dow" style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;">
          {#each DAYS as d, i}<option value={i}>{d}</option>{/each}
        </select>
        <input name="start" placeholder="Start HH:MM" value="12:00" required style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;"/>
        <input name="end" placeholder="End HH:MM" value="17:00" required style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;"/>
        <button style="padding:.5rem 1.2rem;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:.84rem;font-weight:600;cursor:pointer;">Save</button>
      </form>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden;font-size:.84rem;">
        <thead><tr style="background:#f8f8f5;"><th style="padding:.5rem .7rem;text-align:left;">Day</th><th style="padding:.5rem .7rem;text-align:left;">Start</th><th style="padding:.5rem .7rem;text-align:left;">End</th><th style="padding:.5rem .7rem;"></th></tr></thead>
        <tbody>
          {#each availability as a}
            <tr style="border-top:1px solid #f0f0eb;"><td style="padding:.5rem .7rem;font-weight:600;">{a.dayName}</td><td style="padding:.5rem .7rem;">{a.start_time}</td><td style="padding:.5rem .7rem;">{a.end_time}</td><td style="padding:.5rem .7rem;"><form method="POST" action="?/delAvail"><input type="hidden" name="dow" value={a.day_of_week}/><button style="padding:.3rem .8rem;background:#9A3324;color:#fff;border:none;border-radius:4px;font-size:.75rem;cursor:pointer;">×</button></form></td></tr>
          {/each}
        </tbody>
      </table>

    {:else if tab === 'coupons'}
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:1rem;">Coupons</h2>
      <form method="POST" action="?/addCoupon" style="display:flex;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center;">
        <input name="code" placeholder="CODE" required style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;width:100px;"/>
        <input name="discount" type="number" placeholder="% off" required style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;width:80px;"/>
        <select name="service" style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;">
          <option value="">All services</option>
          {#each services as s}<option value={s.slug}>{s.name}</option>{/each}
        </select>
        <input name="max_uses" type="number" placeholder="Max uses" style="padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;width:90px;"/>
        <button style="padding:.5rem 1.2rem;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:.84rem;font-weight:600;cursor:pointer;">Save</button>
      </form>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden;font-size:.84rem;">
        <thead><tr style="background:#f8f8f5;"><th style="padding:.5rem .7rem;text-align:left;">Code</th><th style="padding:.5rem .7rem;text-align:left;">Discount</th><th style="padding:.5rem .7rem;text-align:left;">Service</th><th style="padding:.5rem .7rem;text-align:left;">Used</th><th style="padding:.5rem .7rem;"></th></tr></thead>
        <tbody>
          {#each coupons as c}
            <tr style="border-top:1px solid #f0f0eb;"><td style="padding:.5rem .7rem;font-weight:600;">{c.code}</td><td style="padding:.5rem .7rem;">{c.discount_percent}%</td><td style="padding:.5rem .7rem;">{c.service || 'All'}</td><td style="padding:.5rem .7rem;">{c.used}/{c.max_uses || '∞'}</td><td style="padding:.5rem .7rem;"><form method="POST" action="?/delCoupon"><input type="hidden" name="code" value={c.code}/><button style="padding:.3rem .8rem;background:#9A3324;color:#fff;border:none;border-radius:4px;font-size:.75rem;cursor:pointer;">×</button></form></td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
{:else}
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fafaf7;">
    <div style="background:#fff;border:1px solid #e5e5e0;border-radius:12px;padding:32px;width:340px;text-align:center;">
      <h2 style="margin-bottom:1.5rem;font-weight:700;">Admin</h2>
      <form method="POST" action="?/login">
        <input type="password" name="password" placeholder="Password" autofocus style="width:100%;padding:.7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.85rem;font-family:inherit;margin-bottom:12px;"/>
        <button type="submit" style="width:100%;padding:.7rem;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:.9rem;font-weight:600;cursor:pointer;">Login</button>
      </form>
      {#if error}<p style="color:#9A3324;font-size:.8rem;margin-top:.5rem;">Invalid password</p>{/if}
    </div>
  </div>
{/if}

{#if authed}
  <style>
    @media (max-width: 768px) {
      :global(.admin-page) > div:first-child { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
{/if}
