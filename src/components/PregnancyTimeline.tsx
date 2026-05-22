import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  GESTATION_WEEKS,
  GESTATION_DAYS,
  addDays,
  parseDate,
  weeksBetween,
  trimesterOfWeek,
  formatBRDate,
  expectedWeightRange,
  BP_NORMAL,
} from "@/lib/pregnancy-norms";

type Props = {
  userId: string;
  dum: string | null | undefined;
  cadastroISO: string | null | undefined;
};

type Medicao = {
  parametro: string;
  valor: number;
  data_medicao: string;
  semana_gestacional: number | null;
};

const NAVY = "#1a1557";
const GOLD = "#f0c040";

type Milestone = {
  week: number;
  title: string;
  detail: string;
};

const MILESTONES: Milestone[] = [
  { week: 6, title: "1ª consulta de pré-natal", detail: "Confirmação, exames iniciais e BHCG" },
  { week: 8, title: "USG de datação", detail: "Confirma IG e batimentos cardíacos" },
  { week: 12, title: "Translucência nucal", detail: "Rastreio cromossômico do 1º trimestre" },
  { week: 16, title: "Exames do 2º trimestre", detail: "Hemograma, urina, glicemia" },
  { week: 20, title: "USG morfológica", detail: "Avaliação detalhada da anatomia fetal" },
  { week: 24, title: "Teste de tolerância à glicose", detail: "Rastreio de diabetes gestacional" },
  { week: 28, title: "Início do 3º trimestre", detail: "Consultas quinzenais, vacina dTpa" },
  { week: 32, title: "USG de crescimento", detail: "Avalia peso e líquido amniótico" },
  { week: 36, title: "Streptococcus B", detail: "Coleta vaginal e retal" },
  { week: 37, title: "Termo precoce", detail: "Bebê considerado a termo" },
  { week: 40, title: "Data provável do parto", detail: "DPP estimada pela DUM" },
];

