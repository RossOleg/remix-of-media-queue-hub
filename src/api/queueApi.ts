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

export function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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
