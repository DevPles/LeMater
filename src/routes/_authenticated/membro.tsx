import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboardMembro,
  updateMeuPerfil,
  type MembroDashboard,
} from "@/lib/membro.functions";
import lemateLogo from "@/assets/lemater-logo.png";

export const Route = createFileRoute("/_authenticated/membro")({
  head: () => ({
    meta: [{ title: "Minha Área · Le Mater" }],
    links: [{
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap",
    }],
  }),
  component: MembroPage,
});

const c = {
  cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42",
  ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A",
  terra: "#C4714A",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function MembroPage() {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const dashFn = useServerFn(getDashboardMembro);

  const [data, setData] = useState<MembroDashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editPerfil, setEditPerfil] = useState(false);

  const reload = () => {
    dashFn().then((d) => setData(d as MembroDashboard)).catch((e) => setErr(e?.message ?? "Erro"));
  };

  useEffect(() => { if (!loading) reload(); }, [loading]);

  if (loading || !data) {
    return <div style={{ fontFamily: sans, padding: 40, background: c.cream, minHeight: "100vh" }}>
      {err ?? "Carregando…"}
    </div>;
  }

  const nome = data.perfil.nome?.split(" ")[0] ?? "olá";

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <TopBar onSair={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }} admin={data.is_admin} />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "120px 32px 80px" }}>
        {/* Boas-vindas + resumo gestação */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 12 }}>
            Minha área {data.is_admin ? "· Admin" : data.pago ? "· Aluna Le Mater" : "· Acesso gratuito"}
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, margin: 0 }}>
            Bem-vinda, <em style={{ color: c.sageDark }}>{nome}</em>.
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 28 }}>
            <Stat label="Semana gestacional" value={data.semana_atual !== null ? `${data.semana_atual}ª` : "—"} sub={data.dpp ? `DPP ${formatDate(data.dpp)}` : "Informe a DUM"} />
            <Stat label="Cursos em andamento" value={String(data.cursos.length)} sub={`${data.sugeridos.length} sugeridos`} />
            <Stat label="Aulas concluídas" value={String(data.total_aulas_concluidas)} sub={`${data.total_horas_estudadas}h estudadas`} />
            <Stat label="Registros de saúde" value={String(data.medicoes.length + data.timeline.length)} sub="medições + eventos" />
          </div>
        </section>

        {/* Meus cursos */}
        <Section titulo="Meus cursos" subtitulo="Continue de onde parou">
          {data.cursos.length === 0 ? (
            <Empty msg="Você ainda não tem cursos liberados." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {data.cursos.map((curso) => (
                <article key={curso.id} style={cardStyle}>
                  {curso.capa_url && <img src={curso.capa_url} alt="" style={cardImg} />}
                  <div style={cardBody}>
                    <span style={metaTag}>{curso.categoria} · {curso.total_aulas} aulas</span>
                    <h3 style={cardTitle}>{curso.titulo}</h3>
                    <ProgressoBar pct={curso.percentual} />
                    <span style={{ fontSize: 12, color: c.muted }}>
                      {curso.aulas_concluidas}/{curso.total_aulas} aulas · {curso.percentual}%
                    </span>
                    <Link
                      to="/atlas/$slug/aprender"
                      params={{ slug: curso.slug }}
                      style={{ ...btn(c.sageDark), textDecoration: "none", textAlign: "center", marginTop: "auto" }}
                    >
                      {curso.aulas_concluidas === 0 ? "Começar" : curso.aulas_concluidas === curso.total_aulas ? "Revisar" : "Continuar"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Section>

        {/* Sugeridos */}
        {data.sugeridos.length > 0 && (
          <Section titulo="Cursos sugeridos" subtitulo="Conteúdos disponíveis para você adquirir">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {data.sugeridos.map((curso) => (
                <article key={curso.id} style={cardStyle}>
                  {curso.capa_url && <img src={curso.capa_url} alt="" style={cardImg} />}
                  <div style={cardBody}>
                    <span style={metaTag}>{curso.categoria} · {curso.total_aulas} aulas</span>
                    <h3 style={cardTitle}>{curso.titulo}</h3>
                    {curso.descricao_curta && <p style={{ fontSize: 13, color: c.muted, margin: 0, lineHeight: 1.5 }}>{curso.descricao_curta}</p>}
                    {curso.preco_label && <span style={{ fontSize: 13, color: c.gold, fontWeight: 500 }}>{curso.preco_label}</span>}
                    <Link
                      to="/atlas/$slug"
                      params={{ slug: curso.slug }}
                      style={{ ...btn(c.gold), textDecoration: "none", textAlign: "center", marginTop: "auto" }}
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* Perfil */}
        <Section
          titulo="Meu perfil"
          subtitulo="Seus dados e informações da gestação"
          action={
            <button onClick={() => setEditPerfil(true)} style={btn(c.sage)}>Editar</button>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, background: "white", border: `1px solid ${c.border}`, padding: 28 }}>
            <PerfilBloco titulo="Dados básicos" itens={[
              ["Nome", data.perfil.nome],
              ["E-mail", data.perfil.email],
              ["Telefone", data.perfil.telefone],
              ["Nascimento", formatDate(data.perfil.data_nascimento)],
              ["Cidade", data.perfil.cidade],
              ["Bairro", data.perfil.bairro],
              ["UBS", data.perfil.unidade_saude],
            ]} />
            <PerfilBloco titulo="Gestação" itens={[
              ["DUM", formatDate(data.perfil.dum)],
              ["Semana atual", data.semana_atual !== null ? `${data.semana_atual}ª semana` : null],
              ["DPP", formatDate(data.dpp)],
              ["Sexo do bebê", data.perfil.bebe_sexo],
              ["Gestações", data.perfil.numero_gestacoes],
              ["Partos", data.perfil.numero_partos],
              ["Abortos", data.perfil.numero_abortos],
            ]} />
          </div>
        </Section>

        {/* Evolução clínica */}
        <Section titulo="Minha evolução" subtitulo="Medições e histórico clínico">
          <EvolucaoClinica medicoes={data.medicoes} />
        </Section>

        {/* Timeline */}
        <Section titulo="Linha do tempo" subtitulo="Exames, vacinas e consultas">
          {data.timeline.length === 0 ? (
            <Empty msg="Nenhum evento registrado ainda." />
          ) : (
            <ol style={{ listStyle: "none", padding: 0, margin: 0, borderLeft: `2px solid ${c.border}` }}>
              {data.timeline.map((ev) => (
                <li key={ev.id} style={{ position: "relative", paddingLeft: 24, paddingBottom: 20 }}>
                  <span style={{ position: "absolute", left: -7, top: 6, width: 12, height: 12, background: tipoCor(ev.tipo), borderRadius: "50%" }} />
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted }}>
                    {formatDate(ev.data)} · {ev.tipo}
                  </div>
                  <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, marginTop: 2 }}>
                    {ev.titulo}
                    {ev.status && <span style={{ fontFamily: sans, fontSize: 11, marginLeft: 10, color: ev.status === "alterado" ? c.terra : c.sage, textTransform: "uppercase", letterSpacing: "0.1em" }}>· {ev.status}</span>}
                  </div>
                  {ev.observacao && <p style={{ fontSize: 13, color: c.muted, margin: "4px 0 0", lineHeight: 1.5 }}>{ev.observacao}</p>}
                </li>
              ))}
            </ol>
          )}
        </Section>
      </main>

      {editPerfil && (
        <EditarPerfilModal
          perfil={data.perfil}
          onClose={() => setEditPerfil(false)}
          onSaved={() => { setEditPerfil(false); reload(); }}
        />
      )}
    </div>
  );
}

// ============== Subcomponentes ==============

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "white", border: `1px solid ${c.border}`, padding: 20 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted }}>{label}</div>
      <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 400, color: c.sageDark, marginTop: 4, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: c.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Section({ titulo, subtitulo, action, children }: { titulo: string; subtitulo?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, margin: 0 }}>{titulo}</h2>
          {subtitulo && <p style={{ color: c.muted, margin: "4px 0 0", fontSize: 14 }}>{subtitulo}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p style={{ color: c.muted, fontStyle: "italic" }}>{msg}</p>;
}

function ProgressoBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 6, background: c.warm, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: c.sageDark, transition: "width 300ms" }} />
    </div>
  );
}

