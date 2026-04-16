import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/videochamada")({
  head: () => ({
    meta: [
      { title: "Videochamada — MãeDigital" },
      { name: "description", content: "Agende uma videochamada com profissionais de saúde." },
    ],
  }),
  component: VideochamadaPage,
});

const professionals = [
  { id: 1, name: "Dra. Ana Costa", specialty: "Obstetra", rating: 4.9, available: true, nextSlot: "Hoje, 14:00" },
  { id: 2, name: "Enf. Carlos Silva", specialty: "Enfermeiro Obstétrico", rating: 4.8, available: true, nextSlot: "Hoje, 16:30" },
  { id: 3, name: "Dra. Beatriz Mendes", specialty: "Fisioterapeuta Pélvica", rating: 5.0, available: false, nextSlot: "Amanhã, 09:00" },
  { id: 4, name: "Enf. Paula Rocha", specialty: "Enfermeira Obstétrica", rating: 4.7, available: true, nextSlot: "Hoje, 18:00" },
];

function VideochamadaPage() {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Videochamada</h1>
        <p className="text-sm text-muted-foreground mb-5">Converse com profissionais de saúde pelo vídeo</p>
      </motion.div>

      <motion.div
        className="bg-gradient-to-br from-primary to-coral rounded-2xl p-5 mb-6 text-primary-foreground"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2 className="font-display font-semibold text-lg mb-2">Consulta Rápida</h2>
        <p className="text-sm opacity-90 mb-4">Tire dúvidas urgentes com um profissional disponível agora</p>
        <button className="bg-primary-foreground text-primary font-semibold text-sm px-5 py-2.5 rounded-xl">
          Iniciar agora
        </button>
      </motion.div>

      <h3 className="font-display font-semibold text-lg text-foreground mb-4">Profissionais disponíveis</h3>

      <div className="space-y-3">
        {professionals.map((prof, i) => {
          const initials = prof.name.split(" ").map(n => n[0]).join("").slice(0, 2);
          return (
            <motion.div
              key={prof.id}
              className="bg-card rounded-2xl p-4 shadow-sm border border-border"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-coral-light flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{initials}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground">{prof.name}</h4>
                  <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-foreground">★ {prof.rating}</span>
                    <span className="text-xs text-muted-foreground">• {prof.nextSlot}</span>
                  </div>
                </div>
                <button
                  className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                    prof.available
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {prof.available ? "Chamar" : "Agendar"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
