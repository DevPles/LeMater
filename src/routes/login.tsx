import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import logoMonograma from "@/assets/logo_monograma.png";

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

const initialForm = {
  loginEmail: "",
  loginPassword: "",
  signName: "",
  signEmail: "",
  signPassword: "",
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
        password: form.loginPassword,
      });
      if (error) throw error;

      let isAdmin = false;
      if (data.user?.id) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        isAdmin = (roles ?? []).some((role) => role.role === "admin");
      }

      toast.success("Login realizado com sucesso.");
      navigate({ to: isAdmin ? "/admin" : "/membro" });
    } catch (error) {
      toast.error((error as Error).message || "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = (event: FormEvent) => {
    event.preventDefault();
    toast.info("O cadastro é feito por convite do administrador.");
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

  return (
    <main className="web-login-shell">
      <section className="web-login-desktop" aria-label="Login web">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="web-login-card"
        >

          <div className="web-form-side">
            <div className="web-form-track">
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
                  showPassword={showPassword}
                  onNameChange={update("signName")}
                  onEmailChange={update("signEmail")}
                  onPasswordChange={update("signPassword")}
                  onTogglePassword={() => setShowPassword((current) => !current)}
                  onBack={() => navigate({ to: "/" })}
                  onSubmit={handleSignUp}
                />
              </div>
            </div>
          </div>

          <motion.aside
            className="web-brand-side"
            animate={{ x: mode === "register" ? "-100%" : "0%" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <img className="web-brand-logo" src={logoMonograma} alt="Le Mater" />
            <h2>{mode === "register" ? "Bem-vinda de volta" : "Olá!"}</h2>
            <p>{mode === "register" ? "Já tem conta? Entre agora." : "Sem acesso ainda? Solicite seu cadastro."}</p>
            <button
              type="button"
              className="web-brand-button"
              onClick={() => goToMode(mode === "register" ? "login" : "register")}
            >
              {mode === "register" ? "ENTRAR" : "CADASTRAR"}
            </button>
          </motion.aside>
        </motion.div>
      </section>

      <section className="web-login-mobile" aria-label="Login web mobile">
        <img className="mobile-logo" src={logoMonograma} alt="Le Mater" />
        <div className="mobile-card">
          {mode === "login" && (
            <LoginForm
              email={form.loginEmail}
              password={form.loginPassword}
              showPassword={showPassword}
              loading={loading}
              mobile
              onEmailChange={update("loginEmail")}
              onPasswordChange={update("loginPassword")}
              onTogglePassword={() => setShowPassword((current) => !current)}
              onRecover={() => goToMode("recover")}
              onBack={() => navigate({ to: "/" })}
              onSubmit={handleLogin}
            />
          )}
          {mode === "register" && (
            <RegisterForm
              name={form.signName}
              email={form.signEmail}
              password={form.signPassword}
              showPassword={showPassword}
              mobile
              onNameChange={update("signName")}
              onEmailChange={update("signEmail")}
              onPasswordChange={update("signPassword")}
              onTogglePassword={() => setShowPassword((current) => !current)}
              onSubmit={handleSignUp}
            />
          )}
          {mode === "recover" && (
            <RecoverForm
              email={form.recoverEmail}
              loading={loading}
              mobile
              onEmailChange={update("recoverEmail")}
              onSubmit={handleRecover}
              onBack={() => goToMode("login")}
            />
          )}

          <div className="mobile-actions">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/" })}>
              Voltar
            </Button>
            {mode !== "recover" && (
              <Button type="button" variant="outline" onClick={() => goToMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Cadastrar" : "Entrar"}
              </Button>
            )}
          </div>
        </div>
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
      <button className="web-secondary-button forgot-button" type="button" onClick={onRecover}>
        Esqueci minha senha
      </button>
      <div className="web-form-actions">
        <button className="web-secondary-button" type="button" onClick={onBack}>
          Voltar
        </button>
        <button className="web-primary-button" type="submit" disabled={loading}>
          {loading ? "..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}

function RegisterForm({
  name,
  email,
  password,
  showPassword,
  mobile = false,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onBack,
  onSubmit,
}: {
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
  mobile?: boolean;
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onBack?: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className={mobile ? "mobile-form" : "web-form"} onSubmit={onSubmit}>
      <FormHeader title="Criar conta" subtitle="Solicite seu acesso." />
      <Field label="Nome" value={name} onChange={onNameChange} autoComplete="name" required />
      <Field label="E-mail" type="email" value={email} onChange={onEmailChange} autoComplete="email" required />
      <PasswordField value={password} show={showPassword} onChange={onPasswordChange} onToggle={onTogglePassword} />
      <div className="web-form-actions">
        {onBack && (
          <button className="web-secondary-button" type="button" onClick={onBack}>
            Voltar
          </button>
        )}
        <button className="web-primary-button" type="submit">
          Solicitar acesso
        </button>
      </div>
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
  width: min(640px, calc(100vw - 64px));
  min-height: 400px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border-radius: 18px;
  background: ${CREAM_PANEL};
  box-shadow: 0 30px 60px -30px rgba(35, 71, 53, 0.35);
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
  min-height: 400px;
  display: grid;
  grid-template-columns: 50% 50%;
}

.web-form-panel {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 44px;
}

.web-form {
  width: min(290px, 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-title {
  margin: 0;
  color: ${GREEN_DEEP};
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.08;
}

.form-subtitle {
  margin: 6px 0 4px;
  color: rgba(35, 71, 53, 0.72);
  font-size: 14px;
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
  height: 44px;
  border: 0;
  border-radius: 10px;
  background: #f0e9d8;
  color: ${GREEN_DEEP};
  padding: 0 16px;
  font-size: 15px;
  box-shadow: inset 4px 4px 8px rgba(168, 154, 120, 0.35), inset -4px -4px 8px rgba(255, 255, 255, 0.85);
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
  height: 44px;
  border: 1.5px solid ${GREEN};
  background: transparent;
  color: ${GREEN};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0 16px;
  border-radius: 6px;
}

.forgot-button {
  align-self: stretch;
  border-radius: 999px;
  margin-top: 4px;
}

.web-form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 4px;
}

.web-primary-button {
  height: 46px;
  border: 0;
  border-radius: 6px;
  background: ${GREEN};
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
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
  min-width: 176px;
  height: 46px;
  border: 1.5px solid ${GOLD};
  border-radius: 999px;
  background: transparent;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}

.web-brand-button:hover { background: ${GOLD}; color: ${GREEN_DEEP}; }

.web-login-mobile { display: none; }

@media (max-width: 767px) {
  .web-login-desktop { display: none; }

  .web-login-mobile {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 18px;
    background: ${CREAM};
  }

  .mobile-logo { width: 88px; height: 88px; object-fit: contain; margin-bottom: 22px; }

  .mobile-card {
    width: min(100%, 420px);
    border-radius: 18px;
    background: ${CREAM_PANEL};
    padding: 28px 22px;
    box-shadow: 0 20px 40px -20px rgba(35, 71, 53, 0.3);
  }

  .mobile-form { display: flex; flex-direction: column; gap: 16px; }

  .mobile-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 18px;
  }

  .mobile-actions button { border-color: ${GREEN}; color: ${GREEN}; }

  .form-title { font-size: 30px; }
}
`;