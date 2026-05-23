"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangContext";

/**
 * BlackHoleSim — a cinematic Canvas-2D black hole the reader can feed.
 *
 * Black holes are the maximum-entropy objects in the universe: the Bekenstein–
 * Hawking entropy of a hole scales with the AREA of its event horizon, not its
 * volume. Here each fed star spirals through a temperature-graded accretion disk,
 * crosses the horizon in a flash, and bumps the mass by 1 M☉. We then grow the
 * horizon radius rₛ ∝ M and recompute S_BH ∝ rₛ² — so the glowing entropy counter
 * climbs and only ever increases.
 *
 * Pure Canvas 2D. No three.js. All mutable sim state lives in refs; React state
 * holds only the three displayed numbers (M, rₛ, S_BH), updated on each absorption.
 */

interface DiskParticle {
  /** orbital radius in horizon-radii units (>= ~1.08) */
  r: number;
  /** current angle */
  a: number;
  /** angular speed sign baseline (Keplerian magnitude derived from r) */
  spin: number;
  /** vertical jitter for disk thickness, in horizon-radii units */
  z: number;
  /** 0..1 base temperature seed (hotter = nearer in) */
  heat: number;
  /** twinkle phase */
  ph: number;
}

interface FedStar {
  /** orbital radius in horizon-radii units */
  r: number;
  a: number;
  /** inward velocity (negative = falling in), in r-units/sec */
  vr: number;
  /** angular speed, rad/sec */
  va: number;
  /** brightness 0..1 */
  bright: number;
  /** trail of recent {x,y} in horizon-radii * direction (logical, pre-projection) */
  trail: { r: number; a: number }[];
  /** tidal stretch factor, grows as it nears the hole */
  stretch: number;
  absorbed: boolean;
}

interface Hawking {
  /** radius in horizon-radii units */
  r: number;
  a: number;
  vr: number;
  life: number;
}

interface Flash {
  a: number;
  r: number;
  life: number;
}

const TWO_PI = Math.PI * 2;
/** disk tilt — squash the vertical axis so the ring looks like a tilted ellipse */
const TILT = 0.42;

