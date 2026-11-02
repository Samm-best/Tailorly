import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { listAllOrders } from "@/orders/service";
import { ok, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    return ok({ orders: await listAllOrders(user._id) });
  });
}
