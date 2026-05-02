<script>
  let { data } = $props();
  const fmt = (p) => '₹' + (p || 0).toLocaleString('en-IN');
</script>

<svelte:head><title>Book a Session — Akarshan Arora</title></svelte:head>

<div style="max-width:1000px;margin:0 auto;padding:2rem 2rem 0;">
  <a href="/" style="color:var(--tertiary);text-decoration:none;font-size:0.85rem;">← Courses</a>
</div>

<section style="padding:5rem 2rem 3rem;text-align:center;max-width:660px;margin:0 auto;">
  <div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.2em;color:var(--accent);margin-bottom:1rem;">1-on-1 Sessions</div>
  <h1 style="font-size:clamp(2.4rem,5vw,3.2rem);font-weight:800;letter-spacing:-0.04em;line-height:1.12;margin-bottom:1rem;">Pick a topic.</h1>
</section>

<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1.5rem;padding:0 2rem 4rem;max-width:1000px;margin:0 auto;">
  {#if data.services.length === 0}
    <div style="text-align:center;grid-column:1/-1;color:var(--muted);padding:2rem;">No sessions available right now.</div>
  {:else}
    {#each data.services as s}
      <a href="/book/schedule?s={s.slug}&n={encodeURIComponent(s.name)}&d=55" class="card">
        <div class="card-body">
          <div class="card-tag">55 min · {fmt(s.price)}</div>
          <h2>{s.name}</h2>
          <p>1-on-1 session. Get personalised guidance from an industry professional.</p>
        </div>
        <div class="card-footer"><span>Select →</span></div>
      </a>
    {/each}
  {/if}
</div>

<style>
  .card { display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--hairline);border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;transition:border-color 0.25s,box-shadow 0.25s; }
  .card:hover { border-color:var(--accent);box-shadow:6px 6px 0 0 var(--accent); }
  .card-body { padding:1.75rem 1.75rem 0;flex:1; }
  .card-body h2 { font-size:1.1rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:0.35rem; }
  .card-body p { color:var(--muted);font-size:0.88rem;line-height:1.55; }
  .card-footer { padding:1.25rem 1.75rem 1.75rem;font-size:0.85rem;font-weight:600;color:var(--accent); }
  .card-footer span { display:inline-flex;align-items:center;gap:0.4rem;transition:gap 0.25s; }
  .card:hover .card-footer span { gap:0.8rem; }
  .card-tag { display:inline-block;font-family:'JetBrains Mono',monospace;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.14em;color:var(--accent);margin-bottom:0.65rem; }
</style>
