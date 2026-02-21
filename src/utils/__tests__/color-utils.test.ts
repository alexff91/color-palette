import { describe, it, expect } from 'vitest';
import {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, hslToHex, hexToHsl,
  generateComplementary, generateAnalogous, generateTriadic,
  generatePalette, contrastRatio, relativeLuminance,
  exportAsCssVariables, exportAsTailwindConfig,
} from '../color-utils';

describe('hexToRgb', () => {
  it('converts black', () => { expect(hexToRgb('#000000')).toEqual({r:0,g:0,b:0}); });
  it('converts white', () => { expect(hexToRgb('#ffffff')).toEqual({r:255,g:255,b:255}); });
  it('converts red', () => { expect(hexToRgb('#ff0000')).toEqual({r:255,g:0,b:0}); });
  it('handles without hash', () => { expect(hexToRgb('00ff00')).toEqual({r:0,g:255,b:0}); });
});

describe('rgbToHex', () => {
  it('converts black', () => { expect(rgbToHex({r:0,g:0,b:0})).toBe('#000000'); });
  it('converts white', () => { expect(rgbToHex({r:255,g:255,b:255})).toBe('#ffffff'); });
  it('converts blue', () => { expect(rgbToHex({r:0,g:0,b:255})).toBe('#0000ff'); });
  it('clamps values', () => { expect(rgbToHex({r:300,g:-10,b:128})).toBe('#ff0080'); });
});

describe('rgbToHsl', () => {
  it('converts red', () => {
    const hsl = rgbToHsl({r:255,g:0,b:0});
    expect(hsl.h).toBeCloseTo(0, 0);
    expect(hsl.s).toBeCloseTo(1, 1);
    expect(hsl.l).toBeCloseTo(0.5, 1);
  });
  it('converts gray', () => {
    const hsl = rgbToHsl({r:128,g:128,b:128});
    expect(hsl.s).toBe(0);
  });
  it('converts green', () => {
    const hsl = rgbToHsl({r:0,g:255,b:0});
    expect(hsl.h).toBeCloseTo(120, 0);
  });
});

describe('hslToRgb', () => {
  it('converts red HSL', () => {
    const rgb = hslToRgb({h:0,s:1,l:0.5});
    expect(rgb.r).toBe(255); expect(rgb.g).toBe(0); expect(rgb.b).toBe(0);
  });
  it('converts gray', () => {
    const rgb = hslToRgb({h:0,s:0,l:0.5});
    expect(rgb.r).toBe(128); expect(rgb.g).toBe(128); expect(rgb.b).toBe(128);
  });
});

describe('roundtrip', () => {
  it('hslToHex red', () => { expect(hslToHex({h:0,s:1,l:0.5})).toBe('#ff0000'); });
  it('hexToHsl roundtrip', () => {
    const hsl = hexToHsl('#3366cc'); expect(hslToHex(hsl)).toBe('#3366cc');
  });
});

describe('harmony generators', () => {
  it('complementary has 5 hues with opposite', () => {
    const hues = generateComplementary(0);
    expect(hues).toHaveLength(5); expect(hues).toContain(180);
  });
  it('analogous has 5 close hues', () => {
    const hues = generateAnalogous(180);
    expect(hues).toHaveLength(5);
    hues.forEach(h => { const d=Math.abs(h-180); expect(d<=40||d>=320).toBe(true); });
  });
  it('triadic has 120-degree intervals', () => {
    const hues = generateTriadic(0);
    expect(hues).toHaveLength(5); expect(hues).toContain(120); expect(hues).toContain(240);
  });
});

describe('generatePalette', () => {
  it('returns 5 hex colors', () => {
    const p = generatePalette('complementary', 0);
    expect(p).toHaveLength(5);
    p.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}/));
  });
  it('random returns 5', () => {
    expect(generatePalette('random')).toHaveLength(5);
  });
});

describe('contrastRatio', () => {
  it('black vs white is 21', () => {
    expect(contrastRatio('#000000','#ffffff')).toBeCloseTo(21,0);
  });
  it('same color is 1', () => {
    expect(contrastRatio('#ff0000','#ff0000')).toBeCloseTo(1,0);
  });
  it('is >= 1', () => {
    expect(contrastRatio('#336699','#996633')).toBeGreaterThanOrEqual(1);
  });
});

describe('relativeLuminance', () => {
  it('black is 0', () => { expect(relativeLuminance({r:0,g:0,b:0})).toBe(0); });
  it('white is 1', () => { expect(relativeLuminance({r:255,g:255,b:255})).toBeCloseTo(1,2); });
});

describe('exports', () => {
  it('CSS variables', () => {
    const css = exportAsCssVariables(['#ff0000','#00ff00']);
    expect(css).toContain(':root'); expect(css).toContain('--color-1: #ff0000');
  });
  it('Tailwind config', () => {
    const tw = exportAsTailwindConfig(['#ff0000']);
    expect(tw).toContain('#ff0000'); expect(tw).toContain('module.exports');
  });
});
