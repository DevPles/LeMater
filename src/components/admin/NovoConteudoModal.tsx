import { createRef, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminUpsertCurso, adminUpsertModulo, adminUpsertAula } from "@/lib/cursos.functions";
import { upsertMaterial } from "@/lib/admin.functions";
import { ContentCard } from "@/components/ContentCard";
import OfertasEditor, { type OfertasEditorHandle } from "@/components/admin/OfertasEditor";
import AudiosEditor, { type AudiosEditorHandle } from "@/components/admin/AudiosEditor";

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageDark: "#2D5A42",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
  danger: "#B23A48",
  gold: "#B8923A",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const inp: CSSProperties = {
  width: "100%",
  background: "white",
  border: `1px solid ${c.border}`,
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: sans,
  color: c.ink,
  outline: "none",
};
const noAuto = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
} as const;
const modalBg: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(28,28,26,0.65)",
  zIndex: 300,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};
const btn = (bg: string): CSSProperties => ({
  background: bg,
  color: "white",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  padding: "12px 22px",
  border: "none",
  cursor: "pointer",
  fontFamily: sans,
});
const btnSm = (bg: string): CSSProperties => ({
  background: bg,
  color: "white",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.08em",
  padding: "6px 12px",
  border: "none",
  cursor: "pointer",
  fontFamily: sans,
});
const Field = ({ label, children }: any) => (
  <label style={{ display: "block" }}>
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: c.muted,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    {children}
  </label>
);
const sectionTitle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: c.sage,
  fontWeight: 600,
  marginBottom: 12,
  borderTop: `1px solid ${c.border}`,
  paddingTop: 16,
};

type Tipo = "curso" | "material" | "servico";

type LinkCompra = { plataforma: string; url: string; pais?: string | null; tipo?: "curso" | "passe" | "aula" | null };
type AulaLocal = {
  id?: string;
  titulo: string;
  descricao: string;
  tipo: "video" | "pdf" | "texto";
  video_url: string; // URL externa
  videoFile: File | null; // upload
  pdfFile: File | null;
  conteudo_html: string;
  duracao_min: number;
  previa_gratis: boolean;
  anexos: File[]; // múltiplos PDFs/arquivos para download
  // Venda por aula (quando previa_gratis = false)
  preco_centavos: number;
  preco_label: string;
  links_compra: LinkCompra[];
  ofertasRef: RefObject<OfertasEditorHandle | null>;
  audiosRef: RefObject<AudiosEditorHandle | null>;
};

const aulaVazia = (): AulaLocal => ({
  id: undefined,
  titulo: "",
  descricao: "",
  tipo: "video",
  video_url: "",
  videoFile: null,
  pdfFile: null,
  conteudo_html: "",
  duracao_min: 0,
  previa_gratis: true,
  anexos: [],
  preco_centavos: 0,
  preco_label: "",
  links_compra: [],
  ofertasRef: createRef<OfertasEditorHandle>(),
  audiosRef: createRef<AudiosEditorHandle>(),
});


