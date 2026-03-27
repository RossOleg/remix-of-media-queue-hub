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

  // Some servers return 200 with an HTML login page instead of 401.
  // Detect this by checking the content-type header.
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/html")) {
    window.location.href = LOGIN_URL;
    return new Promise(() => {});
  }

  return res;
}
