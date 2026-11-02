import { createHmac, randomBytes } from "node:crypto";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Opaque 256-bit random token. The raw value only ever lives in the cookie / email link. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this keyed hash is stored, so a database leak does not expose usable sessions. */
export function hashToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}
