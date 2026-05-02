<svelte:head><title>Courses — Akarshan Arora</title></svelte:head>

<section class="hero">
  <div class="hero-eyebrow">Learn by doing</div>
  <h1>Tutorials that make complex concepts click.</h1>
  <p>Interactive, visual, and built from real industry experience. No sign-up. No paywall.</p>
</section>

<div class="grid">
  <a href="/yaml-from-zero/" class="card">
    <div class="card-body">
      <div class="card-tag">Tutorial · Free</div>
      <h2>YAML from Zero</h2>
      <p>Learn YAML from absolute basics to advanced features — live examples, built-in playground, and quizzes.</p>
    </div>
    <div class="card-footer"><span>Start Learning →</span></div>
  </a>

  <a href="/resources/" class="card">
    <div class="card-body">
      <div class="card-tag">Downloads</div>
      <h2>Guides</h2>
      <p>Quick-reference guides for VLSI engineers — EMIR fundamentals, PDN checklists, and more. Downloadable PDFs.</p>
    </div>
    <div class="card-footer"><span>Browse Guides →</span></div>
  </a>

  <a href="/book/" class="card">
    <div class="card-body">
      <div class="card-tag">1-on-1</div>
      <h2>Book a Session</h2>
      <p>Get personalised guidance on Python for VLSI, PDN, Redhawk SeaScape, or your career path. 55-min sessions.</p>
    </div>
    <div class="card-footer"><span>Book Now →</span></div>
  </a>
</div>

<section class="support">
  <h3>Support this work</h3>
  <p>Creating resources takes time. If you find them valuable, consider contributing.</p>
  <form><script src="https://checkout.razorpay.com/v1/payment-button.js" data-payment_button_id="pl_Sk52NHQhnivoGx" async></script></form>
</section>

<style>
  .hero { padding:5rem 2rem 3rem;text-align:center;max-width:660px;margin:0 auto; }
  .hero-eyebrow { font-family:'JetBrains Mono',monospace;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.2em;color:var(--accent);margin-bottom:1rem; }
  .hero h1 { font-size:clamp(2.4rem,5vw,3.2rem);font-weight:800;letter-spacing:-0.04em;line-height:1.12;margin-bottom:1rem; }
  .hero p { color:var(--muted);font-size:1.05rem;max-width:440px;margin:0 auto; }
  .grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1.5rem;padding:0 2rem 4rem;max-width:1000px;margin:0 auto; }
  .card { display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--hairline);border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;transition:border-color 0.25s,box-shadow 0.25s; }
  .card:hover { border-color:var(--accent);box-shadow:6px 6px 0 0 var(--accent); }
  .card-body { padding:1.75rem 1.75rem 0;flex:1; }
  .card-body h2 { font-size:1.1rem;font-weight:700;letter-spacing:-0.02em;margin-bottom:0.35rem; }
  .card-body p { color:var(--muted);font-size:0.88rem;line-height:1.55; }
  .card-footer { padding:1.25rem 1.75rem 1.75rem;font-size:0.85rem;font-weight:600;color:var(--accent); }
  .card-footer span { display:inline-flex;align-items:center;gap:0.4rem;transition:gap 0.25s; }
  .card:hover .card-footer span { gap:0.8rem; }
  .card-tag { display:inline-block;font-family:'JetBrains Mono',monospace;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.14em;color:var(--accent);margin-bottom:0.65rem; }
  .support { text-align:center;padding:4rem 2rem;border-top:1px solid var(--hairline); }
  .support h3 { font-size:1.4rem;font-weight:700;letter-spacing:-0.03em;margin-bottom:0.5rem; }
  .support p { color:var(--muted);margin-bottom:1.25rem; }
</style>
