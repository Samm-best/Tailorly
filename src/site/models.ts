import { Schema, model, models, type Model } from "mongoose";
import { CONTACT_TOPICS } from "@/site/constants";


export interface ContactMessageDoc {
  topic: (typeof CONTACT_TOPICS)[number];
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  message: string;
  status: "new" | "handled";
  createdAt: Date;
}

/** Messages sent from the main Tailorly site (never from a shop host). Read by platform staff in Phase 11. */
const schema = new Schema<ContactMessageDoc>(
  {
    topic: { type: String, enum: CONTACT_TOPICS, required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 30 },
    businessName: { type: String, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ["new", "handled"], default: "new" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ status: 1, createdAt: -1 });

export const ContactMessage: Model<ContactMessageDoc> =
  (models.ContactMessage as Model<ContactMessageDoc>) || model<ContactMessageDoc>("ContactMessage", schema);
