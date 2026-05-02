<script>
  let { data, form } = $props();
  let authed = $state(false);
  let html = $state('');
  let error = $state(false);

  $effect(() => {
    if (form?.authed) { authed = true; html = form.html; error = false; }
    else if (form?.error) { error = true; }
  });
</script>

<svelte:head><title>Admin — Courses</title></svelte:head>

{#if authed}
  {@html html}
{:else}
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fafaf7;">
    <div style="background:#fff;border:1px solid #e5e5e0;border-radius:12px;padding:32px;width:340px;text-align:center;">
      <h2 style="margin-bottom:1.5rem;font-weight:700;">Admin Login</h2>
      <form method="POST">
        <input type="password" name="password" placeholder="Password" autofocus style="width:100%;padding:.7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.85rem;font-family:inherit;margin-bottom:12px;"/>
        <button type="submit" style="width:100%;padding:.7rem;background:#C45D2C;color:#fff;border:none;border-radius:6px;font-size:.9rem;font-weight:600;cursor:pointer;">Login</button>
      </form>
      {#if error}<p style="color:#9A3324;font-size:.8rem;margin-top:.5rem;">Invalid password</p>{/if}
    </div>
  </div>
{/if}
