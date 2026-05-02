<script>
  let { children } = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</svelte:head>

<nav>
  <a href="https://akarshanarora.com" class="nav-brand">Akarshan Arora</a>
  <div class="nav-links">
    <a href="https://akarshanarora.com">Who am I</a>
    <a href="https://www.linkedin.com/in/aroraakarshan/" target="_blank" rel="noopener">LinkedIn</a>
    <a href="https://topmate.io/akarshanarora" target="_blank" rel="noopener" class="nav-cta">Book a 1:1</a>
  </div>
</nav>

{@render children()}

<footer>
  <a href="https://akarshanarora.com">akarshanarora.com</a> · <a href="/">Courses</a> · <a href="/resources/">Guides</a>
</footer>

<style>
  :root {
    --ink: #1A1A1A;
    --paper: #FAFAF7;
    --accent: #C45D2C;
    --hairline: #E5E5E0;
    --muted: #6B6B66;
    --tertiary: #A3A39E;
    --surface: #fff;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--paper);
    color: var(--ink);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2rem; border-bottom: 1px solid var(--hairline);
    position: sticky; top: 0;
    background: rgba(250,250,247,0.94); backdrop-filter: blur(12px); z-index: 10;
  }
  .nav-brand { font-weight: 700; font-size: 0.95rem; color: var(--ink); text-decoration: none; }
  .nav-links { display: flex; gap: 1.5rem; align-items: center; }
  .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.86rem; }
  .nav-links a:hover { color: var(--ink); }
  .nav-cta { padding: 0.45rem 1rem; background: var(--accent); color: #fff !important; border-radius: 7px; font-weight: 600; font-size: 0.8rem; }
  footer { text-align: center; padding: 2rem; border-top: 1px solid var(--hairline); color: var(--tertiary); font-size: 0.84rem; }
  footer a { color: var(--muted); }
</style>
