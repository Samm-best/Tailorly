import { createHmac, timingSafeEqual } from "node:crypto";
import { Types } from "mongoose";
import { connectDb } from "@/db/mongoose";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { CustomOrder, MeasurementProfile, Cart, Order, Payment, type CartItemDoc } from "@/orders/models";
import { Product } from "@/catalogue/models";
import { isTenantImage } from "@/catalogue/images";

const oid = (id: string) => new Types.ObjectId(id);
const tid = (id: string) => oid(id);
function publicDoc<T extends { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }>(doc: T) {
  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id), createdAt: doc.createdAt?.toISOString(), updatedAt: doc.updatedAt?.toISOString() };
}

export async function createMeasurement(userId: Types.ObjectId, input: { name: string; values: Record<string, number>; notes?: string; sharing: "private" | "shared" }) {
  await connectDb();
  return publicDoc((await MeasurementProfile.create({ ...input, userId })).toObject());
}
export async function listMeasurements(userId: Types.ObjectId) {
  await connectDb();
  return (await MeasurementProfile.find({ userId }).sort({ updatedAt: -1 }).lean()).map((x) => publicDoc(x));
}
export async function updateMeasurement(userId: Types.ObjectId, id: string, patch: Partial<{ name: string; values: Record<string, number>; notes?: string; sharing: "private" | "shared" }>) {
  await connectDb();
  const doc = await MeasurementProfile.findOneAndUpdate({ _id: oid(id), userId }, { $set: patch }, { new: true }).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Measurement profile not found.");
  return publicDoc(doc);
}
export async function deleteMeasurement(userId: Types.ObjectId, id: string) {
  await connectDb();
  if (!(await MeasurementProfile.deleteOne({ _id: oid(id), userId })).deletedCount) throw new AppError("NOT_FOUND", "Measurement profile not found.");
}
export async function shareMeasurement(userId: Types.ObjectId, id: string, tenantId: string) {
  await connectDb();
  const doc = await MeasurementProfile.findOneAndUpdate(
    { _id: oid(id), userId },
    { $set: { sharing: "shared" }, $addToSet: { sharedWithTenantIds: tid(tenantId) } },
    { new: true },
  ).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Measurement profile not found.");
  return publicDoc(doc);
}

export async function createCustomOrder(tenantId: string, userId: Types.ObjectId, input: { title: string; description: string; measurementProfileId?: string; referenceImages: { url: string; publicId: string }[] }) {
  await connectDb();
  const cloudName = getEnv().CLOUDINARY_CLOUD_NAME;
  if (input.referenceImages.length && (!cloudName || input.referenceImages.some((image) => !isTenantImage(image, tenantId, cloudName, "custom-orders")))) {
    throw new AppError("VALIDATION_ERROR", "Reference images must be uploaded through this shop.");
  }
  if (input.measurementProfileId) {
    const profile = await MeasurementProfile.exists({ _id: oid(input.measurementProfileId), userId, sharing: "shared", sharedWithTenantIds: tid(tenantId) });
    if (!profile) throw new AppError("FORBIDDEN", "Share the measurement profile before using it for a shop request.");
  }
  const doc = await CustomOrder.create({ ...input, tenantId: tid(tenantId), customerId: userId, measurementProfileId: input.measurementProfileId ? oid(input.measurementProfileId) : undefined });
  return publicDoc(doc.toObject());
}
export async function listCustomerOrders(tenantId: string, userId: Types.ObjectId) {
  await connectDb();
  return (await CustomOrder.find({ tenantId: tid(tenantId), customerId: userId }).sort({ createdAt: -1 }).lean()).map((x) => publicDoc(x));
}
export async function listShopCustomOrders(tenantId: string) {
  await connectDb();
  return (await CustomOrder.find({ tenantId: tid(tenantId) }).sort({ createdAt: -1 }).lean()).map((x) => publicDoc(x));
}
export async function quoteCustomOrder(tenantId: string, id: string, input: { amount: number; note?: string; expiresAt?: Date }) {
  await connectDb();
  const doc = await CustomOrder.findOneAndUpdate({ _id: oid(id), tenantId: tid(tenantId), status: { $in: ["submitted", "quoted"] } }, { $set: { status: "quoted", quote: { ...input, currency: "NGN" } } }, { new: true }).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Custom order not found or no longer quoteable.");
  return publicDoc(doc);
}
export async function acceptQuote(tenantId: string, userId: Types.ObjectId, id: string) {
  await connectDb();
  const doc = await CustomOrder.findOneAndUpdate({ _id: oid(id), tenantId: tid(tenantId), customerId: userId, status: "quoted", $or: [{ "quote.expiresAt": { $gt: new Date() } }, { "quote.expiresAt": { $exists: false } }] }, { $set: { status: "accepted", "quote.acceptedAt": new Date() } }, { new: true }).lean();
  if (!doc) throw new AppError("CONFLICT", "This quote is unavailable or has expired.");
  return publicDoc(doc);
}

