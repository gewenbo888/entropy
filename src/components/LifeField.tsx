"use client";

import { useEffect, useRef } from "react";

/**
 * Section 5 — Life against entropy.
 * Nodes drift in from surrounding noise and self-organize into a living network:
 * links form between nearby nodes, pulses travel the synapses, an ordered island
 * grows against the dark. Negentropy made visible.
 */
export default function LifeField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface Node { x: number; y: number; vx: number; vy: number; r: number; bound: boolean; ph: number; }
    interface Pulse { a: number; b: number; t: number; }

    let nodes: Node[] = [];
    let pulses: Pulse[] = [];

    const init = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(46, Math.min(120, Math.floor((w * h) / 9000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 1,
        bound: false,
        ph: Math.random() * 6.28,
      }));
      pulses = [];
    };
    init();

    const ro = new ResizeObserver(init);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const cx = () => w / 2;
    const cy = () => h / 2;
    const linkDist = () => Math.min(w, h) * 0.14;

    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      const LD = linkDist();
      // attract unbound nodes toward the growing organism center; bind when close
      for (const n of nodes) {
        const dx = cx() - n.x, dy = cy() - n.y;
        const d = Math.hypot(dx, dy) || 1;
        if (!n.bound) {
          n.vx += (dx / d) * 0.006;
          n.vy += (dy / d) * 0.006;
          if (d < Math.min(w, h) * 0.32) n.bound = true;
        } else {
          // settle into a gentle orbit (self-organized structure)
          n.vx += (dx / d) * 0.002 - n.vx * 0.02;
          n.vy += (dy / d) * 0.002 - n.vy * 0.02;
          n.vx += (-dy / d) * 0.01;
          n.vy += (dx / d) * 0.01;
        }
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.985;
        n.vy *= 0.985;
      }

      // draw links among bound nodes
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!a.bound) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          if (!b.bound) continue;
          const dd = Math.hypot(a.x - b.x, a.y - b.y);
          if (dd < LD) {
            const alpha = (1 - dd / LD) * 0.5;
            ctx.strokeStyle = `rgba(120,200,255,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            if (Math.random() < 0.0008) pulses.push({ a: i, b: j, t: 0 });
          }
        }
      }

      // synapse pulses
      pulses = pulses.filter((p) => p.t < 1);
      for (const p of pulses) {
        p.t += 0.03;
        const a = nodes[p.a], b = nodes[p.b];
        const px = a.x + (b.x - a.x) * p.t;
        const py = a.y + (b.y - a.y) * p.t;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 6);
        g.addColorStop(0, "rgba(170,255,210,0.9)");
        g.addColorStop(1, "rgba(170,255,210,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 6.28);
        ctx.fill();
      }

      // nodes
      for (const n of nodes) {
        const tw = 0.6 + 0.4 * Math.sin(t * 0.05 + n.ph);
        const col = n.bound ? `rgba(120,220,255,${tw})` : `rgba(140,150,190,${tw * 0.5})`;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        g.addColorStop(0, col);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, 6.28);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      if (!reduce) raf = requestAnimationFrame(draw);
    };
    if (reduce) {
      for (let k = 0; k < 400; k++) draw();
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="block w-full h-full" />;
}
