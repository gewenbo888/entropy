"use client";

import { ReactNode } from "react";
import Reveal from "./Reveal";
import { useLang } from "./LangContext";
import { AnimatePresence, motion } from "framer-motion";

export type Accent = "plasma" | "electric" | "gold" | "ember" | "bone";

const accentText: Record<Accent, string> = {
  plasma: "text-plasma",
  electric: "text-electric",
  gold: "text-gold",
  ember: "text-ember",
  bone: "text-bone",
};
const accentBorder: Record<Accent, string> = {
  plasma: "border-plasma/30",
  electric: "border-electric/30",
  gold: "border-gold/30",
  ember: "border-ember/30",
  bone: "border-bone/20",
};
const accentGlow: Record<Accent, string> = {
  plasma: "rgba(168,85,247,0.4)",
  electric: "rgba(56,189,248,0.4)",
  gold: "rgba(232,195,114,0.35)",
  ember: "rgba(255,77,109,0.4)",
  bone: "rgba(231,235,255,0.25)",
};

/** Cross-fades the text when the language changes, preserving layout. */
export function Bi({ en, zh, className = "" }: { en: ReactNode; zh: ReactNode; className?: string }) {
  const { lang } = useLang();
  return (
    <span className={`relative ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={lang}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={lang === "zh" ? "font-han" : ""}
          style={{ display: "inline-block" }}
        >
          {lang === "zh" ? zh : en}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Lede({ en, zh }: { en: ReactNode; zh: ReactNode }) {
  const { lang } = useLang();
  return (
    <Reveal>
      <p
        className={`max-w-4xl text-2xl md:text-[2rem] leading-snug text-bone/90 ${
          lang === "zh" ? "font-han" : "font-serif"
        }`}
      >
        {lang === "zh" ? zh : en}
      </p>
    </Reveal>
  );
}

export function Para({ en, zh, className = "" }: { en: string; zh: string; className?: string }) {
  const { lang } = useLang();
  return (
    <p
      className={`text-base md:text-lg leading-relaxed text-bone/75 ${
        lang === "zh" ? "font-han" : ""
      } ${className}`}
    >
      {lang === "zh" ? zh : en}
    </p>
  );
}

export function Quote({
  en,
  zh,
  cite,
  citeZh,
  accent = "plasma",
}: {
  en: string;
  zh: string;
  cite?: string;
  citeZh?: string;
  accent?: Accent;
}) {
  const { lang } = useLang();
  return (
    <Reveal>
      <figure className="relative max-w-4xl pl-8">
        <span
          aria-hidden
          className={`font-display absolute -top-6 -left-2 text-[110px] leading-none select-none opacity-25 ${accentText[accent]}`}
        >
          “
        </span>
        <blockquote
          className={`text-2xl md:text-3xl italic leading-snug ${accentText[accent]} ${
            lang === "zh" ? "font-han not-italic" : "font-serif"
          }`}
        >
          {lang === "zh" ? zh : en}
        </blockquote>
        {(cite || citeZh) && (
          <figcaption className="eyebrow mt-4">— {lang === "zh" ? citeZh || cite : cite}</figcaption>
        )}
      </figure>
    </Reveal>
  );
}

export function Card({
  num,
  enTitle,
  zhTitle,
  enBody,
  zhBody,
  accent = "electric",
}: {
  num?: string;
  enTitle: string;
  zhTitle: string;
  enBody: string;
  zhBody: string;
  accent?: Accent;
}) {
  const { lang } = useLang();
  return (
    <Reveal>
      <div
        className={`glass rounded-xl p-6 md:p-7 h-full border ${accentBorder[accent]} transition-shadow duration-500`}
        style={{ boxShadow: `0 24px 60px -44px ${accentGlow[accent]}` }}
      >
        {num && <div className={`font-mono text-[11px] tracking-[0.3em] ${accentText[accent]}`}>{num}</div>}
        <h3 className={`text-xl md:text-2xl mt-2 text-bone ${lang === "zh" ? "font-han" : "font-serif"}`}>
          {lang === "zh" ? zhTitle : enTitle}
        </h3>
        <p className={`text-sm md:text-base text-bone/72 mt-3 leading-relaxed ${lang === "zh" ? "font-han" : ""}`}>
          {lang === "zh" ? zhBody : enBody}
        </p>
      </div>
    </Reveal>
  );
}

export function Stat({
  value,
  enLabel,
  zhLabel,
  hint,
  accent = "electric",
}: {
  value: string;
  enLabel: string;
  zhLabel: string;
  hint?: string;
  accent?: Accent;
}) {
  const { lang } = useLang();
  return (
    <Reveal>
      <div className="glass rounded-xl p-6 halo">
        <div className={`bignum text-4xl md:text-5xl ${accentText[accent]}`}>{value}</div>
        <div className={`mt-3 text-bone/85 text-sm md:text-base ${lang === "zh" ? "font-han" : ""}`}>
          {lang === "zh" ? zhLabel : enLabel}
        </div>
        {hint && <div className="eyebrow mt-3">{hint}</div>}
      </div>
    </Reveal>
  );
}

export function MonoList({
  items,
  accent = "electric",
}: {
  items: { en: string; zh: string }[];
  accent?: Accent;
}) {
  const { lang } = useLang();
  return (
    <Reveal>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <li key={i} className="flex gap-4">
            <span className={`font-mono text-[11px] mt-1.5 shrink-0 w-8 ${accentText[accent]}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={`text-sm md:text-base text-bone/80 leading-relaxed ${lang === "zh" ? "font-han" : ""}`}>
              {lang === "zh" ? it.zh : it.en}
            </span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export function FlowRow({
  steps,
  accent = "electric",
}: {
  steps: { en: string; zh: string }[];
  accent?: Accent;
}) {
  const { lang } = useLang();
  return (
    <Reveal>
      <div className="overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0 pb-2">
        <div className="flex items-stretch gap-3 min-w-max">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`px-4 py-3 rounded-lg glass border ${accentBorder[accent]}`}>
                <div className={`text-base md:text-lg whitespace-nowrap text-bone ${lang === "zh" ? "font-han" : "font-serif"}`}>
                  {lang === "zh" ? s.zh : s.en}
                </div>
              </div>
              {i !== steps.length - 1 && <span className={`font-mono text-lg ${accentText[accent]}`}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export function Pill({ en, zh, accent = "electric" }: { en: string; zh: string; accent?: Accent }) {
  const { lang } = useLang();
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs tracking-wide border ${accentBorder[accent]} ${accentText[accent]} ${
        lang === "zh" ? "font-han" : "font-mono"
      }`}
    >
      {lang === "zh" ? zh : en}
    </span>
  );
}
