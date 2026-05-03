<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props();

  interface FileEntry {
    key: string;
    name: string;
    size: number;
    url: string;
  }

  const order = data.order;
  let attempts = $state(0);
  let polling = $state(!data.order && !!data.purchaseId);
  let timedOut = $state(false);

  onMount(() => {
    if (!polling || !data.purchaseId) return;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch(`/api/orders/${data.purchaseId}`);
        const d = await r.json();
        if (d.status === 'confirmed' || d.status === 'completed') {
          polling = false;
          clearInterval(interval);
          window.location.href = `/call/confirmed?p=${data.purchaseId}`;
          return;
        }
      } catch {}
      if (attempts >= 30) {
        polling = false;
        timedOut = true;
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  });

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function calendarLink(): string {
    if (!order?.bookingDate || !order?.bookingTime) return '';
    const date = order.bookingDate;
    const startTime = order.bookingTime.replace(':', '');
    const endTime = (order.bookingEndTime || '').replace(':', '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${order.productName}`,
      dates: `${date}T${startTime}00/${date}T${endTime}00`,
      details: `Booking ID: ${order.bookingId || ''}\nPurchase ID: ${data.purchaseId}`,
      location: order.meetLink || '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
</script>

<svelte:head><title>Thank You — Courses</title></svelte:head>

<div class="page">
  <div class="heart">💛</div>
  <h1>Thank you</h1>
  {#if order}
    <p class="sub">Your booking is confirmed. Session details have been emailed to you.</p>
  {:else if polling}
    <p class="sub">Your payment is being processed. This should take just a moment...</p>
    <div class="spinner"></div>
  {:else if timedOut}
    <p class="sub">We haven't received confirmation yet. Check your email for the confirmation and session details.</p>
  {:else}
    <p class="sub">Your booking is not yet confirmed. Check your email for updates.</p>
  {/if}

  {#if order}
    <div class="details">
      <div class="row">
        <span class="label">Session</span>
        <span class="value">{order.productName}</span>
      </div>
      <div class="row">
        <span class="label">Session date</span>
        <span class="value">{formatDate(order.bookingDate + 'T00:00:00')}</span>
      </div>
      <div class="row">
        <span class="label">Time</span>
        <span class="value">{order.bookingTime} – {order.bookingEndTime}</span>
      </div>
      {#if order.meetLink}
        <div class="row">
          <span class="label">Meet link</span>
          <span class="value"><a href={order.meetLink} target="_blank" rel="noopener" class="meet-link">{order.meetLink}</a></span>
        </div>
      {/if}
      <div class="row">
        <span class="label">Amount paid</span>
        <span class="value amount">{formatCurrency(order.amountPaid)}</span>
      </div>
      {#if order.originalPrice && order.originalPrice > order.amountPaid}
        <div class="row">
          <span class="label">Original price</span>
          <span class="value strikethrough">{formatCurrency(order.originalPrice)}</span>
        </div>
      {/if}
      <div class="row">
        <span class="label">Email</span>
        <span class="value">{order.customerEmail}</span>
      </div>
      <div class="row">
        <span class="label">Payment ID</span>
        <span class="value mono">{order.paymentId}</span>
      </div>
      <div class="row">
        <span class="label">Purchase ID</span>
        <span class="value mono">{data.purchaseId}</span>
      </div>
      {#if order.bookingId}
        <div class="row">
          <span class="label">Booking ID</span>
          <span class="value mono">{order.bookingId}</span>
        </div>
      {/if}
      <div class="row">
        <span class="label">Order date</span>
        <span class="value">{formatDate(order.createdAt)}</span>
      </div>
    </div>

    {#if calendarLink()}
      <a href={calendarLink()} target="_blank" rel="noopener" class="cal-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Add to Google Calendar
      </a>
    {/if}
  {/if}

  <a href="/call" class="back">← Back to Calls</a>
</div>

<style>
  .page { display: flex; flex-direction: column; align-items: center; max-width: 480px; margin: 0 auto; padding: 4rem 2rem 6rem; }
  .heart { font-size: 3rem; margin-bottom: 1.5rem; }
  h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
  .sub { color: var(--muted, #6b6b66); font-size: 0.95rem; margin-bottom: 2.5rem; text-align: center; }
  .details { width: 100%; background: var(--paper, #fafaf7); border: 1px solid var(--hairline, #e5e5e0); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
  .row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid var(--hairline, #e5e5e0); }
  .row:last-child { border-bottom: none; }
  .label { color: var(--muted, #6b6b66); font-size: 0.85rem; }
  .value { font-size: 0.9rem; font-weight: 500; text-align: right; }
  .amount { color: var(--accent, #c45d2c); font-weight: 700; }
  .strikethrough { text-decoration: line-through; color: var(--tertiary, #a3a39e); }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; letter-spacing: 0.05em; }
  .meet-link { color: #2563eb; text-decoration: none; word-break: break-all; }
  .meet-link:hover { text-decoration: underline; }
  .cal-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.5rem; background: #fff; border: 1px solid var(--hairline, #e5e5e0); border-radius: 8px; color: var(--accent, #c45d2c); text-decoration: none; font-size: 0.85rem; font-weight: 600; margin-bottom: 2rem; }
  .cal-btn:hover { background: var(--accent, #c45d2c); color: #fff; border-color: var(--accent, #c45d2c); }
  .cal-btn svg { flex-shrink: 0; }
  .back { color: var(--tertiary, #a3a39e); text-decoration: none; font-size: 0.85rem; }
  .spinner { width: 32px; height: 32px; border: 3px solid var(--hairline, #e5e5e0); border-top-color: var(--accent, #c45d2c); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 2rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