export function PregnancyTimeline({ userId, dum, cadastroISO }: Props) {
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"agenda" | "peso" | "pressao">("agenda");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("clinical_measurements")
        .select("parametro,valor,data_medicao,semana_gestacional")
        .eq("gestante_id", userId)
        .in("parametro", ["peso", "Peso", "pa_sistolica", "pa_diastolica", "altura", "Altura"])
        .order("data_medicao", { ascending: true });
      if (!active) return;
      setMedicoes((data ?? []) as Medicao[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const dumDate = parseDate(dum);

  if (!dumDate) {
    return (
      <div className="p-6 rounded-2xl bg-[#faf8f3] border border-[#1a1557]/10 text-center">
        <p className="font-display text-base text-[#1a1557] mb-1">Cronograma indisponível</p>
        <p className="text-sm text-muted-foreground">
          Cadastre sua DUM no perfil para visualizar a linha do tempo da gestação.
        </p>
      </div>
    );
  }

  const dpp = addDays(dumDate, GESTATION_DAYS);
  const hoje = new Date();
  const semanaAtualNum = Math.max(0, Math.min(GESTATION_WEEKS, weeksBetween(dumDate, hoje)));
  const semanaAtual = Math.floor(semanaAtualNum);
  const diaSemana = Math.floor((semanaAtualNum - semanaAtual) * 7);
  const trimestre = trimesterOfWeek(semanaAtual);
  const diasRestantes = Math.max(0, Math.ceil((dpp.getTime() - hoje.getTime()) / 86400000));
  const progresso = Math.min(100, (semanaAtualNum / GESTATION_WEEKS) * 100);

  const cadastroDate = parseDate(cadastroISO);
  const semanaCadastro = cadastroDate
    ? Math.max(0, Math.min(GESTATION_WEEKS, weeksBetween(dumDate, cadastroDate)))
    : null;

  // Peso
  const pesos = medicoes
    .filter((m) => m.parametro === "peso" || m.parametro === "Peso")
    .map((m) => ({
      semana: m.semana_gestacional ?? Math.round(weeksBetween(dumDate, new Date(m.data_medicao))),
      peso: Number(m.valor),
    }))
    .filter((p) => p.semana >= 0 && p.semana <= GESTATION_WEEKS)
    .sort((a, b) => a.semana - b.semana);

  const pesoInicial = pesos[0];
  const pesoUltimo = pesos[pesos.length - 1];
  const ganhoTotal = pesoInicial && pesoUltimo ? pesoUltimo.peso - pesoInicial.peso : null;

  // Altura (em metros — vem em cm ou m)
  const alturaMed = medicoes.find((m) => m.parametro === "altura" || m.parametro === "Altura");
  const alturaM = alturaMed
    ? Number(alturaMed.valor) > 3
      ? Number(alturaMed.valor) / 100
      : Number(alturaMed.valor)
    : null;

  const imcInicial = alturaM && pesoInicial ? pesoInicial.peso / (alturaM * alturaM) : null;
  const imcAtual = alturaM && pesoUltimo ? pesoUltimo.peso / (alturaM * alturaM) : null;

  // Faixa de ganho recomendada (IOM) com base no IMC pré-gestacional
  let ganhoRecomendado: { min: number; max: number; categoria: string } | null = null;
  if (imcInicial) {
    if (imcInicial < 18.5) ganhoRecomendado = { min: 12.5, max: 18, categoria: "Baixo peso" };
    else if (imcInicial < 25) ganhoRecomendado = { min: 11.5, max: 16, categoria: "Eutrófica" };
    else if (imcInicial < 30) ganhoRecomendado = { min: 7, max: 11.5, categoria: "Sobrepeso" };
    else ganhoRecomendado = { min: 5, max: 9, categoria: "Obesidade" };
  }

  const classificaIMC = (imc: number) => {
    if (imc < 18.5) return { label: "Baixo peso", color: "#3b82f6" };
    if (imc < 25) return { label: "Eutrófica", color: "#16a34a" };
    if (imc < 30) return { label: "Sobrepeso", color: "#f59e0b" };
    return { label: "Obesidade", color: "#dc2626" };
  };

  const pesoSeries = useMemo(() => {
    return Array.from({ length: GESTATION_WEEKS + 1 }, (_, w) => {
      const ponto = pesos.find((p) => p.semana === w);
      let faixa: [number, number] | null = null;
      if (pesoInicial) {
        const r = expectedWeightRange(w, pesoInicial.semana, pesoInicial.peso);
        faixa = [Number(r.min.toFixed(2)), Number(r.max.toFixed(2))];
      }
      return {
        semana: w,
        peso: ponto ? ponto.peso : null,
        faixaMin: faixa ? faixa[0] : null,
        faixaRange: faixa ? Number((faixa[1] - faixa[0]).toFixed(2)) : null,
        projecao:
          pesoUltimo && w >= pesoUltimo.semana
            ? Number(
                (
                  pesoUltimo.peso +
                  (w - pesoUltimo.semana) * (trimestre === 1 ? 0.15 : 0.42)
                ).toFixed(2),
              )
            : null,
      };
    });
  }, [pesos, pesoInicial, pesoUltimo, trimestre]);

  // PA
  const sistMap = new Map<number, number>();
  const diasMap = new Map<number, number>();
  for (const m of medicoes) {
    const w = m.semana_gestacional ?? Math.round(weeksBetween(dumDate, new Date(m.data_medicao)));
    if (w < 0 || w > GESTATION_WEEKS) continue;
    if (m.parametro === "pa_sistolica") sistMap.set(w, Number(m.valor));
    if (m.parametro === "pa_diastolica") diasMap.set(w, Number(m.valor));
  }
  const paSeries = Array.from({ length: GESTATION_WEEKS + 1 }, (_, w) => ({
    semana: w,
    sistolica: sistMap.get(w) ?? null,
    diastolica: diasMap.get(w) ?? null,
    sistMin: BP_NORMAL.sistolica.min,
    sistRange: BP_NORMAL.sistolica.max - BP_NORMAL.sistolica.min,
    diasMin: BP_NORMAL.diastolica.min,
    diasRange: BP_NORMAL.diastolica.max - BP_NORMAL.diastolica.min,
  }));

  // Próximos marcos
  const proximoMarco = MILESTONES.find((m) => m.week >= semanaAtual);

  return (
    <div className="space-y-4">
      {/* Hero planner card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1557] via-[#252068] to-[#1a1557] text-white p-5 shadow-lg">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#f0c040]/15 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#f0c040]/90 font-semibold">
              {trimestre}º trimestre
            </p>
            <p className="font-display text-3xl leading-tight mt-1">
              Semana {semanaAtual}
              <span className="text-base font-normal text-white/70"> +{diaSemana}d</span>
            </p>
            <p className="text-xs text-white/70 mt-1">
              {diasRestantes} dias até a DPP · {formatBRDate(dpp)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Progresso</p>
            <p className="font-display text-2xl text-[#f0c040]">{Math.round(progresso)}%</p>
          </div>
        </div>

        {/* Timeline planner bar */}
        <div className="relative mt-5">
          <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
            <div className="bg-white/25" style={{ width: `${(13 / GESTATION_WEEKS) * 100}%` }} />
            <div className="bg-white/35" style={{ width: `${(14 / GESTATION_WEEKS) * 100}%` }} />
            <div className="bg-white/45" style={{ width: `${(13 / GESTATION_WEEKS) * 100}%` }} />
          </div>
          {/* progresso */}
          <div
            className="absolute top-0 left-0 h-2 rounded-full bg-[#f0c040]"
            style={{ width: `${progresso}%` }}
          />
          {/* hoje marker */}
          <div
            className="absolute -top-1 h-4 w-4 rounded-full bg-[#f0c040] border-2 border-[#1a1557] shadow"
            style={{ left: `calc(${progresso}% - 8px)` }}
          />
          {/* cadastro marker */}
          {semanaCadastro !== null && (
            <div
              className="absolute top-0 h-2 w-px bg-white/60"
              style={{ left: `${(semanaCadastro / GESTATION_WEEKS) * 100}%` }}
              title="Cadastro"
            />
          )}

          <div className="flex justify-between text-[9px] text-white/60 mt-2 font-medium">
            <span>DUM<br/>{formatBRDate(dumDate).slice(0, 5)}</span>
            <span className="text-center">13<br/>sem</span>
            <span className="text-center">27<br/>sem</span>
            <span className="text-right">DPP<br/>{formatBRDate(dpp).slice(0, 5)}</span>
          </div>
        </div>
      </div>

      {/* Próximo marco */}
      {proximoMarco && (
        <div className="rounded-xl bg-[#faf8f3] border border-[#1a1557]/10 p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#1a1557] text-[#f0c040] flex flex-col items-center justify-center">
            <span className="text-[8px] uppercase tracking-wider opacity-70">sem</span>
            <span className="font-display font-bold text-lg leading-none">{proximoMarco.week}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Próximo marco
            </p>
            <p className="font-display text-sm text-[#1a1557] mt-0.5">{proximoMarco.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{proximoMarco.detail}</p>
          </div>
          <span className="text-[10px] text-[#1a1557] font-semibold whitespace-nowrap">
            em {Math.max(0, proximoMarco.week - semanaAtual)} sem
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#1a1557]/5 rounded-xl">
        {[
          { k: "agenda", label: "Agenda" },
          { k: "peso", label: "Peso" },
          { k: "pressao", label: "Pressão" },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k as typeof tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              tab === t.k
                ? "bg-white text-[#1a1557] shadow-sm"
                : "text-[#1a1557]/60 hover:text-[#1a1557]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "agenda" && (
        <div className="space-y-2">
          {MILESTONES.map((m) => {
            const status =
              m.week < semanaAtual ? "passado" : m.week === semanaAtual ? "agora" : "futuro";
            const tri = trimesterOfWeek(m.week);
            return (
              <div
                key={m.week}
                className={`relative pl-10 pr-3 py-3 rounded-xl border transition-colors ${
                  status === "agora"
                    ? "bg-[#f0c040]/10 border-[#f0c040]/40"
                    : status === "passado"
                    ? "bg-white/40 border-[#1a1557]/5 opacity-60"
                    : "bg-white border-[#1a1557]/10"
                }`}
              >
                <div
                  className={`absolute left-3 top-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    status === "passado"
                      ? "bg-[#1a1557]/20 text-[#1a1557]"
                      : status === "agora"
                      ? "bg-[#f0c040] text-[#1a1557]"
                      : "bg-[#1a1557] text-[#f0c040]"
                  }`}
                >
                  {status === "passado" ? "✓" : tri}
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={`font-display text-sm ${
                      status === "passado" ? "line-through text-muted-foreground" : "text-[#1a1557]"
                    }`}
                  >
                    {m.title}
                  </p>
                  <span className="text-[10px] font-semibold text-[#1a1557]/70 whitespace-nowrap">
                    sem {m.week}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "peso" && (
        <div className="space-y-3">
          {/* Cards de detalhamento */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#1a1557] text-white p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#f0c040]/90 font-semibold">
                Peso atual
              </p>
              <p className="font-display text-xl leading-tight mt-1">
                {pesoUltimo ? pesoUltimo.peso : "—"}
                <span className="text-[10px] font-normal text-white/60"> kg</span>
              </p>
              <p className="text-[9px] text-white/60 mt-0.5">
                {pesoInicial ? `inicial ${pesoInicial.peso} kg` : "sem registro"}
              </p>
            </div>

            <div className="rounded-xl bg-white border border-[#1a1557]/10 p-3">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                Ganho total
              </p>
              <p className="font-display text-xl leading-tight mt-1 text-[#1a1557]">
                {ganhoTotal !== null ? (ganhoTotal >= 0 ? "+" : "") + ganhoTotal.toFixed(1) : "—"}
                <span className="text-[10px] font-normal text-muted-foreground"> kg</span>
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {ganhoRecomendado
                  ? `meta ${ganhoRecomendado.min}–${ganhoRecomendado.max} kg`
                  : "informe altura"}
              </p>
            </div>

            <div className="rounded-xl bg-white border border-[#1a1557]/10 p-3">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                IMC atual
              </p>
              <p className="font-display text-xl leading-tight mt-1 text-[#1a1557]">
                {imcAtual ? imcAtual.toFixed(1) : "—"}
              </p>
              <p
                className="text-[9px] mt-0.5 font-semibold"
                style={{ color: imcAtual ? classificaIMC(imcAtual).color : undefined }}
              >
                {imcAtual ? classificaIMC(imcAtual).label : "altura ausente"}
              </p>
            </div>
          </div>

          {/* Barra de progresso do ganho vs. meta */}
          {ganhoRecomendado && ganhoTotal !== null && (
            <div className="rounded-xl bg-[#faf8f3] border border-[#1a1557]/10 p-3">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-[11px] font-semibold text-[#1a1557]">
                  Ganho recomendado · {ganhoRecomendado.categoria}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {ganhoRecomendado.min}–{ganhoRecomendado.max} kg
                </p>
              </div>
              <div className="relative h-2 bg-[#1a1557]/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 bg-[#1a1557]/20"
                  style={{
                    left: `${(ganhoRecomendado.min / (ganhoRecomendado.max * 1.4)) * 100}%`,
                    width: `${((ganhoRecomendado.max - ganhoRecomendado.min) / (ganhoRecomendado.max * 1.4)) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-[-2px] h-3 w-1 rounded bg-[#f0c040] shadow"
                  style={{
                    left: `calc(${Math.min(100, (Math.max(0, ganhoTotal) / (ganhoRecomendado.max * 1.4)) * 100)}% - 2px)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                <span>0 kg</span>
                <span className="font-semibold text-[#1a1557]">
                  você: {ganhoTotal >= 0 ? "+" : ""}{ganhoTotal.toFixed(1)} kg
                </span>
                <span>{(ganhoRecomendado.max * 1.4).toFixed(0)} kg</span>
              </div>
              {imcInicial && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  IMC pré-gestacional: <strong className="text-[#1a1557]">{imcInicial.toFixed(1)}</strong>{" "}
                  · altura {alturaM ? `${(alturaM * 100).toFixed(0)} cm` : "—"}
                </p>
              )}
            </div>
          )}

          {!alturaM && (
            <p className="text-[10px] text-center text-muted-foreground italic">
              Cadastre sua altura nos dados clínicos para ver IMC e meta de ganho.
            </p>
          )}

        <div className="rounded-xl bg-white border border-[#1a1557]/10 p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="font-display text-sm text-[#1a1557]">Evolução do peso</p>
              <p className="text-[10px] text-muted-foreground">kg por semana gestacional</p>
            </div>
            {pesoUltimo && (
              <p className="font-display text-xl text-[#1a1557]">
                {pesoUltimo.peso}
                <span className="text-xs font-normal text-muted-foreground"> kg</span>
              </p>
            )}
          </div>
          {pesos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Nenhuma medição de peso registrada ainda.
            </p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={pesoSeries} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10 }} interval={6} />
                  <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v: any, name: any) => {
                      if (v === null) return ["—", name];
                      if (name === "faixaMin" || name === "faixaRange") return null as never;
                      return [`${v} kg`, name === "peso" ? "Peso" : "Projeção"];
                    }}
                    labelFormatter={(l) => `Semana ${l}`}
                  />
                  <Area dataKey="faixaMin" stackId="faixa" stroke="none" fill="transparent" />
                  <Area
                    dataKey="faixaRange"
                    stackId="faixa"
                    stroke="none"
                    fill={NAVY}
                    fillOpacity={0.12}
                    name="Faixa esperada"
                  />
                  <Line
                    type="monotone"
                    dataKey="projecao"
                    stroke={GOLD}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Projeção"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke={NAVY}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: NAVY }}
                    name="Peso"
                    connectNulls
                  />
                  <ReferenceLine x={semanaAtual} stroke={GOLD} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#1a1557]" /> Medido</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#f0c040]" style={{borderTop:'1px dashed #f0c040'}} /> Projeção</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#1a1557]/15" /> Faixa esperada</span>
          </div>
        </div>
      )}

      {tab === "pressao" && (
        <div className="rounded-xl bg-white border border-[#1a1557]/10 p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="font-display text-sm text-[#1a1557]">Pressão arterial</p>
              <p className="text-[10px] text-muted-foreground">mmHg por semana gestacional</p>
            </div>
            {sistMap.size > 0 && (
              <p className="font-display text-xl text-[#1a1557]">
                {Array.from(sistMap.values()).pop()}/{Array.from(diasMap.values()).pop() ?? "—"}
              </p>
            )}
          </div>
          {sistMap.size === 0 && diasMap.size === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Nenhuma aferição de pressão registrada ainda.
            </p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paSeries} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                  <XAxis dataKey="semana" tick={{ fontSize: 10 }} interval={6} />
                  <YAxis tick={{ fontSize: 10 }} domain={[50, 140]} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(v: any, name: any) => {
                      if (
                        name === "sistMin" ||
                        name === "sistRange" ||
                        name === "diasMin" ||
                        name === "diasRange"
                      )
                        return null as never;
                      if (v === null) return ["—", name];
                      return [`${v}`, name === "sistolica" ? "Sistólica" : "Diastólica"];
                    }}
                    labelFormatter={(l) => `Semana ${l}`}
                  />
                  <Area dataKey="sistMin" stackId="sist" stroke="none" fill="transparent" />
                  <Area
                    dataKey="sistRange"
                    stackId="sist"
                    stroke="none"
                    fill={NAVY}
                    fillOpacity={0.08}
                  />
                  <Area dataKey="diasMin" stackId="dias" stroke="none" fill="transparent" />
                  <Area
                    dataKey="diasRange"
                    stackId="dias"
                    stroke="none"
                    fill={GOLD}
                    fillOpacity={0.12}
                  />
                  <Line
                    type="monotone"
                    dataKey="sistolica"
                    stroke={NAVY}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: NAVY }}
                    name="Sistólica"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolica"
                    stroke={GOLD}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: GOLD }}
                    name="Diastólica"
                    connectNulls
                  />
                  <ReferenceLine x={semanaAtual} stroke={GOLD} strokeWidth={1.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#1a1557]" /> Sistólica</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#f0c040]" /> Diastólica</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-[#1a1557]/10" /> Faixa normal</span>
          </div>
        </div>
      )}

      {loading && <p className="text-[10px] text-muted-foreground text-center">Carregando medições…</p>}
    </div>
  );
}
