import { useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export function NotificacoesCard() {
  const { state, registered, enable } = usePushSubscription();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [ativando, setAtivando] = useState(false);

  const handleEnable = async () => {
    setErro(null);
    setOk(null);
    setAtivando(true);
    const r = await enable();
    setAtivando(false);
    if (!r.ok) {
      setErro(r.error ?? "Não foi possível ativar.");
    } else {
      setOk("Notificações ativadas neste dispositivo.");
    }
  };

  let statusLabel = "Carregando...";
  let statusColor = "text-muted-foreground";
  if (state === "unsupported") {
    statusLabel = "Não suportado neste navegador";
    statusColor = "text-muted-foreground";
  } else if (state === "denied") {
    statusLabel = "Bloqueadas pelo navegador";
    statusColor = "text-red-600";
  } else if (state === "granted" && registered) {
    statusLabel = "Ativas neste dispositivo";
    statusColor = "text-green-700";
  } else if (state === "granted" && !registered) {
    statusLabel = "Permissão concedida — sincronize abaixo";
    statusColor = "text-amber-700";
  } else if (state === "default") {
    statusLabel = "Não ativadas";
    statusColor = "text-foreground";
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h2 className="text-base font-bold font-display text-foreground">
        Notificações push
      </h2>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">
        Receba lembretes de consultas, exames, vacinas e avisos da equipe direto
        no seu celular ou navegador.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Status
          </p>
          <p className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
        </div>

        {state !== "unsupported" && state !== "denied" && (
          <button
            type="button"
            onClick={handleEnable}
            disabled={ativando || (state === "granted" && registered)}
            className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
          >
            {ativando
              ? "Ativando..."
              : state === "granted" && registered
                ? "Já ativadas"
                : state === "granted"
                  ? "Sincronizar"
                  : "Ativar"}
          </button>
        )}
      </div>

      {state === "denied" && (
        <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
          Você bloqueou as notificações nas configurações do navegador. Para
          reativar, abra os ajustes do site (cadeado ao lado da URL) e libere
          notificações, depois recarregue a página.
        </p>
      )}

      {erro && (
        <p className="text-xs text-red-600 mt-2 font-medium">{erro}</p>
      )}
      {ok && <p className="text-xs text-green-700 mt-2 font-medium">{ok}</p>}
    </div>
  );
}