export async function listOrders(tenantId: string, userId: Types.ObjectId) {
  await connectDb();
  return (await Order.find({ tenantId: tid(tenantId), userId }).sort({ createdAt: -1 }).lean()).map((x) => publicDoc(x));
}

export async function listAllOrders(userId: Types.ObjectId) {
  await connectDb();
  return (await Order.find({ userId }).sort({ createdAt: -1 }).lean()).map((x) => publicDoc(x));
}

export async function listShopOrders(tenantId: string) {
  await connectDb();
  return (await Order.find({ tenantId: tid(tenantId) }).sort({ createdAt: -1 }).lean()).map((x) => publicDoc(x));
}

export async function cancelPendingOrder(tenantId: string, userId: Types.ObjectId, id: string) {
  await connectDb();
  const order = await Order.findOneAndUpdate(
    { _id: oid(id), tenantId: tid(tenantId), userId, status: "pending_payment" },
    { $set: { status: "cancelled" } },
    { new: true },
  ).lean();
  if (!order) throw new AppError("NOT_FOUND", "Pending order not found.");
  await Product.bulkWrite(order.items.filter((item) => item.trackStock).map((item) => ({
    updateOne: {
      filter: { _id: item.productId, tenantId: tid(tenantId), "variants._id": item.variantId },
      update: { $inc: { "variants.$.stock": item.quantity } },
    },
  })));
  await Payment.updateOne({ orderId: order._id, tenantId: tid(tenantId) }, { $set: { status: "failed" } });
  return publicDoc(order);
}

export async function handlePaystackWebhook(rawBody: string, signature: string) {
  const env = getEnv();
  if (!env.PAYSTACK_WEBHOOK_SECRET) throw new AppError("NOT_CONFIGURED", "Payment webhooks are not configured.");
  const expected = createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const supplied = Buffer.from(signature, "utf8");
  const calculated = Buffer.from(expected, "utf8");
  if (supplied.length !== calculated.length || !timingSafeEqual(supplied, calculated)) {
    throw new AppError("FORBIDDEN", "Invalid payment webhook signature.");
  }
  let event: { event?: string; data?: { reference?: string; status?: string; amount?: number } };
  try {
    event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string; status?: string; amount?: number } };
  } catch {
    throw new AppError("VALIDATION_ERROR", "Payment webhook body must be valid JSON.");
  }
  if (event.event !== "charge.success" || !event.data?.reference) return { handled: false };
  const payment = await Payment.findOne({ reference: event.data.reference, status: "initialized" });
  if (!payment || event.data.amount !== payment.amount) return { handled: false };
  if (event.data.status !== "success") return { handled: false };
  const updated = await Order.updateOne({ _id: payment.orderId, tenantId: payment.tenantId, status: "pending_payment" }, { $set: { status: "paid" } });
  if (!updated.modifiedCount) return { handled: false };
  payment.status = "paid";
  await payment.save();
  await Cart.updateOne({ tenantId: payment.tenantId, userId: payment.userId }, { $set: { items: [] } });
  return { handled: true };
}

export async function getCart(tenantId: string, userId: Types.ObjectId) {
  await connectDb();
  const cart = await Cart.findOne({ tenantId: tid(tenantId), userId }).lean();
  if (!cart) return { items: [] };
  const items = await Promise.all(cart.items.map(async (item) => {
    const product = await Product.findOne({ _id: item.productId, tenantId: tid(tenantId), status: "published" }).lean();
    const variant = product?.variants.find((candidate) => String(candidate._id) === String(item.variantId));
    if (!product || !variant) return null;
    return {
      productId: String(product._id),
      variantId: String(variant._id),
      name: product.name,
      variantLabel: variant.label,
      unitPrice: variant.price ?? product.basePrice,
      quantity: item.quantity,
    };
  }));
  return { items: items.filter((item): item is NonNullable<typeof item> => Boolean(item)) };
}
export async function saveCart(tenantId: string, userId: Types.ObjectId, items: CartItemDoc[]) {
  await connectDb();
  const cart = await Cart.findOneAndUpdate({ tenantId: tid(tenantId), userId }, { $set: { items } }, { upsert: true, new: true }).lean();
  return cart;
}

