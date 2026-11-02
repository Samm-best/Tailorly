import { Types } from "mongoose";
import { connectDb } from "@/db/mongoose";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { sendAccountExistsEmail, sendPasswordResetEmail, sendVerificationEmail } from "@/communication/email";
import { AuthSession, AuthToken, User, type AuthTokenType } from "@/auth/models";
import { normalizeEmail, normalizePhone } from "@/auth/identity";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/auth/password";
import {
  EMAIL_VERIFICATION_TTL_MS, PASSWORD_RESET_TTL_MS, SESSION_TTL_MS, generateToken, hashToken,
} from "@/auth/session-token";
import { PlatformRoleAssignment } from "@/platform/models";
import type { TenantRef } from "@/tenancy/context";
import { Tenant, TenantMembership } from "@/tenants/models";
import type { PlatformRole, TenantRole } from "@/tenants/roles";
import { defaultPermissionsForRole, type TenantPermission } from "@/tenants/permissions";
import { createNotification } from "@/customers/service";

const isDuplicateKey = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

/** A customer relationship is the ONLY membership created implicitly. It never grants more than customer access. */
async function ensureCustomerMembership(userId: Types.ObjectId, tenantId: string): Promise<void> {
  try {
    await TenantMembership.updateOne(
      { tenantId: new Types.ObjectId(tenantId), userId },
      { $setOnInsert: { role: "customer", status: "active" } },
      { upsert: true },
    );
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
  }
}

async function issueAuthToken(userId: Types.ObjectId, type: AuthTokenType, ttlMs: number): Promise<string> {
  const { SESSION_SECRET } = getEnv();
  // A new link invalidates older unused ones of the same type.
  await AuthToken.updateMany({ userId, type, usedAt: { $exists: false } }, { $set: { usedAt: new Date() } });
  const token = generateToken();
  await AuthToken.create({ userId, type, tokenHash: hashToken(token, SESSION_SECRET), expiresAt: new Date(Date.now() + ttlMs) });
  return token;
}

async function consumeAuthToken(token: string, type: AuthTokenType): Promise<Types.ObjectId> {
  const { SESSION_SECRET } = getEnv();
  const now = new Date();
  const tokenHash = hashToken(token, SESSION_SECRET);
  const existing = await AuthToken.findOne({ tokenHash, type }).select("userId usedAt expiresAt");
  if (!existing) throw new AppError("INVALID_TOKEN", "This verification link is invalid.");
  if (existing.usedAt) throw new AppError("INVALID_TOKEN", "This verification link has already been used.");
  if (existing.expiresAt <= now) throw new AppError("INVALID_TOKEN", "This verification link has expired.");
  const doc = await AuthToken.findOneAndUpdate(
    { _id: existing._id, usedAt: { $exists: false }, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true },
  );
  if (!doc) throw new AppError("INVALID_TOKEN", "This verification link is no longer available.");
  return doc.userId;
}

async function sendVerification(userId: Types.ObjectId, email: string, name: string, linkBase: string) {
  const token = await issueAuthToken(userId, "email_verification", EMAIL_VERIFICATION_TTL_MS);
  await sendVerificationEmail(email, name, `${linkBase}/verify-email?token=${encodeURIComponent(token)}`);
}

export async function registerUser(input: {
  email: string; password: string; fullName: string; phone: string; tenant: TenantRef | null; linkBase: string;
}): Promise<void> {
  await connectDb();
  const env = getEnv();
  const email = normalizeEmail(input.email);
  // Always hash first so "new" and "existing" emails cost the same time.
  const passwordHash = await hashPassword(input.password);

  const existing = await User.findOne({ email }).select("fullName emailVerifiedAt status");
  if (existing) {
    if (existing.status === "active") {
      if (existing.emailVerifiedAt) await sendAccountExistsEmail(email, existing.fullName, `${input.linkBase}/login`);
      else await sendVerification(existing._id, email, existing.fullName, input.linkBase);
    }
    return; // identical response to a fresh registration -> no account enumeration
  }

  let user;
  try {
    user = await User.create({ email, passwordHash, fullName: input.fullName, phone: normalizePhone(input.phone), termsAcceptedAt: new Date() });
  } catch (err) {
    if (isDuplicateKey(err)) return;
    throw err;
  }
  if (input.tenant) await ensureCustomerMembership(user._id, input.tenant.id);

  if (env.NODE_ENV === "development" && env.AUTO_VERIFY_EMAIL_IN_DEV === "true") {
    user.emailVerifiedAt = new Date();
    await user.save();
    return;
  }
  await sendVerification(user._id, email, input.fullName, input.linkBase);
}

