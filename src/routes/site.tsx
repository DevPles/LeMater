import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import rayssa from "@/assets/rayssa-portrait.jpg";
import { LiquidCard } from "@/components/LiquidCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { translateBatch } from "@/lib/translate.functions";

type Lang = "pt" | "es" | "en" | "fr";
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "pt",
  setLang: () => {},
});
const useLang = () => useContext(LangContext);

const FLAG_TO_LANG: Record<string, Lang> = { br: "pt", es: "es", us: "en", fr: "fr" };

function isTranslatable(text: string) {
  const t = text.trim();
  if (t.length < 2) return false;
  // skip pure numbers / symbols
  if (!/[A-Za-zÀ-ÿ]/.test(t)) return false;
  return true;
}

export const Route = createFileRoute("/site")({
  head: () => ({
    meta: [
      { title: "LeMater · Saúde materna com credencial clínica" },
      {
        name: "description",
        content:
          "Programas, app e teleconsulta materna por Rayssa Leslie, Enf. Obstetra UNAERP.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: SitePage,
});

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageLight: "#8AB89A",
  sageDark: "#2D5A42",
  terracotta: "#C4714A",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
};

const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type SectionId = "inicio" | "sobre" | "produtos" | "contato";

const NAV_ITEMS: ReadonlyArray<readonly [SectionId, string]> = [
  ["inicio", "Início"],
  ["sobre", "Sobre"],
  ["produtos", "ATLAS MATERNO"],
  ["contato", "Contato"],
];

function SitePage() {
  const [active, setActive] = useState<SectionId>("inicio");
  const [lang, setLang] = useState<Lang>("pt");
  const [translating, setTranslating] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Map<TextNode, originalString>
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  // Cache: lang -> Map<original, translated>
  const cacheRef = useRef<Map<Lang, Map<string, string>>>(new Map());
  const translateFn = useServerFn(translateBatch);

  const go = (id: SectionId) => {
    setActive(id);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // Apply translation whenever lang or active section changes.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Collect text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = (node as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
        if (!isTranslatable((node as Text).nodeValue ?? "")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) nodes.push(n as Text);

    // Save originals on first encounter
    for (const node of nodes) {
      if (!originalsRef.current.has(node)) {
        originalsRef.current.set(node, node.nodeValue ?? "");
      }
    }

    // Restore Portuguese instantly
    if (lang === "pt") {
      for (const node of nodes) {
        const orig = originalsRef.current.get(node);
        if (orig != null && node.nodeValue !== orig) node.nodeValue = orig;
      }
      return;
    }

    // Build cache for this lang
    if (!cacheRef.current.has(lang)) cacheRef.current.set(lang, new Map());
    const cache = cacheRef.current.get(lang)!;

    // Apply cached, collect missing
    const missing = new Set<string>();
    for (const node of nodes) {
      const orig = originalsRef.current.get(node) ?? "";
      const key = orig.trim();
      if (!key) continue;
      const cached = cache.get(key);
      if (cached) {
        // preserve leading/trailing whitespace from original
        const leading = orig.match(/^\s*/)?.[0] ?? "";
        const trailing = orig.match(/\s*$/)?.[0] ?? "";
        node.nodeValue = leading + cached + trailing;
      } else {
        missing.add(key);
      }
    }

    if (missing.size === 0) return;

    let cancelled = false;
    setTranslating(true);
    const texts = Array.from(missing);
    translateFn({ data: { texts, target: lang } })
      .then((res) => {
        if (cancelled) return;
        res.translations.forEach((t, i) => cache.set(texts[i], t));
        // Apply to current nodes
        for (const node of nodes) {
          const orig = originalsRef.current.get(node) ?? "";
          const key = orig.trim();
          const translated = cache.get(key);
          if (translated) {
            const leading = orig.match(/^\s*/)?.[0] ?? "";
            const trailing = orig.match(/\s*$/)?.[0] ?? "";
            node.nodeValue = leading + translated + trailing;
          }
        }
      })
      .catch((err) => console.error("Translation error:", err))
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lang, active, translateFn]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div
        ref={containerRef}
        style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh", overflowX: "hidden" }}
      >
        <Nav active={active} go={go} />
        <main>
          {active === "inicio" && <Inicio go={go} />}
          {active === "sobre" && <Sobre />}
          {active === "produtos" && <Produtos />}
          {active === "contato" && <Contato />}
        </main>
        <Footer />
        {translating && (
          <div
            data-no-translate
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              background: c.sageDark,
              color: c.cream,
              padding: "10px 16px",
              borderRadius: 999,
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              zIndex: 9999,
            }}
          >
            {lang === "es" ? "Traduciendo…" : "Translating…"}
          </div>
        )}
      </div>
    </LangContext.Provider>
  );
}

