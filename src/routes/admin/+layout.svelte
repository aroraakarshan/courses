<script>
  import { page } from '$app/stores';
  let { data, children } = $props();
  let showLogin = $state(!data.authed);
  let loginError = $state(false);
  let password = $state('');

  async function login(e) {
    e.preventDefault();
    loginError = false;
    const r = await fetch('/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    if (r.ok) {
      const { token } = await r.json();
      document.cookie = 'admin_token=' + token + '; Path=/; Max-Age=86400; SameSite=Lax';
      showLogin = false;
    } else { loginError = true; }
  }

  function isActive(path) { return $page.url.pathname === path || ($page.url.pathname === '/admin' && path === '/admin'); }
</script>

<svelte:head><title>Admin — Courses</title></svelte:head>

{#if showLogin}
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#fafaf7 0%,#f0ede8 100%);">
    <form onsubmit={login} style="background:#fff;border:1px solid #e5e5e0;border-radius:16px;padding:48px;width:380px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <div style="width:48px;height:48px;background:var(--accent);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;font-size:1.5rem;color:#fff;">⚡</div>
      <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:.5rem;">Admin Panel</h2>
      <p style="color:var(--muted);font-size:.82rem;margin-bottom:1.5rem;">Enter password to continue</p>
      <input type="password" bind:value={password} placeholder="Password" autofocus class="login-input" />
      <button type="submit" style="width:100%;padding:.85rem;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:600;cursor:pointer;transition:background .15s;">Sign in</button>
      {#if loginError}<p style="color:#9A3324;font-size:.8rem;margin-top:.75rem;">Invalid password</p>{/if}
    </form>
  </div>
{:else}
  <div style="display:flex;min-height:100vh;background:#f8f8f5;">
    <aside style="width:240px;background:#fff;border-right:1px solid #eee;padding:0;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;">
      <div style="padding:1.5rem 1.25rem .75rem;">
        <a href="/admin" style="font-size:1rem;font-weight:800;color:var(--ink);text-decoration:none;letter-spacing:-0.02em;">Courses Admin</a>
        <div style="font-size:.72rem;color:var(--muted);margin-top:2px;">Management Panel</div>
      </div>
      <nav style="flex:1;padding:.75rem .75rem;">
        {#each [{href:'/admin',icon:'📊',label:'Dashboard'},{href:'/admin/bookings',icon:'📅',label:'Bookings'},{href:'/admin/products',icon:'📦',label:'Products'},{href:'/admin/availability',icon:'🕐',label:'Availability'},{href:'/admin/coupons',icon:'🏷️',label:'Coupons'}] as item}
          <a href={item.href} class="nav-item" class:active={isActive(item.href)}>
            <span>{item.icon}</span> {item.label}
          </a>
        {/each}
      </nav>
      <div style="padding:1rem 1.25rem;border-top:1px solid #eee;">
        <a href="/" style="font-size:.8rem;color:var(--muted);text-decoration:none;display:flex;align-items:center;gap:.4rem;">← Back to site</a>
      </div>
    </aside>
    <main style="flex:1;padding:2rem;overflow-x:auto;">
      {@render children()}
    </main>
  </div>
{/if}

<style>
  :global(body) { margin:0; }
  .login-input { width:100%;padding:.85rem 1rem;border:1.5px solid #e5e5e0;border-radius:10px;font-size:.9rem;font-family:inherit;margin-bottom:.75rem;transition:border-color .15s; }
  .login-input:focus { outline:none;border-color:var(--accent); }
  .nav-item {
    display:flex;align-items:center;gap:.5rem;padding:.65rem .85rem;border-radius:8px;font-size:.85rem;font-weight:500;color:#555;text-decoration:none;margin-bottom:2px;transition:all .12s;
  }
  .nav-item:hover { background:#f5f5f0;color:#111; }
  .nav-item.active { background:var(--accent);color:#fff;font-weight:600; }
  .nav-item.active span { filter:grayscale(0); }
</style>
