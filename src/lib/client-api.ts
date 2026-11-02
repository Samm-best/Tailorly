export type ApiError = { code: string; message: string; details?: unknown };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/** Same-origin JSON fetch that never throws: always resolves to { ok, data | error }. */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      credentials: "same-origin",
      headers: init.body ? { "content-type": "application/json" } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    const json = (await res.json()) as ApiResult<T>;
    return json;
  } catch {
    return { ok: false, error: { code: "NETWORK", message: "Could not reach the server. Check your connection and try again." } };
  }
}

export function fieldErrors(error: ApiError): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(error.details)) {
    for (const d of error.details as { path: string; message: string }[]) if (d.path && !out[d.path]) out[d.path] = d.message;
  }
  return out;
}