function Nav({ active, go }: { active: SectionId; go: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang } = useLang();
  const LANG_OPTIONS: { code: string; target: Lang; country: string; label: string }[] = [
    { code: "br", target: "pt", country: "Brasil", label: "Português" },
    { code: "es", target: "es", country: "España", label: "Español" },
    { code: "us", target: "en", country: "United States", label: "English" },
    { code: "fr", target: "fr", country: "France", label: "Français" },
  ];
  const currentFlag = LANG_OPTIONS.find((o) => o.target === lang) ?? LANG_OPTIONS[0];
  const linkStyle = (id: SectionId): CSSProperties => ({
    fontSize: isMobile ? 15 : 13,
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: active === id ? c.sageDark : c.muted,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: isMobile ? "12px 0" : 0,
    fontFamily: sans,
  });
  const handleGo = (id: SectionId) => {
    setOpen(false);
    go(id);
  };
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(250,245,238,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "16px 20px" : "20px 48px",
        }}
      >
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, letterSpacing: "0.08em" }}>
          Le<span style={{ color: c.sage }}>Mater</span>
        </div>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
            {NAV_ITEMS.map(([id, label]) => (
              <li key={id}>
                <button onClick={() => handleGo(id)} style={linkStyle(id)}>{label}</button>
              </li>
            ))}
            <li data-no-translate style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                aria-label="Selecionar país e idioma"
                aria-expanded={langOpen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: `1px solid ${c.border}`,
                  borderRadius: 4,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontFamily: sans,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: c.ink,
                }}
              >
                <img
                  src={`https://flagcdn.com/w40/${currentFlag.code}.png`}
                  srcSet={`https://flagcdn.com/w80/${currentFlag.code}.png 2x`}
                  alt={currentFlag.code.toUpperCase()}
                  style={{ width: 22, height: 16, objectFit: "cover", borderRadius: 2, display: "block" }}
                />
                <span>{currentFlag.target.toUpperCase()}</span>
              </button>
              {langOpen && (
                <>
                  <div
                    onClick={() => setLangOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 200 }}
                  />
                  <ul
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      zIndex: 201,
                      listStyle: "none",
                      margin: 0,
                      padding: 6,
                      background: c.cream,
                      border: `1px solid ${c.border}`,
                      borderRadius: 6,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      minWidth: 200,
                    }}
                  >
                    {LANG_OPTIONS.map((opt) => {
                      const isActive = opt.target === lang;
                      return (
                        <li key={opt.code}>
                          <button
                            type="button"
                            onClick={() => {
                              setLang(opt.target);
                              setLangOpen(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              width: "100%",
                              padding: "8px 10px",
                              background: isActive ? c.warm : "transparent",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontFamily: sans,
                              fontSize: 13,
                              color: c.ink,
                              textAlign: "left",
                            }}
                          >
                            <img
                              src={`https://flagcdn.com/w40/${opt.code}.png`}
                              srcSet={`https://flagcdn.com/w80/${opt.code}.png 2x`}
                              alt={opt.code.toUpperCase()}
                              style={{ width: 24, height: 18, objectFit: "cover", borderRadius: 2, display: "block" }}
                            />
                            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                              <span style={{ fontWeight: 500 }}>{opt.country}</span>
                              <span style={{ fontSize: 11, color: c.muted }}>{opt.label}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </li>
          </ul>
        )}
        {!isMobile ? (
          <button
            onClick={() => handleGo("contato")}
            style={{
              background: c.sageDark,
              color: "white",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "10px 24px",
              border: "none",
              cursor: "pointer",
              fontFamily: sans,
            }}
          >
            ACESSE APP
          </button>
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              color: c.ink,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "8px 14px",
              cursor: "pointer",
              fontFamily: sans,
            }}
          >
            {open ? "Fechar" : "Menu"}
          </button>
        )}
      </div>
      {isMobile && open && (
        <div style={{ padding: "8px 20px 20px", borderTop: `1px solid ${c.border}`, display: "flex", flexDirection: "column" }}>
          {NAV_ITEMS.map(([id, label]) => (
            <button key={id} onClick={() => handleGo(id)} style={{ ...linkStyle(id), textAlign: "left", borderBottom: `1px solid ${c.border}` }}>
              {label}
            </button>
          ))}
          <button
            onClick={() => handleGo("contato")}
            style={{
              background: c.sageDark,
              color: "white",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "14px 24px",
              border: "none",
              cursor: "pointer",
              fontFamily: sans,
              marginTop: 16,
            }}
          >
            ACESSE APP
          </button>
        </div>
      )}
    </nav>
  );
}

