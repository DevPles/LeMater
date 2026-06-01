import { useEffect, useState, type CSSProperties } from "react";
import { appConfirm } from "@/components/AppDialog";
import { useServerFn } from "@tanstack/react-start";
import { adminListAulas, adminDeleteAula } from "@/lib/cursos.functions";
import AulaEditor, { type AulaDraft } from "./AulaEditor";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48" };
const sans = "'DM Sans', sans-serif";

const btn = (bg: string, color = "white"): CSSProperties => ({ background: bg, color, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 18px", border: bg === "transparent" ? `1px solid ${c.border}` : "none", cursor: "pointer", fontFamily: sans });

type AulaRow = {
  id: string; slug: string | null; titulo: string; descricao: string | null;
  tipo: "video" | "pdf" | "texto"; duracao_min: number; capa_url: string | null; capa_video_url: string | null;
  publicado: boolean; gratis: boolean; preco_label: string | null; preco_centavos: number;
  moeda: string; link_compra_externo: string | null; previa_gratis: boolean;
  video_url?: string | null; pdf_url?: string | null; conteudo_html?: string | null;
  materiais_extras?: { kind: "pdf" | "video_upload" | "video_externo"; nome: string; path?: string | null; url?: string | null }[];
  temas: { id: string; titulo: string }[];
};


export default function AulasTab({ reloadSignal, temaFilter }: { reloadSignal?: number; temaFilter?: string | null }) {
  const fnList = useServerFn(adminListAulas);
  const fnDelete = useServerFn(adminDeleteAula);

  const [aulas, setAulas] = useState<AulaRow[] | null>(null);
  const [editing, setEditing] = useState<AulaDraft | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    setErr(null);
    try { setAulas(await fnList() as AulaRow[]); }
    catch (e: any) { setErr(e?.message ?? "Erro"); }
  };
  useEffect(() => { reload(); }, [reloadSignal]);

  const editar = (a: AulaRow) => setEditing({ ...a, temas: a.temas.map((t) => t.id) });

  const remover = async (id: string) => {
    if (!(await appConfirm("Remover esta aula? A ação não pode ser desfeita."))) return;
    await fnDelete({ data: { id } });
    await reload();
  };

  return (
    <div style={{ fontFamily: sans }}>
      <p style={{ color: c.muted, margin: "0 0 18px", fontSize: 13 }}>
        Aulas vivem aqui. Para criar uma nova, use o botão <strong>Novo conteúdo</strong> no topo.
      </p>

      {err && <p style={{ color: c.danger }}>{err}</p>}
      {(() => {
        const filtered = aulas?.filter((a) => !temaFilter || a.temas.some((t) => t.id === temaFilter));
        if (!filtered) return <p style={{ color: c.muted }}>Carregando…</p>;
        if (filtered.length === 0) return (
          <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 40, textAlign: "center", color: c.muted }}>
            {temaFilter ? "Nenhuma aula neste tema ainda." : <>Nenhuma aula ainda. Clique em <strong>Novo conteúdo</strong> no topo para começar.</>}
          </div>
        );
        return (
          <div style={{ border: `1px solid ${c.border}`, background: "white" }}>
            {filtered.map((a) => (
              <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: 16, borderBottom: `1px solid ${c.border}` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ color: c.ink }}>{a.titulo}</strong>
                    <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: a.publicado ? c.sageDark : c.muted, border: `1px solid ${a.publicado ? c.sageDark : c.border}`, padding: "2px 8px" }}>
                      {a.publicado ? "Publicada" : "Rascunho"}
                    </span>
                    <span style={{ fontSize: 11, color: c.muted }}>
                      {a.gratis ? "Grátis" : (a.preco_label || (a.preco_centavos ? `${a.moeda} ${(a.preco_centavos / 100).toFixed(2)}` : "—"))}
                    </span>
                    {a.capa_video_url && <span style={{ fontSize: 10, color: c.sage, textTransform: "uppercase", letterSpacing: "0.1em" }}>vídeo de capa</span>}
                  </div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 6 }}>
                    {a.temas.length ? a.temas.map((t) => t.titulo).join(" · ") : <em>sem tema</em>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => editar(a)} style={btn("transparent", c.ink)}>Editar</button>
                  <button onClick={() => remover(a.id)} style={btn("transparent", c.danger)}>Remover</button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}


      {editing && (
        <AulaEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}
