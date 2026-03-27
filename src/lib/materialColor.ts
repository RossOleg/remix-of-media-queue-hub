/**
 * Minimal Material Design 3 HCT-based palette generation.
 * Inlined to avoid ESM/CJS resolution issues with @material/material-color-utilities.
 *
 * Based on the algorithms from:
 * https://github.com/nicolo-ribaudo/tc39-proposal-hct-color-space
 * and Google's Material Color Utilities.
 *
 * HCT = Hue, Chroma, Tone (perceptually uniform color space).
 */

// ── sRGB ↔ Linear RGB ──

function linearized(rgb: number): number {
  const s = rgb / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function delinearized(lin: number): number {
  const s = lin <= 0.0031308 ? lin * 12.92 : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255)));
}

// ── ARGB helpers ──

function argbFromHex(hex: string): number {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return (0xff000000 | parseInt(hex, 16)) >>> 0;
}

function rFromArgb(argb: number): number { return (argb >> 16) & 0xff; }
function gFromArgb(argb: number): number { return (argb >> 8) & 0xff; }
function bFromArgb(argb: number): number { return argb & 0xff; }

function argbFromRgb(r: number, g: number, b: number): number {
  return (0xff000000 | (r << 16) | (g << 8) | b) >>> 0;
}

// ── CIE L* (perceptual lightness, 0–100) ──

function yFromLstar(lstar: number): number {
  const ke = 8;
  if (lstar > ke) {
    const cube = ((lstar + 16) / 116) ** 3;
    return cube;
  }
  return lstar / (24389 / 27) / 100;
}

function lstarFromArgb(argb: number): number {
  const r = linearized(rFromArgb(argb));
  const g = linearized(gFromArgb(argb));
  const b = linearized(bFromArgb(argb));
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (y <= (216 / 24389)) {
    return (24389 / 27) * y * 100;
  }
  return 116 * Math.cbrt(y) - 16;
}

// ── CAM16-like simplified HCT ──
// We use a simplified approach: extract hue from OKLab and chroma from OKLCH,
// then map tone = L*.

