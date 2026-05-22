import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listVendas, listCupons, saveCupom, deleteCupom, listCursosBasic } from "@/lib/vendas.functions";

type Venda = { id: string; processado_em: string; email_comprador: string; nome_comprador: string | null; produto: string | null; evento: string; status: string; transaction_id: string | null; curso_id: string | null; curso_titulo: string | null; cupom_codigo: string | null; valor_centavos: number | null; plataforma: string | null };
type Cupom = { id: string; codigo: string; descricao: string | null; desconto_pct: number | null; desconto_centavos: number | null; curso_id: string | null; valido_de: string | null; valido_ate: string | null; max_usos: number | null; usos: number; ativo: boolean; created_at: string };
type CursoMin = { id: string; titulo: string; preco_centavos: number; produto_externo_id: string | null };

const moeda = (c: number | null | undefined) => c == null ? "—" : `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
const dataFmt = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";

export function VendasTab() {
  const [aba, setAba] = useState<"vendas" | "cupons">("vendas");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[#1a1557]/10">
        {[["vendas", "Vendas"], ["cupons", "Cupons"]].map(([k, l]) => (
          <button key={k} onClick={() => setAba(k as any)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${aba === k ? "text-[#1a1557] border-b-2 border-[#f0c040]" : "text-[#1a1557]/50 hover:text-[#1a1557]"}`}>
            {l}
          </button>
        ))}
      </div>
      {aba === "vendas" ? <VendasView /> : <CuponsView />}
    </div>
  );
}

