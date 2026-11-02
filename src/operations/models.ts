import { Schema, model, models, type Model, type Types } from "mongoose";

export const PRODUCTION_STAGES = ["order_received", "measurement_confirmed", "fabric_selection", "cutting", "sewing", "fitting", "quality_inspection", "ready_for_collection", "delivered"] as const;
export type ProductionStage = (typeof PRODUCTION_STAGES)[number];

export interface ProductionJobDoc {
  tenantId: Types.ObjectId;
  customerId: Types.ObjectId;
  orderId?: Types.ObjectId;
  customOrderId?: Types.ObjectId;
  stage: ProductionStage;
  notes?: string;
  dueAt?: Date;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const productionSchema = new Schema<ProductionJobDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    customOrderId: { type: Schema.Types.ObjectId, ref: "CustomOrder" },
    stage: { type: String, enum: PRODUCTION_STAGES, default: "order_received", index: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    dueAt: Date,
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
productionSchema.index({ tenantId: 1, orderId: 1 }, { unique: true, sparse: true });
productionSchema.index({ tenantId: 1, customOrderId: 1 }, { unique: true, sparse: true });

export interface ConversationDoc {
  tenantId: Types.ObjectId;
  customerId: Types.ObjectId;
  subject: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
const conversationSchema = new Schema<ConversationDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
conversationSchema.index({ tenantId: 1, customerId: 1, lastMessageAt: -1 });

export interface MessageDoc {
  tenantId: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  body: string;
  readAt?: Date;
  createdAt: Date;
}
const messageSchema = new Schema<MessageDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
messageSchema.index({ tenantId: 1, conversationId: 1, createdAt: 1 });

export interface AppointmentDoc {
  tenantId: Types.ObjectId;
  customerId: Types.ObjectId;
  productionJobId?: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  type: "fitting" | "measurement" | "collection";
  status: "requested" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
const appointmentSchema = new Schema<AppointmentDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productionJobId: { type: Schema.Types.ObjectId, ref: "ProductionJob" },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    type: { type: String, enum: ["fitting", "measurement", "collection"], required: true },
    status: { type: String, enum: ["requested", "confirmed", "cancelled", "completed"], default: "requested" },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);
appointmentSchema.index({ tenantId: 1, startsAt: 1 });

export interface DeliveryDoc {
  tenantId: Types.ObjectId;
  customerId: Types.ObjectId;
  orderId?: Types.ObjectId;
  status: "pending" | "ready" | "out_for_delivery" | "delivered" | "failed";
  addressId?: Types.ObjectId;
  trackingCode?: string;
  notes?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const deliverySchema = new Schema<DeliveryDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    status: { type: String, enum: ["pending", "ready", "out_for_delivery", "delivered", "failed"], default: "pending" },
    addressId: { type: Schema.Types.ObjectId, ref: "Address" },
    trackingCode: { type: String, trim: true, maxlength: 80 },
    notes: { type: String, trim: true, maxlength: 500 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
deliverySchema.index({ tenantId: 1, orderId: 1 }, { unique: true, sparse: true });

export const ProductionJob: Model<ProductionJobDoc> = (models.ProductionJob as Model<ProductionJobDoc>) || model("ProductionJob", productionSchema);
export const Conversation: Model<ConversationDoc> = (models.Conversation as Model<ConversationDoc>) || model("Conversation", conversationSchema);
export const Message: Model<MessageDoc> = (models.Message as Model<MessageDoc>) || model("Message", messageSchema);
export const Appointment: Model<AppointmentDoc> = (models.Appointment as Model<AppointmentDoc>) || model("Appointment", appointmentSchema);
export const Delivery: Model<DeliveryDoc> = (models.Delivery as Model<DeliveryDoc>) || model("Delivery", deliverySchema);