function oklabFromLinear(r: number, g: number, b: number): [number, number, number] {
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function hueFromArgb(argb: number): number {
  const r = linearized(rFromArgb(argb));
  const g = linearized(gFromArgb(argb));
  const b = linearized(bFromArgb(argb));
  const [, a, bb] = oklabFromLinear(r, g, b);
  const hue = (Math.atan2(bb, a) * 180) / Math.PI;
  return hue < 0 ? hue + 360 : hue;
}

function chromaFromArgb(argb: number): number {
  const r = linearized(rFromArgb(argb));
  const g = linearized(gFromArgb(argb));
  const b = linearized(bFromArgb(argb));
  const [, a, bb] = oklabFromLinear(r, g, b);
  return Math.sqrt(a * a + bb * bb) * 400; // scale to roughly 0-150 range
}

// ── Tone-based color generation ──
// Given a hue and target tone (L*), find the most chromatic sRGB color.

function argbFromHueTone(hue: number, tone: number): number {
  // Binary search for maximum chroma at this hue and tone
  let lo = 0, hi = 150, mid: number;
  let bestArgb = argbFromRgb(
    delinearized(yFromLstar(tone)),
    delinearized(yFromLstar(tone)),
    delinearized(yFromLstar(tone)),
  );

  for (let i = 0; i < 20; i++) {
    mid = (lo + hi) / 2;
    const candidate = argbFromHueChromaTone(hue, mid, tone);
    if (candidate !== null) {
      bestArgb = candidate;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return bestArgb;
}

function argbFromHueChromaTone(hue: number, chroma: number, tone: number): number | null {
  // Convert hue+chroma to OKLab a,b
  const hueRad = (hue * Math.PI) / 180;
  const c = chroma / 400;
  const a = c * Math.cos(hueRad);
  const b = c * Math.sin(hueRad);

  // We need L* = tone, find the linear RGB that satisfies both OKLab and L*
  // Start with the L* grey and adjust
  const targetY = yFromLstar(tone);

  // OKLab to linear RGB (approximate, iterative)
  // Use the OKLab values with the L from tone
  const lTarget = Math.cbrt(targetY);

  const l_ = lTarget;
  // Invert OKLab
  const L = l_ + 0.3963377774 * a + 0.2158037573 * b;
  const M = l_ - 0.1055613458 * a - 0.0638541728 * b;
  const S = l_ - 0.0894841775 * a - 1.2914855480 * b;

  const lr = +(4.0767416621 * L ** 3 - 3.3077115913 * M ** 3 + 0.2309699292 * S ** 3);
  const lg = +(-1.2684380046 * L ** 3 + 2.6097574011 * M ** 3 - 0.3413193965 * S ** 3);
  const lb = +(-0.0041960863 * L ** 3 - 0.7034186147 * M ** 3 + 1.7076147010 * S ** 3);

  const ri = delinearized(lr);
  const gi = delinearized(lg);
  const bi = delinearized(lb);

  // Check if in gamut
  if (ri < 0 || ri > 255 || gi < 0 || gi > 255 || bi < 0 || bi > 255) {
    return null;
  }

  // Verify tone is close enough
  const result = argbFromRgb(ri, gi, bi);
  const actualTone = lstarFromArgb(result);
  if (Math.abs(actualTone - tone) > 3) {
    return null;
  }

  return result;
}

function toneArgb(tone: number): number {
  // Pure grey at given tone
  const v = delinearized(yFromLstar(tone));
  return argbFromRgb(v, v, v);
}

// ── Palette generation (M3 tonal palette) ──

interface TonalPalette {
  tone(t: number): number; // returns ARGB
}

function tonalPaletteFromArgb(argb: number): TonalPalette {
  const hue = hueFromArgb(argb);
  const chroma = chromaFromArgb(argb);
  return {
    tone(t: number): number {
      if (chroma < 5) {
        // Near achromatic — use a neutral palette with slight tint
        return argbFromHueTone(hue || 210, t);
      }
      return argbFromHueTone(hue, t);
    },
  };
}

function neutralPaletteFromArgb(argb: number): TonalPalette {
  const hue = hueFromArgb(argb);
  return {
    tone(t: number): number {
      // Neutral palette — very low chroma tint
      const v = delinearized(yFromLstar(t));
      // Add just a tiny hue tint
      const result = argbFromHueChromaTone(hue || 210, 4, t);
      return result ?? argbFromRgb(v, v, v);
    },
  };
}

// ── Public API ──

export interface AccentPalette {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
}

function argbToHsl(argb: number): string {
  const r = rFromArgb(argb) / 255;
  const g = gFromArgb(argb) / 255;
  const b = bFromArgb(argb) / 255;
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

/**
 * Build a Material Design 3 accent palette from a source hex color.
 *
 * Light scheme:
 *   primary = tone 40, onPrimary = tone 100
 *   secondaryContainer = tone 90, onSecondaryContainer = tone 10
 *
 * Dark scheme:
 *   primary = tone 80, onPrimary = tone 20
 *   secondaryContainer = tone 30, onSecondaryContainer = tone 90
 */
export function buildAccentPalette(hex: string, isLight: boolean): AccentPalette {
  const source = argbFromHex(hex);
  const primary = tonalPaletteFromArgb(source);
  const neutral = neutralPaletteFromArgb(source);

  if (isLight) {
    return {
      primary: argbToHsl(primary.tone(40)),
      primaryForeground: argbToHsl(primary.tone(100)),
      accent: argbToHsl(primary.tone(90)),
      accentForeground: argbToHsl(primary.tone(10)),
      ring: argbToHsl(primary.tone(40)),
    };
  } else {
    return {
      primary: argbToHsl(primary.tone(80)),
      primaryForeground: argbToHsl(primary.tone(20)),
      accent: argbToHsl(primary.tone(30)),
      accentForeground: argbToHsl(primary.tone(90)),
      ring: argbToHsl(primary.tone(80)),
    };
  }
}
