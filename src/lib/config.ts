// Derive SERVER_BASE as everything before /apps/ in the URL path.
// Examples:
//   /catalog/apps/queue → SERVER_BASE = "/catalog"
//   /apps/queue         → SERVER_BASE = ""
//   /some/deep/apps/x   → SERVER_BASE = "/some/deep"
//   /queue (no /apps/)  → falls back to first segment or ""

function getServerBase(): string {
  const pathname = window.location.pathname;
  const appsIndex = pathname.indexOf("/apps/");
  if (appsIndex > 0) {
    return pathname.substring(0, appsIndex);
  }
  if (appsIndex === 0) {
    return "";
  }
  // Fallback: first path segment
  const segments = pathname.replace(/^\/+/, "").split("/");
  return segments.length > 0 && segments[0] ? `/${segments[0]}` : "";
}

function getBasePath(): string {
  const base = new URL(document.baseURI);
  // Use the full baseURI pathname (minus trailing slash) as the router basename
  return base.pathname.replace(/\/+$/, "") || "/";
}
/** Server base, e.g. "/daminion" or "" for root */
export const SERVER_BASE = getServerBase();

/** Parent app base (alias) */
export const PARENT_BASE = SERVER_BASE;

/** Router basename derived from document.baseURI */
export const BASE_PATH = getBasePath();

/** API base: PARENT_BASE + "/api", e.g. "/daminion/api" or "/api" */
export const API_BASE = `${PARENT_BASE}/api`;

/** Parent login URL for 401 redirects */
export const LOGIN_URL = `${PARENT_BASE}/Account/Login`;
