import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminListCursos, adminUpsertAulaAvulsa } from "@/lib/cursos.functions";
import OfertasEditor, { type OfertasEditorHandle } from "@/components/admin/OfertasEditor";
import TranslationsPanel, { type TranslationsPanelHandle } from "@/components/admin/TranslationsPanel";

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
      const wasNew = !(savedId ?? editing.id);
      if (wasNew) {
        setOk("Aula salva com sucesso. As versões ES/EN preenchidas também foram salvas. Você pode fechar ou continuar editando.");
      } else {
        onClose();
      }

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

  const PreviewCard = (
    <div style={{ background: c.sageDark, color: "white", padding: 24, position: "relative", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 300, opacity: 0.4, fontFamily: "'Playfair Display', serif" }}>01</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {pvGratis && <div style={{ background: "rgba(255,255,255,0.15)", padding: "4px 10px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>Conteúdo grátis</div>}
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.7 }}>{pvTemaNome}</div>
        </div>
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, margin: "0 0 8px", lineHeight: 1.2 }}>{pvTitulo || "Título da aula"}</h3>
      <p style={{ fontSize: 13, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>{pvDesc || "Descrição aparece aqui."}</p>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", marginTop: 16, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.6, marginBottom: 2 }}>Formato</div>
          <div style={{ fontSize: 13 }}>{tipoLabel[pvTipo] ?? "Vídeo"}</div>
        </div>
        <div style={{ background: "white", color: c.sageDark, padding: "10px 16px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>
          {pvGratis ? "Assistir grátis" : (pvPrecoLabel || "Comprar")}
        </div>
      </div>
    </div>
  );

  // Aba de país no topo do modal
  const [paisTab, setPaisTab] = useState<"BR" | "ES" | "US">("BR");
  const PAISES: { p: "BR" | "ES" | "US"; flag: string; label: string; hint: string }[] = [
    { p: "BR", flag: "🇧🇷", label: "Português", hint: "Conteúdo original" },
    { p: "ES", flag: "🇪🇸", label: "Español", hint: "Versão dublada / traduzida" },
    { p: "US", flag: "🇺🇸", label: "English", hint: "Dubbed / translated version" },
  ];

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
                Um cadastro · três idiomas. Use as abas abaixo para enviar vídeo e PDF dublados.
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
                  <span style={{ fontSize: 16 }}>{t.flag}</span>
                  <span>{t.label}</span>
                  {t.p === "BR" && <span style={{ background: "rgba(0,0,0,0.12)", color: active ? c.muted : "rgba(255,255,255,0.7)", fontSize: 9, padding: "2px 6px", letterSpacing: "0.1em", marginLeft: 4 }}>Base</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ BODY SCROLLÁVEL ============ */}
        <div style={{ overflow: "auto", padding: "24px 28px", flex: 1 }}>
          {/* PT-BR: sempre montado (preserva form data ao trocar de aba) */}
          <div style={{ display: paisTab === "BR" ? "grid" : "none", gridTemplateColumns: wide ? "minmax(0,1fr) 340px" : "1fr", gap: 28, alignItems: "start" }}>

              <div style={{ minWidth: 0 }}>
                <SectionTitle>Sobre a aula</SectionTitle>
                <Field label="Título"><input name="titulo" defaultValue={editing.titulo ?? ""} onChange={(e) => setPvTitulo(e.target.value)} style={inp} required /></Field>
                <Field label="Slug (URL)"><input name="slug" defaultValue={editing.slug ?? ""} placeholder="gerado automaticamente do título" style={inp} /></Field>
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

                <SectionTitle>Monetização</SectionTitle>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" name="gratis" defaultChecked={editing.gratis ?? false} onChange={(e) => setPvGratis(e.target.checked)} style={{ accentColor: c.sageDark }} /> Aula grátis
                  </label>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" name="previa_gratis" defaultChecked={editing.previa_gratis ?? false} style={{ accentColor: c.sageDark }} /> Prévia liberada para todos
                  </label>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input type="checkbox" name="publicado" defaultChecked={editing.publicado ?? false} style={{ accentColor: c.sageDark }} /> Publicar agora
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <Field label="Preço"><input name="preco_reais" type="number" min={0} step="0.01" defaultValue={((editing.preco_centavos ?? 0) / 100).toFixed(2)} placeholder="49.00" style={inp} /></Field>
                  <Field label="Label do preço"><input name="preco_label" defaultValue={editing.preco_label ?? ""} onChange={(e) => setPvPrecoLabel(e.target.value)} placeholder="R$ 49 / US$ 9" style={inp} /></Field>
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

                <SectionTitle>Formas de pagamento por país</SectionTitle>
                <div style={{ fontSize: 12, color: c.muted, marginBottom: 12 }}>
                  Preço e plataforma por país (Mercado Pago, Stripe, Hotmart…). O comprador verá apenas as ofertas do país dele.
                </div>
                <OfertasEditor
                  ref={ofertasRef}
                  produtoTipo="aula"
                  produtoId={savedId ?? null}
                  titulo="Ofertas da aula"
                />
              </div>

              {/* Coluna lateral: preview */}
              <div style={{ position: wide ? "sticky" : "static", top: 0, alignSelf: "start" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted, marginBottom: 12, fontWeight: 600 }}>Prévia do card</div>
                {PreviewCard}
                <p style={{ fontSize: 11, color: c.muted, marginTop: 8, lineHeight: 1.5 }}>É assim que aparece na vitrine do Atlas. Atualiza em tempo real.</p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: "14px 18px", marginBottom: 18, fontSize: 13, color: c.ink, lineHeight: 1.55 }}>
                <strong>Você está editando a versão {paisTab === "ES" ? "em Espanhol 🇪🇸" : "em Inglês 🇺🇸"}.</strong>{" "}
                Envie o vídeo dublado, o ebook/PDF traduzido e (se quiser) capa específica. Quando o usuário do {paisTab === "ES" ? "🇪🇸 ES" : "🇺🇸 EN"} trocar a bandeira no topo do app, ele verá esta versão automaticamente.
              </div>
              <TranslationsPanel
                ref={traducoesRef}
                itemType="curso_aula"
                itemId={savedId ?? null}
                lockedPais={paisTab}
                hideTabs
              />
            </div>
          )}

          {err && <p style={{ color: c.danger, fontSize: 13, marginTop: 16 }}>{err}</p>}
          {ok && <p style={{ color: "#2E7D32", fontSize: 13, background: "#EAF5EC", border: "1px solid #CDE6D2", padding: "10px 12px", marginTop: 16 }}>{ok}</p>}
        </div>

        {/* ============ FOOTER STICKY ============ */}
        <div style={{ position: "sticky", bottom: 0, background: "white", borderTop: `1px solid ${c.border}`, padding: "14px 28px", display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.06em" }}>
            {paisTab === "BR"
              ? "Os campos PT são a base da aula. ES/EN herdam quando não preenchidos."
              : `Versão ${paisTab} é opcional — sem ela, ${paisTab === "ES" ? "🇪🇸" : "🇺🇸"} verão o conteúdo em PT.`}
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

