<script>
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let slots = $state([]);
  let groups = $state([]);
  let showForm = $state(false);
  let form = $state({ group_name:'Default', day_of_week:0, start_time:'12:00', end_time:'17:00' });

  async function load() {
    const r = await fetch('/admin/api/availability', { headers: { 'x-admin-token': '' } });
    slots = await r.json();
    groups = [...new Set(slots.map(s => s.group_name || 'Default'))];
  }
  $effect(() => { load(); });

  async function add() {
    await fetch('/admin/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': '' }, body: JSON.stringify(form) });
    form = { group_name:'Default', day_of_week:0, start_time:'12:00', end_time:'17:00' };
    showForm = false; load();
  }

  async function del(id) {
    await fetch('/admin/api/availability', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-token': '' }, body: JSON.stringify({ id }) });
    load();
  }

  function slotKey(s) { return s.group_name + '|' + s.day_of_week + '|' + s.start_time + '|' + s.end_time; }
</script>

<div style="max-width:900px;margin:0 auto;">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
    <h1 style="font-size:1.5rem;font-weight:800;">Availability</h1>
    <button onclick={() => showForm = !showForm} style="padding:.5rem 1.2rem;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:.85rem;font-weight:600;cursor:pointer;">{showForm ? 'Cancel' : '+ Add Slot'}</button>
  </div>

  {#if showForm}
    <div style="background:#fff;border:1px solid #e5e5e0;border-radius:12px;padding:1.25rem;margin-bottom:1.5rem;">
      <div style="display:flex;gap:.5rem;align-items:end;flex-wrap:wrap;">
        <div style="min-width:140px;"><label class="lbl">Group</label>
          <input class="inp" list="group-list" bind:value={form.group_name} placeholder="Default"/>
          <datalist id="group-list">{#each groups as g}<option value={g}/>{/each}</datalist>
        </div>
        <div style="width:100px;"><label class="lbl">Day</label><select class="inp" bind:value={form.day_of_week}>{#each DAYS as d, i}<option value={i}>{d}</option>{/each}</select></div>
        <div style="width:100px;"><label class="lbl">Start</label><input class="inp" bind:value={form.start_time} placeholder="12:00"/></div>
        <div style="width:100px;"><label class="lbl">End</label><input class="inp" bind:value={form.end_time} placeholder="17:00"/></div>
        <button onclick={add} class="btn-save">Add</button>
      </div>
    </div>
  {/if}

  {#each groups as g}
    <div style="margin-bottom:1.5rem;">
      <h2 style="font-size:1rem;font-weight:700;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;">
        <span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:4px;font-size:.7rem;">{g}</span>
      </h2>
      <div style="display:grid;gap:.5rem;">
        {#each slots.filter(s => (s.group_name||'Default') === g) as s}
          <div style="background:#fff;border:1px solid #e5e5e0;border-radius:8px;padding:.75rem 1rem;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:2rem;align-items:center;">
              <span style="font-weight:600;font-size:.9rem;width:40px;">{DAYS[s.day_of_week]}</span>
              <span style="font-size:.85rem;color:var(--muted);">{s.start_time} — {s.end_time} IST</span>
              {#if s.product_slug}<span style="font-size:.75rem;background:#fdf8f5;color:var(--accent);padding:1px 6px;border-radius:3px;">{s.product_slug}</span>{/if}
            </div>
            <button onclick={() => del(s.id)} class="btn-del">Remove</button>
          </div>
        {:else}
          <div style="padding:1rem;color:var(--muted);font-size:.84rem;font-style:italic;">No slots in this group</div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .lbl { display:block;font-size:.72rem;font-weight:600;color:#6b6b66;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.25rem; }
  .inp { width:100%;padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.84rem;font-family:inherit; }
  .inp:focus { outline:none;border-color:var(--accent); }
  .btn-save { padding:.5rem 1.2rem;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:.84rem;font-weight:600;cursor:pointer; }
  .btn-del { padding:.3rem .7rem;background:#fff;color:#9A3324;border:1px solid #e5e5e0;border-radius:4px;font-size:.75rem;cursor:pointer; }
</style>
