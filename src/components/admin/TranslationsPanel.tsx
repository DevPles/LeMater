import { forwardRef, useEffect, useImperativeHandle, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ContentItemType } from "@/hooks/useTranslatedContent";
import type { Pais } from "@/lib/translate.context";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48", ok: "#2E7D32" };
const sans = "'DM Sans', sans-serif";
const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };

const TABS: { pais: Pais; flag: string; label: string }[] = [
  { pais: "BR", flag: "🇧🇷", label: "Português (PT)" },
  { pais: "ES", flag: "🇪🇸", label: "Español (ES)" },
  { pais: "US", flag: "🇺🇸", label: "English (EN)" },
];

type Row = {
  id?: string;
  titulo: string;
  descricao: string;
  video_url: string;
  pdf_url: string;
  capa_url: string;
  audio_url: string;
  legenda_url: string;
  conteudo_html: string;
};

const empty = (): Row => ({ id: undefined, titulo: "", descricao: "", video_url: "", pdf_url: "", capa_url: "", audio_url: "", legenda_url: "", conteudo_html: "" });

const isFilled = (r: Row) =>
  !!(r.titulo || r.descricao || r.video_url || r.pdf_url || r.capa_url || r.audio_url || r.legenda_url || r.conteudo_html);

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
}>(function TranslationsPanel({ itemType, itemId, lockedPais, hideTabs }, ref) {
  const [tab, setTab] = useState<Pais>(lockedPais ?? "ES");
  useEffect(() => { if (lockedPais) setTab(lockedPais); }, [lockedPais]);

  const [rows, setRows] = useState<Record<Pais, Row>>({ BR: empty(), ES: empty(), US: empty() });
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
        const next: Record<Pais, Row> = { BR: empty(), ES: empty(), US: empty() };
        (data as any[] | null)?.forEach((t) => {
          next[t.pais as Pais] = {
            id: t.id,
            titulo: t.titulo ?? "",
            descricao: t.descricao ?? "",
            video_url: t.video_url ?? "",
            pdf_url: t.pdf_url ?? "",
            capa_url: t.capa_url ?? "",
            audio_url: t.audio_url ?? "",
            legenda_url: t.legenda_url ?? "",
            conteudo_html: t.conteudo_html ?? "",
          };
        });
        setRows(next);
      });
  }, [itemType, itemId]);

  // Expor flush p/ o editor pai persistir após criar o item
  useImperativeHandle(ref, () => ({
    hasPending: () => isFilled(rows.ES) || isFilled(rows.US),
    flush: async (newId: string) => {
      for (const pais of ["ES", "US"] as Pais[]) {
        const r = rows[pais];
        if (!isFilled(r)) continue;
        const payload = {
          item_type: itemType,
          item_id: newId,
          pais,
          titulo: r.titulo || null,
          descricao: r.descricao || null,
          video_url: r.video_url || null,
          pdf_url: r.pdf_url || null,
          capa_url: r.capa_url || null,
          audio_url: r.audio_url || null,
          legenda_url: r.legenda_url || null,
          conteudo_html: r.conteudo_html || null,
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

  const onFile = async (field: keyof Row, bucket: string, subfolder: string, file: File | null) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const url = await upload(bucket, file, subfolder);
      setRows((prev) => ({ ...prev, [tab]: { ...prev[tab], [field]: url } }));
    } catch (e: any) { setMsg({ kind: "err", text: e?.message ?? "Erro ao subir arquivo" }); }
    finally { setBusy(false); }
  };

  const update = (field: keyof Row, value: string) => {
    setRows((prev) => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));
  };

  const salvar = async () => {
    if (!itemId) {
      setMsg({ kind: "ok", text: "Conteúdo guardado. Será salvo junto quando você clicar em Salvar no topo." });
      return;
    }
    setBusy(true); setMsg(null);
    try {
      const r = rows[tab];
      const payload = {
        item_type: itemType,
        item_id: itemId,
        pais: tab,
        titulo: r.titulo || null,
        descricao: r.descricao || null,
        video_url: r.video_url || null,
        pdf_url: r.pdf_url || null,
        capa_url: r.capa_url || null,
        audio_url: r.audio_url || null,
        legenda_url: r.legenda_url || null,
        conteudo_html: r.conteudo_html || null,
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
    if (!id) { setRows((prev) => ({ ...prev, [tab]: empty() })); return; }
    if (!confirm(`Remover a tradução ${tab} deste conteúdo?`)) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("content_translations").delete().eq("id", id);
    if (error) { setMsg({ kind: "err", text: error.message }); }
    else { setRows((prev) => ({ ...prev, [tab]: empty() })); setMsg({ kind: "ok", text: `Tradução ${tab} removida.` }); }
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

      {/* Tabs de país */}
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
              <span style={{ fontSize: 16 }}>{t.flag}</span>
              <span>{t.label}</span>
              {hasContent && t.pais !== "BR" && <span style={{ background: rows[t.pais].id ? c.ok : "#B58A2E", color: "white", fontSize: 9, padding: "1px 5px", letterSpacing: "0.08em" }}>{rows[t.pais].id ? "OK" : "RASCUNHO"}</span>}
            </button>
          );
        })}
      </div>

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

          <Row label={`Vídeo dublado (${tab}) — arquivo`}>
            <input type="file" accept="video/*" onChange={(e) => onFile("video_url", "materiais-video", "aulas", e.target.files?.[0] ?? null)} style={inp} />
            {current.video_url && <Hint url={current.video_url} />}
          </Row>
          <Row label={`Vídeo (${tab}) — OU URL externa (YouTube/Vimeo)`}>
            <input value={current.video_url.startsWith("http") ? current.video_url : ""} onChange={(e) => update("video_url", e.target.value)} placeholder="https://..." style={inp} />
          </Row>

          <Row label={`PDF / Ebook (${tab})`}>
            <input type="file" accept="application/pdf" onChange={(e) => onFile("pdf_url", "materiais-pdf", "materiais", e.target.files?.[0] ?? null)} style={inp} />
            {current.pdf_url && <Hint url={current.pdf_url} />}
          </Row>

          <Row label={`Capa (${tab}) — opcional`}>
            <input type="file" accept="image/*" onChange={(e) => onFile("capa_url", "materiais-capas", "capas", e.target.files?.[0] ?? null)} style={inp} />
            {current.capa_url && <Hint url={current.capa_url} />}
          </Row>

          <Row label={`Áudio (${tab}) — opcional`}>
            <input type="file" accept="audio/*" onChange={(e) => onFile("audio_url", "materiais-video", "audios", e.target.files?.[0] ?? null)} style={inp} />
            {current.audio_url && <Hint url={current.audio_url} />}
          </Row>

          <Row label={`Legenda (${tab}) — .vtt/.srt (opcional)`}>
            <input type="file" accept=".vtt,.srt,text/vtt" onChange={(e) => onFile("legenda_url", "materiais-capas", "legendas", e.target.files?.[0] ?? null)} style={inp} />
            {current.legenda_url && <Hint url={current.legenda_url} />}
          </Row>

          <Row label={`HTML / Conteúdo de texto (${tab}) — opcional`}>
            <textarea value={current.conteudo_html} onChange={(e) => update("conteudo_html", e.target.value)} rows={4} style={{ ...inp, resize: "vertical", fontFamily: "ui-monospace, monospace" }} />
          </Row>

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

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: "block", marginBottom: 10 }}>
    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>
    {children}
  </label>
);

const Hint = ({ url }: { url: string }) => (
  <div style={{ fontSize: 11, color: c.muted, marginTop: 4, wordBreak: "break-all" }}>Atual: {url}</div>
);
