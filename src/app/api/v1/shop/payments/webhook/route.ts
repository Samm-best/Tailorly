import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";
import { handlePaystackWebhook } from "@/orders/service";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) throw new AppError("FORBIDDEN", "Missing payment webhook signature.");
    const result = await handlePaystackWebhook(await req.text(), signature);
    return Response.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof AppError) return Response.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.status });
    throw error;
  }
}
