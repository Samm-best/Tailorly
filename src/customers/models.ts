import { Schema, model, models, type Model, type Types } from "mongoose";

export interface AddressDoc {
  userId: Types.ObjectId;
  label: string;
  recipientName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: Date;
}

const addressSchema = new Schema<AddressDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 40 },
    recipientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 30 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    country: { type: String, default: "NG", uppercase: true, minlength: 2, maxlength: 2 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export interface NotificationDoc {
  userId: Types.ObjectId;
  tenantId?: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    type: { type: String, required: true, maxlength: 50 },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, required: true, maxlength: 1000 },
    readAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Address: Model<AddressDoc> = (models.Address as Model<AddressDoc>) || model<AddressDoc>("Address", addressSchema);
export const Notification: Model<NotificationDoc> =
  (models.Notification as Model<NotificationDoc>) || model<NotificationDoc>("Notification", notificationSchema);
