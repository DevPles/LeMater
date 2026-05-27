import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  dashboardStats, dashboardOverview, listLeads, listAlunos, listCompras,
  liberarAcessoManual, revogarAcesso, reativarAcesso, enviarResetSenha,
} from "@/lib/admin.functions";
import AtlasContentTab from "@/components/admin/AtlasContentTab";
import { ConsultasTab } from "@/components/admin/ConsultasTab";
import { GravacoesTab } from "@/components/admin/GravacoesTab";
import { ProfissionaisTab } from "@/components/admin/ProfissionaisTab";
import { UsuariosTab } from "@/components/admin/UsuariosTab";
import { AcessosUsuariosTab } from "@/components/admin/AcessosUsuariosTab";
import { DadosClinicosTab } from "@/components/admin/DadosClinicosTab";
import { ParametrosTab } from "@/components/admin/ParametrosTab";
import { RelatoriosEpidemiologicosTab } from "@/components/admin/RelatoriosEpidemiologicosTab";
import { VendasTab } from "@/components/admin/VendasTab";
import lemateLogo from "@/assets/logo_monograma.png";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({ meta: [{ title: "Admin · Le Mater" }] }),
  component: AdminPage,
});

// Paleta da marca (navy + gold + cream) — alinhada ao resto do app
const c = {
  cream: "#faf8f3",
  warm: "#f3eddf",
  navy: "#1a1557",
  navyDark: "#120f3f",
  gold: "#f0c040",
  goldDark: "#d4a52a",
  ink: "#1a1557",
  muted: "#6b6883",
  border: "#e8e3d4",
  danger: "#b23a48",
  ok: "#2f7a4e",
  // aliases mantidos para retrocompatibilidade dos componentes existentes
  sage: "#1a1557",
  sageDark: "#1a1557",
};
const serif = "'Playfair Display', serif";
const sans = "'DM Sans', sans-serif";


type Tab =
  | "dash"
  | "atlas"
  | "consultas" | "gravacoes" | "profissionais"
  | "dados" | "parametros" | "relatorios"
  | "leads" | "alunos" | "usuarios" | "acessos" | "compras" | "vendas";

