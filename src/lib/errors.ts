export type ErrorCode =
  | "VALIDATION_ERROR" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT"
  | "RATE_LIMITED" | "EMAIL_NOT_VERIFIED" | "INVALID_CREDENTIALS" | "INVALID_TOKEN"
  | "CSRF_REJECTED" | "NOT_CONFIGURED" | "EMAIL_NOT_CONFIGURED" | "PROVIDER_FAILURE" | "INTERNAL_ERROR";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409,
  RATE_LIMITED: 429, EMAIL_NOT_VERIFIED: 403, INVALID_CREDENTIALS: 401, INVALID_TOKEN: 400,
  CSRF_REJECTED: 403, NOT_CONFIGURED: 503, EMAIL_NOT_CONFIGURED: 503, PROVIDER_FAILURE: 502, INTERNAL_ERROR: 500,
};

/** Error that is safe to show to API clients. Anything else becomes INTERNAL_ERROR. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }

  get status(): number {
    return STATUS[this.code];
  }
}
