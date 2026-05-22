import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { LiquidCard } from "@/components/LiquidCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PregnancyTimeline } from "@/components/PregnancyTimeline";
import {
  GESTATION_WEEKS,
  GESTATION_DAYS,
  addDays,
  parseDate,
  weeksBetween,
  trimesterOfWeek,
  formatBRDate,
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

export function PregnancyTimelinePreview({ userId, dum, cadastroISO }: Props) {
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [open, setOpen] = useState(false);

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
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const dumDate = parseDate(dum);

  const content = (() => {
    if (!dumDate) {
      return (
        <p className="text-xs text-muted-foreground mt-2">
          Cadastre sua DUM no perfil para visualizar.
        </p>
      );
    }

    const dpp = addDays(dumDate, GESTATION_DAYS);
    const hoje = new Date();
    const semanaAtualNum = Math.max(
      0,
      Math.min(GESTATION_WEEKS, weeksBetween(dumDate, hoje)),
    );
    const semanaAtual = Math.floor(semanaAtualNum);
    const trimestre = trimesterOfWeek(semanaAtual);

    const cadastroDate = parseDate(cadastroISO);
    const semanaCadastro = cadastroDate
      ? Math.max(0, Math.min(GESTATION_WEEKS, weeksBetween(dumDate, cadastroDate)))
      : null;

    const pesoData = medicoes
      .filter((m) => m.parametro === "peso")
      .map((m) => ({ v: Number(m.valor) }));

    const sistData = medicoes
      .filter((m) => m.parametro === "pa_sistolica")
      .map((m) => ({ v: Number(m.valor) }));

    return (
      <div className="mt-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          Semana {semanaAtual} · {trimestre}º trimestre · DPP {formatBRDate(dpp)}
        </p>

        {/* Mini gantt */}
        <div>
          <div className="relative h-3 rounded-full overflow-hidden bg-[#e8e6f2]">
            <div
              className="absolute inset-y-0 left-0 bg-[#d9d5ea]"
              style={{ left: `${(13 / GESTATION_WEEKS) * 100}%`, width: `${(14 / GESTATION_WEEKS) * 100}%` }}
            />
            <div
              className="absolute inset-y-0 bg-[#c4bedf]"
              style={{ left: `${(27 / GESTATION_WEEKS) * 100}%`, right: 0 }}
            />
            {semanaCadastro !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-[#1a1557]/40"
                style={{ left: `${(semanaCadastro / GESTATION_WEEKS) * 100}%` }}
              />
            )}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#f0c040]"
              style={{ left: `${(semanaAtualNum / GESTATION_WEEKS) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>DUM</span>
            <span className="font-semibold text-[#1a1557]">sem {semanaAtual}</span>
            <span>DPP</span>
          </div>
        </div>

        {/* Mini sparklines */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Peso</p>
            <div className="h-10">
              {pesoData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pesoData}>
                    <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={NAVY}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center text-[10px] text-muted-foreground">
                  Sem dados
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Pressão</p>
            <div className="h-10">
              {sistData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sistData}>
                    <YAxis hide domain={[50, 140]} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={GOLD}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center text-[10px] text-muted-foreground">
                  Sem dados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <Link to="/app/cronograma" className="block">
      <LiquidCard
        className="p-5 hover:scale-[1.01] transition-transform"
        bgOpacity={0.85}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Meu cronograma
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Toque para ver os gráficos completos
            </p>
          </div>
          <span className="text-[#1a1557] font-bold text-xl leading-none">›</span>
        </div>
        {content}
      </LiquidCard>
    </Link>
  );
}
