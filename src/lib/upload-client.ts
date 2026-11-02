import { api, type ApiResult } from "@/lib/client-api";

type SignData = { cloudName: string; apiKey: string; uploadUrl: string; folder: string; timestamp: number; signature: string };
const MAX_BYTES = 5 * 1024 * 1024;

/** Browser-side signed upload straight to Cloudinary. The server decides the folder and signs it; files never pass through our server. */
export async function uploadImage(file: File, area: "products" | "branding" | "profile"): Promise<ApiResult<{ url: string; publicId: string }>> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, error: { code: "VALIDATION_ERROR", message: "Use a JPG, PNG or WebP image." } };
  if (file.size > MAX_BYTES) return { ok: false, error: { code: "VALIDATION_ERROR", message: "Image must be 5 MB or smaller." } };
  const sig = await api<SignData>("/api/v1/shop/uploads/sign", { body: { area } });
  if (!sig.ok) return sig;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.data.apiKey);
  form.append("timestamp", String(sig.data.timestamp));
  form.append("folder", sig.data.folder);
  form.append("signature", sig.data.signature);
  try {
    const res = await fetch(sig.data.uploadUrl, { method: "POST", body: form });
    const json = (await res.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };
    if (!res.ok || !json.secure_url || !json.public_id) return { ok: false, error: { code: "UPLOAD_FAILED", message: json.error?.message ?? "Upload failed. Please try again." } };
    return { ok: true, data: { url: json.secure_url, publicId: json.public_id } };
  } catch {
    return { ok: false, error: { code: "NETWORK", message: "Could not reach the image service. Check your connection." } };
  }
}