function PerfilBloco({ titulo, itens }: { titulo: string; itens: [string, React.ReactNode | null | undefined][] }) {
  return (
    <div>
      <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, margin: "0 0 16px" }}>{titulo}</h3>
      <dl style={{ margin: 0, display: "grid", gap: 10 }}>
        {itens.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: `1px dashed ${c.border}`, paddingBottom: 6 }}>
            <dt style={{ color: c.muted, fontSize: 13 }}>{k}</dt>
            <dd style={{ margin: 0, fontSize: 13, textAlign: "right", color: v ? c.ink : c.muted }}>{v ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EvolucaoClinica({ medicoes }: { medicoes: MembroDashboard["medicoes"] }) {
  const grupos = useMemo(() => {
    const g = new Map<string, typeof medicoes>();
    for (const m of medicoes) {
      const arr = g.get(m.parametro) ?? [];
      arr.push(m);
      g.set(m.parametro, arr);
    }
    return [...g.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [medicoes]);

  if (medicoes.length === 0) return <Empty msg="Nenhuma medição registrada ainda." />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
      {grupos.map(([param, arr]) => (
        <div key={param} style={{ background: "white", border: `1px solid ${c.border}`, padding: 20 }}>
          <h4 style={{ fontFamily: serif, fontSize: 18, fontWeight: 400, margin: "0 0 12px", textTransform: "capitalize" }}>{param}</h4>
          <Sparkline values={arr.map((m) => m.valor)} />
          <div style={{ marginTop: 10, fontSize: 12, color: c.muted, display: "flex", justifyContent: "space-between" }}>
            <span>Última: <strong style={{ color: c.ink }}>{arr[arr.length - 1].valor}</strong></span>
            <span>{arr.length} registro{arr.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const w = 280, h = 60;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 60 }}>
      <polyline points={pts} fill="none" stroke={c.sageDark} strokeWidth="2" />
      {values.map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return <circle key={i} cx={x} cy={y} r="3" fill={c.terra} />;
      })}
    </svg>
  );
}

function EditarPerfilModal({ perfil, onClose, onSaved }: {
  perfil: MembroDashboard["perfil"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateFn = useServerFn(updateMeuPerfil);
  const [f, setF] = useState({
    nome: perfil.nome ?? "",
    telefone: perfil.telefone ?? "",
    data_nascimento: perfil.data_nascimento ?? "",
    cidade: perfil.cidade ?? "",
    bairro: perfil.bairro ?? "",
    unidade_saude: perfil.unidade_saude ?? "",
    dum: perfil.dum ?? "",
    bebe_sexo: (perfil.bebe_sexo ?? "") as "" | "masculino" | "feminino" | "neutro",
    numero_gestacoes: perfil.numero_gestacoes ?? 0,
    numero_partos: perfil.numero_partos ?? 0,
    numero_abortos: perfil.numero_abortos ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    setSaving(true);
    try {
      await updateFn({ data: {
        nome: f.nome || null,
        telefone: f.telefone || null,
        data_nascimento: f.data_nascimento || null,
        cidade: f.cidade || null,
        bairro: f.bairro || null,
        unidade_saude: f.unidade_saude || null,
        dum: f.dum || null,
        bebe_sexo: f.bebe_sexo || null,
        numero_gestacoes: Number(f.numero_gestacoes) || 0,
        numero_partos: Number(f.numero_partos) || 0,
        numero_abortos: Number(f.numero_abortos) || 0,
      }});
      toast.success("Perfil atualizado");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: c.cream, maxWidth: 720, width: "100%", maxHeight: "92vh", overflow: "auto", padding: 32, border: `1px solid ${c.border}`, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: c.muted }}>×</button>
        <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, margin: "0 0 24px" }}>Editar perfil</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Nome completo"><input style={input} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
          <Field label="Telefone"><input style={input} value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Field>
          <Field label="Data de nascimento"><input type="date" style={input} value={f.data_nascimento} onChange={(e) => setF({ ...f, data_nascimento: e.target.value })} /></Field>
          <Field label="Cidade"><input style={input} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></Field>
          <Field label="Bairro"><input style={input} value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} /></Field>
          <Field label="UBS / unidade de saúde"><input style={input} value={f.unidade_saude} onChange={(e) => setF({ ...f, unidade_saude: e.target.value })} /></Field>

          <Field label="DUM (último ciclo)"><input type="date" style={input} value={f.dum} onChange={(e) => setF({ ...f, dum: e.target.value })} /></Field>
          <Field label="Sexo do bebê">
            <select style={input} value={f.bebe_sexo} onChange={(e) => setF({ ...f, bebe_sexo: e.target.value as any })}>
              <option value="">Não sei ainda</option>
              <option value="feminino">Menina</option>
              <option value="masculino">Menino</option>
              <option value="neutro">Não informar</option>
            </select>
          </Field>
          <Field label="Gestações"><input type="number" min={0} style={input} value={f.numero_gestacoes} onChange={(e) => setF({ ...f, numero_gestacoes: Number(e.target.value) })} /></Field>
          <Field label="Partos"><input type="number" min={0} style={input} value={f.numero_partos} onChange={(e) => setF({ ...f, numero_partos: Number(e.target.value) })} /></Field>
          <Field label="Abortos"><input type="number" min={0} style={input} value={f.numero_abortos} onChange={(e) => setF({ ...f, numero_abortos: Number(e.target.value) })} /></Field>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...btn(c.muted), background: "transparent", color: c.muted, border: `1px solid ${c.border}` }}>Cancelar</button>
          <button onClick={salvar} disabled={saving} style={{ ...btn(c.sageDark), opacity: saving ? 0.6 : 1 }}>{saving ? "Salvando…" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted }}>{label}</span>
      {children}
    </label>
  );
}