export default function NovoConteudoModal({
  tipoInicial = "curso",
  cursoEdit,
  onClose,
  onSaved,
}: {
  tipoInicial?: Tipo;
  cursoEdit?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editando = !!cursoEdit?.id;
  const [tipo, setTipo] = useState<Tipo>(editando ? "curso" : tipoInicial);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");

  // ---- CURSO ----
  const upCurso = useServerFn(adminUpsertCurso);
  const upModulo = useServerFn(adminUpsertModulo);
  const upAula = useServerFn(adminUpsertAula);

  const [curso, setCurso] = useState(() => {
    const e = cursoEdit ?? {};
    const ehPago = !!(e.preco_centavos > 0 || e.link_compra_externo || (Array.isArray(e.links_compra) && e.links_compra.length > 0));
    return {
      id: e.id ?? null as string | null,
      titulo: e.titulo ?? "",
      slug: e.slug ?? "",
      descricao_curta: e.descricao_curta ?? "",
      descricao_longa: e.descricao_longa ?? "",
      capa: null as File | null,
      capaVideo: null as File | null,
      capa_url: e.capa_url ?? "",
      capa_video_url: e.capa_video_url ?? "",
      removerCapa: false,
      removerCapaVideo: false,
      trailer_url: e.trailer_url ?? "",
      categoria: e.categoria ?? "geral",
      nivel: e.nivel ?? "iniciante",
      carga_horaria_min: e.carga_horaria_min ?? 0,
      area: (editando ? (ehPago ? "pago" : "gratis") : "gratis") as "gratis" | "pago",
      preco_centavos: e.preco_centavos ?? 0,
      preco_label: e.preco_label ?? "",
      link_compra_externo: e.link_compra_externo ?? "",
      plataforma_venda: e.plataforma_venda ?? "",
      links_compra: Array.isArray(e.links_compra) ? e.links_compra : [] as { plataforma: string; url: string; pais?: string | null; tipo?: "curso" | "passe" | null }[],
      instrutor_nome: e.instrutor_nome ?? "",
      instrutor_bio: e.instrutor_bio ?? "",
      instrutor_foto: e.instrutor_foto ?? "",
      pdfsGratis: [] as File[],
      publicado: e.publicado ?? false,
      ordem: e.ordem ?? 0,
    };
  });
  const [aulas, setAulas] = useState<AulaLocal[]>([aulaVazia()]);
  const ofertasCursoRef = useRef<OfertasEditorHandle>(null);
  const audiosCursoRef = useRef<AudiosEditorHandle>(null);
  const ofertasServicoRef = useRef<OfertasEditorHandle>(null);

  // ---- MATERIAL / SERVIÇO ----
  const upMaterial = useServerFn(upsertMaterial);
  const [material, setMaterial] = useState({
    titulo: "",
    descricao: "",
    categoria: "Concepção",
    tipo: "pdf" as "pdf" | "video_externo" | "video_upload" | "artigo",
    area: "gratis" as "gratis" | "pago",
    conteudo_url: "",
    conteudo_html: "",
    arquivo: null as File | null,
    capa: null as File | null,
    link_compra: "",
    plataforma_venda: "",
    preco_label: "",
    cta_label: "",
    publicado: false,
    ordem: 0,
  });

  const syncPreviewFromForm = (form: HTMLFormElement) => {
    const value = (name: string) => {
      const field = form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      return field?.value ?? "";
    };

    if (tipo === "curso") {
      setCurso((prev) => ({
        ...prev,
        titulo: value("curso-titulo"),
        slug: value("curso-slug"),
        descricao_curta: value("curso-desc-curta"),
        descricao_longa: value("curso-desc-longa"),
        categoria: value("curso-categoria") || prev.categoria,
        nivel: value("curso-nivel") || prev.nivel,
        carga_horaria_min: parseInt(value("curso-carga-min")) || 0,
        area: (value("curso-acesso") || prev.area) as "gratis" | "pago",
        preco_centavos: parseInt(value("curso-preco-centavos")) || prev.preco_centavos,
        preco_label: value("curso-preco-label"),
        trailer_url: value("curso-trailer"),
        instrutor_nome: value("curso-instrutor-nome"),
        instrutor_foto: value("curso-instrutor-foto"),
        instrutor_bio: value("curso-instrutor-bio"),
        ordem: parseInt(value("curso-ordem")) || 0,
      }));
      return;
    }

    const prefix = tipo === "servico" ? "servico" : "material";
    setMaterial((prev) => ({
      ...prev,
      titulo: value(`${prefix}-titulo`),
      descricao: value(`${prefix}-descricao`),
      categoria:
        tipo === "servico" ? prev.categoria : value("material-categoria") || prev.categoria,
      tipo: (value(`${prefix}-formato`) || prev.tipo) as typeof prev.tipo,
      area:
        tipo === "servico" ? "pago" : ((value("material-area") || prev.area) as "gratis" | "pago"),
      conteudo_url: value(`${prefix}-video-url`),
      conteudo_html: value(`${prefix}-conteudo-html`),
      link_compra: value(`${prefix}-link`),
      plataforma_venda: value(`${prefix}-plataforma`),
      preco_label: value(`${prefix}-preco`),
      cta_label: value(`${prefix}-cta`),
      ordem: parseInt(value(`${prefix}-ordem`)) || 0,
    }));
  };

  // ===== SALVAR =====
  const salvar = async () => {
    setBusy(true);
    try {
      if (tipo === "curso") {
        await salvarCurso();
      } else {
        await salvarMaterial(
          tipo === "servico" ? "Serviço" : material.categoria,
          tipo === "servico",
        );
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
    if (!curso.titulo || !curso.slug) {
      throw new Error("Título e slug são obrigatórios");
    }

    // 1. Upload capa / vídeo selecionado no campo de capa
    setBusyMsg("Enviando capa…");
    let capa_url: string | null = curso.removerCapa ? null : (curso.capa_url || null);
    let capa_video_url: string | null = curso.removerCapaVideo ? null : (curso.capa_video_url || null);
    if (curso.capa) {
      const path = `cursos/${Date.now()}-${curso.capa.name.replace(/[^\w.-]/g, "_")}`;
      const { data: up, error } = await supabase.storage
        .from("materiais-capas")
        .upload(path, curso.capa);
      if (error) throw new Error("Falha capa: " + error.message);
      const publicUrl = supabase.storage.from("materiais-capas").getPublicUrl(up.path)
        .data.publicUrl;
      if (isVideoFile(curso.capa)) {
        capa_video_url = publicUrl;
      } else {
        capa_url = publicUrl;
      }
    }

    // 1b. Upload vídeo de capa (loop)
    if (curso.capaVideo) {
      setBusyMsg("Enviando vídeo de capa…");
      const path = `cursos/video/${Date.now()}-${curso.capaVideo.name.replace(/[^\w.-]/g, "_")}`;
      const { data: up, error } = await supabase.storage
        .from("materiais-capas")
        .upload(path, curso.capaVideo);
      if (error) throw new Error("Falha vídeo de capa: " + error.message);
      capa_video_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path)
        .data.publicUrl;
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
    setBusyMsg(editando ? "Salvando curso…" : "Criando curso…");
    const ehGratis = curso.area === "gratis";
    const linksLimpos = (curso.links_compra ?? [])
      .filter((l: any) => l?.plataforma?.trim() && l?.url?.trim())
      .map((l: any) => ({
        plataforma: String(l.plataforma).trim(),
        url: String(l.url).trim(),
        pais: l.pais || (String(l.plataforma).toLowerCase().includes("stripe") ? "Internacional" : "Brasil"),
        tipo: l.tipo === "passe" ? "passe" : "curso",
      }));
    const payload: any = {
      titulo: curso.titulo,
      slug: curso.slug,
      descricao_curta: curso.descricao_curta || null,
      descricao_longa: curso.descricao_longa || null,
      capa_url,
      capa_video_url,
      trailer_url: curso.trailer_url || null,
      categoria: curso.categoria,
      nivel: curso.nivel,
      carga_horaria_min: Number(curso.carga_horaria_min) || 0,
      preco_centavos: ehGratis ? 0 : Number(curso.preco_centavos) || 0,
      preco_label: ehGratis ? "Grátis" : curso.preco_label || null,
      link_compra_externo: ehGratis ? null : curso.link_compra_externo || null,
      plataforma_venda: ehGratis ? null : curso.plataforma_venda || null,
      links_compra: ehGratis ? [] : linksLimpos,
      publicado: curso.publicado,
      ordem: Number(curso.ordem) || 0,
      instrutor_nome: curso.instrutor_nome || null,
      instrutor_bio: curso.instrutor_bio || null,
      instrutor_foto: curso.instrutor_foto || null,
      ...(materiais_gratis.length > 0 ? { materiais_gratis } : {}),
    };
    if (curso.id) payload.id = curso.id;
    const cursoRow = await upCurso({ data: payload });

    // 3b. Persistir ofertas e áudios do curso (cria/atualiza usando o id)
    setBusyMsg("Salvando ofertas e áudios do curso…");
    await Promise.all([
      ofertasCursoRef.current?.flush(cursoRow.id),
      audiosCursoRef.current?.flush(cursoRow.id),
    ]);

    // 4. Aulas: só na criação inicial
    if (editando) return;
    const aulasValidas = aulas.filter((a) => a.titulo.trim());
    if (aulasValidas.length === 0) return;
    setBusyMsg("Criando módulo…");
    const moduloRow = await upModulo({
      data: {
        curso_id: cursoRow.id,
        titulo: "Conteúdo",
        descricao: null,
        ordem: 0,
      },
    });

    // 5. Para cada aula: upload + criação
    for (let i = 0; i < aulasValidas.length; i++) {
      const a = aulasValidas[i];
      setBusyMsg(`Aula ${i + 1} de ${aulasValidas.length}…`);

      let video_url: string | null = null;
      let pdf_url: string | null = null;
      if (a.tipo === "video") {
        if (a.videoFile) {
          const path = `${Date.now()}-${a.videoFile.name.replace(/[^\w.-]/g, "_")}`;
          const { error } = await supabase.storage
            .from("materiais-video")
            .upload(path, a.videoFile);
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

      const aulaPaga = !ehGratis && !a.previa_gratis;
      const linksLimpos = aulaPaga
        ? (a.links_compra ?? [])
            .filter((l) => l?.plataforma?.trim() && l?.url?.trim())
            .map((l) => ({
              plataforma: String(l.plataforma).trim(),
              url: String(l.url).trim(),
              pais: l.pais || "Brasil",
              tipo: l.tipo || "aula",
            }))
        : [];

      const aulaRow = await upAula({
        data: {
          modulo_id: moduloRow.id,
          titulo: a.titulo,
          descricao: a.descricao || null,
          tipo: a.tipo,
          video_url,
          pdf_url,
          conteudo_html: a.tipo === "texto" ? a.conteudo_html || null : null,
          duracao_min: Number(a.duracao_min) || 0,
          ordem: i,
          previa_gratis: ehGratis ? true : a.previa_gratis,
          materiais_extras,
          preco_centavos: aulaPaga ? Number(a.preco_centavos) || 0 : 0,
          preco_label: aulaPaga ? a.preco_label || null : null,
          links_compra: linksLimpos,
        },
      });

      // Persistir ofertas e áudios desta aula
      await Promise.all([
        a.ofertasRef.current?.flush(aulaRow.id),
        a.audiosRef.current?.flush(aulaRow.id),
      ]);

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
      const { data: up, error } = await supabase.storage
        .from("materiais-capas")
        .upload(path, material.capa);
      if (error) throw new Error("Falha capa: " + error.message);
      capa_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path).data.publicUrl;
    }

    setBusyMsg("Salvando…");
    const matRes = await upMaterial({
      data: {
        titulo: material.titulo,
        descricao: material.descricao || null,
        categoria,
        tipo: material.tipo,
        area: isServico ? "pago" : material.area,
        acesso: "publico",
        conteudo_url,
        conteudo_html: material.conteudo_html || null,
        capa_url,
        link_compra: material.link_compra || null,
        plataforma_venda: material.plataforma_venda || null,
        preco_label: material.preco_label || null,
        cta_label: material.cta_label || (isServico ? "Agendar" : null),
        ordem: Number(material.ordem) || 0,
        publicado: material.publicado,
      },
    });

    if (isServico && matRes?.id) {
      setBusyMsg("Salvando ofertas do serviço…");
      await ofertasServicoRef.current?.flush(matRes.id);
    }
  };

  // ===== UI =====
  return (
    <div style={modalBg}>
      <form
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.cream,
          maxWidth: 1280,
          width: "100%",
          maxHeight: "94vh",
          overflow: "hidden",
          border: `1px solid ${c.border}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header com seletor de tipo */}
        <div
          style={{
            padding: "24px 32px 0",
            background: c.cream,
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: c.sage,
              marginBottom: 6,
            }}
          >
            {editando ? "Editar conteúdo" : "Novo conteúdo"}
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, margin: "0 0 18px" }}>
            {editando ? "Editar curso" : "Criar novo item do Atlas"}
          </h2>

          {!editando && (
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
                      fontSize: 12,
                      fontFamily: sans,
                      fontWeight: 500,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {t === "curso" ? "Curso" : t === "material" ? "Material" : "Serviço"}
                  </button>
                );
              })}
            </div>
          )}
          {editando && <div style={{ height: 18 }} />}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 32px 24px", overflow: "auto" }}>
            {tipo === "curso" && (
              <FormCurso curso={curso} setCurso={setCurso} aulas={aulas} setAulas={setAulas} editando={editando} ofertasCursoRef={ofertasCursoRef} audiosCursoRef={audiosCursoRef} />
            )}
            {tipo === "material" && (
              <FormMaterial material={material} setMaterial={setMaterial} mostrarCategoria />
            )}
            {tipo === "servico" && (
              <FormMaterial
                material={material}
                setMaterial={setMaterial}
                mostrarCategoria={false}
                isServico
                ofertasServicoRef={ofertasServicoRef}
              />
            )}
          </div>

          <aside
            style={{
              borderLeft: `1px solid ${c.border}`,
              background: c.warm,
              padding: "20px 18px",
              overflow: "auto",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: c.muted,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Prévia do card
            </div>
            {tipo === "curso" ? (
              <CursoPreview curso={curso} aulas={aulas} />
            ) : (
              <MaterialPreview material={material} isServico={tipo === "servico"} />
            )}
            <p style={{ fontSize: 10.5, color: c.muted, marginTop: 14, lineHeight: 1.5 }}>
              É assim que o card aparece na vitrine do Atlas.
            </p>
          </aside>
        </div>

        <div
          style={{
            padding: "16px 32px 20px",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            borderTop: `1px solid ${c.border}`,
            background: c.cream,
          }}
        >
          {busy && (
            <span
              style={{ alignSelf: "center", fontSize: 12, color: c.muted, marginRight: "auto" }}
            >
              {busyMsg}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ ...btn(c.muted), opacity: busy ? 0.5 : 1 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={busy}
            style={{ ...btn(c.sageDark), opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ================= FORM CURSO =================
function FormCurso({ curso, setCurso, aulas, setAulas, editando, ofertasCursoRef, audiosCursoRef }: any) {
  const updateCurso = (patch: Record<string, unknown>) =>
    setCurso((prev: any) => ({ ...prev, ...patch }));
  const handleCursoInput = (patch: Record<string, unknown>) => {
    updateCurso(patch);
  };
  const addAula = () => setAulas((prev: AulaLocal[]) => [...prev, aulaVazia()]);
  const removeAula = (i: number) =>
    setAulas((prev: AulaLocal[]) => prev.filter((_: any, j: number) => j !== i));
  const updateAula = (i: number, patch: Partial<AulaLocal>) =>
    setAulas((prev: AulaLocal[]) =>
      prev.map((a: AulaLocal, j: number) => (j === i ? { ...a, ...patch } : a)),
    );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Field label="Título do curso">
          <input
            {...noAuto}
            name="curso-titulo"
            value={curso.titulo}
            onInput={(e) => handleCursoInput({ titulo: e.currentTarget.value })}
            onChange={(e) => handleCursoInput({ titulo: e.currentTarget.value })}
            style={inp}
            placeholder="Ex.: Preparação para o parto"
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            {...noAuto}
            name="curso-slug"
            value={curso.slug}
            onInput={(e) =>
              handleCursoInput({
                slug: e.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              })
            }
            onChange={(e) =>
              handleCursoInput({
                slug: e.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              })
            }
            style={inp}
            placeholder="meu-curso"
          />
        </Field>
      </div>
      <Field label="Descrição curta (vitrine)">
        <textarea
          {...noAuto}
          name="curso-desc-curta"
          value={curso.descricao_curta}
          onInput={(e) => handleCursoInput({ descricao_curta: e.currentTarget.value })}
          onChange={(e) => handleCursoInput({ descricao_curta: e.currentTarget.value })}
          style={{ ...inp, minHeight: 60 }}
          placeholder="Aparece no card da vitrine (1-2 linhas)"
        />
      </Field>
      <Field label="Descrição longa (página de vendas)">
        <textarea
          {...noAuto}
          name="curso-desc-longa"
          value={curso.descricao_longa}
          onInput={(e) => handleCursoInput({ descricao_longa: e.currentTarget.value })}
          onChange={(e) => handleCursoInput({ descricao_longa: e.currentTarget.value })}
          style={{ ...inp, minHeight: 110 }}
          placeholder="Texto completo exibido na página do curso"
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
        <Field label="Categoria">
          <input
            {...noAuto}
            name="curso-categoria"
            value={curso.categoria}
            onInput={(e) => handleCursoInput({ categoria: e.currentTarget.value })}
            onChange={(e) => handleCursoInput({ categoria: e.currentTarget.value })}
            style={inp}
          />
        </Field>
        <Field label="Nível">
          <select
            {...noAuto}
            name="curso-nivel"
            value={curso.nivel}
            onInput={(e) => handleCursoInput({ nivel: e.currentTarget.value })}
            onChange={(e) => handleCursoInput({ nivel: e.currentTarget.value })}
            style={inp}
          >
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </Field>
        <Field label="Carga (min)">
          <input
            {...noAuto}
            name="curso-carga-min"
            type="number"
            value={curso.carga_horaria_min}
            onInput={(e) =>
              handleCursoInput({ carga_horaria_min: parseInt(e.currentTarget.value) || 0 })
            }
            onChange={(e) =>
              handleCursoInput({ carga_horaria_min: parseInt(e.currentTarget.value) || 0 })
            }
            style={inp}
          />
        </Field>
        <Field label="Acesso">
          <select
            {...noAuto}
            name="curso-acesso"
            value={curso.area}
            onInput={(e) => handleCursoInput({ area: e.currentTarget.value as "gratis" | "pago" })}
            onChange={(e) => handleCursoInput({ area: e.currentTarget.value as "gratis" | "pago" })}
            style={inp}
          >
            <option value="gratis">Grátis (livre para todos)</option>
            <option value="pago">Pago</option>
          </select>
        </Field>
      </div>

      <Field label={`Capa (imagem ou vídeo — fallback / poster do vídeo)${curso.capa_url && !curso.removerCapa ? " — atual" : ""}`}>
        <input
          {...noAuto}
          name="curso-capa"
          type="file"
          accept="image/*,video/mp4,video/webm,video/*"
          onChange={(e) => updateCurso({ capa: e.target.files?.[0] ?? null, removerCapa: false })}
          style={inp}
        />
        {curso.capa_url && !curso.removerCapa && !curso.capa && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <img src={curso.capa_url} alt="capa atual" style={{ maxHeight: 100, border: `1px solid ${c.border}` }} />
            <button
              type="button"
              onClick={() => updateCurso({ removerCapa: true, capa_url: "" })}
              style={{ background: "transparent", border: `1px solid ${c.border}`, color: c.danger, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: sans, textTransform: "uppercase", letterSpacing: "0.1em" }}
            >
              Remover capa
            </button>
          </div>
        )}
      </Field>
      <Field label={`Vídeo de capa em loop (opcional, mp4/webm)${curso.capa_video_url && !curso.removerCapaVideo ? " — atual" : ""}`}>
        <input
          {...noAuto}
          name="curso-capa-video"
          type="file"
          accept="video/mp4,video/webm"
          onChange={(e) => updateCurso({ capaVideo: e.target.files?.[0] ?? null, removerCapaVideo: false })}
          style={inp}
        />
        {curso.capaVideo && (
          <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>
            {curso.capaVideo.name} · {(curso.capaVideo.size / 1024 / 1024).toFixed(1)} MB
          </div>
        )}
        {curso.capa_video_url && !curso.removerCapaVideo && !curso.capaVideo && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <video src={curso.capa_video_url} autoPlay muted loop playsInline style={{ maxHeight: 100, border: `1px solid ${c.border}` }} />
            <button
              type="button"
              onClick={() => updateCurso({ removerCapaVideo: true, capa_video_url: "" })}
              style={{ background: "transparent", border: `1px solid ${c.border}`, color: c.danger, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: sans, textTransform: "uppercase", letterSpacing: "0.1em" }}
            >
              Remover vídeo
            </button>
          </div>
        )}
      </Field>
      <Field label="Trailer (URL YouTube/Vimeo, opcional)">
        <input
          {...noAuto}
          name="curso-trailer"
          value={curso.trailer_url}
          onInput={(e) => handleCursoInput({ trailer_url: e.currentTarget.value })}
          onChange={(e) => handleCursoInput({ trailer_url: e.currentTarget.value })}
          style={inp}
        />
      </Field>

      {curso.area === "pago" && (
        <>
          <div style={sectionTitle}>Venda do curso completo</div>
          <div style={{ fontSize: 12, color: c.muted, marginBottom: 10, fontFamily: sans }}>
            Configure preço por país e plataforma de pagamento. O usuário verá apenas as ofertas do país dele.
          </div>
          <OfertasEditor
            ref={ofertasCursoRef}
            produtoTipo="curso"
            produtoId={curso.id}
            titulo="Ofertas do curso (país × plataforma)"
          />
        </>
      )}

      <div style={sectionTitle}>Ouça também (áudios vinculados)</div>
      <AudiosEditor ref={audiosCursoRef} vinculoTipo="curso" vinculoId={curso.id} />


      <div style={sectionTitle}>Instrutor</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Nome">
          <input
            {...noAuto}
            name="curso-instrutor-nome"
            value={curso.instrutor_nome}
            onInput={(e) => handleCursoInput({ instrutor_nome: e.currentTarget.value })}
            onChange={(e) => handleCursoInput({ instrutor_nome: e.currentTarget.value })}
            style={inp}
          />
        </Field>
        <Field label="Foto (URL)">
          <input
            {...noAuto}
            name="curso-instrutor-foto"
            value={curso.instrutor_foto}
            onInput={(e) => handleCursoInput({ instrutor_foto: e.currentTarget.value })}
            onChange={(e) => handleCursoInput({ instrutor_foto: e.currentTarget.value })}
            style={inp}
          />
        </Field>
      </div>
      <Field label="Bio">
        <textarea
          {...noAuto}
          name="curso-instrutor-bio"
          value={curso.instrutor_bio}
          onInput={(e) => handleCursoInput({ instrutor_bio: e.currentTarget.value })}
          onChange={(e) => handleCursoInput({ instrutor_bio: e.currentTarget.value })}
          style={{ ...inp, minHeight: 60 }}
        />
      </Field>

      <div style={sectionTitle}>PDFs grátis do curso (download na página)</div>
      <input
        {...noAuto}
        name="curso-pdfs-gratis"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={(e) => updateCurso({ pdfsGratis: Array.from(e.target.files ?? []) })}
        style={inp}
      />
      {curso.pdfsGratis.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
          {curso.pdfsGratis.map((f: File, i: number) => (
            <li
              key={i}
              style={{ fontSize: 12, color: c.muted, padding: "4px 8px", background: c.warm }}
            >
              {f.name}
            </li>
          ))}
        </ul>
      )}

      {!editando && <div style={sectionTitle}>Aulas — adicione quantas precisar</div>}
      {!editando && (
      <div style={{ display: "grid", gap: 14 }}>
        {aulas.map((a: AulaLocal, i: number) => (
          <div
            key={i}
            style={{ background: "white", border: `1px solid ${c.border}`, padding: 16 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <strong style={{ fontFamily: serif, fontSize: 18, fontWeight: 400 }}>
                Aula {i + 1}
              </strong>
              {aulas.length > 1 && (
                <button type="button" onClick={() => removeAula(i)} style={btnSm(c.danger)}>
                  Remover
                </button>
              )}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Título">
                <input
                  value={a.titulo}
                  onChange={(e) => updateAula(i, { titulo: e.target.value })}
                  style={inp}
                />
              </Field>
              <Field label="Descrição">
                <textarea
                  value={a.descricao}
                  onChange={(e) => updateAula(i, { descricao: e.target.value })}
                  style={{ ...inp, minHeight: 50 }}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Field label="Tipo">
                  <select
                    value={a.tipo}
                    onChange={(e) => updateAula(i, { tipo: e.target.value as any })}
                    style={inp}
                  >
                    <option value="video">Vídeo</option>
                    <option value="pdf">PDF</option>
                    <option value="texto">Texto</option>
                  </select>
                </Field>
                <Field label="Duração (min)">
                  <input
                    type="number"
                    value={a.duracao_min}
                    onChange={(e) => updateAula(i, { duracao_min: parseInt(e.target.value) || 0 })}
                    style={inp}
                  />
                </Field>
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

              {!a.previa_gratis && (
                <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 12 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 8 }}>
                    Venda desta aula
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <Field label="Preço (centavos)">
                      <input
                        type="number"
                        min={0}
                        value={a.preco_centavos}
                        onChange={(e) => updateAula(i, { preco_centavos: Math.max(0, parseInt(e.target.value) || 0) })}
                        style={inp}
                      />
                    </Field>
                    <Field label="Preço (texto exibido)">
                      <input
                        value={a.preco_label}
                        onChange={(e) => updateAula(i, { preco_label: e.target.value })}
                        placeholder="R$ 47"
                        style={inp}
                      />
                    </Field>
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>
                    Métodos de pagamento
                  </div>
                  {(a.links_compra ?? []).map((l, k) => (
                    <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 180px 1fr auto", gap: 6, marginBottom: 6 }}>
                      <select
                        value={l.pais ?? "Brasil"}
                        onChange={(e) => {
                          const arr = [...a.links_compra]; arr[k] = { ...arr[k], pais: e.target.value };
                          updateAula(i, { links_compra: arr });
                        }}
                        style={inp}
                      >
                        <option value="Brasil">Brasil</option>
                        <option value="Internacional">Internacional</option>
                      </select>
                      <select
                        value={l.plataforma}
                        onChange={(e) => {
                          const arr = [...a.links_compra]; arr[k] = { ...arr[k], plataforma: e.target.value };
                          updateAula(i, { links_compra: arr });
                        }}
                        style={inp}
                      >
                        <option value="">— escolha o método —</option>
                        <optgroup label="Brasil">
                          <option value="Mercado Pago">Mercado Pago</option>
                          <option value="InfinityPay">InfinityPay</option>
                          <option value="Hotmart">Hotmart</option>
                          <option value="Kiwify">Kiwify</option>
                          <option value="Eduzz">Eduzz</option>
                        </optgroup>
                        <optgroup label="Internacional">
                          <option value="Stripe">Stripe</option>
                        </optgroup>
                        <option value="Outro">Outro</option>
                      </select>
                      <input
                        value={l.url}
                        onChange={(e) => {
                          const arr = [...a.links_compra]; arr[k] = { ...arr[k], url: e.target.value };
                          updateAula(i, { links_compra: arr });
                        }}
                        placeholder="https://… (deixe em branco para Mercado Pago nativo)"
                        style={inp}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const arr = [...a.links_compra]; arr.splice(k, 1);
                          updateAula(i, { links_compra: arr });
                        }}
                        style={{ background: "transparent", border: `1px solid ${c.border}`, color: c.danger, padding: "0 10px", cursor: "pointer", fontSize: 12, fontFamily: sans }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateAula(i, { links_compra: [...(a.links_compra ?? []), { pais: "Brasil", tipo: "aula", plataforma: "", url: "" }] })}
                    style={{ background: "white", border: `1px solid ${c.border}`, color: c.sageDark, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: sans, letterSpacing: "0.08em", textTransform: "uppercase" }}
                  >
                    + Adicionar método de pagamento
                  </button>
                </div>
              )}

              {!a.previa_gratis && (
                <OfertasEditor
                  ref={a.ofertasRef}
                  produtoTipo="aula"
                  produtoId={a.id ?? null}
                  titulo="Ofertas desta aula (país × plataforma)"
                />
              )}

              <AudiosEditor
                ref={a.audiosRef}
                vinculoTipo="aula"
                vinculoId={a.id ?? null}
                titulo="Áudios vinculados a esta aula"
              />




              {a.tipo === "video" && (
                <>
                  <Field label="URL do vídeo (YouTube/Vimeo)">
                    <input
                      value={a.video_url}
                      onChange={(e) => updateAula(i, { video_url: e.target.value })}
                      style={inp}
                      placeholder="https://youtube.com/…"
                    />
                  </Field>
                  <Field label="Ou enviar arquivo de vídeo">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => updateAula(i, { videoFile: e.target.files?.[0] ?? null })}
                      style={inp}
                    />
                  </Field>
                </>
              )}
              {a.tipo === "pdf" && (
                <Field label="Arquivo PDF da aula">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => updateAula(i, { pdfFile: e.target.files?.[0] ?? null })}
                    style={inp}
                  />
                </Field>
              )}
              {a.tipo === "texto" && (
                <Field label="Conteúdo (HTML)">
                  <textarea
                    value={a.conteudo_html}
                    onChange={(e) => updateAula(i, { conteudo_html: e.target.value })}
                    style={{ ...inp, minHeight: 160, fontFamily: "monospace", fontSize: 13 }}
                  />
                </Field>
              )}

              <Field label="Anexos para download (PDFs, imagens, etc — múltiplos)">
                <input
                  type="file"
                  multiple
                  onChange={(e) => updateAula(i, { anexos: Array.from(e.target.files ?? []) })}
                  style={inp}
                />
                {a.anexos.length > 0 && (
                  <ul
                    style={{
                      margin: "8px 0 0",
                      padding: 0,
                      listStyle: "none",
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    {a.anexos.map((f, k) => (
                      <li
                        key={k}
                        style={{
                          fontSize: 12,
                          color: c.muted,
                          padding: "4px 8px",
                          background: c.warm,
                        }}
                      >
                        {f.name}
                      </li>
                    ))}
                  </ul>
                )}
              </Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={addAula} style={{ ...btn(c.sage), alignSelf: "flex-start" }}>
          + Adicionar aula
        </button>
      </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
        <Field label="Ordem">
          <input
            {...noAuto}
            name="curso-ordem"
            type="number"
            value={curso.ordem}
            onInput={(e) => handleCursoInput({ ordem: parseInt(e.currentTarget.value) || 0 })}
            onChange={(e) => handleCursoInput({ ordem: parseInt(e.currentTarget.value) || 0 })}
            style={inp}
          />
        </Field>
        <Field label="Publicado">
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
            <input
              {...noAuto}
              name="curso-publicado"
              type="checkbox"
              checked={curso.publicado}
              onChange={(e) => updateCurso({ publicado: e.target.checked })}
            />{" "}
            Visível ao público
          </label>
        </Field>
      </div>
    </div>
  );
}

// ================= FORM MATERIAL / SERVIÇO =================
function FormMaterial({ material, setMaterial, mostrarCategoria, isServico = false, ofertasServicoRef }: any) {
  const updateMaterial = (patch: Record<string, unknown>) =>
    setMaterial((prev: any) => ({ ...prev, ...patch }));
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {isServico && (
        <div
          style={{
            background: c.warm,
            padding: 12,
            fontSize: 12,
            color: c.muted,
            border: `1px solid ${c.border}`,
          }}
        >
          Categoria fixa: <strong style={{ color: c.ink }}>Serviço</strong>. Adicione um link de
          agendamento ou compra.
        </div>
      )}
      <Field label="Título">
        <input
          {...noAuto}
          name={isServico ? "servico-titulo" : "material-titulo"}
          value={material.titulo}
          onInput={(e) => updateMaterial({ titulo: e.currentTarget.value })}
          onChange={(e) => updateMaterial({ titulo: e.currentTarget.value })}
          style={inp}
        />
      </Field>
      <Field label="Descrição">
        <textarea
          {...noAuto}
          name={isServico ? "servico-descricao" : "material-descricao"}
          value={material.descricao}
          onInput={(e) => updateMaterial({ descricao: e.currentTarget.value })}
          onChange={(e) => updateMaterial({ descricao: e.currentTarget.value })}
          style={{ ...inp, minHeight: 70 }}
        />
      </Field>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: mostrarCategoria ? "1fr 1fr 1fr" : "1fr 1fr",
          gap: 14,
        }}
      >
        {mostrarCategoria && (
          <Field label="Categoria">
            <select
              {...noAuto}
              name="material-categoria"
              value={material.categoria}
              onInput={(e) => updateMaterial({ categoria: e.currentTarget.value })}
              onChange={(e) => updateMaterial({ categoria: e.currentTarget.value })}
              style={inp}
            >
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
          <select
            {...noAuto}
            name={isServico ? "servico-formato" : "material-formato"}
            value={material.tipo}
            onInput={(e) => updateMaterial({ tipo: e.currentTarget.value as any })}
            onChange={(e) => updateMaterial({ tipo: e.currentTarget.value as any })}
            style={inp}
          >
            <option value="pdf">PDF</option>
            <option value="video_externo">Vídeo externo (URL)</option>
            <option value="video_upload">Vídeo upload</option>
            <option value="artigo">Artigo (texto)</option>
          </select>
        </Field>
        {!isServico && (
          <Field label="Área">
            <select
              {...noAuto}
              name="material-area"
              value={material.area}
              onInput={(e) => updateMaterial({ area: e.currentTarget.value as any })}
              onChange={(e) => updateMaterial({ area: e.currentTarget.value as any })}
              style={inp}
            >
              <option value="gratis">Grátis (captura lead)</option>
              <option value="pago">Pago (assinantes)</option>
            </select>
          </Field>
        )}
      </div>

      {(material.tipo === "pdf" || material.tipo === "video_upload") && (
        <Field label={`Arquivo (${material.tipo === "pdf" ? "PDF" : "Vídeo"})`}>
          <input
            {...noAuto}
            name={isServico ? "servico-arquivo" : "material-arquivo"}
            type="file"
            accept={material.tipo === "pdf" ? "application/pdf" : "video/*"}
            onChange={(e) => updateMaterial({ arquivo: e.target.files?.[0] ?? null })}
            style={inp}
          />
        </Field>
      )}
      {material.tipo === "video_externo" && (
        <Field label="URL do vídeo">
          <input
            {...noAuto}
            name={isServico ? "servico-video-url" : "material-video-url"}
            value={material.conteudo_url}
            onInput={(e) => updateMaterial({ conteudo_url: e.currentTarget.value })}
            onChange={(e) => updateMaterial({ conteudo_url: e.currentTarget.value })}
            style={inp}
            placeholder="https://youtube.com/…"
          />
        </Field>
      )}
      {material.tipo === "artigo" && (
        <Field label="Conteúdo HTML">
          <textarea
            {...noAuto}
            name={isServico ? "servico-conteudo-html" : "material-conteudo-html"}
            value={material.conteudo_html}
            onInput={(e) => updateMaterial({ conteudo_html: e.currentTarget.value })}
            onChange={(e) => updateMaterial({ conteudo_html: e.currentTarget.value })}
            style={{ ...inp, minHeight: 200, fontFamily: "monospace", fontSize: 13 }}
          />
        </Field>
      )}

      <Field label="Capa (imagem opcional)">
        <input
          {...noAuto}
          name={isServico ? "servico-capa" : "material-capa"}
          type="file"
          accept="image/*"
          onChange={(e) => updateMaterial({ capa: e.target.files?.[0] ?? null })}
          style={inp}
        />
      </Field>

      {isServico && (
        <>
          <div style={sectionTitle}>Venda do serviço (país × plataforma)</div>
          <div style={{ fontSize: 12, color: c.muted, marginBottom: 10, fontFamily: sans }}>
            Configure preço e plataforma de pagamento por país. Salve o serviço — depois reabra para ajustar ofertas.
          </div>
          <OfertasEditor
            ref={ofertasServicoRef}
            produtoTipo="servico"
            produtoId={material.id ?? null}
            titulo="Ofertas do serviço"
          />
        </>
      )}

      <div style={sectionTitle}>
        {isServico ? "Link alternativo (opcional)" : "Venda externa (opcional)"}
      </div>
      <Field label="Link">
        <input
          {...noAuto}
          name={isServico ? "servico-link" : "material-link"}
          value={material.link_compra}
          onInput={(e) => updateMaterial({ link_compra: e.currentTarget.value })}
          onChange={(e) => updateMaterial({ link_compra: e.currentTarget.value })}
          style={inp}
          placeholder="https://…"
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Plataforma">
          <select
            {...noAuto}
            name={isServico ? "servico-plataforma" : "material-plataforma"}
            value={material.plataforma_venda}
            onInput={(e) => updateMaterial({ plataforma_venda: e.currentTarget.value })}
            onChange={(e) => updateMaterial({ plataforma_venda: e.currentTarget.value })}
            style={inp}
          >
            <option value="">—</option>
            <option value="hotmart">Hotmart</option>
            <option value="kiwify">Kiwify</option>
            <option value="eduzz">Eduzz</option>
            <option value="outro">Outro</option>
          </select>
        </Field>
        <Field label="Preço (texto)">
          <input
            {...noAuto}
            name={isServico ? "servico-preco" : "material-preco"}
            value={material.preco_label}
            onInput={(e) => updateMaterial({ preco_label: e.currentTarget.value })}
            onChange={(e) => updateMaterial({ preco_label: e.currentTarget.value })}
            style={inp}
            placeholder="R$ 47"
          />
        </Field>
        <Field label="Texto do botão">
          <input
            {...noAuto}
            name={isServico ? "servico-cta" : "material-cta"}
            value={material.cta_label}
            onInput={(e) => updateMaterial({ cta_label: e.currentTarget.value })}
            onChange={(e) => updateMaterial({ cta_label: e.currentTarget.value })}
            style={inp}
            placeholder={isServico ? "Agendar" : "Comprar agora"}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Ordem">
          <input
            {...noAuto}
            name={isServico ? "servico-ordem" : "material-ordem"}
            type="number"
            value={material.ordem}
            onInput={(e) => updateMaterial({ ordem: parseInt(e.currentTarget.value) || 0 })}
            onChange={(e) => updateMaterial({ ordem: parseInt(e.currentTarget.value) || 0 })}
            style={inp}
          />
        </Field>
        <Field label="Publicado">
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
            <input
              {...noAuto}
              name={isServico ? "servico-publicado" : "material-publicado"}
              type="checkbox"
              checked={material.publicado}
              onChange={(e) => updateMaterial({ publicado: e.target.checked })}
            />{" "}
            Visível ao público
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
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function isVideoFile(file: File | null | undefined) {
  return !!file && file.type.startsWith("video/");
}

function isImageFile(file: File | null | undefined) {
  return !!file && file.type.startsWith("image/");
}

function CursoPreview({ curso, aulas }: { curso: any; aulas: AulaLocal[] }) {
  const capaUrl = useObjectUrl(curso.capa);
  const capaVideoUrl = useObjectUrl(curso.capaVideo);
  const totalAulas = useMemo(() => aulas.filter((a) => a.titulo.trim()).length, [aulas]);
  const ehGratis = curso.area === "gratis";
  const badge = ehGratis
    ? { label: "Conteúdo grátis", color: c.sage }
    : { label: "Conteúdo pago", color: c.gold };
  const precoLabel = ehGratis
    ? null
    : curso.preco_label ||
      (curso.preco_centavos
        ? `R$ ${(curso.preco_centavos / 100).toFixed(2).replace(".", ",")}`
        : null);
  const descricaoPreview =
    curso.descricao_curta || curso.descricao_longa || "Descrição curta aparece aqui.";
  const capaEhVideo = isVideoFile(curso.capa);
  const videoPreviewUrl = capaVideoUrl || (capaEhVideo ? capaUrl : null);
  const imagemPreviewUrl = isImageFile(curso.capa) ? capaUrl : null;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <ContentCard
        key={`${curso.area}-${curso.titulo}-${descricaoPreview}-${curso.descricao_longa}-${curso.categoria}-${curso.nivel}-${totalAulas}-${videoPreviewUrl}`}
        numero="01"
        categoria={`${curso.categoria || "—"} · ${curso.nivel || ""}`}
        badge={badge}
        titulo={curso.titulo || "Título do curso"}
        descricao={descricaoPreview}
        capa_url={imagemPreviewUrl}
        capa_video_url={videoPreviewUrl}
        metaLabel="Conteúdo"
        metaValor={`${totalAulas} ${totalAulas === 1 ? "aula" : "aulas"}${curso.carga_horaria_min > 0 ? ` · ${Math.round(curso.carga_horaria_min / 60)}h` : ""}`}
        precoLabel={precoLabel}
        ctaLabel={ehGratis ? "Acessar grátis" : "Ver conteúdo"}
        onAction={() => {}}
      />
    </div>
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
  const precoLabel = ehGratis ? null : material.preco_label || null;
  const tipoLabel: Record<string, string> = {
    pdf: "PDF",
    video_externo: "Vídeo",
    video_upload: "Vídeo",
    artigo: "Artigo",
  };
  const descricaoPreview =
    material.descricao || material.conteudo_html || "Descrição aparece aqui.";
  return (
    <ContentCard
      key={`${isServico}-${material.area}-${material.titulo}-${descricaoPreview}-${material.categoria}-${material.tipo}`}
      numero="01"
      categoria={isServico ? "Serviço" : material.categoria || "—"}
      badge={badge}
      titulo={material.titulo || (isServico ? "Nome do serviço" : "Título do material")}
      descricao={descricaoPreview}
      capa_url={capaUrl}
      metaLabel="Formato"
      metaValor={tipoLabel[material.tipo] ?? "—"}
      precoLabel={precoLabel}
      ctaLabel={
        material.cta_label || (isServico ? "Agendar" : ehGratis ? "Baixar grátis" : "Comprar")
      }
      onAction={() => {}}
    />
  );
}
