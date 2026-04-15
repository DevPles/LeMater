import { createFileRoute } from "@tanstack/react-router";
import { Play, Clock, User, Stethoscope, Salad, Dumbbell, Heart, Baby, Flower2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Vídeos Educativos — MãeDigital" },
      { name: "description", content: "Assista vídeos de enfermeiros e médicos sobre sua gestação." },
    ],
  }),
  component: VideosPage,
});

const categories = ["Todos", "Nutrição", "Exercícios", "Parto", "Amamentação", "Pós-parto"];

const videos = [
  {
    id: 1,
    title: "Preparação para o parto normal",
    author: "Dra. Ana Costa",
    role: "Obstetra",
    duration: "12:30",
    category: "Parto",
    icon: Stethoscope,
    gradient: "from-coral-light to-blush",
  },
  {
    id: 2,
    title: "Alimentação saudável no 2º trimestre",
    author: "Enf. Carlos Silva",
    role: "Enfermeiro Obstétrico",
    duration: "8:45",
    category: "Nutrição",
    icon: Salad,
    gradient: "from-mint-light to-warm",
  },
  {
    id: 3,
    title: "Exercícios seguros na gestação",
    author: "Dra. Beatriz Mendes",
    role: "Fisioterapeuta",
    duration: "15:20",
    category: "Exercícios",
    icon: Dumbbell,
    gradient: "from-warm to-coral-light",
  },
  {
    id: 4,
    title: "Primeiros cuidados com a amamentação",
    author: "Enf. Paula Rocha",
    role: "Enfermeira Obstétrica",
    duration: "10:15",
    category: "Amamentação",
    icon: Heart,
    gradient: "from-blush to-coral-light",
  },
  {
    id: 5,
    title: "Sinais de alerta no terceiro trimestre",
    author: "Dr. Roberto Lima",
    role: "Obstetra",
    duration: "7:50",
    category: "Parto",
    icon: Baby,
    gradient: "from-mint-light to-blush",
  },
  {
    id: 6,
    title: "Recuperação no pós-parto",
    author: "Dra. Fernanda Reis",
    role: "Obstetra",
    duration: "11:00",
    category: "Pós-parto",
    icon: Flower2,
    gradient: "from-coral-light to-mint-light",
  },
];

function VideosPage() {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">
          Vídeos Educativos
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Conteúdo de profissionais para tirar suas dúvidas
        </p>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {videos.map((video, i) => {
          const IconComp = video.icon;
          return (
            <motion.div
              key={video.id}
              className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`h-36 bg-gradient-to-br ${video.gradient} flex items-center justify-center relative`}>
                <IconComp className="w-12 h-12 text-foreground/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-foreground/70 text-primary-foreground text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {video.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-foreground">{video.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{video.author}</p>
                    <p className="text-xs text-muted-foreground">{video.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
