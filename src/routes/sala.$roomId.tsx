import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sala/$roomId")({
  head: () => ({
    meta: [
      { title: "Sala de Consulta — MãeDigital" },
      { name: "description", content: "Sala de videochamada da consulta." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: SalaPage,
});

type SlotInfo = {
  id: string;
  room_id: string;
  data_hora: string;
  duracao_min: number;
  status: string;
  gestante_id: string | null;
  professional_id: string;
  recording_path: string | null;
};

function SalaPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfDono, setIsProfDono] = useState(false);
  const [isGestante, setIsGestante] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [emSala, setEmSala] = useState(false);
  const [statusGrav, setStatusGrav] = useState<"parado" | "gravando" | "enviando" | "enviado" | "erro">("parado");
  const [msgGrav, setMsgGrav] = useState<string | null>(null);

  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Carrega sessão e dados do slot
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id ?? null;
      if (!uid) {
        navigate({ to: "/" });
        return;
      }
      if (cancelled) return;
      setUserId(uid);

      const { data: s, error } = await supabase
        .from("appointment_slots")
        .select("id, room_id, data_hora, duracao_min, status, gestante_id, professional_id, recording_path")
        .eq("room_id", roomId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !s) {
        setErro("Sala não encontrada.");
        setLoading(false);
        return;
      }
      setSlot(s as SlotInfo);

      // Checa se é o profissional dono
      const { data: prof } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      const profDono = !!prof && (prof as { id: string }).id === s.professional_id;
      setIsProfDono(profDono);
      setIsGestante(s.gestante_id === uid);

      if (!profDono && s.gestante_id !== uid) {
        setErro("Você não tem permissão para entrar nesta sala.");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, navigate]);

  // Carrega script externo do Jitsi
  const loadJitsiScript = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if ((window as any).JitsiMeetExternalAPI) return resolve();
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar Jitsi"));
      document.body.appendChild(script);
    });

  const entrarSala = async () => {
    if (!slot) return;
    setEmSala(true);

    try {
      await loadJitsiScript();
    } catch (e) {
      setErro("Não foi possível carregar a sala. Verifique sua conexão.");
      setEmSala(false);
      return;
    }

    if (!jitsiContainerRef.current) return;

    const roomName = `maedigital-${slot.room_id}`;
    const displayName = isProfDono ? "Profissional" : "Gestante";

    // @ts-ignore - JitsiMeetExternalAPI vem do script externo
    const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName,
      parentNode: jitsiContainerRef.current,
      width: "100%",
      height: "100%",
      userInfo: { displayName },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: "#1a1557",
      },
    });
    jitsiApiRef.current = api;

    api.addListener("readyToClose", async () => {
      await sairESalvar();
    });

    // Auto-iniciar gravação se for o profissional dono
    if (isProfDono) {
      // pequena espera para o usuário escolher a aba
      setTimeout(() => {
        iniciarGravacao();
      }, 1500);
    }
  };

  const iniciarGravacao = async () => {
    if (!slot || !isProfDono) return;
    if (recorderRef.current) return;

    try {
      setMsgGrav("Selecione a aba/tela da consulta para iniciar a gravação...");
      // @ts-ignore - getDisplayMedia tipos
      const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 },
        audio: true,
      });

      // Tenta capturar áudio do microfone também e mesclar
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        // sem permissão de mic — segue só com áudio do compartilhamento
      }

      // Combinar tracks
      const tracks: MediaStreamTrack[] = [
        ...stream.getVideoTracks(),
        ...stream.getAudioTracks(),
      ];
      if (micStream) tracks.push(...micStream.getAudioTracks());
      const combined = new MediaStream(tracks);
      streamRef.current = combined;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond: 800_000,
        audioBitsPerSecond: 64_000,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Se o usuário parar o compartilhamento pela barra do navegador
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          finalizarGravacaoEEnviar();
        }
      });

      recorder.start(5000); // chunk a cada 5s
      recorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setStatusGrav("gravando");
      setMsgGrav("🔴 Gravação em andamento");

      await supabase
        .from("appointment_slots")
        .update({ gravacao_iniciada_em: new Date().toISOString() })
        .eq("id", slot.id);
    } catch (e: any) {
      setStatusGrav("erro");
      setMsgGrav("Não foi possível iniciar a gravação: " + (e?.message ?? "erro desconhecido"));
    }
  };

  const finalizarGravacaoEEnviar = async (): Promise<void> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") {
        resolve();
        return;
      }
      rec.onstop = async () => {
        try {
          setStatusGrav("enviando");
          setMsgGrav("Enviando gravação...");
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
          const fileName = `consulta-${Date.now()}.webm`;
          const path = `${slot!.id}/${fileName}`;

          const { error: upErr } = await supabase.storage
            .from("consultation-recordings")
            .upload(path, blob, { contentType: "video/webm", upsert: false });

          if (upErr) {
            setStatusGrav("erro");
            setMsgGrav("Erro ao enviar: " + upErr.message);
            resolve();
            return;
          }

          await supabase
            .from("appointment_slots")
            .update({
              recording_path: path,
              recording_duration_seg: dur,
              gravacao_finalizada_em: new Date().toISOString(),
              status: "realizado",
            })
            .eq("id", slot!.id);

          setStatusGrav("enviado");
          setMsgGrav(`✓ Gravação salva (${Math.floor(dur / 60)}min ${dur % 60}s)`);
        } catch (e: any) {
          setStatusGrav("erro");
          setMsgGrav("Erro ao salvar: " + (e?.message ?? "desconhecido"));
        } finally {
          // Para tracks
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          recorderRef.current = null;
          resolve();
        }
      };
      rec.stop();
    });
  };

  const sairESalvar = async () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      await finalizarGravacaoEEnviar();
    }
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch {
        // ignore
      }
      jitsiApiRef.current = null;
    }
    setEmSala(false);
  };

  // Cleanup ao sair da rota
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando sala...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-base font-semibold text-foreground">{erro}</p>
        <button
          onClick={() => navigate({ to: isProfDono ? "/profissional" : "/videochamada" })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!slot) return null;

  const dt = new Date(slot.data_hora);

  return (
    <div className="min-h-screen bg-[#0a0820] text-white flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1557] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Consulta</p>
          <p className="text-sm font-bold truncate">
            {dt.toLocaleDateString("pt-BR")} às{" "}
            {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {" • "}
            {slot.duracao_min}min
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusGrav === "gravando" && (
            <span className="text-[10px] font-bold bg-red-600 px-2 py-1 rounded-full animate-pulse">
              ● REC
            </span>
          )}
          {statusGrav === "enviando" && (
            <span className="text-[10px] font-bold bg-amber-500 px-2 py-1 rounded-full">
              ENVIANDO
            </span>
          )}
          {statusGrav === "enviado" && (
            <span className="text-[10px] font-bold bg-green-600 px-2 py-1 rounded-full">
              SALVO
            </span>
          )}
          <button
            onClick={async () => {
              await sairESalvar();
              navigate({ to: isProfDono ? "/profissional" : "/videochamada" });
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-xs font-bold"
          >
            Encerrar
          </button>
        </div>
      </div>

      {msgGrav && (
        <div className="px-4 py-2 bg-white/5 text-xs text-white/80 border-b border-white/10">
          {msgGrav}
        </div>
      )}

      {!emSala ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/5 rounded-2xl p-6 space-y-4 border border-white/10">
            <h1 className="text-xl font-bold">Sala de consulta</h1>
            {isGestante && !isProfDono && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <p className="text-xs text-amber-200 font-semibold mb-1">Aviso de gravação</p>
                <p className="text-xs text-white/70">
                  Esta consulta poderá ser gravada para fins clínicos e auditoria.
                  Os arquivos ficam restritos ao profissional responsável e à equipe administrativa.
                </p>
              </div>
            )}
            {isProfDono && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 space-y-2">
                <p className="text-xs text-blue-200 font-semibold">Antes de entrar</p>
                <p className="text-xs text-white/70">
                  A gravação iniciará automaticamente. O navegador pedirá para você
                  <strong> compartilhar a aba da consulta</strong> — selecione a aba atual
                  e marque “Compartilhar áudio da aba”.
                </p>
              </div>
            )}
            <p className="text-sm text-white/80">
              {isProfDono ? "Você entrará como profissional." : "Você entrará como gestante."}
            </p>
            <button
              onClick={entrarSala}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-full"
            >
              Entrar na sala
            </button>
            <button
              onClick={() => navigate({ to: isProfDono ? "/profissional" : "/videochamada" })}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-full text-sm"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div ref={jitsiContainerRef} className="flex-1 w-full bg-black" style={{ minHeight: "70vh" }} />
      )}
    </div>
  );
}
