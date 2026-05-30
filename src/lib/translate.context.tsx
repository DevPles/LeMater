import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "pt" | "es" | "en";
export type Pais = "BR" | "ES" | "US";

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "pt",
  setLang: () => {},
});

export const useLang = () => useContext(LangContext);

export const FLAG_TO_LANG: Record<string, Lang> = { br: "pt", es: "es", us: "en" };
export const LANG_TO_PAIS: Record<Lang, Pais> = { pt: "BR", es: "ES", en: "US" };
export const PAIS_TO_LANG: Record<Pais, Lang> = { BR: "pt", ES: "es", US: "en" };

/** País atual (BR/ES/US) derivado do idioma selecionado no topo. */
export const usePais = (): Pais => LANG_TO_PAIS[useLang().lang];

export function isTranslatable(text: string) {
  const t = text.trim();
  if (t.length < 2) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(t)) return false;
  return true;
}

const STORAGE_KEY = "lemater.lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  // Hidrata do localStorage no cliente (depois do mount p/ não quebrar SSR)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "pt" || saved === "es" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