export default function BlackHoleSim() {
  const { lang } = useLang();
  const en = lang === "en";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ---- displayed numbers (React state, throttled to absorptions) ----
  const [mass, setMass] = useState(8);
  const [rs, setRs] = useState(0);
  const [sbh, setSbh] = useState(0);
  const [bump, setBump] = useState(0); // animation key to flash the entropy number

  // ---- sim state (refs; never trigger re-render) ----
  const massRef = useRef(8);
  const horizonRef = useRef(0); // current drawn horizon radius in px (eased)
  const horizonTargetRef = useRef(0); // target horizon radius in px
  const diskRef = useRef<DiskParticle[]>([]);
  const starsRef = useRef<FedStar[]>([]);
  const hawkingRef = useRef<Hawking[]>([]);
  const flashRef = useRef<Flash[]>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const reduceRef = useRef(false);
  const pendingSpawnRef = useRef(0); // queued stars to release with stagger
  const spawnTimerRef = useRef(0);

  // entropy + radius law. Keep rₛ ∝ M and S_BH ∝ rₛ² for a clean area law.
  const K_RADIUS = 7.0; // px-base unit per ∛ scaling input; tuned at draw time
  const computeRs = (m: number) => K_RADIUS * Math.cbrt(m); // visually: grows but not runaway
  // physical-ish radius for the *readout* (∝ M); kept separate so the number reads cleanly
  const readoutRs = (m: number) => m * 1.2; // "km" scaled units, rₛ ∝ M
  const computeS = (m: number) => {
    // S_BH ∝ Area ∝ rₛ²  with rₛ ∝ M  →  S ∝ M².  Scale for a dramatic counter.
    const r = readoutRs(m);
    return r * r * 1.27e3;
  };

  const fmt = (n: number) => {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "×10⁶";
    if (n >= 1e3) return Math.round(n).toLocaleString("en-US");
    return Math.round(n).toString();
  };

  // ---------------------------------------------------------------------------
  // Initialise disk + numbers once.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const disk: DiskParticle[] = [];
    const N = 520;
    for (let i = 0; i < N; i++) {
      const t = Math.pow(Math.random(), 0.7); // bias toward inner edge
      const r = 1.12 + t * 4.6; // horizon-radii units
      disk.push({
        r,
        a: Math.random() * TWO_PI,
        spin: 1,
        z: (Math.random() - 0.5) * (0.06 + (r - 1.1) * 0.05),
        heat: 1 - t, // inner = hot
        ph: Math.random() * TWO_PI,
      });
    }
    diskRef.current = disk;
    massRef.current = 8;
    setMass(8);
    setRs(Math.round(readoutRs(8) * 10) / 10);
    setSbh(computeS(8));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Spawn a star at the disk's outer edge (or near a click point).
  // angleHint is a screen-space angle (radians) if the user clicked.
  // ---------------------------------------------------------------------------
  const spawnStar = (angleHint?: number) => {
    const a = angleHint ?? Math.random() * TWO_PI;
    starsRef.current.push({
      r: 6.4 + Math.random() * 1.6, // start outside the disk
      a,
      vr: -(0.45 + Math.random() * 0.25), // falling inward
      va: 0.5 + Math.random() * 0.3,
      bright: 1,
      trail: [],
      stretch: 1,
      absorbed: false,
    });
    if (reduceRef.current) drawStatic();
  };

  const feed = (count: number) => {
    if (reduceRef.current) {
      for (let i = 0; i < count; i++) spawnStar();
      // In reduced-motion mode absorb immediately for the readout.
      for (let i = 0; i < count; i++) absorbOne();
      starsRef.current = [];
      drawStatic();
      return;
    }
    pendingSpawnRef.current += count;
  };

  // Apply one absorption: bump mass, recompute readout numbers, queue flash.
  const absorbOne = () => {
    massRef.current += 1;
    const m = massRef.current;
    setMass(m);
    setRs(Math.round(readoutRs(m) * 10) / 10);
    setSbh(computeS(m));
    setBump((b) => b + 1);
  };

  // ---------------------------------------------------------------------------
  // Sizing.
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
    if (reduceRef.current) drawStatic();
  };

  // ---------------------------------------------------------------------------
  // Static starfield — generated once per size, drawn behind everything.
  // ---------------------------------------------------------------------------
  const starfieldRef = useRef<{ x: number; y: number; b: number; s: number }[]>([]);
  const ensureStarfield = (w: number, h: number) => {
    const want = Math.floor((w * h) / 5200);
    const sf = starfieldRef.current;
    if (sf.length !== want) {
      const arr: { x: number; y: number; b: number; s: number }[] = [];
      for (let i = 0; i < want; i++) {
        arr.push({
          x: Math.random() * w,
          y: Math.random() * h,
          b: 0.15 + Math.random() * 0.5,
          s: Math.random() < 0.08 ? 1.4 : 0.7,
        });
      }
      starfieldRef.current = arr;
    }
  };

  // ---------------------------------------------------------------------------
  // Project a disk-plane point (radius in horizon-radii units, angle) to screen.
  // ---------------------------------------------------------------------------
  const project = (
    cx: number,
    cy: number,
    horizonPx: number,
    r: number,
    a: number,
    z: number,
  ) => {
    const rad = r * horizonPx;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad * TILT + z * horizonPx;
    // depth: front half (sin(a) > 0) is nearer the viewer
    const depth = Math.sin(a); // -1 (back) .. 1 (front)
    return { x, y, depth };
  };

  // temperature → rgb. t in 0..1, 1 = hottest (inner, white-gold).
  const tempColor = (t: number) => {
    // white-hot/gold → orange → ember → deep red
    if (t > 0.78) {
      const k = (t - 0.78) / 0.22;
      return [255, 245 - (1 - k) * 20, 200 + k * 40] as const; // white-gold
    }
    if (t > 0.5) {
      const k = (t - 0.5) / 0.28;
      return [255, 175 + k * 70, 70 + k * 110] as const; // gold→amber
    }
    if (t > 0.25) {
      const k = (t - 0.25) / 0.25;
      return [255, 90 + k * 85, 40 + k * 30] as const; // orange→amber
    }
    const k = t / 0.25;
    return [180 + k * 75, 35 + k * 55, 50 + k * -10] as const; // deep red→ember
  };

  // ---------------------------------------------------------------------------
  // Draw a single full frame. `dt` seconds; if `still` true, no advancement.
  // ---------------------------------------------------------------------------
  const drawFrame = (ctx: CanvasRenderingContext2D, t: number, dt: number, still: boolean) => {
    const { w, h, dpr } = sizeRef.current;
    if (w === 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const base = Math.min(w, h);

    // horizon radius (px). target derived from mass; ease toward it.
    const targetPx = computeRs(massRef.current) * (base / 240);
    horizonTargetRef.current = targetPx;
    if (still) {
      horizonRef.current = targetPx;
    } else {
      horizonRef.current += (targetPx - horizonRef.current) * Math.max(0, Math.min(1, dt * 3.5));
    }
    const Hpx = Math.max(0, horizonRef.current);

    // ---- background ----
    ctx.fillStyle = "#03030a";
    ctx.fillRect(0, 0, w, h);

    ensureStarfield(w, h);
    ctx.save();
    for (const s of starfieldRef.current) {
      const tw = still ? 0.85 : 0.7 + 0.3 * Math.sin(t * 1.3 + s.x * 0.05 + s.y * 0.03);
      ctx.globalAlpha = s.b * tw;
      ctx.fillStyle = "#aab2d8";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.restore();

    // ---- outer gravitational-lensing halo (additive purple/blue) ----
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const haloR = Hpx * 5.4;
    const halo = ctx.createRadialGradient(cx, cy, Hpx * 1.1, cx, cy, haloR);
    halo.addColorStop(0, "rgba(56,189,248,0.10)");
    halo.addColorStop(0.4, "rgba(168,85,247,0.07)");
    halo.addColorStop(1, "rgba(168,85,247,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(cx, cy, haloR, haloR * (TILT + 0.45), 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // We render in two passes so the disk reads as wrapping behind/in-front of
    // the black sphere: BACK half of disk → black hole + photon ring → FRONT half.

    const drawDiskHalf = (front: boolean) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const p of diskRef.current) {
        if (!still) {
          // Keplerian-ish: inner orbits faster (∝ r^-1.5)
          const omega = p.spin * 0.9 / Math.pow(p.r, 1.5);
          p.a += omega * dt * 6;
        }
        const proj = project(cx, cy, Hpx, p.r, p.a, p.z);
        const isFront = proj.depth > 0;
        if (isFront !== front) continue;
        // skip particles that would draw atop the black sphere from behind
        const distFromCenter = Math.hypot(proj.x - cx, proj.y - cy);
        if (!front && distFromCenter < Hpx * 0.96) continue;

        // temperature: hotter inner + slight flicker
        const flick = still ? 0 : 0.06 * Math.sin(t * 4 + p.ph);
        const heat = Math.max(0, Math.min(1, p.heat + flick));
        const [r, g, b] = tempColor(heat);
        const depthFade = front ? 1 : 0.55; // back half dimmer
        const size = (0.9 + heat * 1.6) * (base / 360);
        const alpha = (0.16 + heat * 0.5) * depthFade;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size, 0, TWO_PI);
        ctx.fill();
      }
      ctx.restore();
    };

    // BACK half of the disk
    drawDiskHalf(false);

    // ---- the event horizon (perfectly black sphere) ----
    ctx.save();
    // soft black gradient so the rim of the sphere blends, true black core
    const sphere = ctx.createRadialGradient(cx, cy, Hpx * 0.6, cx, cy, Hpx * 1.02);
    sphere.addColorStop(0, "#000000");
    sphere.addColorStop(0.86, "#000000");
    sphere.addColorStop(1, "rgba(0,0,0,0.0)");
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(cx, cy, Hpx * 1.02, 0, TWO_PI);
    ctx.fill();
    // hard black core to guarantee true black
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(cx, cy, Hpx * 0.92, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // ---- photon ring (white→gold), additive ----
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const ringR = Hpx * 1.02;
    // bright thin ring
    const ring = ctx.createRadialGradient(cx, cy, ringR * 0.9, cx, cy, ringR * 1.16);
    ring.addColorStop(0, "rgba(255,255,255,0)");
    ring.addColorStop(0.55, "rgba(255,255,255,0.85)");
    ring.addColorStop(0.72, "rgba(232,195,114,0.9)");
    ring.addColorStop(1, "rgba(232,195,114,0)");
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR * 1.16, 0, TWO_PI);
    ctx.arc(cx, cy, ringR * 0.9, 0, TWO_PI, true);
    ctx.fill("evenodd");
    // crisp inner photon line
    ctx.lineWidth = Math.max(1, base / 420);
    ctx.strokeStyle = "rgba(255,250,235,0.9)";
    ctx.beginPath();
    ctx.arc(cx, cy, ringR * 1.0, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();

    // ---- FRONT half of disk (drawn over the sphere) ----
    drawDiskHalf(true);

    // ---- fed stars (spiral in) ----
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const stars = starsRef.current;
    for (let i = stars.length - 1; i >= 0; i--) {
      const st = stars[i];
      if (!still) {
        // spiral: radius shrinks, angular speed grows as it nears the hole
        st.va = 0.5 + 2.6 / Math.max(0.6, st.r);
        st.r += st.vr * dt;
        st.a += st.va * dt;
        st.vr *= 1 + dt * 0.4; // accelerate inward
        st.stretch = 1 + Math.max(0, (3.2 - st.r)) * 1.4; // tidal stretch near hole
        st.trail.push({ r: st.r, a: st.a });
        if (st.trail.length > 26) st.trail.shift();
      }

      // trail
      for (let k = 0; k < st.trail.length; k++) {
        const tp = st.trail[k];
        const pr = project(cx, cy, Hpx, tp.r, tp.a, 0);
        const fade = (k / st.trail.length) * 0.5;
        ctx.globalAlpha = fade * st.bright;
        ctx.fillStyle = "rgba(231,235,255,1)";
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, (base / 520) * (0.5 + fade), 0, TWO_PI);
        ctx.fill();
      }

      const pr = project(cx, cy, Hpx, st.r, st.a, 0);
      // tidally stretched head: an elongated bright streak along orbital tangent
      const tangent = st.a + Math.PI / 2;
      ctx.globalAlpha = st.bright;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(tangent);
      const len = (base / 90) * st.stretch;
      const wid = base / 220;
      const grad = ctx.createLinearGradient(-len, 0, len, 0);
      grad.addColorStop(0, "rgba(231,235,255,0)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.95)");
      grad.addColorStop(1, "rgba(232,195,114,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, len, wid, 0, 0, TWO_PI);
      ctx.fill();
      ctx.restore();

      // crossing the horizon → flash + absorb
      if (st.r <= 1.02 && !st.absorbed) {
        st.absorbed = true;
        flashRef.current.push({ a: st.a, r: 1.06, life: 1 });
        absorbOne();
      }
      if (st.absorbed) {
        st.bright -= dt * 4;
        if (st.bright <= 0 || st.r <= 0.6) {
          stars.splice(i, 1);
        }
      }
    }
    ctx.restore();

    // ---- absorption flashes ----
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const flashes = flashRef.current;
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      if (!still) f.life -= dt * 2.4;
      if (f.life <= 0) {
        flashes.splice(i, 1);
        continue;
      }
      const proj = project(cx, cy, Hpx, f.r, f.a, 0);
      const rad = Hpx * 0.5 * (1 - f.life) + Hpx * 0.15;
      const g = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, rad);
      g.addColorStop(0, `rgba(255,255,255,${f.life})`);
      g.addColorStop(0.5, `rgba(232,195,114,${f.life * 0.6})`);
      g.addColorStop(1, "rgba(232,195,114,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, rad, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();

    // ---- Hawking radiation (faint outward drift) ----
    if (!still) {
      // occasionally emit
      if (Math.random() < dt * 3.5) {
        hawkingRef.current.push({
          r: 1.05 + Math.random() * 0.06,
          a: Math.random() * TWO_PI,
          vr: 0.25 + Math.random() * 0.2,
          life: 1,
        });
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const haw = hawkingRef.current;
    for (let i = haw.length - 1; i >= 0; i--) {
      const p = haw[i];
      if (!still) {
        p.r += p.vr * dt;
        p.life -= dt * 0.5;
      }
      if (p.life <= 0 || p.r > 5) {
        haw.splice(i, 1);
        continue;
      }
      const proj = project(cx, cy, Hpx, p.r, p.a, 0);
      ctx.globalAlpha = p.life * 0.4;
      ctx.fillStyle = "rgba(180,210,255,1)";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, base / 620, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();
  };

  // Convenience: draw a single static beauty frame (used for reduced-motion + spawns).
  const drawStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFrame(ctx, 0, 0, true);
  };

  // ---------------------------------------------------------------------------
  // Main loop + listeners.
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

    // click on canvas spawns a star aimed from the click point
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const ang = Math.atan2((py - cy) / Math.max(0.001, TILT), px - cx);
      spawnStar(ang);
    };
    canvas.addEventListener("click", onClick);

    let raf = 0;
    let last = performance.now();

    if (reduceRef.current) {
      drawStatic();
    } else {
      const tick = (now: number) => {
        let dt = (now - last) / 1000;
        last = now;
        if (dt > 0.05) dt = 0.05; // clamp after tab switches
        const t = now / 1000;

        // release queued fed stars with a small stagger
        if (pendingSpawnRef.current > 0) {
          spawnTimerRef.current -= dt;
          if (spawnTimerRef.current <= 0) {
            spawnStar();
            pendingSpawnRef.current -= 1;
            spawnTimerRef.current = 0.16;
          }
        }

        drawFrame(ctx, t, dt, false);
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

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  const btn =
    "border border-gold/30 rounded-full px-4 py-2 text-sm hover:border-gold transition select-none";

  // log-scale-ish growth bar: map S into 0..1 across the current run
  const barPct = Math.min(1, Math.log10(Math.max(1, sbh)) / 7);

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        className="glass halo rounded-xl overflow-hidden relative"
        style={{ height: "min(58vw, 440px)" }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          aria-label={en ? "Interactive black hole simulation" : "可交互黑洞模拟"}
        />
        <div className="pointer-events-none absolute left-3 top-3">
          <p className={`eyebrow ${en ? "" : "font-han"}`}>
            {en ? "Maximum-entropy object" : "最大熵天体"}
          </p>
        </div>
      </div>

      {/* controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`${btn} border-gold/60 text-gold`}
          onClick={() => feed(1)}
        >
          <span className={en ? "" : "font-han"}>{en ? "Feed a star" : "投喂恒星"}</span>
        </button>
        <button type="button" className={btn} onClick={() => feed(10)}>
          <span className={en ? "" : "font-han"}>{en ? "Feed 10" : "投喂十颗"}</span>
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            massRef.current = 8;
            starsRef.current = [];
            hawkingRef.current = [];
            flashRef.current = [];
            pendingSpawnRef.current = 0;
            setMass(8);
            setRs(Math.round(readoutRs(8) * 10) / 10);
            setSbh(computeS(8));
            setBump((b) => b + 1);
            if (reduceRef.current) drawStatic();
          }}
        >
          <span className={en ? "" : "font-han"}>{en ? "Reset" : "重置"}</span>
        </button>
        <span className={`text-boneFaint text-xs ml-1 ${en ? "" : "font-han"}`}>
          {en ? "or click the disk to feed" : "或点击吸积盘投喂"}
        </span>
      </div>

      {/* readout panel */}
      <div className="glass rounded-xl mt-4 p-5 grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
        <div>
          <p className={`text-boneFaint text-xs uppercase tracking-wide ${en ? "" : "font-han"}`}>
            {en ? "Mass" : "质量"}
          </p>
          <p className="font-mono text-bone text-2xl mt-1">
            M = {mass} <span className="text-boneDim text-base">M☉</span>
          </p>
        </div>
        <div>
          <p className={`text-boneFaint text-xs uppercase tracking-wide ${en ? "" : "font-han"}`}>
            {en ? "Event-horizon radius" : "事件视界半径"}
          </p>
          <p className="font-mono text-electric text-2xl mt-1">
            rₛ = {rs} <span className="text-boneDim text-base">km</span>
          </p>
          <p className={`text-boneFaint text-[11px] mt-1 ${en ? "" : "font-han"}`}>
            {en ? "rₛ ∝ M" : "rₛ ∝ M"}
          </p>
        </div>
        <div className="sm:text-right">
          <p className={`text-boneFaint text-xs uppercase tracking-wide ${en ? "" : "font-han"}`}>
            {en ? "Bekenstein–Hawking entropy" : "贝肯斯坦–霍金熵"}
          </p>
          <p
            key={bump}
            className="font-mono text-3xl sm:text-4xl mt-1 leading-none entropy-pop"
            style={{
              color: "#e8c372",
              textShadow:
                "0 0 12px rgba(232,195,114,0.55), 0 0 32px rgba(232,195,114,0.3)",
            }}
          >
            {fmt(sbh)} <span className="text-boneDim text-base font-mono">k_B</span>
          </p>
          <p className={`text-boneFaint text-[11px] mt-1 ${en ? "" : "font-han"}`}>
            {en ? "S_BH ∝ rₛ²  (horizon area)" : "S_BH ∝ rₛ²（视界面积）"}
          </p>
        </div>

        {/* growth bar (full width) */}
        <div className="sm:col-span-3">
          <div className="h-1.5 w-full rounded-full bg-bone/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${barPct * 100}%`,
                background: "linear-gradient(90deg,#a855f7,#38bdf8,#e8c372)",
              }}
            />
          </div>
          <p className={`text-boneDim text-xs mt-3 leading-relaxed ${en ? "" : "font-han"}`}>
            {en
              ? "Entropy only ever increases — every star you feed grows the horizon's area, and a black hole packs the maximum entropy allowed inside its volume."
              : "熵只增不减 —— 你投喂的每一颗恒星都会扩大视界面积，而黑洞封装着其体积内所允许的最大熵。"}
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes bhEntropyPop {
          0% { transform: scale(1.18); filter: brightness(1.7); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .entropy-pop {
          animation: bhEntropyPop 0.45s ease-out;
          transform-origin: right center;
        }
        @media (prefers-reduced-motion: reduce) {
          .entropy-pop { animation: none; }
        }
      `,
        }}
      />
    </div>
  );
}
