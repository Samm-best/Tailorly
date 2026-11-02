/** Pure identity helpers (no dependencies) so they are trivially unit-testable. */

export function normalizeEmail(raw: string): string {
  return raw.normalize("NFKC").trim().toLowerCase();
}

export function normalizePhone(raw: string): string {
  const compact = raw.normalize("NFKC").trim().replace(/[()\s-]/g, "");
  if (compact.startsWith("00")) return `+${compact.slice(2)}`;
  return compact;
}

export function isValidPhone(raw: string): boolean {
  const phone = normalizePhone(raw);
  return /^\+?[0-9]{7,15}$/.test(phone);
}

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  return email.length <= 254 && EMAIL_RE.test(email);
}

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123",
  "qwertyuiop", "iloveyou1", "admin12345", "welcome123", "letmein123", "tailorly123",
]);

export type PasswordCheck = { ok: true } | { ok: false; issues: string[] };

export function validatePassword(password: string, email?: string): PasswordCheck {
  const issues: string[] = [];
  if (password.length < 10) issues.push("Use at least 10 characters.");
  if (password.length > 128) issues.push("Use at most 128 characters.");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) issues.push("Include at least one letter and one number.");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) issues.push("That password is too common.");
  if (email) {
    const local = normalizeEmail(email).split("@")[0] ?? "";
    if (local.length >= 4 && password.toLowerCase().includes(local)) issues.push("Do not include your email name in the password.");
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

/** Only same-site relative redirects are allowed after login. */
export function safeRedirectPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
