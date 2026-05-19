import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { listCursosVitrine, type CursoVitrine } from "@/lib/cursos.functions";
import { ContentCard } from "@/components/ContentCard";
import { CursoModal } from "@/components/CursoModal";

export const Route = createFileRoute("/app/videos")({
  head: () => ({
    meta: [
      { title: "App — Atlas Materno — MãeDigital" },
      { name: "description", content: "Acesse o conteúdo do Atlas Materno direto pelo aplicativo." },
    ],
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" },
    ],
  }),
  component: AtlasMobile,
});

function AtlasMobile() {
  const fn = useServerFn(listCursosVitrine);
  const [items, setItems] = useState<CursoVitrine[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", muted: "#6B6560", gold: "#B8923A", border: "#E8DDD2" };

  useEffect(() => {
    fn().then((d) => setItems(d as CursoVitrine[])).catch((e) => setErr(e?.message ?? "Erro"));
  }, []);

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto" style={{ background: c.cream, fontFamily: "'DM Sans', sans-serif" }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: c.sage, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 18, height: 1, background: c.sage }} />
          FORMAÇÃO
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, lineHeight: 1.05, margin: "0 0 6px" }}>
          Atlas Materno
        </h1>
        <p style={{ fontSize: 13, color: c.muted, margin: "0 0 20px" }}>
          Cursos e materiais para sua jornada materna.
        </p>
      </motion.div>

      {err && <p style={{ color: "#B23A48", fontSize: 13 }}>{err}</p>}

      {!items ? (
        <p style={{ color: c.muted, fontSize: 13 }}>Carregando…</p>
      ) : items.length === 0 ? (
        <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 32, textAlign: "center" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: c.muted, fontStyle: "italic", margin: 0 }}>
            Em breve novos conteúdos.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
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
                ctaLabel={curso.matriculado ? "Acessar" : "Ver conteúdo"}
                onAction={() => setOpenSlug(curso.slug)}
              />
            );
          })}
        </div>
      )}

      {openSlug && <CursoModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </div>
  );
}
