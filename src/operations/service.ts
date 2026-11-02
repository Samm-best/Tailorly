import { Types } from "mongoose";
import { connectDb } from "@/db/mongoose";
import { AppError } from "@/lib/errors";
import { createNotification } from "@/customers/service";
import { CustomOrder, Order } from "@/orders/models";
import { TenantMembership } from "@/tenants/models";
import { Appointment, Conversation, Delivery, Message, ProductionJob } from "@/operations/models";
import type { ProductionStage } from "@/operations/models";

const oid = (id: string) => new Types.ObjectId(id);
const tid = (id: string) => oid(id);
const out = <T extends { _id: Types.ObjectId; createdAt?: Date; updatedAt?: Date }>(doc: T) => {
  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id), createdAt: doc.createdAt?.toISOString(), updatedAt: doc.updatedAt?.toISOString() };
};
const stageIndex = (stage: ProductionStage) => ["order_received", "measurement_confirmed", "fabric_selection", "cutting", "sewing", "fitting", "quality_inspection", "ready_for_collection", "delivered"].indexOf(stage);

export async function listProduction(tenantId: string) {
  await connectDb();
  return (await ProductionJob.find({ tenantId: tid(tenantId) }).sort({ stage: 1, updatedAt: -1 }).lean()).map(out);
}
export async function getCustomerProduction(tenantId: string, customerId: Types.ObjectId) {
  await connectDb();
  return (await ProductionJob.find({ tenantId: tid(tenantId), customerId }).sort({ updatedAt: -1 }).lean()).map(out);
}
export async function createProductionForOrder(tenantId: string, orderId: string, actorUserId: Types.ObjectId) {
  await connectDb();
  const order = await Order.findOne({ _id: oid(orderId), tenantId: tid(tenantId), status: { $in: ["paid", "processing", "completed"] } }).lean();
  if (!order) throw new AppError("NOT_FOUND", "Paid order not found.");
  const job = await ProductionJob.findOneAndUpdate({ tenantId: tid(tenantId), orderId: order._id }, { $setOnInsert: { tenantId: tid(tenantId), customerId: order.userId, orderId: order._id, stage: "order_received" }, $set: { updatedBy: actorUserId } }, { upsert: true, new: true }).lean();
  await createNotification({ userId: order.userId, tenantId: tid(tenantId), type: "production", title: "Production started", body: "Your order has entered production." });
  return out(job);
}
export async function createProductionForCustomOrder(tenantId: string, customOrderId: string, actorUserId: Types.ObjectId) {
  await connectDb();
  const order = await CustomOrder.findOne({ _id: oid(customOrderId), tenantId: tid(tenantId), status: "accepted" }).lean();
  if (!order) throw new AppError("NOT_FOUND", "Accepted custom order not found.");
  const job = await ProductionJob.findOneAndUpdate({ tenantId: tid(tenantId), customOrderId: order._id }, { $setOnInsert: { tenantId: tid(tenantId), customerId: order.customerId, customOrderId: order._id, stage: "order_received" }, $set: { updatedBy: actorUserId } }, { upsert: true, new: true }).lean();
  await createNotification({ userId: order.customerId, tenantId: tid(tenantId), type: "production", title: "Custom order accepted", body: "Your custom order has entered production." });
  return out(job);
}
export async function updateProduction(tenantId: string, id: string, actorUserId: Types.ObjectId, input: { stage: ProductionStage; notes?: string; dueAt?: Date }) {
  await connectDb();
  const current = await ProductionJob.findOne({ _id: oid(id), tenantId: tid(tenantId) }).lean();
  if (!current) throw new AppError("NOT_FOUND", "Production job not found.");
  if (stageIndex(input.stage) < stageIndex(current.stage)) throw new AppError("CONFLICT", "Production stages cannot move backwards.");
  const job = await ProductionJob.findOneAndUpdate({ _id: oid(id), tenantId: tid(tenantId) }, { $set: { ...input, updatedBy: actorUserId } }, { new: true }).lean();
  if (input.stage !== current.stage) await createNotification({ userId: current.customerId, tenantId: tid(tenantId), type: "production", title: "Production update", body: `Your order moved to ${input.stage.replaceAll("_", " ")}.` });
  return out(job!);
}

export async function listConversations(tenantId: string, userId: Types.ObjectId, manager: boolean) {
  await connectDb();
  const filter = manager ? { tenantId: tid(tenantId) } : { tenantId: tid(tenantId), customerId: userId };
  return (await Conversation.find(filter).sort({ lastMessageAt: -1 }).lean()).map(out);
}
export async function createConversation(tenantId: string, userId: Types.ObjectId, input: { subject: string; body: string }) {
  await connectDb();
  const conversation = await Conversation.create({ tenantId: tid(tenantId), customerId: userId, subject: input.subject, lastMessageAt: new Date() });
  await Message.create({ tenantId: tid(tenantId), conversationId: conversation._id, senderId: userId, body: input.body });
  return out(conversation.toObject());
}
export async function listMessages(tenantId: string, userId: Types.ObjectId, conversationId: string, manager: boolean) {
  await connectDb();
  const conversation = await Conversation.findOne({ _id: oid(conversationId), tenantId: tid(tenantId), ...(manager ? {} : { customerId: userId }) }).lean();
  if (!conversation) throw new AppError("NOT_FOUND", "Conversation not found.");
  return (await Message.find({ tenantId: tid(tenantId), conversationId: conversation._id }).sort({ createdAt: 1 }).lean()).map(out);
}
export async function addMessage(tenantId: string, userId: Types.ObjectId, conversationId: string, body: string, manager: boolean) {
  await connectDb();
  const conversation = await Conversation.findOne({ _id: oid(conversationId), tenantId: tid(tenantId), ...(manager ? {} : { customerId: userId }) }).lean();
  if (!conversation) throw new AppError("NOT_FOUND", "Conversation not found.");
  const message = await Message.create({ tenantId: tid(tenantId), conversationId: conversation._id, senderId: userId, body });
  await Conversation.updateOne({ _id: conversation._id, tenantId: tid(tenantId) }, { $set: { lastMessageAt: new Date() } });
  if (manager) {
    await createNotification({ userId: conversation.customerId, tenantId: tid(tenantId), type: "message", title: "New shop message", body: "Your shop sent you a new message." });
  } else {
    const staff = await TenantMembership.find({ tenantId: tid(tenantId), role: { $in: ["owner", "manager", "tailor", "staff"] }, status: "active" }).select("userId").lean();
    await Promise.all(staff.map((member) => createNotification({ userId: member.userId, tenantId: tid(tenantId), type: "message", title: "New customer message", body: "A customer sent a new shop message." })));
  }
  return out(message.toObject());
}

