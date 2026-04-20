import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Vídeos Educativos — MãeDigital" },
      { name: "description", content: "Assista vídeos de enfermeiros e médicos sobre sua gestação." },
    ],
  }),
  component: VideosPage,
});

const categories = ["Reels", "Nutrição", "Exercícios", "Parto", "Amamentação", "Pós-parto"];

type Video = {
  id: number;
  title: string;
  author: string;
  role: string;
  duration: string;
  category: string;
  gradient: string;
};

const videos: Video[] = [
  { id: 1, title: "Preparação para o parto normal", author: "Dra. Ana Costa", role: "Obstetra", duration: "12:30", category: "Parto", gradient: "from-coral-light to-blush" },
  { id: 2, title: "Alimentação saudável no 2º trimestre", author: "Enf. Carlos Silva", role: "Enfermeiro Obstétrico", duration: "8:45", category: "Nutrição", gradient: "from-mint-light to-warm" },
  { id: 3, title: "Exercícios seguros na gestação", author: "Dra. Beatriz Mendes", role: "Fisioterapeuta", duration: "15:20", category: "Exercícios", gradient: "from-warm to-coral-light" },
  { id: 4, title: "Primeiros cuidados com a amamentação", author: "Enf. Paula Rocha", role: "Enfermeira Obstétrica", duration: "10:15", category: "Amamentação", gradient: "from-blush to-coral-light" },
  { id: 5, title: "Sinais de alerta no terceiro trimestre", author: "Dr. Roberto Lima", role: "Obstetra", duration: "7:50", category: "Parto", gradient: "from-mint-light to-blush" },
  { id: 6, title: "Recuperação no pós-parto", author: "Dra. Fernanda Reis", role: "Obstetra", duration: "11:00", category: "Pós-parto", gradient: "from-coral-light to-mint-light" },
];

const reels: Video[] = [
  { id: 101, title: "Dica rápida: posições para aliviar dor lombar", author: "Dra. Beatriz Mendes", role: "Fisioterapeuta", duration: "0:45", category: "Reels", gradient: "from-coral-light to-blush" },
  { id: 102, title: "3 lanches saudáveis em 60 segundos", author: "Enf. Carlos Silva", role: "Enfermeiro Obstétrico", duration: "1:00", category: "Reels", gradient: "from-mint-light to-warm" },
  { id: 103, title: "Pega correta na amamentação", author: "Enf. Paula Rocha", role: "Enfermeira Obstétrica", duration: "0:50", category: "Reels", gradient: "from-blush to-coral-light" },
  { id: 104, title: "Respiração para o trabalho de parto", author: "Dra. Ana Costa", role: "Obstetra", duration: "0:55", category: "Reels", gradient: "from-warm to-mint-light" },
];

function VideosPage() {
  const [activeCategory, setActiveCategory] = useState("Reels");
  const [selected, setSelected] = useState<Video | null>(null);
  const [comments, setComments] = useState<Record<number, string[]>>({});
  const [draft, setDraft] = useState("");

  const isReels = activeCategory === "Reels";
  const items = isReels ? reels : videos.filter(v => v.category === activeCategory);

  const submitComment = () => {
    if (!selected || !draft.trim()) return;
    setComments(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), draft.trim()] }));
    setDraft("");
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Vídeos Educativos</h1>
        <p className="text-sm text-muted-foreground mb-5">Conteúdo de profissionais para tirar suas dúvidas</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isReels ? (
        <div className="grid grid-cols-2 gap-3">
          {reels.map((reel, i) => (
            <motion.button
              key={reel.id}
              onClick={() => setSelected(reel)}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-sm border border-border text-left"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${reel.gradient}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
              <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">REEL</span>
              <span className="absolute top-2 right-2 bg-foreground/70 text-primary-foreground text-[10px] px-2 py-0.5 rounded-lg">{reel.duration}</span>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-semibold text-xs text-primary-foreground line-clamp-2">{reel.title}</h3>
                <p className="text-[10px] text-primary-foreground/80 mt-1">{reel.author}</p>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {items.map((video, i) => (
              <motion.button
                key={video.id}
                onClick={() => setSelected(video)}
                layout
                className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border text-left"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`h-24 bg-gradient-to-br ${video.gradient} flex items-center justify-center relative`}>
                  <span className="text-3xl font-bold text-foreground/10 font-display">▶</span>
                  <div className="absolute bottom-2 right-2 bg-foreground/70 text-primary-foreground text-[10px] px-2 py-0.5 rounded-lg">
                    {video.duration}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-xs text-foreground line-clamp-2">{video.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">{video.author}</p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <p className="col-span-2 text-center text-sm text-muted-foreground py-8">Nenhum vídeo nesta categoria.</p>
          )}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left text-base">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className={`${selected.category === "Reels" ? "aspect-[9/16]" : "aspect-video"} rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center relative`}>
                <span className="text-5xl text-foreground/30">▶</span>
                <span className="absolute bottom-2 right-2 bg-foreground/70 text-primary-foreground text-xs px-2 py-1 rounded-lg">{selected.duration}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selected.author}</p>
                <p className="text-xs text-muted-foreground">{selected.role}</p>
              </div>
              <div className="border-t border-border pt-3">
                <h4 className="text-sm font-semibold text-foreground mb-2">Comentários</h4>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {(comments[selected.id] || []).length === 0 && (
                    <p className="text-xs text-muted-foreground">Seja a primeira a comentar.</p>
                  )}
                  {(comments[selected.id] || []).map((c, idx) => (
                    <div key={idx} className="bg-muted rounded-lg p-2 text-xs text-foreground">{c}</div>
                  ))}
                </div>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="text-sm mb-2"
                  rows={2}
                />
                <Button onClick={submitComment} className="w-full" disabled={!draft.trim()}>
                  Publicar comentário
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
