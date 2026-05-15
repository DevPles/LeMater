import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  dashboardStats, listAllMateriais, listLeads, listAlunos, listCompras,
  upsertMaterial, deleteMaterial, liberarAcessoManual, revogarAcesso, reativarAcesso, enviarResetSenha,
} from "@/lib/admin.functions";
import lemateLogo from "@/assets/lemater-logo.png";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin · Le Mater" }], links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap" }] }),
  component: AdminPage,
});

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Tab = "dash" | "materiais" | "leads" | "alunos" | "compras";

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dash");

  if (loading) return <div style={{ padding: 40, fontFamily: sans, background: c.cream, minHeight: "100vh" }}>Carregando…</div>;
  if (!isAdmin) return (
    <div style={{ fontFamily: sans, background: c.cream, minHeight: "100vh", padding: 40, textAlign: "center" }}>
      <h1 style={{ fontFamily: serif }}>Acesso negado</h1>
      <Link to="/site">Voltar</Link>
    </div>
  );

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,245,238,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/site"><img src={lemateLogo} alt="Le Mater" style={{ height: 40 }} /></Link>
        <div style={{ display: "flex", gap: 4 }}>
          {(["dash","materiais","leads","alunos","compras"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={tabBtn(tab === t)}>{tabLabel(t)}</button>
          ))}
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }} style={btn(c.sage)}>Sair</button>
      </nav>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 80px" }}>
        {tab === "dash" && <DashboardTab />}
        {tab === "materiais" && <MateriaisTab />}
        {tab === "leads" && <LeadsTab />}
        {tab === "alunos" && <AlunosTab />}
        {tab === "compras" && <ComprasTab />}
      </main>
    </div>
  );
}

function DashboardTab() {
  const fn = useServerFn(dashboardStats);
  const [s, setS] = useState<{ leads: number; alunos_ativos: number; materiais_publicados: number } | null>(null);
  useEffect(() => { fn().then(setS); }, []);
  return (
    <div>
      <h1 style={h1}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        <Stat label="Leads grátis" value={s?.leads ?? "…"} />
        <Stat label="Alunos com acesso ativo" value={s?.alunos_ativos ?? "…"} />
        <Stat label="Materiais publicados" value={s?.materiais_publicados ?? "…"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: "white", border: `1px solid ${c.border}`, padding: 28 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.muted, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 300 }}>{value}</div>
    </div>
  );
}

type MaterialRow = {
  id: string; titulo: string; descricao: string | null; categoria: string;
  tipo: "pdf" | "video_externo" | "video_upload" | "artigo";
  area: "gratis" | "pago"; conteudo_url: string | null; conteudo_html: string | null;
  capa_url: string | null; ordem: number; publicado: boolean;
};

