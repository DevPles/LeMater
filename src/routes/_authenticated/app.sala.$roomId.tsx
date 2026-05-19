import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { gerarTokenSala } from "@/utils/livekit.functions";

export const Route = createFileRoute("/_authenticated/app/sala/$roomId")({
  component: SalaPage,
});

function SalaPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const tokenFn = useServerFn(gerarTokenSala);
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    tokenFn({ data: { roomId } })
      .then((r) => {
        setToken(r.token);
        setWsUrl(r.wsUrl);
      })
      .catch((e) => setErro(e?.message ?? "Erro ao entrar na sala"));
  }, [roomId]);

  if (erro) {
    return (
      <main className="max-w-md mx-auto px-4 pt-12 text-center">
        <h1 className="font-display text-xl font-bold text-foreground">Não foi possível entrar</h1>
        <p className="text-sm text-muted-foreground mt-2">{erro}</p>
        <button
          onClick={() => navigate({ to: "/app/videochamada" })}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider"
        >
          Voltar
        </button>
      </main>
    );
  }

  if (!token || !wsUrl) {
    return <p className="px-4 pt-12 text-center text-sm text-muted-foreground">Entrando na sala…</p>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect
        video
        audio
        onDisconnected={() => navigate({ to: "/app/videochamada" })}
        data-lk-theme="default"
        style={{ height: "100vh" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
