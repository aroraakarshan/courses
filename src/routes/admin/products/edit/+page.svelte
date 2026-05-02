<script>
  let { data } = $props();
  const existing = data.product;
  let form = $state({
    slug: existing?.slug || '',
    name: existing?.name || '',
    kind: existing?.kind || 'call',
    price: existing?.price || 0,
    pricing: existing?.pricing || 'fixed',
    min_price: existing?.min_price || 0,
    initial_price: existing?.initial_price || 0,
    discount_percent: existing?.discount_percent || 0,
    duration_minutes: existing?.duration_minutes || 55,
    file: existing?.file || '',
    meet_link: existing?.meet_link || '',
    description: existing?.description || '',
    questions: [],
    config: existing?.config || '{}',
  });

  // Parse existing questions
  let parsed = [];
  try { parsed = JSON.parse(existing?.questions || '[]'); } catch {}
  if (parsed.length) form.questions = parsed;

  let saved = $state(false);
  let error = $state('');

  function addQuestion() { form.questions = [...form.questions, { label:'', type:'text', required:false }]; }
  function removeQuestion(i) { form.questions = form.questions.filter((_,j) => j !== i); }
  function updateQuestion(i, field, value) {
    form.questions = form.questions.map((q, j) => j === i ? { ...q, [field]: value } : q);
  }

  async function save(e) {
    e.preventDefault(); error = ''; saved = false;
    const body = { ...form, questions: JSON.stringify(form.questions) };
    const r = await fetch('/admin/api/product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { saved = true; setTimeout(() => saved = false, 2000); }
    else { const d = await r.json(); error = d.error || 'Failed to save'; }
  }

  function fp(n) { return '₹' + (n||0).toLocaleString('en-IN'); }
</script>

<div class="page">
  <div class="header">
    <div>
      <a href="/admin/products" class="back-link">← Products</a>
      <h1>{existing ? 'Edit' : 'New'} Product</h1>
    </div>
    <button onclick={save} class="btn-primary" disabled={saved}>{saved ? '✓ Saved' : 'Save'}</button>
  </div>

  {#if error}<div class="error">{error}</div>{/if}

  <form onsubmit={save}>
    <div class="card-section">
      <h3>Basic Info</h3>
      <div class="form-grid">
        <div class="field"><label>Slug</label><input bind:value={form.slug} required placeholder="python-vlsi" disabled={!!existing}/></div>
        <div class="field"><label>Name</label><input bind:value={form.name} required placeholder="Python for VLSI"/></div>
        <div class="field"><label>Type</label><select bind:value={form.kind}>
          <option value="call">1:1 Call</option><option value="resource">Resource / PDF</option>
          <option value="course">Course</option><option value="package">Package</option>
          <option value="dm">Priority DM</option><option value="webinar">Webinar</option>
        </select></div>
        <div class="field"><label>Pricing</label><select bind:value={form.pricing}>
          <option value="fixed">Fixed Price</option><option value="pwyw">Pay What You Want</option>
        </select></div>
        {#if form.pricing === 'fixed'}
          <div class="field"><label>Price (₹)</label><input type="number" bind:value={form.price}/></div>
        {:else}
          <div class="field"><label>Suggested Price (₹)</label><input type="number" bind:value={form.initial_price} placeholder="Suggested amount"/></div>
          <div class="field"><label>Minimum Price (₹)</label><input type="number" bind:value={form.min_price} placeholder="Minimum allowed"/></div>
        {/if}
        <div class="field"><label>Auto Discount %</label><input type="number" bind:value={form.discount_percent} min="0" max="100"/></div>
        {#if form.kind === 'call'}
          <div class="field"><label>Duration (minutes)</label><input type="number" bind:value={form.duration_minutes}/></div>
        {/if}
        {#if form.kind === 'resource' || form.kind === 'course'}
          <div class="field"><label>File (R2 key)</label><input bind:value={form.file} placeholder="guide.pdf"/></div>
        {/if}
        <div class="field span-2"><label>Meet Link</label><input bind:value={form.meet_link} placeholder="https://meet.google.com/..."/></div>
        <div class="field span-2"><label>Description</label><textarea bind:value={form.description} rows="2"></textarea></div>
      </div>
    </div>

    <div class="card-section">
      <div class="section-header">
        <h3>Questions</h3>
        <button type="button" onclick={addQuestion} class="btn-sm">+ Add Question</button>
      </div>
      {#if form.questions.length === 0}
        <p class="empty">No questions yet. Add questions to collect information from users.</p>
      {:else}
        <div class="questions-list">
          {#each form.questions as q, i}
            <div class="question-row">
              <span class="q-num">{i + 1}</span>
              <input value={q.label} oninput={(e) => updateQuestion(i, 'label', e.target.value)} placeholder="Question text" class="q-label"/>
              <select value={q.type} onchange={(e) => updateQuestion(i, 'type', e.target.value)} class="q-type">
                <option value="text">Text</option><option value="number">Number</option>
                <option value="textarea">Long text</option><option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
              <label class="q-required"><input type="checkbox" checked={q.required} onchange={(e) => updateQuestion(i, 'required', e.target.checked)}/> Required</label>
              <button type="button" onclick={() => removeQuestion(i)} class="q-remove" title="Remove">×</button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </form>
</div>

<style>
  .page { max-width:750px; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:end; margin-bottom:1.5rem; gap:1rem; }
  .back-link { font-size:.8rem; color:var(--muted); text-decoration:none; display:inline-block; margin-bottom:.35rem; }
  .header h1 { font-size:1.5rem; font-weight:800; margin:0; }
  .btn-primary { padding:.55rem 1.5rem; background:var(--accent); color:#fff; border:none; border-radius:8px; font-size:.84rem; font-weight:600; cursor:pointer; }
  .btn-primary:disabled { opacity:0.6; }
  .error { background:#fef2f2; color:#dc2626; padding:.75rem 1rem; border-radius:8px; font-size:.84rem; margin-bottom:1rem; }
  .card-section { background:#fff; border:1px solid #eee; border-radius:14px; padding:1.5rem; margin-bottom:1rem; }
  .card-section h3 { font-size:1rem; font-weight:700; margin:0 0 1rem; }
  .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
  .section-header h3 { margin:0; }
  .btn-sm { padding:.35rem .9rem; background:#f5f5f0; border:1px solid #e5e5e0; border-radius:6px; font-size:.78rem; cursor:pointer; font-weight:600; }
  .btn-sm:hover { background:#eee; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
  .field { display:flex; flex-direction:column; gap:.25rem; }
  .field label { font-size:.72rem; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.04em; }
  .field input, .field select, .field textarea { padding:.55rem .75rem; border:1.5px solid #e5e5e0; border-radius:8px; font-size:.84rem; font-family:inherit; }
  .field input:focus, .field select:focus, .field textarea:focus { outline:none; border-color:var(--accent); }
  .span-2 { grid-column:1/-1; }
  .empty { color:#aaa; font-size:.84rem; font-style:italic; padding:.5rem 0; }
  .questions-list { display:flex; flex-direction:column; gap:.5rem; }
  .question-row { display:flex; gap:.5rem; align-items:center; padding:.5rem; background:#fafaf9; border-radius:8px; }
  .q-num { font-size:.75rem; font-weight:700; color:#bbb; width:20px; text-align:center; }
  .q-label { flex:1; padding:.4rem .6rem; border:1px solid #e5e5e0; border-radius:6px; font-size:.82rem; font-family:inherit; }
  .q-type { padding:.4rem .6rem; border:1px solid #e5e5e0; border-radius:6px; font-size:.8rem; width:110px; }
  .q-required { font-size:.75rem; color:#888; display:flex; align-items:center; gap:.25rem; white-space:nowrap; }
  .q-required input { margin:0; }
  .q-remove { padding:.2rem .5rem; border:none; background:none; color:#ccc; font-size:1.2rem; cursor:pointer; }
  .q-remove:hover { color:#dc2626; }
</style>
