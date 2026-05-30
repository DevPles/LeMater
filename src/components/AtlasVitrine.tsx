import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAtlasTemas, listAtlasAulas, type AtlasTema, type AtlasAulaVitrine } from "@/lib/cursos.functions";
import { ContentCard } from "@/components/ContentCard";
import { CursoModal } from "@/components/CursoModal";
import { CartDrawer, CartFloatingButton } from "@/components/CartDrawer";
import { useCart, openCart } from "@/lib/cart-store";
import { applyTranslation, useTranslatedList } from "@/hooks/useTranslatedContent";

const vidEngravidar = "/__l5e/assets-v1/fee6877d-6bbc-417b-9f9d-c37940580cd3/engravidar.mp4";
const vidPreNatal = "/__l5e/assets-v1/50839f2b-be10-4be1-9dff-fe20596bd45f/pre-natal.mp4";
const vidExercicios = "/__l5e/assets-v1/8c0b94d4-eb3d-464f-9f8c-73a6009d7684/exercicios.mp4";
const vidAlimentacao = "/__l5e/assets-v1/87664664-23c3-47f7-b3dd-c3f31fbfbfec/alimentacao.mp4";
const vidPartoHumanizado = "/__l5e/assets-v1/06ac26f0-ccd4-4aa2-a764-a7181a85a02f/parto-humanizado.mp4";
const vidPlanoParto = "/__l5e/assets-v1/30cdf9be-7952-41d3-aaab-14c2d5b99a83/plano-parto.mp4";
const vidPuerperio = "/__l5e/assets-v1/dd1716d3-39c8-4fe9-889b-1b7cd8322bea/puerperio.mp4";
const vidAmamentacao = "/__l5e/assets-v1/8c0f8f04-712e-4fae-ad75-da2004db899c/amamentacao.mp4";
const vidPrimeirosCuidados = "/__l5e/assets-v1/8ce71800-7382-4980-a806-b85f9b1ea675/primeiros-cuidados.mp4";
const vidSonoBebe = "/__l5e/assets-v1/83670fc6-ff2e-4d7e-9dfe-1bf4ace22827/sono-bebe.mp4";

function videoForAula(a: AtlasAulaVitrine): string {
  if (a.capa_video_url) return a.capa_video_url;
  const haystack = [
    ...a.temas.map((t) => `${t.slug} ${t.titulo}`),
    a.titulo,
    a.descricao ?? "",
  ].join(" ").toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => haystack.includes(k));
  if (has("conceb", "concep", "engravid", "fertil")) return vidEngravidar;
  if (has("amament", "leite", "peito")) return vidAmamentacao;
  if (has("plano de parto", "plano-de-parto", "plano parto")) return vidPlanoParto;
  if (has("parto", "trabalho de parto", "humaniz")) return vidPartoHumanizado;
  if (has("puerp", "pos-parto", "pós-parto", "pos parto")) return vidPuerperio;
  if (has("sono", "dormir")) return vidSonoBebe;
  if (has("cuidad", "bebê", "bebe", "recem", "recém")) return vidPrimeirosCuidados;
  if (has("exerc", "movimento", "yoga", "atividade")) return vidExercicios;
  if (has("aliment", "nutri", "comida", "dieta")) return vidAlimentacao;
  if (has("gesta", "pre-natal", "pré-natal", "pre natal", "grávid", "gravid")) return vidPreNatal;
  return vidPreNatal;
}

function formatAulaPreco(centavos: number, moeda: string) {
  if (!centavos) return null;
  const locale = moeda === "BRL" ? "pt-BR" : moeda === "EUR" ? "es-ES" : "en-US";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: moeda || "BRL" }).format(centavos / 100);
  } catch {
    return `${moeda || "BRL"} ${(centavos / 100).toFixed(2)}`;
  }
}

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

