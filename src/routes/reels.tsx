import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGestanteProfile } from "@/hooks/useGestanteProfile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "Reels — MãeDigital" },
      { name: "description", content: "Feed de reels educativos sobre gestação, parto e cuidados com o bebê." },
    ],
  }),
  component: ReelsPage,
});

type Categoria = { slug: string; nome: string; ordem: number };

type ReelRow = {
  id: string;
  autor_id: string;
  titulo: string;
  descricao: string | null;
  categoria_slug: string | null;
  video_url: string;
  thumbnail_url: string | null;
  visualizacoes: number;
  publicado: boolean;
  created_at: string;
  autor_nome: string | null;
  autor_foto: string | null;
  total_likes: number;
  total_comentarios: number;
};

type Comentario = {
  id: string;
  reel_id: string;
  user_id: string;
  conteudo: string;
  created_at: string;
  autor_nome?: string | null;
  autor_foto?: string | null;
};

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "k";
  return String(n);
}

function getInitials(name: string | null | undefined) {
  if (!name) return "??";
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function ReelsPage() {
  const { session, profile } = useGestanteProfile();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtro, setFiltro] = useState<string>("todos");
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [commentsOpenFor, setCommentsOpenFor] = useState<ReelRow | null>(null);
  const [uploadOpen, setUploadOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("upload") === "1";
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Carregar categorias
  useEffect(() => {
    supabase.from("reel_categories").select("slug,nome,ordem").order("ordem").then(({ data }) => {
      setCategorias((data as Categoria[]) ?? []);
    });
  }, []);

  // Carregar feed
  const loadReels = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("reels_feed").select("*").eq("publicado", true).order("created_at", { ascending: false }).limit(50);
    if (filtro !== "todos") q = q.eq("categoria_slug", filtro);
    const { data, error } = await q;
    if (error) {
      toast.error("Erro ao carregar reels");
      setReels([]);
    } else {
      setReels((data as ReelRow[]) ?? []);
    }
    setLoading(false);
  }, [filtro]);

  useEffect(() => { loadReels(); }, [loadReels]);

  // Carregar likes do usuário
  useEffect(() => {
    if (!session?.user || reels.length === 0) return;
    const ids = reels.map(r => r.id);
    supabase.from("reel_likes").select("reel_id").eq("user_id", session.user.id).in("reel_id", ids).then(({ data }) => {
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((l: { reel_id: string }) => { map[l.reel_id] = true; });
      setLikedMap(map);
    });
  }, [session?.user, reels]);

  // Snap scroll: detectar reel ativo
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onScroll = () => {
      const idx = Math.round(c.scrollTop / c.clientHeight);
      if (idx !== activeIdx) setActiveIdx(idx);
    };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => c.removeEventListener("scroll", onScroll);
  }, [activeIdx]);

  // Play/pause baseado no ativo
  useEffect(() => {
    reels.forEach((r, i) => {
      const v = videoRefs.current[r.id];
      if (!v) return;
      if (i === activeIdx) {
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [activeIdx, reels]);

  const toggleLike = async (reel: ReelRow) => {
    if (!session?.user) {
      toast.error("Entre para curtir");
      return;
    }
    const liked = likedMap[reel.id];
    setLikedMap(prev => ({ ...prev, [reel.id]: !liked }));
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, total_likes: r.total_likes + (liked ? -1 : 1) } : r));
    if (liked) {
      await supabase.from("reel_likes").delete().eq("reel_id", reel.id).eq("user_id", session.user.id);
    } else {
      await supabase.from("reel_likes").insert({ reel_id: reel.id, user_id: session.user.id });
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Link to="/home" className="text-white text-sm font-semibold opacity-90">‹ Voltar</Link>
          <h1 className="text-white font-display font-bold text-lg">Reels</h1>
          <button
            onClick={() => session?.user ? setUploadOpen(true) : toast.error("Entre para publicar")}
            className="text-white text-sm font-bold bg-[#f0c040] text-[#1a1557] px-3 py-1 rounded-full"
          >
            + Postar
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <CategoriaPill active={filtro === "todos"} onClick={() => setFiltro("todos")} label="Todos" />
          {categorias.map(c => (
            <CategoriaPill key={c.slug} active={filtro === c.slug} onClick={() => setFiltro(c.slug)} label={c.nome} />
          ))}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {loading && (
          <div className="h-full flex items-center justify-center text-white/70 text-sm">Carregando...</div>
        )}
        {!loading && reels.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/80 px-6 text-center gap-3">
            <p className="text-base font-semibold">Nenhum reel ainda</p>
            <p className="text-sm opacity-80">Seja a primeira a publicar nessa categoria.</p>
            {session?.user && (
              <Button onClick={() => setUploadOpen(true)} className="mt-2 bg-[#f0c040] text-[#1a1557] hover:bg-[#f0c040]/90">
                + Postar reel
              </Button>
            )}
          </div>
        )}
        {reels.map((reel) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            liked={!!likedMap[reel.id]}
            onLike={() => toggleLike(reel)}
            onComment={() => setCommentsOpenFor(reel)}
            videoRef={(el) => { videoRefs.current[reel.id] = el; }}
          />
        ))}
      </div>

      <CommentsSheet
        reel={commentsOpenFor}
        onClose={() => setCommentsOpenFor(null)}
        currentUser={session?.user ?? null}
        currentName={profile?.nome ?? session?.user?.email ?? "Você"}
        currentAvatar={profile?.foto_url ?? null}
        onCommentChange={(reelId, delta) => {
          setReels(prev => prev.map(r => r.id === reelId ? { ...r, total_comentarios: Math.max(0, r.total_comentarios + delta) } : r));
        }}
      />

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        userId={session?.user?.id ?? null}
        categorias={categorias}
        onCreated={() => { setUploadOpen(false); loadReels(); }}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function CategoriaPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
        active ? "bg-white text-[#1a1557]" : "bg-white/20 text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ReelItem({
  reel, liked, onLike, onComment, videoRef,
}: {
  reel: ReelRow;
  liked: boolean;
  onLike: () => void;
  onComment: () => void;
  videoRef: (el: HTMLVideoElement | null) => void;
}) {
  const [muted, setMuted] = useState(true);
  return (
    <div className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url ?? undefined}
        loop
        muted={muted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onClick={() => setMuted(m => !m)}
      />
      {/* Overlay info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-24 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          {reel.autor_foto ? (
            <img src={reel.autor_foto} alt="" className="w-8 h-8 rounded-full object-cover border border-white/40" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#f0c040] text-[#1a1557] flex items-center justify-center text-xs font-bold">
              {getInitials(reel.autor_nome)}
            </div>
          )}
          <p className="text-white text-sm font-semibold drop-shadow">{reel.autor_nome ?? "Anônimo"}</p>
        </div>
        <h2 className="text-white font-bold text-base mb-1 leading-snug drop-shadow">{reel.titulo}</h2>
        {reel.descricao && (
          <p className="text-white/90 text-xs leading-snug line-clamp-3 drop-shadow">{reel.descricao}</p>
        )}
      </div>

      {/* Coluna de ações */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <button onClick={onLike} className="flex flex-col items-center gap-0.5">
          <span className={`text-3xl leading-none ${liked ? "text-[#f0c040]" : "text-white"} drop-shadow`}>
            {liked ? "♥" : "♡"}
          </span>
          <span className="text-[11px] font-semibold text-white drop-shadow">{formatCount(reel.total_likes)}</span>
        </button>
        <button onClick={onComment} className="flex flex-col items-center gap-0.5">
          <span className="text-2xl leading-none text-white drop-shadow">💬</span>
          <span className="text-[11px] font-semibold text-white drop-shadow">{formatCount(reel.total_comentarios)}</span>
        </button>
        <button onClick={() => setMuted(m => !m)} className="flex flex-col items-center gap-0.5">
          <span className="text-xl leading-none text-white drop-shadow">{muted ? "🔇" : "🔊"}</span>
        </button>
      </div>
    </div>
  );
}

function CommentsSheet({
  reel, onClose, currentUser, currentName, currentAvatar, onCommentChange,
}: {
  reel: ReelRow | null;
  onClose: () => void;
  currentUser: { id: string } | null;
  currentName: string;
  currentAvatar: string | null;
  onCommentChange: (reelId: string, delta: number) => void;
}) {
  const [list, setList] = useState<Comentario[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reel) return;
    setLoading(true);
    (async () => {
      const { data: comments } = await supabase
        .from("reel_comments")
        .select("id,reel_id,user_id,conteudo,created_at")
        .eq("reel_id", reel.id)
        .order("created_at", { ascending: false });
      const userIds = Array.from(new Set((comments ?? []).map(c => c.user_id)));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("user_id,nome,foto_url").in("user_id", userIds)
        : { data: [] as { user_id: string; nome: string | null; foto_url: string | null }[] };
      const profMap = new Map((profs ?? []).map(p => [p.user_id, p]));
      setList(((comments ?? []) as Comentario[]).map(c => ({
        ...c,
        autor_nome: profMap.get(c.user_id)?.nome ?? null,
        autor_foto: profMap.get(c.user_id)?.foto_url ?? null,
      })));
      setLoading(false);
    })();
  }, [reel]);

  const submit = async () => {
    if (!reel || !currentUser || !draft.trim()) return;
    const text = draft.trim().slice(0, 1000);
    setDraft("");
    const { data, error } = await supabase
      .from("reel_comments")
      .insert({ reel_id: reel.id, user_id: currentUser.id, conteudo: text })
      .select("id,reel_id,user_id,conteudo,created_at")
      .single();
    if (error || !data) {
      toast.error("Erro ao comentar");
      return;
    }
    setList(prev => [{ ...(data as Comentario), autor_nome: currentName, autor_foto: currentAvatar }, ...prev]);
    onCommentChange(reel.id, +1);
  };

  const remove = async (c: Comentario) => {
    if (!reel) return;
    const { error } = await supabase.from("reel_comments").delete().eq("id", c.id);
    if (error) { toast.error("Erro ao remover"); return; }
    setList(prev => prev.filter(x => x.id !== c.id));
    onCommentChange(reel.id, -1);
  };

  return (
    <Sheet open={!!reel} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[75vh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle>Comentários</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading && <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>}
          {!loading && list.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Seja a primeira a comentar 💕</p>
          )}
          {list.map(c => (
            <div key={c.id} className="flex gap-2">
              {c.autor_foto ? (
                <img src={c.autor_foto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getInitials(c.autor_nome)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{c.autor_nome ?? "Usuário"}</p>
                <p className="text-sm text-foreground break-words">{c.conteudo}</p>
                {currentUser?.id === c.user_id && (
                  <button onClick={() => remove(c)} className="text-[11px] text-destructive mt-0.5">Remover</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {currentUser ? (
          <div className="border-t p-3 flex gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={1}
              maxLength={1000}
              className="resize-none min-h-[40px]"
            />
            <Button onClick={submit} disabled={!draft.trim()}>Enviar</Button>
          </div>
        ) : (
          <div className="border-t p-3 text-center text-sm text-muted-foreground">Entre para comentar</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function UploadDialog({
  open, onClose, userId, categorias, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  categorias: Categoria[];
  onCreated: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<string>("geral");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setTitulo(""); setDescricao(""); setCategoria("geral"); setFile(null);
  };

  const submit = async () => {
    if (!userId || !file || !titulo.trim()) {
      toast.error("Preencha título e selecione um vídeo");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Vídeo deve ter até 50MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("reels").upload(path, file, {
        contentType: file.type || "video/mp4",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("reels").getPublicUrl(path);
      const { error: insErr } = await supabase.from("reels").insert({
        autor_id: userId,
        titulo: titulo.trim().slice(0, 200),
        descricao: descricao.trim().slice(0, 1000) || null,
        categoria_slug: categoria,
        video_url: pub.publicUrl,
        video_path: path,
        publicado: true,
      });
      if (insErr) throw insErr;
      toast.success("Reel publicado!");
      reset();
      onCreated();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao publicar";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && (reset(), onClose())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar reel</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-foreground">Vídeo (até 50MB)</label>
            <Input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Título</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} placeholder="Ex: Dica rápida sobre amamentação" />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Descrição</label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={1000} rows={3} />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Categoria</label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categorias.map(c => <SelectItem key={c.slug} value={c.slug}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={uploading} className="w-full bg-[#1a1557] text-white hover:bg-[#1a1557]/90">
            {uploading ? "Enviando..." : "Publicar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
