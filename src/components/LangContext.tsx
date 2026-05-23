"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "zh";

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; toggle: () => void }>({
  lang: "en",
  setLang: () => {},
  toggle: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const v = (typeof window !== "undefined"
      ? localStorage.getItem("entropy-lang")
      : null) as Lang | null;
    if (v === "en" || v === "zh") setLang(v);
    else if (typeof navigator !== "undefined" && navigator.language?.startsWith("zh")) {
      setLang("zh");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("entropy-lang", lang);
      document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    }
  }, [lang]);

  const toggle = () => setLang((l) => (l === "en" ? "zh" : "en"));

  return <Ctx.Provider value={{ lang, setLang, toggle }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** Pick the right string for the current language. */
export function useT() {
  const { lang } = useLang();
  return (en: string, zh: string) => (lang === "zh" ? zh : en);
}
