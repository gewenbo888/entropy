"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangContext";

/**
 * AIUniverse — "AI and digital entropy."
 *
 * A self-evolving, AI-generated universe rendered as a field of glowing glyphs on
 * a grid. The engine is a Game-of-Life-like cellular automaton whose live cells
 * surface as bright symbols (digits, math operators, CJK, binary, brackets) and
 * whose dead cells fade to the void. Order continuously self-organizes out of
 * noise and decays back into it: when the population stagnates or dies, the field
 * re-seeds itself, so the screen never freezes into a static state — it keeps
 * manufacturing novelty forever.
 *
 * Three live readings are surfaced:
 *   • Generation — the tick counter, always climbing.
 *   • Order index — fraction of structured (alive) cells, smoothed.
 *   • Entropy/Novelty — a disorder proxy from per-tick churn (births + deaths).
 *
 * Periodic GLITCH events tear a horizontal band — rows shift, colors invert,
 * glyphs scramble — to evoke hallucination and the collapse of meaning.
 *
 * Pure Canvas 2D. No three.js. All mutable simulation state lives in refs; React
 * state holds only the three small displayed numbers, updated every few frames to
 * avoid re-render storms.
 */

/** Mixed glyph alphabet: digits, math symbols, CJK (熵/序/混/沌), binary, brackets. */
const GLYPHS: readonly string[] = [
  "0",
  "1",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "∑",
  "∏",
  "∂",
  "∞",
  "≈",
  "≠",
  "≡",
  "∇",
  "⊕",
  "λ",
  "熵",
  "序",
  "混",
  "沌",
  "{",
  "}",
  "[",
  "]",
  "<",
  ">",
];

/** A cell's hue family. Picked at birth; ember is reserved for mutating cells. */
type HueKind = 0 | 1 | 2; // 0 electric, 1 plasma, 2 gold

interface PaletteRGB {
  r: number;
  g: number;
  b: number;
}

const HUES: readonly PaletteRGB[] = [
  { r: 56, g: 189, b: 248 }, // electric  #38bdf8
  { r: 168, g: 85, b: 247 }, // plasma    #a855f7
  { r: 232, g: 195, b: 114 }, // gold     #e8c372
];
const EMBER: PaletteRGB = { r: 255, g: 77, b: 109 }; // #ff4d6d

/** A transient glitch band tearing across the field. */
interface Glitch {
  /** top row of the torn band */
  row: number;
  /** band height in rows */
  height: number;
  /** horizontal pixel shift applied to the band */
  shift: number;
  /** frames remaining */
  life: number;
  /** invert colors within the band */
  invert: boolean;
}

const MAX_COLS = 90;
const MAX_ROWS = 50;
const CELL_PX = 16; // target logical px per cell
/** Frames between simulation ticks (visual cadence; rAF is ~60fps). */
const TICK_EVERY = 3;
/** Throttle React state updates to roughly every 6 frames. */
const READOUT_EVERY = 6;