function VendasView() {
  const fn = useServerFn(listVendas);
  const [data, setData] = useState<{ compras: Venda[]; resumo: { total: number; aprovadas: number; receita_centavos: number } } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fn().then(setData).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p className="text-[#1a1557]/60">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card label="Total de eventos" value={String(data.resumo.total)} />
        <Card label="Vendas aprovadas" value={String(data.resumo.aprovadas)} />
        <Card label="Receita aprovada" value={moeda(data.resumo.receita_centavos)} />
      </div>

      <div className="bg-white rounded-lg border border-[#1a1557]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#faf8f3] text-[#1a1557] text-xs uppercase">
              <tr>
                {["Data", "Plataforma", "Comprador", "Produto/Curso", "Cupom", "Valor", "Status"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.compras.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-[#1a1557]/50">Nenhuma compra registrada ainda.</td></tr>}
              {data.compras.map((c) => (
                <tr key={c.id} className="border-t border-[#1a1557]/5">
                  <td className="px-3 py-2 text-[#1a1557]/70">{dataFmt(c.processado_em)}</td>
                  <td className="px-3 py-2 uppercase text-xs">{c.plataforma ?? "—"}</td>
                  <td className="px-3 py-2"><div className="font-medium text-[#1a1557]">{c.nome_comprador ?? "—"}</div><div className="text-xs text-[#1a1557]/60">{c.email_comprador}</div></td>
                  <td className="px-3 py-2">{c.curso_titulo ?? c.produto ?? "Passe completo"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{c.cupom_codigo ?? "—"}</td>
                  <td className="px-3 py-2">{moeda(c.valor_centavos)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.status === "ativo" ? "bg-green-100 text-green-800" : c.status === "cancelado" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
                      {c.evento}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#1a1557]/10 p-4">
      <div className="text-[10px] uppercase tracking-widest text-[#1a1557]/60 font-semibold">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[#1a1557]" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
    </div>
  );
}

function CuponsView() {
  const fnList = useServerFn(listCupons);
  const fnCursos = useServerFn(listCursosBasic);
  const fnDel = useServerFn(deleteCupom);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [cursos, setCursos] = useState<CursoMin[]>([]);
  const [edit, setEdit] = useState<Partial<Cupom> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = () => Promise.all([fnList(), fnCursos()]).then(([a, b]) => { setCupons(a.cupons as Cupom[]); setCursos(b.cursos as CursoMin[]); }).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, []);

  const remover = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    await fnDel({ data: { id } });
    reload();
  };

  const cursoNome = (id: string | null) => id ? cursos.find((c) => c.id === id)?.titulo ?? "—" : "Todos os cursos";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#1a1557]" style={{ fontFamily: "'Playfair Display', serif" }}>Cupons de desconto</h3>
        <button onClick={() => setEdit({ codigo: "", ativo: true })} className="bg-[#f0c040] hover:bg-[#d9aa30] text-[#1a1557] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg">Novo cupom</button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="bg-white rounded-lg border border-[#1a1557]/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#faf8f3] text-[#1a1557] text-xs uppercase">
            <tr>{["Código", "Desconto", "Curso", "Validade", "Usos", "Ativo", ""].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {cupons.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-[#1a1557]/50">Nenhum cupom criado.</td></tr>}
            {cupons.map((c) => (
              <tr key={c.id} className="border-t border-[#1a1557]/5">
                <td className="px-3 py-2 font-mono font-bold text-[#1a1557]">{c.codigo}</td>
                <td className="px-3 py-2">{c.desconto_pct != null ? `${c.desconto_pct}%` : moeda(c.desconto_centavos)}</td>
                <td className="px-3 py-2 text-[#1a1557]/70">{cursoNome(c.curso_id)}</td>
                <td className="px-3 py-2 text-xs text-[#1a1557]/70">{c.valido_ate ? `até ${new Date(c.valido_ate).toLocaleDateString("pt-BR")}` : "sem prazo"}</td>
                <td className="px-3 py-2">{c.usos}{c.max_usos ? ` / ${c.max_usos}` : ""}</td>
                <td className="px-3 py-2">{c.ativo ? "Sim" : "Não"}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button onClick={() => setEdit(c)} className="text-xs text-[#1a1557] underline">Editar</button>
                  <button onClick={() => remover(c.id)} className="text-xs text-red-600 underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && <CupomModal cupom={edit} cursos={cursos} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </div>
  );
}

function CupomModal({ cupom, cursos, onClose, onSaved }: { cupom: Partial<Cupom>; cursos: CursoMin[]; onClose: () => void; onSaved: () => void }) {
  const fnSave = useServerFn(saveCupom);
  const [form, setForm] = useState<Partial<Cupom>>(cupom);
  const [tipoDesc, setTipoDesc] = useState<"pct" | "fixo">(cupom.desconto_centavos != null ? "fixo" : "pct");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const upd = (k: keyof Cupom, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async () => {
    setSaving(true); setErr(null);
    try {
      await fnSave({
        data: {
          id: form.id,
          codigo: (form.codigo ?? "").trim(),
          descricao: form.descricao ?? null,
          desconto_pct: tipoDesc === "pct" ? Number(form.desconto_pct) || 0 : null,
          desconto_centavos: tipoDesc === "fixo" ? Number(form.desconto_centavos) || 0 : null,
          curso_id: form.curso_id || null,
          valido_de: form.valido_de || null,
          valido_ate: form.valido_ate || null,
          max_usos: form.max_usos ? Number(form.max_usos) : null,
          ativo: form.ativo ?? true,
        },
      });
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-[#1a1557]" style={{ fontFamily: "'Playfair Display', serif" }}>{form.id ? "Editar cupom" : "Novo cupom"}</h3>

        <Field label="Código">
          <input value={form.codigo ?? ""} onChange={(e) => upd("codigo", e.target.value.toUpperCase())} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm font-mono" placeholder="EX: BEMVINDA10" />
        </Field>
        <Field label="Descrição (interna)">
          <input value={form.descricao ?? ""} onChange={(e) => upd("descricao", e.target.value)} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de desconto">
            <select value={tipoDesc} onChange={(e) => setTipoDesc(e.target.value as any)} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm">
              <option value="pct">Percentual (%)</option>
              <option value="fixo">Valor fixo (R$)</option>
            </select>
          </Field>
          <Field label={tipoDesc === "pct" ? "Desconto %" : "Desconto em centavos"}>
            <input type="number" value={tipoDesc === "pct" ? (form.desconto_pct ?? "") : (form.desconto_centavos ?? "")}
              onChange={(e) => upd(tipoDesc === "pct" ? "desconto_pct" : "desconto_centavos", e.target.value === "" ? null : Number(e.target.value))}
              className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm" />
          </Field>
        </div>
        <Field label="Curso (vazio = vale pra qualquer)">
          <select value={form.curso_id ?? ""} onChange={(e) => upd("curso_id", e.target.value || null)} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm">
            <option value="">Todos os cursos</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Válido de">
            <input type="datetime-local" value={form.valido_de?.slice(0, 16) ?? ""} onChange={(e) => upd("valido_de", e.target.value || null)} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm" />
          </Field>
          <Field label="Válido até">
            <input type="datetime-local" value={form.valido_ate?.slice(0, 16) ?? ""} onChange={(e) => upd("valido_ate", e.target.value || null)} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Máximo de usos (vazio = ilimitado)">
            <input type="number" value={form.max_usos ?? ""} onChange={(e) => upd("max_usos", e.target.value === "" ? null : Number(e.target.value))} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm" />
          </Field>
          <Field label="Ativo">
            <select value={form.ativo ? "1" : "0"} onChange={(e) => upd("ativo", e.target.value === "1")} className="w-full border border-[#1a1557]/20 rounded px-3 py-2 text-sm">
              <option value="1">Sim</option><option value="0">Não</option>
            </select>
          </Field>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#1a1557]/70">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="bg-[#1a1557] text-white px-4 py-2 text-sm font-bold rounded disabled:opacity-50">{saving ? "Salvando…" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-[#1a1557]/60 font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
