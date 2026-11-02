import type { NextRequest } from "next/server";
import { connectDb } from "@/db/mongoose";
import { AppError } from "@/lib/errors";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";
import { ContactMessage } from "@/site/models";
import { contactSchema } from "@/site/schemas";

/** Contact form of the main Tailorly website. Shops have their own contact details; this is for Tailorly itself. */
export async function POST(req: NextRequest) {
  return runApi(req, async ({ ip }) => {
    const ctx = await tenantContextFrom(req);
    if (ctx.kind !== "root") throw new AppError("NOT_FOUND", "Not available on a shop address.");
    consumeRateLimit("contact:ip", ip, 5, 60 * 60 * 1000);
    const raw = await readJson(req);
    // Honeypot: bots fill the hidden field. Pretend success and store nothing.
    if (raw && typeof raw === "object" && typeof (raw as { website?: unknown }).website === "string" && (raw as { website: string }).website) {
      return ok({ received: true }, 202);
    }
    const { website: _ignored, ...input } = contactSchema.parse(raw);
    void _ignored;
    await connectDb();
    await ContactMessage.create({ ...input, phone: input.phone || undefined, businessName: input.businessName || undefined });
    return ok({ received: true }, 202);
  });
}
