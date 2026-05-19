import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listCursosVitrine, type CursoVitrine } from "@/lib/cursos.functions";
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
  const fn = useServerFn(listCursosVitrine);
  const [items, setItems] = useState<CursoVitrine[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    fn().then((d) => setItems(d as CursoVitrine[])).catch((e) => setErr(e?.message ?? "Erro"));
  }, []);

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <SiteNav />
      <main style={{ padding: "120px 48px 80px" }}>
        <div style={{ marginBottom: 48, maxWidth: "100%" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 1, background: c.sage }} />
            FORMAÇÃO
          </div>
          <h2 style={{ fontFamily: serif, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 300, lineHeight: 1.1, color: c.ink, marginBottom: 20, whiteSpace: "nowrap" }}>
            Atlas Materno. <em style={{ fontStyle: "italic", color: c.sage }}>{"\u200B"}</em>
          </h2>
        </div>


        {err && <p style={{ color: "#B23A48" }}>{err}</p>}
        {!items ? <p style={{ color: c.muted }}>Carregando…</p>
          : items.length === 0 ? (
            <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 60, textAlign: "center" }}>
              <p style={{ fontFamily: serif, fontSize: 22, color: c.muted, fontStyle: "italic" }}>
                Em breve novos conteúdos. Cadastre-se para ser avisada.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {items.map((curso, i) => {
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
          )}
      </main>
      <SiteFooter />

      {openSlug && <CursoModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </div>
  );
}


