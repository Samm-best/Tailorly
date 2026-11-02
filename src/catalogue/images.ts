import { createHash } from "node:crypto";

export type ProductImage = { url: string; publicId: string; alt?: string };

/** Folder every upload for a shop must live in. The signature endpoint pins uploads to it. */
export type UploadArea = "products" | "branding" | "custom-orders";

export function tenantFolder(tenantId: string, area: UploadArea): string {
  return `tailorly/${tenantId}/${area}`;
}

export function userFolder(userId: string): string {
  return `tailorly/users/${userId}/profile`;
}

/** Cloudinary's signature: sha1 of alphabetically sorted "k=v&k=v" + api secret. */
export function signUploadParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/**
 * An image may only be attached to a shop if it was uploaded to THAT shop's Cloudinary folder.
 * This stops one shop from pointing at another shop's media or at arbitrary external URLs.
 */
export function isTenantImage(img: { url: string; publicId: string }, tenantId: string, cloudName: string, area: UploadArea): boolean {
  const folder = `${tenantFolder(tenantId, area)}/`;
  if (!img.publicId.startsWith(folder) || img.publicId.includes("..")) return false;
  let u: URL;
  try {
    u = new URL(img.url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.hostname !== "res.cloudinary.com" || u.username || u.password) return false;
  const prefix = `/${cloudName}/image/upload/`;
  if (!u.pathname.startsWith(prefix)) return false;
  // After "/upload/" Cloudinary allows an optional version segment (v123456), then the public id plus an
  // optional file extension. Anything else (extra path segments, transformations, a foreign shop's id
  // embedded later in the path) is rejected, so the URL must point at exactly this public id.
  const rest = u.pathname.slice(prefix.length).replace(/^v\d+\//, "");
  if (!rest.startsWith(img.publicId)) return false;
  const tail = rest.slice(img.publicId.length);
  return tail === "" || /^\.[a-z0-9]{2,5}$/i.test(tail);
}
