import { API_BASE } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

/* ── Queue Status ── */

export interface QueueStatusResponse {
  data: {
    waiting: number;
    processing: number;
    processed: number;
    failed: number;
    waitingForProcessAfterError: number;
  };
  error: string | null;
  success: boolean;
  errorCode: number;
}

export async function fetchQueueStatus(): Promise<QueueStatusResponse> {
  const res = await fetchWithAuth(`${API_BASE}/AI/GetAIQueueStatus`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ── Queue Items ── */

export interface AIQueueItemRaw {
  guid: string;
  mediaItemId: number;
  status: number[];
  name: string;
  totalProgress: number;
  inQueueSince: string;
  fileSize: number;
  started: string | null;
  ended: string | null;
  lastAttempt: string | null;
  error: string | null;
  modelsHistory: string | null;
}

export interface GetItemsAIStatusResponse {
  data: {
    items: AIQueueItemRaw[];
    totalItems: number;
  };
  error: string | null;
  success: boolean;
  errorCode: number;
}

export type FileStatus = "waiting" | "processing" | "processed" | "failed" | "waitingForProcessAfterFail";

/** Map filter status to API integer */
export const STATUS_TO_INT: Record<string, number> = {
  all: 0,
  waiting: 1,
  waitingForProcessAfterFail: 2,
  processing: 3,
  processed: 4,
  failed: 5,
};

export const INT_TO_STATUS: Record<number, FileStatus> = {
  1: "waiting",
  2: "waitingForProcessAfterFail",
  3: "processing",
  4: "processed",
  5: "failed",
};

export type SortKey = "name" | "fileSize" | "inQueueSince" | "started" | "ended" | "lastAttempt";

export const SORT_KEY_TO_INT: Record<SortKey, number> = {
  name: 1,
  fileSize: 2,
  inQueueSince: 3,
  lastAttempt: 4,
  ended: 5,
  started: 6,
};

export interface FetchItemsParams {
  status: number;
  searchText: string;
  pageIndex: number;
  pageSize: number;
  sortBy: number;
  sortOrder: number; // 0=asc, 1=desc
}

export async function fetchQueueItems(params: FetchItemsParams): Promise<GetItemsAIStatusResponse> {
  const qs = new URLSearchParams({
    status: String(params.status),
    searchText: params.searchText,
    pageIndex: String(params.pageIndex),
    pageSize: String(params.pageSize),
    sortBy: String(params.sortBy),
    sortOrder: String(params.sortOrder),
  });
  const res = await fetchWithAuth(`${API_BASE}/AI/GetItemsAIStatus?${qs}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ── Helpers ── */

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export interface QueueItem {
  id: string;
  mediaItemId: number;
  fileName: string;
  fileSize: string;
  fileSizeBytes: number;
  status: FileStatus;
  statusCodes: number[];
  progress: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  lastAttempt?: string;
  error?: string;
  modelsHistory?: string;
}

/* ── Branding API ── */

export async function fetchCustomScheme(): Promise<boolean> {
  const res = await fetchWithAuth(`${API_BASE}/branding/getCustomScheme`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data; // true = light, false = dark
}

export async function fetchCustomColor(): Promise<string> {
  const res = await fetchWithAuth(`${API_BASE}/branding/getCustomColor`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data; // hex color
}

export async function fetchAdditionalCustomColor(): Promise<string> {
  const res = await fetchWithAuth(`${API_BASE}/branding/getAdditionalCustomColor`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data; // hex color
}

/* ── Predefined accent palettes ── */

interface BrandPalette {
  /** Reference hex for matching */
  ref: string;
  light: { primary: string; primaryFg: string };
  dark:  { primary: string; primaryFg: string };
}

/**
 * Curated palettes — each tested for readability on light (#fff) and dark (#242424) backgrounds.
 * Covers the full hue wheel + neutral fallback.
 */
const PALETTES: BrandPalette[] = [
  // Neutral / grey (fallback for whites, blacks, greys)
  { ref: "#78909c", light: { primary: "200 18% 40%", primaryFg: "0 0% 100%" }, dark: { primary: "200 18% 65%", primaryFg: "0 0% 10%" } },
  // Blue
  { ref: "#1976d2", light: { primary: "210 79% 46%", primaryFg: "0 0% 100%" }, dark: { primary: "210 79% 65%", primaryFg: "0 0% 10%" } },
  // Indigo
  { ref: "#3949ab", light: { primary: "231 44% 44%", primaryFg: "0 0% 100%" }, dark: { primary: "231 44% 68%", primaryFg: "0 0% 10%" } },
  // Purple
  { ref: "#8e24aa", light: { primary: "287 66% 40%", primaryFg: "0 0% 100%" }, dark: { primary: "287 50% 68%", primaryFg: "0 0% 10%" } },
  // Pink
  { ref: "#d81b60", light: { primary: "340 78% 47%", primaryFg: "0 0% 100%" }, dark: { primary: "340 65% 65%", primaryFg: "0 0% 10%" } },
  // Red
  { ref: "#e53935", light: { primary: "1 76% 55%", primaryFg: "0 0% 100%" }, dark: { primary: "1 70% 65%", primaryFg: "0 0% 10%" } },
  // Orange
  { ref: "#fb8c00", light: { primary: "33 97% 40%", primaryFg: "0 0% 100%" }, dark: { primary: "33 90% 60%", primaryFg: "0 0% 10%" } },
  // Amber
  { ref: "#f9a825", light: { primary: "43 95% 42%", primaryFg: "0 0% 10%" }, dark: { primary: "43 85% 58%", primaryFg: "0 0% 10%" } },
  // Green
  { ref: "#43a047", light: { primary: "123 40% 44%", primaryFg: "0 0% 100%" }, dark: { primary: "123 38% 58%", primaryFg: "0 0% 10%" } },
  // Teal
  { ref: "#00897b", light: { primary: "174 100% 27%", primaryFg: "0 0% 100%" }, dark: { primary: "174 60% 52%", primaryFg: "0 0% 10%" } },
  // Cyan
  { ref: "#0097a7", light: { primary: "187 100% 33%", primaryFg: "0 0% 100%" }, dark: { primary: "187 70% 55%", primaryFg: "0 0% 10%" } },
  // Light blue
  { ref: "#039be5", light: { primary: "199 97% 45%", primaryFg: "0 0% 100%" }, dark: { primary: "199 80% 62%", primaryFg: "0 0% 10%" } },
  // Brown
  { ref: "#6d4c41", light: { primary: "16 25% 34%", primaryFg: "0 0% 100%" }, dark: { primary: "16 25% 58%", primaryFg: "0 0% 10%" } },
  // Blue grey
  { ref: "#546e7a", light: { primary: "200 18% 40%", primaryFg: "0 0% 100%" }, dark: { primary: "200 18% 62%", primaryFg: "0 0% 10%" } },
];

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16),
  ];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  // Weighted Euclidean distance (human eye is more sensitive to green)
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

export interface MatchedPalette {
  primary: string;
  primaryForeground: string;
}

/**
 * Find the closest predefined palette to the given hex color.
 * Returns HSL values ready for CSS variables.
 */
export function matchPalette(hex: string, isLight: boolean): MatchedPalette {
  const input = hexToRgb(hex);
  let best = PALETTES[0];
  let bestDist = Infinity;

  for (const p of PALETTES) {
    const ref = hexToRgb(p.ref);
    const dist = colorDistance(input, ref);
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }

  const scheme = isLight ? best.light : best.dark;
  return {
    primary: scheme.primary,
    primaryForeground: scheme.primaryFg,
  };
}

/* ── AI Settings & Retry ── */

export interface AISettings {
  processGoogle: boolean;
  processChatGPT: boolean;
  title: number;
  description: number;
  labels: number;
  objects: number;
  translate: boolean;
}

export async function fetchAISettings(): Promise<AISettings> {
  const res = await fetchWithAuth(
    `${API_BASE}/settings/getParam?global=true&paramName=cpUpdateGoogleSettings`,
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  const parsed = JSON.parse(json.data);
  return {
    processGoogle: parsed.ProcessGoogle,
    processChatGPT: parsed.ProcessChatGPT,
    title: parsed.Title,
    description: parsed.Description,
    labels: parsed.Labels,
    objects: parsed.Objects,
    translate: parsed.Translate,
  };
}

export async function retryAIProcessing(
  mediaItemId: number,
  settings: AISettings,
): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/mediaItems/processAILabels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ids: [mediaItemId],
      ai: {
        processGoogle: settings.processGoogle,
        processChatGPT: settings.processChatGPT,
        title: settings.title,
        description: settings.description,
        labels: settings.labels,
        objects: settings.objects,
        translate: settings.translate,
      },
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export function mapRawItem(raw: AIQueueItemRaw): QueueItem {
  const mainStatus = raw.status?.[0] ?? 0;
  return {
    id: raw.guid,
    mediaItemId: raw.mediaItemId,
    fileName: raw.name,
    fileSize: formatFileSize(raw.fileSize),
    fileSizeBytes: raw.fileSize,
    status: INT_TO_STATUS[mainStatus] ?? "waiting",
    statusCodes: raw.status,
    progress: raw.totalProgress,
    queuedAt: raw.inQueueSince,
    startedAt: raw.started ?? undefined,
    completedAt: raw.ended ?? undefined,
    lastAttempt: raw.lastAttempt ?? undefined,
    error: raw.error ?? undefined,
    modelsHistory: raw.modelsHistory ?? undefined,
  };
}
