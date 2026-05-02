import { api } from '$lib/api.js';

export async function handle({ event, resolve }) {
  const path = new URL(event.request.url).pathname;
  if (path.startsWith('/api/') || path === '/admin/login' || path.startsWith('/admin/api/')) {
    return api.fetch(event.request, event.platform?.env);
  }
  return resolve(event);
}
