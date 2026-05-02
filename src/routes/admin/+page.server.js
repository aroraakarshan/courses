import { ADMIN_HTML } from '$lib/admin.js';

export async function load({ platform }) {
  return { authed: false };
}

export const actions = {
  default: async ({ request, platform }) => {
    const form = await request.formData();
    const pw = form.get('password');
    if (pw && pw === platform?.env?.ADMIN_PASSWORD) {
      return { authed: true, html: ADMIN_HTML };
    }
    return { authed: false, error: 'Invalid password' };
  }
};
