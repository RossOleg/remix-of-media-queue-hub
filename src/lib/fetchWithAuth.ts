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
  const res = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (res.status === 401) {
    window.location.href = LOGIN_URL;
    return new Promise(() => {});
  }

  return res;
}
