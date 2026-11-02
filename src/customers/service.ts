import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { connectDb } from "@/db/mongoose";
import { AppError } from "@/lib/errors";
import { AuthSession, AuthToken, User } from "@/auth/models";
import { verifyPassword } from "@/auth/password";
import { Address, Notification } from "@/customers/models";
import { Tenant, TenantMembership } from "@/tenants/models";

const MAX_ADDRESSES = 10;
const oid = (id: string) => new Types.ObjectId(id);

export async function createNotification(input: { userId: Types.ObjectId; tenantId?: Types.ObjectId; type: string; title: string; body: string }) {
  await connectDb();
  await Notification.create(input);
}

/* ---------- profile ---------- */

export function toPublicUser(u: {
  _id: Types.ObjectId; email: string; fullName: string; phone?: string; profileImage?: { url: string; publicId: string }; emailVerifiedAt?: Date; preferences?: { marketingEmails?: boolean };
}) {
  return {
    id: String(u._id),
    email: u.email,
    fullName: u.fullName,
    phone: u.phone ?? "",
    profileImage: u.profileImage ?? null,
    emailVerified: Boolean(u.emailVerifiedAt),
    preferences: { marketingEmails: Boolean(u.preferences?.marketingEmails) },
  };
}

export async function updateProfile(userId: Types.ObjectId, patch: { fullName?: string; phone?: string; marketingEmails?: boolean; profileImage?: { url: string; publicId: string } | null }) {
  await connectDb();
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};
  if (patch.fullName !== undefined) $set.fullName = patch.fullName;
  if (patch.phone !== undefined) {
    if (patch.phone === "") $unset.phone = 1;
    else $set.phone = patch.phone;
  }
  if (patch.marketingEmails !== undefined) $set["preferences.marketingEmails"] = patch.marketingEmails;
  if (patch.profileImage !== undefined) {
    if (patch.profileImage === null) $unset.profileImage = 1;
    else $set.profileImage = patch.profileImage;
  }
  const update: Record<string, unknown> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  if (!Object.keys(update).length) throw new AppError("VALIDATION_ERROR", "Nothing to update.");
  const user = await User.findOneAndUpdate({ _id: userId, status: "active" }, update, { new: true });
  if (!user) throw new AppError("NOT_FOUND", "Account not found.");
  return toPublicUser(user);
}

/* ---------- addresses (always scoped by userId) ---------- */

type AddressInput = {
  label: string; recipientName: string; phone?: string; line1: string; line2?: string;
  city: string; state: string; country: string; postalCode?: string; isDefault: boolean;
};

export async function listAddresses(userId: Types.ObjectId) {
  await connectDb();
  return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
}

export async function createAddress(userId: Types.ObjectId, input: AddressInput) {
  await connectDb();
  const count = await Address.countDocuments({ userId });
  if (count >= MAX_ADDRESSES) throw new AppError("CONFLICT", `You can save up to ${MAX_ADDRESSES} addresses.`);
  const isDefault = input.isDefault || count === 0;
  if (isDefault) await Address.updateMany({ userId }, { $set: { isDefault: false } });
  return Address.create({ ...input, phone: input.phone || undefined, userId, isDefault });
}

export async function updateAddress(userId: Types.ObjectId, id: string, patch: Partial<AddressInput>) {
  await connectDb();
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  if (patch.isDefault === true) await Address.updateMany({ userId, _id: { $ne: oid(id) } }, { $set: { isDefault: false } });
  if (patch.isDefault === false) delete clean.isDefault; // a default is only moved by choosing another one
  const doc = await Address.findOneAndUpdate({ _id: oid(id), userId }, { $set: clean }, { new: true });
  if (!doc) throw new AppError("NOT_FOUND", "Address not found.");
  return doc;
}

export async function deleteAddress(userId: Types.ObjectId, id: string) {
  await connectDb();
  const doc = await Address.findOneAndDelete({ _id: oid(id), userId });
  if (!doc) throw new AppError("NOT_FOUND", "Address not found.");
  if (doc.isDefault) {
    const next = await Address.findOne({ userId }).sort({ createdAt: -1 });
    if (next) await Address.updateOne({ _id: next._id }, { $set: { isDefault: true } });
  }
}

/* ---------- notifications ---------- */

export async function listNotifications(userId: Types.ObjectId, q: { limit: number; before?: string; unreadOnly: boolean }) {
  await connectDb();
  const filter: Record<string, unknown> = { userId };
  if (q.unreadOnly) filter.readAt = { $exists: false };
  if (q.before) filter.createdAt = { $lt: new Date(q.before) };
  const [items, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(q.limit).lean(),
    Notification.countDocuments({ userId, readAt: { $exists: false } }),
  ]);
  const nextBefore = items.length === q.limit ? items[items.length - 1]!.createdAt.toISOString() : null;
  return { items, unreadCount, nextBefore };
}

