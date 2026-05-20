import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminUpsertCurso, adminUpsertModulo, adminUpsertAula } from "@/lib/cursos.functions";
import { upsertMaterial } from "@/lib/admin.functions";
import { ContentCard } from "@/components/ContentCard";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };
const noAuto = { autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false } as const;
const modalBg: CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,28,26,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const btn = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans });
const btnSm = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: sans });
const Field = ({ label, children }: any) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>
    {children}
  </label>
);
const sectionTitle: CSSProperties = { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.sage, fontWeight: 600, marginBottom: 12, borderTop: `1px solid ${c.border}`, paddingTop: 16 };

type Tipo = "curso" | "material" | "servico";

type AulaLocal = {
  titulo: string;
  descricao: string;
  tipo: "video" | "pdf" | "texto";
  video_url: string;            // URL externa
  videoFile: File | null;       // upload
  pdfFile: File | null;
  conteudo_html: string;
  duracao_min: number;
  previa_gratis: boolean;
  anexos: File[];               // múltiplos PDFs/arquivos para download
};

const aulaVazia = (): AulaLocal => ({
  titulo: "", descricao: "", tipo: "video",
  video_url: "", videoFile: null, pdfFile: null, conteudo_html: "",
  duracao_min: 0, previa_gratis: false, anexos: [],
});

