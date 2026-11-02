import { Schema, model, models, type Model, type Types } from "mongoose";

export interface UserDoc {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  profileImage?: { url: string; publicId: string };
  emailVerifiedAt?: Date;
  termsAcceptedAt?: Date;
  status: "active" | "deleted";
  preferences: { marketingEmails: boolean };
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 30 },
    profileImage: {
      url: { type: String, maxlength: 500 },
      publicId: { type: String, maxlength: 200 },
    },
    emailVerifiedAt: Date,
    termsAcceptedAt: Date,
    status: { type: String, enum: ["active", "deleted"], default: "active" },
    preferences: { marketingEmails: { type: Boolean, default: false } },
    deletedAt: Date,
  },
  { timestamps: true },
);

export interface AuthSessionDoc {
  userId: Types.ObjectId;
  tokenHash: string;
  tenantId?: Types.ObjectId;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
}

const sessionSchema = new Schema<AuthSessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    userAgent: { type: String, maxlength: 200 },
    ip: { type: String, maxlength: 64 },
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Mongo removes expired sessions

export type AuthTokenType = "email_verification" | "password_reset";

export interface AuthTokenDoc {
  userId: Types.ObjectId;
  type: AuthTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
}

const tokenSchema = new Schema<AuthTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["email_verification", "password_reset"], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const User: Model<UserDoc> = (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
export const AuthSession: Model<AuthSessionDoc> =
  (models.AuthSession as Model<AuthSessionDoc>) || model<AuthSessionDoc>("AuthSession", sessionSchema);
export const AuthToken: Model<AuthTokenDoc> =
  (models.AuthToken as Model<AuthTokenDoc>) || model<AuthTokenDoc>("AuthToken", tokenSchema);
