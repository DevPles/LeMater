import { useEffect, useState } from "react";
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
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { LiquidCard } from "@/components/LiquidCard";
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

export function PregnancyTimeline({ userId, dum, cadastroISO }: Props) {
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("clinical_measurements")
        .select("parametro,valor,data_medicao,semana_gestacional")
        .eq("gestante_id", userId)
        .in("parametro", ["peso", "pa_sistolica", "pa_diastolica"])
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
      <LiquidCard className="p-5" bgOpacity={0.85}>
        <h3 className="font-display font-semibold text-lg text-foreground">Meu cronograma</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Cadastre sua DUM no perfil para visualizar a linha do tempo da gestação.
        </p>
      </LiquidCard>
    );
  }

  const dpp = addDays(dumDate, GESTATION_DAYS);
  const hoje = new Date();
  const semanaAtualNum = Math.max(0, Math.min(GESTATION_WEEKS, weeksBetween(dumDate, hoje)));
  const semanaAtual = Math.floor(semanaAtualNum);
  const trimestre = trimesterOfWeek(semanaAtual);

  const cadastroDate = parseDate(cadastroISO);
  const semanaCadastro = cadastroDate
    ? Math.max(0, Math.min(GESTATION_WEEKS, weeksBetween(dumDate, cadastroDate)))
    : null;

  // Peso
  const pesos = medicoes
    .filter((m) => m.parametro === "peso")
    .map((m) => ({
      semana: m.semana_gestacional ?? Math.round(weeksBetween(dumDate, new Date(m.data_medicao))),
      peso: Number(m.valor),
    }))
    .filter((p) => p.semana >= 0 && p.semana <= GESTATION_WEEKS)
    .sort((a, b) => a.semana - b.semana);

  const pesoInicial = pesos[0];
  const pesoUltimo = pesos[pesos.length - 1];

  const pesoSeries = Array.from({ length: GESTATION_WEEKS + 1 }, (_, w) => {
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
      // Projeção a partir da última medição até DPP
      projecao:
        pesoUltimo && w >= pesoUltimo.semana
          ? Number(
              (
                pesoUltimo.peso +
                (w - pesoUltimo.semana) * (trimestre === 1 ? 0.15 : 0.42)
              ).toFixed(2)
            )
          : null,
    };
  });

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

  return (
    <LiquidCard className="p-5 space-y-5" bgOpacity={0.85}>
      <div>
        <h3 className="font-display font-semibold text-lg text-foreground">Meu cronograma</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Semana {semanaAtual} de {GESTATION_WEEKS} · {trimestre}º trimestre · DPP {formatBRDate(dpp)}
        </p>
      </div>

      {/* Gantt de trimestres */}
      <div>
        <div className="relative h-10 rounded-lg overflow-hidden border border-black/5">
          <div className="absolute inset-y-0 left-0 bg-[#e8e6f2]" style={{ width: `${(13 / GESTATION_WEEKS) * 100}%` }}>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[#1a1557]">1º T</span>
          </div>
          <div
            className="absolute inset-y-0 bg-[#d9d5ea]"
            style={{ left: `${(13 / GESTATION_WEEKS) * 100}%`, width: `${(14 / GESTATION_WEEKS) * 100}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[#1a1557]">2º T</span>
          </div>
          <div
            className="absolute inset-y-0 bg-[#c4bedf]"
            style={{ left: `${(27 / GESTATION_WEEKS) * 100}%`, right: 0 }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[#1a1557]">3º T</span>
          </div>

          {semanaCadastro !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-[#1a1557]/40"
              style={{ left: `${(semanaCadastro / GESTATION_WEEKS) * 100}%` }}
              title="Cadastro"
            />
          )}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#f0c040]"
            style={{ left: `${(semanaAtualNum / GESTATION_WEEKS) * 100}%` }}
            title="Hoje"
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>DUM {formatBRDate(dumDate)}</span>
          <span className="font-semibold text-[#1a1557]">Hoje · sem {semanaAtual}</span>
          <span>DPP {formatBRDate(dpp)}</span>
        </div>
      </div>

      {/* Peso */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Peso (kg)</h4>
        {pesos.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma medição de peso registrada ainda.
          </p>
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={pesoSeries} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} interval={6} />
                <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: number | null, name: string) => {
                    if (v === null) return ["—", name];
                    if (name === "faixaMin" || name === "faixaRange") return null as never;
                    return [`${v} kg`, name === "peso" ? "Peso" : "Projeção"];
                  }}
                  labelFormatter={(l) => `Semana ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="faixaMin"
                  stackId="faixa"
                  stroke="none"
                  fill="transparent"
                  legendType="none"
                />
                <Area
                  type="monotone"
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
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* PA */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">Pressão arterial (mmHg)</h4>
        {sistMap.size === 0 && diasMap.size === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma aferição de pressão registrada ainda.
          </p>
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paSeries} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="semana" tick={{ fontSize: 10 }} interval={6} />
                <YAxis tick={{ fontSize: 10 }} domain={[50, 140]} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: number | null, name: string) => {
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
                <Area dataKey="sistMin" stackId="sist" stroke="none" fill="transparent" legendType="none" />
                <Area
                  dataKey="sistRange"
                  stackId="sist"
                  stroke="none"
                  fill={NAVY}
                  fillOpacity={0.08}
                  name="Sistólica normal"
                />
                <Area dataKey="diasMin" stackId="dias" stroke="none" fill="transparent" legendType="none" />
                <Area
                  dataKey="diasRange"
                  stackId="dias"
                  stroke="none"
                  fill={GOLD}
                  fillOpacity={0.12}
                  name="Diastólica normal"
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
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {loading && <p className="text-[10px] text-muted-foreground">Carregando medições…</p>}
    </LiquidCard>
  );
}
