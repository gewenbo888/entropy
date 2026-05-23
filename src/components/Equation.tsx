"use client";

import { ReactNode } from "react";
import Reveal from "./Reveal";
import { useLang } from "./LangContext";

/* ---- math micro-typography ---- */
export const V = ({ children }: { children: ReactNode }) => (
  <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif), serif" }}>{children}</span>
);
export const Sub = ({ children }: { children: ReactNode }) => (
  <sub style={{ fontSize: "0.62em", verticalAlign: "-0.25em" }}>{children}</sub>
);
export const Sup = ({ children }: { children: ReactNode }) => (
  <sup style={{ fontSize: "0.62em", verticalAlign: "0.5em" }}>{children}</sup>
);

const accentMap = {
  plasma: "rgba(168,85,247,0.55)",
  electric: "rgba(56,189,248,0.55)",
  gold: "rgba(232,195,114,0.5)",
  ember: "rgba(255,77,109,0.55)",
} as const;

export function EquationBlock({
  formula,
  name,
  nameZh,
  en,
  zh,
  accent = "electric",
}: {
  formula: ReactNode;
  name: string;
  nameZh: string;
  en: string;
  zh: string;
  accent?: keyof typeof accentMap;
}) {
  const { lang } = useLang();
  return (
    <Reveal>
      <figure className="glass rounded-xl p-7 md:p-9 relative overflow-hidden halo">
        <div
          aria-hidden
          className="absolute -inset-x-10 -top-24 h-48 blur-3xl opacity-40"
          style={{
            background: `radial-gradient(closest-side, ${accentMap[accent]}, transparent)`,
          }}
        />
        <div className="relative flex items-baseline justify-between gap-4 mb-5">
          <span className="eyebrow">{lang === "zh" ? nameZh : name}</span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-boneFaint">EQ</span>
        </div>
        <div
          className="equation relative text-3xl md:text-5xl text-center py-4 leading-none"
          style={{ textShadow: `0 0 26px ${accentMap[accent]}` }}
        >
          {formula}
        </div>
        <figcaption className="relative mt-6 border-t border-rule pt-4">
          <p className="text-sm md:text-base text-bone/80 leading-relaxed">{en}</p>
          <p className="font-han text-sm md:text-base text-boneFaint mt-1.5 leading-relaxed">{zh}</p>
        </figcaption>
      </figure>
    </Reveal>
  );
}
