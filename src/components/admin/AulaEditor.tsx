import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminListCursos, adminUpsertAulaAvulsa } from "@/lib/cursos.functions";
import OfertasEditor, { type OfertasEditorHandle } from "@/components/admin/OfertasEditor";
import TranslationsPanel, { type TranslationsPanelHandle, type TranslationRow, MOEDA_PADRAO } from "@/components/admin/TranslationsPanel";
import type { Pais } from "@/lib/translate.context";
import { ContentCard } from "@/components/ContentCard";
import { videoForAulaCover } from "@/lib/atlas-cover-video";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48" };
const sans = "'DM Sans', sans-serif";

const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };
const btn = (bg: string, color = "white"): CSSProperties => ({ background: bg, color, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 18px", border: bg === "transparent" ? `1px solid ${c.border}` : "none", cursor: "pointer", fontFamily: sans });
const Field = ({ label, children }: any) => (
  <label style={{ display: "block", marginBottom: 14 }}>
    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>
    {children}
  </label>
);
const MediaField = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label style={{ display: "flex", flexDirection: "column", marginBottom: 0, minHeight: 96, height: "100%" }}>
    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6, minHeight: 34, display: "flex", alignItems: "flex-end", lineHeight: 1.25 }}>{label}</div>
    <div style={{ marginTop: "auto" }}>{children}</div>
    <div style={{ fontSize: 11, color: c.muted, marginTop: 4, minHeight: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hint}</div>
  </label>
);

const FLAG_CODE: Record<Pais, string> = { BR: "br", ES: "es", US: "us" };
const FlagMark = ({ pais, size = 18 }: { pais: Pais; size?: number }) => (
  <img
    src={`https://flagcdn.com/w80/${FLAG_CODE[pais]}.png`}
    srcSet={`https://flagcdn.com/w160/${FLAG_CODE[pais]}.png 2x`}
    alt=""
    aria-label={pais}
    title={pais}
    style={{ width: size, height: Math.round(size * 0.68), objectFit: "cover", borderRadius: 2, boxShadow: "0 0 0 1px rgba(0,0,0,0.14) inset", flexShrink: 0, display: "inline-block" }}
  />
);

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "").slice(0, 120);

const toPublicStorageUrl = (bucket: string, value?: string | null) => {
  if (!value) return "";
  if (/^(https?:|blob:|data:|\/)/i.test(value)) return value;
  return supabase.storage.from(bucket).getPublicUrl(value).data.publicUrl;
};

export type AulaDraft = {
  id?: string;
  titulo?: string;
  slug?: string | null;
  descricao?: string | null;
  tipo?: "video" | "pdf" | "texto";
  duracao_min?: number;
  capa_url?: string | null;
  capa_video_url?: string | null;
  publicado?: boolean;
  gratis?: boolean;
  previa_gratis?: boolean;
  preco_centavos?: number;
  preco_label?: string | null;
  moeda?: string;
  link_compra_externo?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
  conteudo_html?: string | null;
  beneficios?: string[];
  temas?: string[];
};


type Tema = { id: string; titulo: string };

