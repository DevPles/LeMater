import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingMessage } from "@/components/LoadingMessage";

export const Route = createFileRoute("/app/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — MãeDigital" },
      { name: "description", content: "Defina uma nova senha para a sua conta." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    // Supabase entrega o token no hash (#access_token=...&type=recovery) e
    // dispara o evento PASSWORD_RECOVERY assim que processa a sessão.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasRecovery(true);
        setSessionReady(true);
      } else if (session) {
        setSessionReady(true);
      }
    });

    // Fallback: se já existe sessão ativa, libera o formulário
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
        if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
          setHasRecovery(true);
        }
      } else {
        setSessionReady(true);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSalvar = async () => {
    setMsg(null);
    if (novaSenha.length < 6) {
      setMsg({ type: "err", text: "A senha precisa ter ao menos 6 caracteres." });
      return;
    }
    if (novaSenha !== confirmar) {
      setMsg({ type: "err", text: "As senhas não coincidem." });
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setMsg({ type: "ok", text: "Senha redefinida com sucesso! Redirecionando..." });
      setTimeout(() => navigate({ to: "/app/home" }), 1500);
    } catch (e) {
      setMsg({ type: "err", text: (e as Error).message || "Falha ao redefinir senha." });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-white via-blue-100 to-[#1a1557] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1a1557] border border-[#f0c040]/30 rounded-2xl p-6 shadow-2xl"
      >
        <h1 className="text-[#f0c040] text-2xl font-display text-center mb-1">
          Redefinir senha
        </h1>
        <p className="text-white/70 text-center text-sm mb-5">
          Defina uma nova senha para a sua conta.
        </p>

        {!sessionReady ? (
          <LoadingMessage />
        ) : !hasRecovery ? (
          <div className="text-center">
            <p className="text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm mb-4">
              Link inválido ou expirado. Solicite um novo link na tela de login.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold text-sm px-6 py-2.5 rounded-full transition-colors"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-white/90 text-xs font-medium">Nova senha</Label>
              <div className="relative">
                <Input
                  type={mostrar ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f0c040] focus:ring-[#f0c040]/30 h-10 text-sm pr-16"
                />
                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#f0c040] hover:text-[#e5b535] text-[11px] font-medium px-2"
                >
                  {mostrar ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-white/90 text-xs font-medium">Confirmar nova senha</Label>
              <Input
                type={mostrar ? "text" : "password"}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a senha"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f0c040] focus:ring-[#f0c040]/30 h-10 text-sm"
              />
            </div>

            {msg && (
              <p
                className={`text-xs px-3 py-2 rounded-lg ${
                  msg.type === "ok"
                    ? "text-emerald-200 bg-emerald-500/10 border border-emerald-500/30"
                    : "text-red-200 bg-red-500/10 border border-red-500/30"
                }`}
              >
                {msg.text}
              </p>
            )}

            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="mt-2 bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold text-sm py-2.5 rounded-full shadow-lg shadow-[#f0c040]/30 transition-colors disabled:opacity-40"
            >
              {salvando ? "Salvando..." : "Redefinir senha"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
