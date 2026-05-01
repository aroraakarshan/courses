# courses

Booking & payments for VLSI courses and career guidance sessions. Built with Astro + Cloudflare Workers (D1, R2).

## Project structure

```
worker.js           — Cloudflare Worker (API routes, payment handling, email notifications)
src/pages/          — Astro pages (booking flow, download page, resource listing)
wrangler.jsonc      — Wrangler config (D1 binding, R2 bucket, assets)
```

## Services

| Slug | Name | Price (INR) |
|---|---|---|
| `python-vlsi` | Python for VLSI | 799 |
| `pdn-guidance` | PDN Guidance | 999 |
| `redhawk-seascape` | RedHawk / SeaScape | 1,499 |
| `career-guidance` | Career Guidance | 599 |

## Coupon management

Coupons are managed directly in the D1 database — there is no admin UI. All commands target the production database (`--remote`).

### Add a coupon

```bash
# Universal (applies to all services)
npx wrangler d1 execute courses-db --remote --command \
  "INSERT INTO coupons (code, discount_percent, max_uses) VALUES ('WELCOME20', 20, 100);"

# Service-specific
npx wrangler d1 execute courses-db --remote --command \
  "INSERT INTO coupons (code, discount_percent, max_uses, service) VALUES ('PDN50', 50, 10, 'pdn-guidance');"
```

### View all coupons

```bash
npx wrangler d1 execute courses-db --remote --command "SELECT * FROM coupons;"
```

### Deactivate / reactivate

```bash
npx wrangler d1 execute courses-db --remote --command \
  "UPDATE coupons SET active = 0 WHERE code = 'WELCOME20';"
```

### Reset usage count

```bash
npx wrangler d1 execute courses-db --remote --command \
  "UPDATE coupons SET used = 0 WHERE code = 'WELCOME20';"
```

### Coupon table schema

| Column | Description |
|---|---|
| `code` | Unique coupon code (user-facing) |
| `discount_percent` | Percentage off (e.g. 20 = 20%) |
| `max_uses` | Max redemptions (`0` = unlimited) |
| `used` | Auto-incremented on each successful order |
| `active` | `1` = active, `0` = disabled |
| `service` | `''` = all services, or a specific slug |

### How coupons work

1. User enters a code and clicks "Apply" on the booking page.
2. `POST /api/validate-coupon` checks if the code is active, not exhausted, and valid for the selected service. Returns the discounted price.
3. On payment, `POST /api/create-order` re-validates the coupon and atomically increments `used`. If the coupon is exhausted in the meantime, the order is rejected.
4. The coupon code is stored in the `contacts` row for reporting.
