import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

type SignalPayload =
  | { type: "hello"; from: string }
  | { type: "offer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; from: string; candidate: RTCIceCandidateInit }
  | { type: "bye"; from: string };

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function fmtTempo(seg: number) {
  const m = Math.floor(seg / 60).toString().padStart(2, "0");
  const s = (seg % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* noop */
    }
  }
  return undefined;
}

function SalaPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();

  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfDono, setIsProfDono] = useState(false);
  const [outroNome, setOutroNome] = useState<string>("");
  const [meuNome, setMeuNome] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [emSala, setEmSala] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [remotoConectado, setRemotoConectado] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [tempo, setTempo] = useState(0);

  const [statusGrav, setStatusGrav] = useState<
    "indisponivel" | "parado" | "gravando" | "enviando" | "enviado" | "erro"
  >("parado");
  const [msgGrav, setMsgGrav] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerIdRef = useRef<string>(crypto.randomUUID());
  const isInitiatorRef = useRef(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStartRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const statusGravRef = useRef<typeof statusGrav>("parado");
  const isProfDonoRef = useRef(false);
  const gravacaoIniciadaRef = useRef(false);

  useEffect(() => {
    statusGravRef.current = statusGrav;
  }, [statusGrav]);

  useEffect(() => {
    isProfDonoRef.current = isProfDono;
  }, [isProfDono]);

  // ----- carrega sessão e dados do slot -----
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

      const { data: prof } = await supabase
        .from("professionals")
        .select("id, nome, user_id")
        .eq("id", s.professional_id)
        .maybeSingle();
      const profDono = !!prof && (prof as { user_id: string }).user_id === uid;
      setIsProfDono(profDono);

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

      if (profDono && typeof MediaRecorder === "undefined") {
        setStatusGrav("indisponivel");
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, navigate]);

  // ----- gravação (lado profissional) -----
  const iniciarGravacao = useCallback(
    (combined: MediaStream) => {
      if (!isProfDono || !slot) return;
      if (typeof MediaRecorder === "undefined") {
        setStatusGrav("indisponivel");
        return;
      }
      try {
        const mime = pickRecorderMime();
        const recorder = mime
          ? new MediaRecorder(combined, { mimeType: mime })
          : new MediaRecorder(combined);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onerror = () => {
          setStatusGrav("erro");
          setMsgGrav("Erro durante a gravação.");
        };
        recorder.start(2000);
        recorderRef.current = recorder;
        recStartRef.current = Date.now();
        setStatusGrav("gravando");
        void supabase
          .from("appointment_slots")
          .update({ gravacao_iniciada_em: new Date().toISOString() })
          .eq("id", slot.id);
      } catch (e) {
        console.error("rec start", e);
        setStatusGrav("erro");
        setMsgGrav("Não foi possível iniciar a gravação.");
      }
    },
    [isProfDono, slot],
  );

  const finalizarGravacao = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || !slot) return;
    if (recorder.state === "inactive") return;

    setStatusGrav("enviando");

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

    const blob = new Blob(chunksRef.current, {
      type: recorder.mimeType || "video/webm",
    });
    const ext = (recorder.mimeType || "video/webm").includes("mp4") ? "mp4" : "webm";
    const path = `${slot.id}/${Date.now()}.${ext}`;
    const duracaoSeg = Math.floor((Date.now() - recStartRef.current) / 1000);

    try {
      const { error: upErr } = await supabase.storage
        .from("consultation-recordings")
        .upload(path, blob, {
          contentType: blob.type,
          upsert: false,
        });
      if (upErr) throw upErr;

      await supabase
        .from("appointment_slots")
        .update({
          recording_path: path,
          recording_duration_seg: duracaoSeg,
          gravacao_finalizada_em: new Date().toISOString(),
          status: "realizado",
        })
        .eq("id", slot.id);

      setStatusGrav("enviado");
      setMsgGrav("Gravação salva com sucesso.");
    } catch (e) {
      console.error("upload rec", e);
      setStatusGrav("erro");
      setMsgGrav("Falha ao enviar a gravação.");
    }
  }, [slot]);

  // ----- WebRTC -----
  const limpar = useCallback(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    try {
      pcRef.current?.getSenders().forEach((s) => {
        try {
          s.track?.stop();
        } catch { /* noop */ }
      });
    } catch { /* noop */ }
    try {
      pcRef.current?.close();
    } catch { /* noop */ }
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "bye", from: peerIdRef.current } as SignalPayload,
        });
      } catch { /* noop */ }
      try {
        supabase.removeChannel(channelRef.current);
      } catch { /* noop */ }
      channelRef.current = null;
    }
  }, []);

  const criarPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "ice",
            from: peerIdRef.current,
            candidate: e.candidate.toJSON(),
          } as SignalPayload,
        });
      }
    };

    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      e.streams[0]?.getTracks().forEach((t) => {
        if (!remoteStreamRef.current!.getTracks().find((x) => x.id === t.id)) {
          remoteStreamRef.current!.addTrack(t);
        }
      });
      // Atribui o stream ao elemento <video> remoto (pode ter acabado de montar)
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => { /* ignore autoplay issues */ });
      }
      setRemotoConectado(true);

      // Profissional inicia gravação assim que o remoto conecta (uma vez só)
      if (
        isProfDonoRef.current &&
        !gravacaoIniciadaRef.current &&
        statusGravRef.current === "parado" &&
        localStreamRef.current
      ) {
        gravacaoIniciadaRef.current = true;
        const combined = new MediaStream([
          ...localStreamRef.current.getTracks(),
          ...remoteStreamRef.current!.getTracks(),
        ]);
        iniciarGravacao(combined);
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "failed" || st === "disconnected") {
        setRemotoConectado(false);
      }
    };

    return pc;
  }, [iniciarGravacao]);

  const enviarOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !channelRef.current) return;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    channelRef.current.send({
      type: "broadcast",
      event: "signal",
      payload: {
        type: "offer",
        from: peerIdRef.current,
        sdp: offer,
      } as SignalPayload,
    });
  }, []);

  const tratarSinal = useCallback(
    async (payload: SignalPayload) => {
      if (payload.from === peerIdRef.current) return;
      const pc = pcRef.current;
      if (!pc) return;

      if (payload.type === "hello") {
        // Quem tiver o peerId "menor" se torna initiator (decisão determinística).
        // Quem já estava na sala normalmente recebe o hello do recém-chegado.
        const meSmaller = peerIdRef.current < payload.from;
        if (meSmaller && !isInitiatorRef.current) {
          isInitiatorRef.current = true;
          await enviarOffer();
        } else if (!meSmaller) {
          // Reenvia hello para garantir que o outro saiba que estamos aqui
          channelRef.current?.send({
            type: "broadcast",
            event: "signal",
            payload: { type: "hello", from: peerIdRef.current } as SignalPayload,
          });
        }
        return;
      }

      if (payload.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        for (const c of pendingIceRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch { /* noop */ }
        }
        pendingIceRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channelRef.current?.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "answer",
            from: peerIdRef.current,
            sdp: answer,
          } as SignalPayload,
        });
        return;
      }

      if (payload.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        return;
      }

      if (payload.type === "ice") {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch { /* noop */ }
        } else {
          pendingIceRef.current.push(payload.candidate);
        }
        return;
      }

      if (payload.type === "bye") {
        setRemotoConectado(false);
      }
    },
    [enviarOffer],
  );

  const entrarSala = useCallback(async () => {
    if (!slot) return;
    setConectando(true);
    setMsgGrav(null);
    setErro(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = criarPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const channel = supabase.channel(`room_${slot.room_id}`, {
        config: { broadcast: { self: false, ack: false } },
      });
      channelRef.current = channel;

      channel.on("broadcast", { event: "signal" }, ({ payload }) => {
        void tratarSinal(payload as SignalPayload);
      });

      await new Promise<void>((resolve) => {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") resolve();
        });
      });

      // Anuncia presença — quem já estiver lá vira initiator
      channel.send({
        type: "broadcast",
        event: "signal",
        payload: { type: "hello", from: peerIdRef.current } as SignalPayload,
      });

      // cronômetro
      const t0 = Date.now();
      tickRef.current = window.setInterval(() => {
        setTempo(Math.floor((Date.now() - t0) / 1000));
      }, 1000);

      setEmSala(true);
      setConectando(false);
    } catch (e) {
      console.error("entrar sala", e);
      const msg =
        (e as Error)?.name === "NotAllowedError"
          ? "Permissão de câmera/microfone negada. Libere o acesso e tente novamente."
          : "Não foi possível acessar câmera ou microfone.";
      setErro(msg);
      setConectando(false);
      limpar();
    }
  }, [slot, criarPeerConnection, tratarSinal, limpar]);

  const encerrar = useCallback(async () => {
    if (statusGrav === "gravando") {
      await finalizarGravacao();
    }
    limpar();
    setEmSala(false);
    setRemotoConectado(false);
    setTempo(0);
    setTimeout(() => {
      navigate({ to: isProfDono ? "/profissional" : "/videochamada" });
    }, 800);
  }, [statusGrav, finalizarGravacao, limpar, navigate, isProfDono]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !micOn;
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !camOn;
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }, [camOn]);

  // limpeza ao desmontar
  useEffect(() => {
    return () => {
      limpar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reatribui srcObject quando os elementos <video> montam (após setEmSala(true))
  useEffect(() => {
    if (!emSala) return;
    if (localVideoRef.current && localStreamRef.current && localVideoRef.current.srcObject !== localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => { /* noop */ });
    }
    if (remoteVideoRef.current && remoteStreamRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play().catch(() => { /* noop */ });
    }
  }, [emSala, remotoConectado]);

  // ----- render -----
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Preparando sala...</p>
        </div>
      </div>
    );
  }

  if (erro && !emSala) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-sm text-center">
          <h1 className="text-xl font-bold mb-2 text-foreground">Não foi possível entrar</h1>
          <p className="text-muted-foreground mb-5">{erro}</p>
          <Button onClick={() => navigate({ to: "/" })} className="w-full">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // tela pré-entrada
  if (!emSala) {
    const dt = slot ? new Date(slot.data_hora) : null;
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-blush to-warm overflow-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-md max-w-md w-full p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-coral-light flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📹</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                Sala de consulta
              </h1>
              <p className="text-sm text-muted-foreground">
                Com {outroNome || (isProfDono ? "a gestante" : "o profissional")}
              </p>
              {dt && (
                <p className="text-xs text-muted-foreground mt-1">
                  {dt.toLocaleString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="bg-mint-light border border-mint/30 rounded-lg p-3 text-foreground">
                <p className="font-semibold mb-1">Antes de entrar</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-xs">
                  <li>Permita o acesso à câmera e ao microfone</li>
                  <li>Use fones de ouvido para melhor áudio</li>
                  <li>Procure um lugar silencioso e bem iluminado</li>
                </ul>
              </div>

              {isProfDono && statusGrav !== "indisponivel" && (
                <div className="bg-warm border border-coral/20 rounded-lg p-3 text-foreground text-xs">
                  <p className="font-semibold mb-0.5">Esta consulta será gravada</p>
                  <p className="text-muted-foreground">
                    A gravação inicia automaticamente quando a gestante conectar.
                  </p>
                </div>
              )}

              {isProfDono && statusGrav === "indisponivel" && (
                <div className="bg-muted border border-border rounded-lg p-3 text-xs text-muted-foreground">
                  Seu navegador não suporta gravação. A consulta acontecerá normalmente, mas não será gravada.
                </div>
              )}
            </div>

            <Button
              onClick={entrarSala}
              disabled={conectando}
              className="w-full h-12 text-base font-semibold"
            >
              {conectando ? "Conectando..." : "Entrar na sala"}
            </Button>

            <button
              onClick={() => navigate({ to: isProfDono ? "/profissional" : "/videochamada" })}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // tela em chamada
  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* header */}
      <header className="flex-shrink-0 bg-card border-b border-border px-3 sm:px-4 py-2 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(outroNome || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {outroNome || "Conectando..."}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {remotoConectado ? "Em chamada" : "Aguardando conexão..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono font-semibold text-foreground bg-muted px-2 py-1 rounded">
            {fmtTempo(tempo)}
          </span>
          {statusGrav === "gravando" && (
            <span className="text-[10px] font-bold text-white bg-destructive px-2 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              REC
            </span>
          )}
          {statusGrav === "enviando" && (
            <span className="text-[10px] font-bold text-foreground bg-warm px-2 py-1 rounded-full">
              SALVANDO
            </span>
          )}
          {statusGrav === "enviado" && (
            <span className="text-[10px] font-bold text-foreground bg-mint px-2 py-1 rounded-full">
              SALVO
            </span>
          )}
        </div>
      </header>

      {/* área de vídeo */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* vídeo remoto */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover bg-black"
        />

        {/* placeholder enquanto remoto não conecta */}
        {!remotoConectado && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-coral-light/20 to-blush text-center p-6 z-10">
            <div className="w-20 h-20 rounded-full bg-card border-2 border-border flex items-center justify-center mb-4 shadow-md">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-foreground font-semibold mb-1">
              Aguardando {outroNome || "o outro participante"}
            </p>
            <p className="text-sm text-muted-foreground">
              A chamada começa quando os dois estiverem na sala.
            </p>
          </div>
        )}

        {/* vídeo local (PIP) */}
        <div className="absolute bottom-24 right-3 sm:bottom-28 sm:right-4 w-24 h-32 sm:w-36 sm:h-48 rounded-xl overflow-hidden border-2 border-card shadow-lg bg-muted z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {!camOn && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-semibold">
                Câmera off
              </span>
            </div>
          )}
        </div>

        {/* mensagem de gravação */}
        {msgGrav && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card border border-border text-foreground text-xs px-3 py-2 rounded-full shadow-md z-20">
            {msgGrav}
          </div>
        )}
      </div>

      {/* controles */}
      <div
        className="flex-shrink-0 bg-card border-t border-border z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="flex items-center justify-center gap-3 sm:gap-6 py-3 sm:py-4 px-4">
          <button
            onClick={toggleMic}
            aria-label={micOn ? "Desligar microfone" : "Ligar microfone"}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              micOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-destructive text-white"
            }`}
          >
            {micOn ? "MIC" : "MUDO"}
          </button>

          <button
            onClick={toggleCam}
            aria-label={camOn ? "Desligar câmera" : "Ligar câmera"}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              camOn
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-destructive text-white"
            }`}
          >
            {camOn ? "CAM" : "OFF"}
          </button>

          <button
            onClick={encerrar}
            aria-label="Encerrar chamada"
            className="w-14 h-12 sm:w-20 sm:h-14 rounded-full bg-destructive text-white font-bold text-xs sm:text-sm hover:bg-destructive/90 transition-all shadow-md"
          >
            SAIR
          </button>
        </div>
      </div>
    </div>
  );
}
