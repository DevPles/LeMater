import { useState } from "react";
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

const NAVY = "#1a1557";
const GOLD = "#f0c040";

export function PregnancyTimelinePreview({ userId, dum, cadastroISO }: Props) {
  const [open, setOpen] = useState(false);

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
