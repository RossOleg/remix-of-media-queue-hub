// Derive all paths dynamically from document.baseURI
//
// Deployment scenarios:
//   1) test.daminion.net          → API at /api
//   2) localhost/daminion         → API at /daminion/api
//   3) test.daminion.net/daminion → API at /daminion/api
//
// The "parent base" is the first path segment (if any) from baseURI.

function getParentBase(): string {
  const base = new URL(document.baseURI);
  // Take the first non-empty path segment as the virtual directory
  const segments = base.pathname.split("/").filter(Boolean);
  // If there's at least one segment, treat it as the parent directory
  // e.g. /daminion/someApp → "/daminion"
  //      /someApp          → "" (single segment = the app itself, no parent dir)
  //      /develop/someApp  → "/develop"
  if (segments.length >= 2) {
    return `/${segments[0]}`;
  }
  return "";
}

function getBasePath(): string {
  const base = new URL(document.baseURI);
  // Use the full baseURI pathname (minus trailing slash) as the router basename
  return base.pathname.replace(/\/+$/, "") || "/";
}

/** Parent app base, e.g. "/daminion" or "" for root */
export const PARENT_BASE = getParentBase();

/** Router basename derived from document.baseURI */
export const BASE_PATH = getBasePath();

/** API base: PARENT_BASE + "/api", e.g. "/daminion/api" or "/api" */
export const API_BASE = `${PARENT_BASE}/api`;

/** Parent login URL for 401 redirects */
export const LOGIN_URL = `${PARENT_BASE}/login`;