export default function NovoConteudoModal({
  tipoInicial = "curso",
  onClose,
  onSaved,
}: {
  tipoInicial?: Tipo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipo, setTipo] = useState<Tipo>(tipoInicial);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");

  // ---- CURSO ----
  const upCurso = useServerFn(adminUpsertCurso);
  const upModulo = useServerFn(adminUpsertModulo);
  const upAula = useServerFn(adminUpsertAula);

  const [curso, setCurso] = useState({
    titulo: "", slug: "", descricao_curta: "", descricao_longa: "",
    capa: null as File | null,
    capaVideo: null as File | null,
    trailer_url: "",
    categoria: "geral", nivel: "iniciante", carga_horaria_min: 0,
    area: "gratis" as "gratis" | "pago",
    preco_centavos: 0, preco_label: "", link_compra_externo: "", plataforma_venda: "",
    instrutor_nome: "", instrutor_bio: "", instrutor_foto: "",
    pdfsGratis: [] as File[],
    publicado: false, ordem: 0,
  });
  const [aulas, setAulas] = useState<AulaLocal[]>([aulaVazia()]);

  // ---- MATERIAL / SERVIÇO ----
  const upMaterial = useServerFn(upsertMaterial);
  const [material, setMaterial] = useState({
    titulo: "", descricao: "",
    categoria: "Concepção",
    tipo: "pdf" as "pdf" | "video_externo" | "video_upload" | "artigo",
    area: "gratis" as "gratis" | "pago",
    conteudo_url: "", conteudo_html: "",
    arquivo: null as File | null,
    capa: null as File | null,
    link_compra: "", plataforma_venda: "", preco_label: "", cta_label: "",
    publicado: false, ordem: 0,
  });

  // ===== SALVAR =====
  const salvar = async () => {
    setBusy(true);
    try {
      if (tipo === "curso") {
        await salvarCurso();
      } else {
        await salvarMaterial(tipo === "servico" ? "Serviço" : material.categoria, tipo === "servico");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e?.message ?? "Erro ao salvar");
    } finally {
      setBusy(false);
      setBusyMsg("");
    }
  };

  const salvarCurso = async () => {
    if (!curso.titulo || !curso.slug) { throw new Error("Título e slug são obrigatórios"); }

    // 1. Upload capa
    setBusyMsg("Enviando capa…");
    let capa_url: string | null = null;
    if (curso.capa) {
      const path = `cursos/${Date.now()}-${curso.capa.name.replace(/[^\w.-]/g, "_")}`;
      const { data: up, error } = await supabase.storage.from("materiais-capas").upload(path, curso.capa);
      if (error) throw new Error("Falha capa: " + error.message);
      capa_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path).data.publicUrl;
    }

    // 1b. Upload vídeo de capa (loop)
    let capa_video_url: string | null = null;
    if (curso.capaVideo) {
      setBusyMsg("Enviando vídeo de capa…");
      const path = `cursos/video/${Date.now()}-${curso.capaVideo.name.replace(/[^\w.-]/g, "_")}`;
      const { data: up, error } = await supabase.storage.from("materiais-capas").upload(path, curso.capaVideo);
      if (error) throw new Error("Falha vídeo de capa: " + error.message);
      capa_video_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path).data.publicUrl;
    }

    // 2. Upload PDFs grátis (nível do curso)
    setBusyMsg("Enviando PDFs grátis…");
    const materiais_gratis: { nome: string; path: string }[] = [];
    for (const f of curso.pdfsGratis) {
      const path = `cursos/materiais/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("materiais-pdf").upload(path, f);
      if (error) throw new Error("Falha PDF grátis: " + error.message);
      materiais_gratis.push({ nome: f.name, path });
    }

    // 3. Upsert curso
    setBusyMsg("Criando curso…");
    const ehGratis = curso.area === "gratis";
    const cursoRow = await upCurso({ data: {
      titulo: curso.titulo, slug: curso.slug,
      descricao_curta: curso.descricao_curta || null,
      descricao_longa: curso.descricao_longa || null,
      capa_url, capa_video_url, trailer_url: curso.trailer_url || null,
      categoria: curso.categoria, nivel: curso.nivel,
      carga_horaria_min: Number(curso.carga_horaria_min) || 0,
      preco_centavos: ehGratis ? 0 : (Number(curso.preco_centavos) || 0),
      preco_label: ehGratis ? "Grátis" : (curso.preco_label || null),
      link_compra_externo: ehGratis ? null : (curso.link_compra_externo || null),
      plataforma_venda: ehGratis ? null : (curso.plataforma_venda || null),
      publicado: curso.publicado, ordem: Number(curso.ordem) || 0,
      instrutor_nome: curso.instrutor_nome || null,
      instrutor_bio: curso.instrutor_bio || null,
      instrutor_foto: curso.instrutor_foto || null,
      materiais_gratis,
    } });

    // 4. Criar módulo padrão "Conteúdo" se houver aulas
    const aulasValidas = aulas.filter((a) => a.titulo.trim());
    if (aulasValidas.length === 0) return;
    setBusyMsg("Criando módulo…");
    const moduloRow = await upModulo({ data: {
      curso_id: cursoRow.id, titulo: "Conteúdo", descricao: null, ordem: 0,
    } });

    // 5. Para cada aula: upload + criação
    for (let i = 0; i < aulasValidas.length; i++) {
      const a = aulasValidas[i];
      setBusyMsg(`Aula ${i + 1} de ${aulasValidas.length}…`);

      let video_url: string | null = null;
      let pdf_url: string | null = null;
      if (a.tipo === "video") {
        if (a.videoFile) {
          const path = `${Date.now()}-${a.videoFile.name.replace(/[^\w.-]/g, "_")}`;
          const { error } = await supabase.storage.from("materiais-video").upload(path, a.videoFile);
          if (error) throw new Error(`Falha vídeo aula "${a.titulo}": ` + error.message);
          video_url = path;
        } else if (a.video_url.trim()) {
          video_url = a.video_url.trim();
        }
      } else if (a.tipo === "pdf" && a.pdfFile) {
        const path = `${Date.now()}-${a.pdfFile.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("materiais-pdf").upload(path, a.pdfFile);
        if (error) throw new Error(`Falha PDF aula "${a.titulo}": ` + error.message);
        pdf_url = path;
      }

      const materiais_extras: { nome: string; path: string }[] = [];
      for (const f of a.anexos) {
        const path = `anexos/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("materiais-pdf").upload(path, f);
        if (error) throw new Error(`Falha anexo "${f.name}": ` + error.message);
        materiais_extras.push({ nome: f.name, path });
      }

      await upAula({ data: {
        modulo_id: moduloRow.id,
        titulo: a.titulo, descricao: a.descricao || null,
        tipo: a.tipo, video_url, pdf_url,
        conteudo_html: a.tipo === "texto" ? (a.conteudo_html || null) : null,
        duracao_min: Number(a.duracao_min) || 0,
        ordem: i, previa_gratis: ehGratis ? true : a.previa_gratis,
        materiais_extras,
      } });
    }
  };

  const salvarMaterial = async (categoria: string, isServico: boolean) => {
    if (!material.titulo) throw new Error("Título obrigatório");

    setBusyMsg("Enviando arquivos…");
    let conteudo_url: string | null = material.conteudo_url || null;
    if (material.arquivo && (material.tipo === "pdf" || material.tipo === "video_upload")) {
      const bucket = material.tipo === "pdf" ? "materiais-pdf" : "materiais-video";
      const path = `${Date.now()}-${material.arquivo.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from(bucket).upload(path, material.arquivo);
      if (error) throw new Error("Falha arquivo: " + error.message);
      conteudo_url = path;
    }

    let capa_url: string | null = null;
    if (material.capa) {
      const path = `${Date.now()}-${material.capa.name.replace(/[^\w.-]/g, "_")}`;
      const { data: up, error } = await supabase.storage.from("materiais-capas").upload(path, material.capa);
      if (error) throw new Error("Falha capa: " + error.message);
      capa_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path).data.publicUrl;
    }

    setBusyMsg("Salvando…");
    await upMaterial({ data: {
      titulo: material.titulo, descricao: material.descricao || null,
      categoria, tipo: material.tipo,
      area: isServico ? "pago" : material.area,
      acesso: "publico",
      conteudo_url, conteudo_html: material.conteudo_html || null, capa_url,
      link_compra: material.link_compra || null,
      plataforma_venda: material.plataforma_venda || null,
      preco_label: material.preco_label || null,
      cta_label: material.cta_label || (isServico ? "Agendar" : null),
      ordem: Number(material.ordem) || 0, publicado: material.publicado,
    } });
  };

  // ===== UI =====
  return (
    <div onClick={busy ? undefined : onClose} style={modalBg}>
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()} style={{ background: c.cream, maxWidth: 1280, width: "100%", maxHeight: "94vh", overflow: "hidden", border: `1px solid ${c.border}`, display: "flex", flexDirection: "column" }}>
        {/* Header com seletor de tipo */}
        <div style={{ padding: "24px 32px 0", background: c.cream, borderBottom: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 6 }}>Novo conteúdo</div>
          <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, margin: "0 0 18px" }}>Criar novo item do Atlas</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {(["curso", "material", "servico"] as Tipo[]).map((t) => {
              const ativo = tipo === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  style={{
                    background: ativo ? c.sageDark : "white",
                    color: ativo ? "white" : c.ink,
                    border: `1px solid ${ativo ? c.sageDark : c.border}`,
                    padding: "10px 22px",
                    fontSize: 12, fontFamily: sans, fontWeight: 500,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {t === "curso" ? "Curso" : t === "material" ? "Material" : "Serviço"}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 32px 24px", overflow: "auto" }}>
            {tipo === "curso" && (
              <FormCurso curso={curso} setCurso={setCurso} aulas={aulas} setAulas={setAulas} />
            )}
            {tipo === "material" && (
              <FormMaterial material={material} setMaterial={setMaterial} mostrarCategoria />
            )}
            {tipo === "servico" && (
              <FormMaterial material={material} setMaterial={setMaterial} mostrarCategoria={false} isServico />
            )}
          </div>

          <aside style={{ borderLeft: `1px solid ${c.border}`, background: c.warm, padding: "20px 18px", overflow: "auto" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted, marginBottom: 12, fontWeight: 600 }}>Prévia do card</div>
            {tipo === "curso"
              ? <CursoPreview curso={curso} aulas={aulas} />
              : <MaterialPreview material={material} isServico={tipo === "servico"} />}
            <p style={{ fontSize: 10.5, color: c.muted, marginTop: 14, lineHeight: 1.5 }}>
              É assim que o card aparece na vitrine do Atlas.
            </p>
          </aside>
        </div>

        <div style={{ padding: "16px 32px 20px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${c.border}`, background: c.cream }}>
          {busy && <span style={{ alignSelf: "center", fontSize: 12, color: c.muted, marginRight: "auto" }}>{busyMsg}</span>}
          <button type="button" onClick={onClose} disabled={busy} style={{ ...btn(c.muted), opacity: busy ? 0.5 : 1 }}>Cancelar</button>
          <button type="button" onClick={salvar} disabled={busy} style={{ ...btn(c.sageDark), opacity: busy ? 0.6 : 1 }}>
            {busy ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ================= FORM CURSO =================
function FormCurso({ curso, setCurso, aulas, setAulas }: any) {
  const addAula = () => setAulas([...aulas, aulaVazia()]);
  const removeAula = (i: number) => setAulas(aulas.filter((_: any, j: number) => j !== i));
  const updateAula = (i: number, patch: Partial<AulaLocal>) =>
    setAulas(aulas.map((a: AulaLocal, j: number) => (j === i ? { ...a, ...patch } : a)));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Field label="Título do curso"><input {...noAuto} name="curso-titulo" value={curso.titulo} onChange={(e) => setCurso({ ...curso, titulo: e.target.value })} style={inp} placeholder="Ex.: Preparação para o parto" /></Field>
        <Field label="Slug (URL)"><input {...noAuto} name="curso-slug" value={curso.slug} onChange={(e) => setCurso({ ...curso, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} style={inp} placeholder="meu-curso" /></Field>
      </div>
      <Field label="Descrição curta (vitrine)"><textarea {...noAuto} name="curso-desc-curta" value={curso.descricao_curta} onChange={(e) => setCurso({ ...curso, descricao_curta: e.target.value })} style={{ ...inp, minHeight: 60 }} placeholder="Aparece no card da vitrine (1-2 linhas)" /></Field>
      <Field label="Descrição longa (página de vendas)"><textarea {...noAuto} name="curso-desc-longa" value={curso.descricao_longa} onChange={(e) => setCurso({ ...curso, descricao_longa: e.target.value })} style={{ ...inp, minHeight: 110 }} placeholder="Texto completo exibido na página do curso" /></Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
        <Field label="Categoria"><input value={curso.categoria} onChange={(e) => setCurso({ ...curso, categoria: e.target.value })} style={inp} /></Field>
        <Field label="Nível"><select value={curso.nivel} onChange={(e) => setCurso({ ...curso, nivel: e.target.value })} style={inp}><option value="iniciante">Iniciante</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option></select></Field>
        <Field label="Carga (min)"><input type="number" value={curso.carga_horaria_min} onChange={(e) => setCurso({ ...curso, carga_horaria_min: parseInt(e.target.value) || 0 })} style={inp} /></Field>
        <Field label="Acesso">
          <select value={curso.area} onChange={(e) => setCurso({ ...curso, area: e.target.value as "gratis" | "pago" })} style={inp}>
            <option value="gratis">Grátis (livre para todos)</option>
            <option value="pago">Pago</option>
          </select>
        </Field>
      </div>

      <Field label="Capa (imagem — fallback / poster do vídeo)"><input type="file" accept="image/*" onChange={(e) => setCurso({ ...curso, capa: e.target.files?.[0] ?? null })} style={inp} /></Field>
      <Field label="Vídeo de capa (loop curto 3–6s, opcional — substitui a imagem na vitrine)">
        <input type="file" accept="video/mp4,video/webm" onChange={(e) => setCurso({ ...curso, capaVideo: e.target.files?.[0] ?? null })} style={inp} />
        {curso.capaVideo && <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>{curso.capaVideo.name} · {(curso.capaVideo.size / 1024 / 1024).toFixed(1)} MB</div>}
      </Field>
      <Field label="Trailer (URL YouTube/Vimeo, opcional)"><input value={curso.trailer_url} onChange={(e) => setCurso({ ...curso, trailer_url: e.target.value })} style={inp} /></Field>

      {curso.area === "pago" && (
        <>
          <div style={sectionTitle}>Venda</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="Preço (centavos)"><input type="number" value={curso.preco_centavos} onChange={(e) => setCurso({ ...curso, preco_centavos: parseInt(e.target.value) || 0 })} style={inp} /></Field>
            <Field label="Preço (texto)"><input value={curso.preco_label} onChange={(e) => setCurso({ ...curso, preco_label: e.target.value })} style={inp} placeholder="R$ 297" /></Field>
            <Field label="Plataforma"><select value={curso.plataforma_venda} onChange={(e) => setCurso({ ...curso, plataforma_venda: e.target.value })} style={inp}><option value="">—</option><option value="hotmart">Hotmart</option><option value="kiwify">Kiwify</option><option value="eduzz">Eduzz</option><option value="outro">Outro</option></select></Field>
          </div>
          <Field label="Link de compra externo"><input value={curso.link_compra_externo} onChange={(e) => setCurso({ ...curso, link_compra_externo: e.target.value })} style={inp} placeholder="https://…" /></Field>
        </>
      )}

      <div style={sectionTitle}>Instrutor</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Nome"><input value={curso.instrutor_nome} onChange={(e) => setCurso({ ...curso, instrutor_nome: e.target.value })} style={inp} /></Field>
        <Field label="Foto (URL)"><input value={curso.instrutor_foto} onChange={(e) => setCurso({ ...curso, instrutor_foto: e.target.value })} style={inp} /></Field>
      </div>
      <Field label="Bio"><textarea value={curso.instrutor_bio} onChange={(e) => setCurso({ ...curso, instrutor_bio: e.target.value })} style={{ ...inp, minHeight: 60 }} /></Field>

      <div style={sectionTitle}>PDFs grátis do curso (download na página)</div>
      <input type="file" accept="application/pdf,.pdf" multiple onChange={(e) => setCurso({ ...curso, pdfsGratis: Array.from(e.target.files ?? []) })} style={inp} />
      {curso.pdfsGratis.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
          {curso.pdfsGratis.map((f: File, i: number) => (
            <li key={i} style={{ fontSize: 12, color: c.muted, padding: "4px 8px", background: c.warm }}>{f.name}</li>
          ))}
        </ul>
      )}

      <div style={sectionTitle}>Aulas — adicione quantas precisar</div>
      <div style={{ display: "grid", gap: 14 }}>
        {aulas.map((a: AulaLocal, i: number) => (
          <div key={i} style={{ background: "white", border: `1px solid ${c.border}`, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong style={{ fontFamily: serif, fontSize: 18, fontWeight: 400 }}>Aula {i + 1}</strong>
              {aulas.length > 1 && (
                <button type="button" onClick={() => removeAula(i)} style={btnSm(c.danger)}>Remover</button>
              )}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Título"><input value={a.titulo} onChange={(e) => updateAula(i, { titulo: e.target.value })} style={inp} /></Field>
              <Field label="Descrição"><textarea value={a.descricao} onChange={(e) => updateAula(i, { descricao: e.target.value })} style={{ ...inp, minHeight: 50 }} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Field label="Tipo">
                  <select value={a.tipo} onChange={(e) => updateAula(i, { tipo: e.target.value as any })} style={inp}>
                    <option value="video">Vídeo</option>
                    <option value="pdf">PDF</option>
                    <option value="texto">Texto</option>
                  </select>
                </Field>
                <Field label="Duração (min)"><input type="number" value={a.duracao_min} onChange={(e) => updateAula(i, { duracao_min: parseInt(e.target.value) || 0 })} style={inp} /></Field>
                <Field label="Acesso">
                  <select
                    value={a.previa_gratis ? "gratis" : "pago"}
                    onChange={(e) => updateAula(i, { previa_gratis: e.target.value === "gratis" })}
                    style={inp}
                  >
                    <option value="gratis">Grátis</option>
                    <option value="pago">Pago</option>
                  </select>
                </Field>
              </div>

              {a.tipo === "video" && (
                <>
                  <Field label="URL do vídeo (YouTube/Vimeo)"><input value={a.video_url} onChange={(e) => updateAula(i, { video_url: e.target.value })} style={inp} placeholder="https://youtube.com/…" /></Field>
                  <Field label="Ou enviar arquivo de vídeo"><input type="file" accept="video/*" onChange={(e) => updateAula(i, { videoFile: e.target.files?.[0] ?? null })} style={inp} /></Field>
                </>
              )}
              {a.tipo === "pdf" && (
                <Field label="Arquivo PDF da aula"><input type="file" accept="application/pdf" onChange={(e) => updateAula(i, { pdfFile: e.target.files?.[0] ?? null })} style={inp} /></Field>
              )}
              {a.tipo === "texto" && (
                <Field label="Conteúdo (HTML)"><textarea value={a.conteudo_html} onChange={(e) => updateAula(i, { conteudo_html: e.target.value })} style={{ ...inp, minHeight: 160, fontFamily: "monospace", fontSize: 13 }} /></Field>
              )}

              <Field label="Anexos para download (PDFs, imagens, etc — múltiplos)">
                <input type="file" multiple onChange={(e) => updateAula(i, { anexos: Array.from(e.target.files ?? []) })} style={inp} />
                {a.anexos.length > 0 && (
                  <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                    {a.anexos.map((f, k) => (
                      <li key={k} style={{ fontSize: 12, color: c.muted, padding: "4px 8px", background: c.warm }}>{f.name}</li>
                    ))}
                  </ul>
                )}
              </Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={addAula} style={{ ...btn(c.sage), alignSelf: "flex-start" }}>+ Adicionar aula</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
        <Field label="Ordem"><input type="number" value={curso.ordem} onChange={(e) => setCurso({ ...curso, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
        <Field label="Publicado">
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
            <input type="checkbox" checked={curso.publicado} onChange={(e) => setCurso({ ...curso, publicado: e.target.checked })} /> Visível ao público
          </label>
        </Field>
      </div>
    </div>
  );
}

// ================= FORM MATERIAL / SERVIÇO =================
function FormMaterial({ material, setMaterial, mostrarCategoria, isServico = false }: any) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {isServico && (
        <div style={{ background: c.warm, padding: 12, fontSize: 12, color: c.muted, border: `1px solid ${c.border}` }}>
          Categoria fixa: <strong style={{ color: c.ink }}>Serviço</strong>. Adicione um link de agendamento ou compra.
        </div>
      )}
      <Field label="Título"><input value={material.titulo} onChange={(e) => setMaterial({ ...material, titulo: e.target.value })} style={inp} /></Field>
      <Field label="Descrição"><textarea value={material.descricao} onChange={(e) => setMaterial({ ...material, descricao: e.target.value })} style={{ ...inp, minHeight: 70 }} /></Field>

      <div style={{ display: "grid", gridTemplateColumns: mostrarCategoria ? "1fr 1fr 1fr" : "1fr 1fr", gap: 14 }}>
        {mostrarCategoria && (
          <Field label="Categoria">
            <select value={material.categoria} onChange={(e) => setMaterial({ ...material, categoria: e.target.value })} style={inp}>
              <option>Concepção</option>
              <option>Gestação</option>
              <option>Parto</option>
              <option>Puerpério</option>
              <option>Bebê</option>
              <option>Geral</option>
            </select>
          </Field>
        )}
        <Field label="Formato">
          <select value={material.tipo} onChange={(e) => setMaterial({ ...material, tipo: e.target.value as any })} style={inp}>
            <option value="pdf">PDF</option>
            <option value="video_externo">Vídeo externo (URL)</option>
            <option value="video_upload">Vídeo upload</option>
            <option value="artigo">Artigo (texto)</option>
          </select>
        </Field>
        {!isServico && (
          <Field label="Área">
            <select value={material.area} onChange={(e) => setMaterial({ ...material, area: e.target.value as any })} style={inp}>
              <option value="gratis">Grátis (captura lead)</option>
              <option value="pago">Pago (assinantes)</option>
            </select>
          </Field>
        )}
      </div>

      {(material.tipo === "pdf" || material.tipo === "video_upload") && (
        <Field label={`Arquivo (${material.tipo === "pdf" ? "PDF" : "Vídeo"})`}>
          <input type="file" accept={material.tipo === "pdf" ? "application/pdf" : "video/*"} onChange={(e) => setMaterial({ ...material, arquivo: e.target.files?.[0] ?? null })} style={inp} />
        </Field>
      )}
      {material.tipo === "video_externo" && (
        <Field label="URL do vídeo"><input value={material.conteudo_url} onChange={(e) => setMaterial({ ...material, conteudo_url: e.target.value })} style={inp} placeholder="https://youtube.com/…" /></Field>
      )}
      {material.tipo === "artigo" && (
        <Field label="Conteúdo HTML"><textarea value={material.conteudo_html} onChange={(e) => setMaterial({ ...material, conteudo_html: e.target.value })} style={{ ...inp, minHeight: 200, fontFamily: "monospace", fontSize: 13 }} /></Field>
      )}

      <Field label="Capa (imagem opcional)"><input type="file" accept="image/*" onChange={(e) => setMaterial({ ...material, capa: e.target.files?.[0] ?? null })} style={inp} /></Field>

      <div style={sectionTitle}>{isServico ? "Compra / agendamento" : "Venda externa (opcional)"}</div>
      <Field label="Link"><input value={material.link_compra} onChange={(e) => setMaterial({ ...material, link_compra: e.target.value })} style={inp} placeholder="https://…" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Plataforma">
          <select value={material.plataforma_venda} onChange={(e) => setMaterial({ ...material, plataforma_venda: e.target.value })} style={inp}>
            <option value="">—</option><option value="hotmart">Hotmart</option><option value="kiwify">Kiwify</option><option value="eduzz">Eduzz</option><option value="outro">Outro</option>
          </select>
        </Field>
        <Field label="Preço (texto)"><input value={material.preco_label} onChange={(e) => setMaterial({ ...material, preco_label: e.target.value })} style={inp} placeholder="R$ 47" /></Field>
        <Field label="Texto do botão"><input value={material.cta_label} onChange={(e) => setMaterial({ ...material, cta_label: e.target.value })} style={inp} placeholder={isServico ? "Agendar" : "Comprar agora"} /></Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Ordem"><input type="number" value={material.ordem} onChange={(e) => setMaterial({ ...material, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
        <Field label="Publicado">
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
            <input type="checkbox" checked={material.publicado} onChange={(e) => setMaterial({ ...material, publicado: e.target.checked })} /> Visível ao público
          </label>
        </Field>
      </div>
    </div>
  );
}

// ================= PRÉVIA AO VIVO =================

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function CursoPreview({ curso, aulas }: { curso: any; aulas: AulaLocal[] }) {
  const capaUrl = useObjectUrl(curso.capa);
  const capaVideoUrl = useObjectUrl(curso.capaVideo);
  const totalAulas = useMemo(() => aulas.filter((a) => a.titulo.trim()).length, [aulas]);
  const ehGratis = curso.area === "gratis";
  const badge = ehGratis
    ? { label: "Conteúdo grátis", color: c.sage }
    : { label: "Conteúdo pago", color: c.gold };
  const precoLabel = ehGratis ? null : (curso.preco_label || (curso.preco_centavos ? `R$ ${(curso.preco_centavos / 100).toFixed(2).replace(".", ",")}` : null));
  return (
    <ContentCard
      numero="01"
      categoria={`${curso.categoria || "—"} · ${curso.nivel || ""}`}
      badge={badge}
      titulo={curso.titulo || "Título do curso"}
      descricao={curso.descricao_curta || "Descrição curta aparece aqui."}
      capa_url={capaUrl}
      capa_video_url={capaVideoUrl}
      metaLabel="Conteúdo"
      metaValor={`${totalAulas} ${totalAulas === 1 ? "aula" : "aulas"}${curso.carga_horaria_min > 0 ? ` · ${Math.round(curso.carga_horaria_min / 60)}h` : ""}`}
      precoLabel={precoLabel}
      ctaLabel={ehGratis ? "Acessar grátis" : "Ver conteúdo"}
      onAction={() => {}}
    />
  );
}

function MaterialPreview({ material, isServico }: { material: any; isServico: boolean }) {
  const capaUrl = useObjectUrl(material.capa);
  const ehGratis = !isServico && material.area === "gratis";
  const badge = isServico
    ? { label: "Serviço", color: c.gold }
    : ehGratis
      ? { label: "Conteúdo grátis", color: c.sage }
      : { label: "Conteúdo pago", color: c.gold };
  const precoLabel = ehGratis ? null : (material.preco_label || null);
  const tipoLabel: Record<string, string> = { pdf: "PDF", video_externo: "Vídeo", video_upload: "Vídeo", artigo: "Artigo" };
  return (
    <ContentCard
      numero="01"
      categoria={isServico ? "Serviço" : (material.categoria || "—")}
      badge={badge}
      titulo={material.titulo || (isServico ? "Nome do serviço" : "Título do material")}
      descricao={material.descricao || "Descrição aparece aqui."}
      capa_url={capaUrl}
      metaLabel="Formato"
      metaValor={tipoLabel[material.tipo] ?? "—"}
      precoLabel={precoLabel}
      ctaLabel={material.cta_label || (isServico ? "Agendar" : ehGratis ? "Baixar grátis" : "Comprar")}
      onAction={() => {}}
    />
  );
}

