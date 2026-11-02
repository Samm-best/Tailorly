# Progress tracker (phases 1-9)

Mark a phase **Complete** only after you have run the checks below on your own machine. Statuses here are what was verified when this drop was prepared.

| Phase | Built | Verified in preparation | You still need to confirm |
|---|---|---|---|
| 1 Foundation | Yes | 54 unit tests pass; typecheck fix applied for cart and document serialization | `npm install`, `typecheck`, `lint`, `build`, DB connects |
| 2 Authentication | Yes | Password/token/identity logic tested | Register, verify, login, reset on two shops |
| 3 Customer experience | Yes | Schemas compile | Profile, addresses, privacy export, "My shops" |
| 4 Public site and storefront base | Yes | Host resolution, branding and public-shape tests | Root + two demo shops resolve independently |
| 5 Catalogue | Yes | Money, slug, stock-state, image-ownership and schema tests | Two shops show different catalogues, stock cannot go negative |
| 6 Custom orders, quotations and measurements | Yes | Server routes, schema tests and tenant/image/measurement guards added | Customer request, explicit measurement sharing, owner quote and customer acceptance on two shops |
| 7 Cart, checkout and Paystack payments | Yes | Atomic stock reservation and idempotent checkout implemented | Configure Paystack, complete sandbox payment, verify callback/redirect and refund/reconciliation policy |
| 8 Production management | Yes | Production models, stage transitions, notifications and basic customer/manager pages added; test runner unavailable | Create jobs from paid/custom orders and verify stage isolation across two shops |
| 9 Messaging, notifications, appointments and delivery | Yes | Tenant-scoped conversation, appointment, delivery and notification workflows added; test runner unavailable | Verify customer/shop messaging, appointment conflicts, delivery role access and notification display |

Evidence log (add a line after each session): date - what you ran - result - commit.

## Verification status (2026-11-01)

- `npm test`: 54 tests passed across 13 files.
- `npm run typecheck`: fixed the cart input ObjectId conversion and generic document serializers; rerun after dependency installation.
- `npm run lint`: the manifest was corrected to use ESLint 10 with the matching Next 16 config; rerun after dependency installation.
- `npm run build`: still required.
- MongoDB-backed and authenticated browser checks: still required; these are environment acceptance checks, not unit-test substitutes.

## Phase 6-7 implementation notes

- Measurement profiles are private by default. A profile must be explicitly shared from that shop host before a customer can attach it to that shop request; sharing one shop does not grant another shop access.
- Custom orders are scoped by the trusted shop host and customer account. Shop managers quote through the protected management endpoint; customers accept only their own active quote.
- Customer reference images use signed uploads into the current shop's `custom-orders` folder; arbitrary external or cross-shop image URLs are rejected.
- Cart contents are scoped by both shop tenant and customer. Checkout revalidates published products and variants, reserves tracked stock atomically, and uses an idempotency key.
- Paystack is called only from the server with `PAYSTACK_SECRET_KEY`; signed `charge.success` webhooks use `PAYSTACK_WEBHOOK_SECRET`. Customer verification checks tenant, user, reference, status and amount before marking an order paid.
- Customer UI now covers add-to-cart, cart checkout, and universal order history. Shop managers can read tenant-scoped orders, and customers can cancel pending payments safely.

## Phase 8-9 implementation notes

- Production jobs are linked to paid orders or accepted custom orders and use a forward-only sewing-stage workflow. Customers can view only their jobs on the current shop host.
- Conversations and messages are tenant-scoped. Customers can access their own conversations; owner, manager, tailor and staff roles can operate shop conversations.
- Appointments reject overlapping active bookings. Delivery updates are restricted to owner, manager and delivery roles.
- Every production, appointment, message and delivery update creates an in-app notification for the affected customer.
