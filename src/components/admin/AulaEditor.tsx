import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminListCursos, adminUpsertAulaAvulsa } from "@/lib/cursos.functions";

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

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "").slice(0, 120);

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
  const editing: AulaDraft = initial ?? {
    titulo: "", slug: "", descricao: "", tipo: "video", duracao_min: 0,
    publicado: false, gratis: false, previa_gratis: false,
    preco_centavos: 0, preco_label: "", moeda: "BRL",
    link_compra_externo: "", temas: [],
  };

  // Preview state
  const [pvTitulo, setPvTitulo] = useState(editing.titulo ?? "");
  const [pvDesc, setPvDesc] = useState(editing.descricao ?? "");
  const [pvTipo, setPvTipo] = useState(editing.tipo ?? "video");
  const [pvGratis, setPvGratis] = useState(editing.gratis ?? false);
  const [pvPrecoLabel, setPvPrecoLabel] = useState(editing.preco_label ?? "");
  const [pvTemasIds, setPvTemasIds] = useState<string[]>(editing.temas ?? []);
  const pvTemaNome = temas.find((t) => pvTemasIds.includes(t.id))?.titulo ?? "Tema";
  const tipoLabel: Record<string, string> = { video: "Vídeo", pdf: "PDF", texto: "Texto" };

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

      await fnSave({ data: {
        id: editing.id,
        titulo, slug,
        descricao: String(fd.get("descricao") ?? "") || null,
        tipo, video_url, pdf_url, conteudo_html,
        capa_url, capa_video_url,
        duracao_min: Number(fd.get("duracao_min") ?? 0) || 0,
        publicado: fd.get("publicado") === "on",
        gratis: fd.get("gratis") === "on",
        previa_gratis: fd.get("previa_gratis") === "on",
        preco_centavos: Number(fd.get("preco_centavos") ?? 0) || 0,
        preco_label: String(fd.get("preco_label") ?? "") || null,
        moeda: String(fd.get("moeda") ?? "BRL") || "BRL",
        link_compra_externo: String(fd.get("link_compra_externo") ?? "") || null,
        temas: temasSel,
      } as any });
      onSaved();
      onClose();
    } catch (e: any) { setErr(e?.message ?? "Erro ao salvar"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.65)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <form
        onSubmit={(e) => { e.preventDefault(); salvar(e.currentTarget); }}
        style={{ background: c.cream, padding: 28, width: "min(720px, 100%)", maxHeight: "90vh", overflow: "auto", border: `1px solid ${c.border}`, fontFamily: sans }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 18px", color: c.ink }}>
          {editing.id ? "Editar aula" : "Nova aula"}
        </h2>

        <Field label="Título"><input name="titulo" defaultValue={editing.titulo ?? ""} onChange={(e) => setPvTitulo(e.target.value)} style={inp} required /></Field>
        <Field label="Slug (URL)"><input name="slug" defaultValue={editing.slug ?? ""} placeholder="gerado automaticamente do título" style={inp} /></Field>
        <Field label="Descrição"><textarea name="descricao" defaultValue={editing.descricao ?? ""} onChange={(e) => setPvDesc(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} /></Field>

        <Field label="Temas (selecione um ou mais)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {temas.map((t) => {
              const checked = pvTemasIds.includes(t.id);
              return (
                <label key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${c.border}`, padding: "6px 10px", background: "white", cursor: "pointer" }}>
                  <input type="checkbox" name="temas" value={t.id} checked={checked} onChange={(e) => {
                    setPvTemasIds((prev) => e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id));
                  }} />
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

        <Field label="Capa (imagem) — usada como poster">
          <input name="capa" type="file" accept="image/*" style={inp} />
          {editing.capa_url && <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>Atual: {editing.capa_url}</div>}
        </Field>
        <Field label="Capa em vídeo (loop curto, MP4) — opcional, aparece no card">
          <input name="capa_video" type="file" accept="video/*" style={inp} />
          {editing.capa_video_url && <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>Atual: {editing.capa_video_url}</div>}
        </Field>

        <Field label="Vídeo da aula: arquivo OU URL externa (YouTube/Vimeo)">
          <input name="video_file" type="file" accept="video/*" style={{ ...inp, marginBottom: 8 }} />
          <input name="video_url_externa" placeholder="https://youtube.com/..." defaultValue={editing.video_url && String(editing.video_url).startsWith("http") ? editing.video_url : ""} style={inp} />
        </Field>
        <Field label="PDF (se tipo = PDF)"><input name="pdf_file" type="file" accept="application/pdf" style={inp} /></Field>
        <Field label="HTML (se tipo = Texto)"><textarea name="conteudo_html" defaultValue={editing.conteudo_html ?? ""} rows={5} style={{ ...inp, resize: "vertical", fontFamily: "ui-monospace, monospace" }} /></Field>

        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: c.sage, fontWeight: 600, marginBottom: 12 }}>Monetização</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
            <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" name="gratis" defaultChecked={editing.gratis ?? false} /> Aula grátis
            </label>
            <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" name="previa_gratis" defaultChecked={editing.previa_gratis ?? false} /> Prévia liberada para todos
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Preço (centavos)"><input name="preco_centavos" type="number" min={0} defaultValue={editing.preco_centavos ?? 0} style={inp} /></Field>
            <Field label="Label do preço"><input name="preco_label" defaultValue={editing.preco_label ?? ""} placeholder="R$ 49 / US$ 9" style={inp} /></Field>
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
        </div>

        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", margin: "8px 0 18px" }}>
          <input type="checkbox" name="publicado" defaultChecked={editing.publicado ?? false} /> Publicar agora
        </label>

        {err && <p style={{ color: c.danger, fontSize: 13 }}>{err}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={btn("transparent", c.ink)} disabled={busy}>Cancelar</button>
          <button type="submit" style={btn(c.sageDark)} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
        </div>
      </form>
    </div>
  );
}
