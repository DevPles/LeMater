import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listVendas, listCupons, saveCupom, deleteCupom, listCursosBasic } from "@/lib/vendas.functions";
import { listOrders, aprovarPedidoManual, reembolsarPedido } from "@/lib/orders.functions";
import { VendasReportView } from "./VendasReportView";

type Venda = { id: string; processado_em: string; email_comprador: string; nome_comprador: string | null; produto: string | null; evento: string; status: string; transaction_id: string | null; curso_id: string | null; curso_titulo: string | null; cupom_codigo: string | null; valor_centavos: number | null; plataforma: string | null };
type Cupom = { id: string; codigo: string; descricao: string | null; desconto_pct: number | null; desconto_centavos: number | null; curso_id: string | null; valido_de: string | null; valido_ate: string | null; max_usos: number | null; usos: number; ativo: boolean; created_at: string };
type CursoMin = { id: string; titulo: string; preco_centavos: number; produto_externo_id: string | null };
type Order = { id: string; created_at: string; aprovado_em: string | null; plataforma: string; produto_tipo: string; produto_id: string; comprador_email: string; comprador_nome: string | null; status: string; valor_centavos: number; moeda: string; pais: string | null; transaction_id_externo: string | null; cupom_codigo: string | null; aprovacao_manual: boolean };

const moeda = (c: number | null | undefined, m = "BRL") => c == null ? "—" : `${m} ${(c / 100).toFixed(2).replace(".", ",")}`;
const dataFmt = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";

type Aba = "pedidos" | "relatorios" | "vendas" | "cupons" | "integracoes";

