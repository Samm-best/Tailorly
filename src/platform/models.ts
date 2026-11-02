import { Schema, model, models, type Model, type Types } from "mongoose";
import { PLATFORM_ROLES, type PlatformRole } from "@/tenants/roles";

export interface PlatformRoleDoc {
  userId: Types.ObjectId;
  role: PlatformRole;
  createdAt: Date;
}

/** Platform roles live in their own collection and are never derived from tenant memberships. */
const schema = new Schema<PlatformRoleDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    role: { type: String, enum: PLATFORM_ROLES, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PlatformRoleAssignment: Model<PlatformRoleDoc> =
  (models.PlatformRoleAssignment as Model<PlatformRoleDoc>) ||
  model<PlatformRoleDoc>("PlatformRoleAssignment", schema);
