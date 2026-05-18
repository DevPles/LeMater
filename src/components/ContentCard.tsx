import { useState, type CSSProperties, type ReactNode } from "react";

const c = {
  cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageLight: "#8AB89A",
  sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

export type ContentCardProps = {
  numero: string;
  categoria?: string | null;
  badge?: { label: string; color?: string } | null;
  titulo: string;
  descricao?: string | null;
  capa_url?: string | null;
  metaLabel?: string | null;    // ex: "Formato", "Aulas"
  metaValor?: string | null;    // ex: "PDF", "12 aulas · 3h"
  precoLabel?: string | null;   // ex: "R$ 197"
  precoTituloLabel?: string | null; // ex: "Investimento"
  ctaLabel: string;
  onAction: () => void;
  forceDark?: boolean;
  extra?: ReactNode;
};

export function ContentCard(p: ContentCardProps) {
  const [hover, setHover] = useState(false);
  const isDark = !!p.forceDark || hover;
  const badgeColor = p.badge?.color ?? c.sage;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isDark ? c.sageDark : c.warm,
        padding: 24, transition: "background .3s",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
        cursor: "pointer",
      }}
      onClick={p.onAction}
    >
      {p.capa_url && (
        <div style={{ marginBottom: 14, marginLeft: -24, marginRight: -24, marginTop: -24 }}>
          <img src={p.capa_url} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ fontFamily: serif, fontSize: 40, fontWeight: 300, color: isDark ? "rgba(255,255,255,0.18)" : c.border, lineHeight: 1 }}>{p.numero}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {p.badge && (
            <span style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "white", background: badgeColor, padding: "3px 8px", fontWeight: 600 }}>
              {p.badge.label}
            </span>
          )}
          {p.categoria && (
            <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? c.sageLight : c.sage, fontWeight: 500 }}>
              {p.categoria}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, color: isDark ? "white" : c.ink, marginBottom: 8, lineHeight: 1.2 }}>
        {p.titulo}
      </div>
      {p.descricao && (
        <p style={{ fontSize: 13, lineHeight: 1.55, color: isDark ? "rgba(255,255,255,0.75)" : c.muted, marginBottom: 16 }}>
          {p.descricao}
        </p>
      )}
      {(p.metaLabel || p.precoLabel) && (
        <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : c.border}`, paddingTop: 16, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          {p.metaLabel && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 4 }}>{p.metaLabel}</div>
              <div style={{ fontSize: 14, color: isDark ? "white" : c.ink }}>{p.metaValor}</div>
            </div>
          )}
          {p.precoLabel && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 4 }}>{p.precoTituloLabel ?? "Investimento"}</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: isDark ? "white" : c.sageDark }}>{p.precoLabel}</div>
            </div>
          )}
        </div>
      )}
      {p.extra}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); p.onAction(); }}
        style={{
          background: isDark ? "white" : c.sageDark, color: isDark ? c.sageDark : "white",
          fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
          padding: "14px 24px", border: "none", cursor: "pointer", fontFamily: sans,
          width: "100%", marginTop: "auto",
        } as CSSProperties}
      >
        {p.ctaLabel}
      </button>
    </div>
  );
}
