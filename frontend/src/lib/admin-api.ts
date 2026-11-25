type Meta = { message?: string; errors?: Record<string, string> };
export type AdminApiResult<T> = { ok: boolean; status: number; data: Partial<T> & Meta };

/** fetch wrapper for the admin API: JSON in and out, sends you to /login when the session is gone. */
export async function adminApi<T extends object = object>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; signal?: AbortSignal } = {},
): Promise<AdminApiResult<T>> {
  try {
    const hasBody = init.body !== undefined;
    const res = await fetch(path, {
      method: init.method ?? "GET",
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: init.signal,
    });
    if (res.status === 401 || res.status === 403) window.location.assign("/login");
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    return {
      ok: false,
      status: 0,
      data: { message: "Network error. Please check your connection and try again." },
    };
  }
}