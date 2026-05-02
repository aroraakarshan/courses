export async function load({ platform, url }) {
  const file = url.searchParams.get('r') || '';
  let title = file;
  try {
    const DB = platform?.env?.DB;
    if (DB && file) {
      const r = await DB.prepare('SELECT title FROM resources WHERE file = ?').bind(file).first();
      if (r) title = r.title;
    }
  } catch {}
  return { file, title };
}
