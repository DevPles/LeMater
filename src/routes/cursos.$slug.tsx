import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCursoBySlug, type CursoDetalhe } from "@/lib/cursos.functions";
import { useAuth } from "@/hooks/useAuth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/cursos/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `Curso · Le Mater` }],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" }],
  }),
  component: CursoLanding,
});

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function CursoLanding() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getCursoBySlug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CursoDetalhe | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fn({ data: { slug } }).then((d) => setData(d as CursoDetalhe | null)).catch((e) => setErr(e?.message ?? "Erro"));
  }, [slug, user?.id]);

  if (err) return <Wrapper><p style={{ color: "#B23A48" }}>{err}</p></Wrapper>;
  if (data === undefined) return <Wrapper><p style={{ color: c.muted }}>Carregando…</p></Wrapper>;
  if (data === null) return (
    <Wrapper>
      <h1 style={{ fontFamily: serif, fontSize: 36 }}>Curso não encontrado</h1>
      <Link to="/cursos" style={{ color: c.sageDark }}>← Ver todos os cursos</Link>
    </Wrapper>
  );

  const totalAulas = data.modulos.reduce((s, m) => s + m.aulas.length, 0);
  const comprar = () => {
    if (data.link_compra_externo) window.open(data.link_compra_externo, "_blank", "noopener,noreferrer");
    else if (!user) navigate({ to: "/login" });
  };
  const acessar = () => navigate({ to: "/cursos/$slug/aprender", params: { slug: data.slug } });

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <TopBar />
      <main style={{ paddingTop: 88 }}>
        {/* Hero */}
        <section style={{ background: `linear-gradient(135deg, ${c.warm}, ${c.cream})`, padding: "60px 32px 80px", borderBottom: `1px solid ${c.border}` }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <Link to="/cursos" style={{ fontSize: 12, color: c.muted, textDecoration: "none", letterSpacing: "0.1em" }}>← TODOS OS CURSOS</Link>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, margin: "16px 0 10px" }}>
                {data.categoria} · {data.nivel}
                {!data.publicado && <> · <span style={{ color: c.gold }}>RASCUNHO (admin)</span></>}
              </div>
              <h1 style={{ fontFamily: serif, fontSize: 52, fontWeight: 300, margin: 0, lineHeight: 1.05 }}>{data.titulo}</h1>
              {data.descricao_curta && <p style={{ color: c.muted, marginTop: 18, fontSize: 17, lineHeight: 1.6 }}>{data.descricao_curta}</p>}
              <div style={{ display: "flex", gap: 24, marginTop: 24, fontSize: 13, color: c.muted }}>
                <span><strong style={{ color: c.ink }}>{totalAulas}</strong> aulas</span>
                <span><strong style={{ color: c.ink }}>{data.modulos.length}</strong> módulos</span>
                {data.carga_horaria_min > 0 && <span><strong style={{ color: c.ink }}>{Math.round(data.carga_horaria_min / 60)}h</strong> de conteúdo</span>}
              </div>
              <div style={{ marginTop: 32, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                {data.matriculado ? (
                  <button onClick={acessar} style={btn(c.sageDark)}>Acessar curso</button>
                ) : (
                  <>
                    {data.preco_label && <span style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, color: c.sageDark }}>{data.preco_label}</span>}
                    <button onClick={comprar} style={btn(c.gold)}>
                      {data.link_compra_externo ? `Comprar${data.plataforma_venda ? ` (${data.plataforma_venda})` : ""}` : "Quero me inscrever"}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div>
              {data.trailer_url ? (
                <div style={{ aspectRatio: "16/9", background: "black", border: `1px solid ${c.border}` }}>
                  <iframe src={data.trailer_url} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media" allowFullScreen />
                </div>
              ) : data.capa_url ? (
                <img src={data.capa_url} alt={data.titulo} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", border: `1px solid ${c.border}` }} />
              ) : (
                <div style={{ aspectRatio: "16/9", background: "white", border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: serif, fontSize: 44, color: c.sageDark, opacity: 0.4 }}>Le Mater</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Descrição longa */}
        {data.descricao_longa && (
          <section style={{ padding: "80px 32px", borderBottom: `1px solid ${c.border}` }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <h2 style={h2}>Sobre o curso</h2>
              <div style={{ fontSize: 16, lineHeight: 1.75, color: c.ink, whiteSpace: "pre-wrap" }}>{data.descricao_longa}</div>
            </div>
          </section>
        )}

        {/* Conteúdo programático */}
        <section style={{ padding: "80px 32px", background: c.warm }}>
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            <h2 style={h2}>Conteúdo programático</h2>
            <div style={{ display: "grid", gap: 16, marginTop: 32 }}>
              {data.modulos.length === 0 && <p style={{ color: c.muted, fontStyle: "italic" }}>Em breve.</p>}
              {data.modulos.map((mod, idx) => (
                <div key={mod.id} style={{ background: "white", border: `1px solid ${c.border}`, padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: mod.aulas.length > 0 ? 16 : 0 }}>
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: "0.16em", color: c.muted, marginBottom: 4 }}>MÓDULO {String(idx + 1).padStart(2, "0")}</div>
                      <h3 style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, margin: 0 }}>{mod.titulo}</h3>
                      {mod.descricao && <p style={{ fontSize: 14, color: c.muted, margin: "6px 0 0" }}>{mod.descricao}</p>}
                    </div>
                    <span style={{ fontSize: 12, color: c.muted, whiteSpace: "nowrap" }}>{mod.aulas.length} {mod.aulas.length === 1 ? "aula" : "aulas"}</span>
                  </div>
                  {mod.aulas.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, borderTop: `1px solid ${c.border}` }}>
                      {mod.aulas.map((a) => (
                        <li key={a.id} style={{ padding: "12px 0", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                            <span style={{ fontSize: 11, color: c.muted, width: 50, flexShrink: 0 }}>{a.tipo.toUpperCase()}</span>
                            <span style={{ fontSize: 14, color: a.bloqueada ? c.muted : c.ink }}>{a.titulo}</span>
                            {a.previa_gratis && <span style={{ fontSize: 10, background: c.sage, color: "white", padding: "2px 8px", letterSpacing: "0.08em" }}>PRÉVIA</span>}
                          </div>
                          <span style={{ fontSize: 12, color: c.muted, whiteSpace: "nowrap" }}>
                            {a.bloqueada ? "Bloqueado" : `${a.duracao_min || 0} min`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instrutor */}
        {data.instrutor_nome && (
          <section style={{ padding: "80px 32px", borderTop: `1px solid ${c.border}` }}>
            <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: data.instrutor_foto ? "auto 1fr" : "1fr", gap: 40, alignItems: "start" }}>
              {data.instrutor_foto && <img src={data.instrutor_foto} alt={data.instrutor_nome} style={{ width: 180, height: 180, objectFit: "cover", borderRadius: "50%", border: `1px solid ${c.border}` }} />}
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.18em", color: c.muted, marginBottom: 8 }}>INSTRUTOR</div>
                <h2 style={{ ...h2, marginTop: 0 }}>{data.instrutor_nome}</h2>
                {data.instrutor_bio && <p style={{ fontSize: 16, lineHeight: 1.7, color: c.ink, whiteSpace: "pre-wrap" }}>{data.instrutor_bio}</p>}
              </div>
            </div>
          </section>
        )}

        {/* CTA final */}
        <section style={{ padding: "80px 32px", background: c.sageDark, color: "white", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontFamily: serif, fontSize: 40, fontWeight: 300, margin: 0, color: "white" }}>Pronta para começar?</h2>
            <p style={{ marginTop: 16, opacity: 0.85, fontSize: 16 }}>Acesso vitalício ao conteúdo. Comece quando quiser.</p>
            <div style={{ marginTop: 28 }}>
              {data.matriculado ? (
                <button onClick={acessar} style={btn(c.gold)}>Acessar curso</button>
              ) : (
                <button onClick={comprar} style={btn(c.gold)}>
                  {data.preco_label ? `Comprar por ${data.preco_label}` : "Quero me inscrever"}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Wrapper({ children }: { children: any }) {
  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <TopBar />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "140px 32px 80px" }}>{children}</main>
    </div>
  );
}

const TopBar = SiteNav;

const h2: CSSProperties = { fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 16px" };

function btn(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 13, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "14px 28px", border: "none", cursor: "pointer", fontFamily: sans };
}