export default function AIUniverse() {
  const { lang } = useLang();
  const en = lang === "en";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ---- displayed numbers (React state, throttled) ----
  const [generation, setGeneration] = useState(0);
  const [orderPct, setOrderPct] = useState(0);
  const [entropyPct, setEntropyPct] = useState(0);

  // ---- simulation state (refs; never trigger re-render) ----
  const colsRef = useRef(0);
  const rowsRef = useRef(0);
  /** current alive grid (0/1) */
  const gridRef = useRef<Uint8Array>(new Uint8Array(0));
  /** scratch grid for the next generation */
  const nextRef = useRef<Uint8Array>(new Uint8Array(0));
  /** how many ticks each cell has been continuously alive (clamped) */
  const ageRef = useRef<Uint8Array>(new Uint8Array(0));
  /** stable glyph index per cell */
  const glyphRef = useRef<Uint8Array>(new Uint8Array(0));
  /** hue family per cell */
  const hueRef = useRef<Uint8Array>(new Uint8Array(0));
  /** cells that mutated this tick (born or died) → flash ember */
  const mutRef = useRef<Uint8Array>(new Uint8Array(0));

  const genRef = useRef(0);
  const orderRef = useRef(0); // smoothed 0..1
  const entropyRef = useRef(0); // smoothed 0..1
  /** rolling window of recent live-fractions to detect stagnation */
  const historyRef = useRef<number[]>([]);
  /** ticks since the field last changed meaningfully */
  const staleRef = useRef(0);

  const glitchRef = useRef<Glitch[]>([]);
  const glitchCooldownRef = useRef(120);

  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const reduceRef = useRef(false);
  const tickAccumRef = useRef(0);
  const frameRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Grid helpers.
  // ---------------------------------------------------------------------------
  const idx = (c: number, r: number) => r * colsRef.current + c;

  /** (Re)allocate all per-cell arrays for the current grid dimensions. */
  const allocate = (cols: number, rows: number) => {
    const n = cols * rows;
    colsRef.current = cols;
    rowsRef.current = rows;
    gridRef.current = new Uint8Array(n);
    nextRef.current = new Uint8Array(n);
    ageRef.current = new Uint8Array(n);
    glyphRef.current = new Uint8Array(n);
    hueRef.current = new Uint8Array(n);
    mutRef.current = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      glyphRef.current[i] = Math.floor(Math.random() * GLYPHS.length);
      hueRef.current[i] = Math.floor(Math.random() * HUES.length) as HueKind;
    }
  };

  /** Seed the field with random soup biased toward a few dense clusters. */
  const seed = (density: number) => {
    const cols = colsRef.current;
    const rows = rowsRef.current;
    const grid = gridRef.current;
    const age = ageRef.current;
    grid.fill(0);
    age.fill(0);
    // base noise
    for (let i = 0; i < grid.length; i++) {
      if (Math.random() < density * 0.4) grid[i] = 1;
    }
    // a handful of dense seed clusters ("models" crystallizing)
    const clusters = 3 + Math.floor(Math.random() * 4);
    for (let k = 0; k < clusters; k++) {
      const cx = Math.floor(Math.random() * cols);
      const cy = Math.floor(Math.random() * rows);
      const rad = 3 + Math.floor(Math.random() * 5);
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          if (dx * dx + dy * dy > rad * rad) continue;
          if (Math.random() < density) grid[idx(x, y)] = 1;
        }
      }
    }
    staleRef.current = 0;
    historyRef.current = [];
  };

  /** Inject a burst of ordered seeds (small live clusters): the "Generate" action. */
  const injectOrder = () => {
    const cols = colsRef.current;
    const rows = rowsRef.current;
    if (!cols || !rows) return;
    const grid = gridRef.current;
    const bursts = 5;
    for (let k = 0; k < bursts; k++) {
      const cx = 2 + Math.floor(Math.random() * (cols - 4));
      const cy = 2 + Math.floor(Math.random() * (rows - 4));
      // a glider-ish / blob seed that tends to grow before it decays
      const rad = 2 + Math.floor(Math.random() * 3);
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          if (Math.random() < 0.55) {
            grid[idx(x, y)] = 1;
            mutRef.current[idx(x, y)] = 6;
          }
        }
      }
    }
    staleRef.current = 0;
    if (reduceRef.current) drawStatic();
  };

  /** Inject noise / tear structure apart: the "Collapse" action. */
  const injectNoise = () => {
    const grid = gridRef.current;
    if (!grid.length) return;
    for (let i = 0; i < grid.length; i++) {
      const roll = Math.random();
      if (roll < 0.22) {
        grid[i] = grid[i] ? 0 : 1; // flip
        mutRef.current[i] = 6;
      }
    }
    // also fire a glitch band for drama
    spawnGlitch();
    staleRef.current = 0;
    if (reduceRef.current) drawStatic();
  };

  const resetField = () => {
    genRef.current = 0;
    orderRef.current = 0;
    entropyRef.current = 0;
    glitchRef.current = [];
    glitchCooldownRef.current = 120;
    mutRef.current.fill(0);
    seed(0.18);
    pushReadout();
    if (reduceRef.current) drawStatic();
  };

  // ---------------------------------------------------------------------------
  // Glitch events.
  // ---------------------------------------------------------------------------
  const spawnGlitch = () => {
    const rows = rowsRef.current;
    if (rows < 4) return;
    const height = 2 + Math.floor(Math.random() * Math.min(6, rows - 2));
    const row = Math.floor(Math.random() * (rows - height));
    const shift = (Math.random() - 0.5) * CELL_PX * 4;
    glitchRef.current.push({
      row,
      height,
      shift,
      life: 5 + Math.floor(Math.random() * 8),
      invert: Math.random() < 0.5,
    });
    // scramble glyphs inside the torn band so meaning visibly dissolves
    const cols = colsRef.current;
    const glyph = glyphRef.current;
    for (let r = row; r < row + height; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.6) {
          glyph[idx(c, r)] = Math.floor(Math.random() * GLYPHS.length);
        }
      }
    }
  };

  // ---------------------------------------------------------------------------
  // One automaton step (B36/S23 — a "HighLife"-ish rule that keeps producing
  // gliders and replicators, so structure never settles permanently).
  // ---------------------------------------------------------------------------
  const step = () => {
    const cols = colsRef.current;
    const rows = rowsRef.current;
    const grid = gridRef.current;
    const next = nextRef.current;
    const age = ageRef.current;
    const mut = mutRef.current;
    const glyph = glyphRef.current;
    const hue = hueRef.current;

    let alive = 0;
    let churn = 0; // births + deaths this tick

    // decay last tick's mutation flashes
    for (let i = 0; i < mut.length; i++) if (mut[i] > 0) mut[i]--;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // toroidal neighbourhood so patterns wrap rather than die at edges
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (c + dx + cols) % cols;
            const ny = (r + dy + rows) % rows;
            n += grid[ny * cols + nx];
          }
        }
        const i = r * cols + c;
        const was = grid[i];
        // HighLife: born on 3 or 6, survive on 2 or 3
        let now: number;
        if (was) now = n === 2 || n === 3 ? 1 : 0;
        else now = n === 3 || n === 6 ? 1 : 0;

        next[i] = now;
        if (now) {
          alive++;
          age[i] = age[i] < 250 ? age[i] + 1 : 250;
        } else {
          age[i] = 0;
        }
        if (now !== was) {
          churn++;
          mut[i] = 6; // flash ember for a few frames
          if (now) {
            // a freshly born cell adopts a fresh glyph + hue
            glyph[i] = Math.floor(Math.random() * GLYPHS.length);
            hue[i] = Math.floor(Math.random() * HUES.length);
          }
        } else if (now && Math.random() < 0.012) {
          // rare spontaneous mutation of a stable cell's glyph (informational noise)
          glyph[i] = Math.floor(Math.random() * GLYPHS.length);
          mut[i] = 5;
        }
      }
    }

    // swap grids
    const tmp = gridRef.current;
    gridRef.current = nextRef.current;
    nextRef.current = tmp;

    genRef.current++;

    const total = cols * rows || 1;
    const liveFrac = alive / total;
    const churnFrac = churn / total;

    // Order index: smoothed live fraction, stretched so a healthy field reads high.
    const orderTarget = Math.min(1, liveFrac * 3.2);
    orderRef.current += (orderTarget - orderRef.current) * 0.18;
    // Entropy/novelty: smoothed churn, the rate at which meaning is rewritten.
    const entTarget = Math.min(1, churnFrac * 6.0);
    entropyRef.current += (entTarget - entropyRef.current) * 0.18;

    // ---- stagnation / death detection → re-seed so it never freezes ----
    const hist = historyRef.current;
    hist.push(liveFrac);
    if (hist.length > 24) hist.shift();
    let stale = false;
    if (liveFrac < 0.012) {
      // field essentially died out
      stale = true;
    } else if (hist.length >= 24) {
      // variance over the window is tiny → a still life / oscillator lock-in
      let mean = 0;
      for (let k = 0; k < hist.length; k++) mean += hist[k];
      mean /= hist.length;
      let varSum = 0;
      for (let k = 0; k < hist.length; k++) {
        const d = hist[k] - mean;
        varSum += d * d;
      }
      if (varSum / hist.length < 1e-5) stale = true;
    }
    if (stale) {
      staleRef.current++;
      if (staleRef.current > 6) {
        // dissolve back into noise, then let order re-emerge
        seed(0.16);
        spawnGlitch();
        staleRef.current = 0;
      }
    } else {
      staleRef.current = 0;
    }

    // ---- schedule periodic glitch hallucinations ----
    glitchCooldownRef.current--;
    if (glitchCooldownRef.current <= 0) {
      spawnGlitch();
      glitchCooldownRef.current = 90 + Math.floor(Math.random() * 150);
    }
  };

  const pushReadout = () => {
    setGeneration(genRef.current);
    setOrderPct(Math.round(orderRef.current * 100));
    setEntropyPct(Math.round(entropyRef.current * 100));
  };

  // ---------------------------------------------------------------------------
  // Rendering.
  // ---------------------------------------------------------------------------
  const draw = (ctx: CanvasRenderingContext2D) => {
    const { w, h, dpr } = sizeRef.current;
    const cols = colsRef.current;
    const rows = rowsRef.current;
    if (!cols || !rows) return;

    const grid = gridRef.current;
    const age = ageRef.current;
    const glyph = glyphRef.current;
    const hue = hueRef.current;
    const mut = mutRef.current;

    const cw = w / cols;
    const chh = h / rows;
    const fontPx = Math.min(cw, chh) * 0.92;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background near-black with a faint trailing fade for a data-rain feel
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(3, 3, 10, 0.34)";
    ctx.fillRect(0, 0, w, h);

    // faint scanlines
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(120, 140, 200, 0.035)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    ctx.font = `${fontPx.toFixed(1)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // additive glow pass for living glyphs
    ctx.globalCompositeOperation = "lighter";

    const glitches = glitchRef.current;

    for (let r = 0; r < rows; r++) {
      // find an active glitch band covering this row
      let band: Glitch | null = null;
      for (let g = 0; g < glitches.length; g++) {
        const gg = glitches[g];
        if (r >= gg.row && r < gg.row + gg.height) {
          band = gg;
          break;
        }
      }
      const shiftX = band ? band.shift : 0;

      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const alive = grid[i];
        const m = mut[i];
        if (!alive && m === 0) continue; // void cell — skip for speed

        const x = c * cw + cw / 2 + shiftX;
        const y = r * chh + chh / 2;
        const ch = GLYPHS[glyph[i]];

        let col: PaletteRGB;
        let a: number;
        if (m > 0) {
          // mutating / novelty cell flashes ember
          col = EMBER;
          a = 0.55 + (m / 6) * 0.45;
        } else {
          col = HUES[hue[i]];
          // brighter the longer it has survived (crystallized order glows)
          const ageN = Math.min(1, age[i] / 18);
          a = 0.28 + ageN * 0.6;
        }

        if (band && band.invert) {
          col = { r: 255 - col.r, g: 255 - col.g, b: 255 - col.b };
        }

        // cheap layered glow: a soft wide stamp + a crisp core (no per-cell shadowBlur)
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${(a * 0.22).toFixed(3)})`;
        ctx.font = `${(fontPx * 1.35).toFixed(1)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillText(ch, x, y);

        ctx.font = `${fontPx.toFixed(1)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${a.toFixed(3)})`;
        ctx.fillText(ch, x, y);
      }
    }

    ctx.globalCompositeOperation = "source-over";
  };

  /** Render a representative static frame (reduced-motion / paused). */
  const drawStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#03030a";
    ctx.fillRect(0, 0, w, h);
    draw(ctx);
  };

  // ---------------------------------------------------------------------------
  // Sizing — cap DPR at 2, size to container, recompute grid on resize.
  // ---------------------------------------------------------------------------
  const resize = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    sizeRef.current = { w, h, dpr };

    const cols = Math.max(20, Math.min(MAX_COLS, Math.floor(w / CELL_PX)));
    const rows = Math.max(12, Math.min(MAX_ROWS, Math.floor(h / CELL_PX)));
    if (cols !== colsRef.current || rows !== rowsRef.current) {
      allocate(cols, rows);
      seed(0.18);
    }
    if (reduceRef.current) drawStatic();
  };

  // ---------------------------------------------------------------------------
  // Lifecycle.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    reduceRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    // click anywhere on the field injects a burst of ordered seeds
    const onClick = () => {
      injectOrder();
      if (reduceRef.current) drawStatic();
    };
    canvas.addEventListener("click", onClick);

    let raf = 0;

    if (reduceRef.current) {
      // run a few evolution steps then settle on a representative static frame
      for (let k = 0; k < 14; k++) step();
      pushReadout();
      drawStatic();
    } else {
      const tick = () => {
        tickAccumRef.current++;
        if (tickAccumRef.current >= TICK_EVERY) {
          tickAccumRef.current = 0;
          step();
        }
        // age out glitch bands every frame
        const gl = glitchRef.current;
        for (let g = gl.length - 1; g >= 0; g--) {
          gl[g].life--;
          if (gl[g].life <= 0) gl.splice(g, 1);
        }

        draw(ctx);

        frameRef.current++;
        if (frameRef.current >= READOUT_EVERY) {
          frameRef.current = 0;
          pushReadout();
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In reduced-motion mode, let buttons step the field once so they still respond.
  const reducedStep = () => {
    if (!reduceRef.current) return;
    step();
    pushReadout();
    drawStatic();
  };

  // ---------------------------------------------------------------------------
  // UI.
  // ---------------------------------------------------------------------------
  const btn =
    "border border-plasma/30 rounded-full px-4 py-2 text-sm hover:border-plasma transition select-none";

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        className="glass halo rounded-xl overflow-hidden relative"
        style={{ height: "min(460px, 64vw)", minHeight: 320 }}
      >
        <canvas ref={canvasRef} className="block w-full h-full cursor-pointer" />
        <div className="pointer-events-none absolute left-3 top-3">
          <p className={`eyebrow ${en ? "" : "font-han"}`}>
            {en ? "Self-evolving universe" : "自演化宇宙"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${btn} border-electric/50 text-electric`}
          onClick={() => {
            injectOrder();
            reducedStep();
          }}
        >
          <span className={en ? "" : "font-han"}>{en ? "Generate" : "生成"}</span>
        </button>
        <button
          type="button"
          className={`${btn} border-ember/50 text-ember`}
          onClick={() => {
            injectNoise();
            reducedStep();
          }}
        >
          <span className={en ? "" : "font-han"}>{en ? "Collapse" : "坍缩"}</span>
        </button>
        <button type="button" className={btn} onClick={resetField}>
          <span className={en ? "" : "font-han"}>{en ? "Reset" : "重置"}</span>
        </button>
        <span className={`text-boneFaint text-xs ml-1 ${en ? "" : "font-han"}`}>
          {en ? "Click the field to seed order" : "点击画面注入秩序"}
        </span>
      </div>

      {/* Live readout */}
      <div className="glass rounded-xl mt-4 p-5 grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
        <div>
          <p className={`text-boneFaint text-xs uppercase tracking-wide ${en ? "" : "font-han"}`}>
            {en ? "Generation" : "世代"}
          </p>
          <p className="font-mono text-bone text-2xl mt-1">
            {generation.toLocaleString("en-US")}
          </p>
        </div>

        <div>
          <p className={`text-boneFaint text-xs uppercase tracking-wide ${en ? "" : "font-han"}`}>
            {en ? "Order index" : "秩序"}
          </p>
          <p className="font-mono text-electric text-2xl mt-1">
            {orderPct}
            <span className="text-boneDim text-base">%</span>
          </p>
          <div className="h-1.5 w-full rounded-full bg-bone/10 overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-electric transition-[width] duration-200"
              style={{ width: `${orderPct}%` }}
            />
          </div>
        </div>

        <div className="sm:text-right">
          <p className={`text-boneFaint text-xs uppercase tracking-wide ${en ? "" : "font-han"}`}>
            {en ? "Entropy / Novelty" : "熵 / 新异"}
          </p>
          <p className="font-mono text-ember text-3xl sm:text-4xl mt-1 leading-none">
            {entropyPct}
            <span className="text-boneDim text-base">%</span>
          </p>
          <div className="h-1.5 w-full rounded-full bg-bone/10 overflow-hidden mt-2">
            <div
              className="h-full rounded-full bg-ember transition-[width] duration-200 ml-auto"
              style={{ width: `${entropyPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className={`text-boneDim text-sm mt-4 leading-relaxed ${en ? "" : "font-han"}`}>
        {en
          ? "Artificial minds manufacture order from data — patterns crystallize, glow, and dissolve back into noise. Every generation pours fresh structure and infinite informational chaos into the same field at once."
          : "人工智能从数据中制造秩序——图案凝结、发光，又重新溶解为噪声。每一个世代都同时向同一片场域注入崭新的结构与无尽的信息混沌。"}
      </p>
    </div>
  );
}
