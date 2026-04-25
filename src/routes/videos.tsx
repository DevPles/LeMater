import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon, InstagramIcon, FacebookIcon, LinkIcon } from "@/components/SocialIcons";

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
  isGestante?: boolean;
  likes?: number;
  views?: number;
};

const videos: Video[] = [
  { id: 1, title: "Preparação para o parto normal", author: "Dra. Ana Costa", role: "Obstetra", duration: "12:30", category: "Parto", gradient: "from-coral-light to-blush", likes: 128, views: 2340 },
  { id: 2, title: "Alimentação saudável no 2º trimestre", author: "Enf. Carlos Silva", role: "Enfermeiro Obstétrico", duration: "8:45", category: "Nutrição", gradient: "from-mint-light to-warm", likes: 86, views: 1520 },
  { id: 3, title: "Exercícios seguros na gestação", author: "Dra. Beatriz Mendes", role: "Fisioterapeuta", duration: "15:20", category: "Exercícios", gradient: "from-warm to-coral-light", likes: 215, views: 3890 },
  { id: 4, title: "Primeiros cuidados com a amamentação", author: "Enf. Paula Rocha", role: "Enfermeira Obstétrica", duration: "10:15", category: "Amamentação", gradient: "from-blush to-coral-light", likes: 174, views: 2980 },
  { id: 5, title: "Sinais de alerta no terceiro trimestre", author: "Dr. Roberto Lima", role: "Obstetra", duration: "7:50", category: "Parto", gradient: "from-mint-light to-blush", likes: 92, views: 1740 },
  { id: 6, title: "Recuperação no pós-parto", author: "Dra. Fernanda Reis", role: "Obstetra", duration: "11:00", category: "Pós-parto", gradient: "from-coral-light to-mint-light", likes: 143, views: 2210 },
];

const reels: Video[] = [
  { id: 101, title: "Dica rápida: posições para aliviar dor lombar", author: "Dra. Beatriz Mendes", role: "Fisioterapeuta", duration: "0:45", category: "Reels", gradient: "from-coral-light to-blush", likes: 312, views: 5420 },
  { id: 102, title: "Minha rotina de chás no 3º trimestre 🌿", author: "Juliana M.", role: "Gestante 32 semanas", duration: "0:38", category: "Reels", gradient: "from-mint-light to-warm", isGestante: true, likes: 187, views: 2840 },
  { id: 103, title: "3 lanches saudáveis em 60 segundos", author: "Enf. Carlos Silva", role: "Enfermeiro Obstétrico", duration: "1:00", category: "Reels", gradient: "from-mint-light to-warm", likes: 256, views: 4120 },
  { id: 104, title: "Como organizei a mala da maternidade 💕", author: "Camila R.", role: "Gestante 38 semanas", duration: "0:52", category: "Reels", gradient: "from-blush to-coral-light", isGestante: true, likes: 421, views: 6780 },
  { id: 105, title: "Pega correta na amamentação", author: "Enf. Paula Rocha", role: "Enfermeira Obstétrica", duration: "0:50", category: "Reels", gradient: "from-blush to-coral-light", likes: 198, views: 3340 },
  { id: 106, title: "Meu chá revelação caseiro 🎀", author: "Beatriz S.", role: "Gestante 28 semanas", duration: "0:42", category: "Reels", gradient: "from-warm to-blush", isGestante: true, likes: 356, views: 5210 },
  { id: 107, title: "Respiração para o trabalho de parto", author: "Dra. Ana Costa", role: "Obstetra", duration: "0:55", category: "Reels", gradient: "from-warm to-mint-light", likes: 289, views: 4680 },
  { id: 108, title: "Exercícios que me ajudaram com a dor nas costas", author: "Patrícia L.", role: "Gestante 25 semanas", duration: "0:48", category: "Reels", gradient: "from-coral-light to-mint-light", isGestante: true, likes: 234, views: 3920 },
];

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "k";
  return String(n);
}

