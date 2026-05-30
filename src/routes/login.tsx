import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";
import { motion } from "framer-motion";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import logoMonograma from "@/assets/logo_monograma.png";
import { resolvePostLoginPath, waitForActiveSession } from "@/lib/auth-routing";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login Web — Le Mater" },
      { name: "description", content: "Acesse a área web da Le Mater." },
    ],
  }),
  component: LoginPage,
});

type Mode = "login" | "register" | "recover";

const PAISES = [
  { code: "BR", label: "Brasil", dial: "+55", flag: "br" },
  { code: "US", label: "Estados Unidos", dial: "+1", flag: "us" },
  { code: "ES", label: "Espanha", dial: "+34", flag: "es" },
];


const initialForm = {
  loginEmail: "",
  loginPassword: "",
  signName: "",
  signEmail: "",
  signPassword: "",
  signCountry: "BR",
  signPhone: "",
  recoverEmail: "",
};


function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const isRecover = mode === "recover";

  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const goToMode = (nextMode: Mode) => {
    setMode(nextMode);
    setShowPassword(false);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.loginEmail.trim(),
        password: form.loginPassword.trim(),
      });
      if (error) throw error;

      const session = await waitForActiveSession(data.user?.id);
      if (!session) throw new Error("Sessão não foi confirmada. Tente entrar novamente.");
      const destino = await resolvePostLoginPath(session.user.id, "/app/membro");

      toast.success("Login realizado com sucesso.");
      navigate({ to: destino });
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const email = form.signEmail.trim();
      const password = form.signPassword;
      const name = form.signName.trim();
      const country = form.signCountry;
      const phoneDigits = form.signPhone.replace(/\D/g, "");
      const dial = PAISES.find((p) => p.code === country)?.dial ?? "";
      if (!name) throw new Error("Informe seu nome.");
      if (!email || !email.includes("@")) throw new Error("Informe um e-mail válido.");
      if (password.length < 4) throw new Error("A senha precisa ter ao menos 4 caracteres.");
      if (!phoneDigits || phoneDigits.length < 6) throw new Error("Informe um celular válido.");
      const fullPhone = dial ? `${dial}${phoneDigits}` : phoneDigits;

      const { data: signData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/membro`,
          data: { full_name: name, phone: fullPhone, country },
        },
      });
      if (error) throw error;

      // Auto-login: if no session was returned (email confirmation flow), sign in directly
      let session = signData.session;
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        session = signInData.session;
      }

      const activeSession = await waitForActiveSession(signData.user?.id);
      const userId = activeSession?.user.id ?? session?.user.id;
      if (!userId) throw new Error("Não foi possível iniciar a sessão.");
      const destino = await resolvePostLoginPath(userId, "/app/membro");

      toast.success("Conta criada! Bem-vinda.");
      navigate({ to: destino });
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível cadastrar.");
    } finally {
      setLoading(false);
    }
  };


  const handleRecover = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const email = form.recoverEmail.trim();
      if (!email || !email.includes("@")) throw new Error("Informe um e-mail válido.");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;

      toast.success("Enviamos o link de recuperação para o seu e-mail.");
      goToMode("login");
      setForm((current) => ({ ...current, loginEmail: email, recoverEmail: "" }));
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível enviar o link.");
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();
  const desktopSlideOffset = mode === "register" ? "-100%" : "0%";
  const mobileFormOffset = mode === "register" ? "-50%" : "0%";
  const brandAnim = isMobile
    ? { x: "0%", y: "0%" }
    : { x: desktopSlideOffset, y: "0%" };
  const trackAnim = isMobile
    ? { x: "0%", y: mobileFormOffset }
    : { x: "0%", y: "0%" };

  return (
    <main className="web-login-shell">
      <section className="web-login-desktop" aria-label="Login web">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="web-login-card"
          data-mode={mode}
        >
          <div className="web-form-side">
            <motion.div
              className="web-form-track"
              animate={trackAnim}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="web-form-panel">
                {isRecover ? (
                  <RecoverForm
                    email={form.recoverEmail}
                    loading={loading}
                    onEmailChange={update("recoverEmail")}
                    onSubmit={handleRecover}
                    onBack={() => goToMode("login")}
                  />
                ) : (
                  <LoginForm
                    email={form.loginEmail}
                    password={form.loginPassword}
                    showPassword={showPassword}
                    loading={loading}
                    onEmailChange={update("loginEmail")}
                    onPasswordChange={update("loginPassword")}
                    onTogglePassword={() => setShowPassword((current) => !current)}
                    onRecover={() => goToMode("recover")}
                    onBack={() => navigate({ to: "/" })}
                    onSubmit={handleLogin}
                  />
                )}
              </div>

              <div className="web-form-panel">
                <RegisterForm
                  name={form.signName}
                  email={form.signEmail}
                  password={form.signPassword}
                  country={form.signCountry}
                  phone={form.signPhone}
                  showPassword={showPassword}
                  mobile={isMobile}
                  onNameChange={update("signName")}
                  onEmailChange={update("signEmail")}
                  onPasswordChange={update("signPassword")}
                  onCountryChange={(v) => setForm((c) => ({ ...c, signCountry: v }))}
                  onPhoneChange={update("signPhone")}
                  onTogglePassword={() => setShowPassword((current) => !current)}
                  onBack={() => navigate({ to: "/" })}
                  onSubmit={handleSignUp}
                />

              </div>
            </motion.div>
          </div>

          <motion.aside
            className="web-brand-side"
            animate={brandAnim}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="web-brand-content" key={mode}>
              <img className="web-brand-logo" src={logoMonograma} alt="Le Mater" />
              <h2>{mode === "register" ? "Bem-vinda de volta" : "Olá!"}</h2>
              <p>{mode === "register" ? "Já tem conta? Entre e continue." : "Sem acesso ainda? Solicite seu cadastro."}</p>
              <button
                type="button"
                className="web-brand-button"
                onClick={() => goToMode(mode === "register" ? "login" : "register")}
              >
                {mode === "register" ? "LOGIN" : "CADASTRAR"}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      </section>

      <style>{css}</style>
    </main>
  );
}


function LoginForm({
  email,
  password,
  showPassword,
  loading,
  mobile = false,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onRecover,
  onBack,
  onSubmit,
}: {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  mobile?: boolean;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onRecover: () => void;
  onBack: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className={mobile ? "mobile-form" : "web-form"} onSubmit={onSubmit}>
      <FormHeader title="Entrar" subtitle="Acesse seus conteúdos." />
      <Field label="E-mail" type="email" value={email} onChange={onEmailChange} autoComplete="email" required />
      <PasswordField value={password} show={showPassword} onChange={onPasswordChange} onToggle={onTogglePassword} />
      <button className={mobile ? "mobile-link" : "web-secondary-button forgot-button"} type="button" onClick={onRecover}>
        Esqueci minha senha
      </button>
      {mobile ? (
        <button className="web-primary-button" type="submit" disabled={loading}>
          {loading ? "..." : "Entrar"}
        </button>
      ) : (
        <div className="web-form-actions">
          <button className="web-secondary-button" type="button" onClick={onBack}>
            Voltar
          </button>
          <button className="web-primary-button" type="submit" disabled={loading}>
            {loading ? "..." : "Entrar"}
          </button>
        </div>
      )}
    </form>
  );
}

function RegisterForm({
  name,
  email,
  password,
  country,
  phone,
  showPassword,
  mobile = false,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onCountryChange,
  onPhoneChange,
  onTogglePassword,
  onBack,
  onSubmit,
}: {
  name: string;
  email: string;
  password: string;
  country: string;
  phone: string;
  showPassword: boolean;
  mobile?: boolean;
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCountryChange: (value: string) => void;
  onPhoneChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onBack?: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const selected = PAISES.find((p) => p.code === country) ?? PAISES[0];
  const dial = selected.dial;
  const [brBurstId, setBrBurstId] = useState(0);
  const handleCountryClick = (code: string) => {
    onCountryChange(code);
    if (code === "BR") setBrBurstId((n) => n + 1);
  };
  const confettiPieces = Array.from({ length: 22 }, (_, i) => i);
  return (
    <form className={mobile ? "mobile-form" : "web-form"} onSubmit={onSubmit}>
      <FormHeader title="Criar conta" subtitle="É rápido e gratuito." />
      <Field label="Nome" value={name} onChange={onNameChange} autoComplete="name" required />
      <Field label="E-mail" type="email" value={email} onChange={onEmailChange} autoComplete="email" required />
      <div className="field-group">
        <Label className="field-label">País</Label>
        <div className="country-flags">
          {PAISES.map((p) => (
            <button
              key={p.code}
              type="button"
              className={`country-flag-btn${country === p.code ? " is-active" : ""}`}
              onClick={() => handleCountryClick(p.code)}
              aria-label={p.label}
              title={p.label}
            >
              <img
                src={`https://flagcdn.com/w80/${p.flag}.png`}
                srcSet={`https://flagcdn.com/w160/${p.flag}.png 2x`}
                alt={p.code}
              />
              {p.code === "BR" && brBurstId > 0 && (
                <span key={brBurstId} className="confetti-burst" aria-hidden="true">
                  {confettiPieces.map((i) => {
                    const angle = (i / confettiPieces.length) * Math.PI * 2;
                    const dist = 48 + Math.random() * 32;
                    const tx = Math.cos(angle) * dist;
                    const ty = Math.sin(angle) * dist;
                    const rot = Math.random() * 720 - 360;
                    const color = i % 2 === 0 ? "#00a859" : "#ffd700";
                    const delay = Math.random() * 60;
                    return (
                      <span
                        key={i}
                        className="confetti-piece"
                        style={{
                          background: color,
                          ["--tx" as string]: `${tx}px`,
                          ["--ty" as string]: `${ty}px`,
                          ["--rot" as string]: `${rot}deg`,
                          animationDelay: `${delay}ms`,
                        }}
                      />
                    );
                  })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="field-group">
        <Label className="field-label">Celular</Label>
        <div className="phone-wrap neo-input phone-combined">
          <span className="phone-dial">{dial}</span>
          <input
            className="phone-input-bare"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={onPhoneChange}
            placeholder="(00) 00000-0000"
            required
          />
        </div>
      </div>

      <PasswordField value={password} show={showPassword} onChange={onPasswordChange} onToggle={onTogglePassword} />

      {mobile ? (
        <button className="web-primary-button" type="submit">
          Cadastrar
        </button>
      ) : (
        <div className="web-form-actions">
          {onBack && (
            <button className="web-secondary-button" type="button" onClick={onBack}>
              Voltar
            </button>
          )}
          <button className="web-primary-button" type="submit">
            Cadastrar
          </button>
        </div>
      )}
    </form>
  );
}

function RecoverForm({
  email,
  loading,
  mobile = false,
  onEmailChange,
  onSubmit,
  onBack,
}: {
  email: string;
  loading: boolean;
  mobile?: boolean;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <form className={mobile ? "mobile-form" : "web-form"} onSubmit={onSubmit}>
      <FormHeader title="Recuperar senha" subtitle="Receba um link para redefinir sua senha." />
      <Field label="E-mail" type="email" value={email} onChange={onEmailChange} autoComplete="email" required />
      <button className="web-primary-button" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link"}
      </button>
      <button className="forgot-button" type="button" onClick={onBack}>
        Voltar para entrar
      </button>
    </form>
  );
}

function FormHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="form-title">{title}</h1>
      <p className="form-subtitle">{subtitle}</p>
    </div>
  );
}

