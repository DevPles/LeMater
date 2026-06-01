import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListCursos, adminUpsertCurso, adminDeleteCurso, adminGetCursoFull,
  adminUpsertModulo, adminDeleteModulo,
  adminUpsertAula, adminDeleteAula,
  adminListMatriculas, adminLiberarMatricula, adminRevogarMatricula,
} from "@/lib/cursos.functions";
import { buscarUsuarios } from "@/lib/admin.functions";
import NovoConteudoModal from "./NovoConteudoModal";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const h1: CSSProperties = { fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 24px" };
const h2: CSSProperties = { fontFamily: serif, fontSize: 26, fontWeight: 400, margin: "0 0 16px" };
const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };
const modalBg: CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,28,26,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const btn = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans });
const btnSm = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: sans });
const Th = ({ children }: any) => <th style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, fontWeight: 500 }}>{children}</th>;
const Td = ({ children, colSpan }: any) => <td colSpan={colSpan} style={{ padding: "12px 14px", color: c.ink }}>{children}</td>;
const Field = ({ label, children }: any) => <label style={{ display: "block" }}><div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>{children}</label>;

type Curso = any;
type Modulo = any;
type Aula = any;

export default function CursosTab({ esconderNovo = false }: { esconderNovo?: boolean } = {}) {
  const listFn = useServerFn(adminListCursos);
  const upsertFn = useServerFn(adminUpsertCurso);
  const delFn = useServerFn(adminDeleteCurso);
  const [items, setItems] = useState<Curso[]>([]);
  const [edit, setEdit] = useState<Partial<Curso> | null>(null);
  const [busy, setBusy] = useState(false);
  const [openEditor, setOpenEditor] = useState<string | null>(null);

  const reload = () => listFn().then(setItems);
  useEffect(() => { reload(); }, []);

  const novo = () => setEdit({
    titulo: "", slug: "", descricao_curta: "", descricao_longa: "",
    capa_url: "", capa_video_url: "", trailer_url: "", categoria: "geral", nivel: "iniciante",
    carga_horaria_min: 0, preco_centavos: 0, preco_label: "",
    link_compra_externo: "", plataforma_venda: "", links_compra: [], publicado: false, ordem: 0,
    instrutor_nome: "", instrutor_bio: "", instrutor_foto: "",
    materiais_gratis: [],
  });


  const salvar = async () => {
    if (!edit?.titulo || !edit.slug) { alert("Título e slug são obrigatórios"); return; }
    setBusy(true);
    try {
      let capa_url = edit.capa_url || null;
      const capaInput = document.getElementById("cursoCapa") as HTMLInputElement | null;
      if (capaInput?.files?.[0]) {
        const f = capaInput.files[0];
        const path = `cursos/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { data: up, error: upErr } = await supabase.storage.from("materiais-capas").upload(path, f);
        if (upErr) { alert("Falha upload capa: " + upErr.message); setBusy(false); return; }
        const { data: pub } = supabase.storage.from("materiais-capas").getPublicUrl(up.path);
        capa_url = pub.publicUrl;
      }
      let capa_video_url = (edit as any).capa_video_url || null;
      const capaVideoInput = document.getElementById("cursoCapaVideo") as HTMLInputElement | null;
      if (capaVideoInput?.files?.[0]) {
        const f = capaVideoInput.files[0];
        if (f.size > 25 * 1024 * 1024) { alert("Vídeo muito grande (máx 25 MB). Comprima antes."); setBusy(false); return; }
        const path = `cursos/video/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { data: up, error: upErr } = await supabase.storage.from("materiais-capas").upload(path, f, { contentType: f.type });
        if (upErr) { alert("Falha upload vídeo: " + upErr.message); setBusy(false); return; }
        capa_video_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path).data.publicUrl;
      }
      // Upload materiais grátis (PDFs no nível do curso)
      let materiais_gratis: { nome: string; path: string }[] = Array.isArray((edit as any).materiais_gratis) ? [...(edit as any).materiais_gratis] : [];
      const matInput = document.getElementById("cursoMateriais") as HTMLInputElement | null;
      const matFiles = matInput?.files ? Array.from(matInput.files) : [];
      for (const f of matFiles) {
        const path = `cursos/materiais/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("materiais-pdf").upload(path, f);
        if (upErr) { alert("Falha upload material: " + upErr.message); setBusy(false); return; }
        materiais_gratis.push({ nome: f.name, path });
      }
      const payload: any = {
        id: edit.id, titulo: edit.titulo!, slug: edit.slug!,
        descricao_curta: edit.descricao_curta || null,
        descricao_longa: edit.descricao_longa || null,
        capa_url, capa_video_url, trailer_url: edit.trailer_url || null,
        categoria: edit.categoria || "geral", nivel: edit.nivel || "iniciante",
        carga_horaria_min: Number(edit.carga_horaria_min) || 0,
        preco_centavos: Number(edit.preco_centavos) || 0,
        preco_label: edit.preco_label || null,
        link_compra_externo: edit.link_compra_externo || null,
        plataforma_venda: edit.plataforma_venda || null,
        links_compra: Array.isArray((edit as any).links_compra)
          ? (edit as any).links_compra.filter((l: any) => l?.plataforma?.trim() && l?.url?.trim())
          : [],
        publicado: !!edit.publicado, ordem: Number(edit.ordem) || 0,
        instrutor_nome: edit.instrutor_nome || null,
        instrutor_bio: edit.instrutor_bio || null,
        instrutor_foto: edit.instrutor_foto || null,
        materiais_gratis,
      };
      const row = await upsertFn({ data: payload });
      setEdit(null);
      await reload();
      if (!payload.id && row?.id) setOpenEditor(row.id);
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const remover = async (id: string) => {
    if (!(await appConfirm("Remover este curso? Módulos e aulas também serão removidos.")) return;
    await delFn({ data: { id } });
    reload();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={h1}>Cursos</h1>
        {!esconderNovo && <button onClick={novo} style={btn(c.sageDark)}>Novo curso</button>}
      </div>


      <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: c.warm }}>
            <Th>Ordem</Th><Th>Título</Th><Th>Slug</Th><Th>Categoria</Th><Th>Preço</Th><Th>Pub.</Th><Th> </Th>
          </tr></thead>
          <tbody>
            {items.map((cu) => (
              <tr key={cu.id} style={{ borderTop: `1px solid ${c.border}` }}>
                <Td>{cu.ordem}</Td>
                <Td><strong>{cu.titulo}</strong></Td>
                <Td><code style={{ fontSize: 12, color: c.muted }}>{cu.slug}</code></Td>
                <Td>{cu.categoria}</Td>
                <Td>{cu.preco_label ?? (cu.preco_centavos ? `R$ ${(cu.preco_centavos / 100).toFixed(2)}` : "—")}</Td>
                <Td>{cu.publicado ? "Sim" : "Não"}</Td>
                <Td>
                  <button onClick={() => setOpenEditor(cu.id)} style={btnSm(c.sageDark)}>Aulas</button>{" "}
                  <button onClick={() => setEdit(cu)} style={btnSm(c.sage)}>Editar</button>{" "}
                  <button onClick={() => remover(cu.id)} style={btnSm(c.danger)}>Excluir</button>
                </Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={7}>Nenhum curso cadastrado. Clique em "Novo curso" para começar.</Td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <NovoConteudoModal
          tipoInicial="curso"
          cursoEdit={edit.id ? edit : undefined}
          onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); reload(); }}
        />
      )}

      {openEditor && (
        <CursoEditor cursoId={openEditor} onClose={() => { setOpenEditor(null); reload(); }} />
      )}
    </div>
  );
}

// ============== Editor de módulos / aulas / matrículas ==============
function CursoEditor({ cursoId, onClose }: { cursoId: string; onClose: () => void }) {
  const getFn = useServerFn(adminGetCursoFull);
  const [data, setData] = useState<{ curso: Curso; modulos: Modulo[]; aulas: Aula[] } | null>(null);
  const [tab, setTab] = useState<"estrutura" | "matriculas">("estrutura");

  const reload = () => getFn({ data: { id: cursoId } }).then(setData);
  useEffect(() => { reload(); }, [cursoId]);

  if (!data) return <div style={modalBg}><div style={{ background: "white", padding: 40 }}>Carregando…</div></div>;

  return (
    <div onClick={onClose} style={modalBg}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: c.cream, maxWidth: 1000, width: "100%", padding: 32, border: `1px solid ${c.border}`, maxHeight: "94vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.muted }}>Curso</div>
            <h2 style={{ ...h2, margin: 0 }}>{data.curso.titulo}</h2>
          </div>
          <button onClick={onClose} style={btn(c.muted)}>Fechar</button>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${c.border}` }}>
          {(["estrutura", "matriculas"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? c.sageDark : "transparent", color: tab === t ? "white" : c.muted, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 18px", border: "none", cursor: "pointer", fontFamily: sans }}>
              {t === "estrutura" ? "Módulos & Aulas" : "Matrículas"}
            </button>
          ))}
        </div>

        {tab === "estrutura" && <EstruturaTab cursoId={cursoId} modulos={data.modulos} aulas={data.aulas} onChanged={reload} />}
        {tab === "matriculas" && <MatriculasTab cursoId={cursoId} />}
      </div>
    </div>
  );
}

