import { motion } from "framer-motion";

interface WeekProgressProps {
  currentWeek: number;
  totalWeeks?: number;
}

export function WeekProgress({ currentWeek, totalWeeks = 40 }: WeekProgressProps) {
  const progress = (currentWeek / totalWeeks) * 100;
  const trimester =
    currentWeek <= 13 ? "1º Trimestre" : currentWeek <= 26 ? "2º Trimestre" : "3º Trimestre";

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground">{trimester}</p>
          <h2 className="text-3xl font-bold font-display text-foreground">
            Semana {currentWeek}
          </h2>
        </div>
        <div className="w-16 h-16 rounded-full bg-coral-light flex items-center justify-center">
          <span className="text-2xl">🤰</span>
        </div>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-coral"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {totalWeeks - currentWeek} semanas restantes
      </p>
    </div>
  );
}
