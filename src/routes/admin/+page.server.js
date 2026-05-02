const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

async function db(platform) { return platform?.env?.DB; }

async function allData(DB) {
  const [statsRow, recent, services, avail, coupons] = await Promise.all([
    DB.prepare("SELECT (SELECT COUNT(*) FROM services WHERE active=1) as services, (SELECT COUNT(*) FROM contacts WHERE status='confirmed') as bookings, (SELECT COUNT(*) FROM contacts WHERE status='downloaded') as downloads, COALESCE((SELECT SUM(price) FROM contacts WHERE status='confirmed'),0) as revenue").first(),
    DB.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 50').all(),
    DB.prepare('SELECT * FROM services WHERE active=1 ORDER BY price').all(),
    DB.prepare('SELECT * FROM availability ORDER BY day_of_week').all(),
    DB.prepare('SELECT * FROM coupons WHERE active=1 ORDER BY code').all(),
  ]);
  return {
    stats: statsRow,
    recent: recent.results || [],
    services: services.results || [],
    availability: (avail.results || []).map(r => ({ ...r, dayName: DAYS[r.day_of_week] })),
    coupons: coupons.results || [],
  };
}

export async function load({ platform }) {
  const DB = await db(platform); if (!DB) return { authed: false };
  return { authed: false, ...await allData(DB) };
}

export const actions = {
  login: async ({ request, platform }) => {
    const f = await request.formData();
    if (f.get('password') !== platform?.env?.ADMIN_PASSWORD) return { authed: false, error: 'Invalid password' };
    return { authed: true, ...await allData(await db(platform)) };
  },
  addService: async ({ request, platform }) => { const f = await request.formData(); const D = await db(platform); await D.prepare('INSERT OR REPLACE INTO services (slug, name, price, active) VALUES (?,?,?,1)').bind(f.get('slug'), f.get('name'), parseInt(f.get('price')||'0')).run(); return { authed: true, ...await allData(D) }; },
  delService: async ({ request, platform }) => { const f = await request.formData(); const D = await db(platform); await D.prepare('UPDATE services SET active=0 WHERE slug=?').bind(f.get('slug')).run(); return { authed: true, ...await allData(D) }; },
  addAvail: async ({ request, platform }) => { const f = await request.formData(); const D = await db(platform); await D.prepare('INSERT OR REPLACE INTO availability (day_of_week, start_time, end_time) VALUES (?,?,?)').bind(parseInt(f.get('dow')||'0'), f.get('start'), f.get('end')).run(); return { authed: true, ...await allData(D) }; },
  delAvail: async ({ request, platform }) => { const f = await request.formData(); const D = await db(platform); await D.prepare('DELETE FROM availability WHERE day_of_week=?').bind(parseInt(f.get('dow')||'0')).run(); return { authed: true, ...await allData(D) }; },
  addCoupon: async ({ request, platform }) => { const f = await request.formData(); const D = await db(platform); await D.prepare('INSERT OR REPLACE INTO coupons (code, discount_percent, service, max_uses, active) VALUES (?,?,?,?,1)').bind((f.get('code')||'').toUpperCase(), parseInt(f.get('discount')||'0'), f.get('service')||'', parseInt(f.get('max_uses')||'0')).run(); return { authed: true, ...await allData(D) }; },
  delCoupon: async ({ request, platform }) => { const f = await request.formData(); const D = await db(platform); await D.prepare('UPDATE coupons SET active=0 WHERE code=?').bind(f.get('code')).run(); return { authed: true, ...await allData(D) }; },
  updateStatus: async ({ request, platform }) => { const f = await request.formData(); const D = await db(platform); await D.prepare('UPDATE contacts SET status=? WHERE id=?').bind(f.get('status'), parseInt(f.get('id')||'0')).run(); return { authed: true, ...await allData(D) }; },
};
