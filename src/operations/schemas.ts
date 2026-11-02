import { z } from "zod";
import { objectId } from "@/customers/schemas";
import { PRODUCTION_STAGES } from "@/operations/models";

export const productionUpdateSchema = z.object({
  stage: z.enum(PRODUCTION_STAGES),
  notes: z.string().trim().max(1000).optional(),
  dueAt: z.coerce.date().optional(),
}).strict();
export const conversationSchema = z.object({ subject: z.string().trim().min(1).max(140), body: z.string().trim().min(1).max(4000) }).strict();
export const messageSchema = z.object({ body: z.string().trim().min(1).max(4000) }).strict();
export const appointmentSchema = z.object({
  productionJobId: objectId.optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  type: z.enum(["fitting", "measurement", "collection"]),
  notes: z.string().trim().max(1000).optional(),
}).strict().refine((v) => v.endsAt > v.startsAt, { message: "End time must be after start time.", path: ["endsAt"] });
export const appointmentStatusSchema = z.object({ status: z.enum(["confirmed", "cancelled", "completed"]) }).strict();
export const deliveryUpdateSchema = z.object({
  status: z.enum(["pending", "ready", "out_for_delivery", "delivered", "failed"]),
  trackingCode: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
}).strict();