async function buildOrder(tenantId: string, userId: Types.ObjectId, idempotencyKey: string) {
  await connectDb();
  const existing = await Order.findOne({ tenantId: tid(tenantId), userId, idempotencyKey }).lean();
  if (existing) return existing;
  const cart = await Cart.findOne({ tenantId: tid(tenantId), userId }).lean();
  if (!cart?.items.length) throw new AppError("VALIDATION_ERROR", "Your cart is empty.");
  const items: { productId: Types.ObjectId; variantId: Types.ObjectId; name: string; variantLabel: string; unitPrice: number; quantity: number; trackStock: boolean }[] = [];
  for (const item of cart.items) {
    const product = await Product.findOne({ _id: item.productId, tenantId: tid(tenantId), status: "published" }).lean();
    const variant = product?.variants.find((v) => String(v._id) === String(item.variantId));
    if (!product || !variant) throw new AppError("NOT_FOUND", "A product in your cart is no longer available.");
    if (product.trackStock && variant.stock < item.quantity) throw new AppError("CONFLICT", `${product.name} does not have enough stock.`);
    items.push({ productId: product._id, variantId: variant._id, name: product.name, variantLabel: variant.label, unitPrice: variant.price ?? product.basePrice, quantity: item.quantity, trackStock: product.trackStock });
  }
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  for (const item of items) {
    if (!item.trackStock) continue;
    const changed = await Product.updateOne({ _id: item.productId, tenantId: tid(tenantId), trackStock: true, "variants._id": item.variantId, variants: { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } } }, { $inc: { "variants.$.stock": -item.quantity } });
    if (!changed.modifiedCount) {
      for (const reserved of items.slice(0, items.indexOf(item)).filter((entry) => entry.trackStock)) await Product.updateOne({ _id: reserved.productId, tenantId: tid(tenantId), "variants._id": reserved.variantId }, { $inc: { "variants.$.stock": reserved.quantity } });
      throw new AppError("CONFLICT", "Stock changed while checking out. Please try again.");
    }
  }
  try {
    return (await Order.create({ tenantId: tid(tenantId), userId, items, total, currency: "NGN", idempotencyKey })).toObject();
  } catch (error) {
    for (const item of items.filter((reserved) => reserved.trackStock)) await Product.updateOne({ _id: item.productId, tenantId: tid(tenantId), "variants._id": item.variantId }, { $inc: { "variants.$.stock": item.quantity } });
    throw error;
  }
}

export async function initializeCheckout(tenantId: string, userId: Types.ObjectId, idempotencyKey: string, email: string) {
  const order = await buildOrder(tenantId, userId, idempotencyKey);
  if (order.status === "paid") return { order: publicDoc(order), authorizationUrl: null, reference: order.paymentReference };
  const env = getEnv();
  if (!env.PAYSTACK_SECRET_KEY) throw new AppError("NOT_CONFIGURED", "Payments are not configured yet.");
  const reference = order.paymentReference ?? `tailorly_${String(order._id)}_${Date.now()}`;
  const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: ["Bearer", env.PAYSTACK_SECRET_KEY].join(" "), "Content-Type": "application/json" }, body: JSON.stringify({ email, amount: order.total, currency: "NGN", reference, callback_url: `${env.APP_URL}/account/orders` }) });
  const result = (await response.json()) as { status: boolean; message?: string; data?: { authorization_url: string; reference: string } };
  if (!response.ok || !result.status || !result.data) {
    await Product.bulkWrite(order.items.filter((item) => item.trackStock).map((item) => ({ updateOne: { filter: { _id: item.productId, tenantId: tid(tenantId), "variants._id": item.variantId }, update: { $inc: { "variants.$.stock": item.quantity } } } })));
    await Order.deleteOne({ _id: order._id, tenantId: tid(tenantId), status: "pending_payment" });
    throw new AppError("PROVIDER_FAILURE", result.message ?? "Payment provider could not initialize the transaction.");
  }
  await Order.updateOne({ _id: order._id, tenantId: tid(tenantId) }, { $set: { paymentReference: result.data.reference } });
  await Payment.create({ orderId: order._id, tenantId: tid(tenantId), userId, provider: "paystack", reference: result.data.reference, amount: order.total });
  await Cart.updateOne({ tenantId: tid(tenantId), userId }, { $set: { items: [] } });
  return { order: publicDoc({ ...order, paymentReference: result.data.reference }), authorizationUrl: result.data.authorization_url, reference: result.data.reference };
}

export async function verifyPayment(tenantId: string, userId: Types.ObjectId, reference: string) {
  await connectDb();
  const payment = await Payment.findOne({ tenantId: tid(tenantId), userId, reference, status: "initialized" });
  if (!payment) throw new AppError("NOT_FOUND", "Payment not found.");
  const env = getEnv();
  if (!env.PAYSTACK_SECRET_KEY) throw new AppError("NOT_CONFIGURED", "Payments are not configured yet.");
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: ["Bearer", env.PAYSTACK_SECRET_KEY].join(" ") } });
  const result = (await response.json()) as { status: boolean; data?: { status: string; amount: number; reference: string } };
  if (!response.ok || !result.status || result.data?.status !== "success" || result.data.amount !== payment.amount) throw new AppError("PROVIDER_FAILURE", "Payment could not be verified.");
  const updated = await Order.updateOne({ _id: payment.orderId, tenantId: tid(tenantId), userId, status: "pending_payment" }, { $set: { status: "paid" } });
  if (!updated.modifiedCount) throw new AppError("CONFLICT", "This order is no longer awaiting payment.");
  payment.status = "paid"; await payment.save();
  return { paid: true, orderId: String(payment.orderId) };
}
