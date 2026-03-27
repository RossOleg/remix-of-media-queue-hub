import { API_BASE } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  argbFromHex,
  themeFromSourceColor,
  hexFromArgb,
} from "@material/material-color-utilities";

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

/**
 * Smart accent color system — adjusts the raw brand color to ensure
 * readability on both light and dark backgrounds, similar to
 * Angular Material's HCT / palette generation.
 */

interface HslColor {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

export function hexToHslObj(hex: string): HslColor {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
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
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslStr(c: HslColor): string {
  return `${c.h} ${c.s}% ${c.l}%`;
}

/** Relative luminance (0–1) from HSL for WCAG contrast checks */
function luminanceFromHsl(c: HslColor): number {
  const l2 = c.l / 100;
  const s2 = c.s / 100;
  const a = s2 * Math.min(l2, 1 - l2);
  const f = (n: number) => {
    const k = (n + c.h / 30) % 12;
    const color = l2 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    const srgb = color;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(8) + 0.0722 * f(4);
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface AccentPalette {
  /** Main accent — adjusted for contrast on the theme background */
  primary: string;
  /** Foreground on top of primary (white or black) */
  primaryForeground: string;
  /** Subtle accent background (for badges, tinted areas) */
  accent: string;
  /** Text on accent background */
  accentForeground: string;
  /** Ring / focus color */
  ring: string;
}

/**
 * Given the raw brand hex and whether the UI is light,
 * produce an accent palette with guaranteed readability.
 *
 * Light theme: primary lightness clamped to 25–50 % so it's visible on white.
 * Dark theme:  primary lightness clamped to 55–75 % so it's visible on dark bg.
 *
 * If the color is achromatic (saturation < 8) — like white or near-white —
 * we boost saturation from the base hue and force a readable grey-blue.
 */
export function buildAccentPalette(hex: string, isLight: boolean): AccentPalette {
  const raw = hexToHslObj(hex);

  let { h, s, l } = raw;

  // Achromatic or near-white/near-black: inject some saturation
  if (s < 8) {
    h = h || 210;
    s = 25;
  }

  // Ensure minimum saturation for vibrancy
  s = Math.max(s, 25);

  if (isLight) {
    // Light theme: accent must be dark enough to read on white (~#fff)
    // Target lightness 30–42 for strong contrast
    if (l > 42) l = 38;
    if (l < 20) l = 30;
    s = Math.min(s, 90);
  } else {
    // Dark theme: accent must be bright enough on dark bg (~#242424)
    // Target lightness 55–72
    if (l < 55) l = 58;
    if (l > 78) l = 72;
    s = Math.min(s, 85);
  }

  const primary: HslColor = { h, s, l };

  // Determine foreground: white or black based on contrast
  const lum = luminanceFromHsl(primary);
  const whiteContrast = contrastRatio(1, lum);
  const blackContrast = contrastRatio(lum, 0);
  const useWhiteFg = whiteContrast >= blackContrast;

  const primaryForeground: HslColor = useWhiteFg
    ? { h: 0, s: 0, l: 100 }
    : { h: 0, s: 0, l: 10 };

  // Accent surface — very muted tint
  const accent: HslColor = isLight
    ? { h, s: Math.max(s * 0.3, 10), l: 93 }
    : { h, s: Math.max(s * 0.2, 8), l: 18 };

  // Accent foreground — readable on the accent surface
  const accentForeground: HslColor = isLight
    ? { h, s: Math.min(s, 80), l: Math.max(l - 10, 25) }
    : { h, s: Math.min(s, 70), l: Math.min(l + 8, 75) };

  return {
    primary: hslStr(primary),
    primaryForeground: hslStr(primaryForeground),
    accent: hslStr(accent),
    accentForeground: hslStr(accentForeground),
    ring: hslStr(primary),
  };
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
