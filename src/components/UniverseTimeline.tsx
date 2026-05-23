"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLang } from "./LangContext";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Bilingual {
  en: string;
  zh: string;
}

interface Epoch {
  /** Position on the [0,1] scrubber where this epoch begins. */
  tStart: number;
  name: Bilingual;
  /** Human-readable cosmic age label. */
  time: Bilingual;
  desc: Bilingual;
}

interface Star {
  x: number;
  y: number;
  /** Base radius. */
  r: number;
  /** When this star ignites (0..1). */
  born: number;
  /** When this star dies (0..1). */
  die: number;
  /** Twinkle phase. */
  phase: number;
  /** Hue 0..360 — warmer = older. */
  hue: number;
  /** Is this a "city light" / Mind&AI glint. */
  city: boolean;
}

/* ------------------------------------------------------------------ */
/*  Cosmic timeline data                                              */
/* ------------------------------------------------------------------ */

const EPOCHS: readonly Epoch[] = [
  {
    tStart: 0.0,
    name: { en: "Big Bang", zh: "大爆炸" },
    time: { en: "10⁻³² s", zh: "10⁻³² 秒" },
    desc: {
      en: "Spacetime ignites from a single point. The universe is a smooth, blindingly hot plasma — entropy is astonishingly LOW. This low-entropy beginning is the source of time's arrow.",
      zh: "时空从一个奇点点燃。宇宙是一团均匀而炽热的等离子体——熵低得惊人。正是这个低熵的开端，赋予了时间方向。",
    },
  },
  {
    tStart: 0.16,
    name: { en: "Recombination & First Light", zh: "复合与第一缕光" },
    time: { en: "380,000 yr", zh: "38 万年" },
    desc: {
      en: "Atoms form; the fog of plasma clears and light streams freely for the first time. That flash still reaches us today as the Cosmic Microwave Background.",
      zh: "原子形成，等离子体的迷雾散去，光第一次自由穿行。那道闪光至今仍以宇宙微波背景辐射的形式抵达我们。",
    },
  },
  {
    tStart: 0.34,
    name: { en: "Stars & Galaxies", zh: "恒星与星系" },
    time: { en: "10⁸–10⁹ yr", zh: "1–10 亿年" },
    desc: {
      en: "Gravity sculpts the smooth gas into stars, galaxies and clusters. Fusion ignites — stars burn order into light, exporting entropy into the cold of space.",
      zh: "引力将均匀的气体雕刻成恒星、星系与星系团。核聚变点燃——恒星把秩序燃烧成光，将熵抛向寒冷的太空。",
    },
  },
  {
    tStart: 0.52,
    name: { en: "Life", zh: "生命" },
    time: { en: "≈ 9 × 10⁹ yr", zh: "约 90 亿年" },
    desc: {
      en: "On at least one world, local pockets of exquisite order arise — life — paid for by feasting on the Sun's stream of low-entropy photons and dumping heat back to space.",
      zh: "至少在一个世界，局部出现了精妙的有序结构——生命。它以太阳输出的低熵光子为食，再把热量倾倒回太空。",
    },
  },
  {
    tStart: 0.66,
    name: { en: "Mind & AI", zh: "心智与人工智能" },
    time: { en: "13.8 × 10⁹ yr — now", zh: "138 亿年——此刻" },
    desc: {
      en: "Matter learns to model itself: information, civilization, machine intelligence. Complexity peaks here — yet every thought still pays its entropy tax in waste heat.",
      zh: "物质学会建模自身：信息、文明、机器智能。复杂性在此达到顶峰——但每一次思考，仍要以废热的形式缴纳熵税。",
    },
  },
  {
    tStart: 0.8,
    name: { en: "Stellar Twilight", zh: "恒星黄昏" },
    time: { en: "≈ 10¹⁴ yr", zh: "约 10¹⁴ 年" },
    desc: {
      en: "The Degenerate Era. Star formation has ended; the last red dwarfs flicker out one by one. The universe cools toward darkness, lit only by dying embers.",
      zh: "简并时代。恒星不再诞生，最后的红矮星一颗颗熄灭。宇宙朝黑暗冷却，只剩濒死的余烬微光。",
    },
  },
  {
    tStart: 0.91,
    name: { en: "Black Hole Era → Heat Death", zh: "黑洞纪元 → 热寂" },
    time: { en: "≈ 10¹⁰⁰ yr", zh: "约 10¹⁰⁰ 年" },
    desc: {
      en: "Even black holes evaporate into faint Hawking radiation. Entropy reaches its maximum: a uniform, near-absolute-zero sea. Nothing happens, ever again. Time's arrow finds no target.",
      zh: "连黑洞也蒸发成微弱的霍金辐射。熵达到极大值：一片均匀、近乎绝对零度的海洋。再无任何事件发生。时间之箭，再也射不中任何目标。",
    },
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Map scrubber t∈[0,1] to a cosmic age in seconds on a log axis,
 *  from ~10⁻³² s (Big Bang) to ~10¹⁰⁰ yr (Heat Death). */
const LOG_MIN = -32; // log10 seconds at t=0
const LOG_MAX = 108; // ~10^100 yr ≈ 10^107.5 s — round to 108 for readout

function tToLogSeconds(t: number): number {
  return LOG_MIN + (LOG_MAX - LOG_MIN) * t;
}

/** Format the current cosmic age from t for the big readout. */
function formatAge(t: number, lang: "en" | "zh"): string {
  const logS = tToLogSeconds(t);
  const yearLog = Math.log10(3.156e7); // seconds per year
  const logYr = logS - yearLog;

  // Pre-galactic: report in seconds for the very early universe.
  if (logS < 5) {
    const exp = Math.round(logS);
    if (exp <= 0) return lang === "zh" ? `10^${exp} 秒` : `10^${exp} s`;
    const val = Math.pow(10, logS);
    return lang === "zh" ? `${val.toFixed(0)} 秒` : `${val.toFixed(0)} s`;
  }

  // Otherwise report in years.
  if (logYr < 6) {
    const yr = Math.pow(10, logYr);
    const rounded = Math.round(yr / 1000) * 1000;
    return lang === "zh"
      ? `${rounded.toLocaleString("zh-CN")} 年`
      : `${rounded.toLocaleString("en-US")} yr`;
  }
  if (logYr < 10) {
    const yr = Math.pow(10, logYr) / 1e9;
    return lang === "zh" ? `${yr.toFixed(2)} 十亿年` : `${yr.toFixed(2)} Gyr`;
  }
  // Deep future — exponent form.
  const exp = Math.round(logYr);
  return lang === "zh" ? `10^${exp} 年` : `10^${exp} yr`;
}

/** Active epoch index for a given t. */
function epochIndexForT(t: number): number {
  let idx = 0;
  for (let i = 0; i < EPOCHS.length; i++) {
    if (t >= EPOCHS[i].tStart) idx = i;
  }
  return idx;
}

/** Monotonic entropy curve S(t) ∈ [0,1] — starts near 0, rises, plateaus at heat death. */
function entropyAt(t: number): number {
  // Smooth, monotonic, accelerating early then saturating.
  const s = Math.pow(t, 0.55);
  return Math.min(1, s);
}

/** Complexity hump C(t) ∈ [0,1] — peaks in the Mind & AI middle, then declines. */
function complexityAt(t: number): number {
  const peak = 0.66;
  const width = 0.27;
  const d = (t - peak) / width;
  return Math.exp(-d * d);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a: number, b: number, x: number): number {
  return a + (b - a) * x;
}

/* Deterministic PRNG so the star field is stable across renders. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const PLAY_DURATION_MS = 24000;
const SCOPE = "univ-timeline";

export default function UniverseTimeline() {
  const { lang } = useLang();

  const [t, setT] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [activeEpoch, setActiveEpoch] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dimsRef = useRef<{ w: number; h: number; dpr: number }>({ w: 0, h: 0, dpr: 1 });

  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastPlayTsRef = useRef<number | null>(null);
  const tRef = useRef<number>(0);
  const reducedRef = useRef<boolean>(false);

  // Keep tRef in sync for the rAF loop (which reads refs, not state).
  useEffect(() => {
    tRef.current = t;
    setActiveEpoch(epochIndexForT(t));
  }, [t]);

  /* ---- Build the star field once. ---- */
  useEffect(() => {
    const rng = makeRng(0xc051c ^ 0x9e3779b9);
    const stars: Star[] = [];
    const COUNT = 220;
    for (let i = 0; i < COUNT; i++) {
      // Birth spread across the star-forming era (~0.3 .. 0.75).
      const born = lerp(0.3, 0.78, rng());
      // Most stars die during stellar twilight; some linger.
      const die = clamp01(lerp(0.8, 0.97, rng()) + rng() * 0.03);
      const city = rng() > 0.86; // ~14% become Mind&AI city glints
      stars.push({
        x: rng(),
        y: rng(),
        r: lerp(0.6, 2.4, rng() * rng()),
        born,
        die,
        phase: rng() * Math.PI * 2,
        hue: lerp(20, 220, rng()), // gold→blue
        city,
      });
    }
    starsRef.current = stars;
  }, []);

  /* ---- prefers-reduced-motion ---- */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* ---- Canvas sizing via ResizeObserver. ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = 280;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      dimsRef.current = { w, h, dpr };
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  /* ---- Drawing ---- */
  const draw = useCallback((time: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { w, h, dpr } = dimsRef.current;
    if (w === 0) return;

    const cur = tRef.current;
    const reduced = reducedRef.current;
    const twinkle = reduced ? 0 : time / 1000;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    /* --- Background: hot fireball early, fading to void darkness late. --- */
    const ent = entropyAt(cur);
    const fireball = clamp01(1 - cur / 0.16); // 1 at big bang → 0 by recombination
    const twilight = clamp01((cur - 0.8) / 0.2); // ramps in stellar twilight
    const heat = clamp01((cur - 0.91) / 0.09); // ramps to heat death

    // Base void gradient
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
    if (fireball > 0.001) {
      // Hot uniform glow — low-entropy fireball
      bg.addColorStop(0, `rgba(${255},${235},${180},${0.92 * fireball})`);
      bg.addColorStop(0.5, `rgba(${255},${170},${90},${0.55 * fireball})`);
      bg.addColorStop(1, `rgba(${120},${40},${40},${0.25 * fireball})`);
    } else {
      // Cooling space — red shift in twilight, near-black at heat death
      const cr = lerp(8, 30, twilight) * (1 - heat);
      const cg = lerp(6, 8, twilight) * (1 - heat);
      const cb = lerp(18, 14, twilight) * (1 - heat);
      bg.addColorStop(0, `rgba(${Math.round(cr)},${Math.round(cg)},${Math.round(cb)},1)`);
      bg.addColorStop(1, `rgba(3,3,10,1)`);
    }
    ctx.fillStyle = "#03030a";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    /* --- Recombination flash: a sweeping band of first light. --- */
    if (cur > 0.1 && cur < 0.34) {
      const flash = Math.sin(clamp01((cur - 0.1) / 0.24) * Math.PI);
      const fg = ctx.createLinearGradient(0, 0, w, 0);
      fg.addColorStop(0, `rgba(232,195,114,0)`);
      fg.addColorStop(0.5, `rgba(232,195,114,${0.18 * flash})`);
      fg.addColorStop(1, `rgba(56,189,248,0)`);
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, w, h);
    }

    /* --- Galaxy clusters: a few bright structured cores in the middle. --- */
    const structure = complexityAt(cur);
    if (structure > 0.02 && fireball < 0.5) {
      const clusters = [
        { x: 0.26, y: 0.4, hue: 210 },
        { x: 0.55, y: 0.62, hue: 280 },
        { x: 0.74, y: 0.34, hue: 40 },
        { x: 0.42, y: 0.28, hue: 320 },
      ];
      for (const c of clusters) {
        const cx = c.x * w;
        const cy = c.y * h;
        const radius = lerp(20, 70, structure) * (1 - heat);
        if (radius <= 0) continue;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const a = 0.4 * structure * (1 - twilight * 0.6);
        g.addColorStop(0, `hsla(${c.hue},80%,72%,${a})`);
        g.addColorStop(1, `hsla(${c.hue},80%,40%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* --- Life bloom: a small green/teal pocket of order. --- */
    const lifePresence = clamp01((cur - 0.5) / 0.12) * clamp01(1 - (cur - 0.66) / 0.25);
    if (lifePresence > 0.01) {
      const lx = 0.62 * w;
      const ly = 0.7 * h;
      const lr = 26 * lifePresence;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      lg.addColorStop(0, `rgba(110,231,183,${0.5 * lifePresence})`);
      lg.addColorStop(1, `rgba(56,189,248,0)`);
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }

    /* --- Stars: ignite, twinkle, then wink out. --- */
    const stars = starsRef.current;
    const mindPhase = clamp01((cur - 0.6) / 0.1) * clamp01(1 - (cur - 0.72) / 0.2);
    for (const s of stars) {
      // Alive fraction: fade in at birth, fade out at death.
      let alive = clamp01((cur - s.born) / 0.05);
      if (cur > s.die) alive *= clamp01(1 - (cur - s.die) / 0.04);
      if (alive <= 0.001) continue;

      const px = s.x * w;
      const py = s.y * h;
      const tw = reduced ? 0.85 : 0.6 + 0.4 * Math.sin(twinkle * 1.6 + s.phase);
      const baseR = s.r * (1 + structure * 0.4);

      if (s.city && mindPhase > 0.05) {
        // City-light / network glint — cyan-white square-ish points.
        const a = alive * mindPhase;
        ctx.fillStyle = `rgba(56,189,248,${0.9 * a * tw})`;
        ctx.fillRect(px - baseR * 0.5, py - baseR * 0.5, baseR, baseR);
        continue;
      }

      // Color shifts redder as the universe ages (red dwarfs in twilight).
      const hue = lerp(s.hue, 8, twilight);
      const light = lerp(85, 55, twilight);
      const a = alive * tw * (1 - heat * 0.9);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue},90%,${light}%,${a})`;
      ctx.arc(px, py, baseR, 0, Math.PI * 2);
      ctx.fill();
    }

    /* --- Black-hole glows: a few isolated faint accretion halos late. --- */
    if (cur > 0.85) {
      const bhP = clamp01((cur - 0.85) / 0.1);
      const holes = [
        { x: 0.32, y: 0.45 },
        { x: 0.68, y: 0.58 },
        { x: 0.5, y: 0.3 },
      ];
      for (const ho of holes) {
        const hx = ho.x * w;
        const hy = ho.y * h;
        const rr = 14 * (1 - heat * 0.8);
        // dark core
        ctx.fillStyle = `rgba(0,0,0,${0.9 * bhP})`;
        ctx.beginPath();
        ctx.arc(hx, hy, rr * 0.55, 0, Math.PI * 2);
        ctx.fill();
        // faint ring
        const ring = ctx.createRadialGradient(hx, hy, rr * 0.45, hx, hy, rr);
        ring.addColorStop(0, `rgba(168,85,247,${0.5 * bhP * (1 - heat)})`);
        ring.addColorStop(1, `rgba(168,85,247,0)`);
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(hx, hy, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* --- Heat death: sparse drifting photons in near-empty darkness. --- */
    if (heat > 0.01) {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const seedX = (i * 97) % 100 / 100;
        const drift = reduced ? 0 : (twinkle * 6 + i * 13) % w;
        const px = (seedX * w + drift) % w;
        const py = ((i * 53) % 100) / 100 * h;
        ctx.fillStyle = `rgba(170,178,216,${0.12 * heat})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }

    /* --- Entropy curve overlay (monotonic) + complexity hump --- */
    const padX = 0;
    const baseY = h - 10;
    const span = h * 0.34;

    // complexity hump (dim, dashed feel)
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const tt = i / 100;
      const cx = padX + tt * w;
      const cy = baseY - complexityAt(tt) * span;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = "rgba(110,231,183,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // entropy curve (bright, monotonic)
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const tt = i / 100;
      const cx = padX + tt * w;
      const cy = baseY - entropyAt(tt) * span;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = "rgba(232,195,114,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // current-t marker on the entropy curve
    const mx = padX + cur * w;
    const my = baseY - ent * span;
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#e8c372";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(mx, baseY);
    ctx.lineTo(mx, my);
    ctx.strokeStyle = "rgba(232,195,114,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }, []);

  /* ---- Animation + auto-advance loop ---- */
  useEffect(() => {
    let mounted = true;

    const loop = (ts: number) => {
      if (!mounted) return;

      // Auto-advance when playing.
      if (playing) {
        if (lastPlayTsRef.current == null) lastPlayTsRef.current = ts;
        const dt = ts - lastPlayTsRef.current;
        lastPlayTsRef.current = ts;
        const next = clamp01(tRef.current + dt / PLAY_DURATION_MS);
        tRef.current = next;
        // Push to React state so slider + readout follow.
        setT(next);
        if (next >= 1) {
          setPlaying(false); // stop at the end — time has an arrow, no loop.
        }
      } else {
        lastPlayTsRef.current = null;
      }

      draw(ts);

      // If reduced motion AND not playing, we still loop lightly is wasteful;
      // but we keep a single rAF so scrubbing redraws. It's cheap.
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing, draw]);

  /* ---- Controls ---- */
  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    setT(clamp01(Number(e.target.value) / 1000));
  };

  const handlePlay = () => {
    if (tRef.current >= 1) {
      setT(0);
      tRef.current = 0;
    }
    lastPlayTsRef.current = null;
    setPlaying(true);
  };
  const handlePause = () => setPlaying(false);
  const handleRewind = () => {
    setPlaying(false);
    setT(0);
    tRef.current = 0;
  };

  const ep = EPOCHS[activeEpoch];
  const ageStr = formatAge(t, lang);
  const han = lang === "zh" ? "font-han" : "";

  return (
    <div ref={wrapRef} className="glass halo rounded-xl p-5 sm:p-7">
      <style>{`
        .${SCOPE}-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 9999px;
          background: linear-gradient(90deg,
            rgba(232,195,114,0.25) 0%,
            rgba(168,85,247,0.45) 45%,
            rgba(56,189,248,0.45) 70%,
            rgba(111,120,163,0.25) 100%);
          outline: none;
          cursor: pointer;
        }
        .${SCOPE}-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #e8c372;
          border: 2px solid rgba(231,235,255,0.85);
          box-shadow: 0 0 12px 2px rgba(232,195,114,0.8),
                      0 0 24px 6px rgba(168,85,247,0.35);
          cursor: pointer;
          transition: transform 0.12s ease;
        }
        .${SCOPE}-range::-webkit-slider-thumb:hover {
          transform: scale(1.12);
        }
        .${SCOPE}-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #e8c372;
          border: 2px solid rgba(231,235,255,0.85);
          box-shadow: 0 0 12px 2px rgba(232,195,114,0.8),
                      0 0 24px 6px rgba(168,85,247,0.35);
          cursor: pointer;
        }
        .${SCOPE}-range::-moz-range-track {
          height: 4px;
          border-radius: 9999px;
          background: transparent;
        }
      `}</style>

      <p className={`eyebrow text-electric ${han}`}>
        {lang === "zh" ? "宇宙时钟" : "Cosmic Clock"}
      </p>
      <h3 className={`mt-1 text-lg sm:text-xl text-bone ${lang === "zh" ? "font-han" : "font-display"}`}>
        {lang === "zh" ? "熵，就是时间之箭" : "Entropy is the arrow of time"}
      </h3>

      {/* Canvas strip */}
      <div className="mt-4 overflow-hidden rounded-lg border border-electric/15">
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ height: 280 }}
          aria-label={
            lang === "zh"
              ? "描绘当前宇宙纪元的画布"
              : "Canvas depicting the current cosmic epoch"
          }
          role="img"
        />
      </div>

      {/* Scrubber */}
      <div className="mt-5">
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(t * 1000)}
          onChange={onScrub}
          className={`${SCOPE}-range`}
          aria-label={lang === "zh" ? "宇宙年龄滑块" : "Universe age scrubber"}
        />
        <div className={`mt-2 flex justify-between text-[10px] text-boneFaint ${han}`}>
          <span>{lang === "zh" ? "大爆炸" : "Big Bang"}</span>
          <span>{lang === "zh" ? "此刻" : "Now"}</span>
          <span>{lang === "zh" ? "热寂" : "Heat Death"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {playing ? (
          <button
            type="button"
            onClick={handlePause}
            className={`border border-electric/30 rounded-full px-4 py-2 text-sm hover:border-electric transition text-bone ${han}`}
          >
            {lang === "zh" ? "暂停" : "Pause"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            className={`border border-electric/30 rounded-full px-4 py-2 text-sm hover:border-electric transition text-bone ${han}`}
          >
            {lang === "zh" ? "播放" : "Play"}
          </button>
        )}
        <button
          type="button"
          onClick={handleRewind}
          className={`border border-electric/30 rounded-full px-4 py-2 text-sm hover:border-electric transition text-boneDim ${han}`}
        >
          {lang === "zh" ? "倒带" : "Rewind"}
        </button>
        <span className={`text-[11px] text-boneFaint ${han}`}>
          {lang === "zh"
            ? "（只有模拟能倒带——真实的时间不能。）"
            : "(Only the simulation rewinds — real time cannot.)"}
        </span>
      </div>

      {/* Big readout */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className={`eyebrow text-boneFaint ${han}`}>
            {lang === "zh" ? "宇宙年龄" : "Cosmic Age"}
          </p>
          <p
            className="font-mono text-2xl sm:text-3xl text-gold"
            style={{ textShadow: "0 0 18px rgba(232,195,114,0.55)" }}
          >
            {ageStr}
          </p>
        </div>
        <div className="sm:text-right">
          <p className={`eyebrow text-boneFaint ${han}`}>
            {lang === "zh" ? "纪元" : "Epoch"}
          </p>
          <p
            className={`text-2xl sm:text-3xl text-cosmic-grad ${lang === "zh" ? "font-han" : "font-display"}`}
          >
            {ep.name[lang]}
          </p>
        </div>
      </div>

      {/* Epoch detail card */}
      <div className="mt-5 glass rounded-xl p-4 border border-plasma/15">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className={`text-base text-bone ${lang === "zh" ? "font-han" : "font-display"}`}>
            {ep.name[lang]}
          </span>
          <span className="font-mono text-xs text-electric">{ep.time[lang]}</span>
        </div>
        <p className={`mt-2 text-sm leading-relaxed text-boneDim ${han}`}>
          {ep.desc[lang]}
        </p>
      </div>

      {/* Footnote on the curves */}
      <p className={`mt-4 text-[11px] leading-relaxed text-boneFaint ${han}`}>
        {lang === "zh" ? (
          <>
            <span className="text-gold">金线</span>是熵——它<span className="text-bone">只增不减</span>；
            <span className="text-[#6ee7b7]">绿线</span>是复杂性——它在心智时代<span className="text-bone">隆起</span>，随后回落。
            结构会绽放又凋零，熵却始终朝同一个方向流动。这，就是时间之箭。
          </>
        ) : (
          <>
            The <span className="text-gold">gold line</span> is entropy — it{" "}
            <span className="text-bone">only ever rises</span>. The{" "}
            <span className="text-[#6ee7b7]">green line</span> is complexity — it{" "}
            <span className="text-bone">humps</span> in the age of mind, then falls.
            Structure blooms and fades, but entropy flows one way. That asymmetry is the arrow of time.
          </>
        )}
      </p>
    </div>
  );
}
