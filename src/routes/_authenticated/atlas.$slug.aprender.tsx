import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCursoBySlug, getAulaPlayer, marcarAulaConcluida, type CursoDetalhe, type AulaPlayer } from "@/lib/cursos.functions";
import lemateLogo from "@/assets/lemater-logo.png";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";

export const Route = createFileRoute("/_authenticated/atlas/$slug/aprender")({
  head: () => ({
    meta: [{ title: "Atlas Materno · Le Mater" }],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: Player,
});

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function Player() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cursoFn = useServerFn(getCursoBySlug);
  const aulaFn = useServerFn(getAulaPlayer);
  const concluirFn = useServerFn(marcarAulaConcluida);

  const [curso, setCurso] = useState<CursoDetalhe | null | undefined>(undefined);
  const [aulaId, setAulaId] = useState<string | null>(null);
  const [player, setPlayer] = useState<AulaPlayer | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    cursoFn({ data: { slug } }).then((d) => {
      setCurso(d as CursoDetalhe | null);
      const first = (d as CursoDetalhe | null)?.modulos.flatMap((m) => m.aulas).find((a) => !a.bloqueada);
      if (first) setAulaId(first.id);
    }).catch((e) => setErr(e?.message ?? "Erro"));
  }, [slug, user?.id]);

  useEffect(() => {
    if (!aulaId) return;
    setPlayer(null);
    aulaFn({ data: { aula_id: aulaId } }).then((p) => setPlayer(p as AulaPlayer)).catch((e) => setErr(e?.message));
  }, [aulaId]);

  const todasAulas = useMemo(() => curso?.modulos.flatMap((m) => m.aulas) ?? [], [curso]);
  const aulaAtual = todasAulas.find((a) => a.id === aulaId);
  const concluidas = todasAulas.filter((a) => a.concluida).length;
  const pct = todasAulas.length ? Math.round((concluidas / todasAulas.length) * 100) : 0;

  const toggleConcluida = async () => {
    if (!aulaAtual) return;
    await concluirFn({ data: { aula_id: aulaAtual.id, concluida: !aulaAtual.concluida } });
    const d = await cursoFn({ data: { slug } });
    setCurso(d as CursoDetalhe | null);
  };

  if (err) return <Shell><p style={{ color: "#B23A48", padding: 40 }}>{err}</p></Shell>;
  if (curso === undefined) return <Shell><p style={{ color: c.muted, padding: 40 }}>Carregando…</p></Shell>;
  if (!curso) return <Shell><p style={{ padding: 40 }}>Conteúdo não encontrado. <Link to="/atlas">Ver Atlas Materno</Link></p></Shell>;
  if (!curso.matriculado) {
    return <Shell>
      <div style={{ padding: 60, textAlign: "center" }}>
        <h1 style={{ fontFamily: serif, fontSize: 32 }}>Você ainda não tem acesso a este conteúdo</h1>
        <Link to="/atlas/$slug" params={{ slug }} style={{ ...btn(c.sageDark), textDecoration: "none", display: "inline-block", marginTop: 20 }}>Ver detalhes e comprar</Link>
      </div>
    </Shell>;
  }

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,245,238,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/app/membro"><img src={lemateLogo} alt="Le Mater" style={{ height: 36 }} /></Link>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", color: c.muted }}>ATLAS MATERNO</div>
            <div style={{ fontFamily: serif, fontSize: 18 }}>{curso.titulo}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: c.muted }}>{concluidas}/{todasAulas.length} · {pct}%</div>
          <div style={{ width: 140, height: 6, background: c.border, position: "relative" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: c.sageDark }} />
          </div>
          <button onClick={() => navigate({ to: "/app/membro" })} style={btnSm(c.sage)}>Minha área</button>
        </div>
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 70px)" }}>
        {/* Conteúdo da aula */}
        <main style={{ padding: 32, maxWidth: 1000 }}>
          {!aulaAtual ? <p style={{ color: c.muted }}>Selecione uma aula ao lado.</p> : (
            <>
              <AulaConteudo aulaAtual={aulaAtual} player={player} />
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <button onClick={toggleConcluida} style={btn(aulaAtual.concluida ? c.muted : c.sageDark)}>
                  {aulaAtual.concluida ? "Marcar como NÃO concluída" : "Marcar como concluída"}
                </button>
                {(() => {
                  const idx = todasAulas.findIndex((a) => a.id === aulaAtual.id);
                  const prox = todasAulas[idx + 1];
                  return prox && !prox.bloqueada ? (
                    <button onClick={() => setAulaId(prox.id)} style={btn(c.sage)}>Próxima aula →</button>
                  ) : null;
                })()}
              </div>
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside style={{ background: "white", borderLeft: `1px solid ${c.border}`, padding: "24px 0", overflow: "auto", maxHeight: "calc(100vh - 70px)" }}>
          {curso.modulos.map((mod, mi) => (
            <div key={mod.id} style={{ marginBottom: 8 }}>
              <div style={{ padding: "10px 24px", fontSize: 11, letterSpacing: "0.16em", color: c.muted, background: c.warm }}>
                MÓDULO {String(mi + 1).padStart(2, "0")} · {mod.titulo}
              </div>
              {mod.aulas.map((a) => {
                const active = a.id === aulaId;
                return (
                  <button key={a.id} onClick={() => !a.bloqueada && setAulaId(a.id)} disabled={a.bloqueada}
                    style={{ width: "100%", textAlign: "left", padding: "12px 24px", background: active ? c.warm : "transparent", border: "none", borderLeft: `3px solid ${active ? c.sageDark : "transparent"}`, cursor: a.bloqueada ? "not-allowed" : "pointer", opacity: a.bloqueada ? 0.5 : 1, fontFamily: sans }}>
                    <div style={{ fontSize: 13, color: c.ink, fontWeight: active ? 500 : 400, display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span>{a.concluida ? "✓ " : ""}{a.titulo}</span>
                    </div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{a.tipo.toUpperCase()} · {a.duracao_min} min {a.bloqueada && "· bloqueado"}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Shell({ children }: { children: any }) {
  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <nav style={{ background: c.cream, borderBottom: `1px solid ${c.border}`, padding: "14px 28px" }}>
        <Link to="/app/membro"><img src={lemateLogo} alt="Le Mater" style={{ height: 36 }} /></Link>
      </nav>
      {children}
    </div>
  );
}

function btn(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans };
}
function btnSm(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.10em", padding: "8px 14px", border: "none", cursor: "pointer", fontFamily: sans };
}
