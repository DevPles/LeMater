import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { DateRange } from "react-day-picker";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { getSalesReport } from "@/lib/orders.functions";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Row = {
  id: string;
  created_at: string;
  aprovado_em: string | null;
  plataforma: string;
  produto_tipo: string;
  produto_id: string | null;
  status: string;
  valor_centavos: number;
  moeda: string;
  pais: string | null;
  cupom_codigo: string | null;
  comprador_email: string;
};

const COLORS = ["#234735", "#c9a24a", "#ff6b9d", "#4ecdc4", "#45b7d1", "#feca57", "#a78bfa", "#96ceb4"];

const moeda = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
const fmtDay = (d: Date) => d.toISOString().slice(0, 10);
const fmtDayBR = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function presetRange(days: number): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function VendasReportView() {
  const fn = useServerFn(getSalesReport);
  const [range, setRange] = useState<DateRange | undefined>(presetRange(30));
  const [rows, setRows] = useState<Row[]>([]);
  const [titulos, setTitulos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setErr(null);
    fn({
      data: {
        from: range?.from ? new Date(range.from.setHours(0, 0, 0, 0)).toISOString() : undefined,
        to: range?.to ? new Date(range.to.setHours(23, 59, 59, 999)).toISOString() : undefined,
      },
    })
      .then((r: any) => {
        setRows(r.orders as Row[]);
        setTitulos(r.titulos ?? {});
      })
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, []);

  const agg = useMemo(() => {
    const aprovados = rows.filter((r) => r.status === "aprovado");
    const receita = aprovados.reduce((s, r) => s + (r.valor_centavos || 0), 0);
    const ticket = aprovados.length ? receita / aprovados.length : 0;
    const totalPedidos = rows.length;
    const taxaConv = rows.length ? (aprovados.length / rows.length) * 100 : 0;

    const porStatus: Record<string, number> = {};
    rows.forEach((r) => (porStatus[r.status] = (porStatus[r.status] || 0) + 1));

    const porPlataforma: Record<string, { qtd: number; receita: number }> = {};
    aprovados.forEach((r) => {
      const k = r.plataforma || "—";
      if (!porPlataforma[k]) porPlataforma[k] = { qtd: 0, receita: 0 };
      porPlataforma[k].qtd++;
      porPlataforma[k].receita += r.valor_centavos || 0;
    });

    const porPais: Record<string, number> = {};
    aprovados.forEach((r) => {
      const k = r.pais || "—";
      porPais[k] = (porPais[k] || 0) + 1;
    });

    const porTipo: Record<string, { qtd: number; receita: number }> = {};
    aprovados.forEach((r) => {
      const k = r.produto_tipo;
      if (!porTipo[k]) porTipo[k] = { qtd: 0, receita: 0 };
      porTipo[k].qtd++;
      porTipo[k].receita += r.valor_centavos || 0;
    });

    const porProduto: Record<string, { nome: string; qtd: number; receita: number }> = {};
    aprovados.forEach((r) => {
      const id = `${r.produto_tipo}:${r.produto_id ?? "—"}`;
      const nome = titulos[id] || `${r.produto_tipo} ${r.produto_id?.slice(0, 6) ?? ""}`;
      if (!porProduto[id]) porProduto[id] = { nome, qtd: 0, receita: 0 };
      porProduto[id].qtd++;
      porProduto[id].receita += r.valor_centavos || 0;
    });

    const cupons: Record<string, number> = {};
    aprovados.forEach((r) => {
      if (r.cupom_codigo) cupons[r.cupom_codigo] = (cupons[r.cupom_codigo] || 0) + 1;
    });

    // Série temporal diária
    const dailyMap: Record<string, { qtd: number; receita: number }> = {};
    aprovados.forEach((r) => {
      const d = fmtDay(new Date(r.created_at));
      if (!dailyMap[d]) dailyMap[d] = { qtd: 0, receita: 0 };
      dailyMap[d].qtd++;
      dailyMap[d].receita += r.valor_centavos || 0;
    });
    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, v]) => ({ data: d.slice(5), qtd: v.qtd, receita: Number((v.receita / 100).toFixed(2)) }));

    return {
      receita,
      ticket,
      aprovados: aprovados.length,
      totalPedidos,
      taxaConv,
      porStatus,
      porPlataforma,
      porPais,
      porTipo,
      porProduto: Object.values(porProduto).sort((a, b) => b.receita - a.receita).slice(0, 10),
      cupons,
      daily,
    };
  }, [rows, titulos]);

  const exportCSV = () => {
    const header = ["data", "plataforma", "produto_tipo", "status", "valor_centavos", "moeda", "pais", "cupom", "email"];
    const lines = [header.join(",")];
    rows.forEach((r) => {
      lines.push(
        [
          r.created_at,
          r.plataforma,
          r.produto_tipo,
          r.status,
          r.valor_centavos,
          r.moeda,
          r.pais ?? "",
          r.cupom_codigo ?? "",
          r.comprador_email,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas_${fmtDay(range?.from ?? new Date())}_${fmtDay(range?.to ?? new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#234735]/10 p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["Hoje", 1],
            ["7 dias", 7],
            ["30 dias", 30],
            ["90 dias", 90],
            ["12 meses", 365],
          ].map(([l, d]) => (
            <button
              key={l as string}
              onClick={() => setRange(presetRange(d as number))}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#f5efe2] text-[#234735] hover:bg-[#234735] hover:text-white transition-colors"
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[220px]">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="w-full text-left px-3 py-2 rounded-xl border border-[#234735]/20 bg-background text-sm text-[#234735] hover:border-[#c9a24a] transition-colors">
                {range?.from && range?.to
                  ? `${fmtDayBR(range.from)} — ${fmtDayBR(range.to)}`
                  : "Selecione o período"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={range}
                onSelect={setRange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-[#234735] text-white text-sm font-semibold hover:bg-[#234735]/90 transition-colors"
        >
          Atualizar
        </button>
        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-xl border border-[#234735]/20 text-[#234735] text-sm font-semibold hover:bg-[#f5efe2] transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}
      {loading && <p className="text-[#234735]/60 text-sm">Carregando relatório…</p>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Receita aprovada" value={moeda(agg.receita)} accent />
        <Kpi label="Vendas aprovadas" value={String(agg.aprovados)} />
        <Kpi label="Ticket médio" value={moeda(agg.ticket)} />
        <Kpi label="Total de pedidos" value={String(agg.totalPedidos)} />
        <Kpi label="Taxa de conversão" value={`${agg.taxaConv.toFixed(1)}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Evolução de receita (R$)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={agg.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="receita" stroke="#234735" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendas por dia">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={agg.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#c9a24a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Receita por plataforma">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={Object.entries(agg.porPlataforma).map(([k, v]) => ({
                plataforma: k,
                receita: Number((v.receita / 100).toFixed(2)),
                qtd: v.qtd,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plataforma" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="receita" fill="#234735" />
              <Bar dataKey="qtd" fill="#c9a24a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status dos pedidos">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={Object.entries(agg.porStatus).map(([k, v]) => ({ name: k, value: v }))}
                dataKey="value"
                outerRadius={90}
                label
              >
                {Object.keys(agg.porStatus).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Receita por tipo de produto">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={Object.entries(agg.porTipo).map(([k, v]) => ({
                tipo: k,
                receita: Number((v.receita / 100).toFixed(2)),
                qtd: v.qtd,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="receita" fill="#234735" />
              <Bar dataKey="qtd" fill="#c9a24a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vendas por país">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={Object.entries(agg.porPais).map(([k, v]) => ({ name: k, value: v }))}
                dataKey="value"
                outerRadius={90}
                label
              >
                {Object.keys(agg.porPais).map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Top 10 produtos por receita">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-[#234735]/60">
              <tr>
                <th className="text-left py-2 px-3">Produto</th>
                <th className="text-right py-2 px-3">Vendas</th>
                <th className="text-right py-2 px-3">Receita</th>
                <th className="text-right py-2 px-3">Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {agg.porProduto.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-[#234735]/50">
                    Sem vendas aprovadas no período.
                  </td>
                </tr>
              )}
              {agg.porProduto.map((p) => (
                <tr key={p.nome} className="border-t border-[#234735]/5">
                  <td className="py-2 px-3 font-medium text-[#234735]">{p.nome}</td>
                  <td className="py-2 px-3 text-right">{p.qtd}</td>
                  <td className="py-2 px-3 text-right font-semibold">{moeda(p.receita)}</td>
                  <td className="py-2 px-3 text-right">{moeda(p.receita / p.qtd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {Object.keys(agg.cupons).length > 0 && (
        <ChartCard title="Cupons utilizados (vendas aprovadas)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={Object.entries(agg.cupons).map(([codigo, qtd]) => ({ codigo, qtd }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="codigo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#ff6b9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </motion.div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 border ${
        accent ? "bg-[#234735] text-white border-[#234735]" : "bg-white border-[#234735]/10 text-[#234735]"
      }`}
    >
      <p
        className={`text-[11px] uppercase tracking-wide font-semibold ${
          accent ? "text-[#c9a24a]" : "text-[#234735]/60"
        }`}
      >
        {label}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#234735]/10 rounded-2xl p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#234735]/60 mb-3">{title}</p>
      {children}
    </div>
  );
}
