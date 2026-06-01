import { forwardRef, useEffect, useImperativeHandle, useState, type CSSProperties } from "react";
import { appConfirm } from "@/components/AppDialog";
import { supabase } from "@/integrations/supabase/client";
import type { ContentItemType } from "@/hooks/useTranslatedContent";
import type { Pais } from "@/lib/translate.context";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48", ok: "#2E7D32" };
const sans = "'DM Sans', sans-serif";
const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };
const FLAG_CODE: Record<Pais, string> = { BR: "br", ES: "es", US: "us" };
const FlagMark = ({ pais, size = 18 }: { pais: Pais; size?: number }) => (
  <img src={`https://flagcdn.com/w80/${FLAG_CODE[pais]}.png`} srcSet={`https://flagcdn.com/w160/${FLAG_CODE[pais]}.png 2x`} alt="" aria-label={pais} title={pais} style={{ width: size, height: Math.round(size * 0.68), objectFit: "cover", borderRadius: 2, boxShadow: "0 0 0 1px rgba(0,0,0,0.14) inset", flexShrink: 0 }} />
);

const TABS: { pais: Pais; label: string }[] = [
  { pais: "BR", label: "Português (PT)" },
  { pais: "ES", label: "Español (ES)" },
  { pais: "US", label: "English (EN)" },
];

export type ExtraItem = {
  kind: "pdf" | "video_upload" | "video_externo";
  nome: string;
  path?: string | null;
  url?: string | null;
  _file?: File;
  _pending?: boolean;
  _localId: string;
};

export type TranslationRow = {
  id?: string;
  titulo: string;
  descricao: string;
  gratis: boolean | null;
  video_url: string;
  pdf_url: string;
  capa_url: string;
  capa_video_url: string;
  audio_url: string;
  legenda_url: string;
  conteudo_html: string;
  preco_centavos: number;
  moeda: string;
  preco_label: string;
  materiais_extras: ExtraItem[];
};
type Row = TranslationRow;

export const MOEDA_PADRAO: Record<Pais, string> = { BR: "BRL", ES: "EUR", US: "USD" };

let _lid = 0;
const makeLocalId = () => `lid-${Date.now()}-${++_lid}`;

const empty = (pais: Pais = "BR"): Row => ({ id: undefined, titulo: "", descricao: "", gratis: null, video_url: "", pdf_url: "", capa_url: "", capa_video_url: "", audio_url: "", legenda_url: "", conteudo_html: "", preco_centavos: 0, moeda: MOEDA_PADRAO[pais], preco_label: "", materiais_extras: [] });

const isFilled = (r: Row) =>
  !!(r.titulo || r.descricao || r.gratis !== null || r.video_url || r.pdf_url || r.capa_url || r.capa_video_url || r.audio_url || r.legenda_url || r.conteudo_html || (r.preco_centavos && r.preco_centavos > 0) || r.preco_label || (r.materiais_extras && r.materiais_extras.length > 0));

export type TranslationsPanelHandle = {
  /** Persist all buffered (ES/EN) translations against the given itemId. */
  flush: (itemId: string) => Promise<void>;
  /** True if any ES/EN field is filled and not yet saved. */
  hasPending: () => boolean;
};

/**
 * Painel reutilizável para gerenciar traduções (ES / EN) de qualquer item.
 * Funciona em modo "novo" (sem itemId): mantém rascunho em memória + uploads no storage,
 * e persiste tudo via `flush(itemId)` chamado pelo editor depois de salvar o item-pai.
 */
