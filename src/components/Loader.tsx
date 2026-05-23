"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "./LangContext";

export default function Loader() {
  const { lang } = useLang();
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += Math.random() * 9 + 2;
      if (v >= 100) {
        v = 100;
        clearInterval(id);
        setTimeout(() => setDone(true), 520);
      }
      setPct(Math.floor(v));
    }, 90);
    return () => clearInterval(id);
  }, []);

  const lines = lang === "zh"
    ? ["正在校准热力学箭头…", "正在播种 14,000 个粒子…", "正在弯曲时空…", "宇宙就绪。"]
    : ["calibrating the thermodynamic arrow…", "seeding 14,000 particles…", "bending spacetime…", "universe ready."];
  const line = lines[Math.min(lines.length - 1, Math.floor((pct / 100) * lines.length))];

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          exit={{ opacity: 0, filter: "blur(14px)" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div
              className="font-display text-7xl md:text-9xl leading-none liquid-metal select-none"
              style={{ fontStyle: "italic" }}
            >
              S
            </div>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl opacity-50"
              style={{ background: "radial-gradient(closest-side, rgba(120,90,255,0.6), transparent)" }}
            />
          </motion.div>

          <div className="mt-10 w-[min(78vw,360px)]">
            <div className="h-px bg-rule relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,#a855f7,#38bdf8,#e8c372)",
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs text-boneFaint ${lang === "zh" ? "font-han" : "font-mono"}`}>{line}</span>
              <span className="font-mono text-xs text-bone tabular-nums">{pct}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
