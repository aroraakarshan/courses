export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/download' && request.method === 'POST') {
      try {
        const { name, email, phone, resource } = await request.json();
        if (!name || !email || !resource) {
          return new Response(JSON.stringify({ error: 'name, email, and resource are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Store lead in D1
        if (env.DB) {
          await env.DB.prepare(
            'INSERT INTO downloads (name, email, phone, resource, created_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(name, email, phone || '', resource, Date.now()).run();
        } else {
          console.log(JSON.stringify({ name, email, phone, resource, ts: Date.now() }));
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Serve static from dist/
    return env.ASSETS.fetch(request);
  },
};
