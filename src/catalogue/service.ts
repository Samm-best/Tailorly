import { Types } from "mongoose";
import { connectDb } from "@/db/mongoose";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { Category, Product, StockMovement, type ProductDoc } from "@/catalogue/models";
import type { ProductInput, ProductUpdate } from "@/catalogue/schemas";
import { isTenantImage } from "@/catalogue/images";
import { toManageProduct, toPublicProduct, variantLabel } from "@/catalogue/serialize";
import { slugify, uniqueSlug } from "@/catalogue/slug";

/**
 * Tenant rule for this file: `tenantId` is ALWAYS the id resolved from the trusted Host header
 * (see tenancy/context.ts). It is never read from a request body or query string, and every
 * query below filters on it, so one shop can never read or change another shop's catalogue.
 */
const tid = (tenantId: string) => new Types.ObjectId(tenantId);
const oid = (id: string) => new Types.ObjectId(id);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PAGE_SIZE_PUBLIC = 12;
const PAGE_SIZE_MANAGE = 20;

/* ---------------- categories ---------------- */

export async function listCategories(tenantId: string, opts: { onlyActive?: boolean } = {}) {
  await connectDb();
  const rows = await Category.find({ tenantId: tid(tenantId), ...(opts.onlyActive ? { isActive: true } : {}) })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return rows.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive }));
}

export async function createCategory(tenantId: string, input: { name: string; description?: string; sortOrder?: number; isActive?: boolean }) {
  await connectDb();
  const slug = await uniqueSlug(slugify(input.name), async (s) => Boolean(await Category.exists({ tenantId: tid(tenantId), slug: s })));
  const doc = await Category.create({ ...input, tenantId: tid(tenantId), slug });
  return { id: String(doc._id), name: doc.name, slug: doc.slug };
}

export async function updateCategory(tenantId: string, id: string, patch: { name?: string; description?: string; sortOrder?: number; isActive?: boolean }) {
  await connectDb();
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) throw new AppError("VALIDATION_ERROR", "Nothing to update.");
  const doc = await Category.findOneAndUpdate({ _id: oid(id), tenantId: tid(tenantId) }, { $set: clean }, { new: true });
  if (!doc) throw new AppError("NOT_FOUND", "Category not found.");
  return { id: String(doc._id), name: doc.name, slug: doc.slug };
}

export async function deleteCategory(tenantId: string, id: string) {
  await connectDb();
  const inUse = await Product.exists({ tenantId: tid(tenantId), categoryId: oid(id), status: { $ne: "archived" } });
  if (inUse) throw new AppError("CONFLICT", "This category still has products. Move or archive them first.");
  const res = await Category.deleteOne({ _id: oid(id), tenantId: tid(tenantId) });
  if (!res.deletedCount) throw new AppError("NOT_FOUND", "Category not found.");
}

/* ---------------- products (management) ---------------- */

async function assertCategory(tenantId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const exists = await Category.exists({ _id: oid(categoryId), tenantId: tid(tenantId) });
  if (!exists) throw new AppError("VALIDATION_ERROR", "Choose a category from your own shop.");
}

function assertImages(tenantId: string, images: { url: string; publicId: string }[]) {
  if (!images.length) return;
  const cloud = getEnv().CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new AppError("NOT_CONFIGURED", "Image uploads are not configured yet.");
  for (const img of images) {
    if (!isTenantImage(img, tenantId, cloud, "products")) {
      throw new AppError("VALIDATION_ERROR", "An image was not uploaded through your shop and cannot be used.");
    }
  }
}

type VariantIn = ProductInput["variants"][number];

function buildVariant(v: VariantIn) {
  const options = { size: v.size, color: v.color, fabric: v.fabric };
  return { label: variantLabel(options), options, sku: v.sku, price: v.price, stock: v.stock ?? 0 };
}

export async function createProduct(tenantId: string, actorUserId: Types.ObjectId, input: ProductInput) {
  await connectDb();
  await assertCategory(tenantId, input.categoryId);
  assertImages(tenantId, input.images);
  const slug = await uniqueSlug(slugify(input.name), async (s) => Boolean(await Product.exists({ tenantId: tid(tenantId), slug: s })));
  const { variants, categoryId, ...rest } = input;
  const doc = await Product.create({
    ...rest,
    tenantId: tid(tenantId),
    slug,
    categoryId: categoryId ? oid(categoryId) : undefined,
    variants: variants.map((v) => buildVariant(v)),
    createdBy: actorUserId,
  });
  // Opening balances go into the stock ledger so the history is complete from day one.
  const movements = doc.variants.filter((v) => v.stock > 0).map((v) => ({
    tenantId: tid(tenantId), productId: doc._id, variantId: v._id, delta: v.stock, balanceAfter: v.stock, reason: "initial" as const, actorUserId,
  }));
  if (movements.length) await StockMovement.insertMany(movements).catch((e) => logger.warn("stock ledger write failed", { error: String(e) }));
  return toManageProduct(doc.toObject());
}

