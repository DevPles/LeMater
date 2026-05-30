import { useEffect, useMemo, useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { supabase } from "@/integrations/supabase/client";
import { DRS_XIII_CIDADES } from "@/lib/drs-xiii";

type ProfileRow = {
  user_id: string;
  cidade: string | null;
  bairro: string | null;
  unidade_saude: string | null;
  data_nascimento: string | null;
  dum: string | null;
  numero_gestacoes: number | null;
  numero_partos: number | null;
  numero_abortos: number | null;
  partos_classificacao: { tipo?: string; ano?: number }[] | null;
  created_at: string | null;
};


type MeasurementRow = { gestante_id: string; parametro: string; valor: number; semana_gestacional: number | null };
type ExamRow = { gestante_id: string; tipo_exame: string; status: string };
type VaccinationRow = { gestante_id: string; vacina: string };
type ImageResultRow = { gestante_id: string; tipo_exame: string; status: string };

const COLORS = ["#234735", "#c9a24a", "#ff6b9d", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#a78bfa"];

function calcAge(dn: string | null): number | null {
  if (!dn) return null;
  const diff = Date.now() - new Date(dn).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
function calcWeeks(dum: string | null): number | null {
  if (!dum) return null;
  const diff = Date.now() - new Date(dum).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}
function trimestre(weeks: number | null): "1º" | "2º" | "3º" | "—" {
  if (weeks === null) return "—";
  if (weeks < 14) return "1º";
  if (weeks < 28) return "2º";
  return "3º";
}
function faixaEtaria(idade: number | null): "<18" | "18-34" | "≥35" | "—" {
  if (idade === null) return "—";
  if (idade < 18) return "<18";
  if (idade < 35) return "18-34";
  return "≥35";
}

import { useAdminFilters } from "@/contexts/AdminFiltersContext";

export function RelatoriosEpidemiologicosTab() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([]);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRow[]>([]);
  const [imageResults, setImageResults] = useState<ImageResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Consome filtros globais do topbar (evita duplicação na UI)
  const { filters } = useAdminFilters();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, m, e, v, i] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "user_id, cidade, bairro, unidade_saude, data_nascimento, dum, numero_gestacoes, numero_partos, numero_abortos, partos_classificacao",
          ),
        supabase.from("clinical_measurements").select("gestante_id, parametro, valor, semana_gestacional"),
        supabase.from("exam_results").select("gestante_id, tipo_exame, status"),
        supabase.from("vaccinations").select("gestante_id, vacina"),
        supabase.from("image_exam_results").select("gestante_id, tipo_exame, status"),
      ]);
      setProfiles((p.data ?? []) as ProfileRow[]);
      setMeasurements((m.data ?? []) as MeasurementRow[]);
      setExams((e.data ?? []) as ExamRow[]);
      setVaccinations((v.data ?? []) as VaccinationRow[]);
      setImageResults((i.data ?? []) as ImageResultRow[]);
      setLoading(false);
    };
    load();
  }, []);

  // Aplica filtros globais
  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (filters.cidades.length > 0 && (!p.cidade || !filters.cidades.includes(p.cidade))) return false;
      if (filters.bairro !== "todos" && p.bairro !== filters.bairro) return false;
      if (filters.ubs !== "todas" && p.unidade_saude !== filters.ubs) return false;
      const idade = calcAge(p.data_nascimento);
      if (filters.faixa !== "todas" && faixaEtaria(idade) !== filters.faixa) return false;
      const w = calcWeeks(p.dum);
      const trimMap: Record<string, string> = { "1": "1º", "2": "2º", "3": "3º" };
      if (filters.trimestre !== "todos" && trimestre(w) !== trimMap[filters.trimestre]) return false;
      return true;
    });
  }, [profiles, filters]);

  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.user_id)), [filtered]);

  // Agregações
  const agg = useMemo(() => {
    const total = filtered.length;
    const porCidade: Record<string, number> = {};
    const porBairro: Record<string, number> = {};
    const porUbs: Record<string, number> = {};
    const porFaixa: Record<string, number> = { "<18": 0, "18-34": 0, "≥35": 0, "—": 0 };
    const porTrim: Record<string, number> = { "1º": 0, "2º": 0, "3º": 0, "—": 0 };
    const partosTipo: Record<string, number> = { normal: 0, cesarea: 0, forceps: 0 };
    let somaGest = 0,
      somaPartos = 0,
      somaAbortos = 0,
      cntObst = 0;

    filtered.forEach((p) => {
      if (p.cidade) porCidade[p.cidade] = (porCidade[p.cidade] || 0) + 1;
      if (p.bairro) porBairro[p.bairro] = (porBairro[p.bairro] || 0) + 1;
      if (p.unidade_saude) porUbs[p.unidade_saude] = (porUbs[p.unidade_saude] || 0) + 1;
      const idade = calcAge(p.data_nascimento);
      porFaixa[faixaEtaria(idade)]++;
      const w = calcWeeks(p.dum);
      porTrim[trimestre(w)]++;
      if (p.numero_gestacoes !== null && p.numero_gestacoes !== undefined) {
        somaGest += p.numero_gestacoes ?? 0;
        somaPartos += p.numero_partos ?? 0;
        somaAbortos += p.numero_abortos ?? 0;
        cntObst++;
      }
      (p.partos_classificacao ?? []).forEach((pt) => {
        if (pt.tipo && partosTipo[pt.tipo] !== undefined) partosTipo[pt.tipo]++;
      });
    });

    // Exames alterados
    const examesAltCount: Record<string, number> = {};
    exams
      .filter((e) => filteredIds.has(e.gestante_id) && e.status === "alterado")
      .forEach((e) => (examesAltCount[e.tipo_exame] = (examesAltCount[e.tipo_exame] || 0) + 1));

    // Imagem alterados
    const imgAltCount: Record<string, number> = {};
    imageResults
      .filter((r) => filteredIds.has(r.gestante_id) && r.status === "alterado")
      .forEach((r) => (imgAltCount[r.tipo_exame] = (imgAltCount[r.tipo_exame] || 0) + 1));

    // Cobertura vacinal
    const vacinasCount: Record<string, number> = {};
    vaccinations
      .filter((v) => filteredIds.has(v.gestante_id))
      .forEach((v) => (vacinasCount[v.vacina] = (vacinasCount[v.vacina] || 0) + 1));

    // Sinais vitais médios
    const sumByParam: Record<string, { sum: number; n: number }> = {};
    measurements
      .filter((m) => filteredIds.has(m.gestante_id))
      .forEach((m) => {
        if (!sumByParam[m.parametro]) sumByParam[m.parametro] = { sum: 0, n: 0 };
        sumByParam[m.parametro].sum += Number(m.valor);
        sumByParam[m.parametro].n++;
      });
    const mediaSinais = Object.entries(sumByParam).map(([k, v]) => ({
      parametro: k,
      media: Number((v.sum / v.n).toFixed(1)),
      n: v.n,
    }));

    return {
      total,
      porCidade,
      porBairro,
      porUbs,
      porFaixa,
      porTrim,
      partosTipo,
      mediaGest: cntObst ? (somaGest / cntObst).toFixed(1) : "—",
      mediaPartos: cntObst ? (somaPartos / cntObst).toFixed(1) : "—",
      mediaAbortos: cntObst ? (somaAbortos / cntObst).toFixed(1) : "—",
      examesAltCount,
      imgAltCount,
      vacinasCount,
      mediaSinais,
    };
  }, [filtered, filteredIds, measurements, exams, vaccinations, imageResults]);

  if (loading) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Carregando dados epidemiológicos...</p>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Filtros internos removidos — esta aba consome os filtros globais do topbar (cidade → bairro → UBS, idade, trimestre). */}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Gestantes" value={agg.total} />
        <Kpi label="Cidades cobertas" value={Object.keys(agg.porCidade).length} />
        <Kpi label="Méd. gestações" value={agg.mediaGest} />
        <Kpi label="Méd. partos" value={agg.mediaPartos} />
        <Kpi label="Méd. abortos" value={agg.mediaAbortos} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Distribuição por cidade">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={Object.entries(agg.porCidade).map(([cidade, qtd]) => ({ cidade, qtd }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cidade" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#234735" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Faixa etária">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={Object.entries(agg.porFaixa).map(([k, v]) => ({ name: k, value: v }))}
                dataKey="value"
                outerRadius={80}
                label
              >
                {Object.keys(agg.porFaixa).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Trimestre gestacional">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={Object.entries(agg.porTrim).map(([k, v]) => ({ name: k, value: v }))}
                dataKey="value"
                outerRadius={80}
                label
              >
                {Object.keys(agg.porTrim).map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top UBS / Unidades">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={Object.entries(agg.porUbs)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([ubs, qtd]) => ({ ubs, qtd }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="ubs" tick={{ fontSize: 10 }} width={140} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#c9a24a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Exames laboratoriais alterados">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={Object.entries(agg.examesAltCount).map(([tipo_exame, qtd]) => ({ tipo_exame, qtd }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo_exame" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#ff6b9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cobertura vacinal (aplicadas)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={Object.entries(agg.vacinasCount).map(([vacina, qtd]) => ({ vacina, qtd }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vacina" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#4ecdc4" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Classificação de partos anteriores">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={Object.entries(agg.partosTipo).map(([k, v]) => ({ name: k, value: v }))}
                dataKey="value"
                outerRadius={80}
                label
              >
                {Object.keys(agg.partosTipo).map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sinais vitais — média populacional">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={agg.mediaSinais}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="parametro" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="media" stroke="#234735" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {Object.keys(agg.imgAltCount).length > 0 && (
        <ChartCard title="Exames de imagem alterados">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={Object.entries(agg.imgAltCount).map(([tipo_exame, qtd]) => ({ tipo_exame, qtd }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo_exame" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="#feca57" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </motion.div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="text-2xl font-bold text-[#234735] mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{title}</p>
      {children}
    </div>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="font-semibold text-muted-foreground mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-xl border border-border bg-background px-2 text-xs"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
