import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { LiquidCard } from "@/components/LiquidCard";

interface WeekProgressProps {
  currentWeek: number;
  totalWeeks?: number;
}

export function WeekProgress({ currentWeek, totalWeeks = 40 }: WeekProgressProps) {
  const progress = (currentWeek / totalWeeks) * 100;
  const trimester =
    currentWeek <= 13 ? "1º Trimestre" : currentWeek <= 26 ? "2º Trimestre" : "3º Trimestre";

  return (
    <Link to="/app/gestacao" className="block transition-transform hover:scale-[1.01]">
      <LiquidCard className="p-5" bgOpacity={0.12}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{trimester}</p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Semana {currentWeek}
            </h2>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="font-display text-2xl font-bold text-primary">
              {currentWeek}
            </span>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-coral"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {totalWeeks - currentWeek} semanas restantes
        </p>
        <div className="mt-3 flex justify-start">
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 h-8 shadow-sm hover:bg-primary/90 transition-colors">
            Ver todos os Trimestres
          </span>
        </div>
      </LiquidCard>
    </Link>
  );
}
