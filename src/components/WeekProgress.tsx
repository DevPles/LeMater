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
      className="relative isolate block overflow-hidden rounded-3xl border p-5 transition-shadow hover:shadow-lg"
      style={{
        background:
          "linear-gradient(180deg, oklch(1 0 0 / 0.55) 0%, oklch(1 0 0 / 0.25) 100%)",
        borderColor: "oklch(1 0 0 / 0.6)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        backdropFilter: "blur(28px) saturate(180%)",
        boxShadow:
          "0 20px 40px -24px color-mix(in oklab, var(--foreground) 22%, transparent), 0 8px 18px -14px color-mix(in oklab, var(--foreground) 14%, transparent), inset 0 1px 0 0 oklch(1 0 0 / 0.85), inset 0 -1px 0 0 oklch(1 0 0 / 0.18)",
      }}
    >
      {/* Liquid droplets / refraction layers */}
      <div
        className="pointer-events-none absolute -top-10 -left-6 h-24 w-32 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, oklch(1 0 0 / 0.7) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 right-4 h-20 w-28 rounded-full opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.92 0.05 25 / 0.6) 0%, transparent 70%)",
        }}
      />
      {/* Glossy top edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.95), transparent)",
        }}
      />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{trimester}</p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Semana {currentWeek}
            </h2>
          </div>
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border"
            style={{
              background:
                "linear-gradient(180deg, oklch(1 0 0 / 0.7) 0%, oklch(0.92 0.05 25 / 0.35) 100%)",
              borderColor: "oklch(1 0 0 / 0.7)",
              WebkitBackdropFilter: "blur(12px) saturate(160%)",
              backdropFilter: "blur(12px) saturate(160%)",
              boxShadow:
                "inset 0 1px 0 0 oklch(1 0 0 / 0.9), inset 0 -1px 0 0 oklch(1 0 0 / 0.2)",
            }}
          >
            <span className="font-display text-2xl font-bold text-primary">
              {currentWeek}
            </span>
          </div>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full"
          style={{
            background: "oklch(1 0 0 / 0.35)",
            boxShadow: "inset 0 1px 2px oklch(0 0 0 / 0.06)",
          }}
        >
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
        <p className="mt-3 text-xs font-medium text-primary">
          Ver todos os trimestres →
        </p>
      </div>
    </Link>
  );
}
