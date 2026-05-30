import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PregnancyTimeline } from "@/components/PregnancyTimeline";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidCard } from "@/components/LiquidCard";
import { supabase } from "@/integrations/supabase/client";
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

const NAVY = "#1a1557";
const GOLD = "#f0c040";

type Medicao = { parametro: string; valor: number; data_medicao: string };

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return (
      <div className="h-10 flex items-center text-[10px] text-muted-foreground/70">
        Sem histórico suficiente
      </div>
    );
  }
  const w = 220;
  const h = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 6) - 3}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PregnancyTimelinePreview({ userId, dum, cadastroISO }: Props) {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [pesos, setPesos] = useState<Medicao[]>([]);
  const [sist, setSist] = useState<Medicao[]>([]);
  const [dias, setDias] = useState<Medicao[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("clinical_measurements")
        .select("parametro,valor,data_medicao")
        .eq("gestante_id", userId)
        .in("parametro", ["peso", "Peso", "pa_sistolica", "pa_diastolica"])
        .order("data_medicao", { ascending: true });
      if (!active || !data) return;
      const all = data as Medicao[];
      setPesos(all.filter((m) => m.parametro === "peso" || m.parametro === "Peso"));
      setSist(all.filter((m) => m.parametro === "pa_sistolica"));
      setDias(all.filter((m) => m.parametro === "pa_diastolica"));
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % 3), 5500);
    return () => clearInterval(id);
  }, []);

  const dumDate = parseDate(dum);

  const cronograma = (() => {
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

    return (
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-light leading-none text-[#1a1557]">
              {semanaAtual}
            </span>
            <span className="text-sm text-muted-foreground font-light">/ 40 sem</span>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              {trimestre}º trimestre
            </span>
            <p className="text-[10px] text-muted-foreground">DPP {formatBRDate(dpp)}</p>
          </div>
        </div>
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
          <div className="flex justify-between text-[9px] text-muted-foreground/70 mt-1.5 uppercase tracking-wider">
            <span>DUM</span>
            <span>DPP</span>
          </div>
        </div>
      </div>
    );
  })();

  const pesoSlide = (() => {
    const last = pesos[pesos.length - 1];
    const first = pesos[0];
    const delta = last && first ? last.valor - first.valor : null;
    return (
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-light leading-none text-[#1a1557]">
              {last ? last.valor.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-muted-foreground font-light">kg</span>
          </div>
          <div className="text-right">
            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              Peso
            </span>
            {delta !== null && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {delta >= 0 ? "+" : ""}
                {delta.toFixed(1)} kg na gestação
              </p>
            )}
          </div>
        </div>
        <Sparkline values={pesos.map((m) => m.valor)} color={NAVY} />
        <p className="text-[10px] text-muted-foreground/80">
          {pesos.length} {pesos.length === 1 ? "registro" : "registros"}
        </p>
      </div>
    );
  })();

  const pressaoSlide = (() => {
    const lastS = sist[sist.length - 1];
    const lastD = dias[dias.length - 1];
    return (
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-light leading-none text-[#1a1557]">
              {lastS ? Math.round(lastS.valor) : "—"}
            </span>
            <span className="font-display text-2xl font-light text-[#1a1557]/60">/</span>
            <span className="font-display text-4xl font-light leading-none text-[#1a1557]">
              {lastD ? Math.round(lastD.valor) : "—"}
            </span>
            <span className="text-xs text-muted-foreground font-light ml-1">mmHg</span>
          </div>
          <div className="text-right">
            <span className="inline-block text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#f0c040]/15 text-[#a87a10]">
              Pressão
            </span>
            <p className="text-[10px] text-muted-foreground mt-1">
              {sist.length} {sist.length === 1 ? "aferição" : "aferições"}
            </p>
          </div>
        </div>
        <div className="space-y-0.5">
          <Sparkline values={sist.map((m) => m.valor)} color="#ef4444" />
          <Sparkline values={dias.map((m) => m.valor)} color="#3b82f6" />
        </div>
      </div>
    );
  })();

  const slides = [
    { label: "Cronograma", body: cronograma },
    { label: "Peso", body: pesoSlide },
    { label: "Pressão", body: pressaoSlide },
  ];

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.985 }}
        className="block w-full text-left group relative"
      >
        <LiquidCard className="px-4 py-3.5" bgOpacity={0.28}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-display font-medium text-lg text-[#1a1557] leading-tight">
                Sua jornada
              </h3>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#1a1557]/50 font-semibold">
                {slides[slide].label}
              </span>
            </div>
            <span className="text-[#1a1557] text-xl leading-none transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          </div>

          <div className="relative min-h-[110px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {slides[slide].body}
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="flex justify-center gap-1.5 mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            {slides.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSlide(i)}
                aria-label={`Ir para ${s.label}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-6 bg-[#1a1557]" : "w-1.5 bg-[#1a1557]/25"
                }`}
              />
            ))}
          </div>
        </LiquidCard>
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
