import { Schema, model, models, type Model, type Types } from "mongoose";

export const CUSTOM_ORDER_STATUSES = ["submitted", "quoted", "accepted", "in_progress", "completed", "cancelled"] as const;
export const ORDER_STATUSES = ["pending_payment", "paid", "processing", "completed", "cancelled", "refunded"] as const;

export interface MeasurementProfileDoc {
  userId: Types.ObjectId;
  name: string;
  values: Record<string, number>;
  notes?: string;
  sharing: "private" | "shared";
  sharedWithTenantIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const measurementSchema = new Schema<MeasurementProfileDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    values: { type: Schema.Types.Mixed, required: true },
    notes: { type: String, trim: true, maxlength: 500 },
    sharing: { type: String, enum: ["private", "shared"], default: "private" },
    sharedWithTenantIds: { type: [{ type: Schema.Types.ObjectId, ref: "Tenant" }], default: [] },
  },
  { timestamps: true },
);
measurementSchema.index({ userId: 1, createdAt: -1 });

export interface CustomOrderDoc {
  tenantId: Types.ObjectId;
  customerId: Types.ObjectId;
  measurementProfileId?: Types.ObjectId;
  title: string;
  description: string;
  referenceImages: { url: string; publicId: string }[];
  status: (typeof CUSTOM_ORDER_STATUSES)[number];
  quote?: { amount: number; currency: "NGN"; note?: string; expiresAt?: Date; acceptedAt?: Date };
  createdAt: Date;
  updatedAt: Date;
}

const customOrderSchema = new Schema<CustomOrderDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    measurementProfileId: { type: Schema.Types.ObjectId, ref: "MeasurementProfile" },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    referenceImages: { type: [{ _id: false, url: String, publicId: String }], default: [], validate: (v: unknown[]) => v.length <= 5 },
    status: { type: String, enum: CUSTOM_ORDER_STATUSES, default: "submitted" },
    quote: {
      amount: { type: Number, min: 0 },
      currency: { type: String, enum: ["NGN"], default: "NGN" },
      note: { type: String, maxlength: 1000 },
      expiresAt: Date,
      acceptedAt: Date,
    },
  },
  { timestamps: true },
);
customOrderSchema.index({ tenantId: 1, createdAt: -1 });
customOrderSchema.index({ customerId: 1, createdAt: -1 });

export interface CartItemDoc {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  quantity: number;
}
export interface CartDoc {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDoc[];
  updatedAt: Date;
}
const cartSchema = new Schema<CartDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [{ productId: Schema.Types.ObjectId, variantId: Schema.Types.ObjectId, quantity: Number }], default: [] },
  },
  { timestamps: true },
);
cartSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export interface OrderItemDoc {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
  name: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  trackStock: boolean;
}
export interface OrderDoc {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  items: OrderItemDoc[];
  total: number;
  currency: "NGN";
  status: (typeof ORDER_STATUSES)[number];
  paymentReference?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}
const orderSchema = new Schema<OrderDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [{ _id: false, productId: Schema.Types.ObjectId, variantId: Schema.Types.ObjectId, name: String, variantLabel: String, unitPrice: Number, quantity: Number, trackStock: Boolean }], required: true },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["NGN"], default: "NGN" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_payment" },
    paymentReference: { type: String, index: true },
    idempotencyKey: { type: String, required: true },
  },
  { timestamps: true },
);
orderSchema.index({ tenantId: 1, userId: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ tenantId: 1, createdAt: -1 });

export interface PaymentDoc {
  orderId: Types.ObjectId;
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: "paystack";
  reference: string;
  amount: number;
  status: "initialized" | "paid" | "failed";
  createdAt: Date;
  updatedAt: Date;
}
const paymentSchema = new Schema<PaymentDoc>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: ["paystack"], required: true },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["initialized", "paid", "failed"], default: "initialized" },
  },
  { timestamps: true },
);

export const MeasurementProfile: Model<MeasurementProfileDoc> = (models.MeasurementProfile as Model<MeasurementProfileDoc>) || model("MeasurementProfile", measurementSchema);
export const CustomOrder: Model<CustomOrderDoc> = (models.CustomOrder as Model<CustomOrderDoc>) || model("CustomOrder", customOrderSchema);
export const Cart: Model<CartDoc> = (models.Cart as Model<CartDoc>) || model("Cart", cartSchema);
export const Order: Model<OrderDoc> = (models.Order as Model<OrderDoc>) || model("Order", orderSchema);
export const Payment: Model<PaymentDoc> = (models.Payment as Model<PaymentDoc>) || model("Payment", paymentSchema);
