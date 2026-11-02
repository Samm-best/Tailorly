import { Schema, model, models, type Model, type Types } from "mongoose";
import { PRODUCT_KINDS, PRODUCT_STATUSES } from "@/catalogue/constants";

/* Every document below carries tenantId and every query in service.ts filters on it. */

export interface CategoryDoc {
  tenantId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
categorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });


export interface VariantDoc {
  _id: Types.ObjectId;
  label: string;
  options: { size?: string; color?: string; fabric?: string };
  sku?: string;
  /** Kobo. Overrides the product base price when set. */
  price?: number;
  stock: number;
}

export interface ProductDoc {
  tenantId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  kind: (typeof PRODUCT_KINDS)[number];
  categoryId?: Types.ObjectId;
  images: { url: string; publicId: string; alt?: string }[];
  /** Kobo. */
  basePrice: number;
  compareAtPrice?: number;
  currency: "NGN";
  status: (typeof PRODUCT_STATUSES)[number];
  featured: boolean;
  tags: string[];
  trackStock: boolean;
  lowStockThreshold: number;
  variants: VariantDoc[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<VariantDoc>({
  label: { type: String, required: true, trim: true, maxlength: 120 },
  options: {
    size: { type: String, trim: true, maxlength: 40 },
    color: { type: String, trim: true, maxlength: 40 },
    fabric: { type: String, trim: true, maxlength: 60 },
  },
  sku: { type: String, trim: true, maxlength: 60 },
  price: { type: Number, min: 0, validate: Number.isInteger },
  stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
});

const productSchema = new Schema<ProductDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 90 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    kind: { type: String, enum: PRODUCT_KINDS, default: "ready_made" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    images: {
      type: [{ _id: false, url: { type: String, required: true, maxlength: 500 }, publicId: { type: String, required: true, maxlength: 200 }, alt: { type: String, maxlength: 140 } }],
      default: [],
      validate: (v: unknown[]) => v.length <= 8,
    },
    basePrice: { type: Number, required: true, min: 0, validate: Number.isInteger },
    compareAtPrice: { type: Number, min: 0, validate: Number.isInteger },
    currency: { type: String, enum: ["NGN"], default: "NGN" },
    status: { type: String, enum: PRODUCT_STATUSES, default: "draft" },
    featured: { type: Boolean, default: false },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }], default: [] },
    trackStock: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 3, min: 0 },
    variants: { type: [variantSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
productSchema.index({ tenantId: 1, status: 1, featured: -1, createdAt: -1 });
productSchema.index({ tenantId: 1, categoryId: 1, status: 1 });

export interface StockMovementDoc {
  tenantId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  delta: number;
  balanceAfter: number;
  reason: "restock" | "correction" | "damaged" | "initial" | "sale" | "return";
  note?: string;
  actorUserId?: Types.ObjectId;
  createdAt: Date;
}

const stockMovementSchema = new Schema<StockMovementDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    delta: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, enum: ["restock", "correction", "damaged", "initial", "sale", "return"], required: true },
    note: { type: String, maxlength: 300 },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
stockMovementSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });

export const Category: Model<CategoryDoc> = (models.Category as Model<CategoryDoc>) || model<CategoryDoc>("Category", categorySchema);
export const Product: Model<ProductDoc> = (models.Product as Model<ProductDoc>) || model<ProductDoc>("Product", productSchema);
export const StockMovement: Model<StockMovementDoc> =
  (models.StockMovement as Model<StockMovementDoc>) || model<StockMovementDoc>("StockMovement", stockMovementSchema);
