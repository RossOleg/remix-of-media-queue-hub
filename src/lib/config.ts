// Derive all paths dynamically from document.baseURI
// App is served at /develop/{appPath}/
// API is at /develop/api/

function getParentBase(): string {
  // document.baseURI respects <base href="..."> set by the host page
  const base = new URL(document.baseURI);
  // Extract /develop from /develop/{appPath}/
  const match = base.pathname.match(/^(\/develop)\//);
  return match ? match[1] : "";
}

function getBasePath(): string {
  const base = new URL(document.baseURI);
  // Extract /develop/{appPath} as router basename
  const match = base.pathname.replace(/\/+$/, "").match(/^(\/develop\/[^/]+)/);
  return match ? match[1] : base.pathname.replace(/\/+$/, "");
}

/** Parent app base, e.g. "/develop" */
export const PARENT_BASE = getParentBase();

/** Router basename, e.g. "/develop/myApp" */
export const BASE_PATH = getBasePath();

/** API base built relative to parent, e.g. "/develop/api" */
export const API_BASE = `${PARENT_BASE}/api`;

/** Parent login URL for 401 redirects */
export const LOGIN_URL = `${PARENT_BASE}/login`;
