import { useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export function NotificacoesCard() {
  const { state, registered, enable } = usePushSubscription();
  const [erro, setErro] = useState<string | null>(null);
  const [ativando, setAtivando] = useState(false);

  if (state === "unsupported" || state === "loading") return null;

  const ativo = state === "granted" && registered;

  const handleEnable = async () => {
    setErro(null);
    setAtivando(true);
    const r = await enable();
    setAtivando(false);
    if (!r.ok) setErro(r.error ?? "Não foi possível ativar.");
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Notificações push</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {ativo
            ? "Ativas neste dispositivo"
            : state === "denied"
              ? "Bloqueadas no navegador"
              : "Não ativadas"}
        </p>
        {erro && <p className="text-[11px] text-red-600 mt-1">{erro}</p>}
      </div>
      {!ativo && (
        <button
          type="button"
          onClick={handleEnable}
          disabled={ativando}
          className="shrink-0 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition"
        >
          {ativando ? "..." : state === "denied" ? "Sincronizar" : "Ativar"}
        </button>
      )}
    </div>
  );
}
