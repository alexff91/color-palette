export interface RGB { r: number; g: number; b: number; }
export interface HSL { h: number; s: number; l: number; }
export type HarmonyMode = 'complementary' | 'analogous' | 'triadic' | 'random';

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  if (s === 0) { const val = Math.round(l * 255); return { r: val, g: val, b: val }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1; if (tt > 1) tt -= 1;
    if (tt < 1/6) return p + (q-p) * 6 * tt;
    if (tt < 1/2) return q;
    if (tt < 2/3) return p + (q-p) * (2/3-tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1+s) : l+s-l*s;
  const p = 2*l-q;
  const hN = h/360;
  return { r: Math.round(hue2rgb(p,q,hN+1/3)*255), g: Math.round(hue2rgb(p,q,hN)*255), b: Math.round(hue2rgb(p,q,hN-1/3)*255) };
}

export function hslToHex(hsl: HSL): string { return rgbToHex(hslToRgb(hsl)); }
export function hexToHsl(hex: string): HSL { return rgbToHsl(hexToRgb(hex)); }

function normalizeHue(h: number): number { return ((h % 360) + 360) % 360; }

export function generateComplementary(baseHue: number): number[] {
  return [baseHue, normalizeHue(baseHue+30), normalizeHue(baseHue+180), normalizeHue(baseHue+210), normalizeHue(baseHue+60)];
}
export function generateAnalogous(baseHue: number): number[] {
  return [normalizeHue(baseHue-40), normalizeHue(baseHue-20), baseHue, normalizeHue(baseHue+20), normalizeHue(baseHue+40)];
}
export function generateTriadic(baseHue: number): number[] {
  return [baseHue, normalizeHue(baseHue+30), normalizeHue(baseHue+120), normalizeHue(baseHue+240), normalizeHue(baseHue+270)];
}

export function generateRandomHues(): number[] {
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 360));
}

export function generatePalette(mode: HarmonyMode, baseHue?: number): string[] {
  const hue = baseHue ?? Math.floor(Math.random() * 360);
  let hues: number[];
  switch (mode) {
    case 'complementary': hues = generateComplementary(hue); break;
    case 'analogous': hues = generateAnalogous(hue); break;
    case 'triadic': hues = generateTriadic(hue); break;
    case 'random': default: hues = generateRandomHues(); break;
  }
  return hues.map((h, i) => {
    const s = 0.55 + (i % 3) * 0.1;
    const l = 0.35 + (i % 4) * 0.1;
    return hslToHex({ h, s, l });
  });
}

export function relativeLuminance(rgb: RGB): number {
  const conv = [rgb.r, rgb.g, rgb.b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * conv[0] + 0.7152 * conv[1] + 0.0722 * conv[2];
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function exportAsCssVariables(c: string[]): string { const n=String.fromCharCode(10); const l=c.map((v,i)=>"  --color-"+(i+1)+": "+v+";"); return ":root {"+n+l.join(n)+n+"}"; }

export function exportAsTailwindConfig(c: string[]): string {
  const q = String.fromCharCode(39);
  const n = String.fromCharCode(10);
  const e = c.map((v,i) => "      "+q+(i+1)+q+": "+q+v+q+",");
  return "module.exports = {"+n+"  theme: {"+n+"    extend: {"+n+"      colors: {"+n+"        palette: {"+n+e.join(n)+n+"        },"+n+"      },"+n+"    },"+n+"  },"+n+"};";
}
