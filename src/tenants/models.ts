import { Schema, model, models, type Model, type Types } from "mongoose";
import { TENANT_ROLES, type TenantRole } from "@/tenants/roles";
import { TENANT_PERMISSIONS, type TenantPermission } from "@/tenants/permissions";

export const TENANT_STATUSES = ["draft", "pending_review", "active", "suspended", "archived"] as const;

export interface TenantProfile {
  tagline?: string;
  description?: string;
  vision?: string;
  mission?: string;
  logoUrl?: string;
  logoPublicId?: string;
  brandColor?: string;
  accentColor?: string;
  contact?: { email?: string; phone?: string; address?: string; city?: string; state?: string };
  policies?: { delivery?: string; returns?: string; payment?: string; alterations?: string };
  social?: { instagram?: string; facebook?: string; tiktok?: string; whatsapp?: string };
}

export interface TenantDoc {
  name: string;
  slug: string;
  status: (typeof TENANT_STATUSES)[number];
  ownerUserId?: Types.ObjectId;
  /** Set only by platform staff once real verification has happened (Phase 11). Drives the trust badge. */
  verifiedAt?: Date;
  profile?: TenantProfile;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<TenantDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: TENANT_STATUSES, default: "draft", index: true },
    ownerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    profile: {
      tagline: { type: String, trim: true, maxlength: 140 },
      description: { type: String, trim: true, maxlength: 2000 },
      vision: { type: String, trim: true, maxlength: 600 },
      mission: { type: String, trim: true, maxlength: 600 },
      logoUrl: { type: String, trim: true, maxlength: 500 },
      logoPublicId: { type: String, trim: true, maxlength: 200 },
      brandColor: { type: String, trim: true, maxlength: 7 },
      accentColor: { type: String, trim: true, maxlength: 7 },
      contact: {
        email: { type: String, trim: true, maxlength: 200 },
        phone: { type: String, trim: true, maxlength: 30 },
        address: { type: String, trim: true, maxlength: 300 },
        city: { type: String, trim: true, maxlength: 100 },
        state: { type: String, trim: true, maxlength: 100 },
      },
      policies: {
        delivery: { type: String, trim: true, maxlength: 1500 },
        returns: { type: String, trim: true, maxlength: 1500 },
        payment: { type: String, trim: true, maxlength: 1500 },
        alterations: { type: String, trim: true, maxlength: 1500 },
      },
      social: {
        instagram: { type: String, trim: true, maxlength: 200 },
        facebook: { type: String, trim: true, maxlength: 200 },
        tiktok: { type: String, trim: true, maxlength: 200 },
        whatsapp: { type: String, trim: true, maxlength: 30 },
      },
    },
  },
  { timestamps: true },
);
tenantSchema.index({ status: 1, name: 1 });

export interface MembershipDoc {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  role: TenantRole;
  permissions: TenantPermission[];
  status: "active" | "suspended" | "removed";
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<MembershipDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: TENANT_ROLES, required: true },
    permissions: { type: [String], enum: TENANT_PERMISSIONS, default: [] },
    status: { type: String, enum: ["active", "suspended", "removed"], default: "active" },
  },
  { timestamps: true },
);
membershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const Tenant: Model<TenantDoc> = (models.Tenant as Model<TenantDoc>) || model<TenantDoc>("Tenant", tenantSchema);
export const TenantMembership: Model<MembershipDoc> =
  (models.TenantMembership as Model<MembershipDoc>) || model<MembershipDoc>("TenantMembership", membershipSchema);