export async function markNotificationsRead(userId: Types.ObjectId, input: { ids?: string[]; all?: boolean }) {
  await connectDb();
  const filter: Record<string, unknown> = { userId, readAt: { $exists: false } };
  if (!input.all) filter._id = { $in: (input.ids ?? []).map(oid) };
  const res = await Notification.updateMany(filter, { $set: { readAt: new Date() } });
  return { updated: res.modifiedCount };
}

/* ---------- privacy ---------- */

export async function privacySummary(userId: Types.ObjectId) {
  await connectDb();
  const [addresses, notifications, sessions, memberships] = await Promise.all([
    Address.countDocuments({ userId }),
    Notification.countDocuments({ userId }),
    AuthSession.countDocuments({ userId, expiresAt: { $gt: new Date() } }),
    TenantMembership.countDocuments({ userId, status: "active" }),
  ]);
  return {
    counts: { addresses, notifications, activeSessions: sessions, shopRelationships: memberships },
    categories: ["Account details (email, name, phone)", "Saved addresses", "Notifications", "Sign-in sessions", "Shop relationships"],
  };
}

export async function exportAccountData(userId: Types.ObjectId) {
  await connectDb();
  const [user, addresses, notifications, memberships] = await Promise.all([
    User.findById(userId).lean(),
    Address.find({ userId }).lean(),
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(1000).lean(),
    TenantMembership.find({ userId }).lean(),
  ]);
  const tenants = await Tenant.find({ _id: { $in: memberships.map((m) => m.tenantId) } }).select("name slug").lean();
  const tenantName = new Map(tenants.map((t) => [String(t._id), t.name]));
  return {
    exportedAt: new Date().toISOString(),
    account: user && { email: user.email, fullName: user.fullName, phone: user.phone ?? null, emailVerifiedAt: user.emailVerifiedAt ?? null, createdAt: user.createdAt, preferences: user.preferences },
    addresses: addresses.map((a) => ({
      id: String(a._id), label: a.label, recipientName: a.recipientName, phone: a.phone ?? null, line1: a.line1,
      line2: a.line2 ?? null, city: a.city, state: a.state, country: a.country, postalCode: a.postalCode ?? null,
      isDefault: a.isDefault, createdAt: a.createdAt,
    })),
    notifications: notifications.map((n) => ({
      id: String(n._id), type: n.type, title: n.title, body: n.body, readAt: n.readAt ?? null, createdAt: n.createdAt,
    })),
    shopRelationships: memberships.map((m) => ({ shop: tenantName.get(String(m.tenantId)) ?? "Unknown shop", role: m.role, status: m.status, since: m.createdAt })),
  };
}

/**
 * Soft deletion: personal data is erased and the email freed, the row stays as an anonymised tombstone
 * so later phases (orders, payments) can keep records they are legally required to retain.
 */
export async function deleteAccount(userId: Types.ObjectId, password: string) {
  await connectDb();
  const user = await User.findOne({ _id: userId, status: "active" }).select("+passwordHash");
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError("INVALID_CREDENTIALS", "Incorrect password.");
  }
  const ownsShop = await Tenant.exists({ ownerUserId: userId, status: { $ne: "archived" } });
  if (ownsShop) throw new AppError("CONFLICT", "Transfer or archive your shop before deleting your account.");

  await Promise.all([
    AuthSession.deleteMany({ userId }),
    AuthToken.deleteMany({ userId }),
    Address.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
    TenantMembership.updateMany({ userId }, { $set: { status: "removed" } }),
  ]);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        status: "deleted",
        deletedAt: new Date(),
        email: `deleted+${String(userId)}@deleted.invalid`,
        fullName: "Deleted user",
        passwordHash: `deleted$${randomBytes(16).toString("hex")}`,
        "preferences.marketingEmails": false,
      },
      $unset: { phone: 1, emailVerifiedAt: 1 },
    },
  );
}

/* ---------- sessions ---------- */

export async function listSessions(userId: Types.ObjectId) {
  await connectDb();
  return AuthSession.find({ userId, expiresAt: { $gt: new Date() } }).sort({ lastUsedAt: -1 }).lean();
}

export async function revokeSession(userId: Types.ObjectId, id: string) {
  await connectDb();
  const res = await AuthSession.deleteOne({ _id: oid(id), userId });
  if (res.deletedCount === 0) throw new AppError("NOT_FOUND", "Session not found.");
}
