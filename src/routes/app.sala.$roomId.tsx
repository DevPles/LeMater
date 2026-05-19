import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
} from "@livekit/components-react";
import { Track, type RemoteAudioTrack, type LocalAudioTrack } from "livekit-client";
import "@livekit/components-styles";
import { useServerFn } from "@tanstack/react-start";
import { gerarTokenSala } from "@/utils/livekit.functions";
import { ConsultationNotesPanel } from "@/components/profissional/ConsultationNotesPanel";

export const Route = createFileRoute("/app/sala/$roomId")({
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
};

function fmtTempo(seg: number) {
  const m = Math.floor(seg / 60).toString().padStart(2, "0");
  const s = (seg % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function SalaPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const obterToken = useServerFn(gerarTokenSala);

  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [isProfDono, setIsProfDono] = useState(false);
  const [outroNome, setOutroNome] = useState<string>("");
  const [meuNome, setMeuNome] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [emSala, setEmSala] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [meuUserId, setMeuUserId] = useState<string | null>(null);
  const [notasAbertas, setNotasAbertas] = useState(false);
  const [savingRecording, setSavingRecording] = useState(false);
  const recordingRef = useRef<{
    recorder: MediaRecorder;
    chunks: Blob[];
    audioCtx: AudioContext;
    mime: string;
    startedAt: number;
  } | null>(null);

  const tickRef = useRef<number | null>(null);

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
      setMeuUserId(uid);

      const { data: s, error } = await supabase
        .from("appointment_slots")
        .select(
          "id, room_id, data_hora, duracao_min, status, gestante_id, professional_id",
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
      const profDono =
        !!prof && (prof as { user_id: string }).user_id === uid;
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
      const nomeProf =
        (prof as { nome?: string } | null)?.nome ?? "Profissional";

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

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, navigate]);

  const limpar = useCallback(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const finalizarGravacao = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec || !slot) return;
    recordingRef.current = null;
    try {
      const blob = await new Promise<Blob>((resolve) => {
        rec.recorder.addEventListener(
          "stop",
          () => resolve(new Blob(rec.chunks, { type: rec.mime })),
          { once: true },
        );
        if (rec.recorder.state !== "inactive") rec.recorder.stop();
        else resolve(new Blob(rec.chunks, { type: rec.mime }));
      });
      try {
        rec.audioCtx.close();
      } catch {
        // ignore
      }
      const ext = rec.mime.includes("mp4") ? "m4a" : "webm";
      const durSeg = Math.floor((Date.now() - rec.startedAt) / 1000);
      const path = `${slot.gestante_id ?? "sem-gestante"}/${slot.id}-${Date.now()}.${ext}`;
      setSavingRecording(true);
      const { error: upErr } = await supabase.storage
        .from("consultation-recordings")
        .upload(path, blob, { contentType: rec.mime, upsert: false });
      if (upErr) {
        console.error("upload gravação:", upErr);
      } else {
        await supabase
          .from("appointment_slots")
          .update({
            recording_path: path,
            recording_duration_seg: durSeg,
            gravacao_finalizada_em: new Date().toISOString(),
          })
          .eq("id", slot.id);
      }
    } catch (e) {
      console.error("finalizar gravação:", e);
    } finally {
      setSavingRecording(false);
    }
  }, [slot]);

  const sairESair = useCallback(async () => {
    limpar();
    if (recordingRef.current) {
      await finalizarGravacao();
    }
    setEmSala(false);
    setToken(null);
    setWsUrl(null);
    setTempo(0);
    navigate({ to: isProfDono ? "/app/profissional" : "/app/videochamada" });
  }, [limpar, navigate, isProfDono, finalizarGravacao]);

  const entrarSala = useCallback(async () => {
    if (!slot) return;
    setConectando(true);
    setErro(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) {
        setErro("Sessão expirada. Faça login novamente.");
        return;
      }

      const { token: tk, wsUrl: url } = await obterToken({
        data: { roomId: slot.room_id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setToken(tk);
      setWsUrl(url);

      const t0 = Date.now();
      tickRef.current = window.setInterval(() => {
        setTempo(Math.floor((Date.now() - t0) / 1000));
      }, 1000);
      setEmSala(true);
    } catch (e: unknown) {
      console.error("livekit token", e);
      let msg = "Não foi possível iniciar a videochamada.";
      if (e instanceof Response) {
        try {
          msg = (await e.text()) || msg;
        } catch {
          // ignore
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setErro(msg);
    } finally {
      setConectando(false);
    }
  }, [slot, obterToken]);

  // limpeza ao desmontar
  useEffect(() => {
    return () => {
      limpar();
    };
  }, [limpar]);

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
          <h1 className="text-xl font-bold mb-2 text-foreground">
            Não foi possível entrar
          </h1>
          <p className="text-muted-foreground mb-5">{erro}</p>
          <Button onClick={() => navigate({ to: "/" })} className="w-full">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // tela pré-entrada
  if (!emSala || !token || !wsUrl) {
    const dt = slot ? new Date(slot.data_hora) : null;
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background via-blush to-warm overflow-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-md max-w-md w-full p-6 sm:p-8">
            <div className="text-center mb-6">
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
            </div>

            <Button
              onClick={entrarSala}
              disabled={conectando}
              className="w-full h-12 text-base font-semibold"
            >
              {conectando ? "Conectando..." : "Entrar na sala"}
            </Button>

            <button
              onClick={() =>
                navigate({ to: isProfDono ? "/app/profissional" : "/app/videochamada" })
              }
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // tela em chamada — LiveKit
  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      <header className="flex-shrink-0 bg-card border-b border-border px-3 sm:px-4 py-2 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(outroNome || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {outroNome || "Conectando..."}
            </p>
            <p className="text-[10px] text-muted-foreground">Em chamada</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono font-semibold text-foreground bg-muted px-2 py-1 rounded">
            {fmtTempo(tempo)}
          </span>
          {isProfDono && slot?.gestante_id && (
            <button
              onClick={() => setNotasAbertas((v) => !v)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full hover:opacity-90 ${
                notasAbertas
                  ? "bg-[#1a1557] text-white"
                  : "bg-muted text-foreground"
              }`}
            >
              {notasAbertas ? "Fechar notas" : "Anotar consulta"}
            </button>
          )}
          <button
            onClick={sairESair}
            className="text-[11px] font-bold text-white bg-destructive px-3 py-1.5 rounded-full hover:opacity-90"
          >
            SAIR
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 bg-black overflow-hidden">
          <LiveKitRoom
            token={token}
            serverUrl={wsUrl}
            connect
            video
            audio
            onDisconnected={sairESair}
            data-lk-theme="default"
            style={{ height: "100%" }}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <VideoArea meuNome={meuNome} />
              </div>
              <div className="flex-shrink-0 bg-card border-t border-border">
                <ControlBar
                  controls={{
                    microphone: true,
                    camera: true,
                    screenShare: false,
                    chat: false,
                    leave: true,
                    settings: false,
                  }}
                  variation="minimal"
                />
              </div>
            </div>
            <RoomAudioRenderer />
            {isProfDono && slot && (
              <AudioRecordingController
                slotId={slot.id}
                onStart={(rec) => {
                  recordingRef.current = rec;
                }}
                isActive={() => !!recordingRef.current}
              />
            )}
          </LiveKitRoom>
        </div>

        {savingRecording && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
            <div className="bg-card rounded-2xl p-6 max-w-xs text-center shadow-xl">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-semibold text-foreground">Salvando consulta...</p>
              <p className="text-xs text-muted-foreground mt-1">Não feche esta janela.</p>
            </div>
          </div>
        )}


        {isProfDono && notasAbertas && slot?.gestante_id && meuUserId && slot ? (
          <aside className="w-full max-w-sm border-l border-border bg-background flex flex-col overflow-hidden absolute sm:relative inset-0 sm:inset-auto z-30 sm:z-auto">
            <ConsultationNotesPanel
              appointmentId={slot.id}
              gestanteId={slot.gestante_id}
              professionalUserId={meuUserId}
              compact
              onClose={() => setNotasAbertas(false)}
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function VideoArea({ meuNome: _meuNome }: { meuNome: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} style={{ height: "100%" }}>
      <ParticipantTile />
    </GridLayout>
  );
}

type RecordingHandle = {
  recorder: MediaRecorder;
  chunks: Blob[];
  audioCtx: AudioContext;
  mime: string;
  startedAt: number;
};

function pickAudioMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  for (const c of candidates) {
    try {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(c)
      ) {
        return c;
      }
    } catch {
      // ignore
    }
  }
  return "audio/webm";
}

function AudioRecordingController({
  slotId,
  onStart,
  isActive,
}: {
  slotId: string;
  onStart: (rec: RecordingHandle) => void;
  isActive: () => boolean;
}) {
  const participants = useParticipants();
  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: true },
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || isActive()) return;
    if (participants.length < 2) return;

    const mediaTracks: MediaStreamTrack[] = [];
    for (const t of audioTracks) {
      const pub = t.publication;
      const track = pub?.track as
        | RemoteAudioTrack
        | LocalAudioTrack
        | undefined;
      const mst = track?.mediaStreamTrack;
      if (mst && mst.kind === "audio") mediaTracks.push(mst);
    }
    if (mediaTracks.length < 2) return;

    startedRef.current = true;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      for (const mst of mediaTracks) {
        const src = audioCtx.createMediaStreamSource(new MediaStream([mst]));
        src.connect(dest);
      }
      const mime = pickAudioMime();
      const recorder = new MediaRecorder(dest.stream, { mimeType: mime });
      const chunks: Blob[] = [];
      recorder.addEventListener("dataavailable", (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      });
      recorder.start(1000);
      const startedAt = Date.now();

      void supabase
        .from("appointment_slots")
        .update({ gravacao_iniciada_em: new Date(startedAt).toISOString() })
        .eq("id", slotId);

      onStart({ recorder, chunks, audioCtx, mime, startedAt });
    } catch (e) {
      console.error("iniciar gravação áudio:", e);
      startedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants.length, audioTracks.length, slotId]);

  return null;
}

