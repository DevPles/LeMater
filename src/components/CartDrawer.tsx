import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCart, useCartUI } from "@/lib/cart-store";
import { createCartOrder } from "@/lib/cart.functions";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";


const c = {
  cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42",
  ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A", danger: "#B23A48",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const BENEFITS = [
  "Acesso vitalício à aula",
  "Visualização ilimitada em qualquer dispositivo",
  "Materiais de apoio em PDF",
  "Certificado digital de conclusão",
  "Suporte da equipe Le Mater",
];

function formatMoney(centavos: number, moeda: string) {
  const v = (centavos / 100).toFixed(2).replace(".", ",");
  return `${moeda} ${v}`;
}

export function CartFloatingButton() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <button
      onClick={() => {
        const fn = (window as any).__lemater_openCart;
        if (typeof fn === "function") fn();
      }}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 900,
        background: c.sageDark, color: "white", border: "none",
        padding: "14px 22px", borderRadius: 999,
        fontFamily: sans, fontSize: 12, letterSpacing: "0.14em",
        textTransform: "uppercase", cursor: "pointer", fontWeight: 500,
        boxShadow: "0 10px 30px rgba(45,90,66,0.35)",
      }}
    >
      Carrinho · {count}
    </button>
  );
}

export function CartDrawer() {
  const { items, total, remove, clear } = useCart();
  const { open, setOpen } = useCartUI();
  const fnCheckout = useServerFn(createCartOrder);

  const [step, setStep] = useState<"cart" | "checkout" | "done">("cart");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pais, setPais] = useState("BR");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const moeda = items[0]?.moeda ?? "BRL";

  if (!open) return null;

  const submit = async () => {
    setErr(null);
    if (!nome.trim() || !email.trim() || items.length === 0) {
      setErr("Preencha nome e email para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      await fnCheckout({
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
      });
      clear();
      setStep("done");
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao processar pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 1100, display: "flex", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.cream, width: "100%", maxWidth: 460, height: "100%",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.25)",
          fontFamily: sans, color: c.ink,
        }}
      >
        <header style={{ padding: "18px 20px", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: c.warm }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: c.sage, fontWeight: 500 }}>
              {step === "done" ? "Pedido recebido" : step === "checkout" ? "Finalizar compra" : "Seu carrinho"}
            </div>
            <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, margin: "4px 0 0" }}>
              {step === "done" ? "Obrigada!" : "Atlas Materno"}
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: c.muted, textTransform: "uppercase", letterSpacing: "0.12em", padding: 6 }}
          >
            Fechar
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {step === "done" ? (
            <div style={{ padding: "30px 0", textAlign: "center" }}>
              <p style={{ fontFamily: serif, fontSize: 20, color: c.ink, margin: "0 0 10px" }}>
                Seu pedido foi registrado.
              </p>
              <p style={{ fontSize: 13, color: c.muted, lineHeight: 1.5, margin: "0 0 20px" }}>
                Você receberá um email em <strong>{email}</strong> com as instruções de pagamento.
                Assim que confirmarmos, liberamos o acesso às aulas adquiridas.
              </p>
              <button onClick={() => { setOpen(false); setStep("cart"); }} style={btnPrimary}>
                Voltar à navegação
              </button>
            </div>
          ) : items.length === 0 && step === "cart" ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <p style={{ fontFamily: serif, fontSize: 20, fontStyle: "italic", color: c.muted }}>
                Seu carrinho está vazio.
              </p>
              <p style={{ fontSize: 12, color: c.muted, marginTop: 8 }}>
                Adicione aulas do Atlas Materno para vê-las aqui.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map((i) => (
                  <div key={i.aula_id} style={{ background: "white", border: `1px solid ${c.border}`, padding: 12, borderRadius: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {i.capa_url && (
                        <img src={i.capa_url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {i.tema && (
                          <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: 3 }}>
                            {i.tema}
                          </div>
                        )}
                        <div style={{ fontFamily: serif, fontSize: 16, lineHeight: 1.2, marginBottom: 4 }}>
                          {i.titulo}
                        </div>
                        <div style={{ fontSize: 13, color: c.sageDark, fontWeight: 500 }}>
                          {i.preco_label ?? formatMoney(i.preco_centavos, i.moeda)}
                        </div>
                      </div>
                      {step === "cart" && (
                        <button
                          onClick={() => remove(i.aula_id)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: sans, fontSize: 10, color: c.danger, textTransform: "uppercase", letterSpacing: "0.12em", padding: 4 }}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <section style={{ marginTop: 22, background: c.warm, border: `1px solid ${c.border}`, padding: 16, borderRadius: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: c.sageDark, fontWeight: 600, marginBottom: 10 }}>
                  Você está adquirindo
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {BENEFITS.map((b) => (
                    <li key={b} style={{ display: "flex", gap: 10, fontSize: 13, color: c.ink, lineHeight: 1.4 }}>
                      <span style={{ color: c.sageDark, fontWeight: 600 }}>+</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>

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
          <footer style={{ padding: "16px 20px", borderTop: `1px solid ${c.border}`, background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted }}>
                Total · {items.length} {items.length === 1 ? "aula" : "aulas"}
              </span>
              <span style={{ fontFamily: serif, fontSize: 24, color: c.sageDark, fontWeight: 500 }}>
                {formatMoney(total, moeda)}
              </span>
            </div>
            {step === "cart" ? (
              <button onClick={() => setStep("checkout")} style={btnPrimary}>
                Finalizar compra
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep("cart")} disabled={submitting} style={btnSecondary}>
                  Voltar
                </button>
                <button onClick={submit} disabled={submitting} style={{ ...btnPrimary, flex: 1, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Enviando…" : "Confirmar pedido"}
                </button>
              </div>
            )}
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
  padding: "10px 12px", fontFamily: sans, fontSize: 14, color: c.ink, borderRadius: 6, boxSizing: "border-box",
};
const btnPrimary: CSSProperties = {
  width: "100%", background: c.sageDark, color: "white", border: "none",
  padding: "14px 20px", fontFamily: sans, fontSize: 12, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", borderRadius: 6,
};
const btnSecondary: CSSProperties = {
  background: "transparent", color: c.ink, border: `1px solid ${c.border}`,
  padding: "14px 18px", fontFamily: sans, fontSize: 12, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", borderRadius: 6,
};
