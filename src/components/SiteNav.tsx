import { Link } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import lemateLogo from "@/assets/lemater-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

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
