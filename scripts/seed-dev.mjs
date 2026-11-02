// Creates two active demo shops with DIFFERENT branding and catalogues, for local multi-tenant testing. Dev only.
// Idempotent: safe to run repeatedly. Writes straight to MongoDB with Nigerian fashion demo content.
import mongoose from "mongoose";
import { randomBytes, scrypt } from "node:crypto";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed in production.");
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set. Run via: npm run seed:dev (loads .env.local).");
  process.exit(1);
}

const shops = [
  {
    slug: "royalstitches", name: "Royal Stitches",
    profile: {
      tagline: "Senator, agbada and modern native wear, made to measure", description: "Royal Stitches is a Nigerian menswear studio specialising in senator styles, agbada, Isi Agu details and polished native tailoring.",
      vision: "Be the first name in made-to-measure menswear.", mission: "Fit, finish and delivery you can rely on.",
      brandColor: "#173D78", accentColor: "#21B8C9", contact: { email: "hello@royalstitches.example", phone: "+234 800 000 0001", city: "Port Harcourt", state: "Rivers" },
      policies: { delivery: "Pickup in store or delivery within Port Harcourt.", alterations: "One free alteration within 14 days." },
    },
    categories: [{ name: "Native two-piece", slug: "suits" }, { name: "Agbada & traditional wear", slug: "traditional-wear" }],
    products: [
      { name: "Senator Suit", slug: "senator-suit", category: "traditional-wear", price: 3500000, featured: true, variants: [["M", 4], ["L", 2], ["XL", 0]] },
      { name: "Native Two-Piece", slug: "two-piece-business-suit", category: "suits", price: 8500000, featured: true, variants: [["Standard", 5]] },
      { name: "Custom Agbada", slug: "custom-agbada", category: "traditional-wear", price: 6000000, kind: "custom_service", featured: false, variants: [["Standard", 0]], trackStock: false },
    ],
  },
  {
    slug: "elegantstyles", name: "Elegant Styles",
    profile: {
      tagline: "Ankara, lace and aso-ebi for every occasion", description: "Elegant Styles is a Nigerian womenswear studio creating Ankara, lace, Aso-ebi and contemporary African occasionwear.",
      brandColor: "#7A1F5C", accentColor: "#F2B8D9", contact: { email: "hello@elegantstyles.example", city: "Aba", state: "Abia" },
    },
    categories: [{ name: "Dresses", slug: "dresses" }, { name: "Aso-ebi", slug: "aso-ebi" }],
    products: [
      { name: "Ankara Peplum Dress", slug: "ankara-peplum-dress", category: "dresses", price: 2800000, featured: true, variants: [["S", 3], ["M", 6], ["L", 1]] },
      { name: "Aso-ebi Set", slug: "aso-ebi-set", category: "aso-ebi", price: 4500000, featured: true, variants: [["Standard", 10]] },
    ],
  },
];

// Same format as src/auth/password.ts: scrypt$N$r$p$saltB64$hashB64
const hash = (pw) => new Promise((res, rej) => {
  const salt = randomBytes(16);
  scrypt(pw.normalize("NFKC"), salt, 64, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(["scrypt", 32768, 8, 1, salt.toString("base64"), k.toString("base64")].join("$"))));
});
const DEMO_PASSWORD = "demo-password-2026";

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
const db = mongoose.connection;
const now = new Date();
const owner = new mongoose.Types.ObjectId("000000000000000000000001"); // placeholder createdBy for seeded products

for (const s of shops) {
  await db.collection("tenants").updateOne(
    { slug: s.slug },
    { $set: { name: s.name, status: "active", profile: s.profile, updatedAt: now }, $setOnInsert: { slug: s.slug, createdAt: now } },
    { upsert: true },
  );
  const tenant = await db.collection("tenants").findOne({ slug: s.slug });
  const catIds = {};
  for (const [i, c] of s.categories.entries()) {
    await db.collection("categories").updateOne(
      { tenantId: tenant._id, slug: c.slug },
      { $set: { name: c.name, sortOrder: i, isActive: true, updatedAt: now }, $setOnInsert: { tenantId: tenant._id, slug: c.slug, createdAt: now } },
      { upsert: true },
    );
    catIds[c.slug] = (await db.collection("categories").findOne({ tenantId: tenant._id, slug: c.slug }))._id;
  }
  for (const p of s.products) {
    const variants = p.variants.map(([label, stock]) => ({ _id: new mongoose.Types.ObjectId(), label, options: label === "Standard" ? {} : { size: label }, stock }));
    await db.collection("products").updateOne(
      { tenantId: tenant._id, slug: p.slug },
      {
        $set: { name: p.name, description: `${p.name} from ${s.name}. Nigerian-inspired tailoring made for modern wardrobes.`, kind: p.kind ?? "ready_made", categoryId: catIds[p.category], images: [], basePrice: p.price, currency: "NGN", status: "published", featured: p.featured, tags: ["Nigerian fashion", "African design"], trackStock: p.trackStock ?? true, lowStockThreshold: 3, updatedAt: now },
        $setOnInsert: { tenantId: tenant._id, slug: p.slug, variants, createdBy: owner, createdAt: now },
      },
      { upsert: true },
    );
  }
  console.log(`ready: http://${s.slug}.localhost:3000  (${s.products.length} products)`);
}

// Demo accounts (dev only) so tenant isolation can be tried by hand without editing the database:
//   owner@tailorly.example  - OWNER of Royal Stitches, plain CUSTOMER of Elegant Styles
//   buyer@tailorly.example  - customer of both shops
const users = db.collection("users");
const memberships = db.collection("tenantmemberships");
const demoUsers = [
  { email: "owner@tailorly.example", fullName: "Demo Owner", roles: { royalstitches: "owner", elegantstyles: "customer" } },
  { email: "buyer@tailorly.example", fullName: "Demo Buyer", roles: { royalstitches: "customer", elegantstyles: "customer" } },
];
const passwordHash = await hash(DEMO_PASSWORD);
for (const u of demoUsers) {
  await users.updateOne(
    { email: u.email },
    { $set: { fullName: u.fullName, status: "active", emailVerifiedAt: now, updatedAt: now }, $setOnInsert: { email: u.email, passwordHash, preferences: { marketingEmails: false }, createdAt: now } },
    { upsert: true },
  );
  const user = await users.findOne({ email: u.email });
  for (const [slug, role] of Object.entries(u.roles)) {
    const tenant = await db.collection("tenants").findOne({ slug });
    await memberships.updateOne(
      { tenantId: tenant._id, userId: user._id },
      { $set: { role, status: "active", updatedAt: now }, $setOnInsert: { tenantId: tenant._id, userId: user._id, createdAt: now } },
      { upsert: true },
    );
  }
  console.log(`demo account: ${u.email} / ${DEMO_PASSWORD}  (${Object.entries(u.roles).map(([s, r]) => `${s}:${r}`).join(", ")})`);
}
await mongoose.disconnect();