const TAB_GROUPS: { label: string; tabs: { id: Tab; label: string }[] }[] = [
  { label: "Painel", tabs: [{ id: "dash", label: "Painel" }] },
  { label: "Vendas", tabs: [
    { id: "vendas", label: "Vendas & cupons" },
  ]},
  { label: "Conteúdos", tabs: [
    { id: "atlas", label: "Atlas" },
  ]},
  { label: "Operação", tabs: [
    { id: "consultas", label: "Consultas" },
    { id: "gravacoes", label: "Gravações" },
    { id: "profissionais", label: "Profissionais" },
  ]},
  { label: "Clínica", tabs: [
    { id: "dados", label: "Dados clínicos" },
    { id: "parametros", label: "Parâmetros" },
    { id: "relatorios", label: "Relatórios" },
  ]},
  { label: "Pessoas", tabs: [
    { id: "leads", label: "Leads" },
    { id: "alunos", label: "Alunos" },
    { id: "usuarios", label: "Gestantes" },
    { id: "acessos", label: "Acessos" },
    { id: "compras", label: "Compras" },
  ]},
];

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dash");
  const [openGroup, setOpenGroup] = useState<string>("Painel");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <div style={{ padding: 40, fontFamily: sans, background: c.cream, minHeight: "100vh" }}>Carregando…</div>;
  if (!isAdmin) return (
    <div style={{ fontFamily: sans, background: c.cream, minHeight: "100vh", padding: 40, textAlign: "center" }}>
      <h1 style={{ fontFamily: serif }}>Acesso negado</h1>
      <Link to="/">Voltar</Link>
    </div>
  );

  const currentLabel = TAB_GROUPS.flatMap((g) => g.tabs).find((t) => t.id === tab)?.label ?? "";

  const select = (groupLabel: string, id: Tab) => {
    setOpenGroup(groupLabel);
    setTab(id);
    setMobileOpen(false);
  };

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh", display: "flex" }}>
      <aside
        className={mobileOpen ? "admin-sidebar admin-sidebar-open" : "admin-sidebar"}
        style={{ width: 240, background: "#1a1557", color: "white", minHeight: "100vh", position: "sticky", top: 0, alignSelf: "flex-start", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <Link to="/"><img src={lemateLogo} alt="Le Mater" style={{ height: 32 }} /></Link>
          <div>
            <div style={{ fontFamily: serif, fontSize: 16, lineHeight: 1 }}>Admin</div>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "#f0c040", marginTop: 4 }}>LE MATER</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {TAB_GROUPS.map((group) => {
            const isOpen = openGroup === group.label;
            const hasActive = group.tabs.some((t) => t.id === tab);
            return (
              <div key={group.label} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => setOpenGroup(isOpen ? "" : group.label)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", color: hasActive ? "#f0c040" : "rgba(255,255,255,0.75)", padding: "9px 12px", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", borderRadius: 6, fontFamily: sans }}
                >
                  <span>{group.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.6, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: 6, paddingTop: 2, paddingBottom: 6 }}>
                    {group.tabs.map((t) => {
                      const active = tab === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => select(group.label, t.id)}
                          style={{ width: "100%", textAlign: "left", background: active ? "rgba(240,192,64,0.15)" : "transparent", border: "none", color: active ? "#f0c040" : "rgba(255,255,255,0.7)", padding: "7px 14px", fontSize: 13, cursor: "pointer", borderRadius: 6, borderLeft: active ? "2px solid #f0c040" : "2px solid transparent", fontFamily: sans, marginBottom: 1 }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/app" }); }}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.12)", padding: "10px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", borderRadius: 8, fontFamily: sans }}
          >
            Sair
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button aria-label="Fechar" onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", border: 0, zIndex: 40 }} />
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: `1px solid ${c.border}`, background: "rgba(250,245,238,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="admin-burger"
              style={{ display: "none", background: c.sageDark, color: "white", border: 0, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Menu
            </button>
            <h2 style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, margin: 0 }}>{currentLabel}</h2>
          </div>
        </header>
        <main style={{ maxWidth: 1280, width: "100%", margin: "0 auto", padding: "28px 24px 80px", flex: 1 }}>
          {tab === "dash" && <DashboardTab onGoTo={setTab} />}
          {tab === "atlas" && <AtlasContentTab />}
          {tab === "consultas" && <ConsultasTab />}
          {tab === "gravacoes" && <GravacoesTab />}
          {tab === "profissionais" && <ProfissionaisTab />}
          {tab === "dados" && <DadosClinicosTab />}
          {tab === "parametros" && <ParametrosTab />}
          {tab === "relatorios" && <RelatoriosEpidemiologicosTab />}
          {tab === "leads" && <LeadsTab />}
          {tab === "alunos" && <AlunosTab />}
          {tab === "usuarios" && <UsuariosTab />}
          {tab === "acessos" && <AcessosUsuariosTab />}
          {tab === "compras" && <ComprasTab />}
          {tab === "vendas" && <VendasTab />}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-sidebar { position: fixed !important; top: 0; left: 0; z-index: 50; transform: translateX(-100%); transition: transform 0.25s; }
          .admin-sidebar-open { transform: translateX(0) !important; }
          .admin-burger { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}

type DashboardData = Awaited<ReturnType<typeof dashboardOverview>>;

function DashboardTab({ onGoTo }: { onGoTo?: (t: Tab) => void }) {
  const fn = useServerFn(dashboardOverview);
  const [d, setD] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fn().then(setD).catch((e) => setErr(e?.message ?? "Falha ao carregar"));
  }, []);

  if (err) return <div style={{ color: c.danger }}>Erro: {err}</div>;
  if (!d) return <div style={{ color: c.muted, fontSize: 13 }}>Carregando indicadores…</div>;

  const k = d.kpis;
  const fmtBRL = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents ?? 0) / 100);
  const deltaPct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100));
  const dReceita = deltaPct(k.receita_mes_centavos, k.receita_mes_ant_centavos);
  const dPedidos = deltaPct(k.pedidos_mes, k.pedidos_mes_ant);

  return (
    <div>
      <h1 style={h1}>Painel geral</h1>

      <div style={kpiGrid}>
        <Kpi label="Receita do mês" value={fmtBRL(k.receita_mes_centavos)} hint={`${dReceita >= 0 ? "+" : ""}${dReceita}% vs mês ant.`} tone={dReceita >= 0 ? "ok" : "danger"} accent />
        <Kpi label="Pedidos pagos no mês" value={k.pedidos_mes} hint={`${dPedidos >= 0 ? "+" : ""}${dPedidos}% vs mês ant.`} tone={dPedidos >= 0 ? "ok" : "danger"} onClick={() => onGoTo?.("vendas")} />
        <Kpi label="Alunos com acesso ativo" value={k.alunos_ativos} onClick={() => onGoTo?.("alunos")} />
        <Kpi label="Gestantes cadastradas" value={k.gestantes} onClick={() => onGoTo?.("usuarios")} />
        <Kpi label="Leads grátis" value={k.leads_total} hint={`+${k.leads_7d} últimos 7 dias`} onClick={() => onGoTo?.("leads")} />
        <Kpi label="Matrículas ativas" value={k.matriculas_ativas} />
        <Kpi label="Cursos publicados" value={k.cursos_publicados} />
        <Kpi label="Materiais publicados" value={k.materiais_publicados} />
      </div>

      <div style={chartsGrid}>
        <Panel title="Pedidos pagos · últimos 14 dias">
          <DailyBars data={d.series.pedidos_14d} color={c.navy} />
        </Panel>
        <Panel title="Receita diária (R$) · últimos 14 dias">
          <DailyBars data={d.series.receita_14d} color={c.gold} />
        </Panel>
        <Panel title="Novos leads · últimos 14 dias">
          <DailyBars data={d.series.leads_14d} color={c.goldDark} />
        </Panel>
        <Panel title="Vendas por plataforma (mês)">
          <PlatformList items={d.plataformas} />
        </Panel>
      </div>

      <div style={listsGrid}>
        <Panel
          title="Pedidos recentes"
          action={<button onClick={() => onGoTo?.("vendas")} style={linkBtn}>Ver tudo</button>}
        >
          {d.pedidos_recentes.length === 0 ? (
            <Empty>Nenhum pedido ainda.</Empty>
          ) : (
            <table style={mini}>
              <thead>
                <tr>
                  <ThMini>Data</ThMini>
                  <ThMini>Comprador</ThMini>
                  <ThMini>Produto</ThMini>
                  <ThMini>Plataforma</ThMini>
                  <ThMini>Valor</ThMini>
                  <ThMini>Status</ThMini>
                </tr>
              </thead>
              <tbody>
                {d.pedidos_recentes.map((o: any) => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${c.border}` }}>
                    <TdMini>{new Date(o.created_at).toLocaleDateString("pt-BR")}</TdMini>
                    <TdMini>{o.comprador_nome ?? o.comprador_email}</TdMini>
                    <TdMini>{o.produto_tipo}</TdMini>
                    <TdMini>{o.plataforma}</TdMini>
                    <TdMini>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: o.moeda || "BRL" }).format((o.valor_centavos ?? 0) / 100)}</TdMini>
                    <TdMini><StatusBadge status={o.status} /></TdMini>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="Leads recentes"
          action={<button onClick={() => onGoTo?.("leads")} style={linkBtn}>Ver tudo</button>}
        >
          {d.leads_recentes.length === 0 ? (
            <Empty>Nenhum lead ainda.</Empty>
          ) : (
            <table style={mini}>
              <thead>
                <tr><ThMini>Data</ThMini><ThMini>Nome</ThMini><ThMini>E-mail</ThMini><ThMini>Material</ThMini></tr>
              </thead>
              <tbody>
                {d.leads_recentes.map((l: any) => (
                  <tr key={l.id} style={{ borderTop: `1px solid ${c.border}` }}>
                    <TdMini>{new Date(l.created_at).toLocaleDateString("pt-BR")}</TdMini>
                    <TdMini>{l.nome}</TdMini>
                    <TdMini>{l.email}</TdMini>
                    <TdMini>{l.materiais?.titulo ?? "—"}</TdMini>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}

const kpiGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 };
const chartsGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 22 };
const listsGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 14 };
const linkBtn: CSSProperties = { background: "transparent", color: c.navy, border: `1px solid ${c.border}`, padding: "5px 10px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: sans, borderRadius: 6 };
const mini: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };

function Kpi({ label, value, hint, tone, accent, onClick }: { label: string; value: number | string; hint?: string; tone?: "ok" | "danger"; accent?: boolean; onClick?: () => void }) {
  const hintColor = tone === "danger" ? c.danger : tone === "ok" ? c.ok : c.muted;
  return (
    <div
      onClick={onClick}
      style={{
        background: accent ? c.navy : "white",
        color: accent ? "white" : c.ink,
        border: `1px solid ${accent ? c.navy : c.border}`,
        padding: 18,
        borderRadius: 10,
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: accent ? "0 6px 18px -10px rgba(26,21,87,0.5)" : "0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: accent ? "rgba(255,255,255,0.7)" : c.muted, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, color: accent ? c.gold : c.navy, lineHeight: 1.1 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: accent ? "rgba(255,255,255,0.7)" : hintColor, marginTop: 8, fontWeight: 500 }}>{hint}</div>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: `1px solid ${c.border}`, borderRadius: 10, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, fontWeight: 700 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: c.muted, padding: "20px 0", textAlign: "center" }}>{children}</div>;
}

function DailyBars({ data, color }: { data: { dia: string; valor: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 110 }}>
        {data.map((p, i) => {
          const h = Math.max(2, Math.round((p.valor / max) * 100));
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${p.dia}: ${p.valor}`}>
              <div style={{ width: "100%", height: `${h}%`, background: color, borderRadius: 3, opacity: p.valor === 0 ? 0.18 : 1 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: c.muted, marginTop: 6, letterSpacing: "0.05em" }}>
        <span>{data[0]?.dia}</span>
        <span>{data[Math.floor(data.length / 2)]?.dia}</span>
        <span>{data[data.length - 1]?.dia}</span>
      </div>
      <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>
        Total: <b style={{ color: c.ink }}>{data.reduce((a, b) => a + b.valor, 0).toLocaleString("pt-BR")}</b>
      </div>
    </div>
  );
}

function PlatformList({ items }: { items: { name: string; value: number }[] }) {
  if (items.length === 0) return <Empty>Sem vendas neste mês.</Empty>;
  const total = items.reduce((a, b) => a + b.value, 0);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it) => {
        const pct = Math.round((it.value / total) * 100);
        return (
          <div key={it.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ textTransform: "capitalize", color: c.ink, fontWeight: 600 }}>{it.name}</span>
              <span style={{ color: c.muted }}>{it.value} · {pct}%</span>
            </div>
            <div style={{ height: 6, background: c.warm, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: c.navy }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const bg =
    status === "aprovado" ? "#e6f3ec" :
    status === "pendente" ? "#fff4d6" :
    status === "cancelado" || status === "recusado" ? "#fbe6e8" : c.warm;
  const fg =
    status === "aprovado" ? c.ok :
    status === "pendente" ? c.goldDark :
    status === "cancelado" || status === "recusado" ? c.danger : c.muted;
  return (
    <span style={{ background: bg, color: fg, padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {status}
    </span>
  );
}

function ThMini({ children }: { children: any }) {
  return <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, fontWeight: 600, background: c.cream }}>{children}</th>;
}
function TdMini({ children }: { children: any }) {
  return <td style={{ padding: "8px 10px", color: c.ink, fontSize: 12 }}>{children}</td>;
}


// MateriaisTab foi extraído para src/components/admin/MateriaisTab.tsx (usado via ConteudosTab).

function LeadsTab() {
  const fn = useServerFn(listLeads);
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { fn().then(setItems); }, []);
  const csv = () => {
    const rows = [["Data", "Nome", "Email", "Telefone", "Material"], ...items.map((l) => [
      new Date(l.created_at).toLocaleString("pt-BR"), l.nome, l.email, l.telefone, l.materiais?.titulo ?? "",
    ])];
    const blob = new Blob([rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leads.csv"; a.click();
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={h1}>Leads (área grátis)</h1>
        <button onClick={csv} style={btn(c.sageDark)}>Exportar CSV</button>
      </div>
      <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: c.warm }}><Th>Data</Th><Th>Nome</Th><Th>E-mail</Th><Th>Telefone</Th><Th>Material</Th></tr></thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} style={{ borderTop: `1px solid ${c.border}` }}>
                <Td>{new Date(l.created_at).toLocaleString("pt-BR")}</Td>
                <Td>{l.nome}</Td><Td>{l.email}</Td><Td>{l.telefone}</Td><Td>{l.materiais?.titulo ?? "—"}</Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={5}>Sem leads ainda.</Td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlunosTab() {
  const fn = useServerFn(listAlunos);
  const liberar = useServerFn(liberarAcessoManual);
  const revogar = useServerFn(revogarAcesso);
  const reativar = useServerFn(reativarAcesso);
  const reset = useServerFn(enviarResetSenha);
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [novo, setNovo] = useState({ email: "", nome: "" });

  const reload = () => fn().then(setItems);
  useEffect(() => { reload(); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={h1}>Alunos com acesso pago</h1>
        <button onClick={() => setShowAdd(true)} style={btn(c.sageDark)}>Liberar acesso manual</button>
      </div>
      <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: c.warm }}><Th>Nome</Th><Th>E-mail</Th><Th>Origem</Th><Th>Status</Th><Th>Ações</Th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} style={{ borderTop: `1px solid ${c.border}` }}>
                <Td>{a.nome ?? "—"}</Td><Td>{a.email ?? "—"}</Td><Td>{a.origem}</Td>
                <Td><span style={{ color: a.ativo ? c.sageDark : c.danger, fontWeight: 500 }}>{a.ativo ? "Ativo" : "Revogado"}</span></Td>
                <Td>
                  {a.ativo
                    ? <button style={btnSm(c.danger)} onClick={async () => { await revogar({ data: { user_id: a.user_id } }); reload(); }}>Revogar</button>
                    : <button style={btnSm(c.sageDark)} onClick={async () => { await reativar({ data: { user_id: a.user_id } }); reload(); }}>Reativar</button>}
                  {a.email && <> <button style={btnSm(c.sage)} onClick={async () => { await reset({ data: { email: a.email } }); alert("Link de redefinição gerado."); }}>Reset senha</button></>}
                </Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={5}>Nenhum aluno ainda.</Td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", maxWidth: 480, width: "100%", padding: 32, border: `1px solid ${c.border}` }}>
            <h2 style={{ fontFamily: serif, fontSize: 24, margin: "0 0 16px", fontWeight: 400 }}>Liberar acesso manual</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="E-mail"><input value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} style={inp} /></Field>
              <Field label="Nome (opcional)"><input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} style={inp} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)} style={btn(c.muted)}>Cancelar</button>
              <button onClick={async () => {
                try { await liberar({ data: { email: novo.email, nome: novo.nome || undefined } }); setShowAdd(false); setNovo({ email: "", nome: "" }); reload(); }
                catch (e: any) { alert(e.message); }
              }} style={btn(c.sageDark)}>Liberar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComprasTab() {
  const fn = useServerFn(listCompras);
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { fn().then(setItems); }, []);
  return (
    <div>
      <h1 style={h1}>Compras Hotmart</h1>
      <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: c.warm }}><Th>Data</Th><Th>Comprador</Th><Th>E-mail</Th><Th>Produto</Th><Th>Evento</Th><Th>Status</Th><Th>Transaction</Th></tr></thead>
          <tbody>
            {items.map((h) => (
              <tr key={h.id} style={{ borderTop: `1px solid ${c.border}` }}>
                <Td>{new Date(h.processado_em).toLocaleString("pt-BR")}</Td>
                <Td>{h.nome_comprador ?? "—"}</Td><Td>{h.email_comprador}</Td>
                <Td>{h.produto ?? "—"}</Td><Td>{h.evento}</Td><Td>{h.status}</Td><Td>{h.transaction_id ?? "—"}</Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={7}>Sem registros.</Td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type AtlasCardRow = {
  id: string; titulo: string; descricao: string | null;
  imagem_url: string | null; video_url: string | null; link: string | null;
  categoria: string | null; ordem: number; ativo: boolean;
};

function AtlasCardsTab() {
  const [items, setItems] = useState<AtlasCardRow[]>([]);
  const [edit, setEdit] = useState<Partial<AtlasCardRow> | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const { data, error } = await supabase
      .from("atlas_cards")
      .select("*")
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true });
    if (error) { alert(error.message); return; }
    setItems((data ?? []) as AtlasCardRow[]);
  };
  useEffect(() => { reload(); }, []);

  const novo = () => setEdit({ titulo: "", descricao: "", imagem_url: "", video_url: "", link: "", categoria: "", ordem: 0, ativo: true });

  const salvar = async () => {
    if (!edit?.titulo) { alert("Título é obrigatório"); return; }
    setBusy(true);
    const payload = {
      titulo: edit.titulo,
      descricao: edit.descricao || null,
      imagem_url: edit.imagem_url || null,
      video_url: edit.video_url || null,
      link: edit.link || null,
      categoria: edit.categoria || null,
      ordem: edit.ordem ?? 0,
      ativo: edit.ativo ?? true,
    };
    const { error } = edit.id
      ? await supabase.from("atlas_cards").update(payload).eq("id", edit.id)
      : await supabase.from("atlas_cards").insert(payload);
    setBusy(false);
    if (error) { alert(error.message); return; }
    setEdit(null);
    reload();
  };

  const remover = async (id: string) => {
    if (!confirm("Remover este card?")) return;
    const { error } = await supabase.from("atlas_cards").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    reload();
  };

  const toggleAtivo = async (row: AtlasCardRow) => {
    const { error } = await supabase.from("atlas_cards").update({ ativo: !row.ativo }).eq("id", row.id);
    if (error) { alert(error.message); return; }
    reload();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={h1}>Atlas Materno</h1>
        <button onClick={novo} style={btn(c.sageDark)}>Novo card</button>
      </div>

      <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: c.warm }}>
            <Th>Ordem</Th><Th>Título</Th><Th>Categoria</Th><Th>Mídia</Th><Th>Ativo</Th><Th> </Th>
          </tr></thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} style={{ borderTop: `1px solid ${c.border}` }}>
                <Td>{row.ordem}</Td>
                <Td>{row.titulo}</Td>
                <Td>{row.categoria ?? "—"}</Td>
                <Td>{[row.imagem_url && "Imagem", row.video_url && "Vídeo", row.link && "Link"].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>
                  <button onClick={() => toggleAtivo(row)} style={{ ...btnSm(row.ativo ? c.sageDark : c.muted) }}>
                    {row.ativo ? "Ativo" : "Inativo"}
                  </button>
                </Td>
                <Td>
                  <button onClick={() => setEdit(row)} style={btnSm(c.sage)}>Editar</button>{" "}
                  <button onClick={() => remover(row.id)} style={btnSm(c.danger)}>Excluir</button>
                </Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={6}>Nenhum card cadastrado.</Td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div onClick={() => setEdit(null)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", maxWidth: 640, width: "100%", padding: 32, border: `1px solid ${c.border}`, maxHeight: "90vh", overflow: "auto" }}>
            <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, margin: "0 0 20px" }}>{edit.id ? "Editar card" : "Novo card"}</h2>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Título"><input value={edit.titulo ?? ""} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} style={inp} /></Field>
              <Field label="Descrição"><textarea value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} style={{ ...inp, minHeight: 90 }} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Categoria"><input value={edit.categoria ?? ""} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} style={inp} placeholder="ex: Pré-natal" /></Field>
                <Field label="Ordem"><input type="number" value={edit.ordem ?? 0} onChange={(e) => setEdit({ ...edit, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
              </div>
              <Field label="URL da imagem"><input value={edit.imagem_url ?? ""} onChange={(e) => setEdit({ ...edit, imagem_url: e.target.value })} style={inp} placeholder="https://..." /></Field>
              <Field label="URL do vídeo"><input value={edit.video_url ?? ""} onChange={(e) => setEdit({ ...edit, video_url: e.target.value })} style={inp} placeholder="YouTube, Vimeo ou MP4" /></Field>
              <Field label="Link (botão / destino do card)"><input value={edit.link ?? ""} onChange={(e) => setEdit({ ...edit, link: e.target.value })} style={inp} placeholder="https://..." /></Field>
              <Field label="Status"><label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0" }}><input type="checkbox" checked={!!edit.ativo} onChange={(e) => setEdit({ ...edit, ativo: e.target.checked })} /> Card ativo (visível ao público)</label></Field>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button onClick={() => setEdit(null)} style={btn(c.muted)}>Cancelar</button>
              <button onClick={salvar} disabled={busy} style={{ ...btn(c.sageDark), opacity: busy ? 0.6 : 1 }}>{busy ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const h1: CSSProperties = { fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 24px" };
const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };
const modalBg: CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,28,26,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };

function btn(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans };
}
function btnSm(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: sans };
}
function tabBtn(active: boolean): CSSProperties {
  return { background: active ? c.sageDark : "transparent", color: active ? "white" : c.muted, fontSize: 12, fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", padding: "10px 18px", border: "none", cursor: "pointer", fontFamily: sans };
}


function Th({ children }: { children: any }) { return <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, fontWeight: 500 }}>{children}</th>; }
function Td({ children, colSpan }: { children: any; colSpan?: number }) { return <td colSpan={colSpan} style={{ padding: "12px 14px", color: c.ink }}>{children}</td>; }
function Field({ label, children }: { label: string; children: any }) {
  return <label style={{ display: "block" }}><div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>{children}</label>;
}

// AcessosSection extraído junto com MateriaisTab para src/components/admin/MateriaisTab.tsx
