export async function sendCustomerReceipt(params: {
  to: string;
  customerName: string;
  productName: string;
  amount: number;
  originalPrice?: number;
  couponCode?: string;
  purchaseId: string;
  bookingId?: string;
  paymentId: string;
  merchant: string;
  downloadLink?: string;
  bookingDate?: string;
  bookingTime?: string;
  bookingEndTime?: string;
  meetLink?: string;
}, env: { RESEND_API_KEY: string }) {
  const amountFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(params.amount);

  const originalFormatted = params.originalPrice
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(params.originalPrice)
    : '';

  const savings = params.originalPrice && params.originalPrice > params.amount
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(params.originalPrice - params.amount)
    : '';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Courses <noreply@akarshanarora.com>',
      to: [params.to],
      subject: `Payment Confirmed — ${params.productName}`,
      html: `
        <div style="margin: 0; padding: 0; background: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; padding: 2rem 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 1rem;">
                      <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 8px 8px 0 0 #0c2d6b;">
                        <div style="background: #0c2d6b; padding: 1.5rem 2rem; text-align: center;">
                          <h1 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;">Payment Confirmed</h1>
                          <p style="margin: 0.25rem 0 0; font-size: 0.9rem; color: rgba(255,255,255,0.85);">Thank you, ${params.customerName}</p>
                        </div>

                        <div style="padding: 2rem;">
                          <h2 style="margin: 0 0 1rem; font-size: 1.15rem; font-weight: 700; color: #0f172a;">${params.productName}</h2>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7f9fb; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Purchase ID</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; color: #0f172a;">${params.purchaseId}</td>
                            </tr>
                            ${params.bookingId ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Booking ID</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; color: #0f172a;">${params.bookingId}</td>
                            </tr>` : ''}
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Amount paid</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 1rem; font-weight: 700; color: #2563eb;">${amountFormatted}</td>
                            </tr>
                            ${params.couponCode ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Coupon</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-weight: 600; color: #16a34a;">${params.couponCode}</td>
                            </tr>` : ''}
                            ${originalFormatted ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Original price</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; color: #94a3b8; text-decoration: line-through;">${originalFormatted}</td>
                            </tr>` : ''}
                            ${savings ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">You saved</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-weight: 600; color: #16a34a;">${savings}</td>
                            </tr>` : ''}
                          </table>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7f9fb; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Merchant</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-weight: 600; color: #0f172a;">${params.merchant}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Payment ID</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; color: #0f172a;">${params.paymentId}</td>
                            </tr>
                          </table>

                          ${params.bookingDate && params.bookingTime ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4e8; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; border-left: 3px solid #16a34a;">
            <tr>
              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Booking date</td>
              <td align="right" style="padding: 0.5rem 0; font-size: 0.95rem; font-weight: 700; color: #0f172a;">${params.bookingDate}</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Booking time</td>
              <td align="right" style="padding: 0.5rem 0; font-size: 0.95rem; font-weight: 700; color: #0f172a;">${params.bookingTime}${params.bookingEndTime ? ' – ' + params.bookingEndTime : ''}</td>
            </tr>
            ${params.meetLink ? `<tr>
              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Join link</td>
              <td align="right" style="padding: 0.5rem 0; font-size: 0.8rem;"><a href="${params.meetLink}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${params.meetLink}</a></td>
            </tr>` : ''}
          </table>` : ''}

          ${params.bookingDate && params.bookingTime ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1.5rem;">
            <tr>
              <td align="center">
                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(params.productName)}&dates=${params.bookingDate}T${(params.bookingTime || '').replace(':', '')}00/${params.bookingDate}T${(params.bookingEndTime || '').replace(':', '')}00&details=${encodeURIComponent('Booking ID: ' + (params.bookingId || '') + '\nPurchase ID: ' + params.purchaseId)}&location=${encodeURIComponent(params.meetLink || '')}" style="display: inline-block; padding: 0.85rem 2.5rem; background: #0c2d6b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem;">Add to Google Calendar →</a>
              </td>
            </tr>
          </table>` : ''}

          ${params.downloadLink ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1.5rem;">
                            <tr>
                              <td align="center">
                                <a href="${params.downloadLink}" style="display: inline-block; padding: 0.85rem 2.5rem; background: #0c2d6b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem;">Download Resource →</a>
                              </td>
                            </tr>
                          </table>` : ''}

                          <div style="border-top: 1px solid #e2e8f0; padding-top: 1.25rem;">
                            <p style="margin: 0 0 0.5rem; font-size: 0.85rem; color: #64748b;">For any concerns or support, email us at <a href="mailto:akarshanarora@gmail.com" style="color: #2563eb; text-decoration: none;">akarshanarora@gmail.com</a></p>
                            <p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">Please keep this email and the payment IDs for your records.</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[email] Failed to send customer receipt:', err);
    return { ok: false, error: err.message || 'Failed to send receipt' };
  }

  return { ok: true };
}

