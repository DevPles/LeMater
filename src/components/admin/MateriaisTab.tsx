import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import TranslationsPanel from "@/components/admin/TranslationsPanel";
import {
  listAllMateriais, upsertMaterial, deleteMaterial,
  buscarUsuarios, listMaterialAcessos, liberarAcessoMaterial, revogarAcessoMaterial,
} from "@/lib/admin.functions";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const h1: CSSProperties = { fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 24px" };
const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };
const modalBg: CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,28,26,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const btn = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans });
const btnSm = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: sans });
const Th = ({ children }: any) => <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, fontWeight: 500 }}>{children}</th>;
const Td = ({ children, colSpan }: any) => <td colSpan={colSpan} style={{ padding: "12px 14px", color: c.ink }}>{children}</td>;
const Field = ({ label, children }: any) => <label style={{ display: "block" }}><div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>{children}</label>;

type MaterialRow = {
  id: string; titulo: string; descricao: string | null; categoria: string;
  tipo: "pdf" | "video_externo" | "video_upload" | "artigo";
  area: "gratis" | "pago"; acesso: "publico" | "restrito";
  conteudo_url: string | null; conteudo_html: string | null;
  capa_url: string | null; ordem: number; publicado: boolean;
  link_compra: string | null; plataforma_venda: string | null;
  preco_label: string | null; cta_label: string | null;
};

/**
 * MateriaisTab unificada. Quando `forcarCategoria` é informado:
 * - lista é filtrada a essa categoria
 * - formulário "Novo" pré-seleciona essa categoria
 * - usado para o modo "Serviço" (categoria=Serviço)
 */