const SectionTag = ({ text, light = false, center = false }: { text: string; light?: boolean; center?: boolean }) => (
  <div
    style={{
      fontSize: 11,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: light ? c.sageLight : c.sage,
      fontWeight: 500,
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: center ? "center" : "flex-start",
    }}
  >
    <span style={{ width: 24, height: 1, background: light ? c.sageLight : c.sage }} />
    {text}
  </div>
);

const h2: CSSProperties = {
  fontFamily: serif,
  fontSize: "clamp(28px, 3vw, 44px)",
  fontWeight: 300,
  lineHeight: 1.1,
  color: c.ink,
  marginBottom: 20,
};

const sectionP: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: c.muted,
  fontWeight: 300,
  maxWidth: 480,
  marginBottom: 24,
};

const btnPrimary: CSSProperties = {
  background: c.sageDark,
  color: "white",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "14px 32px",
  border: "none",
  cursor: "pointer",
  fontFamily: sans,
};

const btnSecondary: CSSProperties = {
  background: "transparent",
  color: c.ink,
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "14px 32px",
  border: `1.5px solid ${c.border}`,
  cursor: "pointer",
  fontFamily: sans,
};

function Inicio({ go }: { go: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const { lang, setLang } = useLang();
  return (
    <section style={{ paddingTop: isMobile ? 80 : 40, minHeight: "75vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div
          style={{
            flex: "1 1 480px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: isMobile ? "20px 24px 32px" : "20px 48px 40px",
            alignItems: isMobile ? "center" : "flex-start",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          {!isMobile && <SectionTag text="Gestação que você merece." />}
          <h1 style={{ fontFamily: serif, fontSize: "clamp(32px,4vw,54px)", fontWeight: 300, lineHeight: 1.1, marginBottom: 20, marginTop: isMobile ? 0 : 60 }}>
            A gestação que você <em style={{ fontStyle: "italic", color: c.sage }}>merece viver.</em>
          </h1>
          <p
            style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.6, color: c.muted, maxWidth: 640, marginBottom: 36, textAlign: "center", marginInline: "auto" }}
          >
            Criada por Rayssa Leslie, Enfermeira Pós Graduada em Obstetricia formada pela UNAERP, a Le Mater une orientação Pré-Concepcional, Educação Materna, Carteira Digital da Gestante e Inteligência Artificial para Acompanhar mulheres da tentativa natural de Engravidar aos Primeiros Cuidados com o bebê.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", width: isMobile ? "100%" : "auto" }}>
            <button style={btnPrimary} onClick={() => go("produtos")}>ACESSAR ATLAS MATERNO</button>
            <button style={btnSecondary} onClick={() => go("sobre")}>Conhecer a Rayssa</button>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 48, paddingTop: 32, borderTop: `1px solid ${c.border}`, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", width: "100%" }}>
            {[
              { num: "+10", lbl: "Anos em obstetrícia" },
              { flags: ["br", "es", "us", "fr"] as string[], lbl: "Atuação em 4 países" },
              { num: "UNAERP\nClínica Estética Leslie", lbl: "Parceria institucional", small: true },
            ].map((stat) => (
              <div key={stat.lbl} style={{ textAlign: isMobile ? "center" : "left", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                <div style={{ height: 38, display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start" }}>
                  {stat.flags ? (
                    <div data-no-translate style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {stat.flags.map((code) => {
                        const targetLang = FLAG_TO_LANG[code];
                        const isActive = lang === targetLang;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setLang(targetLang)}
                            title={
                              targetLang === "pt"
                                ? "Português"
                                : targetLang === "es"
                                ? "Español"
                                : "English"
                            }
                            aria-label={`Mudar idioma para ${code.toUpperCase()}`}
                            style={{
                              padding: 0,
                              border: isActive ? `2px solid ${c.sageDark}` : "2px solid transparent",
                              borderRadius: 4,
                              background: "none",
                              cursor: "pointer",
                              lineHeight: 0,
                              opacity: isActive ? 1 : 0.7,
                              transition: "opacity 150ms, border-color 150ms",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = isActive ? "1" : "0.7")}
                          >
                            <img
                              src={`https://flagcdn.com/w40/${code}.png`}
                              srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
                              alt={code.toUpperCase()}
                              style={{ width: 32, height: 22, objectFit: "cover", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.15)", display: "block" }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontFamily: serif, fontSize: stat.small ? 14 : 32, fontWeight: 400, color: c.sageDark, lineHeight: 1.25, maxWidth: stat.small ? 220 : undefined, whiteSpace: "pre-line" }}>{stat.num}</div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: c.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 6 }}>{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "0 1 460px", background: c.warm, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden", padding: isMobile ? 20 : 32, minHeight: isMobile ? 360 : 480, alignSelf: "center", borderRadius: 16, width: isMobile ? "calc(100% - 40px)" : undefined, marginInline: isMobile ? 20 : undefined, marginBottom: isMobile ? 24 : undefined }}>
          <img
            src={rayssa}
            alt="Rayssa Leslie, Enfermeira Pós Graduada em Obstetricia"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
          <LiquidCard bgOpacity={0} style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 12, position: "relative", zIndex: 2, background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", backdropFilter: "blur(8px) saturate(180%) contrast(110%)", WebkitBackdropFilter: "blur(8px) saturate(180%) contrast(110%)", borderColor: "rgba(255,255,255,0.18)", boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.2), 0 8px 24px -14px rgba(0,0,0,0.18)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.sageDark, textShadow: "0 1px 2px rgba(255,255,255,0.55)" }}>Rayssa Leslie</div>
                <div style={{ background: c.sageDark, color: "white", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>★ 5.0</div>
              </div>
              <div style={{ fontSize: 11.5, color: c.sageDark, lineHeight: 1.55, fontWeight: 600, textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}>
                Enfermeira Pós Graduada em Obstetricia<br />
                Enfermeira Pós Graduada em Neonatologista<br />
                Especialista ACLS pelo American Heart Association (AHA)<br />
                Criadora do Método Le Mater
              </div>
            </div>
          </LiquidCard>
        </div>
      </div>
      <Ticker />
    </section>
  );
}

function Ticker() {
  const items = ["Pré-Natal", "Parto Humanizado", "Cuidados Neonatais", "Carteira Digital da Gestante", "Pós-Parto", "Amamentação", "UTI Neonatal", "UNAERP"];
  const all = [...items, ...items];
  return (
    <div style={{ background: c.sageDark, color: "white", padding: "12px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: "inline-flex", animation: "ticker 30s linear infinite" }}>
        {all.map((it, i) => (
          <span key={i} style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 32px", opacity: 0.7 }}>
            {it} <strong style={{ opacity: 1, color: c.sageLight }}>/</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function Sobre() {
  const paragrafos = [
    "Rayssa Leslie é Enfermeira Pós-Graduada em Obstetrícia e Neonatologia, especialista em ACLS pelo American Heart Association (AHA) e Certificada pela ALSO (Advanced Life Support in Obstetrics).",
    "Com mais de 10 anos de experiência clínica em Saúde da Mulher, Obstetrícia e Cuidado Neonatal, desenvolveu o Método Le Mater, uma abordagem que une conhecimento técnico, inovação tecnológica, educação materna e cuidado especializado para acompanhar mulheres da concepção aos primeiros cuidados com o bebê.",
    "Sua trajetória profissional inclui atuação em ambientes hospitalares de média e alta complexidade, com foco em segurança do paciente, humanização da assistência, parto seguro, cuidado neonatal e protocolos baseados em evidências.",
    "Como Enfermeira Obstetra Senior III no Hospital Regional da Baixada Santista, participou de ações estratégicas voltadas à qualificação da assistência obstétrica, fortalecimento do parto seguro, promoção do parto normal e melhoria de indicadores materno-infantis.",
    "Também atuou no Centro de Estudos e Pesquisas Dr. João Amorim — CEJAM, com participação ativa na assistência direta e na construção de protocolos relacionados ao Programa Parto Seguro Paulista, na capital paulista.",
    "Além da atuação em saúde materna, Rayssa Leslie é fundadora da Clínica de Estética Leslie, Pós-Graduada em Estética Avançada pelo Centro de Referência Estético NEPUGA, ampliando sua atuação para o autocuidado feminino, estética avançada e recuperação no pós-parto.",
    "A Clínica de Estética Leslie nasce com uma linha de cuidados voltada especialmente para gestantes e mulheres no pós-parto, integrando estética, bem-estar, acolhimento, recuperação corporal e respeito às necessidades de cada fase da maternidade.",
    "A partir dessa vivência prática, Rayssa criou o Método Le Mater, transformando sua experiência clínica em uma jornada de inovação no cuidado materno, com orientação profissional, educação, tecnologia e acolhimento.",
  ];
  const formacoes = [
    "Enfermeira Pós-Graduada em Obstetrícia",
    "Enfermeira Pós-Graduada em Neonatologia",
    "Pós-Graduada em Estética Avançada pela NEPUGA",
    "ACLS — Advanced Cardiovascular Life Support — American Heart Association",
    "ALSO — Advanced Life Support in Obstetrics",
    "Especialização em PICC",
    "Criadora do Método Le Mater",
    "Fundadora da Clínica de Estética Leslie",
  ];
  return (
    <section style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 60, padding: "80px 48px", flexWrap: "wrap" }}>
        <div style={{ flex: "0 1 380px", position: "sticky", top: 100, alignSelf: "flex-start" }}>
          <img
            src={rayssa}
            alt="Rayssa Leslie, Enfermeira Pós Graduada em Obstetrícia"
            style={{ width: "100%", borderRadius: 4, display: "block", boxShadow: "0 20px 60px -20px rgba(0,0,0,0.25)" }}
          />
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${c.border}` }}>
            <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 20, color: c.ink, marginBottom: 16 }}>
              Formação e Qualificações
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {formacoes.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.sage, flexShrink: 0 }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ flex: "1 1 420px" }}>
          <SectionTag text="Sobre Rayssa Leslie" />
          <h2 className="text-2xl" style={{ ...h2, fontSize: undefined, whiteSpace: "nowrap" }}>
            Experiência clínica que <em style={{ fontStyle: "italic", color: c.sage }}>transforma</em> o cuidado materno.
          </h2>
          {paragrafos.map((p, i) => (
            <p key={i} style={{ ...sectionP, fontSize: 15, maxWidth: "none", marginBottom: 18, textAlign: "justify", hyphens: "auto" }}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

type Momento = {
  num: string;
  categoria: string;
  titulo: string;
  texto: string;
  conteudoGratuito: string;
  rotaGratuita: string;
  caminhoRecomendado: string;
  rotaPrograma: string;
  dark?: boolean;
};

const MOMENTOS: Momento[] = [
  {
    num: "01",
    categoria: "Concepção",
    titulo: "Estou tentando engravidar",
    texto: "Entenda seu ciclo, sua janela fértil e os sinais reais do corpo antes de depender apenas de aplicativos.",
    conteudoGratuito: "Guia gratuito: 7 sinais de que você pode estar errando sua janela fértil",
    rotaGratuita: "/atlas-materno/concepcao",
    caminhoRecomendado: "Ajuda na Concepção Le Mater",
    rotaPrograma: "/programas/concepcao",
  },
  {
    num: "02",
    categoria: "Gestação",
    titulo: "Estou grávida",
    texto: "Organize os primeiros passos da gestação, entenda exames, consultas e sinais importantes de acompanhamento.",
    conteudoGratuito: "Mapa gratuito: primeiros passos depois do positivo",
    rotaGratuita: "/atlas-materno/gestacao",
    caminhoRecomendado: "Programa Gestação Le Mater",
    rotaPrograma: "/programas/gestacao",
  },
  {
    num: "03",
    categoria: "Puerpério",
    titulo: "Estou no pós-parto",
    texto: "Cuide da recuperação, da saúde emocional, da adaptação materna e dos sinais importantes dessa fase.",
    conteudoGratuito: "Checklist gratuito: cuidados essenciais no puerpério",
    rotaGratuita: "/atlas-materno/pos-parto",
    caminhoRecomendado: "Pós-Parto Le Mater",
    rotaPrograma: "/programas/pos-parto",
  },
  {
    num: "04",
    categoria: "Bebê e primeiros cuidados",
    titulo: "Quero cuidar melhor do bebê",
    texto: "Receba orientações simples sobre banho, amamentação, sono, cólicas, rotina e primeiros cuidados neonatais.",
    conteudoGratuito: "Guia gratuito: primeiros cuidados com o recém-nascido",
    rotaGratuita: "/atlas-materno/bebe",
    caminhoRecomendado: "Bebê e Primeiros Cuidados Le Mater",
    rotaPrograma: "/programas/bebe-primeiros-cuidados",
    dark: true,
  },
];

function MomentoCard({ m }: { m: Momento }) {
  const [hover, setHover] = useState(false);
  const isDark = m.dark || hover;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isDark ? c.sageDark : c.warm,
        padding: 40,
        transition: "background .3s",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontFamily: serif, fontSize: 64, fontWeight: 300, color: isDark ? "rgba(255,255,255,0.18)" : c.border, lineHeight: 1, marginBottom: 16 }}>
        {m.num}
      </div>
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? c.sageLight : c.sage, marginBottom: 14, fontWeight: 500 }}>
        {m.categoria}
      </div>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: isDark ? "white" : c.ink, marginBottom: 14, lineHeight: 1.15 }}>
        {m.titulo}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: isDark ? "rgba(255,255,255,0.75)" : c.muted, marginBottom: 24 }}>
        {m.texto}
      </p>
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : c.border}`, paddingTop: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 8 }}>
          Conteúdo gratuito
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: isDark ? "white" : c.ink, fontWeight: 400 }}>
          {m.conteudoGratuito}
        </div>
      </div>
      <a href={m.rotaGratuita} style={{ textDecoration: "none", marginBottom: 24 }}>
        <button style={{
          background: isDark ? "white" : c.sageDark,
          color: isDark ? c.sageDark : "white",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "14px 24px",
          border: "none",
          cursor: "pointer",
          fontFamily: sans,
          width: "100%",
        }}>
          Acessar conteúdo gratuito
        </button>
      </a>
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 8, fontStyle: "italic", fontFamily: serif }}>
          Caminho recomendado: {m.caminhoRecomendado}
        </div>
        <a href={m.rotaPrograma} style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: isDark ? "white" : c.sageDark,
          textDecoration: "none",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.5)" : c.sageDark}`,
          paddingBottom: 2,
          display: "inline-block",
          fontWeight: 500,
        }}>
          Ver caminho completo
        </a>
      </div>
    </div>
  );
}

function Produtos() {
  const isMobile = useIsMobile();
  return (
    <section style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ padding: isMobile ? "60px 24px" : "80px 48px" }}>
        <div style={{ marginBottom: 48, maxWidth: "100%" }}>
          <SectionTag text="ATLAS MATERNO" />
          <h2 style={{ ...h2, whiteSpace: "nowrap", fontSize: "clamp(20px, 2.2vw, 32px)" }}>
            Quatro fases. <em style={{ fontStyle: "italic", color: c.sage }}>Uma jornada completa.</em>
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: c.muted, fontWeight: 300, marginTop: 8, whiteSpace: "nowrap" }}>
            Escolha seu momento, acesse um conteúdo gratuito e descubra o caminho Le Mater recomendado para você.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 2 }}>
          {MOMENTOS.map((m) => <MomentoCard key={m.num} m={m} />)}
        </div>
        <div style={{ marginTop: 2, background: c.warm, padding: isMobile ? "36px 28px" : "48px 56px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sage, marginBottom: 14, fontWeight: 500 }}>
            Plano completo
          </div>
          <div style={{ fontFamily: serif, fontSize: isMobile ? 28 : 34, fontWeight: 400, color: c.ink, marginBottom: 14 }}>
            Plano Completo Le Mater
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: c.muted, maxWidth: 620, marginBottom: 28, fontWeight: 300 }}>
            Para quem deseja acesso aos principais conteúdos da jornada materna, organização digital, carteira da gestante e recomendações inteligentes por fase.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 32, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
            {["Conteúdos por fase", "Carteira digital da gestante", "Recomendações inteligentes"].map((b, i, arr) => (
              <div key={b} style={{
                flex: isMobile ? "1 1 100%" : "1 1 0",
                padding: "20px 24px",
                fontSize: 13,
                color: c.ink,
                fontWeight: 400,
                letterSpacing: "0.02em",
                borderRight: !isMobile && i < arr.length - 1 ? `1px solid ${c.border}` : "none",
                borderBottom: isMobile && i < arr.length - 1 ? `1px solid ${c.border}` : "none",
              }}>
                {b}
              </div>
            ))}
          </div>
          <a href="/planos/completo" style={{ textDecoration: "none" }}>
            <button style={{ ...btnPrimary, whiteSpace: "nowrap" }}>Conhecer plano completo</button>
          </a>
          <p style={{ fontSize: 12, color: c.muted, marginTop: 20, fontStyle: "italic", fontFamily: serif, maxWidth: 560 }}>
            Ideal para quem quer uma experiência materna mais organizada, do início da jornada aos primeiros cuidados com o bebê.
          </p>
        </div>
      </div>
    </section>
  );
}

function Contato() {
  return (
    <section style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px", textAlign: "center" }}>
        <SectionTag text="Fale conosco" center />
        <h2 style={{ ...h2, maxWidth: 600, margin: "0 auto 24px" }}>
          Pronta para começar<br />
          <em style={{ fontStyle: "italic", color: c.sage }}>sua jornada?</em>
        </h2>
        <p style={{ ...sectionP, textAlign: "center", margin: "0 auto 48px" }}>
          Entre em contato ou acesse o sistema para iniciar seu acompanhamento com a Rayssa Leslie.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={btnPrimary}>Agendar Consulta</button>
          <button style={btnSecondary}>Acessar Sistema</button>
        </div>
        <div style={{ display: "flex", gap: 36, marginTop: 60, paddingTop: 40, borderTop: `1px solid ${c.border}`, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            ["Localização", "Ribeirão Preto, SP"],
            ["Email", "contato@lemater.com"],
            ["Parceria", "UNAERP"],
            ["Disponível em", "PT · ES · EN"],
          ].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 8 }}>{l}</div>
              <div style={{ fontFamily: serif, fontSize: 18 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${c.border}`, fontSize: 11, color: c.muted, letterSpacing: "0.06em", flexWrap: "wrap", gap: 16 }}>
      <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 300, color: c.ink, letterSpacing: "0.06em" }}>
        Le<span style={{ color: c.sage }}>Mater</span>
      </div>
      <div>© 2024 · Rayssa Leslie · Todos os direitos reservados</div>
      <div>A gestação que você merece viver.</div>
    </footer>
  );
}
