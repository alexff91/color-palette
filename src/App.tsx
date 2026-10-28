import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  generatePalette, contrastRatio, hexToHsl, hslToHex, relativeLuminance, hexToRgb,
  exportAsCssVariables, exportAsTailwindConfig, type HarmonyMode,
} from './utils/color-utils';

interface PaletteColor { hex: string; locked: boolean; }
const MODES: HarmonyMode[] = ['complementary', 'analogous', 'triadic', 'random'];
// A fixed first palette, so the page opens on something worth looking at
// instead of a random draw that may be mud. Generate draws a new one.
const FIRST = ['#0b1622', '#1d4f91', '#3e8acc', '#f2b84b', '#f4f1ea'];

const lum = (hex: string) => relativeLuminance(hexToRgb(hex));
const grade = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'fails');

function App() {
  const [colors, setColors] = useState<PaletteColor[]>(FIRST.map(hex => ({ hex, locked: false })));
  const [mode, setMode] = useState<HarmonyMode>('complementary');
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [xm, setXm] = useState<'css' | 'tailwind'>('css');

  const gen = useCallback((m: HarmonyMode = mode) => {
    const np = generatePalette(m);
    setColors(prev => prev.map((c, i) => (c.locked ? c : { hex: np[i], locked: false })));
  }, [mode]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); gen(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [gen]);

  const lock = (i: number) => setColors(p => p.map((c, j) => (j === i ? { ...c, locked: !c.locked } : c)));
  const setHsl = (i: number, part: 'h' | 's' | 'l', v: number) =>
    setColors(p => p.map((c, j) => { if (j !== i) return c; const hsl = hexToHsl(c.hex); return { ...c, hex: hslToHex({ ...hsl, [part]: v }) }; }));
  const cp = async (t: string) => { try { await navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(null), 1400); } catch { /* noop */ } };
  const hexes = colors.map(c => c.hex);
  const exp = xm === 'css' ? exportAsCssVariables(hexes) : exportAsTailwindConfig(hexes);
  const txt = (bg: string) => (contrastRatio(bg, '#ffffff') >= 4.5 ? '#ffffff' : '#0b1622');

  // The palette in use: the lightest colour as the page, the darkest as text,
  // the most saturated of the rest as the button — and what that does to
  // readability, which is what decides whether a palette is usable at all.
  const use = useMemo(() => {
    const byL = [...hexes].sort((a, b) => lum(a) - lum(b));
    const ground = byL[byL.length - 1], ink = byL[0];
    const rest = hexes.filter(h => h !== ground && h !== ink);
    const accent = rest.sort((a, b) => hexToHsl(b).s - hexToHsl(a).s)[0] || ink;
    return { ground, ink, accent, onAccent: txt(accent), r1: contrastRatio(ground, ink), r2: contrastRatio(accent, txt(accent)), r3: contrastRatio(ground, accent) };
  }, [hexes]);

  const a = colors[active], ahsl = hexToHsl(a.hex);

  return (
    <div className="wb">
      <header className="wb-top">
        <a className="wb-brand" href="https://alftech.space/"><i />ALFTECH</a>
        <nav><a href="https://json.alftech.space/">json</a><a href="https://readme.alftech.space/">readme</a></nav>
      </header>
      <main className="wb-main">
        <div className="wb-eyebrow">Palette · runs in your browser</div>
        <h1 className="wb-h1">Five colours that <em>read</em> well together.</h1>
        <p className="wb-lede">Draw a harmony, lock the colours you like and redraw the rest. Below, the same five laid out as a page — with the contrast numbers that decide whether anyone can read it.</p>

        <div className="wb-row" style={{ marginBottom: 14 }}>
          {MODES.map(m => <button key={m} className="wb-chip" style={{ color: 'var(--ink)', opacity: mode === m ? 1 : .6 }} aria-pressed={mode === m} onClick={() => { setMode(m); gen(m); }}>{m}</button>)}
          <button className="wb-btn" onClick={() => gen()}>New palette ↻</button>
          <span className="wb-mono" style={{ fontSize: 12, color: 'var(--soft)' }}>or press Space</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {colors.map((c, i) => {
            const hsl = hexToHsl(c.hex);
            return (
              <div key={i} onClick={() => setActive(i)} style={{ background: '#fff', border: `1px solid ${active === i ? 'var(--ink)' : 'var(--line)'}`, boxShadow: active === i ? '0 0 0 1px var(--ink)' : 'none', cursor: 'pointer' }}>
                <div style={{ background: c.hex, height: 120, position: 'relative' }}>
                  <button onClick={e => { e.stopPropagation(); lock(i); }} aria-pressed={c.locked} aria-label={c.locked ? 'Unlock this colour' : 'Lock this colour'}
                    style={{ position: 'absolute', top: 8, right: 8, minWidth: 44, minHeight: 32, border: `1px solid ${txt(c.hex)}`, background: c.locked ? txt(c.hex) : 'transparent', color: c.locked ? c.hex : txt(c.hex), font: '11px var(--mono)', cursor: 'pointer' }}>
                    {c.locked ? 'locked' : 'lock'}
                  </button>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <button onClick={e => { e.stopPropagation(); cp(c.hex); }} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: '500 18px var(--mono)', color: 'var(--ink)' }} title="Copy">{copied === c.hex ? 'copied ✓' : c.hex}</button>
                  <div className="wb-mono" style={{ fontSize: 11, color: 'var(--soft)', marginTop: 2 }}>H {Math.round(hsl.h)} · S {Math.round(hsl.s * 100)} · L {Math.round(hsl.l * 100)}</div>
                </div>
              </div>);
          })}
        </div>

        <section className="wb-sheet" style={{ marginTop: 12, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="wb-label" style={{ gridColumn: '1 / -1', margin: 0 }}>Adjust colour {active + 1} — {a.hex}</div>
          {(['h', 's', 'l'] as const).map(part => (
            <label key={part} className="wb-mono" style={{ fontSize: 12, color: 'var(--soft)' }}>
              {part === 'h' ? `hue ${Math.round(ahsl.h)}°` : part === 's' ? `saturation ${Math.round(ahsl.s * 100)}%` : `lightness ${Math.round(ahsl.l * 100)}%`}
              <input type="range" style={{ width: '100%', accentColor: a.hex }} min={0} max={part === 'h' ? 360 : 100}
                value={part === 'h' ? Math.round(ahsl.h) : Math.round(ahsl[part] * 100)}
                onChange={e => setHsl(active, part, part === 'h' ? Number(e.target.value) : Number(e.target.value) / 100)} />
            </label>))}
        </section>

        <div className="wb-grid2" style={{ marginTop: 28 }}>
          <section>
            <h2 className="wb-h2">The palette in use</h2>
            <div style={{ background: use.ground, color: use.ink, padding: '26px 24px', border: '1px solid var(--line)' }}>
              <div style={{ font: '11px var(--mono)', letterSpacing: '.08em', textTransform: 'uppercase', opacity: .7 }}>Sample page</div>
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.04em', lineHeight: 1.05, margin: '8px 0 10px' }}>A headline set in your darkest colour.</div>
              <p style={{ margin: '0 0 16px', fontSize: 15 }}>Body text on the lightest one. If this is hard to read here, it will be hard to read on the real page too.</p>
              <span style={{ display: 'inline-block', background: use.accent, color: use.onAccent, padding: '12px 18px', font: '12px var(--mono)' }}>Accent button</span>
            </div>
            <div className="wb-list" style={{ marginTop: 12 }}>
              {[['Text on page', use.r1], ['Button label', use.r2], ['Button on page', use.r3]].map(([k, r]) => (
                <div key={k as string} className="wb-row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>{k}</span>
                  <span className="wb-mono" style={{ fontSize: 13 }}>{(r as number).toFixed(2)} : 1 <span className="wb-tag" style={{ marginLeft: 8, ...(grade(r as number) === 'fails' ? { background: 'var(--bad)', color: '#fff' } : {}) }}>{grade(r as number)}</span></span>
                </div>))}
            </div>
          </section>
          <section>
            <div className="wb-row" style={{ marginBottom: 10 }}>
              <button className="wb-chip" style={{ color: 'var(--ink)', opacity: xm === 'css' ? 1 : .6 }} aria-pressed={xm === 'css'} onClick={() => setXm('css')}>CSS variables</button>
              <button className="wb-chip" style={{ color: 'var(--ink)', opacity: xm === 'tailwind' ? 1 : .6 }} aria-pressed={xm === 'tailwind'} onClick={() => setXm('tailwind')}>Tailwind config</button>
            </div>
            <pre className="wb-slab wb-mono" style={{ margin: 0, fontSize: 13, lineHeight: 1.6, overflowX: 'auto' }}>{exp}</pre>
            <button className="wb-btn acc" style={{ marginTop: 10 }} onClick={() => cp(exp)}>{copied === exp ? 'Copied ✓' : 'Copy'}</button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
