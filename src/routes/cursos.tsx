import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listCursosVitrine, type CursoVitrine } from "@/lib/cursos.functions";
import { ContentCard } from "@/components/ContentCard";
import { CursoModal } from "@/components/CursoModal";
import lemateLogo from "@/assets/lemater-logo.png";

export const Route = createFileRoute("/cursos")({
  head: () => ({
    meta: [
      { title: "Cursos · Le Mater" },
      { name: "description", content: "Cursos completos de concepção, gestação, parto e puerpério com a Le Mater." },
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
      <TopBar />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 32px 80px" }}>
        <header style={{ marginBottom: 48, maxWidth: 760 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 12 }}>Formação</div>
          <h1 style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, margin: 0, lineHeight: 1.05 }}>
            Cursos Le Mater. <em style={{ color: c.sageDark }}>Toda a maternidade, do começo ao fim.</em>
          </h1>
          <p style={{ color: c.muted, marginTop: 16, fontSize: 16, lineHeight: 1.6 }}>
            Conteúdo profundo, acessível e respeitoso — guiado por médicas, enfermeiras e doulas referência.
          </p>
        </header>

        {err && <p style={{ color: "#B23A48" }}>{err}</p>}
        {!items ? <p style={{ color: c.muted }}>Carregando…</p>
          : items.length === 0 ? (
            <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 60, textAlign: "center" }}>
              <p style={{ fontFamily: serif, fontSize: 22, color: c.muted, fontStyle: "italic" }}>
                Em breve novos cursos. Cadastre-se para ser avisada.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 2 }}>
              {items.map((curso, i) => {
                const badge = curso.matriculado
                  ? { label: "Seu acesso", color: c.sageDark }
                  : curso.preco_label
                    ? { label: "Curso pago", color: c.gold }
                    : { label: "Curso", color: c.sage };
                return (
                  <ContentCard
                    key={curso.id}
                    numero={String(i + 1).padStart(2, "0")}
                    categoria={`${curso.categoria} · ${curso.nivel}`}
                    badge={badge}
                    titulo={curso.titulo}
                    descricao={curso.descricao_curta}
                    capa_url={curso.capa_url}
                    metaLabel="Conteúdo"
                    metaValor={`${curso.total_aulas} ${curso.total_aulas === 1 ? "aula" : "aulas"}${curso.carga_horaria_min > 0 ? ` · ${Math.round(curso.carga_horaria_min / 60)}h` : ""}`}
                    precoLabel={!curso.matriculado ? curso.preco_label : null}
                    ctaLabel={curso.matriculado ? "Acessar curso" : "Ver conteúdo"}
                    onAction={() => setOpenSlug(curso.slug)}
                  />
                );
              })}
            </div>
          )}
      </main>
      <Footer />

      {openSlug && <CursoModal slug={openSlug} onClose={() => setOpenSlug(null)} />}
    </div>
  );
}

function TopBar() {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link to="/"><img src={lemateLogo} alt="Le Mater" style={{ height: 44 }} /></Link>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link to="/" style={navLink}>Início</Link>
        <Link to="/cursos" style={navLink}>Cursos</Link>
        <Link to="/conteudos-gratis" style={navLink}>Grátis</Link>
        <Link to="/login" style={{ ...btn(c.sageDark), textDecoration: "none" }}>Entrar</Link>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${c.border}`, padding: "32px", textAlign: "center", color: c.muted, fontSize: 13 }}>
      © {new Date().getFullYear()} Le Mater · Todos os direitos reservados
    </footer>
  );
}

const navLink: CSSProperties = { fontFamily: sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, textDecoration: "none" };
function btn(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 24px", border: "none", cursor: "pointer", fontFamily: sans };
}
