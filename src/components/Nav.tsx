"use client";

import { useLang } from "./LangContext";
import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero", en: "Origin", zh: "起源" },
  { id: "what", en: "Definition", zh: "定义" },
  { id: "time", en: "Time", zh: "时间" },
  { id: "info", en: "Information", zh: "信息" },
  { id: "life", en: "Life", zh: "生命" },
  { id: "blackhole", en: "Black Holes", zh: "黑洞" },
  { id: "ai", en: "Machine", zh: "机器" },
  { id: "heatdeath", en: "Heat Death", zh: "热寂" },
  { id: "final", en: "Transformation", zh: "转化" },
];

export default function Nav() {
  const { lang, toggle } = useLang();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28 });
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* scroll progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[80] origin-left"
        style={{
          scaleX: progress,
          background: "linear-gradient(90deg,#a855f7,#38bdf8,#e8c372,#ff4d6d)",
        }}
      />

      {/* top bar */}
      <div className="fixed top-0 inset-x-0 z-[70] pointer-events-none">
        <div className="max-w-[1480px] mx-auto px-5 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <a href="#hero" className="pointer-events-auto flex items-center gap-3 group">
            <span
              className="font-display italic text-2xl md:text-3xl liquid-metal leading-none"
              aria-hidden
            >
              S
            </span>
            <span className="hidden sm:block">
              <span className="font-display text-sm tracking-[0.34em] text-bone/90">ENTROPY</span>
              <span className="block font-han text-[10px] tracking-[0.4em] text-boneFaint -mt-0.5">熵 · 宇宙的终极方向</span>
            </span>
          </a>

          {/* language toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle language"
            className="pointer-events-auto relative flex items-center gap-1 rounded-full glass px-1 py-1 halo group"
          >
            <span
              className={`relative z-10 px-3 py-1.5 text-xs font-mono tracking-wider transition-colors duration-300 ${
                lang === "en" ? "text-void" : "text-boneDim"
              }`}
            >
              EN
            </span>
            <span
              className={`relative z-10 px-3 py-1.5 text-xs font-han tracking-wider transition-colors duration-300 ${
                lang === "zh" ? "text-void" : "text-boneDim"
              }`}
            >
              中文
            </span>
            <motion.span
              layout
              className="absolute top-1 bottom-1 rounded-full"
              style={{ background: "linear-gradient(90deg,#f4f7ff,#a855f7)" }}
              animate={{ left: lang === "en" ? 4 : "50%", right: lang === "en" ? "50%" : 4 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          </button>
        </div>
      </div>

      {/* side section index */}
      <nav className="fixed right-4 lg:right-7 top-1/2 -translate-y-1/2 z-[70] hidden md:flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-3 justify-end">
            <span
              className={`text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
                active === s.id ? "opacity-100 text-bone" : "opacity-0 group-hover:opacity-70 text-boneFaint"
              } ${lang === "zh" ? "font-han" : "font-mono"}`}
            >
              {lang === "zh" ? s.zh : s.en}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                active === s.id
                  ? "w-2.5 h-2.5 bg-electric shadow-[0_0_12px_#38bdf8]"
                  : "w-1.5 h-1.5 bg-boneFaint/50 group-hover:bg-bone"
              }`}
            />
          </a>
        ))}
      </nav>
    </>
  );
}
