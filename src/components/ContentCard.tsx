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
        padding: 14, transition: "background .3s",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
        cursor: "pointer",
      }}
      onClick={p.onAction}
    >
      {p.capa_url && (
        <div style={{ marginBottom: 10, marginLeft: -14, marginRight: -14, marginTop: -14 }}>
          <img src={p.capa_url} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
        <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 300, color: isDark ? "rgba(255,255,255,0.18)" : c.border, lineHeight: 1 }}>{p.numero}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          {p.badge && (
            <span style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "white", background: badgeColor, padding: "2px 6px", fontWeight: 600 }}>
              {p.badge.label}
            </span>
          )}
          {p.categoria && (
            <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? c.sageLight : c.sage, fontWeight: 500 }}>
              {p.categoria}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 400, color: isDark ? "white" : c.ink, marginBottom: 4, lineHeight: 1.2 }}>
        {p.titulo}
      </div>
      {p.descricao && (
        <p style={{ fontSize: 11.5, lineHeight: 1.45, color: isDark ? "rgba(255,255,255,0.75)" : c.muted, marginBottom: 10 }}>
          {p.descricao}
        </p>
      )}
      {p.extra}
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : c.border}`, paddingTop: 10, marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          {p.metaLabel && (
            <>
              <div style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : c.muted }}>{p.metaLabel}</div>
              <div style={{ fontSize: 11.5, color: isDark ? "white" : c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.metaValor}</div>
            </>
          )}
          {p.precoLabel && (
            <div style={{ fontFamily: serif, fontSize: 15, color: isDark ? "white" : c.sageDark, marginTop: p.metaLabel ? 4 : 0 }}>{p.precoLabel}</div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); p.onAction(); }}
          style={{
            background: isDark ? "white" : c.sageDark, color: isDark ? c.sageDark : "white",
            fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: sans,
            whiteSpace: "nowrap", flexShrink: 0,
          } as CSSProperties}
        >
          {p.ctaLabel}
        </button>
      </div>

    </div>
  );
}