export async function verifyEmail(token: string): Promise<void> {
  await connectDb();
  const userId = await consumeAuthToken(token, "email_verification");
  const user = await User.findOneAndUpdate(
    { _id: userId, status: "active", emailVerifiedAt: { $exists: false } },
    { $set: { emailVerifiedAt: new Date() } },
    { new: true },
  );
  if (user) {
    await createNotification({ userId, type: "welcome", title: "Welcome to Tailorly", body: "Your email is verified. Your one account works on every shop." });
  }
}

export async function resendVerification(emailRaw: string, linkBase: string): Promise<void> {
  await connectDb();
  const email = normalizeEmail(emailRaw);
  const user = await User.findOne({ email, status: "active", emailVerifiedAt: { $exists: false } }).select("fullName");
  if (user) await sendVerification(user._id, email, user.fullName, linkBase);
}

export async function resendVerificationForUser(userId: Types.ObjectId, linkBase: string): Promise<void> {
  await connectDb();
  const user = await User.findOne({ _id: userId, status: "active", emailVerifiedAt: { $exists: false } }).select("email fullName");
  if (user) await sendVerification(user._id, user.email, user.fullName, linkBase);
}

export async function changeEmail(userId: Types.ObjectId, emailRaw: string, password: string, linkBase: string): Promise<string> {
  await connectDb();
  const email = normalizeEmail(emailRaw);
  const user = await User.findOne({ _id: userId, status: "active" }).select("+passwordHash email fullName");
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new AppError("INVALID_CREDENTIALS", "Your current password is incorrect.");
  if (email === user.email) throw new AppError("CONFLICT", "That is already your account email.");
  if (await User.exists({ email, status: "active" })) throw new AppError("CONFLICT", "That email is already registered.");
  try {
    await User.updateOne({ _id: userId }, { $set: { email }, $unset: { emailVerifiedAt: 1 } });
  } catch (err) {
    if (isDuplicateKey(err)) throw new AppError("CONFLICT", "That email is already registered.");
    throw err;
  }
  await sendVerification(user._id, email, user.fullName, linkBase);
  return email;
}

export async function requestPasswordReset(emailRaw: string, linkBase: string): Promise<void> {
  await connectDb();
  const email = normalizeEmail(emailRaw);
  const user = await User.findOne({ email, status: "active" }).select("fullName");
  if (!user) return; // same generic response either way
  const token = await issueAuthToken(user._id, "password_reset", PASSWORD_RESET_TTL_MS);
  await sendPasswordResetEmail(email, user.fullName, `${linkBase}/reset-password?token=${encodeURIComponent(token)}`);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await connectDb();
  const userId = await consumeAuthToken(token, "password_reset");
  const passwordHash = await hashPassword(newPassword);
  // Receiving the email proves control of the address, so it also counts as verification.
  const user = await User.findOneAndUpdate({ _id: userId, status: "active" }, { $set: { passwordHash } }, { new: true });
  if (!user) throw new AppError("INVALID_TOKEN", "This link is invalid or has expired.");
  if (!user.emailVerifiedAt) await User.updateOne({ _id: userId }, { $set: { emailVerifiedAt: new Date() } });
  await AuthSession.deleteMany({ userId }); // sign out everywhere after a reset
}

