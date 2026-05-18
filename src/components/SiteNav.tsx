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

const NAV_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ["inicio", "Início"],
  ["sobre", "Sobre"],
  ["produtos", "ATLAS MATERNO"],
  ["contato", "Contato"],
];

export function SiteNav() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const linkStyle: CSSProperties = {
    fontSize: isMobile ? 15 : 13,
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: c.muted,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: isMobile ? "12px 0" : 0,
    fontFamily: sans,
    textDecoration: "none",
    display: "block",
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
  };
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "16px 20px" : "20px 48px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src={lemateLogo} alt="Le Mater" style={{ height: isMobile ? 40 : 52, width: "auto", display: "block" }} />
        </Link>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
            {NAV_ITEMS.map(([id, label]) => (
              <li key={id}><Link to="/" search={{ s: id } as any} style={linkStyle}>{label}</Link></li>
            ))}
            <li><Link to="/cursos" style={linkStyle}>Cursos</Link></li>
            <li><Link to="/conteudos-gratis" style={linkStyle}>Grátis</Link></li>
          </ul>
        )}
        {!isMobile ? (
          <Link to="/login" style={{ textDecoration: "none" }}>
            <button style={entrarBtn}>ENTRAR</button>
          </Link>
        ) : (
          <button onClick={() => setOpen((v) => !v)} aria-label="Abrir menu" style={{ background: "none", border: `1px solid ${c.border}`, color: c.ink, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 14px", cursor: "pointer", fontFamily: sans }}>
            {open ? "Fechar" : "Menu"}
          </button>
        )}
      </div>
      {isMobile && open && (
        <div style={{ padding: "8px 20px 20px", borderTop: `1px solid ${c.border}`, display: "flex", flexDirection: "column" }}>
          {NAV_ITEMS.map(([id, label]) => (
            <Link key={id} to="/" search={{ s: id } as any} style={{ ...linkStyle, textAlign: "left", borderBottom: `1px solid ${c.border}` }}>{label}</Link>
          ))}
          <Link to="/cursos" style={{ ...linkStyle, textAlign: "left", borderBottom: `1px solid ${c.border}` }}>Cursos</Link>
          <Link to="/conteudos-gratis" style={{ ...linkStyle, textAlign: "left", borderBottom: `1px solid ${c.border}` }}>Grátis</Link>
          <Link to="/login" style={{ textDecoration: "none", marginTop: 16 }}>
            <button style={{ ...entrarBtn, width: "100%" }}>ENTRAR</button>
          </Link>
        </div>
      )}
    </nav>
  );
}
