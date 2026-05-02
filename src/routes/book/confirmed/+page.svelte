<script>
  import { onMount } from 'svelte';
  let status = $state('loading');
  let message = $state('Verifying payment...');

  onMount(async () => {
    const p = new URLSearchParams(location.search);
    const orderId = p.get('orderId');
    if (orderId && orderId.startsWith('free-')) {
      status = 'ok'; message = 'Booking confirmed. Check your email for the meeting link.';
      return;
    }
    const paymentId = p.get('paymentId'), signature = p.get('signature');
    if (!orderId || !paymentId || !signature) {
      status = 'error'; message = 'Missing payment details. If you paid, contact us.';
      return;
    }
    try {
      const r = await fetch('/api/verify-payment', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId, paymentId, signature }) });
      const d = await r.json();
      if (d.verified) { status = 'ok'; message = 'Check your email for the meeting link and calendar invite.'; }
      else { status = 'error'; message = d.error || 'Payment verification failed. If your card was charged, contact us.'; }
    } catch { status = 'error'; message = 'Server error. If your card was charged, contact us.'; }
  });
</script>

<svelte:head><title>Booking Confirmed — Akarshan Arora</title></svelte:head>

<div style="text-align:center;padding:6rem 2rem;max-width:480px;margin:0 auto;">
  {#if status === 'loading'}
    <div style="width:36px;height:36px;border:3px solid #e5e5e0;border-top-color:#C45D2C;border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto 1rem;"></div>
  {:else if status === 'ok'}
    <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
  {:else}
    <div style="font-size:3rem;margin-bottom:1rem;">❌</div>
  {/if}
  <h1 style="font-size:2rem;font-weight:800;letter-spacing:-0.03em;">{status === 'loading' ? 'Verifying...' : status === 'ok' ? 'Booking Confirmed' : 'Verification Failed'}</h1>
  <p style="color:#6B6B66;margin:1rem 0 2rem;">{message}</p>
  <a href="/" style="color:#C45D2C;font-weight:600;">Back to Courses</a>
</div>

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
  body { font-family: 'Inter', system-ui, sans-serif; background: #fff; }
</style>