export function VendasTab() {
  const [aba, setAba] = useState<Aba>("pedidos");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[#234735]/10 flex-wrap">
        {([["pedidos", "Pedidos"], ["relatorios", "Relatórios"], ["vendas", "Vendas (legado)"], ["cupons", "Cupons"], ["integracoes", "Integrações"]] as [Aba, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setAba(k)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${aba === k ? "text-[#234735] border-b-2 border-[#c9a24a]" : "text-[#234735]/50 hover:text-[#234735]"}`}>
            {l}
          </button>
        ))}
      </div>
      {aba === "pedidos" && <PedidosView />}
      {aba === "relatorios" && <VendasReportView />}
      {aba === "vendas" && <VendasView />}
      {aba === "cupons" && <CuponsView />}
      {aba === "integracoes" && <IntegracoesView />}
    </div>
  );
}


function PedidosView() {
  const fn = useServerFn(listOrders);
  const fnAprovar = useServerFn(aprovarPedidoManual);
  const fnReembolsar = useServerFn(reembolsarPedido);
  const [orders, setOrders] = useState<Order[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("todos");

  const reload = () => fn().then((r) => setOrders(r.orders as Order[])).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  const filtrados = filtro === "todos" ? orders : orders.filter(o => o.status === filtro);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["todos", "pendente", "aprovado", "reembolsado", "cancelado"].map(s => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${filtro === s ? "bg-[#234735] text-white" : "bg-white border border-[#234735]/20 text-[#234735]"}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-[#234735]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5efe2] text-[#234735] text-xs uppercase">
              <tr>{["Data", "Plataforma", "País", "Tipo", "Comprador", "Valor", "Status", "Ações"].map(h => <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-[#234735]/50">Nenhum pedido.</td></tr>}
              {filtrados.map(o => (
                <tr key={o.id} className="border-t border-[#234735]/5">
                  <td className="px-3 py-2 text-xs">{dataFmt(o.created_at)}</td>
                  <td className="px-3 py-2 uppercase text-xs">{o.plataforma}</td>
                  <td className="px-3 py-2 text-xs">{o.pais ?? "—"}</td>
                  <td className="px-3 py-2 text-xs capitalize">{o.produto_tipo}</td>
                  <td className="px-3 py-2"><div className="font-medium">{o.comprador_nome ?? "—"}</div><div className="text-xs text-[#234735]/60">{o.comprador_email}</div></td>
                  <td className="px-3 py-2">{moeda(o.valor_centavos, o.moeda)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === "aprovado" ? "bg-green-100 text-green-800" : o.status === "pendente" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{o.status}</span>
                  </td>
                  <td className="px-3 py-2 space-x-1">
                    {o.status === "pendente" && (
                      <button onClick={() => fnAprovar({ data: { order_id: o.id } }).then(reload)} className="text-xs px-2 py-1 bg-[#234735] text-white rounded">Aprovar</button>
                    )}
                    {o.status === "aprovado" && (
                      <button onClick={() => { if (await appConfirm("Reembolsar e revogar acesso?")) fnReembolsar({ data: { order_id: o.id } }).then(reload); }} className="text-xs px-2 py-1 border border-red-600 text-red-700 rounded">Reembolsar</button>
                    )}
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

function IntegracoesView() {
  const base = typeof window !== "undefined" ? window.location.origin : "https://lemater.com";
  const hooks: { nome: string; url: string; segredo: string; instrucoes: string }[] = [
    { nome: "Mercado Pago", url: `${base}/api/public/mercadopago-webhook`, segredo: "MERCADOPAGO_ACCESS_TOKEN (Access Token)", instrucoes: "Painel MP → Suas Integrações → Webhooks → Configurar URL." },
    { nome: "Hotmart", url: `${base}/api/public/hooks/hotmart`, segredo: "HOTMART_HOTTOK", instrucoes: "Hotmart → Ferramentas → Postback (Webhook) → URL + HotTok." },
    { nome: "Kiwify", url: `${base}/api/public/hooks/kiwify`, segredo: "KIWIFY_WEBHOOK_SECRET", instrucoes: "Kiwify → Configurações → Webhooks → adicionar URL e Secret." },
    { nome: "Eduzz", url: `${base}/api/public/hooks/eduzz?api_key=SEU_SECRET`, segredo: "EDUZZ_WEBHOOK_SECRET", instrucoes: "Myeduzz → Integrações → Postback → cole URL com api_key." },
    { nome: "Stripe", url: `${base}/api/public/hooks/stripe`, segredo: "STRIPE_WEBHOOK_SECRET (whsec_...)", instrucoes: "Stripe → Developers → Webhooks → Add endpoint. Eventos: checkout.session.completed, charge.refunded. Coloque product_external_id no metadata do Checkout/PaymentLink." },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#234735]/70">Cole estas URLs nas plataformas correspondentes. Em cada oferta cadastrada no curso/aula/material, preencha <b>produto_externo_id</b> com o ID do produto na plataforma — assim o webhook libera o acesso certo automaticamente.</p>
      {hooks.map(h => (
        <div key={h.nome} className="bg-white rounded-lg border border-[#234735]/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-[#234735]">{h.nome}</div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f5efe2] font-mono">{h.segredo}</span>
          </div>
          <div className="font-mono text-xs bg-[#0d0d0d] text-[#c9a24a] p-2 rounded break-all">{h.url}</div>
          <p className="text-xs text-[#234735]/60 mt-2">{h.instrucoes}</p>
        </div>
      ))}
    </div>
  );
}

function VendasView() {
  const fn = useServerFn(listVendas);
  const [data, setData] = useState<{ compras: Venda[]; resumo: { total: number; aprovadas: number; receita_centavos: number } } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fn().then(setData).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p className="text-[#234735]/60">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card label="Total de eventos" value={String(data.resumo.total)} />
        <Card label="Vendas aprovadas" value={String(data.resumo.aprovadas)} />
        <Card label="Receita aprovada" value={moeda(data.resumo.receita_centavos)} />
      </div>

      <div className="bg-white rounded-lg border border-[#234735]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5efe2] text-[#234735] text-xs uppercase">
              <tr>
                {["Data", "Plataforma", "Comprador", "Produto/Curso", "Cupom", "Valor", "Status"].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.compras.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-[#234735]/50">Nenhuma compra registrada ainda.</td></tr>}
              {data.compras.map((c) => (
                <tr key={c.id} className="border-t border-[#234735]/5">
                  <td className="px-3 py-2 text-[#234735]/70">{dataFmt(c.processado_em)}</td>
                  <td className="px-3 py-2 uppercase text-xs">{c.plataforma ?? "—"}</td>
                  <td className="px-3 py-2"><div className="font-medium text-[#234735]">{c.nome_comprador ?? "—"}</div><div className="text-xs text-[#234735]/60">{c.email_comprador}</div></td>
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
    <div className="bg-white rounded-lg border border-[#234735]/10 p-4">
      <div className="text-[10px] uppercase tracking-widest text-[#234735]/60 font-semibold">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[#234735]" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
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
    if (!(await appConfirm("Excluir este cupom?"))) return;
    await fnDel({ data: { id } });
    reload();
  };

  const cursoNome = (id: string | null) => id ? cursos.find((c) => c.id === id)?.titulo ?? "—" : "Todos os cursos";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#234735]" style={{ fontFamily: "'Playfair Display', serif" }}>Cupons de desconto</h3>
        <button onClick={() => setEdit({ codigo: "", ativo: true })} className="bg-[#c9a24a] hover:bg-[#d9aa30] text-[#234735] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg">Novo cupom</button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="bg-white rounded-lg border border-[#234735]/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f5efe2] text-[#234735] text-xs uppercase">
            <tr>{["Código", "Desconto", "Curso", "Validade", "Usos", "Ativo", ""].map((h) => <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {cupons.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-[#234735]/50">Nenhum cupom criado.</td></tr>}
            {cupons.map((c) => (
              <tr key={c.id} className="border-t border-[#234735]/5">
                <td className="px-3 py-2 font-mono font-bold text-[#234735]">{c.codigo}</td>
                <td className="px-3 py-2">{c.desconto_pct != null ? `${c.desconto_pct}%` : moeda(c.desconto_centavos)}</td>
                <td className="px-3 py-2 text-[#234735]/70">{cursoNome(c.curso_id)}</td>
                <td className="px-3 py-2 text-xs text-[#234735]/70">{c.valido_ate ? `até ${new Date(c.valido_ate).toLocaleDateString("pt-BR")}` : "sem prazo"}</td>
                <td className="px-3 py-2">{c.usos}{c.max_usos ? ` / ${c.max_usos}` : ""}</td>
                <td className="px-3 py-2">{c.ativo ? "Sim" : "Não"}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button onClick={() => setEdit(c)} className="text-xs text-[#234735] underline">Editar</button>
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
        <h3 className="text-xl font-bold text-[#234735]" style={{ fontFamily: "'Playfair Display', serif" }}>{form.id ? "Editar cupom" : "Novo cupom"}</h3>

        <Field label="Código">
          <input value={form.codigo ?? ""} onChange={(e) => upd("codigo", e.target.value.toUpperCase())} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm font-mono" placeholder="EX: BEMVINDA10" />
        </Field>
        <Field label="Descrição (interna)">
          <input value={form.descricao ?? ""} onChange={(e) => upd("descricao", e.target.value)} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de desconto">
            <select value={tipoDesc} onChange={(e) => setTipoDesc(e.target.value as any)} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm">
              <option value="pct">Percentual (%)</option>
              <option value="fixo">Valor fixo (R$)</option>
            </select>
          </Field>
          <Field label={tipoDesc === "pct" ? "Desconto %" : "Desconto em centavos"}>
            <input type="number" value={tipoDesc === "pct" ? (form.desconto_pct ?? "") : (form.desconto_centavos ?? "")}
              onChange={(e) => upd(tipoDesc === "pct" ? "desconto_pct" : "desconto_centavos", e.target.value === "" ? null : Number(e.target.value))}
              className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm" />
          </Field>
        </div>
        <Field label="Curso (vazio = vale pra qualquer)">
          <select value={form.curso_id ?? ""} onChange={(e) => upd("curso_id", e.target.value || null)} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm">
            <option value="">Todos os cursos</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Válido de">
            <input type="datetime-local" value={form.valido_de?.slice(0, 16) ?? ""} onChange={(e) => upd("valido_de", e.target.value || null)} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm" />
          </Field>
          <Field label="Válido até">
            <input type="datetime-local" value={form.valido_ate?.slice(0, 16) ?? ""} onChange={(e) => upd("valido_ate", e.target.value || null)} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Máximo de usos (vazio = ilimitado)">
            <input type="number" value={form.max_usos ?? ""} onChange={(e) => upd("max_usos", e.target.value === "" ? null : Number(e.target.value))} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm" />
          </Field>
          <Field label="Ativo">
            <select value={form.ativo ? "1" : "0"} onChange={(e) => upd("ativo", e.target.value === "1")} className="w-full border border-[#234735]/20 rounded px-3 py-2 text-sm">
              <option value="1">Sim</option><option value="0">Não</option>
            </select>
          </Field>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#234735]/70">Cancelar</button>
          <button onClick={salvar} disabled={saving} className="bg-[#234735] text-white px-4 py-2 text-sm font-bold rounded disabled:opacity-50">{saving ? "Salvando…" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-[#234735]/60 font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
