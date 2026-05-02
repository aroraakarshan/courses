export function parseDateTime(date, timeSlot) {
  const hour = parseInt(timeSlot.split(':')[0])
  const isPM = timeSlot.includes('PM') && hour !== 12
  const isAM = timeSlot.includes('AM') && hour === 12
  const h = isPM ? hour + 12 : isAM ? 0 : hour
  const [y, mo, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1, d) + (h * 60 - 330) * 60000)
}

export function safeJsonParse(str) {
  try { return JSON.parse(str || '{}') } catch { return {} }
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

export function btoaSafe(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function emailShell(content) {
  return '<!DOCTYPE html><html><body style="font-family:\'Inter\',system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a;line-height:1.6;background:#fafaf7">'+content+'</body></html>'
}

export function generateICS(booking, meetLink) {
  const start = parseDateTime(booking.date, booking.time)
  const end = new Date(start.getTime() + 55 * 60000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Akarshan Arora//Courses//EN',
    'BEGIN:VEVENT',
    'DTSTART:'+fmt(start),'DTEND:'+fmt(end),
    'SUMMARY:1:1 — '+booking.service_name+' with '+booking.name,
    'DESCRIPTION:Session: '+booking.service_name+'\\nName: '+booking.name+'\\nEmail: '+booking.email+'\\nPhone: '+(booking.phone||'N/A')+'\\nMeet: '+meetLink,
    'LOCATION:'+meetLink,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n')
}

export async function logError(env, endpoint, body, e) {
  if (!env.DB) return 0
  const r = await env.DB.prepare(
    'INSERT INTO errors (endpoint, message, stack, body, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(endpoint, e.message || String(e), (e.stack || '').slice(0, 1000), JSON.stringify(body || {}).slice(0, 2000), Date.now()).run()
  return r.meta.last_row_id
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substring(i, i+2), 16)
  return bytes
}

export async function verifyRazorpaySignature(body, signature, secret) {
  if (!secret || !signature) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  return crypto.subtle.verify('HMAC', key, hexToBytes(signature), encoder.encode(body.payload ? JSON.stringify(body.payload) : JSON.stringify(body)))
}
