import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCart, useCartUI } from "@/lib/cart-store";
import { createCartOrder } from "@/lib/cart.functions";
import { createStripeCheckout, createMercadoPagoCheckout } from "@/lib/checkout.functions";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";


const c = {
  cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42",
  ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A", danger: "#B23A48",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";




function formatMoney(centavos: number, moeda: string) {
  const v = (centavos / 100).toFixed(2).replace(".", ",");
  return `${moeda} ${v}`;
}

export function CartFloatingButton() {
  const { count } = useCart();
  const SIZE = 60;
  const MARGIN = 16;
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dragging: boolean; moved: boolean; offX: number; offY: number }>({
    dragging: false, moved: false, offX: 0, offY: 0,
  });

  // Initial position (bottom-right) and persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("lemater_cart_pos");
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === "number" && typeof p.y === "number") {
          setPos(clampPos(p.x, p.y));
          return;
        }
      }
    } catch {}
    setPos({ x: window.innerWidth - SIZE - 24, y: window.innerHeight - SIZE - 24 });
    const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function clampPos(x: number, y: number) {
    if (typeof window === "undefined") return { x, y };
    const maxX = window.innerWidth - SIZE - MARGIN;
    const maxY = window.innerHeight - SIZE - MARGIN;
    return {
      x: Math.max(MARGIN, Math.min(maxX, x)),
      y: Math.max(MARGIN, Math.min(maxY, y)),
    };
  }

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      dragging: true, moved: false,
      offX: e.clientX - pos.x, offY: e.clientY - pos.y,
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.dragging) return;
    const nx = e.clientX - dragRef.current.offX;
    const ny = e.clientY - dragRef.current.offY;
    const np = clampPos(nx, ny);
    if (Math.abs(nx - (pos?.x ?? 0)) > 3 || Math.abs(ny - (pos?.y ?? 0)) > 3) {
      dragRef.current.moved = true;
    }
    setPos(np);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const wasDrag = dragRef.current.moved;
    dragRef.current.dragging = false;
    if (pos) {
      try { localStorage.setItem("lemater_cart_pos", JSON.stringify(pos)); } catch {}
    }
    if (!wasDrag) {
      const fn = (window as any).__lemater_openCart;
      if (typeof fn === "function") fn();
    }
  };

  if (count === 0 || !pos) return null;
  return (
    <button
      aria-label={`Carrinho (${count})`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "fixed", left: pos.x, top: pos.y, zIndex: 900,
        width: SIZE, height: SIZE, borderRadius: "50%",
        background: c.sageDark, color: "white", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "grab", touchAction: "none", userSelect: "none",
        boxShadow: "0 10px 30px rgba(45,90,66,0.4)",
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="21" r="1.5" />
        <circle cx="18" cy="21" r="1.5" />
        <path d="M3 3h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L21 8H6" />
      </svg>
      <span
        style={{
          position: "absolute", top: -4, right: -4, minWidth: 22, height: 22,
          padding: "0 6px", borderRadius: 999, background: c.gold, color: "#1C1C1A",
          fontFamily: sans, fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        {count}
      </span>
    </button>
  );
}


export function CartDrawer() {
  const { items, total, remove, clear } = useCart();
  const { open, setOpen } = useCartUI();
  const fnCheckout = useServerFn(createCartOrder);
  const fnStripe = useServerFn(createStripeCheckout);
  const fnMP = useServerFn(createMercadoPagoCheckout);
  const { session, profile } = useGestanteProfile();
  const navigate = useNavigate();
  const isAuthed = !!session?.user;

  const [step, setStep] = useState<"cart" | "checkout" | "done">("cart");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pais, setPais] = useState("BR");
  const [submitting, setSubmitting] = useState<null | "stripe" | "mercadopago">(null);
  const [err, setErr] = useState<string | null>(null);
  const moeda = items[0]?.moeda ?? "BRL";

  useEffect(() => {
    if (isAuthed) {
      if (!nome && (profile?.nome || session?.user?.user_metadata?.full_name)) {
        setNome(profile?.nome ?? session?.user?.user_metadata?.full_name ?? "");
      }
      if (!email && (profile?.email || session?.user?.email)) {
        setEmail(profile?.email ?? session?.user?.email ?? "");
      }
    }
  }, [isAuthed, profile?.nome, profile?.email, session?.user?.email]);

  if (!open) return null;

  const goLogin = () => {
    setOpen(false);
    navigate({ to: "/login", search: { redirect: "/atlas" } as any });
  };

  const payWith = async (provider: "stripe" | "mercadopago") => {
    setErr(null);
    if (!nome.trim() || !email.trim() || items.length === 0) {
      setErr("Preencha nome e email para continuar.");
      return;
    }
    setSubmitting(provider);
    try {
      const created = (await fnCheckout({
        data: {
          comprador_nome: nome.trim(),
          comprador_email: email.trim(),
          pais,
          items: items.map((i) => ({
            aula_id: i.aula_id,
            titulo: i.titulo,
            preco_centavos: i.preco_centavos,
            moeda: i.moeda,
          })),
        },
      })) as { order_id: string };

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = provider === "stripe"
        ? await fnStripe({ data: { order_id: created.order_id, origin } })
        : await fnMP({ data: { order_id: created.order_id, origin } });

      clear();
      if (typeof window !== "undefined" && (res as { url: string }).url) {
        window.location.href = (res as { url: string }).url;
        return;
      }
      setStep("done");
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao processar pagamento.");
    } finally {
      setSubmitting(null);
    }
  };


  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,20,15,0.55)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        zIndex: 1100, display: "flex", justifyContent: "flex-end",
        animation: "lemFade 220ms ease",
      }}
    >
      <style>{`
        @keyframes lemFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lemSlide { from { transform: translateX(40px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes lemPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.04) } }
        .lem-cart-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(45,90,66,0.12); }
        .lem-cart-cta:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 14px 30px rgba(45,90,66,0.35); }
        .lem-cart-cta:active { transform: translateY(0); }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.cream, width: "100%", maxWidth: 480, height: "100%",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "-30px 0 80px rgba(0,0,0,0.28)",
          fontFamily: sans, color: c.ink,
          animation: "lemSlide 320ms cubic-bezier(.2,.8,.2,1)",
        }}
      >
        {/* HERO HEADER */}
        <header
          style={{
            padding: "22px 22px 18px",
            background: `linear-gradient(135deg, ${c.sageDark} 0%, #1f4030 100%)`,
            color: "white", position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(184,146,58,0.12)" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: c.gold, fontWeight: 600, marginBottom: 6 }}>
                {step === "done" ? "✓ Pedido recebido" : step === "checkout" ? "Etapa final" : "Seu carrinho"}
              </div>
              <h3 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, margin: 0, letterSpacing: "-0.01em" }}>
                {step === "done" ? "Obrigada!" : "Atlas Materno"}
              </h3>
              {step !== "done" && items.length > 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 4 }}>
                  {items.length} {items.length === 1 ? "aula selecionada" : "aulas selecionadas"} · acesso vitalício
                </div>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              style={{
                background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
                width: 34, height: 34, borderRadius: "50%", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 24px" }}>
          {step === "done" ? (
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", background: c.warm,
                margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center",
                color: c.sageDark, fontSize: 30, fontFamily: serif, animation: "lemPulse 1.6s ease-in-out infinite",
              }}>
                ✓
              </div>
              <p style={{ fontFamily: serif, fontSize: 22, color: c.ink, margin: "0 0 12px" }}>
                Seu pedido foi registrado.
              </p>
              <p style={{ fontSize: 13, color: c.muted, lineHeight: 1.6, margin: "0 0 22px" }}>
                Enviamos as instruções para <strong style={{ color: c.ink }}>{email}</strong>.
                Confirmando o pagamento, liberamos seu acesso imediatamente.
              </p>
              <button onClick={() => { setOpen(false); setStep("cart"); }} style={btnPrimary} className="lem-cart-cta">
                Continuar navegando
              </button>
            </div>
          ) : items.length === 0 && step === "cart" ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", background: c.warm,
                margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center",
                color: c.sage,
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1.5" />
                  <circle cx="18" cy="21" r="1.5" />
                  <path d="M3 3h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L21 8H6" />
                </svg>
              </div>
              <p style={{ fontFamily: serif, fontSize: 22, fontStyle: "italic", color: c.muted, margin: 0 }}>
                Seu carrinho está vazio.
              </p>
              <p style={{ fontSize: 13, color: c.muted, marginTop: 8 }}>
                Escolha uma aula no Atlas Materno para começar sua jornada.
              </p>
            </div>
          ) : (
            <>

              {/* ITEM CARDS WITH VIDEO */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map((i) => (
                  <div
                    key={i.aula_id}
                    className="lem-cart-card"
                    style={{
                      background: "white", border: `1px solid ${c.border}`, padding: 0,
                      borderRadius: 12, overflow: "hidden",
                      transition: "transform 200ms ease, box-shadow 200ms ease",
                    }}
                  >
                    <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                      <div style={{
                        position: "relative", width: 96, flexShrink: 0,
                        background: "#000", overflow: "hidden",
                      }}>
                        {i.capa_video_url ? (
                          <video
                            src={i.capa_video_url}
                            poster={i.capa_url ?? undefined}
                            autoPlay muted loop playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : i.capa_url ? (
                          <img src={i.capa_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: c.warm }} />
                        )}
                        <div style={{
                          position: "absolute", inset: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)",
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          {i.tema && (
                            <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sage, fontWeight: 600, marginBottom: 4 }}>
                              {i.tema}
                            </div>
                          )}
                          <div style={{ fontFamily: serif, fontSize: 17, lineHeight: 1.2, color: c.ink, marginBottom: 6 }}>
                            {i.titulo}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ fontSize: 14, color: c.sageDark, fontFamily: serif, fontWeight: 600 }}>
                            {i.preco_label ?? formatMoney(i.preco_centavos, i.moeda)}
                          </div>
                          {step === "cart" && (
                            <button
                              onClick={() => remove(i.aula_id)}
                              aria-label="Remover"
                              style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: sans, fontSize: 10, color: c.danger, textTransform: "uppercase", letterSpacing: "0.12em", padding: 4 }}
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* BENEFITS BLOCK */}
              {(() => {
                const allBenefits = Array.from(
                  new Set(items.flatMap((it) => it.beneficios ?? [])),
                ).filter(Boolean);
                if (allBenefits.length === 0) return null;
                return (
                  <section style={{
                    marginTop: 18,
                    background: `linear-gradient(180deg, ${c.warm} 0%, #efe3d0 100%)`,
                    border: `1px solid ${c.border}`, padding: 18, borderRadius: 12,
                  }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: c.sageDark, fontWeight: 700, marginBottom: 12 }}>
                      ✦ Você está adquirindo
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                      {allBenefits.map((b) => (
                        <li key={b} style={{ display: "flex", gap: 10, fontSize: 13.5, color: c.ink, lineHeight: 1.45 }}>
                          <span style={{
                            flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
                            background: c.sageDark, color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, marginTop: 1,
                          }}>✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })()}

              {/* TRUST BADGES */}
              {step === "cart" && (
                <section style={{
                  marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
                }}>
                  {[
                    { t: "Acesso", s: "imediato" },
                    { t: "Pagamento", s: "100% seguro" },
                    { t: "Garantia", s: "7 dias" },
                  ].map((b) => (
                    <div key={b.t} style={{
                      background: "white", border: `1px solid ${c.border}`,
                      padding: "10px 8px", borderRadius: 10, textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 600 }}>
                        {b.t}
                      </div>
                      <div style={{ fontSize: 12, color: c.ink, marginTop: 2, fontWeight: 500 }}>
                        {b.s}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {step === "checkout" && (
                <section style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
                  <Field label="Nome completo" value={nome} onChange={setNome} placeholder="Como devemos te chamar" />
                  <Field label="Email" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
                  <div>
                    <label style={fieldLabelStyle}>País</label>
                    <select value={pais} onChange={(e) => setPais(e.target.value)} style={inputStyle}>
                      <option value="BR">Brasil</option>
                      <option value="PT">Portugal</option>
                      <option value="US">Estados Unidos</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>
                  {err && <p style={{ color: c.danger, fontSize: 12, margin: 0 }}>{err}</p>}
                </section>
              )}
            </>
          )}
        </div>

        {step !== "done" && items.length > 0 && (
          <footer style={{
            padding: "16px 20px 20px",
            borderTop: `1px solid ${c.border}`,
            background: "white",
            boxShadow: "0 -10px 30px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: c.muted, fontWeight: 500 }}>
                  Total a pagar
                </div>
                <div style={{ fontSize: 11, color: c.sage, marginTop: 2 }}>
                  {items.length} {items.length === 1 ? "aula" : "aulas"} · vitalício
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: serif, fontSize: 28, color: c.sageDark, fontWeight: 500, lineHeight: 1 }}>
                  {formatMoney(total, moeda)}
                </div>
                <div style={{ fontSize: 10, color: c.muted, marginTop: 4, letterSpacing: "0.06em" }}>
                  ou em até 12x sem juros
                </div>
              </div>
            </div>
            {step === "cart" ? (
              isAuthed ? (
                <button onClick={() => setStep("checkout")} style={btnPrimary} className="lem-cart-cta">
                  Finalizar compra →
                </button>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: c.muted, margin: "0 0 10px", textAlign: "center", lineHeight: 1.4 }}>
                    Entre ou crie sua conta para finalizar.
                  </p>
                  <button onClick={goLogin} style={btnPrimary} className="lem-cart-cta">
                    Entrar / Criar conta
                  </button>
                </>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => payWith("mercadopago")}
                  disabled={submitting !== null}
                  style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}
                  className="lem-cart-cta"
                >
                  {submitting === "mercadopago" ? "Redirecionando…" : "Pagar com Pix · Cartão (Mercado Pago)"}
                </button>
                <button
                  onClick={() => payWith("stripe")}
                  disabled={submitting !== null}
                  style={{
                    ...btnPrimary,
                    background: "white",
                    color: c.sageDark,
                    border: `1.5px solid ${c.sageDark}`,
                    boxShadow: "none",
                    opacity: submitting ? 0.6 : 1,
                  }}
                  className="lem-cart-cta"
                >
                  {submitting === "stripe" ? "Redirecionando…" : "Pagar com Cartão internacional (Stripe)"}
                </button>
                <button onClick={() => setStep("cart")} disabled={submitting !== null} style={{ ...btnSecondary, padding: "10px 18px" }}>
                  Voltar
                </button>
              </div>
            )}
            <div style={{ marginTop: 10, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontSize: 10, color: c.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <span>🔒</span> Pagamento criptografado
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

const fieldLabelStyle: CSSProperties = {
  display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
  color: c.muted, fontWeight: 500, marginBottom: 6, fontFamily: sans,
};
const inputStyle: CSSProperties = {
  width: "100%", background: "white", border: `1px solid ${c.border}`,
  padding: "12px 14px", fontFamily: sans, fontSize: 14, color: c.ink, borderRadius: 8, boxSizing: "border-box",
  outline: "none",
};
const btnPrimary: CSSProperties = {
  width: "100%", background: `linear-gradient(135deg, ${c.sageDark} 0%, #1f4030 100%)`,
  color: "white", border: "none",
  padding: "16px 20px", fontFamily: sans, fontSize: 12, fontWeight: 600,
  letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", borderRadius: 10,
  boxShadow: "0 8px 20px rgba(45,90,66,0.25)",
  transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
};
const btnSecondary: CSSProperties = {
  background: "transparent", color: c.ink, border: `1px solid ${c.border}`,
  padding: "16px 18px", fontFamily: sans, fontSize: 12, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", borderRadius: 10,
};
