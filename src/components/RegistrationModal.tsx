import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useDistritos, useBairros, useUbs } from "@/hooks/useLocalidades";

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageLight: "#8AB89A",
  sageDark: "#2D5A42",
  terracotta: "#C4714A",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
};

const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Mode = "login" | "register";

function EyeToggleIcon({ open }: { open: boolean }) {
  if (open) {
    // eye-off (senha visível -> clique para ocultar)
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9 4 10 7-.4 1.1-1.2 2.4-2.4 3.6" />
        <path d="M6.1 6.1C3.9 7.6 2.4 9.7 2 12c1 3 5 7 10 7 1.6 0 3-.4 4.3-1" />
      </svg>
    );
  }
  // eye (senha oculta -> clique para mostrar)
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}


function calcGestationalAge(lmpDate: Date): { weeks: number; days: number } {
  const now = new Date();
  const diffMs = now.getTime() - lmpDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

function calcDueDate(lmpDate: Date): Date {
  const due = new Date(lmpDate);
  due.setDate(due.getDate() + 280);
  return due;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

function looksLikeCpf(value: string): boolean {
  return normalizeCpf(value).length === 11 && !value.includes("@");
}

export default function RegistrationModal({
  open,
  onOpenChange,
  initialMode = "register",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialMode?: Mode;
}) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<1 | 2>(1);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setStep(1);
    }
  }, [open, initialMode]);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErro, setLoginErro] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot password fields
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Step 1 fields
  const [nome, setNome] = useState("");
  const [cep, setCep] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [ubs, setUbs] = useState("");
  // IDs estruturados (preenchidos quando o bairro/UBS casa com o catálogo)
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);
  const [healthUnitId, setHealthUnitId] = useState<string | null>(null);
  const [ubsManual, setUbsManual] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [email, setEmail] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [gestante, setGestante] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErro, setSubmitErro] = useState<string | null>(null);

  // Catálogo geográfico (banco) — encadeado por cidade → distrito → bairro → UBS
  const { data: distritosCatalogo } = useDistritos(cidade || null);
  const { data: bairrosCatalogo } = useBairros(cidade || null, districtId);
  const { data: ubsCatalogo } = useUbs(cidade || null, districtId, neighborhoodId);

  const temDistritos = distritosCatalogo.length > 1;

  // Quando o ViaCEP preenche o bairro, tentamos casar com o catálogo
  // para deduzir distrito e bairro_id automaticamente.
  useEffect(() => {
    if (!cidade || !bairro || distritosCatalogo.length === 0) return;
    // Se já temos districtId+neighborhoodId, não precisamos refazer
    if (neighborhoodId) return;

    const casaBairro = async () => {
      const { data: nbhMatch } = await supabase
        .from("neighborhoods")
        .select("id, district_id")
        .eq("cidade", cidade)
        .ilike("nome", bairro)
        .maybeSingle();
      if (nbhMatch) {
        setNeighborhoodId(nbhMatch.id);
        if (nbhMatch.district_id) setDistrictId(nbhMatch.district_id);
      }
    };
    casaBairro();
  }, [cidade, bairro, distritosCatalogo.length, neighborhoodId]);

  // Sugestão automática da UBS: se há exatamente uma UBS no bairro/distrito
  // selecionado e o usuário ainda não escolheu manualmente, pré-seleciona.
  useEffect(() => {
    if (ubsManual) return;
    if (ubsCatalogo.length === 1) {
      setUbs(ubsCatalogo[0].nome);
      setHealthUnitId(ubsCatalogo[0].id);
    } else if (ubsCatalogo.length > 1 && !healthUnitId) {
      // Múltiplas opções → limpa para o usuário escolher
      setUbs("");
    }
  }, [ubsCatalogo, ubsManual, healthUnitId]);

  const formatarCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
    return d;
  };

  const buscarCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError("CEP não encontrado");
        setBairro("");
        setCidade("");
        setUf("");
        setUbs("");
        setDistrictId(null);
        setNeighborhoodId(null);
        setHealthUnitId(null);
        return;
      }
      const b = data.bairro || "";
      const c = data.localidade || "";
      // Reset do vínculo estruturado — será refeito pelo effect ao casar com o catálogo
      setDistrictId(null);
      setNeighborhoodId(null);
      setHealthUnitId(null);
      setUbs("");
      setUbsManual(false);
      setBairro(b);
      setCidade(c);
      setUf(data.uf || "");
      // Sempre preenche o endereço com o logradouro retornado pelo ViaCEP
      if (data.logradouro) {
        setEndereco(`${data.logradouro}${b ? `, ${b}` : ""}`);
      }
    } catch {
      setCepError("Erro ao consultar o CEP");
    } finally {
      setCepLoading(false);
    }
  };



  // Step 2 fields (pregnancy)
  const [dum, setDum] = useState("");
  const [testeGravidez, setTesteGravidez] = useState<boolean | null>(null);
  const [qualTeste, setQualTeste] = useState("");

  const gestAge = dum ? calcGestationalAge(new Date(dum)) : null;
  const dueDate = dum ? calcDueDate(new Date(dum)) : null;

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleStep1Continue = async () => {
    setSubmitErro(null);
    if (!nome.trim()) return;

    if (gestante === true) {
      // Validações para criar conta no Supabase já no step1 → 2
      if (!email.trim()) return setSubmitErro("Informe um e-mail.");
      if (senhaCadastro.length < 6) return setSubmitErro("Senha precisa ter ao menos 6 caracteres.");
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setStep(2);
      }, 2500);
      return;
    }

    // Não-gestante: cria conta simples e leva para home
    if (!email.trim() || senhaCadastro.length < 6) {
      return setSubmitErro("Informe e-mail e senha (mínimo 6 caracteres) para criar sua conta.");
    }
    await criarContaENavegar(null);
  };

  const criarContaENavegar = async (dumIso: string | null) => {
    setSubmitting(true);
    setSubmitErro(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senhaCadastro,
        options: {
          data: { nome: nome.trim(), dum: dumIso ?? "", cpf: normalizeCpf(cpf) },
          emailRedirectTo: window.location.origin + "/home",
        },
      });
      if (error) {
        // Se email já existe, tenta login direto
        if (/registered|exists|already/i.test(error.message)) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: senhaCadastro,
          });
          if (signInErr) throw signInErr;
        } else {
          throw error;
        }
      }
      // Atualiza profile com todos os dados demográficos coletados no cadastro
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) {
        await supabase
          .from("profiles")
          .update({
            nome: nome.trim(),
            cpf: normalizeCpf(cpf) || null,
            telefone: whatsapp || null,
            bairro: bairro || null,
            cidade: cidade || "Ribeirão Preto",
            unidade_saude: ubs || null,
            district_id: districtId,
            health_unit_id: healthUnitId,
            data_nascimento: dataNasc || null,
            ...(dumIso ? { dum: dumIso } : {}),
          })
          .eq("user_id", sess.session.user.id);
      }
      onOpenChange(false);
      navigate({ to: "/home" });
    } catch (e) {
      setSubmitErro((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    await criarContaENavegar(dum || null);
  };

  const inputClass =
    `bg-white border-${c.border} text-${c.ink} placeholder:${c.muted} focus:border-${c.sage} focus:ring-${c.sage}/30 h-9 text-sm w-full min-w-0 block appearance-none`;
  const labelClass = `text-${c.ink}/90 text-xs font-medium`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[calc(100vw-1rem)] max-w-md max-h-[85vh] p-0 rounded-2xl relative overflow-hidden top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed"
        style={{ 
          background: c.warm, 
          border: `1px solid ${c.border}`,
          fontFamily: sans,
          color: c.ink
        }}
      >
        <style>{`
          .registration-modal-close-btn { color: ${c.ink} !important; }
          [data-radix-collection-item] > svg { color: ${c.ink} !important; }
        `}</style>
        {/* Subtle decorative background - softer than the blue particles */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
          <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${c.sageLight}11 0%, transparent 70%)` }} />
          <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${c.sage}11 0%, transparent 70%)` }} />
          {Array.from({ length: 18 }).map((_, i) => {
            const size = 4 + ((i * 7) % 14);
            const left = (i * 53) % 100;
            const duration = 8 + ((i * 3) % 10);
            const delay = (i * 0.7) % 8;
            const blur = i % 3 === 0 ? "blur-[2px]" : i % 3 === 1 ? "blur-[1px]" : "";
            const opacity = 0.25 + ((i % 5) * 0.12);
            return (
              <motion.span
                key={i}
                className={`absolute rounded-full bg-white ${blur}`}
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  bottom: `-${size}px`,
                  opacity,
                }}
                animate={{
                  y: [0, -180],
                  x: [0, i % 2 === 0 ? 15 : -15, 0],
                  opacity: [0, opacity, opacity, 0],
                }}
                transition={{
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.1, 0.9, 1],
                }}
              />
            );
          })}
        </div>
        <div className="relative z-10 p-3 sm:p-4 overflow-y-auto max-h-[85vh]">

        <DialogHeader className="relative z-10">
          <DialogTitle 
            style={{ color: c.sageDark, fontFamily: serif }}
            className="text-xl text-center"
          >
            {mode === "login"
              ? "Entrar"
              : step === 1
                ? "Cadastro da Gestante"
                : "Dados da Gestação"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-10 flex flex-col gap-3 pt-2"
            >
              <div className="flex flex-col gap-2">
                <div>
                  <Label className={labelClass}>E-mail, CPF ou registro</Label>
                  <Input
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label className={labelClass}>Senha</Label>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors p-1"
                      style={{ color: c.sage }}
                    >
                      <EyeToggleIcon open={showLoginPassword} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setForgotOpen((v) => !v);
                  setForgotMsg(null);
                  if (!forgotEmail && loginEmail.includes("@")) setForgotEmail(loginEmail);
                }}
                className="hover:opacity-70 text-xs text-right transition-colors self-end"
                style={{ color: c.muted }}
              >
                Esqueci minha senha
              </button>

              {forgotOpen && (
                <div className="bg-white/5 border border-white/15 rounded-lg p-3 flex flex-col gap-2">
                  <Label className={labelClass}>E-mail para receber o link de redefinição</Label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className={inputClass}
                  />
                  {forgotMsg && (
                    <p
                      className={`text-xs px-2 py-1.5 rounded ${
                        forgotMsg.type === "ok"
                          ? "text-emerald-200 bg-emerald-500/10 border border-emerald-500/30"
                          : "text-red-200 bg-red-500/10 border border-red-500/30"
                      }`}
                    >
                      {forgotMsg.text}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setForgotMsg(null);
                        const em = forgotEmail.trim();
                        if (!em || !em.includes("@")) {
                          setForgotMsg({ type: "err", text: "Informe um e-mail válido." });
                          return;
                        }
                        setForgotLoading(true);
                        try {
                          const { error } = await supabase.auth.resetPasswordForEmail(em, {
                            redirectTo: window.location.origin + "/reset-password",
                          });
                          if (error) throw error;
                          setForgotMsg({
                            type: "ok",
                            text: "Enviamos um link de redefinição para o seu e-mail.",
                          });
                        } catch (e) {
                          setForgotMsg({
                            type: "err",
                            text: (e as Error).message || "Falha ao enviar e-mail.",
                          });
                        } finally {
                          setForgotLoading(false);
                        }
                      }}
                      disabled={forgotLoading}
                      style={{ background: c.sageDark, color: "white" }}
                      className="flex-1 font-bold text-xs py-2 rounded-full transition-colors disabled:opacity-40"
                    >
                      {forgotLoading ? "Enviando..." : "Enviar link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="px-3 text-white/70 hover:text-white text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {loginErro && (
                <p className="text-red-300 text-xs bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                  {loginErro}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  setLoginErro(null);
                  const u = loginEmail.trim();
                  const p = loginSenha.trim();

                  setLoginLoading(true);
                  try {
                    let emailParaLogin = u;

                    // Alias de login admin: "pericles.13" → e-mail real
                    if (u.toLowerCase() === "pericles.13") {
                      emailParaLogin = "pericles@gmail.com";
                    } else if (u.includes("@")) {
                      // E-mail: usa direto
                      emailParaLogin = u;
                    } else if (looksLikeCpf(u)) {
                      // CPF (11 dígitos)
                      const { data: resolvedEmail, error: resolveError } = await supabase.rpc(
                        "resolve_login_email_by_cpf",
                        { _cpf: normalizeCpf(u) },
                      );
                      if (resolveError) throw resolveError;
                      if (!resolvedEmail) {
                        throw new Error("CPF não encontrado. Tente entrar com seu e-mail ou finalize o cadastro.");
                      }
                      emailParaLogin = resolvedEmail;
                    } else {
                      // Tenta resolver como registro de conselho de classe (CRM/COREN/etc)
                      const { data: resolvedEmail, error: resolveError } = await supabase.rpc(
                        "resolve_login_email_by_registro",
                        { _registro: u },
                      );
                      if (resolveError) throw resolveError;
                      if (!resolvedEmail) {
                        throw new Error(
                          "Não encontramos uma conta com esse e-mail, CPF ou registro profissional.",
                        );
                      }
                      emailParaLogin = resolvedEmail;
                    }

                    const { data: signInData, error } = await supabase.auth.signInWithPassword({
                      email: emailParaLogin,
                      password: p,
                    });
                    if (error) throw error;
                    onOpenChange(false);

                    // Detecta papel do usuário para direcionar à área correta
                    const userId = signInData.user?.id;
                    let destino: "/profissional" | "/admin" | "/home" = "/home";
                    if (userId) {
                      const { data: roles } = await supabase
                        .from("user_roles")
                        .select("role")
                        .eq("user_id", userId);
                      const list = (roles ?? []).map((r) => r.role as string);
                      if (list.includes("admin")) destino = "/admin";
                      else if (list.includes("profissional")) destino = "/profissional";
                    }
                    navigate({ to: destino });
                  } catch (e) {
                    setLoginErro((e as Error).message || "Falha no login");
                  } finally {
                    setLoginLoading(false);
                  }
                }}
                disabled={!loginEmail.trim() || !loginSenha.trim() || loginLoading}
                style={{ background: c.sageDark, color: "white" }}
                className="mt-2 font-bold text-sm py-2.5 rounded-full shadow-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </motion.button>

              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px" style={{ background: c.border }} />
                <span style={{ color: c.muted }} className="text-xs">ou</span>
                <div className="flex-1 h-px" style={{ background: c.border }} />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setMode("register")}
                style={{ color: c.sageDark, border: `1.5px solid ${c.sage}` }}
                className="bg-transparent font-bold text-sm py-2.5 rounded-full transition-colors"
              >
                Cadastrar
              </motion.button>
            </motion.div>
          )}

          {mode === "register" && (
            <>
          {/* Celebration animation */}
          {showCelebration && (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="relative z-10 flex flex-col items-center justify-center py-12 gap-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.6, repeat: 3 }}
                className="text-6xl"
              >
                🎉
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ color: c.sageDark, fontFamily: serif }}
                className="text-2xl font-bold text-center"
              >
                Parabéns, mamãe!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-sm"
                style={{ color: c.muted }}
              >
                Vamos coletar mais alguns dados sobre a sua gestação
              </motion.p>

              {/* Confetti particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ["#f0c040", "#ff6b9d", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"][i % 6],
                    top: "30%",
                    left: "50%",
                  }}
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 300,
                    y: (Math.random() - 0.5) * 200,
                    opacity: 0,
                    scale: [1, 1.5, 0],
                  }}
                  transition={{ duration: 1.5, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}

          {/* Step 1 */}
          {step === 1 && !showCelebration && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative z-10 flex flex-col gap-2"
            >
              {/* Foto */}
              <div className="flex flex-col items-center gap-1 mb-1">
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ background: "white", borderColor: c.border, borderStyle: "dashed" }}
                  className="w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer hover:opacity-80 transition-colors overflow-hidden"
                >
                  {foto ? (
                    <img src={foto} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: c.muted }} className="text-xs text-center leading-tight">Adicionar<br/>foto</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFoto}
                />
              </div>

              <div>
                <Label className={labelClass}>Nome completo</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Maria da Silva"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>CPF</Label>
                  <Input
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label className={labelClass}>Data de nascimento</Label>
                  <Input
                    type="date"
                    value={dataNasc}
                    onChange={(e) => setDataNasc(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>CEP</Label>
                  <div className="relative">
                    <Input
                      value={cep}
                      onChange={(e) => {
                        const v = formatarCep(e.target.value);
                        setCep(v);
                        setCepError("");
                        if (v.replace(/\D/g, "").length === 8) buscarCep(v);
                      }}
                      onBlur={() => buscarCep(cep)}
                      placeholder="00000-000"
                      inputMode="numeric"
                      maxLength={9}
                      className={inputClass}
                    />
                    {cepLoading && (
                      <span style={{ color: c.sage }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">
                        ...
                      </span>
                    )}
                  </div>
                  {cepError && <p className="text-red-300 text-[11px] mt-1">{cepError}</p>}
                </div>

                <div>
                  <Label className={labelClass}>WhatsApp</Label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={inputClass}
                  />
                </div>
              </div>

              {(bairro || cidade) && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className={labelClass}>Bairro</Label>
                    <Input
                      value={bairro}
                      onChange={(e) => {
                        setBairro(e.target.value);
                        setNeighborhoodId(null);
                        setHealthUnitId(null);
                        setUbs("");
                        setUbsManual(false);
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className={labelClass}>Cidade / UF</Label>
                    <Input
                      value={uf ? `${cidade}/${uf}` : cidade}
                      readOnly
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* Distrito sanitário (só aparece se a cidade tem >1 distrito) */}
              {cidade && temDistritos && (
                <div>
                  <Label className={labelClass}>
                    Distrito sanitário {!districtId && <span style={{ color: c.sage }}>— selecione</span>}
                  </Label>
                  <select
                    value={districtId ?? ""}
                    onChange={(e) => {
                      setDistrictId(e.target.value || null);
                      setNeighborhoodId(null);
                      setHealthUnitId(null);
                      setUbs("");
                      setUbsManual(false);
                    }}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="" style={{ color: c.ink }}>Selecione o distrito</option>
                    {distritosCatalogo.map((d) => (
                      <option key={d.id} value={d.id} className="text-[#1a1557]">
                        {d.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* UBS — select dependente do banco */}
              {cidade && (
                <div>
                  <Label className={labelClass}>UBS de referência</Label>
                  {!ubsManual ? (
                    <>
                      <select
                        value={healthUnitId ?? ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id === "__manual__") {
                            setUbsManual(true);
                            setHealthUnitId(null);
                            setUbs("");
                            return;
                          }
                          const found = ubsCatalogo.find((u) => u.id === id);
                          setHealthUnitId(id || null);
                          setUbs(found?.nome ?? "");
                        }}
                        className={`${inputClass} appearance-none`}
                        disabled={temDistritos && !districtId}
                      >
                        <option value="" className="text-[#1a1557]">
                          {temDistritos && !districtId
                            ? "Selecione o distrito primeiro"
                            : ubsCatalogo.length === 0
                              ? "Nenhuma UBS catalogada — digite manualmente"
                              : "Selecione a UBS"}
                        </option>
                        {ubsCatalogo.map((u) => (
                          <option key={u.id} value={u.id} className="text-[#1a1557]">
                            {u.nome}
                          </option>
                        ))}
                        {ubsCatalogo.length > 0 && (
                          <option value="__manual__" className="text-[#1a1557]">
                            + Outra UBS (digitar)
                          </option>
                        )}
                      </select>
                      {ubsCatalogo.length === 0 && (!temDistritos || districtId) && (
                        <button
                          type="button"
                          onClick={() => setUbsManual(true)}
                          className="mt-1 text-[10px] text-[#f0c040] hover:underline"
                        >
                          + Digitar nome da UBS manualmente
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={ubs}
                        onChange={(e) => setUbs(e.target.value)}
                        placeholder="Digite o nome da UBS"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setUbsManual(false);
                          setUbs("");
                          setHealthUnitId(null);
                        }}
                        className="text-[10px] text-white/60 hover:text-[#f0c040] underline whitespace-nowrap self-center"
                      >
                        usar lista
                      </button>
                    </div>
                  )}
                  {ubs && !ubsManual && (
                    <p className="mt-1 text-[10px] text-[#f0c040]/80">
                      Selecionada: <span className="font-bold">{ubs}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label className={labelClass}>Endereço</Label>
                <Input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={inputClass}
                />
              </div>

              <div>
                <Label className={labelClass}>Senha (mín. 6 caracteres)</Label>
                <Input
                  type="password"
                  value={senhaCadastro}
                  onChange={(e) => setSenhaCadastro(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              {/* Gestante toggle */}
              <div className="mt-1">
                <Label className={labelClass}>Você está gestante?</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setGestante(true)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                      gestante === true
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setGestante(false)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                      gestante === false
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {submitErro && (
                <p className="text-red-300 text-xs bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                  {submitErro}
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setMode("login")}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border-2 border-white/40 font-bold text-sm py-2.5 rounded-full backdrop-blur-sm transition-colors"
                >
                  Entrar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStep1Continue}
                  disabled={!nome.trim() || gestante === null || submitting}
                  className="flex-1 bg-[#f0c040] hover:bg-[#e5b535] text-[#1a1557] font-bold text-sm py-2.5 rounded-full shadow-lg shadow-[#f0c040]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Criando conta..." : gestante === true ? "Continuar" : "Finalizar"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Pregnancy data */}
          {step === 2 && !showCelebration && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative z-10 flex flex-col gap-4"
            >
              <div>
                <Label className={labelClass}>Data da última menstruação (DUM)</Label>
                <Input
                  type="date"
                  value={dum}
                  onChange={(e) => setDum(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Auto-calculated fields */}
              {dum && gestAge && dueDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#f0c040]/10 border border-[#f0c040]/30 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Idade gestacional</span>
                    <span className="text-[#f0c040] font-bold">
                      {gestAge.weeks} semanas e {gestAge.days} dias
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Data provável do parto</span>
                    <span className="text-[#f0c040] font-bold">{formatDate(dueDate)}</span>
                  </div>
                </motion.div>
              )}

              <div>
                <Label className={labelClass}>Fez teste de gravidez?</Label>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setTesteGravidez(true)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      testeGravidez === true
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setTesteGravidez(false)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                      testeGravidez === false
                        ? "bg-[#f0c040] text-[#1a1557]"
                        : "bg-white/10 text-white/60 border border-white/20"
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {testeGravidez === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <Label className={labelClass}>Qual teste?</Label>
                  <Input
                    value={qualTeste}
                    onChange={(e) => setQualTeste(e.target.value)}
                    placeholder="Ex: Beta HCG, teste de farmácia..."
                    className={inputClass}
                  />
                </motion.div>
              )}

              {submitErro && (
                <p className="text-red-300 text-xs bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                  {submitErro}
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: "transparent", color: c.muted, border: `1px solid ${c.border}` }}
                  className="flex-1 py-3 rounded-full text-sm font-bold"
                >
                  Voltar
                </button>
                 <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFinish}
                  disabled={submitting}
                  style={{ background: c.sageDark, color: "white" }}
                  className="flex-1 font-bold text-base py-3 rounded-full shadow-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Criando conta..." : "Finalizar"}
                </motion.button>
              </div>
            </motion.div>
          )}

            </>
          )}
        </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
