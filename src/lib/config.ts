// Derive all paths dynamically from document.baseURI
//
// Deployment scenarios:
//   1) test.daminion.net          → API at /api
//   2) localhost/daminion         → API at /daminion/api
//   3) test.daminion.net/daminion → API at /daminion/api
//
// The "parent base" is the first path segment (if any) from baseURI.

function getServerBase(): string {
  const segments = window.location.pathname.replace(/^\/+/, "").split("/");
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
