import { createContext, useContext, ReactNode, useState } from "react";

export type Lang = "pt" | "es" | "en" | "fr";

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "pt",
  setLang: () => {},
});

export const useLang = () => useContext(LangContext);

export const FLAG_TO_LANG: Record<string, Lang> = { br: "pt", es: "es", us: "en", fr: "fr" };

export function isTranslatable(text: string) {
  const t = text.trim();
  if (t.length < 2) return false;
  // skip pure numbers / symbols
  if (!/[A-Za-zÀ-ÿ]/.test(t)) return false;
  return true;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("pt");
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
