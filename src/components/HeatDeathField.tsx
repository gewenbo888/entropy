"use client";

import { useEffect, useRef } from "react";

/**
 * Section 8 — The Heat Death.
 * A field of stars that extinguish one by one. As the section comes into view a
 * one-way "cooling" clock advances: colors desaturate from gold→ember→ash, stars
 * wink out, until only a few cold photons drift across an almost-empty dark.
 */
export default function HeatDeathField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface Star { x: number; y: number; r: number; born: number; life: number; hue: number; tw: number; }
    interface Photon { x: number; y: number; vx: number; vy: number; }

    let stars: Star[] = [];
    let photons: Photon[] = [];

    const init = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(120, Math.min(420, Math.floor((w * h) / 2600)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        born: Math.random() * 0.15,
        life: Math.random() * 0.7 + 0.18, // when (in 0..1 progress) this star dies
        hue: Math.random(),
        tw: Math.random() * 6.28,
      }));
      photons = Array.from({ length: 14 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    };
    init();

    const ro = new ResizeObserver(init);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // start the one-way clock only when visible
    let started = false;
    let prog = 0;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) started = true; }),
      { threshold: 0.25 },
    );
    io.observe(canvas);

    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 1;
      if (started && prog < 1) prog += 0.0012; // ~14s to full cold

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (const s of stars) {
        // alive fraction: fades in then out around its life moment
        let a: number;
        if (prog < s.born) a = 0;
        else if (prog < s.life) a = Math.min(1, (prog - s.born) / 0.05);
        else a = Math.max(0, 1 - (prog - s.life) / 0.12);
        if (a <= 0.001) continue;

        const tw = 0.6 + 0.4 * Math.sin(t * 0.04 + s.tw);
        // color cools as global prog rises: gold -> ember -> ash-blue
        const cool = prog;
        const rC = Math.round(255 - cool * 90);
        const gC = Math.round(210 - cool * 150 + s.hue * 30);
        const bC = Math.round(150 + cool * 90);
        const rad = s.r * (1 + (1 - a) * 2);
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad * 3.4);
        g.addColorStop(0, `rgba(${rC},${gC},${bC},${a * tw})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad * 3.4, 0, 6.28);
        ctx.fill();
      }

      // cold drifting photons remain to the end
      for (const p of photons) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += w; if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; if (p.y > h) p.y -= h;
        const a = 0.12 + prog * 0.18;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 2.6);
        g.addColorStop(0, `rgba(150,180,255,${a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, 6.28);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    if (reduce) { prog = 0.55; started = true; for (let k = 0; k < 60; k++) draw(); }
    else draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="block w-full h-full" />;
}
