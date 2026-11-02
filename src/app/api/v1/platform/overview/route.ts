import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { getPlatformRole } from "@/auth/service";
import { Product } from "@/catalogue/models";
import { Order } from "@/orders/models";
import { connectDb } from "@/db/mongoose";
import { User } from "@/auth/models";
import { Tenant } from "@/tenants/models";
import { AppError } from "@/lib/errors";
import { ok, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    if ((await getPlatformRole(user._id)) !== "super_admin") throw new AppError("FORBIDDEN", "Super Admin access is required.");
    await connectDb();
    const [tenants, users, products, orders, recentTenants] = await Promise.all([
      Tenant.countDocuments({}),
      User.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "published" }),
      Order.countDocuments({}),
      Tenant.find({}).select("name slug status createdAt").sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    return ok({
      totals: { tenants, users, products, orders },
      recentTenants: recentTenants.map((tenant) => ({ id: String(tenant._id), name: tenant.name, slug: tenant.slug, status: tenant.status, createdAt: tenant.createdAt })),
    });
  });
}