function Field({ label, type = "text", ...props }: ComponentProps<typeof Input> & { label: string }) {
  return (
    <div className="field-group">
      <Label className="field-label">{label}</Label>
      <Input className="neo-input" type={type} {...props} />
    </div>
  );
}

function PasswordField({
  value,
  show,
  onChange,
  onToggle,
}: {
  value: string;
  show: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
}) {
  return (
    <div className="field-group">
      <Label className="field-label">Senha</Label>
      <div className="password-wrap">
        <Input
          className="neo-input password-input"
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete="current-password"
          required
        />
        <button className="password-toggle" type="button" onClick={onToggle}>
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </div>
  );
}

const CREAM = "#f5efe2";
const CREAM_PANEL = "#ebe4d3";
const GREEN = "#2f5d4a";
const GREEN_DEEP = "#234735";
const GOLD = "#c9a24a";

const css = `
.web-login-shell {
  min-height: 100dvh;
  background: ${CREAM};
  color: ${GREEN_DEEP};
  font-family: var(--font-body);
}

.web-login-desktop {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.web-login-card {
  width: min(440px, calc(100vw - 48px));
  min-height: 280px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border-radius: 16px;
  background: ${CREAM_PANEL};
  box-shadow: 0 30px 60px -30px rgba(35, 71, 53, 0.35);
}


.country-flags {
  display: flex;
  gap: 10px;
  align-items: center;
}
.country-flag-btn {
  position: relative;
  width: 56px;
  height: 40px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: ${CREAM_PANEL};
  padding: 0;
  cursor: pointer;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, transform 0.2s;
}
.country-flag-btn > img {
  border-radius: 8px;
  overflow: hidden;
}
.confetti-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
.confetti-piece {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 10px;
  border-radius: 2px;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: confettiFly 900ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
  box-shadow: 0 0 6px rgba(0,0,0,0.15);
}
@keyframes confettiFly {
  0% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(0.6); }
  60% { opacity: 1; }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(1);
  }
}
.country-flag-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.country-flag-btn:hover { transform: translateY(-1px); }
.country-flag-btn.is-active {
  border-color: ${GREEN_DEEP};
  box-shadow: 0 4px 12px -4px rgba(35, 71, 53, 0.4);
}
.phone-combined {
  display: flex;
  align-items: center;
  padding: 0 12px 0 14px;
  gap: 8px;
}
.phone-dial {
  font-size: 14px;
  font-weight: 700;
  color: ${GREEN_DEEP};
}
.phone-input-bare {
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-size: 15px;
  color: ${GREEN_DEEP};
  height: 100%;
  padding: 0;
  min-width: 0;
}


.web-back {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 8;
  border: 0;
  background: transparent;
  color: ${GREEN_DEEP};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
}

.web-form-side {
  width: 100%;
  overflow: hidden;
  grid-column: 1 / -1;
}

.web-form-track {
  width: 100%;
  min-height: 320px;
  display: grid;
  grid-template-columns: 50% 50%;
}

.web-form-panel {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 22px;
}

.web-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-title {
  margin: 0;
  color: ${GREEN_DEEP};
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.1;
}

.form-subtitle {
  margin: 4px 0 2px;
  color: rgba(35, 71, 53, 0.72);
  font-size: 13px;
}

.field-group { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  color: rgba(35, 71, 53, 0.78);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.neo-input {
  height: 38px;
  border: 0;
  border-radius: 8px;
  background: #f0e9d8;
  color: ${GREEN_DEEP};
  padding: 0 12px;
  font-size: 14px;
  box-shadow: inset 3px 3px 6px rgba(168, 154, 120, 0.35), inset -3px -3px 6px rgba(255, 255, 255, 0.85);
}

.neo-input:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }

.password-wrap { position: relative; }
.password-input { padding-right: 94px; }

.password-toggle {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: ${GREEN};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}

.web-secondary-button {
  height: 38px;
  border: 1.5px solid ${GREEN};
  background: transparent;
  color: ${GREEN};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0 12px;
  border-radius: 6px;
}

.forgot-button {
  align-self: stretch;
  border-radius: 999px;
  margin-top: 2px;
}

.web-form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 2px;
}

.web-primary-button {
  height: 40px;
  border: 0;
  border-radius: 6px;
  background: ${GREEN};
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 6px 14px -6px rgba(35, 71, 53, 0.6);
  transition: background 180ms ease;
}

.web-primary-button:hover:not(:disabled) { background: ${GREEN_DEEP}; }
.web-primary-button:disabled { opacity: 0.6; cursor: not-allowed; }

.web-brand-side {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 5;
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 52px;
  background: linear-gradient(160deg, ${GREEN} 0%, ${GREEN_DEEP} 100%);
  color: #ffffff;
}

.web-brand-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.web-brand-logo {
  width: 88px;
  height: 88px;
  object-fit: contain;
  margin-bottom: 26px;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.2));
}

.web-brand-side h2 {
  margin: 0;
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  line-height: 1.08;
}

.web-brand-side p {
  width: min(280px, 100%);
  margin: 14px 0 30px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 14px;
  line-height: 1.5;
}

.web-brand-button {
  min-width: 0;
  height: 44px;
  padding: 0 22px;
  border: 1.5px solid ${GOLD};
  border-radius: 999px;
  background: transparent;
  color: ${GOLD};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: background 180ms ease, color 180ms ease;
}

.web-brand-button:hover { background: ${GOLD}; color: ${GREEN_DEEP}; }

@media (max-width: 767px) {
  .web-login-desktop {
    min-height: 100dvh;
    padding: clamp(28px, 8dvh, 72px) 18px 18px;
    align-items: flex-start;
  }

  .web-login-card {
    --mobile-form-h: 340px;
    width: min(320px, 100%);
    min-height: 0;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    border-radius: 12px;
    box-shadow: 0 22px 34px -22px rgba(35, 71, 53, 0.45);
  }

  .web-login-card[data-mode="register"] { --mobile-form-h: 540px; }
  .web-login-card[data-mode="recover"] { --mobile-form-h: 260px; }



  .web-form-side {
    grid-column: 1 / -1;
    grid-row: 2;
    height: var(--mobile-form-h);
    transition: height 0.45s ease;
  }

  .web-form-track {
    width: 100%;
    height: calc(var(--mobile-form-h) * 2);
    min-height: calc(var(--mobile-form-h) * 2);
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: var(--mobile-form-h) var(--mobile-form-h);
  }

  .web-form-panel {
    height: var(--mobile-form-h);
    align-items: flex-start;
    padding: 22px 28px 24px;
  }

  .web-form,
  .mobile-form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .form-title { font-size: 24px; }
  .form-subtitle { margin: 6px 0 4px; font-size: 13px; }
  .field-group { gap: 7px; }
  .field-label { font-size: 10px; letter-spacing: 0.2em; }
  .neo-input { height: 40px; border-radius: 8px; font-size: 14px; }
  .forgot-button { margin-top: 2px; border-radius: 6px; }
  .web-form-actions { gap: 10px; margin-top: 2px; }
  .web-primary-button { height: 42px; font-size: 11px; }
  .web-secondary-button { height: 42px; font-size: 11px; }

  .web-brand-side {
    position: relative;
    grid-column: 1 / -1;
    grid-row: 1;
    width: 100%;
    height: 214px;
    padding: 16px 24px 18px;
    border-radius: 0;
  }

  .web-brand-logo { width: 88px; height: 88px; margin-bottom: 12px; }
  .web-brand-side h2 { font-size: 20px; }
  .web-brand-side p { width: 100%; font-size: 12px; margin: 8px 0 14px; line-height: 1.35; }
  .web-brand-button { height: 38px; min-width: 104px; padding: 0 18px; font-size: 10px; }
}
`;