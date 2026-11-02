import { Schema, model, models, type Model, type Types } from "mongoose";

export interface AuditEventDoc {
  tenantId?: Types.ObjectId;
  actorUserId: Types.ObjectId;
  action: string;
  targetUserId?: Types.ObjectId;
  metadata?: Record<string, string>;
  createdAt: Date;
}

const auditEventSchema = new Schema<AuditEventDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, maxlength: 120 },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    metadata: { type: Map, of: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AuditEvent: Model<AuditEventDoc> =
  (models.AuditEvent as Model<AuditEventDoc>) || model<AuditEventDoc>("AuditEvent", auditEventSchema);
