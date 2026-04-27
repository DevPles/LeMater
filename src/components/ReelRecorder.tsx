import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  userId: string | null;
  categorias: { slug: string; nome: string }[];
  defaultCategoria?: string;
};

type Mode = "choose" | "record" | "upload";

export function ReelRecorder({ open, onClose, onCreated, userId, categorias, defaultCategoria }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<string>(defaultCategoria ?? "");
  const [enviando, setEnviando] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  // Cleanup ao fechar
  useEffect(() => {
    if (!open) {
      stopAll();
      setMode("choose");
      setRecordedBlob(null);
      setPreviewUrl(null);
      setTitulo("");
      setDescricao("");
      setCategoria(defaultCategoria ?? "");
      setElapsed(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopAll() {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try { recorderRef.current.stop(); } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      setMode("record");
    } catch (e: any) {
      toast.error("Não foi possível acessar câmera/microfone", { description: e?.message });
    }
  }

  // Conectar stream ao <video> quando entrar no modo record
  useEffect(() => {
    if (mode === "record" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [mode]);

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      // Liberar câmera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
    setElapsed(0);
    timerRef.current = window.setInterval(() => {
      setElapsed((s) => {
        if (s >= 180) { stopRecording(); return s; }
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setRecordedBlob(f);
    setPreviewUrl(URL.createObjectURL(f));
    setMode("upload");
  }

  async function publicar() {
    if (!userId) { toast.error("Faça login para publicar"); return; }
    if (!recordedBlob) { toast.error("Grave ou selecione um vídeo"); return; }
    if (!titulo.trim()) { toast.error("Adicione um título"); return; }

    setEnviando(true);
    try {
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const path = `${userId}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("reels").upload(path, recordedBlob, {
        contentType: recordedBlob.type || "video/webm",
        upsert: false,
      });
      if (up.error) throw up.error;

      const { data: pub } = supabase.storage.from("reels").getPublicUrl(path);

      const ins = await supabase.from("reels").insert({
        autor_id: userId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        categoria_slug: categoria || null,
        video_url: pub.publicUrl,
        video_path: path,
        publicado: true,
      });
      if (ins.error) throw ins.error;

      toast.success("Reel publicado! 💕");
      onCreated?.();
      onClose();
    } catch (e: any) {
      toast.error("Erro ao publicar", { description: e?.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhe seu reel</DialogTitle>
        </DialogHeader>

        {mode === "choose" && !previewUrl && (
          <div className="space-y-3 pt-2">
            <Button onClick={startCamera} className="w-full h-12 bg-primary text-primary-foreground">
              Gravar agora
            </Button>
            <label className="block">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={onPickFile}
                className="hidden"
              />
              <span className="block w-full h-12 leading-[3rem] text-center rounded-md border border-input bg-background text-foreground font-medium cursor-pointer hover:bg-muted transition-colors">
                Enviar do dispositivo
              </span>
            </label>
            <p className="text-xs text-muted-foreground text-center">
              Vídeos de até 60 segundos, 50MB no máximo.
            </p>
          </div>
        )}

        {mode === "record" && !previewUrl && (
          <div className="space-y-3">
            <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  REC {elapsed}s
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              {!recording ? (
                <Button onClick={startRecording} className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white">
                  Iniciar gravação
                </Button>
              ) : (
                <Button onClick={stopRecording} className="h-12 px-6 bg-foreground text-background">
                  Parar
                </Button>
              )}
              <Button variant="outline" onClick={() => { stopAll(); setMode("choose"); }} className="h-12">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-3">
            <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden">
              <video src={previewUrl} controls playsInline className="w-full h-full object-contain" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Título</label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Dê um título ao seu reel" maxLength={120} />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Descrição (opcional)</label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} maxLength={500} />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Categoria</label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Escolha uma categoria" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => (
                    <SelectItem key={c.slug} value={c.slug}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setRecordedBlob(null); setPreviewUrl(null); setMode("choose"); }}
                className="flex-1"
                disabled={enviando}
              >
                Refazer
              </Button>
              <Button onClick={publicar} disabled={enviando || !titulo.trim()} className="flex-1 bg-primary text-primary-foreground">
                {enviando ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
