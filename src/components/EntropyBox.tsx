"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "./LangContext";

/**
 * EntropyBox — an interactive "order → chaos" particle box that makes the
 * Second Law of Thermodynamics tangible. ~441 particles begin in a perfectly
 * ordered lattice (low entropy) packed into the left third of the box. Stir
 * them and a live Shannon-entropy meter climbs irreversibly toward equilibrium.
 *
 * Particle positions are stored in normalized 0..1 space so canvas resize is
 * trivial (we just multiply by the current pixel size at draw time). The whole
 * thing runs on a single Canvas 2D context — no WebGL, no extra deps.
 */

const GRID = 21; // 21 × 21 = 441 ordered lattice (low-entropy initial state)
const CELLS = 14; // entropy histogram resolution: 14 × 14 cells
const S_MAX = Math.log2(CELLS * CELLS); // maximum possible Shannon entropy (bits)

type Particle = {
  /** current position, normalized 0..1 */
  x: number;
  y: number;
  /** velocity, normalized units per second */
  vx: number;
  vy: number;
  /** ordered "home" position for reset */
  hx: number;
  hy: number;
};

function makeParticles(): Particle[] {
  const ps: Particle[] = [];
  // Lattice lives in the left third (x in ~0.05..0.33), full height band.
  const x0 = 0.05;
  const x1 = 0.33;
  const y0 = 0.08;
  const y1 = 0.92;
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const hx = x0 + (col / (GRID - 1)) * (x1 - x0);
      const hy = y0 + (row / (GRID - 1)) * (y1 - y0);
      ps.push({ x: hx, y: hy, vx: 0, vy: 0, hx, hy });
    }
  }
  return ps;
}

/** Shannon entropy (bits) of the particle distribution over a CELLS×CELLS grid. */
function shannonEntropy(ps: Particle[]): number {
  const counts = new Int32Array(CELLS * CELLS);
  for (let i = 0; i < ps.length; i++) {
    let cx = Math.floor(ps[i].x * CELLS);
    let cy = Math.floor(ps[i].y * CELLS);
    if (cx < 0) cx = 0;
    else if (cx >= CELLS) cx = CELLS - 1;
    if (cy < 0) cy = 0;
    else if (cy >= CELLS) cy = CELLS - 1;
    counts[cy * CELLS + cx]++;
  }
  const total = ps.length;
  let s = 0;
  for (let i = 0; i < counts.length; i++) {
    const c = counts[i];
    if (c === 0) continue;
    const p = c / total;
    s -= p * Math.log2(p);
  }
  return s;
}

/** Mean kinetic energy proxy → "temperature" readout (0..1-ish). */
function meanSpeed(ps: Particle[]): number {
  let sum = 0;
  for (let i = 0; i < ps.length; i++) {
    sum += Math.hypot(ps[i].vx, ps[i].vy);
  }
  return sum / ps.length;
}

/** Map a normalized speed to a glowing color (cool blue → hot ember/gold). */
function speedColor(speed: number): string {
  // speed roughly in 0..0.6; clamp & shape
  const t = Math.min(1, speed / 0.42);
  if (t < 0.5) {
    // electric blue (#38bdf8) → cosmic purple (#a855f7)
    const k = t / 0.5;
    const r = Math.round(56 + (168 - 56) * k);
    const g = Math.round(189 + (85 - 189) * k);
    const b = Math.round(248 + (247 - 248) * k);
    return `rgb(${r},${g},${b})`;
  }
  // cosmic purple (#a855f7) → ember/gold (#ff8a4d-ish toward #ff4d6d)
  const k = (t - 0.5) / 0.5;
  const r = Math.round(168 + (255 - 168) * k);
  const g = Math.round(85 + (138 - 85) * k);
  const b = Math.round(247 + (77 - 247) * k);
  return `rgb(${r},${g},${b})`;
}

