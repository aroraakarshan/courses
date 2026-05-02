const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BUFFER = 5;

export async function load({ platform, url }) {
  const svc = url.searchParams.get('s') || '';
  const svcName = url.searchParams.get('n') || '';
  const dur = parseInt(url.searchParams.get('d') || '55');
  if (!svc || !svcName) return { redirect: '/book/' };

  let price = 0;
  let slotData = {};
  let dates = [];

  try {
    const DB = platform?.env?.DB;
    if (!DB) return { svc, svcName, dur, price, slotData: {}, dates: [] };

    const s = await DB.prepare('SELECT price FROM services WHERE slug = ? AND active = 1').bind(svc).first();
    if (s) price = s.price;

    const rows = await DB.prepare('SELECT day_of_week, start_time, end_time FROM availability').all();
    for (const r of rows.results || []) {
      const [sh, sm] = r.start_time.split(':').map(Number);
      const [eh, em] = r.end_time.split(':').map(Number);
      let cur = sh * 60 + sm, end = eh * 60 + em;
      while (cur + dur <= end) {
        const h = Math.floor(cur / 60), m = cur % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        const time = h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
        (slotData[r.day_of_week] ||= []).push(time);
        cur += dur + BUFFER;
      }
    }

    const availDays = Object.keys(slotData).map(Number);
    const today = new Date(); today.setHours(0,0,0,0);
    let d = new Date(today); d.setDate(d.getDate() + 1);
    while (dates.length < 5) {
      if (availDays.includes(d.getDay())) {
        dates.push({ iso: d.toISOString().split('T')[0], day: d.getDate(), dow: d.getDay(), dowName: DAYS[d.getDay()], month: MONTHS[d.getMonth()] });
      }
      d.setDate(d.getDate() + 1);
    }
  } catch {}

  return { svc, svcName, dur, price, slotData, dates };
}
