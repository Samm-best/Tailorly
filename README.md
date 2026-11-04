# Tailorly - Phases 1 to 9

Phase 1 (Foundation), 2 (Authentication), 3 (Customer experience), 4 (Public site and storefront base), 5 (Catalogue), 6 (Custom orders, quotations and measurements), 7 (Cart, checkout and Paystack payments), 8 (Production management), and 9 (Messaging, notifications, appointments and delivery), checked against the Tailorly Project Handbook roadmap.

> **Status: reviewed and partly verified, not yet run end to end.** The build environment I used cannot reach the npm registry, so `npm install`, `next build`, ESLint, Vitest's own runner, Playwright and anything touching MongoDB/Next/React at runtime have **not** been executed. You must run them (commands below) before marking any phase complete.
>
> **What was actually verified in this review pass**
> - All **49 unit tests pass** (run with Node's test runner and a small Vitest shim, against real zod v4).
> - The whole `src` tree was **type-checked with TypeScript 6** (real zod types; Next, React and Mongoose replaced by loose stubs). It found **one real compile error**, now fixed (see below). Remaining diagnostics came only from the stubs.
> - The seed script's password hash was checked against the app's own `verifyPassword`.
>
> **Changes made in this pass**
> 1. `catalogue/schemas.ts`: the "default to one Standard variant" used a zod v4 `.default()` whose value did not match the schema's output type, which would have failed `npm run typecheck`/`build`. Now uses `.prefault([{}])` (test added).
> 2. `catalogue/images.ts`: the image-ownership check only tested that the URL path *contained* the shop's public id, so a crafted URL could embed it after another shop's path. It now requires the path to be exactly `[v123/]<publicId>[.ext]` (3 new tests).
> 3. `package.json`: `next`, `eslint-config-next`, `react`, `react-dom` were pinned to exact patch versions I could not confirm exist; now caret ranges (`^15.5.0`, `^19.2.0`) so install cannot fail on a missing patch.
> 4. `seed:dev` now also creates two demo accounts so isolation can be tried without editing the database (see "Try it").
> 5. `.env.example` no longer says Cloudinary is "not read yet".
> 6. Added `docs/ARCHITECTURE.md`, `docs/PROGRESS.md` and `.github/workflows/ci.yml` (typecheck, lint, test, build against a Mongo service).

## Run it

```powershell
Copy-Item .env.example .env.local      # set SESSION_SECRET and MONGODB_URI (Cloudinary keys optional, see below)
npm install
npm run typecheck
npm run lint
npm test
npm run seed:dev                       # two demo shops (different branding and catalogues) + demo accounts
npm run dev
```

- Root site: `http://localhost:3000`
- Shop A: `http://royalstitches.localhost:3000` (navy, suits and traditional wear)
- Shop B: `http://elegantstyles.localhost:3000` (plum, dresses and aso-ebi)
- Playwright: `npm run test:e2e` (run `seed:dev` first; `storefront.spec.ts` needs the demo shops).

### Sign in as a Super Admin

Super Admin access is granted to an existing, verified account; it is not a special password or a public registration option. Register normally at `/register`, verify the email, then run this command from the project root with the account email:

```powershell
npm run provision:super-admin -- you@example.com
```

After provisioning, sign in at `/login` with that account and open `/admin`. The dashboard checks the platform role server-side, so a normal customer or shop owner cannot access it. Keep `MONGODB_URI` and `SESSION_SECRET` configured in `.env.local`; never put credentials in source control.

## Try it (after `seed:dev`, which needs MongoDB running)

| Account | Royal Stitches | Elegant Styles |
|---|---|---|
| `owner@tailorly.example` | **owner** (can open `/manage`) | customer only (`/manage` shows "no access") |
| `buyer@tailorly.example` | customer | customer |

Password for both: `demo-password-2026` (development only; the seed refuses to run in production). Sign in separately on each shop address: sessions are host-only, so a login on one shop never authenticates you on another.

## Phase 4 - what is built

**Main Tailorly website (root domain only):** Home with the approved headline and the "Explore Shops" / "Create Your Shop" buttons, About, How It Works, For Tailors, Features (split into *Available now* and *Coming next*), Meet the Creator, FAQ, Contact, Get Started, and the **shop directory** `/shops` (search + pagination, active shops only). Titles, descriptions, `sitemap.xml` and `robots.txt` are generated per host.

**Contact form:** `POST /api/v1/contact` stores messages in a `ContactMessage` collection (topics: general, support, shop interest). Rate-limited (5/hour/IP), honeypot field, root domain only. There is no admin inbox yet (Phase 11) and no email notification.

**Shop storefronts (shop hosts only):** branded home (name, logo or initial, tagline, story, featured products, category chips), Shop, About (story, vision, mission), Contact (address, phone, email, social links, policies). The same URL path (`/`, `/about`, `/contact`) shows the Tailorly page on the root domain and the shop's page on a shop host, decided only by the trusted `Host` header.

**Branding:** per-shop main and accent colours (validated `#rrggbb`, text colour auto-chosen for contrast), logo, tagline, policies. Colours only restyle the shop shell, never Tailorly's own pages. A **Verified** badge appears only when `Tenant.verifiedAt` is set, which nothing in this build can do (platform staff will, in Phase 11).

**Owner/manager settings:** `/manage/profile` on a shop host (and `GET/PATCH /api/v1/shop/profile`).

## Phase 5 - what is built

- **Models:** `Category`, `Product` (embedded variants), `StockMovement` ledger. Every document carries `tenantId`; unique slugs are per shop.
- **Money** is stored as integer kobo; `formatNaira`/`parseNairaToKobo` convert at the edges.
- **Products:** ready-made or custom service, draft/published/archived, featured flag, tags, up to 8 photos, compare-at price, categories. "Delete" archives (orders in Phase 7 must keep a real product to point at).
- **Variants:** size / colour / fabric / SKU / optional own price / stock. A product without options has one "Standard" variant, so stock logic is uniform for checkout later.
- **Stock:** editing a product never changes existing stock. Changes go through `POST /api/v1/shop/products/:id/stock`, which is atomic (never below zero) and writes a ledger entry with who/why/balance. Opening stock is also ledgered. `trackStock: false` means always available (e.g. custom services).
- **Images:** direct-to-Cloudinary signed uploads (`POST /api/v1/shop/uploads/sign`). The server builds the folder `tailorly/<tenantId>/<area>` from the Host-resolved tenant, and saving an image URL is rejected unless it points at that shop's own folder on your Cloudinary cloud. Without Cloudinary keys the sign route and image saving return a clear "not configured" error; everything else works.
- **Storefront:** `/products` (search, category chips, sort, pagination) and `/products/[slug]` (gallery, price range, options with availability, JSON-LD). Public pages show *published* products only and never expose exact stock, SKUs, status or Cloudinary ids.
- **Management UI:** `/manage` (hub), `/manage/products` (list, filter, search), `/manage/products/new` and `/manage/products/:id` (editor, photo upload, variants, stock tool and history), `/manage/categories`.

## Phase 6-7 API surface

- `GET/POST /api/v1/account/measurements`, `PATCH/DELETE /api/v1/account/measurements/:id`, and `POST /api/v1/account/measurements/:id` to explicitly share with the current shop
- `POST /api/v1/shop/uploads/sign` supports `custom-orders` for authenticated customers; reference images must belong to the current shop folder
- `GET/POST /api/v1/shop/custom-orders` and `POST /api/v1/shop/custom-orders/:id/accept`
- `GET /api/v1/shop/custom-orders/manage` and `POST /api/v1/shop/custom-orders/:id/quote`
- `GET/PUT /api/v1/shop/cart`
- `POST /api/v1/shop/checkout` and `POST /api/v1/shop/payments/verify`
- `GET /api/v1/shop/orders`, `POST /api/v1/shop/orders/:id/cancel`, and `POST /api/v1/shop/payments/webhook`
- `GET /api/v1/shop/orders/manage` for shop managers
- `GET /api/v1/account/orders` for the universal customer order history
- `GET/PATCH /api/v1/shop/production` and `/api/v1/shop/production/:id`, plus order/custom-order job creation endpoints
- `GET/POST /api/v1/shop/conversations`, `GET/POST /api/v1/shop/conversations/:id/messages`
- `GET/POST /api/v1/shop/appointments` and `PATCH /api/v1/shop/appointments/:id`
- `GET /api/v1/shop/deliveries`, `POST /api/v1/shop/deliveries/orders/:id`, and `PATCH /api/v1/shop/deliveries/:id`

Phase 8-9 operations are tenant-scoped and use the existing in-app notification feed. Real-time Socket.IO delivery, email/SMS/WhatsApp notifications, and background jobs remain deployment-dependent enhancements rather than silently added infrastructure.

Set `PAYSTACK_SECRET_KEY` and `PAYSTACK_WEBHOOK_SECRET` in `.env.local` to enable checkout and signed webhook processing. Keep both server-side; never expose them to browser code. Refund/reconciliation workflows remain launch-hardening work.

## Tenant isolation, as built

- Every catalogue/storefront function takes `tenantId` from the Host-resolved tenant and filters on it. Client bodies cannot carry `tenantId`, `slug`, `createdBy`, `status` of the shop or `verifiedAt` (schemas are `.strict()`; tests assert this).
- `requireShopManager` = Host tenant + session + **this shop's** membership with role owner/manager. A manager elsewhere gets 403.
- A variant id or category id from another product/shop is rejected; the public product URL of another shop's slug returns 404.
- Storefront pages exist only on shop hosts (`/products` on the root domain is 404); marketing pages exist only on the root domain.

## Deliberate choices to review

1. **Interim permissions.** Only `owner` and `manager` manage the catalogue and storefront (`CATALOGUE_MANAGER_ROLES`). Phase 10 replaces this with the configurable permission centre.
2. **Collections are not built.** Phase 5 scope in your roadmap is products, categories, variants, images, stock. "Featured" and categories cover the storefront for now.
3. **Search is a case-insensitive name/tag match** with an escaped pattern, adequate for a small catalogue. Add a text or Atlas index if catalogues grow.
4. **Stock reservation uses conditional updates with compensating rollback.** This avoids negative stock without requiring a replica set; production can switch to a MongoDB transaction once replica-set deployment is confirmed. Stock-ledger reconciliation remains a launch-hardening task.
5. **Upload size/type** are checked in the browser (5 MB, JPG/PNG/WebP). Cloudinary cannot enforce size on a plain signed upload; to enforce it server-side add an upload preset with limits and sign that.
6. **Meet the Creator** shows only what you fill in `src/site/creator.ts`. Bio, photo, portfolio and social links are empty on purpose; I did not invent any.
7. **No prices or plans** are shown anywhere (your handbook says not to invent them).
8. **Shop applications:** "Create Your Shop" leads to a contact form with topic "I want to open a shop". Real owner onboarding and approval is Phase 11.
9. **Custom domains** are not built (later capability).
10. **In-memory rate limiting** still applies (see Phase 1-3 notes).

## Acceptance checks to run by hand

| Roadmap evidence | How |
|---|---|
| Root site and two demo shops resolve independently | Open the three URLs above. Each has its own header, colours, home page |
| Shop A and B show different catalogues | `/products` on each. Senator Suit only on Royal Stitches, Ankara Peplum Dress only on Elegant Styles |
| Another shop's product is not reachable | `http://elegantstyles.localhost:3000/products/senator-suit` is 404 |
| Manager rights do not carry over | Sign in as `owner@tailorly.example` on both shops. `/manage/products` works on Royal Stitches and shows "no access" on Elegant Styles |
| Drafts stay hidden | Create a draft product; it is absent from the storefront and sitemap until published |
| Stock cannot go negative | Try `-999` in the stock tool; you get a "not enough stock" message |
| Image from another shop rejected | `PATCH` a product with an image whose `publicId` is in another tenant's folder: 400 |
| Spoofed tenant | Send `x-tailorly-tenant: other` or `tenantId` in a body; ignored / rejected |
| Branding applies only to the shop | Change colours in `/manage/profile`; the root site and `/login` stay navy/cyan |
| SEO | View source on a product page: title, description, JSON-LD; `/sitemap.xml` per host |

## Current scope and remaining roadmap

Phases 1-9 are implemented in this repository, including custom orders and measurements, cart and Paystack checkout, production jobs, messaging, notifications, appointments and delivery. They still require the environment-backed acceptance checks listed in `docs/PROGRESS.md` before being marked complete.

The remaining roadmap is:

- Phase 10: configurable business permissions and broader staff management.
- Phase 11: owner onboarding and approval, Super Admin screens, contact-message inbox and platform controls.
- Phase 12: MFA, Redis-backed rate limiting, database-backed integration coverage, authenticated Playwright flows, production DNS/SSL verification, refund/reconciliation and launch hardening.

## Docs

`docs/ARCHITECTURE.md` (request flow, data model, security rules) and `docs/PROGRESS.md` (phase tracker for the handbook).

## Layout

`src/lib` env, errors, logger, HTTP wrapper, rate limit, CSRF, page-context, upload-client - `src/db` - `src/tenancy` - `src/tenants`, `src/platform` - `src/auth` (+ `shop-access.ts`) - `src/customers` - `src/storefront` (branding, serializer, service, schemas) - `src/catalogue` (models, schemas, service, money, slug, availability, images, serializers) - `src/site` (contact model/schema, creator content) - `src/components` (`ui`, `site` shells) - `src/app` pages, `api/v1/shop/*`, `manage/*` - `scripts` seed and super-admin - `tests/e2e`.
