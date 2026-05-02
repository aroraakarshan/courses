export async function load({ platform }) {
  let resources = [];
  try {
    const DB = platform?.env?.DB;
    if (DB) {
      const result = await DB.prepare('SELECT file, title, description FROM resources ORDER BY title').all();
      resources = result.results || [];
    }
  } catch {}
  return { resources };
}
