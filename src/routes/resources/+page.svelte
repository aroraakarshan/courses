<script>
  let { data } = $props();
</script>

<svelte:head><title>Guides — Akarshan Arora</title></svelte:head>

<div style="max-width:1000px;margin:0 auto;padding:2rem 2rem 0;">
  <a href="/" style="color:var(--tertiary);text-decoration:none;font-size:0.85rem;">← Courses</a>
</div>

<section class="hero">
  <div class="hero-eyebrow">Guides</div>
  <h1>Guides for VLSI engineers.</h1>
  <p>Practical references built from real project experience.</p>
</section>

<div class="grid">
  {#each data.resources as r}
    <div class="card">
      <div class="card-body">
        <h2>{r.title}</h2>
        <p>{r.description}</p>
      </div>
      <div class="card-footer">
        <a href="/resources/download?r={r.file}" style="color:inherit;text-decoration:none;"><span>Download →</span></a>
      </div>
    </div>
  {/each}
</div>

<style>
  .hero { padding:5rem 2rem 3rem;text-align:center;max-width:660px;margin:0 auto; }
  .hero-eyebrow { font-family:'JetBrains Mono',monospace;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.2em;color:var(--accent);margin-bottom:1rem; }
  .hero h1 { font-size:clamp(2.4rem,5vw,3.2rem);font-weight:800;letter-spacing:-0.04em;line-height:1.12;margin-bottom:1rem; }
  .hero p { color:var(--muted);font-size:1.05rem;max-width:440px;margin:0 auto; }
  .grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1.5rem;padding:0 2rem 4rem;max-width:1000px;margin:0 auto; }
  .card { display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--hairline);border-radius:12px;overflow:hidden;transition:border-color 0.25s,box-shadow 0.25s; }
  .card:hover { border-color:var(--accent);box-shadow:6px 6px 0 0 var(--accent); }
  .card-body { padding:1.75rem 1.75rem 0;flex:1; }
  .card-body h2 { font-size:1.1rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:0.35rem; }
  .card-body p { color:var(--muted);font-size:0.88rem;line-height:1.55; }
  .card-footer { padding:1.25rem 1.75rem 1.75rem;font-size:0.85rem;font-weight:600;color:var(--accent); }
  .card-footer span { display:inline-flex;align-items:center;gap:0.4rem;transition:gap 0.25s; }
  .card:hover .card-footer span { gap:0.8rem; }
</style>