export default function EntropyBox() {
  const { lang } = useLang();
  const t = useCallback(
    (en: string, zh: string): string => (lang === "zh" ? zh : en),
    [lang],
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>(makeParticles());
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });
  const autoRef = useRef<boolean>(false);
  const reduceRef = useRef<boolean>(false);

  // Reactive readouts.
  const [entropy, setEntropy] = useState<number>(() =>
    shannonEntropy(particlesRef.current),
  );
  const [temperature, setTemperature] = useState<number>(0);
  const [auto, setAuto] = useState<boolean>(false);

  // Keep the auto flag readable inside the rAF closure without re-subscribing.
  useEffect(() => {
    autoRef.current = auto;
  }, [auto]);

  /** Draw the current state once. */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    const ps = particlesRef.current;

    // Background: near-black with a faint radial vignette.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#05030f";
    ctx.fillRect(0, 0, w, h);
    const vignette = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.1,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.75,
    );
    vignette.addColorStop(0, "rgba(56,189,248,0.05)");
    vignette.addColorStop(1, "rgba(3,3,10,0.85)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Faint frame inset.
    ctx.strokeStyle = "rgba(111,120,163,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Particles with additive glow.
    ctx.globalCompositeOperation = "lighter";
    const dotR = Math.max(1.4, Math.min(w, h) * 0.0055);
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const px = p.x * w;
      const py = p.y * h;
      const speed = Math.hypot(p.vx, p.vy);
      const color = speedColor(speed);

      const glowR = dotR * 3.2;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      grad.addColorStop(0, color);
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Bright core.
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }, []);

  /** Advance physics by dt seconds (clamped). Returns nothing; mutates refs. */
  const step = useCallback((dt: number) => {
    const ps = particlesRef.current;
    const drag = 0.06; // gentle damping so motion stays lively but bounded
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];

      if (autoRef.current) {
        // Continuous gentle thermal agitation.
        p.vx += (Math.random() - 0.5) * 0.18 * dt;
        p.vy += (Math.random() - 0.5) * 0.18 * dt;
      }

      // Light viscous damping toward (but never reaching) rest.
      const damp = Math.max(0, 1 - drag * dt);
      p.vx *= damp;
      p.vy *= damp;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Elastic wall reflections.
      if (p.x < 0) {
        p.x = -p.x;
        p.vx = -p.vx;
      } else if (p.x > 1) {
        p.x = 2 - p.x;
        p.vx = -p.vx;
      }
      if (p.y < 0) {
        p.y = -p.y;
        p.vy = -p.vy;
      } else if (p.y > 1) {
        p.y = 2 - p.y;
        p.vy = -p.vy;
      }
    }
  }, []);

  /** Recompute and publish the entropy / temperature readouts. */
  const publishReadouts = useCallback(() => {
    const ps = particlesRef.current;
    setEntropy(shannonEntropy(ps));
    setTemperature(meanSpeed(ps));
  }, []);

  // Main effect: sizing, observer, reduced-motion, animation loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    reduceRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      sizeRef.current = { w: cssW, h: cssH };
      draw();
    };

    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    if (reduceRef.current) {
      // Reduced motion: present a single dispersed (high-entropy) static frame
      // so the visual still communicates "chaos," but skip the rAF loop.
      const ps = particlesRef.current;
      for (let i = 0; i < ps.length; i++) {
        ps[i].x = 0.04 + Math.random() * 0.92;
        ps[i].y = 0.04 + Math.random() * 0.92;
        ps[i].vx = 0;
        ps[i].vy = 0;
      }
      draw();
      publishReadouts();
      return () => {
        ro.disconnect();
      };
    }

    let readoutAccum = 0;
    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      let dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      if (dt > 0.05) dt = 0.05; // clamp big tab-switch gaps

      step(dt);
      draw();

      // Publish readouts ~10×/s to avoid thrashing React.
      readoutAccum += dt;
      if (readoutAccum >= 0.1) {
        readoutAccum = 0;
        publishReadouts();
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = 0;
      ro.disconnect();
    };
  }, [draw, step, publishReadouts]);

  // ---- Controls ----

  const injectHeat = useCallback(() => {
    const ps = particlesRef.current;
    const kick = 0.28;
    for (let i = 0; i < ps.length; i++) {
      ps[i].vx += (Math.random() - 0.5) * kick;
      ps[i].vy += (Math.random() - 0.5) * kick;
    }
    if (reduceRef.current) {
      // No loop is running: advance a chunk of time + redraw once.
      for (let i = 0; i < 30; i++) step(0.05);
      draw();
      publishReadouts();
    }
  }, [step, draw, publishReadouts]);

  const resetToOrder = useCallback(() => {
    const ps = particlesRef.current;
    for (let i = 0; i < ps.length; i++) {
      ps[i].x = ps[i].hx;
      ps[i].y = ps[i].hy;
      ps[i].vx = 0;
      ps[i].vy = 0;
    }
    setAuto(false);
    autoRef.current = false;
    draw();
    publishReadouts();
  }, [draw, publishReadouts]);

  const toggleAuto = useCallback(() => {
    setAuto((a) => !a);
  }, []);

  // ---- Derived display values ----

  const normalized = Math.max(0, Math.min(100, (entropy / S_MAX) * 100));
  const tempPct = Math.min(100, (temperature / 0.42) * 100);

  const phase =
    normalized > 85
      ? { en: "MAXIMUM ENTROPY — equilibrium", zh: "最大熵 — 平衡态", tone: "text-ember" }
      : normalized > 45
        ? { en: "DISPERSING", zh: "弥散", tone: "text-plasma" }
        : { en: "ORDERED", zh: "有序", tone: "text-electric" };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Canvas frame */}
        <div className="w-full md:max-w-[560px]">
          <div
            ref={containerRef}
            className="glass halo relative aspect-square w-full overflow-hidden rounded-xl"
          >
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
              aria-label={t(
                "Particle box visualizing entropy",
                "可视化熵的粒子箱",
              )}
            />
          </div>
        </div>

        {/* Controls + readout */}
        <div className="flex w-full flex-col gap-5 md:flex-1">
          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={injectHeat}
              className="rounded-full border border-ember/40 px-4 py-2 text-sm text-bone transition hover:border-ember hover:text-ember"
            >
              <span className={lang === "zh" ? "font-han" : undefined}>
                {t("Inject heat", "注入热量")}
              </span>
            </button>
            <button
              type="button"
              onClick={resetToOrder}
              className="rounded-full border border-electric/30 px-4 py-2 text-sm text-bone transition hover:border-electric hover:text-electric"
            >
              <span className={lang === "zh" ? "font-han" : undefined}>
                {t("Reset to order", "复位至有序")}
              </span>
            </button>
            <button
              type="button"
              onClick={toggleAuto}
              aria-pressed={auto}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                auto
                  ? "border-plasma bg-plasma/10 text-plasma"
                  : "border-plasma/30 text-bone hover:border-plasma hover:text-plasma"
              }`}
            >
              <span className={lang === "zh" ? "font-han" : undefined}>
                {auto ? t("Auto · on", "自动 · 开") : t("Auto", "自动")}
              </span>
            </button>
          </div>

          {/* Live entropy meter */}
          <div className="glass rounded-xl p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="eyebrow text-boneFaint">
                {t("Shannon entropy", "香农熵")}
              </span>
              <span
                className={`font-mono text-sm font-semibold ${phase.tone}`}
              >
                <span className={lang === "zh" ? "font-han" : undefined}>
                  {t(phase.en, phase.zh)}
                </span>
              </span>
            </div>

            {/* Meter track */}
            <div className="relative h-4 w-full overflow-hidden rounded-full border border-boneFaint/20 bg-void">
              <div
                className="h-full rounded-full transition-[width] duration-150 ease-out"
                style={{
                  width: `${normalized}%`,
                  background:
                    "linear-gradient(90deg, #38bdf8 0%, #a855f7 55%, #ff4d6d 100%)",
                  boxShadow:
                    "0 0 12px rgba(168,85,247,0.55), 0 0 20px rgba(255,77,109,0.35)",
                }}
              />
            </div>

            {/* Numeric readout */}
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-lg text-bone">
                {`S = ${entropy.toFixed(2)} bits`}
              </span>
              <span className="font-mono text-sm text-boneDim">
                {`${normalized.toFixed(1)}% · S_max = ${S_MAX.toFixed(2)}`}
              </span>
            </div>

            {/* Temperature sub-readout */}
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="eyebrow text-boneFaint">
                  {t("Temperature", "温度")}
                </span>
                <span className="font-mono text-xs text-boneDim">
                  {`${tempPct.toFixed(0)}%`}
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-void">
                <div
                  className="h-full rounded-full transition-[width] duration-150 ease-out"
                  style={{
                    width: `${tempPct}%`,
                    background:
                      "linear-gradient(90deg, #38bdf8 0%, #e8c372 60%, #ff4d6d 100%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bilingual caption — render only the active language */}
          <div>
            {lang === "zh" ? (
              <p className="font-han text-sm text-boneFaint">
                注入热量为每个粒子加速，随后观察熵随粒子充满整个箱体而上升——并留意它绝不会自行回落。点击复位即可让晶格重新归于完美有序。
              </p>
            ) : (
              <p className="text-sm text-boneFaint">
                Inject heat to kick every particle, then watch entropy climb as
                they fill the box — and notice it never falls on its own. Reset
                to snap the lattice back to perfect order.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