const TranslationsPanel = forwardRef<TranslationsPanelHandle, {
  itemType: ContentItemType;
  itemId: string | null | undefined;
  /** Trava o painel em um país e oculta as abas internas (usado quando o modal-pai já oferece abas de país). */
  lockedPais?: Pais;
  hideTabs?: boolean;
  /** Notifica o pai sempre que algum campo de tradução muda (para preview ao vivo). */
  onRowsChange?: (rows: Record<Pais, Row>) => void;
}>(function TranslationsPanel({ itemType, itemId, lockedPais, hideTabs, onRowsChange }, ref) {
  const [tab, setTab] = useState<Pais>(lockedPais ?? "ES");
  useEffect(() => { if (lockedPais) setTab(lockedPais); }, [lockedPais]);

  const [rows, setRows] = useState<Record<Pais, Row>>({ BR: empty("BR"), ES: empty("ES"), US: empty("US") });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Carrega traduções existentes quando há itemId
  useEffect(() => {
    if (!itemId) return;
    supabase
      .from("content_translations")
      .select("*")
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .then(({ data }) => {
        const next: Record<Pais, Row> = { BR: empty("BR"), ES: empty("ES"), US: empty("US") };
        (data as any[] | null)?.forEach((t) => {
          const p = t.pais as Pais;
          next[p] = {
            id: t.id,
            titulo: t.titulo ?? "",
            descricao: t.descricao ?? "",
            gratis: typeof t.gratis === "boolean" ? t.gratis : null,
            video_url: t.video_url ?? "",
            pdf_url: t.pdf_url ?? "",
            capa_url: t.capa_url ?? "",
            capa_video_url: t.capa_video_url ?? "",
            audio_url: t.audio_url ?? "",
            legenda_url: t.legenda_url ?? "",
            conteudo_html: t.conteudo_html ?? "",
            preco_centavos: t.preco_centavos ?? 0,
            moeda: t.moeda ?? MOEDA_PADRAO[p],
            preco_label: t.preco_label ?? "",
            materiais_extras: Array.isArray(t.materiais_extras)
              ? (t.materiais_extras as any[]).map((m) => ({ kind: m.kind, nome: m.nome ?? "", path: m.path ?? null, url: m.url ?? null, _localId: makeLocalId() }))
              : [],
          };
        });
        setRows(next);
        onRowsChange?.(next);
      });
  }, [itemType, itemId]);

  // Expor flush p/ o editor pai persistir após criar o item
  useImperativeHandle(ref, () => ({
    hasPending: () => isFilled(rows.ES) || isFilled(rows.US),
    flush: async (newId: string) => {
      for (const pais of ["ES", "US"] as Pais[]) {
        const r = rows[pais];
        if (!isFilled(r)) continue;
        const extras = await materializeExtras(pais);
        const payload: any = {
          item_type: itemType,
          item_id: newId,
          pais,
          titulo: r.titulo || null,
          descricao: r.descricao || null,
          gratis: r.gratis,
          video_url: r.video_url || null,
          pdf_url: r.pdf_url || null,
          capa_url: r.capa_url || null,
          capa_video_url: r.capa_video_url || null,
          audio_url: r.audio_url || null,
          legenda_url: r.legenda_url || null,
          conteudo_html: r.conteudo_html || null,
          preco_centavos: r.preco_centavos > 0 ? r.preco_centavos : null,
          moeda: r.moeda || null,
          preco_label: r.preco_label || null,
          materiais_extras: extras,
        };
        const { error } = await supabase
          .from("content_translations")
          .upsert(payload, { onConflict: "item_type,item_id,pais" });
        if (error) throw new Error(`Tradução ${pais}: ${error.message}`);
      }
    },
  }), [rows, itemType]);

  const upload = async (bucket: string, file: File, subfolder: string): Promise<string> => {
    const path = `${subfolder}/${tab.toLowerCase()}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { data: up, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw new Error(`Falha upload ${file.name}: ${error.message}`);
    return supabase.storage.from(bucket).getPublicUrl(up.path).data.publicUrl;
  };

  // Faz upload retornando o `path` (chave no bucket) — usado para materiais_extras
  // pois o player gera signed URLs a partir do path no servidor.
  const uploadPath = async (bucket: string, file: File, subfolder: string, pais: Pais): Promise<string> => {
    const path = `${subfolder}/${pais.toLowerCase()}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { data: up, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw new Error(`Falha upload ${file.name}: ${error.message}`);
    return up.path;
  };

  const materializeExtras = async (pais: Pais): Promise<{ kind: ExtraItem["kind"]; nome: string; path?: string | null; url?: string | null }[]> => {
    const list = rows[pais].materiais_extras ?? [];
    const out: { kind: ExtraItem["kind"]; nome: string; path?: string | null; url?: string | null }[] = [];
    for (const ex of list) {
      if (ex.kind === "video_externo") {
        out.push({ kind: "video_externo", nome: ex.nome || "Vídeo externo", url: ex.url ?? "" });
      } else if (ex._pending && ex._file) {
        const bucket = ex.kind === "pdf" ? "materiais-pdf" : "materiais-video";
        const subfolder = ex.kind === "pdf" ? "materiais" : "aulas";
        const path = await uploadPath(bucket, ex._file, subfolder, pais);
        out.push({ kind: ex.kind, nome: ex.nome || ex._file.name, path });
      } else if (ex.path || ex.url) {
        out.push({ kind: ex.kind, nome: ex.nome, path: ex.path ?? null, url: ex.url ?? null });
      }
    }
    // Atualiza estado para descartar marcadores _pending depois de persistir
    setRows((prev) => ({ ...prev, [pais]: { ...prev[pais], materiais_extras: out.map((m) => ({ ...m, _localId: makeLocalId() })) } }));
    return out;
  };

  const addExtras = (items: ExtraItem[]) => {
    setRows((prev) => {
      const next = { ...prev, [tab]: { ...prev[tab], materiais_extras: [...(prev[tab].materiais_extras ?? []), ...items] } };
      onRowsChange?.(next);
      return next;
    });
  };
  const updateExtra = (localId: string, patch: Partial<ExtraItem>) => {
    setRows((prev) => {
      const next = { ...prev, [tab]: { ...prev[tab], materiais_extras: (prev[tab].materiais_extras ?? []).map((e) => e._localId === localId ? { ...e, ...patch } : e) } };
      onRowsChange?.(next);
      return next;
    });
  };
  const removeExtra = (localId: string) => {
    setRows((prev) => {
      const next = { ...prev, [tab]: { ...prev[tab], materiais_extras: (prev[tab].materiais_extras ?? []).filter((e) => e._localId !== localId) } };
      onRowsChange?.(next);
      return next;
    });
  };

  const [novoVideoUrl, setNovoVideoUrl] = useState("");
  const [novoVideoNome, setNovoVideoNome] = useState("");

  const onFile = async (field: keyof Row, bucket: string, subfolder: string, file: File | null) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const url = await upload(bucket, file, subfolder);
      setRows((prev) => {
        const next = { ...prev, [tab]: { ...prev[tab], [field]: url } };
        onRowsChange?.(next);
        return next;
      });
    } catch (e: any) { setMsg({ kind: "err", text: e?.message ?? "Erro ao subir arquivo" }); }
    finally { setBusy(false); }
  };

  const update = (field: keyof Row, value: string | number | boolean | null) => {
    setRows((prev) => {
      const next = { ...prev, [tab]: { ...prev[tab], [field]: value as any } };
      onRowsChange?.(next);
      return next;
    });
  };

  const salvar = async () => {
    if (!itemId) {
      setMsg({ kind: "ok", text: "Conteúdo guardado. Será salvo junto quando você clicar em Salvar no topo." });
      return;
    }
    setBusy(true); setMsg(null);
    try {
      const r = rows[tab];
      const extras = await materializeExtras(tab);
      const payload: any = {
        item_type: itemType,
        item_id: itemId,
        pais: tab,
        titulo: r.titulo || null,
        descricao: r.descricao || null,
        gratis: r.gratis,
        video_url: r.video_url || null,
        pdf_url: r.pdf_url || null,
        capa_url: r.capa_url || null,
        capa_video_url: r.capa_video_url || null,
        audio_url: r.audio_url || null,
        legenda_url: r.legenda_url || null,
        conteudo_html: r.conteudo_html || null,
        preco_centavos: r.preco_centavos > 0 ? r.preco_centavos : null,
        moeda: r.moeda || null,
        preco_label: r.preco_label || null,
        materiais_extras: extras,
      };
      const { data, error } = await supabase
        .from("content_translations")
        .upsert(payload, { onConflict: "item_type,item_id,pais" })
        .select()
        .single();
      if (error) throw error;
      setRows((prev) => ({ ...prev, [tab]: { ...prev[tab], id: (data as any).id } }));
      setMsg({ kind: "ok", text: `Tradução ${tab} salva com sucesso.` });
    } catch (e: any) { setMsg({ kind: "err", text: e?.message ?? "Erro ao salvar tradução" }); }
    finally { setBusy(false); }
  };

  const remover = async () => {
    const id = rows[tab].id;
    if (!id) { setRows((prev) => { const next = { ...prev, [tab]: empty(tab) }; onRowsChange?.(next); return next; }); return; }
    if (!(await appConfirm(`Remover a tradução ${tab} deste conteúdo?`))) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("content_translations").delete().eq("id", id);
    if (error) { setMsg({ kind: "err", text: error.message }); }
    else { setRows((prev) => { const next = { ...prev, [tab]: empty(tab) }; onRowsChange?.(next); return next; }); setMsg({ kind: "ok", text: `Tradução ${tab} removida.` }); }
    setBusy(false);
  };

  const current = rows[tab];

  return (
    <div style={{ border: `1px solid ${c.border}`, background: c.warm, padding: 14, fontFamily: sans }}>
      {!itemId && (
        <div style={{ padding: 10, border: `1px dashed ${c.border}`, background: "white", fontSize: 12, color: c.muted, marginBottom: 12 }}>
          Você pode preencher as versões em <strong>Espanhol</strong> e <strong>Inglês</strong> agora — elas serão salvas automaticamente junto com o conteúdo principal.
        </div>
      )}

      {/* Tabs de país (ocultadas quando o modal-pai já oferece abas) */}
      {!hideTabs && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {TABS.map((t) => {
            const active = t.pais === tab;
            const hasContent = t.pais === "BR" ? true : (rows[t.pais].id ? true : isFilled(rows[t.pais]));
            return (
              <button
                key={t.pais}
                type="button"
                onClick={() => { setTab(t.pais); setMsg(null); }}
                style={{
                  background: active ? c.sageDark : "white",
                  color: active ? "white" : c.ink,
                  border: `1px solid ${active ? c.sageDark : c.border}`,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontFamily: sans,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FlagMark pais={t.pais} size={18} />
                <span>{t.label}</span>
                {hasContent && t.pais !== "BR" && <span style={{ background: rows[t.pais].id ? c.ok : "#B58A2E", color: "white", fontSize: 9, padding: "1px 5px", letterSpacing: "0.08em" }}>{rows[t.pais].id ? "OK" : "RASCUNHO"}</span>}
              </button>
            );
          })}
        </div>
      )}


      {tab === "BR" ? (
        <div style={{ padding: 14, border: `1px dashed ${c.border}`, background: "white", fontSize: 13, color: c.muted }}>
          A versão <strong>PT-BR</strong> é o conteúdo padrão deste cadastro. Os campos PT (título, descrição, vídeo, PDF, capa) são preenchidos no formulário principal acima. Use as abas <strong>ES</strong> e <strong>EN</strong> para enviar as versões dubladas/traduzidas.
        </div>
      ) : (
        <div>
          <Row label={`Título (${tab})`}>
            <input value={current.titulo} onChange={(e) => update("titulo", e.target.value)} style={inp} placeholder={tab === "ES" ? "Título en español" : "Title in English"} />
          </Row>
          <Row label={`Descrição (${tab})`}>
            <textarea value={current.descricao} onChange={(e) => update("descricao", e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} />
          </Row>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignItems: "stretch" }}>
            <Row label={`Vídeo de capa (${tab}) — aparece no card`} compact>
              <input type="file" accept="video/*" onChange={(e) => onFile("capa_video_url", "materiais-capas", "capas-video", e.target.files?.[0] ?? null)} style={{ ...inp, minHeight: 42 }} />
              {current.capa_video_url && <Hint url={current.capa_video_url} />}
            </Row>
            <Row label={`Capa imagem (${tab}) — poster do card`} compact>
              <input type="file" accept="image/*" onChange={(e) => onFile("capa_url", "materiais-capas", "capas", e.target.files?.[0] ?? null)} style={{ ...inp, minHeight: 42 }} />
              {current.capa_url && <Hint url={current.capa_url} />}
            </Row>
          </div>

          <div style={{ marginTop: 12, padding: 12, background: "white", border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sageDark, fontWeight: 600, marginBottom: 6 }}>
              Conteúdo da aula ({tab}) — PDFs e vídeos
            </div>
            <p style={{ fontSize: 12, color: c.muted, margin: "0 0 10px" }}>
              Adicione quantos PDFs e vídeos quiser para esta versão. O aluno em {tab} verá esta lista — clica num PDF para ler em modal, ou num vídeo para assistir.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 4 }}>+ Adicionar PDFs</div>
                <input type="file" accept="application/pdf" multiple onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length === 0) return;
                  addExtras(files.map((f) => ({ kind: "pdf", nome: f.name.replace(/\.pdf$/i, ""), _file: f, _pending: true, _localId: makeLocalId() })));
                  e.target.value = "";
                }} style={{ ...inp, minHeight: 42 }} />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 4 }}>+ Adicionar vídeos (MP4)</div>
                <input type="file" accept="video/*" multiple onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length === 0) return;
                  addExtras(files.map((f) => ({ kind: "video_upload", nome: f.name.replace(/\.[^.]+$/, ""), _file: f, _pending: true, _localId: makeLocalId() })));
                  e.target.value = "";
                }} style={{ ...inp, minHeight: 42 }} />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, marginBottom: 10 }}>
              <input placeholder="URL do vídeo (YouTube, Vimeo…)" value={novoVideoUrl} onChange={(e) => setNovoVideoUrl(e.target.value)} style={inp} />
              <input placeholder="Nome do vídeo (opcional)" value={novoVideoNome} onChange={(e) => setNovoVideoNome(e.target.value)} style={inp} />
              <button type="button" onClick={() => {
                const u = novoVideoUrl.trim();
                if (!u) return;
                addExtras([{ kind: "video_externo", nome: novoVideoNome.trim() || "Vídeo externo", url: u, _pending: true, _localId: makeLocalId() }]);
                setNovoVideoUrl(""); setNovoVideoNome("");
              }} style={{ background: c.sageDark, color: "white", border: "none", padding: "10px 14px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: sans }}>+ URL</button>
            </div>
            {(current.materiais_extras ?? []).length === 0 ? (
              <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 12, textAlign: "center", color: c.muted, fontSize: 12 }}>
                Nenhuma mídia adicionada para {tab}. Use os botões acima para anexar PDFs ou vídeos.
              </div>
            ) : (
              <div style={{ border: `1px solid ${c.border}` }}>
                {(current.materiais_extras ?? []).map((ex, idx, arr) => (
                  <div key={ex._localId} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center", padding: "8px 10px", borderBottom: idx < arr.length - 1 ? `1px solid ${c.border}` : "none", background: c.cream }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: ex.kind === "pdf" ? "#B8923A" : c.sageDark, border: `1px solid ${ex.kind === "pdf" ? "#B8923A" : c.sageDark}`, padding: "3px 8px", fontWeight: 600 }}>
                      {ex.kind === "pdf" ? "PDF" : ex.kind === "video_externo" ? "Vídeo URL" : "Vídeo"}
                    </span>
                    <input value={ex.nome} onChange={(e) => updateExtra(ex._localId, { nome: e.target.value })} placeholder="Nome exibido" style={{ ...inp, padding: "6px 10px", fontSize: 13 }} />
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {ex._pending && <span style={{ fontSize: 10, color: c.muted, letterSpacing: "0.1em" }}>NOVO</span>}
                      <button type="button" onClick={() => removeExtra(ex._localId)} style={{ background: "transparent", border: `1px solid ${c.danger}`, color: c.danger, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 9px", cursor: "pointer", fontFamily: sans }}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignItems: "stretch", marginTop: 12 }}>
            <Row label={`Áudio (${tab}) — opcional`} compact>
              <input type="file" accept="audio/*" onChange={(e) => onFile("audio_url", "materiais-video", "audios", e.target.files?.[0] ?? null)} style={{ ...inp, minHeight: 42 }} />
              {current.audio_url && <Hint url={current.audio_url} />}
            </Row>
            <Row label={`Legenda (${tab}) — opcional`} compact>
              <input type="file" accept=".vtt,.srt,text/vtt" onChange={(e) => onFile("legenda_url", "materiais-capas", "legendas", e.target.files?.[0] ?? null)} style={{ ...inp, minHeight: 42 }} />
              {current.legenda_url && <Hint url={current.legenda_url} />}
            </Row>
          </div>

          <Row label={`HTML / Conteúdo de texto (${tab}) — opcional`}>
            <textarea value={current.conteudo_html} onChange={(e) => update("conteudo_html", e.target.value)} rows={4} style={{ ...inp, resize: "vertical", fontFamily: "ui-monospace, monospace" }} />
          </Row>

          <div style={{ background: "white", border: `1px solid ${c.border}`, padding: 12, marginTop: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sageDark, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              Preço para compradores de <FlagMark pais={tab} size={18} /> {tab === "ES" ? "Espanha" : "EUA / Inglês"}
            </div>
            <div style={{ fontSize: 12, color: c.muted, marginBottom: 10, lineHeight: 1.5 }}>
              Quando o usuário estiver com a bandeira <strong>{tab}</strong> no topo do app, ele verá esta aula com este preço e moeda. Deixe em branco para usar o preço base (PT-BR).
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <button type="button" onClick={() => update("gratis", true)} style={{ background: current.gratis === true ? c.sageDark : c.cream, color: current.gratis === true ? "white" : c.ink, border: `1px solid ${current.gratis === true ? c.sageDark : c.border}`, padding: 10, textAlign: "left", cursor: "pointer", fontFamily: sans }}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>Grátis neste país</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Mostra Assistir</div>
              </button>
              <button type="button" onClick={() => update("gratis", false)} style={{ background: current.gratis === false ? c.sageDark : c.cream, color: current.gratis === false ? "white" : c.ink, border: `1px solid ${current.gratis === false ? c.sageDark : c.border}`, padding: 10, textAlign: "left", cursor: "pointer", fontFamily: sans }}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>Pago neste país</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>Mostra Comprar</div>
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8 }}>
              <Row label={`Preço (${tab === "ES" ? "EUR" : "USD"})`}>
                <input
                  type="number" min={0} step="0.01"
                  value={current.preco_centavos ? (current.preco_centavos / 100).toFixed(2) : ""}
                  onChange={(e) => update("preco_centavos", Math.round((parseFloat(e.target.value) || 0) * 100))}
                  placeholder={tab === "ES" ? "9.90" : "9.99"}
                  style={inp}
                />
              </Row>
              <Row label="Moeda">
                <select value={current.moeda || MOEDA_PADRAO[tab]} onChange={(e) => update("moeda", e.target.value)} style={inp}>
                  <option value="BRL">BRL</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </Row>
              <Row label="Label do preço (opcional)">
                <input value={current.preco_label} onChange={(e) => update("preco_label", e.target.value)} placeholder={tab === "ES" ? "€ 9,90" : "$ 9.99"} style={inp} />
              </Row>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            {(current.id || (!itemId && isFilled(current))) && (
              <button type="button" onClick={remover} disabled={busy} style={{ background: "transparent", color: c.danger, border: `1px solid ${c.border}`, padding: "8px 14px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: sans }}>
                Limpar {tab}
              </button>
            )}
            {itemId && (
              <button type="button" onClick={salvar} disabled={busy} style={{ background: c.sageDark, color: "white", border: "none", padding: "8px 16px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: sans }}>
                {busy ? "Salvando…" : `Salvar tradução ${tab}`}
              </button>
            )}
          </div>
        </div>
      )}

      {msg && (
        <div style={{ marginTop: 10, fontSize: 12, color: msg.kind === "ok" ? c.ok : c.danger }}>
          {msg.text}
        </div>
      )}
    </div>
  );
});

export default TranslationsPanel;

const Row = ({ label, compact = false, children }: { label: string; compact?: boolean; children: React.ReactNode }) => (
  <label style={{ display: compact ? "flex" : "block", flexDirection: compact ? "column" : undefined, marginBottom: compact ? 0 : 10, minHeight: compact ? 94 : undefined, height: compact ? "100%" : undefined }}>
    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6, minHeight: compact ? 34 : undefined, display: compact ? "flex" : undefined, alignItems: compact ? "flex-end" : undefined, lineHeight: 1.2 }}>{label}</div>
    {children}
  </label>
);

const Hint = ({ url }: { url: string }) => (
  <div style={{ fontSize: 11, color: c.muted, marginTop: 4, wordBreak: "break-all" }}>Atual: {url}</div>
);
