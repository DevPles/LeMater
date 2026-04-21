import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

interface WeekProgressProps {
  currentWeek: number;
  totalWeeks?: number;
}

export function WeekProgress({ currentWeek, totalWeeks = 40 }: WeekProgressProps) {
  const progress = (currentWeek / totalWeeks) * 100;
  const trimester =
    currentWeek <= 13 ? "1º Trimestre" : currentWeek <= 26 ? "2º Trimestre" : "3º Trimestre";

  return (
    <Link
      to="/gestacao"
      className="block bg-card rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground">{trimester}</p>
          <h2 className="text-3xl font-bold font-display text-foreground">
            Semana {currentWeek}
          </h2>
        </div>
        <div className="w-16 h-16 rounded-full bg-coral-light flex items-center justify-center">
          <span className="text-2xl font-bold text-primary font-display">{currentWeek}</span>
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
      <p className="text-xs text-primary font-medium mt-3">
        Ver todos os trimestres →
      </p>
    </Link>
  );
}
