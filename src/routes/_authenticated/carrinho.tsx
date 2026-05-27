import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getCart, removeFromCart, createMercadoPagoCheckout, createStripeCheckout } from "@/lib/checkout.functions";

export const Route = createFileRoute("/_authenticated/carrinho")({
  head: () => ({
    meta: [
      { title: "Meu carrinho — Le Mater" },
      { name: "description", content: "Revise sua jornada e finalize a compra." },
    ],
  }),
  ssr: false,
  component: CarrinhoPage,
});

const sans = "'DM Sans', sans-serif";
const serif = "'Playfair Display', serif";
const c = {
  cream: "#FAF5EE",
  ink: "#1C1C1A",
  muted: "#6B6560",
  sage: "#5C8A6E",
  sageDark: "#2D5A42",
  border: "#E8DDD2",
  gold: "#C9A961",
};

function formatPrice(centavos: number, currency: string) {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(centavos / 100);
}

function CarrinhoPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pais, setPais] = useState<"BR" | "INT">("BR");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fnGet = useServerFn(getCart);
  const fnRemove = useServerFn(removeFromCart);
  const fnMP = useServerFn(createMercadoPagoCheckout);
  const fnStripe = useServerFn(createStripeCheckout);

  const { data, isLoading } = useQuery({
    queryKey: ["cart", pais],
    queryFn: () => fnGet({ data: { pais } }),
  });

  const items = data?.items ?? [];
  const total = data?.total_centavos ?? 0;
  const currency = data?.currency ?? (pais === "BR" ? "BRL" : "EUR");

  async function handleRemove(id: string) {
    await fnRemove({ data: { id } });
    qc.invalidateQueries({ queryKey: ["cart"] });
  }

  async function handleCheckout() {
    setLoading(true);
    setErr(null);
    try {
      const res = pais === "BR" ? await fnMP() : await fnStripe();
      if (res?.checkout_url) window.location.href = res.checkout_url;
      else setErr("Não foi possível iniciar o pagamento.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro no checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: c.cream, minHeight: "100vh", padding: "48px 24px", fontFamily: sans, color: c.ink }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <button
          onClick={() => navigate({ to: "/app/home" })}
          style={{
            background: "transparent",
            border: "none",
            color: c.muted,
            cursor: "pointer",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          ← voltar
        </button>

        <h1 style={{ fontFamily: serif, fontSize: 42, color: c.sageDark, margin: 0, marginBottom: 8 }}>
          Seu carrinho
        </h1>
        <p style={{ color: c.muted, marginBottom: 32, maxWidth: 520 }}>
          Revise sua jornada antes de finalizar. Cada item liberado dá acesso permanente à aula, módulo ou trilha escolhida.
        </p>

        <div style={{ display: "inline-flex", border: `1px solid ${c.border}`, background: "white", marginBottom: 24 }}>
          <button
            onClick={() => setPais("BR")}
            style={{
              padding: "10px 18px",
              background: pais === "BR" ? c.sageDark : "transparent",
              color: pais === "BR" ? "white" : c.ink,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Brasil · PIX/Cartão
          </button>
          <button
            onClick={() => setPais("INT")}
            style={{
              padding: "10px 18px",
              background: pais === "INT" ? c.sageDark : "transparent",
              color: pais === "INT" ? "white" : c.ink,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Internacional · Cartão
          </button>
        </div>

        {isLoading && <div style={{ color: c.muted }}>Carregando carrinho…</div>}

        {!isLoading && items.length === 0 && (
          <div style={{ background: "white", border: `1px solid ${c.border}`, padding: 48, textAlign: "center" }}>
            <p style={{ color: c.muted, marginBottom: 20 }}>Seu carrinho está vazio.</p>
            <Link
              to="/app/home"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: c.sageDark,
                color: "white",
                textDecoration: "none",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Explorar biblioteca
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div style={{ background: "white", border: `1px solid ${c.border}` }}>
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 20,
                    borderTop: idx === 0 ? "none" : `1px solid ${c.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: c.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                      {it.item_type}
                    </div>
                    <div style={{ fontFamily: serif, fontSize: 20, color: c.ink }}>{it.title}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ fontFamily: serif, fontSize: 22, color: c.sageDark }}>
                      {formatPrice(it.unit_price_centavos, it.currency)}
                    </div>
                    <button
                      onClick={() => handleRemove(it.id)}
                      style={{
                        background: "transparent",
                        border: `1px solid ${c.border}`,
                        color: c.muted,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 24,
                background: "white",
                border: `1px solid ${c.border}`,
                padding: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Total
                </div>
                <div style={{ fontFamily: serif, fontSize: 36, color: c.sageDark }}>
                  {formatPrice(total, currency)}
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading || total <= 0}
                style={{
                  background: loading ? c.muted : c.sageDark,
                  color: "white",
                  border: "none",
                  padding: "16px 32px",
                  cursor: loading ? "default" : "pointer",
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontFamily: sans,
                }}
              >
                {loading ? "Aguarde…" : pais === "BR" ? "Finalizar · PIX/Cartão" : "Finalizar · Cartão"}
              </button>
            </div>

            {err && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background: "#FDECEA",
                  border: "1px solid #E8B4B4",
                  color: "#8B2A2A",
                  fontSize: 13,
                }}
              >
                {err}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