export async function updateProduct(tenantId: string, id: string, patch: ProductUpdate) {
  await connectDb();
  const existing = await Product.findOne({ _id: oid(id), tenantId: tid(tenantId) });
  if (!existing) throw new AppError("NOT_FOUND", "Product not found.");
  if (patch.categoryId !== undefined) await assertCategory(tenantId, patch.categoryId);
  if (patch.images) assertImages(tenantId, patch.images);

  const next = patch.compareAtPrice === undefined ? existing.compareAtPrice : patch.compareAtPrice ?? undefined;
  const price = patch.basePrice ?? existing.basePrice;
  if (next !== undefined && next <= price) throw new AppError("VALIDATION_ERROR", "Compare-at price must be higher than the price.");

  if (patch.name !== undefined) existing.name = patch.name;
  if (patch.description !== undefined) existing.description = patch.description;
  if (patch.kind !== undefined) existing.kind = patch.kind;
  if (patch.categoryId !== undefined) existing.categoryId = patch.categoryId ? oid(patch.categoryId) : undefined;
  if (patch.images !== undefined) existing.images = patch.images;
  if (patch.basePrice !== undefined) existing.basePrice = patch.basePrice;
  if (patch.compareAtPrice !== undefined) existing.compareAtPrice = patch.compareAtPrice ?? undefined;
  if (patch.status !== undefined) existing.status = patch.status;
  if (patch.featured !== undefined) existing.featured = patch.featured;
  if (patch.tags !== undefined) existing.tags = patch.tags;
  if (patch.trackStock !== undefined) existing.trackStock = patch.trackStock;
  if (patch.lowStockThreshold !== undefined) existing.lowStockThreshold = patch.lowStockThreshold;

  if (patch.variants) {
    // Existing variants keep their live stock (changed only through the audited stock endpoint).
    // Unknown ids are rejected so a client cannot graft a variant id from another product.
    const byId = new Map(existing.variants.map((v) => [String(v._id), v]));
    const rebuilt = patch.variants.map((v) => {
      if (!v.id) return buildVariant(v);
      const old = byId.get(v.id);
      if (!old) throw new AppError("VALIDATION_ERROR", "A variant does not belong to this product.");
      const built = buildVariant({ ...v, stock: old.stock });
      return { _id: old._id, ...built };
    });
    existing.set("variants", rebuilt);
  }
  await existing.save();
  return toManageProduct(existing.toObject());
}

/** "Delete" archives: past orders (Phase 7) must keep pointing at a real product record. */
export async function archiveProduct(tenantId: string, id: string) {
  await connectDb();
  const doc = await Product.findOneAndUpdate({ _id: oid(id), tenantId: tid(tenantId) }, { $set: { status: "archived", featured: false } }, { new: true });
  if (!doc) throw new AppError("NOT_FOUND", "Product not found.");
  return toManageProduct(doc.toObject());
}

export async function getManageProduct(tenantId: string, id: string) {
  await connectDb();
  const doc = await Product.findOne({ _id: oid(id), tenantId: tid(tenantId) }).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Product not found.");
  const history = await StockMovement.find({ tenantId: tid(tenantId), productId: doc._id }).sort({ createdAt: -1 }).limit(20).lean();
  return {
    product: toManageProduct(doc),
    stockHistory: history.map((h) => ({
      id: String(h._id), variantId: String(h.variantId), delta: h.delta, balanceAfter: h.balanceAfter,
      reason: h.reason, note: h.note ?? "", at: h.createdAt.toISOString(),
    })),
  };
}

export async function listManageProducts(tenantId: string, f: { status?: ProductDoc["status"]; q?: string; page: number }) {
  await connectDb();
  const filter: Record<string, unknown> = { tenantId: tid(tenantId) };
  if (f.status) filter.status = f.status;
  else filter.status = { $ne: "archived" };
  if (f.q) filter.name = { $regex: escapeRegex(f.q), $options: "i" };
  const [rows, total] = await Promise.all([
    Product.find(filter).sort({ updatedAt: -1 }).skip((f.page - 1) * PAGE_SIZE_MANAGE).limit(PAGE_SIZE_MANAGE).lean(),
    Product.countDocuments(filter),
  ]);
  return { items: rows.map(toManageProduct), total, page: f.page, pageSize: PAGE_SIZE_MANAGE };
}

