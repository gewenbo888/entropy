"use client";

import { useLang } from "./LangContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const FLOATERS = [
  { tex: "S = k·ln W", x: "8%", y: "22%", d: 0 },
  { tex: "dS ≥ 0", x: "82%", y: "30%", d: 0.6 },
  { tex: "H = −Σ p log p", x: "14%", y: "70%", d: 1.1 },
  { tex: "ΔSₛᵤᵣ > 0", x: "76%", y: "74%", d: 1.6 },
  { tex: "S = kA / 4ℓ²", x: "60%", y: "16%", d: 0.9 },
  { tex: "T → 0", x: "30%", y: "84%", d: 1.4 },
];

export default function Hero() {
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const titleScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="hero" className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">
      {/* floating equation fragments */}
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute equation text-sm md:text-lg text-bone/35 select-none hidden sm:block"
          style={{ left: f.x, top: f.y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.35, 0.6], y: [0, -14, 0] }}
          transition={{ duration: 9 + f.d * 2, delay: f.d, repeat: Infinity, ease: "easeInOut" }}
        >
          {f.tex}
        </motion.span>
      ))}

      <motion.div style={{ y: titleY, scale: titleScale, opacity: fade }} className="relative z-10 text-center px-5">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.6em", filter: "blur(20px)" }}
          animate={{ opacity: 1, letterSpacing: "0.04em", filter: "blur(0px)" }}
          transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display font-black liquid-metal leading-[0.85] text-[clamp(4.5rem,20vw,18rem)]">
            {lang === "zh" ? "熵" : "ENTROPY"}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.3 }}
          className={`mx-auto max-w-3xl mt-6 md:mt-10 text-xl md:text-3xl text-bone/85 leading-snug ${
            lang === "zh" ? "font-han" : "font-serif italic"
          }`}
        >
          {lang === "zh"
            ? "宇宙通过毁灭秩序来记忆时间。"
            : "The universe remembers order only by destroying it."}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.7 }}
          className="eyebrow mt-8"
        >
          {lang === "zh" ? "熵 · 宇宙的终极方向" : "A Cathedral for the Ultimate Direction of Existence"}
        </motion.p>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className={`text-[10px] tracking-[0.35em] uppercase text-boneFaint ${lang === "zh" ? "font-han" : "font-mono"}`}>
          {lang === "zh" ? "向下坠入时间" : "Descend through time"}
        </span>
        <motion.span
          animate={{ y: [0, 9, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-10 bg-gradient-to-b from-electric to-transparent"
        />
      </motion.div>

      {/* bottom fade into content */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent pointer-events-none" />
    </section>
  );
}
