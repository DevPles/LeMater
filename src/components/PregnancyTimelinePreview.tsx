import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PregnancyTimeline } from "@/components/PregnancyTimeline";
import { motion } from "framer-motion";
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

  const body = (() => {
    if (!dumDate) {
      return (
        <p className="text-xs text-muted-foreground">
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
    const progresso = (semanaAtualNum / GESTATION_WEEKS) * 100;

    const pesoData = medicoes
      .filter((m) => m.parametro === "peso")
      .map((m) => ({ v: Number(m.valor) }));

    const sistData = medicoes
      .filter((m) => m.parametro === "pa_sistolica")
      .map((m) => ({ v: Number(m.valor) }));

    const pesoUltimo = pesoData.at(-1)?.v;
    const pesoPrimeiro = pesoData[0]?.v;
    const pesoDelta =
      pesoUltimo != null && pesoPrimeiro != null ? pesoUltimo - pesoPrimeiro : null;
    const sistUltimo = sistData.at(-1)?.v;

    return (
      <div className="space-y-5">
        {/* Hero: semana grande */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Semana
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display text-6xl font-light leading-none text-[#1a1557]">
                {semanaAtual}
              </span>
              <span className="text-base text-muted-foreground font-light">/ 40</span>
            </div>
          </div>
          <div className="text-right space-y-1">
            <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              {trimestre}º trimestre
            </span>
            <p className="text-[10px] text-muted-foreground">DPP {formatBRDate(dpp)}</p>
          </div>
        </div>

        {/* Progresso slim com gradiente */}
        <div>
          <div className="relative h-1.5 rounded-full bg-[#1a1557]/10 overflow-visible">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progresso}%` }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: `linear-gradient(90deg, ${NAVY}, ${GOLD})` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border-2"
              style={{ left: `calc(${progresso}% - 6px)`, borderColor: GOLD }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/70 mt-2 uppercase tracking-wider">
            <span>DUM</span>
            <span>DPP</span>
          </div>
        </div>

        {/* Stats com sparkline embutido */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Peso"
            value={pesoUltimo != null ? pesoUltimo.toFixed(1) : "—"}
            unit="kg"
            delta={
              pesoDelta != null
                ? `${pesoDelta >= 0 ? "+" : ""}${pesoDelta.toFixed(1)}kg`
                : null
            }
            data={pesoData}
            color={NAVY}
            gradId="pesoGrad"
          />
          <StatTile
            label="Pressão"
            value={sistUltimo != null ? String(sistUltimo) : "—"}
            unit="mmHg"
            delta={null}
            data={sistData}
            color={GOLD}
            gradId="paGrad"
          />
        </div>
      </div>
    );
  })();

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.985 }}
        className="block w-full text-left group relative overflow-hidden rounded-3xl p-5"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #faf8f3 100%)",
          boxShadow:
            "0 1px 0 0 rgba(255,255,255,0.9) inset, 0 20px 40px -24px rgba(26,21,87,0.18), 0 4px 12px -6px rgba(26,21,87,0.08)",
          border: "1px solid rgba(26,21,87,0.06)",
        }}
      >
        {/* Decoração orgânica */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, #f0c04055 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-20 -left-12 w-44 h-44 rounded-full opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle, #1a155722 0%, transparent 70%)" }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#1a1557]/60 font-semibold">
                Cronograma
              </span>
              <h3 className="font-display font-medium text-2xl text-[#1a1557] leading-tight mt-0.5">
                Sua jornada
              </h3>
            </div>
            <span className="text-[#1a1557] text-2xl leading-none transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          </div>
          {body}
        </div>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Meu cronograma</DialogTitle>
          </DialogHeader>
          <PregnancyTimeline userId={userId} dum={dum} cadastroISO={cadastroISO} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatTile({
  label,
  value,
  unit,
  delta,
  data,
  color,
  gradId,
}: {
  label: string;
  value: string;
  unit: string;
  delta: string | null;
  data: { v: number }[];
  color: string;
  gradId: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-3 overflow-hidden min-h-[88px]"
      style={{
        background: "rgba(255,255,255,0.65)",
        border: "1px solid rgba(26,21,87,0.05)",
      }}
    >
      <div className="relative z-10">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-display text-2xl font-light text-[#1a1557] leading-none">
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
        {delta && (
          <span className="text-[9px] text-muted-foreground font-medium">{delta}</span>
        )}
      </div>
      {data.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 h-10 opacity-90 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