export async function sendAdminNotification(params: {
  adminEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productKind: string;
  amount: number;
  originalPrice?: number;
  couponCode?: string;
  purchaseId: string;
  bookingId?: string;
  paymentId: string;
  merchant: string;
  merchantOrderId: string;
  status?: string;
  bookingDate?: string;
  bookingTime?: string;
  bookingEndTime?: string;
  meetLink?: string;
  answersHtml?: string;
  answersText?: string;
}, env: { RESEND_API_KEY: string }) {
  const amountFormatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(params.amount);

  const originalFormatted = params.originalPrice
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(params.originalPrice)
    : '';

  const isFailed = params.status === 'failed';
  const subject = isFailed
    ? `Payment Failed — ${params.productName}`
    : `New Purchase — ${params.productName} (${amountFormatted})`;
  const headerBg = isFailed ? '#450a0a' : '#0f172a';
  const headerTitle = isFailed ? 'Payment Failed' : 'New Purchase';

  const calDetails = `Booking ID: ${params.bookingId || ''}\nPurchase ID: ${params.purchaseId}\nCustomer: ${params.customerName}\nEmail: ${params.customerEmail}` + (params.answersText ? `\n\nCustomer Answers:\n${params.answersText}` : '');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Courses <noreply@akarshanarora.com>',
      to: [params.adminEmail],
      subject,
      html: `
        <div style="margin: 0; padding: 0; background: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; padding: 2rem 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 1rem;">
                      <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 8px 8px 0 0 #0c2d6b;">
                        <div style="background: ${headerBg}; padding: 1.5rem 2rem; text-align: center;">
                          <h1 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.02em;">${headerTitle}</h1>
                          <p style="margin: 0.25rem 0 0; font-size: 0.85rem; color: #94a3b8;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        <div style="padding: 2rem;">
                          <h2 style="margin: 0 0 0.25rem; font-size: 1.15rem; font-weight: 700; color: #0f172a;">${params.productName}</h2>
                          <p style="margin: 0 0 1.25rem; font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">${params.productKind}</p>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7f9fb; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem;">
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Customer</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.9rem; font-weight: 600; color: #0f172a;">${params.customerName}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Email</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem;"><a href="mailto:${params.customerEmail}" style="color: #2563eb; text-decoration: none;">${params.customerEmail}</a></td>
                            </tr>
                            ${params.customerPhone ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Phone</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; color: #0f172a;">${params.customerPhone}</td>
                            </tr>` : ''}
                          </table>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7f9fb; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem;">
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Amount</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: ${isFailed ? '#dc2626' : '#16a34a'};">${amountFormatted}</td>
                            </tr>
                            ${params.couponCode ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Coupon</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-weight: 600; color: #16a34a;">${params.couponCode}</td>
                            </tr>` : ''}
                            ${originalFormatted ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Original price</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; color: #94a3b8; text-decoration: line-through;">${originalFormatted}</td>
                            </tr>` : ''}
                          </table>

                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7f9fb; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem;">
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Merchant</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.85rem; font-weight: 600; color: #0f172a;">${params.merchant}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Purchase ID</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: #0f172a;">${params.purchaseId}</td>
                            </tr>
                            ${params.bookingId ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Booking ID</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: #0f172a;">${params.bookingId}</td>
                            </tr>` : ''}
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Payment ID</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: #0f172a;">${params.paymentId}</td>
                            </tr>
                            ${params.merchantOrderId ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Merchant Order ID</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: #0f172a;">${params.merchantOrderId}</td>
                            </tr>` : ''}
                          </table>

                          ${params.answersHtml ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7f9fb; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; border-left: 3px solid #0c2d6b;">
            <tr><td style="padding: 0.25rem 0; font-size: 0.85rem; font-weight: 700; color: #0f172a;">Customer answers</td></tr>
            ${params.answersHtml}
          </table>` : ''}

                          ${params.bookingDate && params.bookingTime ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4e8; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; border-left: 3px solid ${isFailed ? '#dc2626' : '#16a34a'};">
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Booking date</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.95rem; font-weight: 700; color: #0f172a;">${params.bookingDate}</td>
                            </tr>
                            <tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Booking time</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.95rem; font-weight: 700; color: #0f172a;">${params.bookingTime}${params.bookingEndTime ? ' – ' + params.bookingEndTime : ''}</td>
                            </tr>
                            ${params.meetLink ? `<tr>
                              <td style="padding: 0.5rem 0; font-size: 0.85rem; color: #64748b;">Meet link</td>
                              <td align="right" style="padding: 0.5rem 0; font-size: 0.8rem;"><a href="${params.meetLink}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${params.meetLink}</a></td>
                            </tr>` : ''}
                          </table>` : ''}

                          ${params.bookingDate && params.bookingTime ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1rem;">
                            <tr>
                              <td align="center">
                                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(params.productName + ' — ' + params.customerName)}&dates=${params.bookingDate}T${(params.bookingTime || '').replace(':', '')}00/${params.bookingDate}T${(params.bookingEndTime || '').replace(':', '')}00&details=${encodeURIComponent(calDetails)}&location=${encodeURIComponent(params.meetLink || '')}" style="display: inline-block; padding: 0.7rem 2rem; background: #0c2d6b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem;">Add to Google Calendar →</a>
                              </td>
                            </tr>
                          </table>` : ''}

                          ${isFailed ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; border-left: 3px solid #dc2626;">
                            <tr>
                              <td style="padding: 0; font-size: 0.85rem; color: #991b1b;"><strong>Action needed:</strong> Check Razorpay dashboard and DB to verify payment status. Customer may need manual intervention.</td>
                            </tr>
                          </table>` : ''}
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[email] Failed to send admin notification:', err);
    return { ok: false, error: err.message || 'Failed to send notification' };
  }

  return { ok: true };
}
