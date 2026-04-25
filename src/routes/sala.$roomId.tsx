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

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function canRecordScreen() {
  if (typeof navigator === "undefined") return false;
  return !!(navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia);
}

function SalaPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfDono, setIsProfDono] = useState(false);
  const [isGestante, setIsGestante] = useState(false);
  const [outroNome, setOutroNome] = useState<string>("");
  const [meuNome, setMeuNome] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [emSala, setEmSala] = useState(false);
  const [statusGrav, setStatusGrav] = useState<
    "indisponivel" | "parado" | "gravando" | "enviando" | "enviado" | "erro"
  >("parado");
  const [msgGrav, setMsgGrav] = useState<string | null>(null);
  const [tempo, setTempo] = useState<number>(0); // segundos em chamada
  const [mobile] = useState(isMobileDevice());

  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);

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
        .select(
          "id, room_id, data_hora, duracao_min, status, gestante_id, professional_id, recording_path",
        )
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
        .select("id, nome, user_id")
        .eq("id", s.professional_id)
        .maybeSingle();
      const profDono = !!prof && (prof as { user_id: string }).user_id === uid;
      setIsProfDono(profDono);
      setIsGestante(s.gestante_id === uid);

      // Nomes para exibir no Jitsi
      let nomeGestante = "Gestante";
      if (s.gestante_id) {
        const { data: gp } = await supabase
          .from("profiles")
          .select("nome")
          .eq("user_id", s.gestante_id)
          .maybeSingle();
        if (gp?.nome) nomeGestante = gp.nome;
      }
      const nomeProf = (prof as { nome?: string } | null)?.nome ?? "Profissional";

      if (profDono) {
        setMeuNome(nomeProf);
        setOutroNome(nomeGestante);
      } else {
        setMeuNome(nomeGestante);
        setOutroNome(nomeProf);
      }

      if (!profDono && s.gestante_id !== uid) {
        setErro("Você não tem permissão para entrar nesta sala.");
      }

      // Define disponibilidade de gravação
      if (profDono && (mobile || !canRecordScreen())) {
        setStatusGrav("indisponivel");
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, navigate, mobile]);

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
    setMsgGrav(null);

    try {
      await loadJitsiScript();
    } catch {
      setErro("Não foi possível carregar a sala. Verifique sua conexão.");
      setEmSala(false);
      return;
    }

    if (!jitsiContainerRef.current) return;

    const roomName = `maedigital-${slot.room_id}`;

    // @ts-ignore - JitsiMeetExternalAPI vem do script externo
    const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName,
      parentNode: jitsiContainerRef.current,
      width: "100%",
      height: "100%",
      userInfo: { displayName: meuNome },
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        enableClosePage: false,
        toolbarButtons: [
          "microphone",
          "camera",
          "tileview",
          "fullscreen",
          "hangup",
          "chat",
          "settings",
          "raisehand",
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: "#0a0820",
        DISABLE_VIDEO_BACKGROUND: true,
        MOBILE_APP_PROMO: false,
        HIDE_INVITE_MORE_HEADER: true,
      },
    });
    jitsiApiRef.current = api;

    // Cronômetro de chamada
    startTimeRef.current = Date.now();
    setTempo(0);
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setTempo(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    api.addListener("readyToClose", async () => {
      await sairESalvar();
      navigate({ to: isProfDono ? "/profissional" : "/videochamada" });
    });

    // Auto-iniciar gravação se for o profissional dono e suportado
    if (isProfDono && !mobile && canRecordScreen()) {
      setTimeout(() => {
        iniciarGravacao();
      }, 1500);
    }
  };

  const iniciarGravacao = async () => {
    if (!slot || !isProfDono) return;
    if (recorderRef.current) return;
    if (!canRecordScreen()) {
      setStatusGrav("indisponivel");
      setMsgGrav("Gravação não suportada neste navegador.");
      return;
    }

    try {
      setMsgGrav("Selecione a aba/janela da consulta para iniciar a gravação...");
      const stream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 15 },
        audio: true,
      });

      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        // segue sem mic
      }

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

      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
          finalizarGravacaoEEnviar();
        }
      });

      recorder.start(5000);
      recorderRef.current = recorder;
      setStatusGrav("gravando");
      setMsgGrav(null);

      await supabase
        .from("appointment_slots")
        .update({ gravacao_iniciada_em: new Date().toISOString() })
        .eq("id", slot.id);
    } catch (e: any) {
      setStatusGrav("erro");
      const msg = e?.message ?? "erro desconhecido";
      setMsgGrav("Gravação não iniciada: " + msg);
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
          setMsgGrav(`Gravação salva (${Math.floor(dur / 60)}min ${dur % 60}s)`);
        } catch (e: any) {
          setStatusGrav("erro");
          setMsgGrav("Erro ao salvar: " + (e?.message ?? "desconhecido"));
        } finally {
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
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
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

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
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
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Carregando sala...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background text-foreground">
        <p className="text-base font-semibold">{erro}</p>
        <button
          onClick={() => navigate({ to: isProfDono ? "/profissional" : "/videochamada" })}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!slot) return null;

  const dt = new Date(slot.data_hora);
  const fmtTempo = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header compacto */}
      <header className="flex-shrink-0 bg-card border-b border-border shadow-sm">
        <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-3">
            <div className="hidden sm:flex w-9 h-9 rounded-full bg-coral-light items-center justify-center text-primary font-bold text-xs">
              {(outroNome || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none">
                {emSala ? "Em chamada" : "Sala de consulta"}
              </p>
              <p className="text-sm font-bold truncate text-foreground">
                {emSala ? outroNome || "Aguardando..." : `${dt.toLocaleDateString("pt-BR")} • ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {emSala && (
              <span className="text-xs font-mono font-bold text-foreground bg-secondary px-2 py-1 rounded">
                {fmtTempo(tempo)}
              </span>
            )}
            {statusGrav === "gravando" && (
              <span className="text-[10px] font-bold text-white bg-destructive px-2 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                REC
              </span>
            )}
            {statusGrav === "enviando" && (
              <span className="text-[10px] font-bold text-warm-dark bg-warm px-2 py-1 rounded-full">
                SALVANDO
              </span>
            )}
            {statusGrav === "enviado" && (
              <span className="text-[10px] font-bold text-mint-dark bg-mint-light px-2 py-1 rounded-full">
                SALVO
              </span>
            )}
            <button
              onClick={async () => {
                await sairESalvar();
                navigate({ to: isProfDono ? "/profissional" : "/videochamada" });
              }}
              className="bg-primary hover:opacity-90 transition-opacity text-primary-foreground px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold"
            >
              {emSala ? "Encerrar" : "Sair"}
            </button>
          </div>
        </div>

        {msgGrav && emSala && (
          <div className="px-4 py-1.5 bg-secondary text-[11px] text-muted-foreground border-t border-border">
            {msgGrav}
          </div>
        )}
      </header>

      {/* Conteúdo */}
      {!emSala ? (
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background via-blush to-warm">
          <div className="max-w-md w-full bg-card rounded-3xl p-6 sm:p-8 space-y-5 border border-border shadow-xl">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-coral-light flex items-center justify-center text-primary text-2xl font-bold">
                {(outroNome || "?").slice(0, 2).toUpperCase()}
              </div>
              <h1 className="text-xl font-bold text-foreground">{outroNome || "Sala de consulta"}</h1>
              <p className="text-xs text-muted-foreground">
                {dt.toLocaleDateString("pt-BR")} às{" "}
                {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {" • "}
                {slot.duracao_min} min
              </p>
            </div>

            {isGestante && !isProfDono && (
              <div className="bg-warm border border-warm-dark/20 rounded-2xl p-3.5">
                <p className="text-[11px] text-warm-dark font-bold uppercase tracking-wide mb-1">
                  Aviso de gravação
                </p>
                <p className="text-xs text-foreground/75 leading-relaxed">
                  Esta consulta poderá ser gravada para fins clínicos. Os arquivos ficam
                  restritos ao profissional e à equipe administrativa.
                </p>
              </div>
            )}

            {isProfDono && !mobile && canRecordScreen() && (
              <div className="bg-mint-light border border-mint-dark/20 rounded-2xl p-3.5">
                <p className="text-[11px] text-mint-dark font-bold uppercase tracking-wide mb-1">
                  Antes de entrar
                </p>
                <p className="text-xs text-foreground/75 leading-relaxed">
                  A gravação iniciará automaticamente. O navegador pedirá para você{" "}
                  <strong className="text-foreground">compartilhar a aba</strong> — selecione a
                  aba atual e marque <strong className="text-foreground">"Compartilhar áudio"</strong>.
                </p>
              </div>
            )}

            {isProfDono && (mobile || !canRecordScreen()) && (
              <div className="bg-coral-light border border-primary/20 rounded-2xl p-3.5">
                <p className="text-[11px] text-primary font-bold uppercase tracking-wide mb-1">
                  Gravação indisponível
                </p>
                <p className="text-xs text-foreground/75 leading-relaxed">
                  Este dispositivo não suporta gravação automática.
                  Para gravar a consulta, acesse de um <strong className="text-foreground">computador</strong> usando Chrome, Edge ou Firefox.
                </p>
              </div>
            )}

            <button
              onClick={entrarSala}
              className="w-full bg-primary hover:opacity-90 transition-opacity text-primary-foreground font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-primary/20"
            >
              Entrar na sala
            </button>
            <button
              onClick={() => navigate({ to: isProfDono ? "/profissional" : "/videochamada" })}
              className="w-full text-muted-foreground hover:text-foreground font-semibold py-2 rounded-2xl text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={jitsiContainerRef}
          className="flex-1 w-full bg-foreground/90 overflow-hidden"
        />
      )}
    </div>
  );
}
