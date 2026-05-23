"use client";

import { ReactNode } from "react";
import Reveal from "./Reveal";
import { useLang } from "./LangContext";
import type { Accent } from "./atoms";

const accentText: Record<Accent, string> = {
  plasma: "text-plasma",
  electric: "text-electric",
  gold: "text-gold",
  ember: "text-ember",
  bone: "text-bone",
};

export function SectionShell({
  id,
  index,
  kicker,
  kickerZh,
  headline,
  headlineZh,
  reveal,
  revealZh,
  children,
  className = "",
  accent = "electric",
}: {
  id: string;
  index: string;
  kicker: string;
  kickerZh: string;
  headline: string;
  headlineZh: string;
  reveal?: string;
  revealZh?: string;
  children: ReactNode;
  className?: string;
  accent?: Accent;
}) {
  const { lang } = useLang();
  return (
    <section id={id} className={`relative isolate border-t border-rule ${className}`}>
      <div className="max-w-[1480px] mx-auto px-5 md:px-10 py-28 md:py-40">
        <Reveal>
          <div className="flex items-baseline gap-6 mb-10 md:mb-14">
            <span className={`font-mono text-xs tracking-[0.3em] ${accentText[accent]}`}>{index}</span>
            <div className="flex-1 divider" />
            <div className="text-right">
              <div className="eyebrow">{lang === "zh" ? kickerZh : kicker}</div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            className={`text-4xl md:text-6xl lg:text-7xl leading-[1.04] tracking-tight max-w-5xl text-balance ${
              lang === "zh" ? "font-han" : "font-display"
            }`}
          >
            <span className="text-cosmic-grad">{lang === "zh" ? headlineZh : headline}</span>
          </h2>
        </Reveal>

        <div className="mt-14 md:mt-20">{children}</div>

        {(reveal || revealZh) && (
          <Reveal delay={0.1}>
            <div className="mt-24 md:mt-32 border-t border-rule pt-12">
              <div className="eyebrow mb-3">— {lang === "zh" ? "揭示" : "Reveal"}</div>
              <p
                className={`text-3xl md:text-5xl leading-tight ${
                  accent === "ember" ? "text-ember-grad" : "text-cosmic-grad"
                } ${lang === "zh" ? "font-han" : "font-display"}`}
              >
                {lang === "zh" ? revealZh : reveal}
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
