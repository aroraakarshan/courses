globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_B7LeHpqy.mjs';
import { manifest } from './manifest_DmjkpF9U.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/admin/api/availability.astro.mjs');
const _page2 = () => import('./pages/admin/api/contacts.astro.mjs');
const _page3 = () => import('./pages/admin/api/coupons.astro.mjs');
const _page4 = () => import('./pages/admin/api/services.astro.mjs');
const _page5 = () => import('./pages/admin/login.astro.mjs');
const _page6 = () => import('./pages/admin.astro.mjs');
const _page7 = () => import('./pages/api/availability.astro.mjs');
const _page8 = () => import('./pages/api/booked-slots.astro.mjs');
const _page9 = () => import('./pages/api/booking.astro.mjs');
const _page10 = () => import('./pages/api/create-order.astro.mjs');
const _page11 = () => import('./pages/api/download.astro.mjs');
const _page12 = () => import('./pages/api/payment-webhook.astro.mjs');
const _page13 = () => import('./pages/api/service.astro.mjs');
const _page14 = () => import('./pages/api/services.astro.mjs');
const _page15 = () => import('./pages/api/validate-coupon.astro.mjs');
const _page16 = () => import('./pages/api/verify-payment.astro.mjs');
const _page17 = () => import('./pages/book/confirmed.astro.mjs');
const _page18 = () => import('./pages/book/schedule.astro.mjs');
const _page19 = () => import('./pages/book.astro.mjs');
const _page20 = () => import('./pages/resources/download.astro.mjs');
const _page21 = () => import('./pages/resources/thank-you.astro.mjs');
const _page22 = () => import('./pages/resources.astro.mjs');
const _page23 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/admin/api/availability.ts", _page1],
    ["src/pages/admin/api/contacts.ts", _page2],
    ["src/pages/admin/api/coupons.ts", _page3],
    ["src/pages/admin/api/services.ts", _page4],
    ["src/pages/admin/login.ts", _page5],
    ["src/pages/admin.astro", _page6],
    ["src/pages/api/availability.ts", _page7],
    ["src/pages/api/booked-slots.ts", _page8],
    ["src/pages/api/booking.ts", _page9],
    ["src/pages/api/create-order.ts", _page10],
    ["src/pages/api/download.ts", _page11],
    ["src/pages/api/payment-webhook.ts", _page12],
    ["src/pages/api/service.ts", _page13],
    ["src/pages/api/services.ts", _page14],
    ["src/pages/api/validate-coupon.ts", _page15],
    ["src/pages/api/verify-payment.ts", _page16],
    ["src/pages/book/confirmed.astro", _page17],
    ["src/pages/book/schedule.astro", _page18],
    ["src/pages/book.astro", _page19],
    ["src/pages/resources/download.astro", _page20],
    ["src/pages/resources/thank-you.astro", _page21],
    ["src/pages/resources/index.astro", _page22],
    ["src/pages/index.astro", _page23]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
