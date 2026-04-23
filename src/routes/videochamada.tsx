import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { LiquidCard } from "@/components/LiquidCard";
import { useScreenContent } from "@/hooks/useScreenContent";
import { VIDEOCHAMADA_DEFAULT } from "@/components/admin/TelasTab";


export const Route = createFileRoute("/videochamada")({
  head: () => ({
    meta: [
      { title: "Agendamentos — MãeDigital" },
      { name: "description", content: "Seus agendamentos confirmados com profissionais de saúde." },
    ],
  }),
  component: AgendamentosPage,
});

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  confirmado: { label: "Confirmado", bg: "bg-green-100", text: "text-green-700" },
  pendente: { label: "Pendente", bg: "bg-yellow-100", text: "text-yellow-700" },
  realizado: { label: "Realizado", bg: "bg-muted", text: "text-muted-foreground" },
};

function AgendamentosPage() {
  const { content } = useScreenContent("videochamada", VIDEOCHAMADA_DEFAULT);
  const agendamentos = content.agendamentos;
  const [filtro, setFiltro] = useState<"todos" | "confirmado" | "pendente" | "realizado">("todos");

  const filtered = filtro === "todos" ? agendamentos : agendamentos.filter(a => a.status === filtro);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">{content.pageTitle}</h1>
        <p className="text-sm text-muted-foreground mb-4">{content.pageSubtitle}</p>
      </motion.div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(["todos", "confirmado", "pendente", "realizado"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filtro === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "todos" ? "Todos" : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((ag, i) => {
          const initials = ag.profissional.split(" ").map(n => n[0]).join("").slice(0, 2);
          const sc = statusConfig[ag.status];
          return (
            <motion.div
              key={ag.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <LiquidCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate">{ag.profissional}</h4>
                  <p className="text-xs text-muted-foreground">{ag.especialidade}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{ag.data} às {ag.horario}</span>
                    <span className="text-xs text-muted-foreground">• {ag.tipo === "videochamada" ? "Vídeo" : "Presencial"}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                  {sc.label}
                </span>
              </div>
              </LiquidCard>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhum agendamento encontrado</p>
        )}
      </div>

      
    </div>
  );
}
