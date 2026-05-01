export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: form submit → store lead → return PDF as download
    if (url.pathname === '/api/download' && request.method === 'POST') {
      try {
        const { name, email, phone, resource } = await request.json();
        if (!name || !email || !resource) {
          return new Response(JSON.stringify({ error: 'name, email, and resource are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Store lead
        if (env.DB) {
          await env.DB.prepare(
            'INSERT INTO downloads (name, email, phone, resource, created_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(name, email, phone || '', resource, Date.now()).run();
        } else {
          console.log(JSON.stringify({ name, email, phone, resource, ts: Date.now() }));
        }

        // Fetch the PDF from assets and return it as a download
        const pdfResponse = await env.ASSETS.fetch(
          new Request(new URL(`/resources/${resource}`, request.url))
        );

        if (pdfResponse.status !== 200) {
          return new Response(JSON.stringify({ error: 'file not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const headers = new Headers(pdfResponse.headers);
        headers.set('Content-Disposition', `attachment; filename="${resource}"`);

        return new Response(pdfResponse.body, {
          status: 200,
          headers,
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Block direct PDF access — only through the API
    if (url.pathname.startsWith('/resources/') && url.pathname.endsWith('.pdf')) {
      const filename = url.pathname.split('/').pop();
      return Response.redirect(`${url.origin}/resources/download/?r=${filename}`, 302);
    }

    // Serve everything else from dist/
    return env.ASSETS.fetch(request);
  },
};