/** Atomic: the stock never goes below zero, even with two managers adjusting at once. */
export async function adjustStock(
  tenantId: string, actorUserId: Types.ObjectId, productId: string,
  input: { variantId: string; delta: number; reason: "restock" | "correction" | "damaged"; note?: string },
) {
  await connectDb();
  const variantId = oid(input.variantId);
  const updated = await Product.findOneAndUpdate(
    {
      _id: oid(productId), tenantId: tid(tenantId),
      variants: { $elemMatch: { _id: variantId, stock: { $gte: input.delta < 0 ? -input.delta : 0 } } },
    },
    { $inc: { "variants.$.stock": input.delta } },
    { new: true },
  );
  if (!updated) {
    const exists = await Product.exists({ _id: oid(productId), tenantId: tid(tenantId), "variants._id": variantId });
    if (!exists) throw new AppError("NOT_FOUND", "Product or variant not found.");
    throw new AppError("CONFLICT", "Not enough stock for that reduction.");
  }
  const variant = updated.variants.find((v) => String(v._id) === input.variantId)!;
  await StockMovement.create({
    tenantId: tid(tenantId), productId: updated._id, variantId, delta: input.delta,
    balanceAfter: variant.stock, reason: input.reason, note: input.note || undefined, actorUserId,
  }).catch((e) => logger.warn("stock ledger write failed", { error: String(e) }));
  return toManageProduct(updated.toObject());
}

/* ---------------- storefront (public, published only) ---------------- */

export type PublicListFilters = {
  q?: string; category?: string; kind?: ProductDoc["kind"]; sort: "newest" | "price_asc" | "price_desc"; page: number;
};

export async function listPublicProducts(tenantId: string, f: PublicListFilters) {
  await connectDb();
  const filter: Record<string, unknown> = { tenantId: tid(tenantId), status: "published" };
  if (f.kind) filter.kind = f.kind;
  if (f.category) {
    const cat = await Category.findOne({ tenantId: tid(tenantId), slug: f.category, isActive: true }).select("_id").lean();
    if (!cat) return { items: [], total: 0, page: f.page, pageSize: PAGE_SIZE_PUBLIC };
    filter.categoryId = cat._id;
  }
  if (f.q) {
    const rx = { $regex: escapeRegex(f.q), $options: "i" };
    filter.$or = [{ name: rx }, { tags: rx }];
  }
  // Price sort uses basePrice (variant overrides are shown on the card but do not reorder).
  const sort: Record<string, 1 | -1> =
    f.sort === "price_asc" ? { basePrice: 1, _id: 1 } : f.sort === "price_desc" ? { basePrice: -1, _id: 1 } : { featured: -1, createdAt: -1, _id: 1 };
  const [rows, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((f.page - 1) * PAGE_SIZE_PUBLIC).limit(PAGE_SIZE_PUBLIC).lean(),
    Product.countDocuments(filter),
  ]);
  return { items: rows.map(toPublicProduct), total, page: f.page, pageSize: PAGE_SIZE_PUBLIC };
}

export async function getPublicProduct(tenantId: string, slug: string) {
  await connectDb();
  const doc = await Product.findOne({ tenantId: tid(tenantId), slug, status: "published" }).lean();
  if (!doc) return null;
  const category = doc.categoryId ? await Category.findOne({ _id: doc.categoryId, tenantId: tid(tenantId), isActive: true }).select("name slug").lean() : null;
  return { product: toPublicProduct(doc), category: category ? { name: category.name, slug: category.slug } : null };
}

export async function listFeaturedProducts(tenantId: string, limit = 6) {
  await connectDb();
  const rows = await Product.find({ tenantId: tid(tenantId), status: "published", featured: true }).sort({ updatedAt: -1 }).limit(limit).lean();
  return rows.map(toPublicProduct);
}

export async function listPublicCategories(tenantId: string) {
  await connectDb();
  const cats = await listCategories(tenantId, { onlyActive: true });
  const counts = await Product.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { tenantId: tid(tenantId), status: "published", categoryId: { $exists: true } } },
    { $group: { _id: "$categoryId", n: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  return cats.map((c) => ({ name: c.name, slug: c.slug, count: byId.get(c.id) ?? 0 })).filter((c) => c.count > 0);
}