export default function MateriaisTab({
  forcarCategoria,
  titulo = "Materiais",
  ctaNovo = "Novo material",
  esconderNovo = false,
}: { forcarCategoria?: string; titulo?: string; ctaNovo?: string; esconderNovo?: boolean } = {}) {
  const isServicoMode = (forcarCategoria || "").toLowerCase() === "serviço";
  const list = useServerFn(listAllMateriais);
  const upsert = useServerFn(upsertMaterial);
  const del = useServerFn(deleteMaterial);
  const [allItems, setAllItems] = useState<MaterialRow[]>([]);
  const [edit, setEdit] = useState<Partial<MaterialRow> | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => list().then((d) => setAllItems(d as MaterialRow[]));
  useEffect(() => { reload(); }, []);

  const items = useMemo(() => {
    if (!forcarCategoria) return allItems;
    return allItems.filter((m) => (m.categoria || "").toLowerCase() === forcarCategoria.toLowerCase());
  }, [allItems, forcarCategoria]);

  const novo = () => setEdit({
    titulo: "", descricao: "",
    categoria: forcarCategoria ?? "Concepção",
    tipo: isServicoMode ? "artigo" : "pdf", area: forcarCategoria ? "pago" : "gratis",
    acesso: "publico",
    conteudo_url: "", conteudo_html: "", capa_url: "",
    link_compra: "", plataforma_venda: "", preco_label: "", cta_label: "",
    ordem: 0, publicado: false,
  });




  const salvar = async () => {
    if (!edit?.titulo || !edit.tipo || !edit.area) return;
    setBusy(true);
    try {
      let conteudo_url = edit.conteudo_url ?? null;
      let capa_url = edit.capa_url ?? null;
      const fileInput = document.getElementById("matFile") as HTMLInputElement | null;
      if (fileInput?.files?.[0] && (edit.tipo === "pdf" || edit.tipo === "video_upload")) {
        const f = fileInput.files[0];
        const bucket = edit.tipo === "pdf" ? "materiais-pdf" : "materiais-video";
        const path = `${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, { upsert: false });
        if (upErr) { alert("Falha no upload: " + upErr.message); setBusy(false); return; }
        conteudo_url = path;
      }
      const capaInput = document.getElementById("matCapa") as HTMLInputElement | null;
      if (capaInput?.files?.[0]) {
        const f = capaInput.files[0];
        const path = `${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { data: up, error: upErr } = await supabase.storage.from("materiais-capas").upload(path, f, { upsert: false });
        if (upErr) { alert("Falha no upload da capa: " + upErr.message); setBusy(false); return; }
        const { data: pub } = supabase.storage.from("materiais-capas").getPublicUrl(up.path);
        capa_url = pub.publicUrl;
      }
      await upsert({ data: {
        id: edit.id, titulo: edit.titulo!, descricao: edit.descricao ?? null,
        categoria: edit.categoria || "geral", tipo: edit.tipo!, area: edit.area!,
        acesso: edit.acesso ?? "publico",
        conteudo_url, conteudo_html: edit.conteudo_html ?? null, capa_url,
        link_compra: edit.link_compra ?? null,
        plataforma_venda: edit.plataforma_venda ?? null,
        preco_label: edit.preco_label ?? null,
        cta_label: edit.cta_label ?? null,
        ordem: edit.ordem ?? 0, publicado: !!edit.publicado,
      } });
      setEdit(null);
      await reload();
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const remover = async (id: string) => {
    if (!(await appConfirm("Remover este item?")) return;
    await del({ data: { id } });
    reload();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={h1}>{titulo}</h1>
        {!esconderNovo && <button onClick={novo} style={btn(c.sageDark)}>{ctaNovo}</button>}
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
            {items.length === 0 && <tr><Td colSpan={6}>Nenhum item cadastrado.</Td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div onClick={() => setEdit(null)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", maxWidth: 1080, width: "100%", padding: 0, border: `1px solid ${c.border}`, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px 28px 12px" }}>
              <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, margin: 0 }}>{edit.id ? `Editar ${isServicoMode ? "serviço" : titulo.toLowerCase()}` : `Novo ${isServicoMode ? "serviço" : titulo.toLowerCase()}`}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div style={{ padding: "8px 28px 20px", overflow: "auto", display: "grid", gap: 14 }}>
              <Field label="Título"><input value={edit.titulo ?? ""} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} style={inp} /></Field>
              <Field label="Descrição"><textarea value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} style={{ ...inp, minHeight: 80 }} /></Field>
              {!isServicoMode && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Área"><select value={edit.area} onChange={(e) => setEdit({ ...edit, area: e.target.value as any })} style={inp}><option value="gratis">Grátis</option><option value="pago">Pago</option></select></Field>
                <Field label="Tipo"><select value={edit.tipo} onChange={(e) => setEdit({ ...edit, tipo: e.target.value as any })} style={inp}>
                  <option value="pdf">PDF</option><option value="video_externo">Vídeo externo</option><option value="video_upload">Vídeo upload</option><option value="artigo">Artigo</option>
                </select></Field>
                <Field label="Categoria">
                  <input list="cat-list-mat" value={edit.categoria ?? ""} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} style={inp} disabled={!!forcarCategoria} />
                  <datalist id="cat-list-mat">
                    <option value="Concepção" /><option value="Gestação" /><option value="Puerpério" /><option value="Bebê" /><option value="Cursos" /><option value="Serviço" />
                  </datalist>
                </Field>
              </div>}
              {!isServicoMode && (edit.tipo === "pdf" || edit.tipo === "video_upload") && (
                <Field label={`Arquivo ${edit.conteudo_url ? "(atual: " + edit.conteudo_url + ")" : ""}`}>
                  <input id="matFile" type="file" accept={edit.tipo === "pdf" ? "application/pdf" : "video/*"} style={inp} />
                </Field>
              )}
              {!isServicoMode && edit.tipo === "video_externo" && (
                <Field label="URL do vídeo (YouTube/Vimeo)"><input value={edit.conteudo_url ?? ""} onChange={(e) => setEdit({ ...edit, conteudo_url: e.target.value })} style={inp} /></Field>
              )}
              {!isServicoMode && edit.tipo === "artigo" && (
                <Field label="Conteúdo HTML"><textarea value={edit.conteudo_html ?? ""} onChange={(e) => setEdit({ ...edit, conteudo_html: e.target.value })} style={{ ...inp, minHeight: 200, fontFamily: "monospace", fontSize: 13 }} /></Field>
              )}
              <Field label={`Capa (imagem) ${edit.capa_url ? "— já cadastrada" : ""}`}>
                <input id="matCapa" type="file" accept="image/*" style={inp} />
                {edit.capa_url && <img src={edit.capa_url} alt="capa" style={{ marginTop: 8, maxHeight: 120, border: `1px solid ${c.border}` }} />}
              </Field>

              <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 14, marginTop: 6 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, marginBottom: 10 }}>
                  {forcarCategoria === "Serviço" ? "Compra / agendamento" : "Venda externa (opcional)"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Field label="Plataforma">
                    <select value={edit.plataforma_venda ?? ""} onChange={(e) => setEdit({ ...edit, plataforma_venda: e.target.value })} style={inp}>
                      <option value="">—</option><option value="hotmart">Hotmart</option><option value="kiwify">Kiwify</option>
                      <option value="eduzz">Eduzz</option><option value="stripe">Stripe</option><option value="outro">Outro</option>
                    </select>
                  </Field>
                  <Field label="Preço (texto)"><input value={edit.preco_label ?? ""} onChange={(e) => setEdit({ ...edit, preco_label: e.target.value })} style={inp} placeholder="R$ 197" /></Field>
                  <Field label="Texto do botão"><input value={edit.cta_label ?? ""} onChange={(e) => setEdit({ ...edit, cta_label: e.target.value })} style={inp} placeholder={forcarCategoria === "Serviço" ? "Agendar" : "Comprar agora"} /></Field>
                </div>
                <Field label="Link de compra (URL)"><input value={edit.link_compra ?? ""} onChange={(e) => setEdit({ ...edit, link_compra: e.target.value })} style={inp} placeholder="https://..." /></Field>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Acesso">
                  <select value={edit.acesso ?? "publico"} onChange={(e) => setEdit({ ...edit, acesso: e.target.value as any })} style={inp}>
                    <option value="publico">Público</option>
                    <option value="restrito">Restrito (somente liberados)</option>
                  </select>
                </Field>
                <Field label="Ordem"><input type="number" value={edit.ordem ?? 0} onChange={(e) => setEdit({ ...edit, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
                <Field label="Publicado"><label style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0" }}><input type="checkbox" checked={!!edit.publicado} onChange={(e) => setEdit({ ...edit, publicado: e.target.checked })} /> Visível</label></Field>
              </div>

              {edit.id && edit.acesso === "restrito" && (
                <AcessosSection materialId={edit.id} />
              )}

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
                <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.sage, fontWeight: 600, marginBottom: 10 }}>
                  Conteúdo por país (PT · ES · EN)
                </div>
                <div style={{ fontSize: 12, color: c.muted, marginBottom: 12 }}>
                  PT é o conteúdo padrão acima. Envie aqui a versão do ebook/PDF em <strong>Espanhol</strong> e <strong>Inglês</strong>. O download entrega o arquivo do país do visitante.
                </div>
                <TranslationsPanel itemType="material" itemId={edit.id ?? null} />
              </div>
              </div>

              <aside style={{ borderLeft: `1px solid ${c.border}`, background: c.warm, padding: "20px 18px", overflow: "auto" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted, marginBottom: 12, fontWeight: 600 }}>Prévia do card</div>
                <MaterialPreviewCard edit={edit} isServico={isServicoMode} />
                <p style={{ fontSize: 10.5, color: c.muted, marginTop: 14, lineHeight: 1.5 }}>É assim que o card aparece na vitrine. Atualiza em tempo real.</p>
              </aside>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "14px 28px", borderTop: `1px solid ${c.border}`, background: c.cream }}>
              <button onClick={() => setEdit(null)} style={btn(c.muted)}>Cancelar</button>
              <button onClick={salvar} disabled={busy} style={{ ...btn(c.sageDark), opacity: busy ? 0.6 : 1 }}>{busy ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialPreviewCard({ edit, isServico }: { edit: Partial<MaterialRow>; isServico: boolean }) {
  const tipoLabel: Record<string, string> = { pdf: "PDF", video_externo: "Vídeo", video_upload: "Vídeo", artigo: "Artigo" };
  return (
    <div style={{ background: c.sageDark, color: "white", padding: 20, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7 }}>
          {edit.categoria || (isServico ? "Serviço" : "Material")}
        </div>
        {edit.area === "gratis" && !isServico && (
          <div style={{ background: "rgba(255,255,255,0.15)", padding: "3px 8px", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>Grátis</div>
        )}
      </div>
      {edit.capa_url && <img src={edit.capa_url} alt="" style={{ width: "100%", height: 120, objectFit: "cover", marginBottom: 12 }} />}
      <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: "0 0 6px", lineHeight: 1.2 }}>{edit.titulo || "Título"}</h3>
      <p style={{ fontSize: 12, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>{edit.descricao || "Descrição aparece aqui."}</p>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11 }}>{tipoLabel[edit.tipo ?? ""] ?? "—"}</div>
        <div style={{ background: "white", color: c.sageDark, padding: "8px 12px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>
          {edit.cta_label || edit.preco_label || (isServico ? "Agendar" : "Acessar")}
        </div>
      </div>
    </div>
  );
}

function AcessosSection({ materialId }: { materialId: string }) {
  const listFn = useServerFn(listMaterialAcessos);
  const buscarFn = useServerFn(buscarUsuarios);
  const liberarFn = useServerFn(liberarAcessoMaterial);
  const revogarFn = useServerFn(revogarAcessoMaterial);
  const [acessos, setAcessos] = useState<any[]>([]);
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const recarregar = () => listFn({ data: { material_id: materialId } }).then(setAcessos).catch(() => {});
  useEffect(() => { recarregar(); }, [materialId]);

  const buscar = async () => {
    if (termo.trim().length < 2) return;
    setBusy(true);
    try { setResultados(await buscarFn({ data: { termo: termo.trim() } })); }
    finally { setBusy(false); }
  };

  const liberar = async (user_id: string) => {
    await liberarFn({ data: { material_id: materialId, user_id } });
    setResultados([]); setTermo(""); recarregar();
  };

  const revogar = async (user_id: string) => {
    if (!(await appConfirm("Revogar acesso deste usuário?")) return;
    await revogarFn({ data: { material_id: materialId, user_id } });
    recarregar();
  };

  return (
    <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 14, marginTop: 6 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, marginBottom: 10 }}>Usuários liberados</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar por nome ou e-mail…" style={inp} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }} />
        <button type="button" onClick={buscar} disabled={busy} style={btn(c.sage)}>Buscar</button>
      </div>
      {resultados.length > 0 && (
        <div style={{ background: c.warm, border: `1px solid ${c.border}`, marginBottom: 12 }}>
          {resultados.map((u) => (
            <div key={u.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 13 }}><strong>{u.nome ?? "—"}</strong> <span style={{ color: c.muted }}>· {u.email}</span></div>
              <button type="button" onClick={() => liberar(u.user_id)} style={btnSm(c.sageDark)}>Liberar</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: "white", border: `1px solid ${c.border}` }}>
        {acessos.length === 0 ? (
          <div style={{ padding: 14, fontSize: 13, color: c.muted }}>Nenhum usuário liberado ainda.</div>
        ) : acessos.map((a) => (
          <div key={a.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 13 }}><strong>{a.nome ?? "—"}</strong> <span style={{ color: c.muted }}>· {a.email ?? a.user_id}</span></div>
            <button type="button" onClick={() => revogar(a.user_id)} style={btnSm(c.danger)}>Revogar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
