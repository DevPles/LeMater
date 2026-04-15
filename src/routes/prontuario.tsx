import { createFileRoute } from "@tanstack/react-router";
import { Activity, Droplets, Weight, Heart, Milestone, Scan, Syringe, Clipboard, Stethoscope, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/prontuario")({
  head: () => ({
    meta: [
      { title: "Prontuário — MãeDigital" },
      { name: "description", content: "Acompanhe o prontuário da gestação e evolução do parto." },
    ],
  }),
  component: ProntuarioPage,
});

const patientInfo = {
  name: "Maria Silva",
  age: 28,
  bloodType: "O+",
  dpp: "15/07/2026",
  weeks: 24,
};

const vitals = [
  { icon: Weight, label: "Peso", value: "68,5 kg", change: "+2,1 kg", color: "bg-coral-light text-primary" },
  { icon: Activity, label: "Pressão", value: "110/70", change: "Normal", color: "bg-mint-light text-accent-foreground" },
  { icon: Droplets, label: "Glicemia", value: "85 mg/dL", change: "Normal", color: "bg-warm text-foreground" },
  { icon: Heart, label: "BCF", value: "142 bpm", change: "Normal", color: "bg-blush text-foreground" },
];

const timelineIcons: Record<string, React.ElementType> = {
  "Consulta pré-natal": Stethoscope,
  "Ultrassom morfológico": Scan,
  "1º Ultrassom": Scan,
  "Próxima consulta": CalendarDays,
};

const timeline = [
  { week: 24, date: "10/04/2026", event: "Consulta pré-natal", notes: "Peso e pressão normais. Ultrassom sem alterações.", status: "done" },
  { week: 22, date: "27/03/2026", event: "Ultrassom morfológico", notes: "Desenvolvimento normal. Peso fetal 500g.", status: "done" },
  { week: 20, date: "13/03/2026", event: "Consulta pré-natal", notes: "Hemograma e glicemia em jejum solicitados.", status: "done" },
  { week: 16, date: "13/02/2026", event: "Consulta pré-natal", notes: "Início da suplementação de ferro.", status: "done" },
  { week: 12, date: "16/01/2026", event: "1º Ultrassom", notes: "Batimento cardíaco confirmado. Translucência nucal normal.", status: "done" },
  { week: 28, date: "08/05/2026", event: "Próxima consulta", notes: "Teste de tolerância à glicose agendado.", status: "upcoming" },
];

function ProntuarioPage() {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">
          Prontuário
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Evolução da gestação
        </p>
      </motion.div>

      {/* Patient Card */}
      <motion.div
        className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-coral-light flex items-center justify-center">
            <Clipboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{patientInfo.name}</h2>
            <p className="text-xs text-muted-foreground">
              {patientInfo.age} anos • Tipo sanguíneo: {patientInfo.bloodType}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-muted rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-muted-foreground">Semana</p>
            <p className="font-bold text-foreground">{patientInfo.weeks}</p>
          </div>
          <div className="bg-muted rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-xs text-muted-foreground">DPP</p>
            <p className="font-bold text-foreground text-sm">{patientInfo.dpp}</p>
          </div>
        </div>
      </motion.div>

      {/* Vitals */}
      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Sinais vitais</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {vitals.map((v, i) => (
          <motion.div
            key={v.label}
            className="bg-card rounded-2xl p-4 shadow-sm border border-border"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className={`w-8 h-8 rounded-lg ${v.color} flex items-center justify-center mb-2`}>
              <v.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-muted-foreground">{v.label}</p>
            <p className="font-bold text-foreground">{v.value}</p>
            <p className="text-xs text-accent-foreground font-medium">{v.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Timeline */}
      <h3 className="font-display font-semibold text-lg text-foreground mb-3">Linha do tempo</h3>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {timeline.map((item, i) => {
            const TimeIcon = timelineIcons[item.event] || Milestone;
            return (
              <motion.div
                key={i}
                className="relative pl-12"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className={`absolute left-3 w-5 h-5 rounded-full flex items-center justify-center ${
                    item.status === "upcoming"
                      ? "bg-primary"
                      : "bg-card border-2 border-border"
                  }`}
                >
                  <TimeIcon className={`w-3 h-3 ${item.status === "upcoming" ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="bg-card rounded-xl p-3 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary">
                      Semana {item.week}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                  <h4 className="font-medium text-sm text-foreground">{item.event}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
