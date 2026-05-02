<script>
  let { data } = $props();
  let name = $state(''), email = $state(''), phone = $state('');
  let loading = $state(false), error = $state('');

  async function download(e) {
    e.preventDefault();
    if (!name || !email || !email.includes('@')) { error = 'Enter name and valid email.'; return; }
    loading = true; error = '';
    try {
      const r = await fetch('/api/create-order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name, email, phone, service: data.file, type: 'download' }) });
      if (!r.ok) { error = 'Download failed. Try again.'; loading = false; return; }
      const blob = await r.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = data.file;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      location.href = '/resources/thank-you';
    } catch { error = 'Download failed. Try again.'; loading = false; }
  }
</script>

<svelte:head><title>Download — {data.title}</title></svelte:head>

<div style="max-width:440px;margin:0 auto;padding:4rem 1rem;">
  <a href="/resources" style="color:var(--tertiary);text-decoration:none;font-size:0.85rem;display:inline-block;margin-bottom:2rem;">← Guides</a>
  <h1 style="font-size:1.8rem;font-weight:800;letter-spacing:-0.04em;margin-bottom:0.35rem;">{data.title}</h1>
  <p class="subtitle" style="color:#777;font-size:0.92rem;margin-bottom:2rem;">Enter your details to get the PDF.</p>
  <form onsubmit={download}>
    <div class="field"><label>Name</label><input type="text" bind:value={name} required placeholder="Your full name" /></div>
    <div class="field"><label>Email</label><input type="email" bind:value={email} required placeholder="you@example.com" /></div>
    <div class="field"><label>Phone — optional</label><input type="tel" bind:value={phone} placeholder="+91 99999 99999" /></div>
    {#if error}<p style="color:#9A3324;font-size:0.78rem;margin-bottom:0.5rem;">{error}</p>{/if}
    <button type="submit" class="btn" disabled={loading}>{loading ? 'Downloading...' : 'Download PDF'}</button>
  </form>
</div>

<style>
  .field { margin-bottom:1rem; }
  .field label { display:block;font-family:'JetBrains Mono',monospace;font-size:0.68rem;font-weight:500;color:#A3A39E;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.4rem; }
  .field input { width:100%;padding:0.7rem 0.85rem;background:var(--surface);border:1px solid var(--hairline);border-radius:8px;color:var(--ink);font-size:0.9rem;font-family:inherit; }
  .field input:focus { outline:none;border-color:var(--accent); }
  .btn { width:100%;padding:0.8rem;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:0.92rem;font-weight:600;font-family:inherit;cursor:pointer; }
  .btn:hover { background:#a84c1f; }
  .btn:disabled { opacity:0.5;pointer-events:none; }
</style>