function TopBar({ onSair, admin }: { onSair: () => void; admin: boolean }) {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link to="/"><img src={lemateLogo} alt="Le Mater" style={{ height: 44 }} /></Link>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link to="/app/membro" style={navLink}>Minha área</Link>
        <Link to="/atlas" style={navLink}>Atlas Materno</Link>
        {admin && <Link to="/app/admin" style={navLink}>Admin</Link>}
        <button onClick={onSair} style={{ ...btn(c.sage), padding: "10px 20px" }}>Sair</button>
      </div>
    </nav>
  );
}

// ============== Estilos ==============

const cardStyle: CSSProperties = { background: "white", border: `1px solid ${c.border}`, display: "flex", flexDirection: "column", overflow: "hidden" };
const cardImg: CSSProperties = { width: "100%", height: 160, objectFit: "cover" };
const cardBody: CSSProperties = { padding: 20, display: "flex", flexDirection: "column", gap: 10, flex: 1 };
const cardTitle: CSSProperties = { fontFamily: serif, fontSize: 20, fontWeight: 400, margin: 0, lineHeight: 1.25 };
const metaTag: CSSProperties = { fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted };

const navLink: CSSProperties = { fontFamily: sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, textDecoration: "none" };

const input: CSSProperties = {
  background: "white", border: `1px solid ${c.border}`, padding: "10px 12px",
  fontSize: 14, fontFamily: sans, color: c.ink, outline: "none", width: "100%",
};

function btn(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 24px", border: "none", cursor: "pointer", fontFamily: sans };
}

function tipoCor(tipo: string): string {
  return tipo === "exame" ? c.terra : tipo === "imagem" ? c.gold : tipo === "vacina" ? c.sage : c.sageDark;
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
