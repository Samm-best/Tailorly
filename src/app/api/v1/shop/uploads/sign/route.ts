import type { NextRequest } from "next/server";
import { requireShopManager } from "@/auth/shop-access";
import { requireUser } from "@/auth/current-user";
import { signUploadParams, tenantFolder, userFolder } from "@/catalogue/images";
import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { ok, readJson, runApi, tenantContextFrom } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";
import { signUploadSchema } from "@/storefront/schemas";

/**
 * Signed direct-to-Cloudinary uploads. The folder is built from the tenant resolved from the Host
 * header, never from the request, so a shop can only ever upload into its own folder.
 * The API secret never leaves the server.
 */
export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const area = signUploadSchema.parse(await readJson(req)).area;
    const { tenant, user } = area === "profile"
      ? { tenant: null, user: (await requireUser(req)).user }
      : area === "custom-orders" ? await requireUserWithTenant(req) : await requireShopManager(req, "catalogue.manage");
    consumeRateLimit("upload-sign:user", String(user._id), 60, 60 * 60 * 1000);
    const env = getEnv();
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new AppError("NOT_CONFIGURED", "Image uploads are not configured yet.");
    }
    const timestamp = Math.floor(Date.now() / 1000);
    let folder: string;
    if (area === "profile") folder = userFolder(String(user._id));
    else folder = tenantFolder(tenant!.id, area);
    const signature = signUploadParams({ folder, timestamp }, env.CLOUDINARY_API_SECRET);
    return ok({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      folder,
      timestamp,
      signature,
    });
  });
}

async function requireUserWithTenant(req: NextRequest) {
  const ctx = await tenantContextFrom(req);
  if (ctx.kind !== "tenant") throw new AppError("NOT_FOUND", "This area is only available on a shop address.");
  const { user } = await requireUser(req);
  return { tenant: ctx.tenant, user };
}
