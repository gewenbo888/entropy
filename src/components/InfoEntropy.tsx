"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "./LangContext";

type Lang = "en" | "zh";

interface SymbolStat {
  /** The raw character (single Unicode code point). */
  char: string;
  /** The display-safe glyph (spaces → ␣, newlines → ⏎, etc.). */
  glyph: string;
  /** Occurrence count. */
  count: number;
  /** Probability p_i = count / N. */
  p: number;
}

interface EntropyResult {
  length: number;
  distinct: number;
  /** Shannon entropy in bits / character. */
  H: number;
  /** Maximum possible entropy = log2(distinct). */
  Hmax: number;
  /** Total information content = H × N (bits). */
  totalBits: number;
  /** Randomness ratio = H / Hmax, in [0, 1]. */
  randomness: number;
  /** Predictability / redundancy = 1 − H/Hmax, in [0, 1]. */
  predictability: number;
  /** Sorted symbol statistics (descending by probability). */
  symbols: SymbolStat[];
}

const DEFAULT_TEXT: Record<Lang, string> = {
  en: "the universe remembers order only by destroying it",
  zh: "宇宙只能通过摧毁秩序来记住秩序",
};

const NOISE_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:,.<>?/\\|~`";

const SHAKESPEARE = "to be or not to be that is the question";

function makeNoise(len: number): string {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    const idx = Math.floor(Math.random() * NOISE_ALPHABET.length);
    out += NOISE_ALPHABET.charAt(idx);
  }
  return out;
}

/** Turn a raw character into a visible glyph for the spectrum labels. */
function toGlyph(ch: string): string {
  if (ch === " ") return "␣";
  if (ch === "\n") return "⏎";
  if (ch === "\t") return "⇥";
  if (ch === "\r") return "⏎";
  // Replace other control characters with a middle dot.
  const code = ch.codePointAt(0) ?? 0;
  if (code < 0x20 || code === 0x7f) return "·";
  return ch;
}

function computeEntropy(text: string): EntropyResult {
  // Iterate by Unicode code point so surrogate pairs count as one symbol.
  const chars = Array.from(text);
  const length = chars.length;

  if (length === 0) {
    return {
      length: 0,
      distinct: 0,
      H: 0,
      Hmax: 0,
      totalBits: 0,
      randomness: 0,
      predictability: 0,
      symbols: [],
    };
  }

  const counts = new Map<string, number>();
  for (const ch of chars) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }

  const distinct = counts.size;

  let H = 0;
  const symbols: SymbolStat[] = [];
  counts.forEach((count, char) => {
    const p = count / length;
    H -= p * Math.log2(p);
    symbols.push({ char, glyph: toGlyph(char), count, p });
  });

  // Clamp tiny negative artifacts from floating-point to 0.
  if (H < 0) H = 0;

  const Hmax = distinct > 1 ? Math.log2(distinct) : 0;
  const randomness = Hmax > 0 ? Math.min(1, Math.max(0, H / Hmax)) : 0;
  const predictability = Hmax > 0 ? Math.min(1, Math.max(0, 1 - H / Hmax)) : 1;
  const totalBits = H * length;

  symbols.sort((a, b) => b.p - a.p || a.char.localeCompare(b.char));

  return {
    length,
    distinct,
    H,
    Hmax,
    totalBits,
    randomness,
    predictability,
    symbols,
  };
}

/** Map a position in [0,1] across the electric→plasma→gold gradient. */
function spectrumColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  // electric #38bdf8 → plasma #a855f7 → gold #e8c372
  const stops: Array<{ at: number; rgb: [number, number, number] }> = [
    { at: 0, rgb: [56, 189, 248] },
    { at: 0.5, rgb: [168, 85, 247] },
    { at: 1, rgb: [232, 195, 114] },
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (clamped >= stops[i].at && clamped <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi.at - lo.at || 1;
  const f = (clamped - lo.at) / span;
  const r = Math.round(lo.rgb[0] + (hi.rgb[0] - lo.rgb[0]) * f);
  const g = Math.round(lo.rgb[1] + (hi.rgb[1] - lo.rgb[1]) * f);
  const b = Math.round(lo.rgb[2] + (hi.rgb[2] - lo.rgb[2]) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Animated number that counts toward its target on change. */
function AnimatedNumber({
  value,
  decimals,
  className,
}: {
  value: number;
  decimals: number;
  className?: string;
}): JSX.Element {
  const [display, setDisplay] = useState<number>(value);

  useEffect(() => {
    let frame = 0;
    const start = display;
    const end = value;
    const startTime = performance.now();
    const duration = 420;

    const tick = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // We intentionally only re-run when the target value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display.toFixed(decimals)}</span>;
}

interface VerdictInfo {
  label: string;
  color: string;
}

function verdict(H: number, lang: Lang, hasText: boolean): VerdictInfo {
  if (!hasText) {
    return {
      label: lang === "en" ? "Awaiting input" : "等待输入",
      color: "#6f78a3",
    };
  }
  if (H < 1.5) {
    return {
      label:
        lang === "en"
          ? "Highly ordered · compressible"
          : "高度有序 · 可压缩",
      color: "#38bdf8",
    };
  }
  if (H > 4.5) {
    return {
      label:
        lang === "en"
          ? "Near-random · incompressible noise"
          : "近乎随机 · 不可压缩的噪声",
      color: "#ff4d6d",
    };
  }
  return {
    label: lang === "en" ? "Structured language" : "结构化语言",
    color: "#e8c372",
  };
}

export default function InfoEntropy(): JSX.Element {
  const { lang } = useLang();
  const [text, setText] = useState<string>(DEFAULT_TEXT.en);

  // Seed initial text from language only at first mount; thereafter the
  // textarea is fully controlled by React state.
  const [seeded, setSeeded] = useState<boolean>(false);
  useEffect(() => {
    if (!seeded) {
      setText(DEFAULT_TEXT[lang]);
      setSeeded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = useMemo<EntropyResult>(() => computeEntropy(text), [text]);

  const hasText = result.length > 0;
  const v = verdict(result.H, lang, hasText);

  const t = (en: string, zh: string): string => (lang === "en" ? en : zh);

  const topSymbols = result.symbols.slice(0, 20);
  const maxP = topSymbols.length > 0 ? topSymbols[0].p : 1;

  const tiles: Array<{
    label: string;
    value: string;
    accent: string;
  }> = [
    {
      label: t("Predictability", "可预测性"),
      value: `${(result.predictability * 100).toFixed(1)}%`,
      accent: "#38bdf8",
    },
    {
      label: t("Randomness", "随机性"),
      value: `${(result.randomness * 100).toFixed(1)}%`,
      accent: "#a855f7",
    },
    {
      label: t("Distinct symbols", "不同符号数"),
      value: `${result.distinct}`,
      accent: "#e8c372",
    },
    {
      label: t("Total bits", "总比特数"),
      value:
        result.totalBits >= 1000
          ? `${(result.totalBits / 1000).toFixed(2)}k`
          : result.totalBits.toFixed(1),
      accent: "#ff4d6d",
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-5 py-12">
      <p className="eyebrow text-electric mb-3">
        {t("Live calculation", "实时计算")}
      </p>
      <h2 className="font-display text-3xl md:text-4xl text-cosmic-grad mb-2">
        {t("Information Entropy", "信息熵")}
      </h2>
      <p className={`text-boneDim max-w-2xl mb-8 ${lang === "zh" ? "font-han" : ""}`}>
        {t(
          "Type anything. Shannon entropy measures how much surprise each character carries — order collapses toward zero, pure noise climbs toward the alphabet's ceiling.",
          "随意输入文字。香农熵衡量每个字符携带的“意外”有多少——有序趋向于零，纯噪声逼近字母表的上限。",
        )}
      </p>

      {/* Input */}
      <div className="glass rounded-2xl p-4 md:p-5 mb-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label={t("Text to analyze", "待分析文本")}
          placeholder={t("Type to measure entropy…", "输入文字以测量熵…")}
          className="w-full min-h-[120px] resize-y bg-transparent font-mono text-sm md:text-base text-bone outline-none placeholder:text-boneFaint leading-relaxed"
        />
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-electric/10">
          <button
            type="button"
            onClick={() => setText("")}
            className="border border-electric/30 rounded-full px-3 py-1.5 text-xs hover:border-electric transition text-boneDim"
          >
            {t("Clear", "清空")}
          </button>
          <button
            type="button"
            onClick={() => setText(makeNoise(80))}
            className="border border-electric/30 rounded-full px-3 py-1.5 text-xs hover:border-electric transition text-boneDim"
          >
            {t("Random noise", "随机噪声")}
          </button>
          <button
            type="button"
            onClick={() => setText("a".repeat(80))}
            className="border border-electric/30 rounded-full px-3 py-1.5 text-xs hover:border-electric transition text-boneDim"
          >
            {t("Repeated", "重复")}
          </button>
          <button
            type="button"
            onClick={() => setText(SHAKESPEARE)}
            className="border border-electric/30 rounded-full px-3 py-1.5 text-xs hover:border-electric transition text-boneDim"
          >
            {t("Shakespeare", "莎士比亚")}
          </button>
        </div>
      </div>

      {/* Hero number + verdict */}
      <div className="glass halo rounded-2xl p-6 md:p-8 mb-5 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 0%, rgba(168,85,247,0.18), transparent 70%)",
          }}
        />
        <p className="eyebrow text-boneFaint mb-2 relative">
          {t("Shannon entropy", "香农熵")}
        </p>
        <div className="relative flex items-end justify-center gap-2">
          <AnimatedNumber
            value={result.H}
            decimals={3}
            className="font-mono text-6xl md:text-7xl font-bold text-bone"
          />
        </div>
        <p
          className={`mt-2 text-sm tracking-wide text-boneDim relative ${
            lang === "zh" ? "font-han" : ""
          }`}
        >
          {t("bits / character", "比特 / 字符")}
        </p>
        <motion.p
          key={v.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`mt-5 inline-flex items-center gap-2 text-sm md:text-base font-medium relative ${
            lang === "zh" ? "font-han" : ""
          }`}
          style={{ color: v.color }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: v.color, boxShadow: `0 0 12px ${v.color}` }}
          />
          {v.label}
        </motion.p>
        <p className="mt-3 text-xs text-boneFaint font-mono relative">
          {t("max", "上限")} H<sub>max</sub> ={" "}
          {result.Hmax.toFixed(3)} {t("bits", "比特")} · N = {result.length}
        </p>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="glass rounded-xl p-4 flex flex-col gap-1"
          >
            <span
              className={`text-[11px] uppercase tracking-wider text-boneFaint ${
                lang === "zh" ? "font-han tracking-normal" : ""
              }`}
            >
              {tile.label}
            </span>
            <span
              className="font-mono text-2xl md:text-3xl font-semibold"
              style={{ color: tile.accent }}
            >
              {tile.value}
            </span>
          </div>
        ))}
      </div>

      {/* Symbol spectrum */}
      <div className="glass rounded-2xl p-5 md:p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3
            className={`font-display text-lg text-bone ${
              lang === "zh" ? "font-han" : ""
            }`}
          >
            {t("Symbol spectrum", "符号频谱")}
          </h3>
          <span className="text-xs text-boneFaint font-mono">
            {t("top", "前")} {topSymbols.length} / {result.distinct}
          </span>
        </div>

        {topSymbols.length === 0 ? (
          <p
            className={`text-sm text-boneFaint py-6 text-center ${
              lang === "zh" ? "font-han" : ""
            }`}
          >
            {t("No symbols yet — start typing.", "暂无符号——开始输入吧。")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {topSymbols.map((s, i) => {
              const widthPct = maxP > 0 ? (s.p / maxP) * 100 : 0;
              const color = spectrumColor(
                topSymbols.length > 1 ? i / (topSymbols.length - 1) : 0,
              );
              return (
                <div
                  key={s.char}
                  className="flex items-center gap-3 group"
                  title={`${s.glyph}  p=${(s.p * 100).toFixed(2)}%  (×${s.count})`}
                >
                  <span className="w-6 shrink-0 text-center font-mono text-sm text-bone">
                    {s.glyph}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-electric/5 overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        boxShadow: `0 0 10px ${color}66`,
                      }}
                      initial={false}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-xs text-boneDim">
                    {(s.p * 100).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p
          className={`mt-5 pt-4 border-t border-electric/10 text-xs text-boneFaint leading-relaxed ${
            lang === "zh" ? "font-han" : ""
          }`}
        >
          {t(
            "Estimated compressibility ≈ ",
            "估计可压缩度 ≈ ",
          )}
          <span className="text-electric font-mono">
            {(result.predictability * 100).toFixed(1)}%
          </span>
          {t(
            " — the share of bits that redundancy makes redundant.",
            " —— 由冗余带来的可省去的比特占比。",
          )}
        </p>
      </div>
    </section>
  );
}
