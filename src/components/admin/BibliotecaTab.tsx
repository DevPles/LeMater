import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listModules, upsertModule, deleteModule,
  listLessons, upsertLesson, deleteLesson,
  listEntitlements, grantEntitlement, revokeEntitlement,
} from "@/lib/biblioteca.functions";

const navy = "#1a1557";
const gold = "#f0c040";
const cream = "#faf8f3";
const border = "#e8e3d4";
const muted = "#6b6883";
const serif = "'Playfair Display', serif";
const sans = "'DM Sans', sans-serif";

const card: CSSProperties = { background: "#fff", border: `1px solid ${border}`, borderRadius: 14, padding: 18 };
const inp: CSSProperties = { width: "100%", padding: "10px 12px", border: `1px solid ${border}`, borderRadius: 10, font: `13px ${sans}`, background: "#fff" };
const lbl: CSSProperties = { font: `11px ${sans}`, textTransform: "uppercase", letterSpacing: 1, color: muted, marginBottom: 4, display: "block" };
const btn = (variant: "primary" | "ghost" | "danger" = "primary"): CSSProperties => ({
  padding: "10px 16px", borderRadius: 10, font: `600 12px ${sans}`, letterSpacing: 0.6, textTransform: "uppercase", cursor: "pointer",
  background: variant === "primary" ? navy : variant === "danger" ? "#fff" : "transparent",
  color: variant === "primary" ? "#fff" : variant === "danger" ? "#b23a48" : navy,
  border: variant === "primary" ? `1px solid ${navy}` : variant === "danger" ? `1px solid #b23a48` : `1px solid ${border}`,
});

type SubTab = "modules" | "lessons" | "entitlements";

type ModuleRow = Awaited<ReturnType<typeof listModules>>[number];
type LessonRow = Awaited<ReturnType<typeof listLessons>>[number];
type EntRow = Awaited<ReturnType<typeof listEntitlements>>[number];

export default function BibliotecaTab() {
  const [sub, setSub] = useState<SubTab>("modules");
  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ font: `600 28px/1.1 ${serif}`, color: navy, margin: 0 }}>Biblioteca Modular</h2>
          <p style={{ font: `13px ${sans}`, color: muted, margin: "6px 0 0" }}>
            Ecossistema de aulas, módulos e acessos. Cada aula é um produto independente; módulos agrupam por jornada emocional.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: `1px solid ${border}` }}>
        {([
          { id: "modules", label: "Módulos" },
          { id: "lessons", label: "Aulas" },
          { id: "entitlements", label: "Acessos liberados" },
        ] as { id: SubTab; label: string }[]).map((t) => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            background: "transparent", border: 0, padding: "10px 14px", cursor: "pointer",
            font: `600 12px ${sans}`, textTransform: "uppercase", letterSpacing: 1,
            color: sub === t.id ? navy : muted,
            borderBottom: sub === t.id ? `2px solid ${gold}` : "2px solid transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {sub === "modules" && <ModulesSection />}
      {sub === "lessons" && <LessonsSection />}
      {sub === "entitlements" && <EntitlementsSection />}
    </div>
  );
}

