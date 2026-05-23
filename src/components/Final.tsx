"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLang } from "./LangContext";

/**
 * Section 9 — Final experience.
 * As you reach the end the interface dissolves into thermal noise, the closing
 * lines surface, the cursor becomes drifting stardust, and everything settles
 * into a faint, calm cosmic background.
 */
export default function Final() {
  const { lang } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const noiseRef = useRef<HTMLCanvasElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);

  // ---- thermal noise dissolve ----
  useEffect(() => {
    const canvas = noiseRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const off = document.createElement("canvas");
    off.width = 220; off.height = 130;
    const octx = off.getContext("2d");
    if (!octx) return;
    const img = octx.createImageData(off.width, off.height);

    let w = 0, h = 0;
    const size = () => {
      const r = section.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.floor(w);
      canvas.height = Math.floor(h);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(section);

    let raf = 0;
    const draw = () => {
      const r = section.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (r.height + window.innerHeight)));
      // noise rises through the middle of the passage, then calms toward the very end
      const intensity = Math.sin(Math.min(1, p * 1.25) * Math.PI) * 0.5 + p * 0.12;

      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v * 0.7;          // r
        d[i + 1] = v * 0.78;     // g
        d[i + 2] = Math.min(255, v + 40); // b (cosmic tint)
        d[i + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, Math.min(0.5, intensity));
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);
      ctx.globalAlpha = 1;

      if (!reduce) raf = requestAnimationFrame(draw);
    };
    if (reduce) { ctx.globalAlpha = 0.12; ctx.drawImage(off, 0, 0, w, h); }
    else draw();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // ---- stardust cursor (active within the section) ----
  useEffect(() => {
    const canvas = dustRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let w = 0, h = 0;
    const size = () => {
      const r = section.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.floor(w); canvas.height = Math.floor(h);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(section);

    interface Dust { x: number; y: number; vx: number; vy: number; life: number; c: string; }
    const dust: Dust[] = [];
    const palette = ["255,225,150", "150,200,255", "200,150,255", "255,255,255"];
    let inside = false;

    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        inside = false; return;
      }
      inside = true;
      const x = e.clientX - r.left, y = e.clientY - r.top;
      for (let i = 0; i < 3; i++) {
        dust.push({
          x, y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8 - 0.2,
          life: 1,
          c: palette[(Math.random() * palette.length) | 0],
        });
      }
      if (dust.length > 400) dust.splice(0, dust.length - 400);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.004; p.life -= 0.012;
        if (p.life <= 0) { dust.splice(i, 1); continue; }
        const rad = 2.4 * p.life + 0.4;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 3);
        g.addColorStop(0, `rgba(${p.c},${p.life})`);
        g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 3, 0, 6.28);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    draw();

    const setCursor = (on: boolean) => { section.style.cursor = on ? "none" : "auto"; };
    section.addEventListener("mouseenter", () => setCursor(true));
    section.addEventListener("mouseleave", () => setCursor(false));

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      section.style.cursor = "auto";
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="final"
      className="relative isolate border-t border-rule min-h-[150vh] flex items-center justify-center overflow-hidden"
    >
      <canvas ref={noiseRef} aria-hidden className="absolute inset-0 -z-10 pointer-events-none mix-blend-screen opacity-90" />
      <canvas ref={dustRef} aria-hidden className="absolute inset-0 z-20 pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, filter: "blur(16px)", y: 30 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className={`text-3xl md:text-6xl leading-tight text-cosmic-grad ${lang === "zh" ? "font-han" : "font-display"}`}>
            {lang === "zh" ? "熵从不是毁灭。" : "Entropy was never destruction."}
          </p>
          <p className={`text-3xl md:text-6xl leading-tight mt-3 text-gold-grad ${lang === "zh" ? "font-han" : "font-display"}`}>
            {lang === "zh" ? "而是转化。" : "It was transformation."}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.4, delay: 0.8 }}
          className={`mt-12 text-base md:text-lg text-boneDim leading-relaxed ${lang === "zh" ? "font-han" : "font-serif italic"}`}
        >
          {lang === "zh"
            ? "每一次坍缩，都是更深秩序的序章。星辰熄灭，原子四散，而构成你的粒子曾是某颗恒星的核心。你，是宇宙在通向平衡的路上，短暂记起自己的方式。"
            : "Every collapse is the overture to a deeper order. Stars go dark, atoms scatter — yet the particles that compose you were once the core of a star. You are the way the universe, on its road to equilibrium, briefly remembers itself."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 1.6 }}
          className="mt-16 flex flex-col items-center gap-3"
        >
          <span className="font-display italic text-3xl liquid-metal">S</span>
          <span className={`eyebrow ${lang === "zh" ? "font-han" : ""}`}>
            {lang === "zh" ? "移动光标 · 让它化作星尘" : "Move your cursor · let it become stardust"}
          </span>
        </motion.div>
      </div>

      {/* footer */}
      <div className="absolute bottom-6 inset-x-0 z-10 flex flex-col items-center gap-1">
        <a href="https://psyverse.fun" className="eyebrow hover:text-bone transition-colors">
          PSYVERSE
        </a>
        <span className="font-mono text-[10px] text-boneFaint/70">
          ENTROPY · 熵 — {new Date().getFullYear()} · Gewenbo
        </span>
      </div>

      {/* settle to calm */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent pointer-events-none -z-10" />
    </section>
  );
}
