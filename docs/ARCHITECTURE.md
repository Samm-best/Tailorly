# Tailorly architecture (Phases 1-9)

One Next.js app (App Router, TypeScript, Tailwind) serves three experiences. The **Host header** decides which.

| Host | Experience |
|---|---|
| `tailorly.com` / `localhost` | Main Tailorly marketing site, shop directory, auth pages, customer account |
| `<slug>.tailorly.com` / `<slug>.localhost` | One shop's branded storefront and `/manage` area |
| anything else | 404 in production (falls back to root in development) |

## Request flow

1. `src/middleware.ts` strips any client-sent `x-tailorly-*` header and adds a request id.
2. API routes are wrapped by `runApi` (`src/lib/http.ts`): CSRF same-origin check, safe error envelope, `Cache-Control: no-store`.
3. `resolveTenantContext(host)` (`src/tenancy/context.ts`) maps the Host to `root` or an **active** tenant. The browser never supplies a tenant id.
4. Private shop routes call `requireShopManager` (`src/auth/shop-access.ts`): Host tenant + session user + **that shop's** membership with an allowed role.
5. Every query in `src/catalogue/service.ts` and `src/storefront/service.ts` filters on the resolved `tenantId`.

## Data model

- Global: `User` (one universal account), `AuthSession`, `AuthToken`, `PlatformRoleAssignment`, `ContactMessage`.
- Tenant-owned (always carry `tenantId`): `TenantMembership` (role per shop), `Category`, `Product` (embedded variants), `StockMovement`, `Notification`/addresses in `customers`.
- `Tenant` holds the public profile (branding, contact, policies). `verifiedAt` can only be set by platform staff (Phase 11).
- Money is integer kobo.

## Security rules enforced in code

- Passwords: scrypt, per-hash salt, parameters stored with the hash. Sessions: opaque random token, only an HMAC is stored, host-only cookie (`__Host-` in production), revocable.
- Account enumeration: register / forgot-password / resend return the same response either way.
- Roles are per shop. A role in shop A is never consulted for shop B.
- Uploads: signed direct-to-Cloudinary into `tailorly/<tenantId>/<area>`. A saved image URL must point at exactly the shop's own public id (`src/catalogue/images.ts`).
- Public catalogue shapes never expose exact stock, SKUs, status, Cloudinary ids or creator ids.
- Measurements, custom orders, carts, orders and payments are tenant-scoped. Measurements default to private and are only attached to a request when explicitly shared.
- Checkout revalidates catalogue data and uses conditional stock updates plus an idempotency key. Paystack secrets are server-only; verification checks amount and ownership.
- Operations data (`ProductionJob`, `Conversation`, `Message`, `Appointment`, `Delivery`) always carries `tenantId`. Production and delivery mutations are role-gated, while customer reads are constrained by `customerId`.

## Folder map

`src/lib` shared infra - `src/db` - `src/tenancy` - `src/tenants` - `src/platform` - `src/auth` - `src/customers` - `src/storefront` - `src/catalogue` - `src/site` - `src/components` - `src/app` (pages, `api/v1/*`, `manage/*`) - `scripts` - `tests/e2e` - `docs`.

## Known limits (by design, tracked for later phases)

In-memory rate limiter (Redis in Phase 12) - interim owner/manager-only permissions (Phase 10) - no DB-backed integration tests yet - checkout uses conditional stock reservation with compensating rollback; a MongoDB transaction can be enabled when production replica-set deployment is confirmed - owner onboarding, Super Admin controls and launch verification remain in Phases 11-12.