// =================== MÓDULOS ===================
function ModulesSection() {
  const list = useServerFn(listModules);
  const save = useServerFn(upsertModule);
  const remove = useServerFn(deleteModule);
  const [rows, setRows] = useState<ModuleRow[]>([]);
  const [editing, setEditing] = useState<Partial<ModuleRow> | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => { setLoading(true); try { setRows(await list({} as never)); } finally { setLoading(false); } };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ font: `600 18px ${serif}`, color: navy, margin: 0 }}>{rows.length} módulos</h3>
          <button style={btn("primary")} onClick={() => setEditing({ title: "", visibility: "public", active: true, order: rows.length })}>
            Novo módulo
          </button>
        </div>
        {loading && <p style={{ font: `13px ${sans}`, color: muted }}>Carregando…</p>}
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: `1px solid ${border}`, borderRadius: 10, background: cream }}>
              <div style={{ width: 6, height: 40, borderRadius: 4, background: m.color || gold }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: `600 15px ${serif}`, color: navy }}>{m.title}</div>
                <div style={{ font: `12px ${sans}`, color: muted }}>
                  {m.subtitle || m.emotional_context || "—"} · /{m.slug} · {m.visibility} {m.active ? "" : "· inativo"}
                </div>
              </div>
              <button style={btn("ghost")} onClick={() => setEditing(m)}>Editar</button>
              <button style={btn("danger")} onClick={async () => {
                if (!confirm(`Excluir módulo "${m.title}"?`)) return;
                await remove({ data: { id: m.id } }); await refresh();
              }}>Excluir</button>
            </div>
          ))}
          {!loading && !rows.length && <p style={{ font: `13px ${sans}`, color: muted }}>Nenhum módulo ainda. Crie o primeiro.</p>}
        </div>
      </div>

      <div style={card}>
        <h3 style={{ font: `600 18px ${serif}`, color: navy, margin: "0 0 14px" }}>
          {editing?.id ? "Editar módulo" : editing ? "Novo módulo" : "Detalhes"}
        </h3>
        {!editing && <p style={{ font: `13px ${sans}`, color: muted }}>Selecione um módulo ou clique em "Novo módulo".</p>}
        {editing && (
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="Título"><input style={inp} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Subtítulo"><input style={inp} value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></Field>
            <Field label="Contexto emocional"><textarea style={{ ...inp, minHeight: 80 }} value={editing.emotional_context ?? ""} onChange={(e) => setEditing({ ...editing, emotional_context: e.target.value })} /></Field>
            <Field label="Descrição"><textarea style={{ ...inp, minHeight: 100 }} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Capa (URL)"><input style={inp} value={editing.cover_image ?? ""} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} /></Field>
              <Field label="Vídeo de capa (URL)"><input style={inp} value={editing.cover_video ?? ""} onChange={(e) => setEditing({ ...editing, cover_video: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="Cor"><input type="color" style={{ ...inp, padding: 4, height: 40 }} value={editing.color ?? "#1a1557"} onChange={(e) => setEditing({ ...editing, color: e.target.value })} /></Field>
              <Field label="Ordem"><input style={inp} type="number" value={editing.order ?? 0} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} /></Field>
              <Field label="Visibilidade">
                <select style={inp} value={editing.visibility ?? "public"} onChange={(e) => setEditing({ ...editing, visibility: e.target.value as "public" | "premium" | "hidden" })}>
                  <option value="public">Pública</option>
                  <option value="premium">Premium</option>
                  <option value="hidden">Oculta</option>
                </select>
              </Field>
            </div>
            <label style={{ font: `13px ${sans}`, color: navy, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Ativo
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={btn("primary")} onClick={async () => {
                try {
                  await save({ data: {
                    id: editing.id ?? null,
                    slug: editing.slug ?? null,
                    title: editing.title || "Sem título",
                    subtitle: editing.subtitle ?? null,
                    description: editing.description ?? null,
                    emotional_context: editing.emotional_context ?? null,
                    cover_image: editing.cover_image ?? null,
                    cover_video: editing.cover_video ?? null,
                    color: editing.color ?? null,
                    order: editing.order ?? 0,
                    visibility: (editing.visibility as "public" | "premium" | "hidden") ?? "public",
                    active: editing.active ?? true,
                    seo_title: editing.seo_title ?? null,
                    seo_description: editing.seo_description ?? null,
                  } });
                  setEditing(null); await refresh();
                } catch (err) { alert((err as Error).message); }
              }}>Salvar</button>
              <button style={btn("ghost")} onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== AULAS ===================
function LessonsSection() {
  const list = useServerFn(listLessons);
  const listMods = useServerFn(listModules);
  const save = useServerFn(upsertLesson);
  const remove = useServerFn(deleteLesson);

  const [rows, setRows] = useState<LessonRow[]>([]);
  const [mods, setMods] = useState<ModuleRow[]>([]);
  const [editing, setEditing] = useState<Partial<LessonRow & { module_ids: string[] }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const refresh = async () => {
    setLoading(true);
    try { const [l, m] = await Promise.all([list({} as never), listMods({} as never)]); setRows(l); setMods(m); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() =>
    rows.filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()) || (r.tags ?? []).some((t) => t.includes(q.toLowerCase()))),
    [rows, q]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 460px", gap: 16 }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
          <h3 style={{ font: `600 18px ${serif}`, color: navy, margin: 0 }}>{rows.length} aulas</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, width: 200 }} placeholder="Buscar aula ou tag…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button style={btn("primary")} onClick={() => setEditing({
              title: "", visibility: "public", active: true, free_or_paid: "paid",
              individual_price_centavos: 0, currency: "BRL", difficulty: "iniciante",
              benefits: [], objectives: [], tags: [], module_ids: [], preview_enabled: false,
              duration_sec: 0,
            })}>Nova aula</button>
          </div>
        </div>
        {loading && <p style={{ font: `13px ${sans}`, color: muted }}>Carregando…</p>}
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map((l) => (
            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto auto", alignItems: "center", gap: 12, padding: 12, border: `1px solid ${border}`, borderRadius: 10, background: cream }}>
              <div style={{ width: 60, height: 40, borderRadius: 6, background: l.thumbnail ? `url(${l.thumbnail}) center/cover` : `linear-gradient(135deg, ${navy}, ${gold})` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: `600 14px ${serif}`, color: navy }}>{l.title}</div>
                <div style={{ font: `11px ${sans}`, color: muted }}>
                  {l.free_or_paid === "free" ? "Grátis" : `R$ ${(l.individual_price_centavos / 100).toFixed(2)}`}
                  {" · "}{Math.round((l.duration_sec || 0) / 60)} min
                  {" · "}{(l.module_ids ?? []).length} módulo(s)
                  {l.active ? "" : " · inativa"}
                </div>
              </div>
              <button style={btn("ghost")} onClick={() => setEditing({ ...l, module_ids: l.module_ids ?? [] })}>Editar</button>
              <button style={btn("danger")} onClick={async () => {
                if (!confirm(`Excluir aula "${l.title}"?`)) return;
                await remove({ data: { id: l.id } }); await refresh();
              }}>Excluir</button>
            </div>
          ))}
          {!loading && !filtered.length && <p style={{ font: `13px ${sans}`, color: muted }}>Nenhuma aula encontrada.</p>}
        </div>
      </div>

      <div style={card}>
        <h3 style={{ font: `600 18px ${serif}`, color: navy, margin: "0 0 14px" }}>
          {editing?.id ? "Editar aula" : editing ? "Nova aula" : "Detalhes da aula"}
        </h3>
        {!editing && <p style={{ font: `13px ${sans}`, color: muted }}>Selecione uma aula ou clique em "Nova aula".</p>}
        {editing && (
          <div style={{ display: "grid", gap: 10, maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
            <Field label="Título"><input style={inp} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Subtítulo"><input style={inp} value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></Field>
            <Field label="Descrição curta"><textarea style={{ ...inp, minHeight: 60 }} value={editing.short_description ?? ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} /></Field>
            <Field label="Descrição completa"><textarea style={{ ...inp, minHeight: 100 }} value={editing.full_description ?? ""} onChange={(e) => setEditing({ ...editing, full_description: e.target.value })} /></Field>
            <Field label="Transformação prometida"><textarea style={{ ...inp, minHeight: 80 }} value={editing.transformation ?? ""} onChange={(e) => setEditing({ ...editing, transformation: e.target.value })} /></Field>

            <Field label="Você aprenderá (1 por linha)">
              <textarea style={{ ...inp, minHeight: 80 }} value={((editing.objectives as string[] | undefined) ?? []).join("\n")}
                onChange={(e) => setEditing({ ...editing, objectives: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Como isso ajuda você (1 por linha)">
              <textarea style={{ ...inp, minHeight: 80 }} value={((editing.benefits as string[] | undefined) ?? []).join("\n")}
                onChange={(e) => setEditing({ ...editing, benefits: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Thumbnail (URL)"><input style={inp} value={editing.thumbnail ?? ""} onChange={(e) => setEditing({ ...editing, thumbnail: e.target.value })} /></Field>
              <Field label="Capa em vídeo (URL)"><input style={inp} value={editing.cover_video_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_video_url: e.target.value })} /></Field>
            </div>
            <Field label="Trailer (URL)"><input style={inp} value={editing.trailer_url ?? ""} onChange={(e) => setEditing({ ...editing, trailer_url: e.target.value })} /></Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="Duração (s)"><input style={inp} type="number" value={editing.duration_sec ?? 0} onChange={(e) => setEditing({ ...editing, duration_sec: Number(e.target.value) })} /></Field>
              <Field label="Nível">
                <select style={inp} value={editing.difficulty ?? "iniciante"} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </Field>
              <Field label="Visibilidade">
                <select style={inp} value={editing.visibility ?? "public"} onChange={(e) => setEditing({ ...editing, visibility: e.target.value as "public" | "premium" | "hidden" })}>
                  <option value="public">Pública</option>
                  <option value="premium">Premium</option>
                  <option value="hidden">Oculta</option>
                </select>
              </Field>
            </div>

            <Field label="Tags (separadas por vírgula)">
              <input style={inp} value={(editing.tags ?? []).join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) })} />
            </Field>

            <Field label="Módulos vinculados">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {mods.map((m) => {
                  const selected = (editing.module_ids ?? []).includes(m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => setEditing({
                      ...editing,
                      module_ids: selected ? (editing.module_ids ?? []).filter(x => x !== m.id) : [...(editing.module_ids ?? []), m.id],
                    })} style={{
                      padding: "6px 10px", borderRadius: 999, font: `12px ${sans}`, cursor: "pointer",
                      background: selected ? navy : "#fff", color: selected ? "#fff" : navy,
                      border: `1px solid ${selected ? navy : border}`,
                    }}>{m.title}</button>
                  );
                })}
                {!mods.length && <span style={{ font: `12px ${sans}`, color: muted }}>Crie módulos primeiro.</span>}
              </div>
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="Tipo">
                <select style={inp} value={editing.free_or_paid ?? "paid"} onChange={(e) => setEditing({ ...editing, free_or_paid: e.target.value as "free" | "paid" })}>
                  <option value="paid">Paga</option>
                  <option value="free">Grátis</option>
                </select>
              </Field>
              <Field label="Preço (centavos)"><input style={inp} type="number" value={editing.individual_price_centavos ?? 0} onChange={(e) => setEditing({ ...editing, individual_price_centavos: Number(e.target.value) })} /></Field>
              <Field label="Moeda">
                <select style={inp} value={editing.currency ?? "BRL"} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                  <option>BRL</option><option>USD</option><option>EUR</option>
                </select>
              </Field>
            </div>

            <label style={{ font: `13px ${sans}`, color: navy, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={editing.preview_enabled ?? false} onChange={(e) => setEditing({ ...editing, preview_enabled: e.target.checked })} />
              Permitir prévia gratuita
            </label>
            <label style={{ font: `13px ${sans}`, color: navy, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Ativa
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 8, position: "sticky", bottom: 0, background: "#fff", paddingTop: 8 }}>
              <button style={btn("primary")} onClick={async () => {
                try {
                  await save({ data: {
                    id: editing.id ?? null,
                    slug: editing.slug ?? null,
                    title: editing.title || "Sem título",
                    subtitle: editing.subtitle ?? null,
                    short_description: editing.short_description ?? null,
                    full_description: editing.full_description ?? null,
                    transformation: editing.transformation ?? null,
                    benefits: editing.benefits ?? [],
                    objectives: editing.objectives ?? [],
                    audience: editing.audience ?? null,
                    thumbnail: editing.thumbnail ?? null,
                    cover_image: editing.cover_image ?? null,
                    cover_video_url: editing.cover_video_url ?? null,
                    trailer_url: editing.trailer_url ?? null,
                    duration_sec: editing.duration_sec ?? 0,
                    difficulty: editing.difficulty ?? "iniciante",
                    tags: editing.tags ?? [],
                    visibility: (editing.visibility as "public" | "premium" | "hidden") ?? "public",
                    free_or_paid: (editing.free_or_paid as "free" | "paid") ?? "paid",
                    individual_price_centavos: editing.individual_price_centavos ?? 0,
                    currency: editing.currency ?? "BRL",
                    preview_enabled: editing.preview_enabled ?? false,
                    active: editing.active ?? true,
                    seo_title: editing.seo_title ?? null,
                    seo_description: editing.seo_description ?? null,
                    module_ids: editing.module_ids ?? [],
                  } });
                  setEditing(null); await refresh();
                } catch (err) { alert((err as Error).message); }
              }}>Salvar aula</button>
              <button style={btn("ghost")} onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== ENTITLEMENTS ===================
function EntitlementsSection() {
  const list = useServerFn(listEntitlements);
  const grant = useServerFn(grantEntitlement);
  const revoke = useServerFn(revokeEntitlement);
  const [rows, setRows] = useState<EntRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [itemType, setItemType] = useState<"lesson" | "module" | "pathway" | "bundle" | "all_access">("all_access");
  const [itemId, setItemId] = useState("");
  const [notes, setNotes] = useState("");

  const refresh = async () => { setLoading(true); try { setRows(await list({} as never)); } finally { setLoading(false); } };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
      <div style={card}>
        <h3 style={{ font: `600 18px ${serif}`, color: navy, margin: "0 0 12px" }}>Acessos liberados ({rows.length})</h3>
        {loading && <p style={{ font: `13px ${sans}`, color: muted }}>Carregando…</p>}
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((e) => (
            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, padding: 12, border: `1px solid ${border}`, borderRadius: 10, background: cream }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: `600 13px ${sans}`, color: navy }}>{e.item_type}{e.item_id ? ` · ${e.item_id.slice(0, 8)}` : ""}</div>
                <div style={{ font: `11px ${sans}`, color: muted }}>
                  user {e.user_id.slice(0, 8)} · {e.source} · {new Date(e.granted_at).toLocaleDateString()}
                  {e.active ? "" : " · revogado"}
                </div>
              </div>
              {e.active && <button style={btn("danger")} onClick={async () => {
                await revoke({ data: { id: e.id } }); await refresh();
              }}>Revogar</button>}
            </div>
          ))}
          {!loading && !rows.length && <p style={{ font: `13px ${sans}`, color: muted }}>Nenhum acesso liberado ainda.</p>}
        </div>
      </div>
      <div style={card}>
        <h3 style={{ font: `600 18px ${serif}`, color: navy, margin: "0 0 14px" }}>Liberar acesso manual</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <Field label="Email da usuária"><input style={inp} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuaria@exemplo.com" /></Field>
          <Field label="Tipo">
            <select style={inp} value={itemType} onChange={(e) => setItemType(e.target.value as typeof itemType)}>
              <option value="all_access">Acesso total</option>
              <option value="lesson">Aula</option>
              <option value="module">Módulo</option>
              <option value="pathway">Trilha</option>
              <option value="bundle">Pacote</option>
            </select>
          </Field>
          {itemType !== "all_access" && (
            <Field label="ID do item"><input style={inp} value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="UUID" /></Field>
          )}
          <Field label="Observação"><textarea style={{ ...inp, minHeight: 60 }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <button style={btn("primary")} onClick={async () => {
            try {
              await grant({ data: {
                user_email: email,
                item_type: itemType,
                item_id: itemType === "all_access" ? null : (itemId || null),
                notes: notes || null,
              } });
              setEmail(""); setItemId(""); setNotes("");
              await refresh();
            } catch (err) { alert((err as Error).message); }
          }}>Liberar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span style={lbl}>{label}</span>{children}</div>;
}
