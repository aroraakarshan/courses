export async function load({ cookies, platform }) {
  const token = cookies.get('admin_token');
  let authed = false;
  if (token) {
    // Verify token
    try {
      const [expB64, hexB64] = token.split('.');
      const exp = atob(expB64), hex = atob(hexB64);
      if (parseInt(exp) > Date.now()) {
        const secret = platform?.env?.ADMIN_PASSWORD;
        if (secret) {
          const sig = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
          const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
          authed = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(exp));
        }
      }
    } catch {}
  }
  return { authed };
}
