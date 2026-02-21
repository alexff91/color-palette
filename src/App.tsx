import { useState, useEffect, useCallback } from 'react';
import {
  generatePalette, contrastRatio, hexToHsl, hslToHex,
  exportAsCssVariables, exportAsTailwindConfig, type HarmonyMode,
} from './utils/color-utils';

interface PaletteColor { hex: string; locked: boolean; }

function App() {
  const [colors, setColors] = useState<PaletteColor[]>([]);
  const [mode, setMode] = useState<HarmonyMode>('complementary');
  const [copied, setCopied] = useState<string | null>(null);
  const [xm, setXm] = useState<'css' | 'tailwind'>('css');

  const gen = useCallback(() => {
    const np = generatePalette(mode);
    setColors(prev => {
      if (!prev.length) return np.map(hex => ({ hex, locked: false }));
      return prev.map((c, i) => c.locked ? c : { hex: np[i], locked: false });
    });
  }, [mode]);

  useEffect(() => { gen(); }, [gen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); gen(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [gen]);

  const lock = (i: number) => setColors(p => p.map((c, j) => j === i ? { ...c, locked: !c.locked } : c));

  const cp = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(null), 1500); }
    catch { /* noop */ }
  };

  const tc = (bg: string) => contrastRatio(bg, '#ffffff') >= 4.5 ? '#ffffff' : '#000000';
  const exp = () => { const h = colors.map(c => c.hex); return xm === 'css' ? exportAsCssVariables(h) : exportAsTailwindConfig(h); };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 p-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Color Palette Generator</h1>
          <div className="flex items-center gap-4">
            <select value={mode} onChange={e => setMode(e.target.value as HarmonyMode)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              <option value="complementary">Complementary</option>
              <option value="analogous">Analogous</option>
              <option value="triadic">Triadic</option>
              <option value="random">Random</option>
            </select>
            <button onClick={gen} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium">Generate</button>
          </div>
        </div>
      </header>
      <div className="flex flex-col md:flex-row" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {colors.map((color, i) => {
          const txtC = tc(color.hex); const hsl = hexToHsl(color.hex);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-center p-6 cursor-pointer relative group"
              style={{ backgroundColor: color.hex, color: txtC, minHeight: '200px' }} onClick={() => cp(color.hex)}>
              <button onClick={e => { e.stopPropagation(); lock(i); }} className="absolute top-4 right-4 text-2xl opacity-60 hover:opacity-100">
                {color.locked ? '\ud83d\udd12' : '\ud83d\udd13'}
              </button>
              <span className="text-3xl font-bold font-mono mb-2">{color.hex}</span>
              {copied === color.hex && <span className="text-sm font-medium opacity-80">Copied!</span>}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity w-full max-w-[200px] space-y-2">
                <label className="text-xs block">H: {Math.round(hsl.h)}<input type="range" min="0" max="360" value={Math.round(hsl.h)} onClick={e => e.stopPropagation()} onChange={e => setColors(p => p.map((c, j) => j === i ? { ...c, hex: hslToHex({...hsl, h: Number(e.target.value)}) } : c))} className="w-full" /></label>
                <label className="text-xs block">S: {Math.round(hsl.s*100)}%<input type="range" min="0" max="100" value={Math.round(hsl.s*100)} onClick={e => e.stopPropagation()} onChange={e => setColors(p => p.map((c, j) => j === i ? { ...c, hex: hslToHex({...hsl, s: Number(e.target.value)/100}) } : c))} className="w-full" /></label>
                <label className="text-xs block">L: {Math.round(hsl.l*100)}%<input type="range" min="0" max="100" value={Math.round(hsl.l*100)} onClick={e => e.stopPropagation()} onChange={e => setColors(p => p.map((c, j) => j === i ? { ...c, hex: hslToHex({...hsl, l: Number(e.target.value)/100}) } : c))} className="w-full" /></label>
              </div>
            </div>);
        })}
      </div>
      <footer className="border-t border-gray-800 p-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm text-gray-400">Export as:</span>
            <button onClick={() => setXm('css')} className={`px-3 py-1 rounded text-sm ${xm === "css" ? "bg-purple-600" : "bg-gray-800"}`}>CSS Variables</button>
            <button onClick={() => setXm('tailwind')} className={`px-3 py-1 rounded text-sm ${xm === "tailwind" ? "bg-purple-600" : "bg-gray-800"}`}>Tailwind Config</button>
            <button onClick={() => cp(exp())} className="ml-auto bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm">Copy</button>
          </div>
          <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">{exp()}</pre>
          <p className="text-center text-gray-600 text-xs mt-3">Press <kbd className="bg-gray-800 px-1.5 py-0.5 rounded">Space</kbd> for new palette</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