function MateriaisTab() {
  const list = useServerFn(listAllMateriais);
  const upsert = useServerFn(upsertMaterial);
  const del = useServerFn(deleteMaterial);
  const [items, setItems] = useState<MaterialRow[]>([]);
  const [edit, setEdit] = useState<Partial<MaterialRow> | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => list().then((d) => setItems(d as MaterialRow[]));
  useEffect(() => { reload(); }, []);

  const novo = () => setEdit({ titulo: "", descricao: "", categoria: "geral", tipo: "pdf", area: "gratis", conteudo_url: "", conteudo_html: "", capa_url: "", ordem: 0, publicado: false });

  const salvar = async () => {
    if (!edit?.titulo || !edit.tipo || !edit.area) return;
    setBusy(true);
    try {
      let conteudo_url = edit.conteudo_url ?? null;
      // Upload se houver arquivo
      const fileInput = document.getElementById("matFile") as HTMLInputElement | null;
      if (fileInput?.files?.[0] && (edit.tipo === "pdf" || edit.tipo === "video_upload")) {
        const f = fileInput.files[0];
        const bucket = edit.tipo === "pdf" ? "materiais-pdf" : "materiais-video";
        const path = `${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, { upsert: false });
        if (upErr) { alert("Falha no upload: " + upErr.message); setBusy(false); return; }
        conteudo_url = path;
      }
      await upsert({ data: {
        id: edit.id, titulo: edit.titulo!, descricao: edit.descricao ?? null,
        categoria: edit.categoria || "geral", tipo: edit.tipo!, area: edit.area!,
        conteudo_url, conteudo_html: edit.conteudo_html ?? null, capa_url: edit.capa_url ?? null,
        ordem: edit.ordem ?? 0, publicado: !!edit.publicado,
      } });
      setEdit(null);
      await reload();
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const remover = async (id: string) => {
    if (!confirm("Remover este material?")) return;
    await del({ data: { id } });
    reload();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={h1}>Materiais</h1>
        <button onClick={novo} style={btn(c.sageDark)}>Novo material</button>
      </div>

      <div style={{ background: "white", border: `1px solid ${c.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: c.warm }}>
              <Th>Título</Th><Th>Área</Th><Th>Tipo</Th><Th>Categoria</Th><Th>Pub.</Th><Th> </Th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} style={{ borderTop: `1px solid ${c.border}` }}>
                <Td>{m.titulo}</Td><Td>{m.area}</Td><Td>{m.tipo}</Td><Td>{m.categoria}</Td>
                <Td>{m.publicado ? "Sim" : "Não"}</Td>
                <Td>
                  <button onClick={() => setEdit(m)} style={btnSm(c.sage)}>Editar</button>{" "}
                  <button onClick={() => remover(m.id)} style={btnSm(c.danger)}>Excluir</button>
                </Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={6}>Nenhum material cadastrado.</Td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div onClick={() => setEdit(null)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", maxWidth: 720, width: "100%", padding: 32, border: `1px solid ${c.border}`, maxHeight: "90vh", overflow: "auto" }}>
            <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, margin: "0 0 20px" }}>{edit.id ? "Editar material" : "Novo material"}</h2>
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Título"><input value={edit.titulo ?? ""} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} style={inp} /></Field>
              <Field label="Descrição"><textarea value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} style={{ ...inp, minHeight: 80 }} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Área"><select value={edit.area} onChange={(e) => setEdit({ ...edit, area: e.target.value as any })} style={inp}><option value="gratis">Grátis</option><option value="pago">Pago</option></select></Field>
                <Field label="Tipo"><select value={edit.tipo} onChange={(e) => setEdit({ ...edit, tipo: e.target.value as any })} style={inp}>
                  <option value="pdf">PDF</option><option value="video_externo">Vídeo externo</option><option value="video_upload">Vídeo upload</option><option value="artigo">Artigo</option>
                </select></Field>
                <Field label="Categoria"><input value={edit.categoria ?? "geral"} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} style={inp} /></Field>
              </div>
              {(edit.tipo === "pdf" || edit.tipo === "video_upload") && (
                <Field label={`Arquivo ${edit.conteudo_url ? "(atual: " + edit.conteudo_url + ")" : ""}`}>
                  <input id="matFile" type="file" accept={edit.tipo === "pdf" ? "application/pdf" : "video/*"} style={inp} />
                </Field>
              )}
              {edit.tipo === "video_externo" && (
                <Field label="URL do vídeo (YouTube/Vimeo)"><input value={edit.conteudo_url ?? ""} onChange={(e) => setEdit({ ...edit, conteudo_url: e.target.value })} style={inp} /></Field>
              )}
              {edit.tipo === "artigo" && (
                <Field label="Conteúdo HTML"><textarea value={edit.conteudo_html ?? ""} onChange={(e) => setEdit({ ...edit, conteudo_html: e.target.value })} style={{ ...inp, minHeight: 200, fontFamily: "monospace", fontSize: 13 }} /></Field>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Ordem"><input type="number" value={edit.ordem ?? 0} onChange={(e) => setEdit({ ...edit, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
                <Field label="Publicado"><label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0" }}><input type="checkbox" checked={!!edit.publicado} onChange={(e) => setEdit({ ...edit, publicado: e.target.checked })} /> Visível ao público</label></Field>
              </div>
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
function tabLabel(t: Tab) { return t === "dash" ? "Painel" : t === "materiais" ? "Materiais" : t === "leads" ? "Leads" : t === "alunos" ? "Alunos" : "Compras"; }

function Th({ children }: { children: any }) { return <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, fontWeight: 500 }}>{children}</th>; }
function Td({ children, colSpan }: { children: any; colSpan?: number }) { return <td colSpan={colSpan} style={{ padding: "12px 14px", color: c.ink }}>{children}</td>; }
function Field({ label, children }: { label: string; children: any }) {
  return <label style={{ display: "block" }}><div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>{children}</label>;
}
