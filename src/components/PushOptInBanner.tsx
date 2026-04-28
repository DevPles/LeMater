import { useState } from "react";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const STORAGE_KEY = "maedigital_push_dismissed";

export function PushOptInBanner() {
  const { state, registered, enable } = usePushSubscription();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  });
  const [erro, setErro] = useState<string | null>(null);
  const [ativando, setAtivando] = useState(false);

  if (dismissed) return null;
  if (state === "loading" || state === "unsupported") return null;
  if (state === "granted" && registered) return null;

  const handleEnable = async () => {
    setErro(null);
    setAtivando(true);
    const r = await enable();
    setAtivando(false);
    if (!r.ok) setErro(r.error ?? "Não foi possível ativar.");
  };

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="bg-[#1a1557] text-white rounded-2xl p-4 shadow-md">
      <p className="text-sm font-bold">Receba lembretes da MãeDigital</p>
      <p className="text-xs opacity-90 mt-1">
        Ative as notificações para receber alertas de consultas, exames e vacinas direto no seu
        celular.
      </p>
      {erro && <p className="text-xs text-[#f0c040] mt-2">{erro}</p>}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleEnable}
          disabled={ativando}
          className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#f0c040] text-[#1a1557] hover:bg-[#e5b535] disabled:opacity-60"
        >
          {ativando ? "Ativando..." : state === "granted" ? "Sincronizar notificações" : "Ativar notificações"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="px-4 py-1.5 rounded-full text-xs font-bold bg-transparent border border-white/40 hover:bg-white/10"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
