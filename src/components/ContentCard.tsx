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
  capa_video_url?: string | null;
  metaLabel?: string | null;    // ex: "Formato", "Aulas"
  metaValor?: string | null;    // ex: "PDF", "12 aulas · 3h"
  precoLabel?: string | null;   // ex: "R$ 197"
  precoTituloLabel?: string | null; // ex: "Investimento"
  ctaLabel: string;
  ctaIcon?: "cart" | "cart-check" | null;
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
      {(p.capa_video_url || p.capa_url) && (
        <div style={{ marginBottom: 10, marginLeft: -14, marginRight: -14, marginTop: -14, position: "relative", width: "calc(100% + 28px)", height: 130, overflow: "hidden", background: c.warm }}>
          {p.capa_video_url ? (
            <video
              src={p.capa_video_url}
              poster={p.capa_url ?? undefined}
              autoPlay muted loop playsInline preload="metadata"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <img src={p.capa_url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
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
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : c.border}`, paddingTop: 10, marginTop: "auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0, flex: "1 1 auto" }}>
          {p.metaValor && (
            <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.85)" : c.muted, whiteSpace: "nowrap" }}>
              {p.metaValor}
            </span>
          )}
          {p.precoLabel && (
            <span style={{ fontFamily: serif, fontSize: 15, color: isDark ? "white" : c.sageDark, whiteSpace: "nowrap" }}>{p.precoLabel}</span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); p.onAction(); }}
          aria-label={p.ctaLabel}
          title={p.ctaLabel}
          style={{
            background: isDark ? "white" : c.sageDark, color: isDark ? c.sageDark : "white",
            fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            padding: p.ctaIcon ? "8px 10px" : "8px 12px", border: "none", cursor: "pointer", fontFamily: sans,
            whiteSpace: "nowrap", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          } as CSSProperties}
        >
          {p.ctaIcon === "cart" ? <CartIcon /> : p.ctaIcon === "cart-check" ? <CartCheckIcon /> : p.ctaLabel}
        </button>
      </div>

    </div>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M3 4h2.2l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H6" />
    </svg>
  );
}

function CartCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M3 4h2.2l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H6" />
      <path d="M10 11l2 2 4-4" />
    </svg>
  );
}
      </div>

    </div>
  );
}
