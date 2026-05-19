import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import rayssa from "@/assets/rayssa-portrait.jpg";
import lemateLogo from "@/assets/logo_oficial.png";
import appStoresBadges from "@/assets/app-stores.png";
import appIcon from "@/assets/app-icon.png";
import { LiquidCard } from "@/components/LiquidCard";
import { InstagramIcon, YouTubeIcon, TikTokIcon, HotmartIcon, KiwifyIcon, TeachableIcon, SpotifyIcon } from "@/components/SocialIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { translateBatch } from "@/lib/translate.functions";
import { useLang, FLAG_TO_LANG, isTranslatable, type Lang } from "@/lib/translate.context";

export const Route = createFileRoute("/")({
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
  const { lang, setLang } = useLang();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = new URLSearchParams(window.location.search).get("s");
    if (s === "produtos") {
      window.location.href = "/atlas";
      return;
    }
    if (s === "inicio" || s === "sobre" || s === "produtos" || s === "contato") {
      setActive(s);
      window.scrollTo(0, 0);
    }
  }, []);

  const go = (id: SectionId) => {
    if (id === "produtos") {
      window.location.href = "/atlas";
      return;
    }
    setActive(id);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  return (
    <div 
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
    </div>
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
    <>
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
        <div
          onClick={() => handleGo("inicio")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <img
            src={lemateLogo}
            alt="Le Mater"
            style={{ height: isMobile ? 40 : 52, width: "auto", display: "block" }}
          />
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
          <Link to="/login" style={{ textDecoration: "none" }}>
            <button style={btnPrimary}>
              ENTRAR
            </button>
          </Link>
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
            style={{
              position: "relative",
              width: 44,
              height: 44,
              background: open ? c.sageDark : "transparent",
              border: `1px solid ${open ? c.sageDark : c.border}`,
              borderRadius: 999,
              cursor: "pointer",
              transition: "all 300ms ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 18,
                height: 1.5,
                background: open ? "white" : c.ink,
                transform: open ? "translateY(3px) rotate(45deg)" : "none",
                transition: "all 300ms ease",
              }}
            />
            <span
              style={{
                width: 18,
                height: 1.5,
                background: open ? "white" : c.ink,
                transform: open ? "translateY(-3px) rotate(-45deg)" : "none",
                transition: "all 300ms ease",
              }}
            />
          </button>
        )}
      </div>
    </nav>
    {isMobile && (
      <>
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20, 20, 20, 0.45)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 300ms ease",
            zIndex: 200,
          }}
        />
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "82%",
            maxWidth: 340,
            background: "#faf5ee",
            transform: open ? "translateX(0)" : "translateX(100%)",
            transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 210,
            display: "flex",
            flexDirection: "column",
            boxShadow: open ? "-20px 0 40px rgba(0,0,0,0.12)" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 20px 0" }}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              style={{
                width: 40,
                height: 40,
                background: "transparent",
                border: `1px solid ${c.border}`,
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: sans,
                fontSize: 18,
                color: c.ink,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: "20px 28px 24px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", marginBottom: 20 }}>
              Navegação
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {NAV_ITEMS.map(([id, label]) => (
                <li key={id}>
                  <button
                    onClick={() => handleGo(id)}
                    style={{
                      width: "100%",
                      padding: "16px 0",
                      background: "none",
                      border: "none",
                      borderBottom: `1px solid ${c.border}`,
                      cursor: "pointer",
                      fontFamily: sans,
                      fontSize: 14,
                      fontWeight: 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: active === id ? c.sageDark : c.ink,
                      textAlign: "left",
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: "auto", padding: "0 28px 32px" }}>
            <Link to="/login" style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
              <button style={{ ...btnPrimary, width: "100%" }}>ENTRAR</button>
            </Link>
            <div style={{ marginTop: 20, fontSize: 11, color: c.muted, letterSpacing: "0.08em", textAlign: "center" }}>
              contato@lemater.com
            </div>
          </div>
        </div>
      </>
    )}
    </>
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
  background: `linear-gradient(135deg, ${c.sageDark} 0%, ${c.sage} 100%)`,
  color: "white",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  padding: "12px 24px",
  border: "1.5px solid transparent",
  borderRadius: 8,
  boxShadow: "4px 4px 10px rgba(120, 100, 70, 0.25), -4px -4px 10px rgba(255, 250, 240, 0.95)",
  cursor: "pointer",
  fontFamily: sans,
};

