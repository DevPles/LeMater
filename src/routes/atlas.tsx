import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listCursosVitrine, listAtlasTemas, listAtlasAulas, type CursoVitrine, type AtlasTema, type AtlasAulaVitrine } from "@/lib/cursos.functions";
import { ContentCard } from "@/components/ContentCard";
import { CursoModal } from "@/components/CursoModal";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/atlas")({
  head: () => ({
    meta: [
      { title: "Atlas Materno · Le Mater" },
      { name: "description", content: "Atlas Materno Le Mater com conteúdos de concepção, gestação, parto e puerpério." },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: CursosVitrine,
});

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function CursosVitrine() {
  const fnCursos = useServerFn(listCursosVitrine);
  const fnTemas = useServerFn(listAtlasTemas);
  const fnAulas = useServerFn(listAtlasAulas);

  const [cursos, setCursos] = useState<CursoVitrine[] | null>(null);
  const [temas, setTemas] = useState<AtlasTema[]>([]);
  const [aulas, setAulas] = useState<AtlasAulaVitrine[] | null>(null);
  const [temaSel, setTemaSel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fnCursos(), fnTemas()])
      .then(([c, t]) => { setCursos(c as CursoVitrine[]); setTemas(t as AtlasTema[]); })
      .catch((e) => setErr(e?.message ?? "Erro"));
  }, []);

  useEffect(() => {
    if (!temaSel) { setAulas(null); return; }
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
          <h2 style={{ fontFamily: serif, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 300, lineHeight: 1.1, color: c.ink, marginBottom: 20, whiteSpace: "nowrap" }}>
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

        {temaSel === null ? (
          !cursos ? <p style={{ color: c.muted }}>Carregando…</p>
            : cursos.length === 0 ? (
              <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 60, textAlign: "center" }}>
                <p style={{ fontFamily: serif, fontSize: 22, color: c.muted, fontStyle: "italic" }}>
                  Em breve novos conteúdos. Cadastre-se para ser avisada.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                {cursos.map((curso, i) => {
                  const precoGratis = curso.preco_label?.trim().toLowerCase() === "grátis" || curso.preco_label?.trim().toLowerCase() === "gratis";
                  const badge = curso.matriculado
                    ? { label: "Seu acesso", color: c.sageDark }
                    : curso.preco_label && !precoGratis
                      ? { label: "Conteúdo pago", color: c.gold }
                      : { label: "Atlas Materno", color: c.sage };
                  return (
                    <ContentCard
                      key={curso.id}
                      numero={String(i + 1).padStart(2, "0")}
                      categoria={`${curso.categoria} · ${curso.nivel}`}
                      badge={badge}
                      titulo={curso.titulo}
                      descricao={curso.descricao_curta}
                      capa_url={curso.capa_url}
                      capa_video_url={curso.capa_video_url}
                      metaLabel="Conteúdo"
                      metaValor={`${curso.total_aulas} ${curso.total_aulas === 1 ? "aula" : "aulas"}${curso.carga_horaria_min > 0 ? ` · ${Math.round(curso.carga_horaria_min / 60)}h` : ""}`}
                      precoLabel={!curso.matriculado && !precoGratis ? curso.preco_label : null}
                      ctaLabel={curso.matriculado ? "Acessar conteúdo" : "Ver conteúdo"}
                      onAction={() => setOpenSlug(curso.slug)}
                    />
                  );
                })}
              </div>
            )
        ) : (
          !aulas ? <p style={{ color: c.muted }}>Carregando aulas…</p>
            : aulas.length === 0 ? (
              <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 60, textAlign: "center" }}>
                <p style={{ fontFamily: serif, fontSize: 22, color: c.muted, fontStyle: "italic" }}>
                  Nenhuma aula publicada neste tema ainda.
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
                  const cta = a.pode_consumir ? "Assistir aula" : a.link_compra ? "Comprar aula" : "Saber mais";
                  return (
                    <ContentCard
                      key={a.id}
                      numero={String(i + 1).padStart(2, "0")}
                      categoria={a.temas.map((t) => t.titulo).join(" · ") || "Aula"}
                      badge={badge}
                      titulo={a.titulo}
                      descricao={a.descricao}
                      capa_url={a.capa_url}
                      capa_video_url={a.capa_video_url}
                      metaLabel="Duração"
                      metaValor={a.duracao_min ? `${a.duracao_min} min` : "—"}
                      precoLabel={!a.pode_consumir && !a.gratis ? a.preco_label : null}
                      ctaLabel={cta}
                      onAction={() => {
                        if (a.link_compra && !a.pode_consumir) window.open(a.link_compra, "_blank");
                        else if (a.temas[0]?.slug) setOpenSlug(a.temas[0].slug);
                      }}
                    />
                  );
                })}
              </div>
            )
        )}
      </main>
      <SiteFooter />

      {openSlug && <CursoModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </div>
  );
}
