import { LOGIN_URL } from "@/lib/config";

/**
 * Wrapper around fetch that:
 * - Always sends credentials (cookies)
 * - Redirects to parent login on 401
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      credentials: "include",
    });
  } catch (err) {
    // Network error (CORS blocked, server unreachable, etc.)
    console.error("[fetchWithAuth] Network error, redirecting to login:", err);
    window.location.href = LOGIN_URL;
    return new Promise(() => {});
  }

  console.debug(
    `[fetchWithAuth] ${String(input)} → status=${res.status}, content-type=${res.headers.get("content-type")}`,
  );

  if (res.status === 401) {
    console.warn("[fetchWithAuth] 401 received, redirecting to:", LOGIN_URL);
    window.location.href = LOGIN_URL;
    return new Promise(() => {});
  }

  return res;
}