export function AtlasVitrine({ variant = "site" }: { variant?: "site" | "app" }) {
  const fnTemas = useServerFn(listAtlasTemas);
  const fnAulas = useServerFn(listAtlasAulas);

  const [temas, setTemas] = useState<AtlasTema[]>([]);
  const [aulas, setAulas] = useState<AtlasAulaVitrine[] | null>(null);
  const [temaSel, setTemaSel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();
  const { byId: translations } = useTranslatedList("curso_aula", aulas?.map((a) => a.id) ?? []);

  useEffect(() => {
    fnTemas().then((t) => setTemas(t as AtlasTema[])).catch((e) => setErr(e?.message ?? "Erro"));
  }, []);

  useEffect(() => {
    setAulas(null);
    fnAulas({ data: { tema_id: temaSel } })
      .then((d) => setAulas(d as AtlasAulaVitrine[]))
      .catch((e) => setErr(e?.message ?? "Erro"));
  }, [temaSel]);

  const isApp = variant === "app";

  const chipBase = (ativo: boolean) => ({
    background: ativo ? c.sageDark : "transparent",
    color: ativo ? "white" : c.ink,
    border: `1px solid ${ativo ? c.sageDark : c.border}`,
    padding: isApp ? "6px 12px" : "8px 16px",
    fontSize: isApp ? 10 : 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: sans,
    borderRadius: 999,
  });

  const mainPadding = isApp ? "24px 16px 120px" : "120px 48px 80px";
  const gridTpl = isApp
    ? "repeat(auto-fill, minmax(160px, 1fr))"
    : "repeat(auto-fill, minmax(240px, 1fr))";

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <main style={{ padding: mainPadding, maxWidth: isApp ? 480 : undefined, margin: isApp ? "0 auto" : undefined }}>
        <div style={{ marginBottom: isApp ? 20 : 32 }}>
          <div style={{ fontSize: isApp ? 10 : 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: isApp ? 12 : 24, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 1, background: c.sage }} />
            FORMAÇÃO
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: isApp ? 12 : 20, flexWrap: "nowrap" }}>
            <h2 style={{ fontFamily: serif, fontSize: isApp ? 26 : "clamp(28px, 3vw, 44px)", fontWeight: 300, lineHeight: 1.1, color: c.ink, margin: 0, flexShrink: 1, minWidth: 0 }}>
              Atlas Materno.
            </h2>
            {temas.length > 0 && (
              <button
                onClick={() => setMenuOpen(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: "transparent", border: `1px solid ${c.border}`,
                  padding: isApp ? "8px 14px" : "10px 18px",
                  fontSize: isApp ? 10 : 11, letterSpacing: "0.12em",
                  textTransform: "uppercase", cursor: "pointer",
                  fontFamily: sans, color: c.ink, borderRadius: 999,
                  flexShrink: 0,
                }}
              >
                <span style={{ display: "inline-flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ width: 14, height: 1.5, background: c.ink }} />
                  <span style={{ width: 14, height: 1.5, background: c.ink }} />
                  <span style={{ width: 14, height: 1.5, background: c.ink }} />
                </span>
                {temaSel ? (temas.find((t) => t.id === temaSel)?.titulo ?? "Filtrar") : "Filtrar"}
              </button>
            )}
          </div>


          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
                padding: 16,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: c.cream, width: "100%", maxWidth: 320,
                  borderRadius: 14,
                  padding: "10px 10px 14px", maxHeight: "70vh", overflowY: "auto",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
                  <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sage, fontWeight: 500 }}>
                    Filtrar por tema
                  </span>
                  <button onClick={() => setMenuOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: c.muted, textTransform: "uppercase", letterSpacing: "0.12em", padding: 4 }}>
                    Fechar
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button
                    onClick={() => { setTemaSel(null); setMenuOpen(false); }}
                    style={{
                      textAlign: "left", padding: "8px 12px",
                      background: temaSel === null ? c.sageDark : "transparent",
                      color: temaSel === null ? "white" : c.ink,
                      border: "none",
                      fontFamily: sans, fontSize: 12, letterSpacing: "0.06em",
                      textTransform: "uppercase", cursor: "pointer", borderRadius: 8,
                    }}
                  >
                    Todos
                  </button>
                  {temas.map((t) => {
                    const ativo = temaSel === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setTemaSel(t.id); setMenuOpen(false); }}
                        style={{
                          textAlign: "left", padding: "8px 12px",
                          background: ativo ? c.sageDark : "transparent",
                          color: ativo ? "white" : c.ink,
                          border: "none",
                          fontFamily: sans, fontSize: 12, letterSpacing: "0.06em",
                          textTransform: "uppercase", cursor: "pointer", borderRadius: 8,
                          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                        }}
                      >
                        <span>{t.titulo}</span>
                        {t.total_aulas > 0 && <span style={{ fontSize: 10, opacity: 0.7 }}>{t.total_aulas}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {err && <p style={{ color: "#B23A48" }}>{err}</p>}

        {!aulas ? (
          <p style={{ color: c.muted }}>Carregando…</p>
        ) : aulas.length === 0 ? (
          <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 60, textAlign: "center" }}>
            <p style={{ fontFamily: serif, fontSize: 22, color: c.muted, fontStyle: "italic" }}>
              {temaSel ? "Nenhuma aula publicada neste tema ainda." : "Em breve, novas aulas. Cadastre-se para ser avisada."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: gridTpl, gap: isApp ? 14 : 20 }}>
            {aulas.map((a, i) => {
              const tr = translations[a.id] ?? null;
              const shown = applyTranslation(a, tr) as AtlasAulaVitrine;
              const countryControlsAccess = typeof tr?.gratis === "boolean";
              const gratis = countryControlsAccess ? tr?.gratis === true : shown.gratis;
              const podeConsumir = countryControlsAccess ? (gratis || (a.pode_consumir && !a.gratis)) : shown.pode_consumir;
              const inCart = cart.has(a.id);
              const badge = podeConsumir
                ? { label: "Seu acesso", color: c.sageDark }
                : gratis
                  ? { label: "Grátis", color: c.sage }
                  : inCart
                    ? { label: "No carrinho", color: c.sageDark }
                    : { label: "Conteúdo pago", color: c.gold };
              const cta = podeConsumir
                ? "Assistir aula"
                : gratis
                  ? "Assistir"
                  : inCart
                    ? "Ver carrinho"
                    : "Adicionar ao carrinho";
              const precoLabel = shown.preco_label || formatAulaPreco(shown.preco_centavos, shown.moeda);
              return (
                <ContentCard
                  key={a.id}
                  numero={String(i + 1).padStart(2, "0")}
                  categoria={a.temas.map((t) => t.titulo).join(" · ") || "Aula"}
                  badge={badge}
                  titulo={shown.titulo}
                  descricao={shown.descricao}
                  capa_url={shown.capa_url}
                  capa_video_url={videoForAula(shown)}
                  metaLabel="Duração"
                  metaValor={a.duracao_min ? `${a.duracao_min} min` : "—"}
                  precoLabel={!podeConsumir && !gratis ? precoLabel : null}
                  ctaLabel={cta}
                  onAction={() => {
                    if (podeConsumir || gratis) {
                      if (a.temas[0]?.slug) setOpenSlug(a.temas[0].slug);
                      return;
                    }
                    if (inCart) {
                      openCart();
                      return;
                    }
                    cart.add({
                      aula_id: a.id,
                      slug: a.slug,
                      titulo: shown.titulo,
                      capa_url: shown.capa_url,
                      capa_video_url: videoForAula(shown),
                      preco_centavos: shown.preco_centavos,
                      preco_label: precoLabel,
                      moeda: shown.moeda,
                      link_compra: a.link_compra,
                      tema: a.temas[0]?.titulo ?? null,
                      beneficios: a.beneficios ?? [],
                    });

                    openCart();
                  }}
                />
              );
            })}
          </div>
        )}
      </main>

      <CartFloatingButton />
      <CartDrawer />


      {openSlug && <CursoModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </div>
  );
}