function EstruturaTab({ cursoId, modulos, aulas, onChanged }: { cursoId: string; modulos: Modulo[]; aulas: Aula[]; onChanged: () => void }) {
  const upModulo = useServerFn(adminUpsertModulo);
  const delModulo = useServerFn(adminDeleteModulo);
  const upAula = useServerFn(adminUpsertAula);
  const delAula = useServerFn(adminDeleteAula);
  const [editMod, setEditMod] = useState<Partial<Modulo> | null>(null);
  const [editAula, setEditAula] = useState<Partial<Aula> | null>(null);

  const novoModulo = () => setEditMod({ curso_id: cursoId, titulo: "", descricao: "", ordem: modulos.length });

  const salvarModulo = async () => {
    if (!editMod?.titulo) return;
    await upModulo({ data: {
      id: editMod.id, curso_id: cursoId,
      titulo: editMod.titulo, descricao: editMod.descricao || null,
      ordem: Number(editMod.ordem) || 0,
    } });
    setEditMod(null); onChanged();
  };

  const removerModulo = async (id: string) => {
    if (!(await appConfirm("Remover este módulo e todas as aulas?")) return;
    await delModulo({ data: { id } }); onChanged();
  };

  const novaAula = (modulo_id: string, ordem: number) => setEditAula({
    modulo_id, titulo: "", descricao: "", tipo: "video",
    video_url: "", pdf_url: "", conteudo_html: "",
    duracao_min: 0, ordem, previa_gratis: false, materiais_extras: [],
    preco_centavos: 0, preco_label: "", links_compra: [],
  });

  const salvarAula = async () => {
    if (!editAula?.titulo || !editAula.modulo_id) return;
    let video_url = editAula.video_url || null;
    let pdf_url = editAula.pdf_url || null;
    const vfile = document.getElementById("aulaVideoFile") as HTMLInputElement | null;
    if (vfile?.files?.[0] && editAula.tipo === "video") {
      const f = vfile.files[0];
      const path = `${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("materiais-video").upload(path, f);
      if (error) { alert("Erro upload vídeo: " + error.message); return; }
      video_url = path;
    }
    const pfile = document.getElementById("aulaPdfFile") as HTMLInputElement | null;
    if (pfile?.files?.[0] && editAula.tipo === "pdf") {
      const f = pfile.files[0];
      const path = `${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("materiais-pdf").upload(path, f);
      if (error) { alert("Erro upload PDF: " + error.message); return; }
      pdf_url = path;
    }
    // Upload de anexos (download)
    let materiais_extras = Array.isArray(editAula.materiais_extras) ? [...editAula.materiais_extras] : [];
    const afile = document.getElementById("aulaAnexosFile") as HTMLInputElement | null;
    if (afile?.files?.length) {
      for (const f of Array.from(afile.files)) {
        const path = `anexos/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("materiais-pdf").upload(path, f);
        if (error) { alert("Erro upload anexo: " + error.message); return; }
        materiais_extras.push({ nome: f.name, path });
      }
    }
    await upAula({ data: {
      id: editAula.id, modulo_id: editAula.modulo_id,
      titulo: editAula.titulo, descricao: editAula.descricao || null,
      tipo: editAula.tipo as any, video_url, pdf_url,
      conteudo_html: editAula.conteudo_html || null,
      duracao_min: Number(editAula.duracao_min) || 0,
      ordem: Number(editAula.ordem) || 0,
      previa_gratis: !!editAula.previa_gratis,
      materiais_extras,
      preco_centavos: Number(editAula.preco_centavos) || 0,
      preco_label: editAula.preco_label || null,
      links_compra: Array.isArray(editAula.links_compra)
        ? editAula.links_compra.filter((l: any) => l?.plataforma?.trim() && l?.url?.trim())
        : [],
    } });
    setEditAula(null); onChanged();
  };

  const removerAula = async (id: string) => {
    if (!(await appConfirm("Remover esta aula?")) return;
    await delAula({ data: { id } }); onChanged();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={novoModulo} style={btn(c.sageDark)}>Novo módulo</button>
      </div>

      {modulos.length === 0 && (
        <div style={{ padding: 32, background: "white", border: `1px dashed ${c.border}`, textAlign: "center", color: c.muted }}>
          Nenhum módulo ainda. Crie o primeiro para começar a adicionar aulas.
        </div>
      )}

      {modulos.map((m) => {
        const aulasMod = aulas.filter((a) => a.modulo_id === m.id).sort((a, b) => a.ordem - b.ordem);
        return (
          <div key={m.id} style={{ background: "white", border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: c.warm, borderBottom: `1px solid ${c.border}` }}>
              <div>
                <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Módulo {m.ordem}</div>
                <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 400 }}>{m.titulo}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => novaAula(m.id, aulasMod.length)} style={btnSm(c.sageDark)}>+ Aula</button>
                <button onClick={() => setEditMod(m)} style={btnSm(c.sage)}>Editar</button>
                <button onClick={() => removerModulo(m.id)} style={btnSm(c.danger)}>Excluir</button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {aulasMod.map((a) => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${c.border}` }}>
                    <Td>{a.ordem}</Td>
                    <Td><strong>{a.titulo}</strong> {a.previa_gratis && <span style={{ fontSize: 10, background: c.sage, color: "white", padding: "2px 6px", marginLeft: 6 }}>PRÉVIA GRÁTIS</span>}</Td>
                    <Td>{a.tipo}</Td>
                    <Td>{a.duracao_min}min</Td>
                    <Td>
                      <button onClick={() => setEditAula(a)} style={btnSm(c.sage)}>Editar</button>{" "}
                      <button onClick={() => removerAula(a.id)} style={btnSm(c.danger)}>Excluir</button>
                    </Td>
                  </tr>
                ))}
                {aulasMod.length === 0 && <tr><Td colSpan={5}><span style={{ color: c.muted, fontSize: 13 }}>Nenhuma aula neste módulo.</span></Td></tr>}
              </tbody>
            </table>
          </div>
        );
      })}

      {editMod && (
        <div onClick={() => setEditMod(null)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", maxWidth: 540, width: "100%", padding: 28 }}>
            <h2 style={h2}>{editMod.id ? "Editar módulo" : "Novo módulo"}</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Título"><input value={editMod.titulo ?? ""} onChange={(e) => setEditMod({ ...editMod, titulo: e.target.value })} style={inp} /></Field>
              <Field label="Descrição"><textarea value={editMod.descricao ?? ""} onChange={(e) => setEditMod({ ...editMod, descricao: e.target.value })} style={{ ...inp, minHeight: 60 }} /></Field>
              <Field label="Ordem"><input type="number" value={editMod.ordem ?? 0} onChange={(e) => setEditMod({ ...editMod, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setEditMod(null)} style={btn(c.muted)}>Cancelar</button>
              <button onClick={salvarModulo} style={btn(c.sageDark)}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {editAula && (
        <div onClick={() => setEditAula(null)} style={modalBg}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", maxWidth: 1080, width: "100%", padding: 0, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px 28px 12px" }}>
              <h2 style={{ ...h2, margin: 0 }}>{editAula.id ? "Editar aula" : "Nova aula"}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div style={{ padding: "8px 28px 20px", overflow: "auto", display: "grid", gap: 12 }}>
              <Field label="Título"><input value={editAula.titulo ?? ""} onChange={(e) => setEditAula({ ...editAula, titulo: e.target.value })} style={inp} /></Field>
              <Field label="Descrição"><textarea value={editAula.descricao ?? ""} onChange={(e) => setEditAula({ ...editAula, descricao: e.target.value })} style={{ ...inp, minHeight: 60 }} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Tipo"><select value={editAula.tipo ?? "video"} onChange={(e) => setEditAula({ ...editAula, tipo: e.target.value as any })} style={inp}><option value="video">Vídeo</option><option value="pdf">PDF</option><option value="texto">Texto</option></select></Field>
                <Field label="Duração (min)"><input type="number" value={editAula.duracao_min ?? 0} onChange={(e) => setEditAula({ ...editAula, duracao_min: parseInt(e.target.value) || 0 })} style={inp} /></Field>
                <Field label="Ordem"><input type="number" value={editAula.ordem ?? 0} onChange={(e) => setEditAula({ ...editAula, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
              </div>
              {editAula.tipo === "video" && (
                <>
                  <Field label={`URL do vídeo (YouTube/Vimeo) ${editAula.video_url?.startsWith("http") ? "" : editAula.video_url ? "— arquivo atual: " + editAula.video_url : ""}`}>
                    <input value={editAula.video_url?.startsWith("http") ? editAula.video_url : ""} onChange={(e) => setEditAula({ ...editAula, video_url: e.target.value })} style={inp} placeholder="https://youtube.com/..." />
                  </Field>
                  <Field label="Ou enviar arquivo de vídeo">
                    <input id="aulaVideoFile" type="file" accept="video/*" style={inp} />
                  </Field>
                </>
              )}
              {editAula.tipo === "pdf" && (
                <Field label={`Arquivo PDF ${editAula.pdf_url ? "(atual: " + editAula.pdf_url + ")" : ""}`}>
                  <input id="aulaPdfFile" type="file" accept="application/pdf" style={inp} />
                </Field>
              )}
              {editAula.tipo === "texto" && (
                <Field label="Conteúdo HTML"><textarea value={editAula.conteudo_html ?? ""} onChange={(e) => setEditAula({ ...editAula, conteudo_html: e.target.value })} style={{ ...inp, minHeight: 200, fontFamily: "monospace", fontSize: 13 }} /></Field>
              )}
              <Field label="Materiais para download (anexos)">
                <div style={{ display: "grid", gap: 8 }}>
                  {Array.isArray(editAula.materiais_extras) && editAula.materiais_extras.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 }}>
                      {editAula.materiais_extras.map((a: { nome: string; path: string }, i: number) => (
                        <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: c.warm, padding: "6px 10px", fontSize: 13 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</span>
                          <button
                            type="button"
                            onClick={() => setEditAula({ ...editAula, materiais_extras: editAula.materiais_extras.filter((_: any, j: number) => j !== i) })}
                            style={{ background: "transparent", border: "none", color: c.danger, cursor: "pointer", fontSize: 12, marginLeft: 8 }}
                          >Remover</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input id="aulaAnexosFile" type="file" multiple style={inp} />
                  <small style={{ color: c.muted, fontSize: 11 }}>Aceita múltiplos arquivos (PDF, DOC, imagens etc.) — ficam disponíveis para download dentro da aula.</small>
                </div>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12, borderTop: `1px solid ${c.border}` }}>
                <Field label="Preço da aula (centavos)">
                  <input type="number" min={0} value={editAula.preco_centavos ?? 0} onChange={(e) => setEditAula({ ...editAula, preco_centavos: parseInt(e.target.value) || 0 })} style={inp} placeholder="Ex.: 4990 = R$ 49,90" />
                </Field>
                <Field label="Rótulo de preço (opcional)">
                  <input value={editAula.preco_label ?? ""} onChange={(e) => setEditAula({ ...editAula, preco_label: e.target.value })} style={inp} placeholder="Ex.: R$ 49,90 ou Grátis" />
                </Field>
              </div>
              <Field label="Links de compra externos (por plataforma/país)">
                <div style={{ display: "grid", gap: 8 }}>
                  {(Array.isArray(editAula.links_compra) ? editAula.links_compra : []).map((l: any, i: number) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto auto", gap: 6, alignItems: "center", background: c.warm, padding: 8 }}>
                      <input placeholder="Plataforma (Hotmart...)" value={l.plataforma ?? ""} onChange={(e) => { const arr = [...editAula.links_compra]; arr[i] = { ...arr[i], plataforma: e.target.value }; setEditAula({ ...editAula, links_compra: arr }); }} style={{ ...inp, fontSize: 13 }} />
                      <input placeholder="País (BR, US...)" value={l.pais ?? ""} onChange={(e) => { const arr = [...editAula.links_compra]; arr[i] = { ...arr[i], pais: e.target.value }; setEditAula({ ...editAula, links_compra: arr }); }} style={{ ...inp, fontSize: 13 }} />
                      <input placeholder="https://..." value={l.url ?? ""} onChange={(e) => { const arr = [...editAula.links_compra]; arr[i] = { ...arr[i], url: e.target.value }; setEditAula({ ...editAula, links_compra: arr }); }} style={{ ...inp, fontSize: 13 }} />
                      <select value={l.tipo ?? "aula"} onChange={(e) => { const arr = [...editAula.links_compra]; arr[i] = { ...arr[i], tipo: e.target.value }; setEditAula({ ...editAula, links_compra: arr }); }} style={{ ...inp, fontSize: 13 }}>
                        <option value="aula">Aula</option>
                        <option value="curso">Curso</option>
                        <option value="passe">Passe</option>
                      </select>
                      <button type="button" onClick={() => setEditAula({ ...editAula, links_compra: editAula.links_compra.filter((_: any, j: number) => j !== i) })} style={{ background: "transparent", border: "none", color: c.danger, cursor: "pointer", fontSize: 12 }}>Remover</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditAula({ ...editAula, links_compra: [...(editAula.links_compra ?? []), { plataforma: "", pais: "", url: "", tipo: "aula" }] })} style={btnSm(c.sage)}>+ Adicionar link</button>
                </div>
              </Field>
              <Field label="Prévia"><label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}><input type="checkbox" checked={!!editAula.previa_gratis} onChange={(e) => setEditAula({ ...editAula, previa_gratis: e.target.checked })} /> Liberar como prévia gratuita (visível antes da compra)</label></Field>
              </div>

              <aside style={{ borderLeft: `1px solid ${c.border}`, background: c.warm, padding: "20px 18px", overflow: "auto" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted, marginBottom: 12, fontWeight: 600 }}>Prévia da aula</div>
                <div style={{ background: c.sageDark, color: "white", padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontSize: 28, fontWeight: 300, opacity: 0.4, fontFamily: serif }}>{String((editAula.ordem ?? 0) + 1).padStart(2, "0")}</div>
                    {editAula.previa_gratis && <div style={{ background: "rgba(255,255,255,0.15)", padding: "3px 8px", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase" }}>Prévia grátis</div>}
                  </div>
                  <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, margin: "0 0 6px", lineHeight: 1.2 }}>{editAula.titulo || "Título da aula"}</h3>
                  <p style={{ fontSize: 12, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>{editAula.descricao || "Descrição aparece aqui."}</p>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                    <span>{(editAula.tipo ?? "video").toUpperCase()} · {editAula.duracao_min ?? 0} min</span>
                    <span style={{ background: "white", color: c.sageDark, padding: "6px 10px", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
                      {editAula.preco_label || ((editAula.preco_centavos ?? 0) > 0 ? `R$ ${((editAula.preco_centavos ?? 0) / 100).toFixed(2)}` : "Grátis")}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 10.5, color: c.muted, marginTop: 12, lineHeight: 1.5 }}>Atualiza em tempo real conforme você edita.</p>
              </aside>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "14px 28px", borderTop: `1px solid ${c.border}`, background: c.cream }}>
              <button onClick={() => setEditAula(null)} style={btn(c.muted)}>Cancelar</button>
              <button onClick={salvarAula} style={btn(c.sageDark)}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatriculasTab({ cursoId }: { cursoId: string }) {
  const listFn = useServerFn(adminListMatriculas);
  const buscarFn = useServerFn(buscarUsuarios);
  const liberarFn = useServerFn(adminLiberarMatricula);
  const revogarFn = useServerFn(adminRevogarMatricula);
  const [items, setItems] = useState<any[]>([]);
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);

  const reload = () => listFn({ data: { curso_id: cursoId } }).then(setItems);
  useEffect(() => { reload(); }, [cursoId]);

  const buscar = async () => {
    if (termo.trim().length < 2) return;
    setResultados(await buscarFn({ data: { termo: termo.trim() } }));
  };
  const liberar = async (user_id: string) => {
    await liberarFn({ data: { curso_id: cursoId, user_id } });
    setTermo(""); setResultados([]); reload();
  };
  const revogar = async (user_id: string) => {
    if (!(await appConfirm("Revogar matrícula?")) return;
    await revogarFn({ data: { curso_id: cursoId, user_id } });
    reload();
  };

  return (
    <div>
      <div style={{ background: "white", border: `1px solid ${c.border}`, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, marginBottom: 10 }}>Liberar acesso manual</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar usuário por nome ou e-mail…" style={inp} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }} />
          <button onClick={buscar} style={btn(c.sage)}>Buscar</button>
        </div>
        {resultados.length > 0 && (
          <div style={{ marginTop: 10, border: `1px solid ${c.border}` }}>
            {resultados.map((u) => (
              <div key={u.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${c.border}` }}>
                <div style={{ fontSize: 13 }}><strong>{u.nome ?? "—"}</strong> <span style={{ color: c.muted }}>· {u.email}</span></div>
                <button onClick={() => liberar(u.user_id)} style={btnSm(c.sageDark)}>Liberar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: c.warm }}><Th>Aluno</Th><Th>E-mail</Th><Th>Origem</Th><Th>Status</Th><Th>Desde</Th><Th> </Th></tr></thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.user_id} style={{ borderTop: `1px solid ${c.border}` }}>
                <Td>{m.nome ?? "—"}</Td><Td>{m.email ?? "—"}</Td><Td>{m.origem}</Td>
                <Td style={{ color: m.ativo ? c.sageDark : c.danger }}>{m.ativo ? "Ativo" : "Inativo"}</Td>
                <Td>{new Date(m.created_at).toLocaleDateString("pt-BR")}</Td>
                <Td><button onClick={() => revogar(m.user_id)} style={btnSm(c.danger)}>Revogar</button></Td>
              </tr>
            ))}
            {items.length === 0 && <tr><Td colSpan={6}><span style={{ color: c.muted }}>Nenhuma matrícula ainda.</span></Td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