export default function AulaEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial?: AulaDraft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fnTemas = useServerFn(adminListCursos);
  const fnSave = useServerFn(adminUpsertAulaAvulsa);

  const [temas, setTemas] = useState<Tema[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const ofertasRef = useRef<OfertasEditorHandle>(null);
  const traducoesRef = useRef<TranslationsPanelHandle>(null);

  const editing: AulaDraft = initial ?? {
    titulo: "", slug: "", descricao: "", tipo: "video", duracao_min: 0,
    publicado: false, gratis: false, previa_gratis: false,
    preco_centavos: 0, preco_label: "", moeda: "BRL",
    link_compra_externo: "", temas: [],
  };
  // ID corrente do item (existente OU recém-salvo) — habilita Ofertas e Traduções logo após o 1º salvar
  const [savedId, setSavedId] = useState<string | undefined>(editing.id);


  // Preview state
  const [pvTitulo, setPvTitulo] = useState(editing.titulo ?? "");
  const [slugVal, setSlugVal] = useState(editing.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!editing.slug);
  const [pvDesc, setPvDesc] = useState(editing.descricao ?? "");
  const [pvTipo, setPvTipo] = useState(editing.tipo ?? "video");
  const [pvGratis, setPvGratis] = useState(editing.gratis ?? false);
  const [pvPrecoLabel, setPvPrecoLabel] = useState(editing.preco_label ?? "");
  const [pvCapaFile, setPvCapaFile] = useState("");
  const [pvCapaVideoFile, setPvCapaVideoFile] = useState("");

  useEffect(() => () => {
    if (pvCapaFile) URL.revokeObjectURL(pvCapaFile);
    if (pvCapaVideoFile) URL.revokeObjectURL(pvCapaVideoFile);
  }, [pvCapaFile, pvCapaVideoFile]);

  const [pvTemasIds, setPvTemasIds] = useState<string[]>(editing.temas ?? []);
  const selectedPreviewTemas = temas.filter((t) => pvTemasIds.includes(t.id));
  const pvTemaNome = selectedPreviewTemas[0]?.titulo ?? "Tema";
  const tipoLabel: Record<string, string> = { video: "Vídeo", pdf: "PDF", texto: "Texto" };

  // Buffer ao vivo das traduções (atualizado pelo TranslationsPanel via onRowsChange)
  const [trRows, setTrRows] = useState<Record<Pais, TranslationRow> | null>(null);

  useEffect(() => {
    fnTemas().then((t) => setTemas((t as any[]).map((x) => ({ id: x.id, titulo: x.titulo }))));
  }, []);

  const salvar = async (form: HTMLFormElement) => {
    setBusy(true); setErr(null);
    try {
      const fd = new FormData(form);
      const titulo = String(fd.get("titulo") ?? "").trim();
      let slug = String(fd.get("slug") ?? "").trim() || slugify(titulo);
      if (!slug) slug = slugify(titulo) || `aula-${Date.now()}`;
      const temasSel = Array.from(fd.getAll("temas")).map(String);
      if (temasSel.length === 0) throw new Error("Selecione ao menos um tema");

      let capa_url = editing.capa_url ?? null;
      const capaFile = fd.get("capa") as File | null;
      if (capaFile && capaFile.size > 0) {
        const path = `aulas/${Date.now()}-${capaFile.name.replace(/[^\w.-]/g, "_")}`;
        const { data: up, error } = await supabase.storage.from("materiais-capas").upload(path, capaFile);
        if (error) throw new Error("Falha capa: " + error.message);
        capa_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path).data.publicUrl;
      }

      let capa_video_url = editing.capa_video_url ?? null;
      const capaVideoFile = fd.get("capa_video") as File | null;
      if (capaVideoFile && capaVideoFile.size > 0) {
        const path = `aulas/video/${Date.now()}-${capaVideoFile.name.replace(/[^\w.-]/g, "_")}`;
        const { data: up, error } = await supabase.storage.from("materiais-capas").upload(path, capaVideoFile);
        if (error) throw new Error("Falha vídeo de capa: " + error.message);
        capa_video_url = supabase.storage.from("materiais-capas").getPublicUrl(up.path).data.publicUrl;
      }

      const tipo = String(fd.get("tipo") ?? "video") as "video" | "pdf" | "texto";
      let video_url: string | null = editing.video_url ?? null;
      let pdf_url: string | null = editing.pdf_url ?? null;
      let conteudo_html: string | null = editing.conteudo_html ?? null;

      if (tipo === "video") {
        const externa = String(fd.get("video_url_externa") ?? "").trim();
        const videoFile = fd.get("video_file") as File | null;
        if (videoFile && videoFile.size > 0) {
          const path = `${Date.now()}-${videoFile.name.replace(/[^\w.-]/g, "_")}`;
          const { error } = await supabase.storage.from("materiais-video").upload(path, videoFile);
          if (error) throw new Error("Falha vídeo: " + error.message);
          video_url = path;
        } else if (externa) {
          video_url = externa;
        }
      } else if (tipo === "pdf") {
        const pdfFile = fd.get("pdf_file") as File | null;
        if (pdfFile && pdfFile.size > 0) {
          const path = `${Date.now()}-${pdfFile.name.replace(/[^\w.-]/g, "_")}`;
          const { error } = await supabase.storage.from("materiais-pdf").upload(path, pdfFile);
          if (error) throw new Error("Falha PDF: " + error.message);
          pdf_url = path;
        }
      } else {
        conteudo_html = String(fd.get("conteudo_html") ?? "");
      }

      const beneficios = String(fd.get("beneficios") ?? "")
        .split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20);

      const saved = await fnSave({ data: {
        id: savedId ?? editing.id,
        titulo, slug,
        descricao: String(fd.get("descricao") ?? "") || null,
        tipo, video_url, pdf_url, conteudo_html,
        capa_url, capa_video_url,
        duracao_min: Number(fd.get("duracao_min") ?? 0) || 0,
        publicado: fd.get("publicado") === "on",
        gratis: fd.get("gratis") === "on",
        previa_gratis: fd.get("previa_gratis") === "on",
        preco_centavos: Math.round((Number(fd.get("preco_reais") ?? 0) || 0) * 100),
        preco_label: String(fd.get("preco_label") ?? "") || null,
        moeda: String(fd.get("moeda") ?? "BRL") || "BRL",
        link_compra_externo: String(fd.get("link_compra_externo") ?? "") || null,
        beneficios,
        temas: temasSel,
      } as any }) as { id: string };

      if (saved?.id) setSavedId(saved.id);

      if (ofertasRef.current && saved?.id) {
        await ofertasRef.current.flush(saved.id);
      }
      if (traducoesRef.current && saved?.id) {
        await traducoesRef.current.flush(saved.id);
      }

      onSaved();
      onClose();

    } catch (e: any) { setErr(e?.message ?? "Erro ao salvar"); }
    finally { setBusy(false); }
  };


  const isWide = typeof window !== "undefined" && window.matchMedia("(min-width: 900px)").matches;
  const [wide, setWide] = useState(isWide);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const h = () => setWide(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Aba de país no topo do modal
  const [paisTab, setPaisTab] = useState<Pais>("BR");
  const PAISES: { p: Pais; label: string; hint: string }[] = [
    { p: "BR", label: "Português", hint: "Conteúdo original" },
    { p: "ES", label: "Español", hint: "Versão dublada / traduzida" },
    { p: "US", label: "English", hint: "Dubbed / translated version" },
  ];

  // Resolve o que mostrar na prévia para o país ativo (com fallback PT)
  const formatPreco = (centavos: number, moeda: string) => {
    if (!centavos) return "";
    const v = (centavos / 100).toFixed(2);
    if (moeda === "EUR") return `€ ${v.replace(".", ",")}`;
    if (moeda === "USD") return `$ ${v}`;
    return `R$ ${v.replace(".", ",")}`;
  };
  const trCurrent = paisTab !== "BR" ? trRows?.[paisTab] : undefined;
  const pvTituloShow = (trCurrent?.titulo) || pvTitulo || "Título da aula";
  const pvDescShow = (trCurrent?.descricao) || pvDesc || "Descrição aparece aqui.";
  const isGratisPreview = paisTab === "BR"
    ? pvGratis === true
    : (typeof trCurrent?.gratis === "boolean" ? trCurrent.gratis : pvGratis === true);
  const acessoPreviewLabel = isGratisPreview ? "GRÁTIS" : "PAGO";
  const acessoPreviewCta = isGratisPreview ? "ASSISTIR" : "COMPRAR";
  const pvPrecoShow = isGratisPreview
    ? "Assistir grátis"
    : trCurrent
      ? (trCurrent.preco_label || formatPreco(trCurrent.preco_centavos, trCurrent.moeda || MOEDA_PADRAO[paisTab]) || pvPrecoLabel || "Comprar")
      : (pvPrecoLabel || "Comprar");

  // A prévia usa a mesma capa em vídeo da vitrine Atlas: vídeo cadastrado, ou o vídeo automático do tema.
  const pvCapaVideoExplicit = toPublicStorageUrl("materiais-capas", (trCurrent?.capa_video_url) || pvCapaVideoFile || editing.capa_video_url || "");
  const pvCapaVideoShow = pvCapaVideoExplicit || videoForAulaCover({ titulo: pvTituloShow, descricao: pvDescShow, temas: selectedPreviewTemas });
  const pvCapaShow = toPublicStorageUrl("materiais-capas", (trCurrent?.capa_url) || pvCapaFile || editing.capa_url || "");

  const previewCategoria = pvTemaNome && pvTemaNome !== "Tema" ? pvTemaNome : null;
  const PreviewCard = (
    <div key={`${paisTab}-${acessoPreviewLabel}-${pvCapaVideoShow || pvCapaShow || "sem-capa"}`} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2, display: "inline-flex", alignItems: "center" }}>
        <FlagMark pais={paisTab} size={16} />
      </div>
      <ContentCard
        numero="01"
        categoria={previewCategoria}
        badge={{ label: isGratisPreview ? "Grátis" : "Conteúdo pago", color: isGratisPreview ? c.sage : "#B8923A" }}
        titulo={pvTituloShow}
        descricao={pvDescShow}
        capa_url={pvCapaShow || null}
        capa_video_url={pvCapaVideoShow || null}
        metaLabel="Formato"
        metaValor={tipoLabel[pvTipo] ?? "Vídeo"}
        precoLabel={!isGratisPreview ? (pvPrecoShow !== "Comprar" ? pvPrecoShow : null) : null}
        ctaLabel={acessoPreviewCta}
        onAction={() => {}}
      />
      {paisTab !== "BR" && !trCurrent?.titulo && !trCurrent?.descricao && (
        <div style={{ marginTop: 10, fontSize: 10, letterSpacing: "0.08em", color: c.muted }}>
          Sem tradução {paisTab} — usando PT como fallback.
        </div>
      )}
    </div>
  );



  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.72)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" }}>
      <form
        onSubmit={(e) => { e.preventDefault(); salvar(e.currentTarget); }}
        style={{ background: c.cream, width: wide ? "min(1180px, 100%)" : "min(760px, 100%)", maxHeight: "92vh", display: "flex", flexDirection: "column", border: `1px solid ${c.border}`, fontFamily: sans, boxShadow: "0 30px 80px -20px rgba(0,0,0,0.45)" }}
      >
        {/* ============ HEADER STICKY ============ */}
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: c.sageDark, color: "white", padding: "20px 28px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.65, marginBottom: 6 }}>
                {editing.id || savedId ? "Editando aula" : "Nova aula"}
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, margin: 0, lineHeight: 1.2 }}>
                {pvTitulo || (editing.id ? "Aula sem título" : "Nova aula no Atlas")}
              </h2>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Um cadastro · três idiomas. Use as abas abaixo para definir capa, mídia, preço e acesso.
              </div>
            </div>
            <button type="button" onClick={onClose} disabled={busy}
              style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", fontFamily: sans }}>
              Fechar
            </button>
          </div>

          {/* Abas de país */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            {PAISES.map((t) => {
              const active = paisTab === t.p;
              return (
                <button key={t.p} type="button" onClick={() => setPaisTab(t.p)}
                  style={{
                    background: active ? c.cream : "transparent",
                    color: active ? c.ink : "white",
                    border: "none",
                    padding: "12px 20px",
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: sans,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: active ? `3px solid ${c.cream}` : "3px solid transparent",
                    marginBottom: -1,
                  }}>
                  <FlagMark pais={t.p} size={18} />
                  <span>{t.label}</span>
                  {t.p === "BR" && <span style={{ background: "rgba(0,0,0,0.12)", color: active ? c.muted : "rgba(255,255,255,0.7)", fontSize: 9, padding: "2px 6px", letterSpacing: "0.1em", marginLeft: 4 }}>Base</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ BODY SCROLLÁVEL ============ */}
        <div style={{ overflow: "auto", padding: "24px 28px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: wide ? "minmax(0,1fr) 340px" : "1fr", gap: 28, alignItems: "start" }}>
            <div style={{ minWidth: 0 }}>
              {/* PT-BR: sempre montado (preserva form data ao trocar de aba) */}
              <div style={{ display: paisTab === "BR" ? "block" : "none" }}>
                <SectionTitle>Sobre a aula</SectionTitle>
                <Field label="Título"><input name="titulo" defaultValue={editing.titulo ?? ""} onChange={(e) => { const t = e.target.value; setPvTitulo(t); if (!slugTouched) setSlugVal(slugify(t)); }} style={inp} required /></Field>
                <Field label="Slug (URL)"><input name="slug" value={slugVal} onChange={(e) => { setSlugTouched(true); setSlugVal(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} placeholder="gerado automaticamente do título" style={inp} /></Field>
                <Field label="Descrição"><textarea name="descricao" defaultValue={editing.descricao ?? ""} onChange={(e) => setPvDesc(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} /></Field>

                <Field label="Temas (selecione um ou mais)">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {temas.map((t) => {
                      const checked = pvTemasIds.includes(t.id);
                      return (
                        <label key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${checked ? c.sageDark : c.border}`, background: checked ? c.sageDark : "white", color: checked ? "white" : c.ink, padding: "6px 10px", cursor: "pointer", transition: "all .15s" }}>
                          <input type="checkbox" name="temas" value={t.id} checked={checked} onChange={(e) => {
                            setPvTemasIds((prev) => e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id));
                          }} style={{ accentColor: c.sageDark }} />
                          <span style={{ fontSize: 13 }}>{t.titulo}</span>
                        </label>
                      );
                    })}
                    {temas.length === 0 && <span style={{ color: c.muted, fontSize: 13 }}>Crie ao menos um tema antes.</span>}
                  </div>
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Tipo de conteúdo">
                    <select name="tipo" defaultValue={editing.tipo ?? "video"} onChange={(e) => setPvTipo(e.target.value as any)} style={inp}>
                      <option value="video">Vídeo</option>
                      <option value="pdf">PDF</option>
                      <option value="texto">Texto / Artigo</option>
                    </select>
                  </Field>
                  <Field label="Duração (min)"><input name="duracao_min" type="number" min={0} defaultValue={editing.duracao_min ?? 0} style={inp} /></Field>
                </div>

                <SectionTitle>Mídia em Português</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: wide ? "repeat(4, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))", gap: 12, alignItems: "stretch" }}>
                  <MediaField label="Capa (imagem) — usada como poster" hint={editing.capa_url ? `Atual: ${editing.capa_url}` : ""}>
                    <input name="capa" type="file" accept="image/*" onChange={(e) => {
                      setPvCapaFile((prev) => { if (prev) URL.revokeObjectURL(prev); return e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : ""; });
                    }} style={{ ...inp, minHeight: 42 }} />
                  </MediaField>
                  <MediaField label="Capa em vídeo (loop curto, MP4) — opcional" hint={editing.capa_video_url ? `Atual: ${editing.capa_video_url}` : ""}>
                    <input name="capa_video" type="file" accept="video/*" onChange={(e) => {
                      setPvCapaVideoFile((prev) => { if (prev) URL.revokeObjectURL(prev); return e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : ""; });
                    }} style={{ ...inp, minHeight: 42 }} />
                  </MediaField>
                  <MediaField label="Vídeo da aula — arquivo (MP4)" hint="">
                    <input name="video_file" type="file" accept="video/*" style={{ ...inp, minHeight: 42 }} />
                  </MediaField>
                  <MediaField label="Vídeo da aula — OU URL externa (YouTube/Vimeo)" hint="">
                    <input
                      name="video_url_externa"
                      placeholder="https://youtube.com/..."
                      defaultValue={editing.video_url && String(editing.video_url).startsWith("http") ? editing.video_url : ""}
                      style={{ ...inp, minHeight: 42 }}
                    />
                  </MediaField>
                </div>

                <Field label="PDF (se tipo = PDF)"><input name="pdf_file" type="file" accept="application/pdf" style={inp} /></Field>
                <Field label="HTML (se tipo = Texto)"><textarea name="conteudo_html" defaultValue={editing.conteudo_html ?? ""} rows={5} style={{ ...inp, resize: "vertical", fontFamily: "ui-monospace, monospace" }} /></Field>

                <SectionTitle>Monetização — Brasil (preço base)</SectionTitle>
                <input type="checkbox" name="gratis" checked={pvGratis} readOnly style={{ display: "none" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <button type="button" onClick={() => setPvGratis(true)} style={{ background: pvGratis ? c.sageDark : "white", color: pvGratis ? "white" : c.ink, border: `1px solid ${pvGratis ? c.sageDark : c.border}`, padding: 14, textAlign: "left", cursor: "pointer", fontFamily: sans }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Conteúdo grátis</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>O card mostra Grátis e o botão Assistir.</div>
                  </button>
                  <button type="button" onClick={() => setPvGratis(false)} style={{ background: !pvGratis ? c.sageDark : "white", color: !pvGratis ? "white" : c.ink, border: `1px solid ${!pvGratis ? c.sageDark : c.border}`, padding: 14, textAlign: "left", cursor: "pointer", fontFamily: sans }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Conteúdo pago</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>O card mostra Pago e o botão Comprar.</div>
                  </button>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" name="previa_gratis" defaultChecked={editing.previa_gratis ?? false} style={{ accentColor: c.sageDark }} /> Prévia liberada para todos
                  </label>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" name="publicado" defaultChecked={editing.publicado ?? false} style={{ accentColor: c.sageDark }} /> Publicar agora
                  </label>
                </div>
                <div style={{ fontSize: 12, color: c.muted, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  Este é o preço para <FlagMark pais="BR" size={16} /> Brasil. Para <FlagMark pais="ES" size={16} /> Espanha e <FlagMark pais="US" size={16} /> EUA, defina o preço em cada aba acima.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <Field label="Preço (R$)"><input name="preco_reais" type="number" min={0} step="0.01" defaultValue={((editing.preco_centavos ?? 0) / 100).toFixed(2)} placeholder="49.00" style={inp} /></Field>
                  <Field label="Label do preço"><input name="preco_label" defaultValue={editing.preco_label ?? ""} onChange={(e) => setPvPrecoLabel(e.target.value)} placeholder="R$ 49,00" style={inp} /></Field>
                  <Field label="Moeda">
                    <select name="moeda" defaultValue={editing.moeda ?? "BRL"} style={inp}>
                      <option value="BRL">BRL</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </Field>
                </div>
                <Field label="Link de compra externo (Stripe / Mercado Pago / Hotmart…)">
                  <input name="link_compra_externo" defaultValue={editing.link_compra_externo ?? ""} placeholder="https://..." style={inp} />
                </Field>
                <Field label="Benefícios da compra (um por linha)">
                  <textarea
                    name="beneficios"
                    defaultValue={(editing.beneficios ?? []).join("\n")}
                    rows={5}
                    placeholder={"Acesso vitalício à aula\nVisualização ilimitada\nMateriais de apoio em PDF\nCertificado digital de conclusão"}
                    style={{ ...inp, resize: "vertical" }}
                  />
                </Field>

                <SectionTitle>Formas de pagamento por país (avançado)</SectionTitle>
                <div style={{ fontSize: 12, color: c.muted, marginBottom: 12 }}>
                  Opcional — plataformas externas por país (Mercado Pago, Stripe, Hotmart…). Se vazio, usamos o preço definido em cada aba de idioma.
                </div>
                <OfertasEditor
                  ref={ofertasRef}
                  produtoTipo="aula"
                  produtoId={savedId ?? null}
                  titulo="Ofertas da aula"
                />
              </div>


              {/* Painel de traduções: sempre montado, escondido em BR para preservar buffer e refletir no preview */}
              <div style={{ display: paisTab !== "BR" ? "block" : "none" }}>
                <TranslationsPanel
                  ref={traducoesRef}
                  itemType="curso_aula"
                  itemId={savedId ?? null}
                  lockedPais={paisTab === "BR" ? "ES" : paisTab}
                  hideTabs
                  onRowsChange={setTrRows}
                />
              </div>
            </div>

            {/* Coluna lateral: preview SEMPRE visível, reflete país ativo */}
            <div style={{ position: wide ? "sticky" : "static", top: 0, alignSelf: "start" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted, marginBottom: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>Prévia do card <FlagMark pais={paisTab} size={18} /></div>
              {PreviewCard}
              <p style={{ fontSize: 11, color: c.muted, marginTop: 8, lineHeight: 1.5 }}>É assim que aparece na vitrine para usuários do país <strong>{paisTab}</strong>. Atualiza em tempo real.</p>
            </div>
          </div>



          {err && <p style={{ color: c.danger, fontSize: 13, marginTop: 16 }}>{err}</p>}
          {ok && <p style={{ color: "#2E7D32", fontSize: 13, background: "#EAF5EC", border: "1px solid #CDE6D2", padding: "10px 12px", marginTop: 16 }}>{ok}</p>}
        </div>

        {/* ============ FOOTER STICKY ============ */}
        <div style={{ position: "sticky", bottom: 0, background: "white", borderTop: `1px solid ${c.border}`, padding: "14px 28px", display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.06em" }}>
            {paisTab === "BR" ? (
              "Os campos PT são a base da aula. ES/EN herdam quando não preenchidos."
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                Versão {paisTab} é opcional — sem ela, <FlagMark pais={paisTab} size={16} /> verão o conteúdo em PT.
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={btn("transparent", c.ink)} disabled={busy}>{savedId ? "Fechar" : "Cancelar"}</button>
            <button type="submit" style={btn(c.sageDark)} disabled={busy}>{busy ? "Salvando…" : (savedId ? "Salvar alterações" : "Salvar aula")}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: c.sage, fontWeight: 600, margin: "8px 0 14px", paddingBottom: 8, borderBottom: `1px solid ${c.border}` }}>
    {children}
  </div>
);

