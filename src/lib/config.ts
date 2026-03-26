// App is served at /develop/{appPath}/
// API is at /develop/api/

function getBasePath(): string {
  const path = window.location.pathname.replace(/\/+$/, "");
  // Extract /develop/{appPath} from the current URL
  const match = path.match(/^(\/develop\/[^/]+)/);
  return match ? match[1] : path;
}

function getApiBase(): string {
  // API is always at /develop/api regardless of appPath
  return "/develop/api";
}

export const BASE_PATH = getBasePath();
export const API_BASE = getApiBase();