const btnSecondary: CSSProperties = {
  background: `linear-gradient(135deg, ${c.sageDark} 0%, ${c.sage} 100%)`,
  color: "white",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  padding: "12px 24px",
  border: "1.5px solid transparent",
  borderRadius: 8,
  boxShadow: "4px 4px 10px rgba(120, 100, 70, 0.25), -4px -4px 10px rgba(255, 250, 240, 0.95)",
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
            Criada pela Enfermeira Obstetra Rayssa Leslie, a Le Mater é um ecossistema tecnológico de Cuidado Materno que integra Educação, Orientação Profissional, Carteira Digital da Gestante e Acompanhamento da tentativa de engravidar ao Pós-Parto.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", width: isMobile ? "100%" : "auto" }}>
            <Link to="/atlas" style={{ textDecoration: "none" }}>
              <button style={btnPrimary}>ATLAS MATERNO</button>
            </Link>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 48, paddingTop: 32, borderTop: `1px solid ${c.border}`, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", width: "100%" }}>
            {[
              { num: "+10", lbl: "Anos em obstetrícia" },
              { flags: ["br", "es", "us"] as string[], lbl: "Atuação em 3 países" },
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
            <div style={{ textAlign: isMobile ? "center" : "left", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
              <div style={{ height: 38, display: "flex", alignItems: "center", gap: 10, justifyContent: isMobile ? "center" : "flex-start" }}>
                <img src={appIcon} alt="Le Mater App" style={{ width: 36, height: 36, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" style={{ lineHeight: 0 }}>
                    <img src={appStoresBadges} alt="Baixe nas lojas" style={{ height: 44, width: "auto", display: "block" }} />
                  </a>
                </div>
              </div>
              <div style={{ fontSize: 10, color: c.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 6 }}>Baixar aplicativo</div>
            </div>
            <div style={{ textAlign: isMobile ? "center" : "left", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
              <div style={{ height: 38, display: "flex", alignItems: "center", gap: 8, justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap" }}>
                {[
                  { Icon: InstagramIcon, href: "https://www.instagram.com/aleslierayssa", label: "Instagram" },
                  { Icon: YouTubeIcon, href: "https://youtube.com/@lemateroficial", label: "YouTube" },
                  { Icon: TikTokIcon, href: "https://www.tiktok.com/@lematerbr", label: "TikTok" },
                  { Icon: HotmartIcon, href: "https://hotmart.com", label: "Hotmart" },
                  { Icon: KiwifyIcon, href: "https://kiwify.com.br", label: "Kiwify" },
                  { Icon: TeachableIcon, href: "https://teachable.com", label: "Teachable" },
                ].map(({ Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} style={{ lineHeight: 0, display: "inline-flex", transition: "transform 150ms, opacity 150ms", opacity: 0.92 }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.opacity = "0.92"; }}>
                    <Icon size={26} />
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 10, color: c.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 6 }}>Redes Sociais & Plataformas</div>
            </div>

          </div>
        </div>
        <div style={{ flex: "0 1 360px", background: c.warm, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden", padding: isMobile ? 16 : 24, minHeight: isMobile ? 300 : 400, alignSelf: "center", borderRadius: 16, width: isMobile ? "calc(100% - 40px)" : undefined, marginInline: isMobile ? 20 : undefined, marginBottom: isMobile ? 24 : undefined }}>
          <img
            src={rayssa}
            alt="Rayssa Leslie, Enfermeira Pós Graduada em Obstetricia"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
          <LiquidCard bgOpacity={0} style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10, position: "relative", zIndex: 2, background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", backdropFilter: "blur(8px) saturate(180%) contrast(110%)", WebkitBackdropFilter: "blur(8px) saturate(180%) contrast(110%)", borderColor: "rgba(255,255,255,0.18)", boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.2), 0 8px 24px -14px rgba(0,0,0,0.18)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f2e22", textShadow: "0 1px 3px rgba(255,255,255,0.95), 0 0 12px rgba(255,255,255,0.7)" }}>Rayssa Leslie</div>
                <div style={{ background: c.sageDark, color: "white", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>★ 5.0</div>
              </div>
              <div style={{ fontSize: 10.5, color: "#0f2e22", lineHeight: 1.5, fontWeight: 700, textShadow: "0 1px 3px rgba(255,255,255,0.95), 0 0 10px rgba(255,255,255,0.7)" }}>
                <span className="lm-desktop-only">Enfermeira Pós Graduada em Obstetricia</span>
                <span className="lm-mobile-only">Pós Graduada em Obstetricia</span><br />
                <span className="lm-desktop-only">Enfermeira Pós Graduada em Neonatologista</span>
                <span className="lm-mobile-only">Pós Graduada em Neonatologista</span><br />
                <span className="lm-desktop-only">Especialista ACLS American Heart Association (AHA)</span>
                <span className="lm-mobile-only">ACLS American Heart Association (AHA)</span><br />
                Criadora do Método Le Mater<br />
                Fundadora da Le Mater Estética
              </div>
              <style>{`
                .lm-mobile-only { display: none; }
                @media (max-width: 767px) {
                  .lm-desktop-only { display: none; }
                  .lm-mobile-only { display: inline; }
                }
              `}</style>
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
    "Rayssa Leslie é Enfermeira Brasileira Pós-Graduada em Obstetrícia e Neonatologia, especialista em ACLS American Heart Association (AHA) e Certificada pela ALSO (Advanced Life Support in Obstetrics).",
    "Com mais de 10 anos de experiência clínica em Saúde da Mulher, Obstetrícia e Cuidado Neonatal, desenvolveu o Método Le Mater, uma abordagem que une conhecimento técnico, inovação tecnológica, educação materna e cuidado especializado para acompanhar mulheres da concepção aos primeiros cuidados com o bebê.",
    "Sua trajetória profissional inclui atuação em ambientes hospitalares de média e alta complexidade, com foco em segurança do paciente, humanização da assistência, parto seguro, cuidado neonatal e protocolos baseados em evidências.",
    "Como Enfermeira Obstetra Senior III no Hospital Regional da Baixada Santista, participou de ações estratégicas voltadas à qualificação da assistência obstétrica, fortalecimento do parto seguro, promoção do parto normal e melhoria de indicadores materno-infantis.",
    "Também atuou no Centro de Estudos e Pesquisas Dr. João Amorim — CEJAM, com participação ativa na assistência direta e na construção de protocolos relacionados ao Programa Parto Seguro Paulista, na capital paulista.",
    "Além da atuação em saúde materna, Rayssa Leslie é fundadora da Le Mater Estética, Pós-Graduada em Estética Avançada pelo Centro de Referência Estético NEPUGA, ampliando sua atuação para o autocuidado feminino, estética avançada e recuperação no pós-parto.",
    "A Le Mater Estética nasce com uma linha de cuidados voltada especialmente para gestantes e mulheres no pós-parto, integrando estética, bem-estar, acolhimento, recuperação corporal e respeito às necessidades de cada fase da maternidade.",
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
    "Fundadora da Le Mater Estética",
  ];
  const isMobile = useIsMobile();
  return (
    <section style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 32 : 60, padding: isMobile ? "40px 20px" : "80px 48px", flexWrap: "wrap" }}>
        <div style={{ flex: "0 1 380px", position: isMobile ? "static" : "sticky", top: 100, alignSelf: "flex-start", width: isMobile ? "100%" : undefined }}>
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
        <div style={{ flex: "1 1 420px", minWidth: 0, width: isMobile ? "100%" : undefined }}>
          <SectionTag text="Sobre Rayssa Leslie" />
          <h2 style={{ ...h2, fontSize: isMobile ? 26 : undefined }}>
            Experiência clínica que <em style={{ fontStyle: "italic", color: c.sage }}>transforma</em> o cuidado materno.
          </h2>
          {paragrafos.map((p, i) => (
            <p key={i} style={{ ...sectionP, fontSize: 15, maxWidth: "none", marginBottom: 18, textAlign: "justify", hyphens: "auto", overflowWrap: "break-word" }}>{p}</p>
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
    rotaGratuita: "/atlas",
    caminhoRecomendado: "Ajuda na Concepção Le Mater",
    rotaPrograma: "/programas/concepcao",
  },
  {
    num: "02",
    categoria: "Gestação",
    titulo: "Estou grávida",
    texto: "Organize os primeiros passos da gestação, entenda exames, consultas e sinais importantes de acompanhamento.",
    conteudoGratuito: "Mapa gratuito: primeiros passos depois do positivo",
    rotaGratuita: "/atlas",
    caminhoRecomendado: "Programa Gestação Le Mater",
    rotaPrograma: "/programas/gestacao",
  },
  {
    num: "03",
    categoria: "Puerpério",
    titulo: "Estou no pós-parto",
    texto: "Cuide da recuperação, da saúde emocional, da adaptação materna e dos sinais importantes dessa fase.",
    conteudoGratuito: "Checklist gratuito: cuidados essenciais no puerpério",
    rotaGratuita: "/atlas",
    caminhoRecomendado: "Pós-Parto Le Mater",
    rotaPrograma: "/programas/pos-parto",
  },
  {
    num: "04",
    categoria: "Bebê e primeiros cuidados",
    titulo: "Quero cuidar melhor do bebê",
    texto: "Receba orientações simples sobre banho, amamentação, sono, cólicas, rotina e primeiros cuidados neonatais.",
    conteudoGratuito: "Guia gratuito: primeiros cuidados com o recém-nascido",
    rotaGratuita: "/atlas",
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
        <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : c.muted, fontStyle: "italic", fontFamily: serif }}>
          Caminho recomendado: {m.caminhoRecomendado}
        </div>
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
            Escolha seu momento, acesse um conteúdo.
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
  const isMobile = useIsMobile();
  return (
    <footer
      style={{
        padding: isMobile ? "28px 24px" : "32px 48px",
        marginTop: 0,
        background: c.cream,
        borderTop: `1px solid ${c.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <img src={lemateLogo} alt="Le Mater" style={{ height: 28, width: "auto" }} />
          <span style={{ fontSize: 12, color: c.muted, letterSpacing: "0.06em" }}>
            © 2024 · Le Mater
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: c.muted, flexWrap: "wrap" }}>
          <span>contato@lemater.com</span>
          <span>Brasil, o país do parto saudável</span>
          <span>​</span>
          <span>​</span>
        </div>
      </div>
    </footer>
  );
}
