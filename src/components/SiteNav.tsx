import { Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import lemateLogo from "@/assets/logo_oficial.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLang, type Lang } from "@/lib/translate.context";

const c = {
  cream: "#FAF5EE",
  sage: "#5C8A6E",
  sageDark: "#2D5A42",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
};
const sans = "'DM Sans', sans-serif";

// Mesmos itens do header da home. "ATLAS MATERNO" é a página única de conteúdos.
const NAV_ITEMS: ReadonlyArray<{ label: string; to: string; search?: Record<string, string> }> = [
  { label: "Início", to: "/" },
  { label: "Sobre", to: "/", search: { s: "sobre" } },
  { label: "ATLAS MATERNO", to: "/cursos" },
  { label: "Contato", to: "/", search: { s: "contato" } },
];

export function SiteNav() {
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

  const linkStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: c.muted,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: sans,
    textDecoration: "none",
  };
  const entrarBtn: CSSProperties = {
    background: `linear-gradient(135deg, ${c.sageDark} 0%, ${c.sage} 100%)`,
    color: "white",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "12px 24px",
    border: "1.5px solid transparent",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: sans,
    boxShadow: "4px 4px 10px rgba(120, 100, 70, 0.25), -4px -4px 10px rgba(255, 250, 240, 0.95)",
  };

  return (
    <>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "16px 20px" : "20px 48px" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src={lemateLogo} alt="Le Mater" style={{ height: isMobile ? 40 : 52, width: "auto", display: "block" }} />
          </Link>
          {!isMobile && (
            <ul style={{ display: "flex", gap: 32, listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} search={item.search as any} style={linkStyle}>{item.label}</Link>
                </li>
              ))}
              <li data-no-translate style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  aria-label="Selecionar país e idioma"
                  aria-expanded={langOpen}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${c.border}`, borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontFamily: sans, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: c.ink }}
                >
                  <img src={`https://flagcdn.com/w40/${currentFlag.code}.png`} srcSet={`https://flagcdn.com/w80/${currentFlag.code}.png 2x`} alt={currentFlag.code.toUpperCase()} style={{ width: 22, height: 16, objectFit: "cover", borderRadius: 2, display: "block" }} />
                  <span>{currentFlag.target.toUpperCase()}</span>
                </button>
                {langOpen && (
                  <>
                    <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
                    <ul style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 201, listStyle: "none", margin: 0, padding: 6, background: c.cream, border: `1px solid ${c.border}`, borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 200 }}>
                      {LANG_OPTIONS.map((opt) => {
                        const isActive = opt.target === lang;
                        return (
                          <li key={opt.code}>
                            <button type="button" onClick={() => { setLang(opt.target); setLangOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", background: isActive ? c.warm : "transparent", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: sans, fontSize: 13, color: c.ink, textAlign: "left" }}>
                              <img src={`https://flagcdn.com/w40/${opt.code}.png`} srcSet={`https://flagcdn.com/w80/${opt.code}.png 2x`} alt={opt.code.toUpperCase()} style={{ width: 24, height: 18, objectFit: "cover", borderRadius: 2, display: "block" }} />
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
              <button style={entrarBtn}>ENTRAR</button>
            </Link>
          ) : (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menu"
              style={{ width: 40, height: 40, background: "transparent", border: `1px solid ${c.border}`, borderRadius: 999, cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 5 }}
            >
              <span style={{ width: 18, height: 1.5, background: c.ink, transform: open ? "translateY(3px) rotate(45deg)" : "none", transition: "all 300ms ease" }} />
              <span style={{ width: 18, height: 1.5, background: c.ink, transform: open ? "translateY(-3px) rotate(-45deg)" : "none", transition: "all 300ms ease" }} />
            </button>
          )}
        </div>
      </nav>

      {isMobile && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(20, 20, 20, 0.45)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 300ms ease", zIndex: 200 }}
          />
          <div
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "82%", maxWidth: 340,
              background: c.cream,
              transform: open ? "translateX(0)" : "translateX(100%)",
              transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 210, display: "flex", flexDirection: "column",
              boxShadow: open ? "-20px 0 40px rgba(0,0,0,0.12)" : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 20px 0" }}>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                style={{ width: 40, height: 40, background: "transparent", border: `1px solid ${c.border}`, borderRadius: 999, cursor: "pointer", fontFamily: sans, fontSize: 18, color: c.ink, lineHeight: 1 }}
              >×</button>
            </div>
            <div style={{ padding: "20px 28px 24px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: c.muted, textTransform: "uppercase", marginBottom: 20 }}>
                Navegação
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {NAV_ITEMS.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      search={item.search as any}
                      onClick={() => setOpen(false)}
                      style={{ display: "block", width: "100%", padding: "16px 0", borderBottom: `1px solid ${c.border}`, fontFamily: sans, fontSize: 14, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: c.ink, textDecoration: "none", textAlign: "left" }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: "auto", padding: "0 28px 32px" }}>
              <Link to="/login" style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
                <button style={{ ...entrarBtn, width: "100%" }}>ENTRAR</button>
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
