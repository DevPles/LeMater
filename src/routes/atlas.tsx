import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAtlasTemas, listAtlasAulas, type AtlasTema, type AtlasAulaVitrine } from "@/lib/cursos.functions";
import { ContentCard } from "@/components/ContentCard";
import { CursoModal } from "@/components/CursoModal";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

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

export const Route = createFileRoute("/atlas")({
  head: () => ({
    meta: [
      { title: "Atlas Materno · Le Mater" },
      { name: "description", content: "Atlas Materno Le Mater com aulas avulsas de concepção, gestação, parto e puerpério." },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: AtlasVitrine,
});

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function AtlasVitrine() {
  const fnTemas = useServerFn(listAtlasTemas);
  const fnAulas = useServerFn(listAtlasAulas);

  const [temas, setTemas] = useState<AtlasTema[]>([]);
  const [aulas, setAulas] = useState<AtlasAulaVitrine[] | null>(null);
  const [temaSel, setTemaSel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    fnTemas().then((t) => setTemas(t as AtlasTema[])).catch((e) => setErr(e?.message ?? "Erro"));
  }, []);

  useEffect(() => {
    setAulas(null);
    fnAulas({ data: { tema_id: temaSel } })
      .then((d) => setAulas(d as AtlasAulaVitrine[]))
      .catch((e) => setErr(e?.message ?? "Erro"));
  }, [temaSel]);

  const chipBase = (ativo: boolean) => ({
    background: ativo ? c.sageDark : "transparent",
    color: ativo ? "white" : c.ink,
    border: `1px solid ${ativo ? c.sageDark : c.border}`,
    padding: "8px 16px",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    fontFamily: sans,
    borderRadius: 999,
  });

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <SiteNav />
      <main style={{ padding: "120px 48px 80px" }}>
        <div style={{ marginBottom: 32, maxWidth: "100%" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 1, background: c.sage }} />
            FORMAÇÃO
          </div>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 300, lineHeight: 1.1, color: c.ink, marginBottom: 20 }}>
            Atlas Materno.
          </h2>

          {temas.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
              <button onClick={() => setTemaSel(null)} style={chipBase(temaSel === null)}>Todos</button>
              {temas.map((t) => (
                <button key={t.id} onClick={() => setTemaSel(t.id)} style={chipBase(temaSel === t.id)}>
                  {t.titulo}{t.total_aulas > 0 ? ` · ${t.total_aulas}` : ""}
                </button>
              ))}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {aulas.map((a, i) => {
              const badge = a.pode_consumir
                ? { label: "Seu acesso", color: c.sageDark }
                : a.gratis
                  ? { label: "Grátis", color: c.sage }
                  : { label: "Conteúdo pago", color: c.gold };
              const cta = a.pode_consumir
                ? "Assistir aula"
                : a.link_compra
                  ? "Comprar aula"
                  : "Saber mais";
              return (
                <ContentCard
                  key={a.id}
                  numero={String(i + 1).padStart(2, "0")}
                  categoria={a.temas.map((t) => t.titulo).join(" · ") || "Aula"}
                  badge={badge}
                  titulo={a.titulo}
                  descricao={a.descricao}
                  capa_url={a.capa_url}
                  capa_video_url={videoForAula(a)}
                  metaLabel="Duração"
                  metaValor={a.duracao_min ? `${a.duracao_min} min` : "—"}
                  precoLabel={!a.pode_consumir && !a.gratis ? a.preco_label : null}
                  ctaLabel={cta}
                  onAction={() => {
                    if (a.link_compra && !a.pode_consumir) {
                      window.open(a.link_compra, "_blank");
                    } else if (a.temas[0]?.slug) {
                      setOpenSlug(a.temas[0].slug);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />

      {openSlug && <CursoModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </div>
  );
}
