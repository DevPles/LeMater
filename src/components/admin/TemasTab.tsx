import { useEffect, useState, type CSSProperties } from "react";
import { appConfirm } from "@/components/AppDialog";
import { useServerFn } from "@tanstack/react-start";
import { adminListCursos, adminUpsertCurso, adminDeleteCurso } from "@/lib/cursos.functions";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", danger: "#B23A48" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const inp: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "10px 12px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none" };
const btn = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 18px", border: "none", cursor: "pointer", fontFamily: sans });
const btnSm = (bg: string): CSSProperties => ({ background: bg, color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: sans });
const Field = ({ label, children }: any) => <label style={{ display: "block" }}><div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 6 }}>{label}</div>{children}</label>;

type Tema = { id: string; titulo: string; slug: string; categoria: string; ordem: number; publicado: boolean };

export default function TemasTab() {
  const listFn = useServerFn(adminListCursos);
  const upsertFn = useServerFn(adminUpsertCurso);
  const delFn = useServerFn(adminDeleteCurso);
  const [items, setItems] = useState<Tema[]>([]);
  const [edit, setEdit] = useState<Partial<Tema> | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => listFn().then((d) => setItems(d as Tema[]));
  useEffect(() => { reload(); }, []);

  const novo = () => setEdit({ titulo: "", slug: "", ordem: items.length, publicado: true });

  const salvar = async () => {
    if (!edit?.titulo || !edit.slug) { alert("Título e slug são obrigatórios"); return; }
    setBusy(true);
    try {
      await upsertFn({ data: {
        id: edit.id, titulo: edit.titulo!, slug: edit.slug!,
        categoria: edit.categoria || "geral",
        ordem: Number(edit.ordem) || 0,
        publicado: !!edit.publicado,
      } as any });
      setEdit(null); await reload();
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const remover = async (id: string) => {
    if (!(await appConfirm("Remover este tema? Aulas vinculadas ficarão sem este tema."))) return;
    await delFn({ data: { id } }); reload();
  };

  return (
    <div style={{ fontFamily: sans }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ color: c.muted, margin: 0, fontSize: 13 }}>
          Temas organizam as aulas em grupos (Concepção, Gestação, Parto…). Eles aparecem como filtros no Atlas.
        </p>
        <button onClick={novo} style={btn(c.sageDark)}>Novo tema</button>
      </div>

      <div style={{ background: "white", border: `1px solid ${c.border}` }}>
        {items.length === 0 ? (
          <div style={{ padding: 24, color: c.muted, textAlign: "center" }}>Nenhum tema ainda.</div>
        ) : items.map((t) => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr auto", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${c.border}` }}>
            <span style={{ color: c.muted }}>{t.ordem}</span>
            <strong style={{ color: c.ink }}>{t.titulo}</strong>
            <code style={{ fontSize: 12, color: c.muted }}>{t.slug}</code>
            <span style={{ fontSize: 12, color: c.muted }}>{t.categoria}{t.publicado ? "" : " · oculto"}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setEdit(t)} style={btnSm(c.sage)}>Editar</button>
              <button onClick={() => remover(t.id)} style={btnSm(c.danger)}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div onClick={() => setEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", maxWidth: 480, width: "100%", padding: 28, border: `1px solid ${c.border}` }}>
            <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, margin: "0 0 18px" }}>{edit.id ? "Editar tema" : "Novo tema"}</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Título"><input value={edit.titulo ?? ""} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} style={inp} /></Field>
              <Field label="Slug (URL)"><input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} style={inp} placeholder="gestacao" /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Categoria">
                  <input list="cat-temas" value={edit.categoria ?? ""} onChange={(e) => setEdit({ ...edit, categoria: e.target.value })} style={inp} />
                  <datalist id="cat-temas">
                    <option value="concepcao" /><option value="gestacao" /><option value="parto" /><option value="puerperio" /><option value="bebe" /><option value="geral" />
                  </datalist>
                </Field>
                <Field label="Ordem"><input type="number" value={edit.ordem ?? 0} onChange={(e) => setEdit({ ...edit, ordem: parseInt(e.target.value) || 0 })} style={inp} /></Field>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={!!edit.publicado} onChange={(e) => setEdit({ ...edit, publicado: e.target.checked })} /> Visível no Atlas
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
              <button onClick={() => setEdit(null)} style={btn(c.muted)}>Cancelar</button>
              <button onClick={salvar} disabled={busy} style={{ ...btn(c.sageDark), opacity: busy ? 0.6 : 1 }}>{busy ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