function VideosPage() {
  const [activeCategory, setActiveCategory] = useState("Reels");
  const [selected, setSelected] = useState<Video | null>(null);
  const [comments, setComments] = useState<Record<number, string[]>>({});
  const [draft, setDraft] = useState("");
  const [likedIds, setLikedIds] = useState<Record<number, boolean>>({});
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const isReels = activeCategory === "Reels";
  const items = isReels ? reels : videos.filter(v => v.category === activeCategory);

  const submitComment = () => {
    if (!selected || !draft.trim()) return;
    setComments(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), draft.trim()] }));
    setDraft("");
  };

  const toggleLike = (id: number) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getLikeCount = (v: Video) => (v.likes ?? 0) + (likedIds[v.id] ? 1 : 0);

  const shareTo = async (network: "whatsapp" | "instagram" | "facebook" | "copy", v: Video) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Olha esse reel no MãeDigital: "${v.title}" — ${v.author}`;
    const fullText = `${text} ${url}`.trim();

    if (network === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank");
    } else if (network === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, "_blank");
    } else if (network === "instagram") {
      try {
        await navigator.clipboard.writeText(fullText);
        setShareFeedback("Texto copiado! Cole no Instagram 💕");
      } catch {
        setShareFeedback("Não foi possível copiar o texto.");
      }
      setTimeout(() => setShareFeedback(null), 2500);
    } else if (network === "copy") {
      try {
        await navigator.clipboard.writeText(fullText);
        setShareFeedback("Link copiado!");
      } catch {
        setShareFeedback("Não foi possível copiar.");
      }
      setTimeout(() => setShareFeedback(null), 2500);
    }
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
        <>
          <button
            onClick={() => alert("Em breve: compartilhe seu reel! 💕")}
            className="w-full mb-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            + Compartilhe seu reel
          </button>
          <div className="grid grid-cols-2 gap-3">
            {reels.map((reel, i) => {
              const liked = !!likedIds[reel.id];
              return (
                <motion.div
                  key={reel.id}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-sm border border-border"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <button
                    onClick={() => setSelected(reel)}
                    className="absolute inset-0 text-left"
                    aria-label={`Abrir reel: ${reel.title}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${reel.gradient}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
                  </button>

                  <span className={`pointer-events-none absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${reel.isGestante ? "bg-[#f0c040] text-[#1a1557]" : "bg-primary text-primary-foreground"}`}>
                    {reel.isGestante ? "GESTANTE" : "PROFISSIONAL"}
                  </span>
                  <span className="pointer-events-none absolute top-2 right-2 bg-foreground/70 text-primary-foreground text-[10px] px-2 py-0.5 rounded-lg">{reel.duration}</span>

                  <div className="pointer-events-none absolute bottom-3 left-3 right-3">
                    <h3 className="font-semibold text-xs text-primary-foreground line-clamp-2">{reel.title}</h3>
                    <p className="text-[10px] text-primary-foreground/80 mt-1">{reel.author}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] font-semibold text-primary-foreground/90">
                      <span className="flex items-center gap-1">
                        <span aria-hidden>{liked ? "♥" : "♡"}</span>
                        {formatCount(getLikeCount(reel))}
                      </span>
                      <span>{formatCount(reel.views ?? 0)} views</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
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
              <div className={`${selected.category === "Reels" ? "aspect-[9/16]" : "aspect-video"} rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center relative overflow-hidden`}>
                <span className="text-5xl text-foreground/30">▶</span>
                <span className="absolute bottom-2 left-2 bg-foreground/70 text-primary-foreground text-xs px-2 py-1 rounded-lg">{selected.duration}</span>

                {/* Coluna de ações estilo Instagram/TikTok — apenas para Reels */}
                {selected.category === "Reels" && (
                  <div className="absolute right-2 bottom-3 flex flex-col items-center gap-4">
                    <button
                      onClick={() => toggleLike(selected.id)}
                      className="flex flex-col items-center gap-0.5 group"
                      aria-label="Curtir"
                    >
                      <span
                        aria-hidden
                        className={`text-2xl leading-none transition-transform group-active:scale-125 ${
                          likedIds[selected.id] ? "text-primary" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                        }`}
                      >
                        {likedIds[selected.id] ? "♥" : "♡"}
                      </span>
                      <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {formatCount(getLikeCount(selected))}
                      </span>
                    </button>

                    <div className="flex flex-col items-center gap-0.5">
                      <span aria-hidden className="text-xl leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        ◐
                      </span>
                      <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        {formatCount(selected.views ?? 0)}
                      </span>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="flex flex-col items-center gap-0.5"
                          aria-label="Compartilhar"
                        >
                          <span aria-hidden className="text-2xl leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                            ↗
                          </span>
                          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                            Enviar
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" side="top" className="w-44 p-2">
                        <button
                          onClick={() => shareTo("whatsapp", selected)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => shareTo("instagram", selected)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          Instagram
                        </button>
                        <button
                          onClick={() => shareTo("facebook", selected)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          Facebook
                        </button>
                        <button
                          onClick={() => shareTo("copy", selected)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          Copiar link
                        </button>
                        {shareFeedback && (
                          <p className="text-[11px] text-primary mt-1 px-3">{shareFeedback}</p>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{selected.author}</p>
                  <p className="text-xs text-muted-foreground">{selected.role}</p>
                </div>
                {selected.category !== "Reels" && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatCount(selected.views ?? 0)} visualizações
                  </span>
                )}
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