export async function createAppointment(tenantId: string, userId: Types.ObjectId, input: { productionJobId?: string; startsAt: Date; endsAt: Date; type: "fitting" | "measurement" | "collection"; notes?: string }) {
  await connectDb();
  if (input.productionJobId) {
    const job = await ProductionJob.exists({ _id: oid(input.productionJobId), tenantId: tid(tenantId), customerId: userId });
    if (!job) throw new AppError("NOT_FOUND", "Production job not found.");
  }
  const conflict = await Appointment.exists({ tenantId: tid(tenantId), status: { $in: ["requested", "confirmed"] }, startsAt: { $lt: input.endsAt }, endsAt: { $gt: input.startsAt } });
  if (conflict) throw new AppError("CONFLICT", "That time is already booked.");
  return out((await Appointment.create({ ...input, productionJobId: input.productionJobId ? oid(input.productionJobId) : undefined, tenantId: tid(tenantId), customerId: userId })).toObject());
}
export async function listAppointments(tenantId: string, userId: Types.ObjectId, manager: boolean) {
  await connectDb();
  return (await Appointment.find({ tenantId: tid(tenantId), ...(manager ? {} : { customerId: userId }) }).sort({ startsAt: 1 }).lean()).map(out);
}
export async function updateAppointment(tenantId: string, id: string, status: "confirmed" | "cancelled" | "completed") {
  await connectDb();
  const appointment = await Appointment.findOneAndUpdate({ _id: oid(id), tenantId: tid(tenantId), status: { $in: ["requested", "confirmed"] } }, { $set: { status } }, { new: true }).lean();
  if (!appointment) throw new AppError("NOT_FOUND", "Appointment not found.");
  await createNotification({ userId: appointment.customerId, tenantId: tid(tenantId), type: "appointment", title: "Appointment update", body: `Your appointment is ${status}.` });
  return out(appointment);
}

export async function cancelAppointment(tenantId: string, userId: Types.ObjectId, id: string) {
  await connectDb();
  const appointment = await Appointment.findOneAndUpdate(
    { _id: oid(id), tenantId: tid(tenantId), customerId: userId, status: { $in: ["requested", "confirmed"] } },
    { $set: { status: "cancelled" } },
    { new: true },
  ).lean();
  if (!appointment) throw new AppError("NOT_FOUND", "Appointment not found or cannot be cancelled.");
  return out(appointment);
}

export async function listDeliveries(tenantId: string, userId: Types.ObjectId, manager: boolean) {
  await connectDb();
  return (await Delivery.find({ tenantId: tid(tenantId), ...(manager ? {} : { customerId: userId }) }).sort({ updatedAt: -1 }).lean()).map(out);
}
export async function createDeliveryForOrder(tenantId: string, orderId: string, actorUserId: Types.ObjectId) {
  await connectDb();
  const order = await Order.findOne({ _id: oid(orderId), tenantId: tid(tenantId), status: { $in: ["paid", "processing", "completed"] } }).lean();
  if (!order) throw new AppError("NOT_FOUND", "Paid order not found.");
  const delivery = await Delivery.findOneAndUpdate(
    { tenantId: tid(tenantId), orderId: order._id },
    { $setOnInsert: { tenantId: tid(tenantId), customerId: order.userId, orderId: order._id, status: "pending" }, $set: { updatedBy: actorUserId } },
    { upsert: true, new: true },
  ).lean();
  return out(delivery!);
}
export async function updateDelivery(tenantId: string, id: string, actorUserId: Types.ObjectId, input: { status: "pending" | "ready" | "out_for_delivery" | "delivered" | "failed"; trackingCode?: string; notes?: string }) {
  await connectDb();
  const current = await Delivery.findOne({ _id: oid(id), tenantId: tid(tenantId) }).lean();
  if (!current) throw new AppError("NOT_FOUND", "Delivery record not found.");
  const order = ["pending", "ready", "out_for_delivery", "delivered"];
  if (input.status !== "failed" && order.indexOf(input.status) < order.indexOf(current.status)) throw new AppError("CONFLICT", "Delivery status cannot move backwards.");
  if (current.status === "delivered") throw new AppError("CONFLICT", "A delivered shipment cannot be changed.");
  const delivery = await Delivery.findOneAndUpdate({ _id: oid(id), tenantId: tid(tenantId) }, { $set: { ...input, updatedBy: actorUserId } }, { new: true }).lean();
  if (!delivery) throw new AppError("NOT_FOUND", "Delivery record not found.");
  await createNotification({ userId: delivery.customerId, tenantId: tid(tenantId), type: "delivery", title: "Delivery update", body: `Your delivery is ${input.status.replaceAll("_", " ")}.` });
  return out(delivery);
}