export async function loginUser(input: {
  email: string; password: string; tenant: TenantRef | null; userAgent?: string; ip?: string;
}): Promise<{ token: string; expiresAt: Date; userId: string; emailVerified: boolean }> {
  await connectDb();
  const { SESSION_SECRET } = getEnv();
  const email = normalizeEmail(input.email);
  const user = await User.findOne({ email, status: "active" }).select("+passwordHash emailVerifiedAt");
  if (!user) {
    await burnPasswordCheck(input.password);
    throw new AppError("INVALID_CREDENTIALS", "Incorrect email or password.");
  }
  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError("INVALID_CREDENTIALS", "Incorrect email or password.");
  }
  // Signing in on a shop host records the customer relationship with that shop only.
  if (input.tenant) await ensureCustomerMembership(user._id, input.tenant.id);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await AuthSession.create({
    userId: user._id,
    tokenHash: hashToken(token, SESSION_SECRET),
    tenantId: input.tenant ? new Types.ObjectId(input.tenant.id) : undefined,
    userAgent: input.userAgent?.slice(0, 200),
    ip: input.ip,
    expiresAt,
  });
  return { token, expiresAt, userId: String(user._id), emailVerified: Boolean(user.emailVerifiedAt) };
}

export async function logoutSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await connectDb();
  await AuthSession.deleteOne({ tokenHash: hashToken(token, getEnv().SESSION_SECRET) });
}

export async function authenticateToken(token: string | undefined) {
  if (!token) throw new AppError("UNAUTHENTICATED", "Please sign in.");
  await connectDb();
  const session = await AuthSession.findOne({
    tokenHash: hashToken(token, getEnv().SESSION_SECRET),
    expiresAt: { $gt: new Date() },
  });
  if (!session) throw new AppError("UNAUTHENTICATED", "Please sign in.");
  const user = await User.findOne({ _id: session.userId, status: "active" });
  if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in.");
  return { user, session };
}

export async function listMemberships(userId: Types.ObjectId) {
  const rows = await TenantMembership.find({ userId, status: "active" }).lean();
  const tenants = await Tenant.find({ _id: { $in: rows.map((r) => r.tenantId) }, status: "active" }).select("name slug").lean();
  const byId = new Map(tenants.map((t) => [String(t._id), t]));
  return rows.flatMap((r) => {
    const t = byId.get(String(r.tenantId));
    return t ? [{ tenantId: String(t._id), slug: t.slug, name: t.name, role: r.role as TenantRole, permissions: r.permissions?.length ? r.permissions : defaultPermissionsForRole(r.role as TenantRole) }] : [];
  });
}

export async function getPlatformRole(userId: Types.ObjectId): Promise<PlatformRole | null> {
  const row = await PlatformRoleAssignment.findOne({ userId }).lean();
  return row?.role ?? null;
}

/**
 * Authorization for a shop's private data: authenticated user + trusted tenant (from Host)
 * + active membership + allowed role. Roles from other shops are never consulted.
 */
export async function requireTenantRole(userId: Types.ObjectId, tenantId: string, allowed: readonly TenantRole[]): Promise<TenantRole> {
  const m = await TenantMembership.findOne({ userId, tenantId: new Types.ObjectId(tenantId), status: "active" }).lean();
  if (!m || !allowed.includes(m.role)) {
    logger.warn("authorization denied", { userId: String(userId), tenantId });
    throw new AppError("FORBIDDEN", "You do not have access to this shop area.");
  }
  return m.role;
}

export async function getTenantMembership(userId: Types.ObjectId, tenantId: string) {
  return TenantMembership.findOne({ userId, tenantId: new Types.ObjectId(tenantId), status: "active" }).lean();
}

export async function hasTenantPermission(userId: Types.ObjectId, tenantId: string, permission: TenantPermission): Promise<boolean> {
  const membership = await getTenantMembership(userId, tenantId);
  if (!membership) return false;
  const permissions = membership.permissions?.length ? membership.permissions : defaultPermissionsForRole(membership.role);
  return membership.role === "owner" || permissions.includes(permission);
}

export async function requireTenantPermission(userId: Types.ObjectId, tenantId: string, permission: TenantPermission): Promise<TenantRole> {
  const membership = await getTenantMembership(userId, tenantId);
  if (!membership) {
    logger.warn("authorization denied", { userId: String(userId), tenantId, permission });
    throw new AppError("FORBIDDEN", "You do not have access to this shop area.");
  }
  const permissions = membership.permissions?.length ? membership.permissions : defaultPermissionsForRole(membership.role);
  if (membership.role !== "owner" && !permissions.includes(permission)) {
    logger.warn("permission denied", { userId: String(userId), tenantId, permission });
    throw new AppError("FORBIDDEN", "You do not have permission for this shop action.");
  }
  return membership.role;
}
