import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const goToMode = (nextMode: Mode) => {
    setMode(nextMode);
    setShowPassword(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
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

  const handleSignUp = (event: React.FormEvent) => {
    event.preventDefault();
    toast.info("O cadastro é feito por convite do administrador.");
  };

  const handleRecover = async (event: React.FormEvent) => {
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
          <button className="web-back" type="button" onClick={() => navigate({ to: "/" })}>
            Voltar
          </button>

          <div className="web-form-side">
            <div className="web-form-track" style={{ transform: `translateX(${isRegister ? "-50%" : "0"})` }}>
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
                  onSubmit={handleSignUp}
                />
              </div>
            </div>
          </div>

          <motion.aside
            className="web-brand-side"
            animate={{ x: isRegister ? "-100%" : "0%" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <img className="web-brand-logo" src={logoMonograma} alt="Le Mater" />
            <h2>{isRegister ? "Bem-vinda de volta" : "Olá!"}</h2>
            <p>{isRegister ? "Já tem conta? Entre e continue." : "Sem acesso ainda? Solicite seu cadastro."}</p>
            <button type="button" className="web-brand-button" onClick={() => goToMode(isRegister ? "login" : "register")}>
              {isRegister ? "ENTRAR" : "CADASTRAR"}
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
  onSubmit,
}: {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  mobile?: boolean;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onRecover: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form className={mobile ? "mobile-form" : "web-form"} onSubmit={onSubmit}>
      <FormHeader title="Entrar" subtitle="Acesse seus conteúdos." />
      <Field label="E-mail" type="email" value={email} onChange={onEmailChange} autoComplete="email" required />
      <PasswordField value={password} show={showPassword} onChange={onPasswordChange} onToggle={onTogglePassword} />
      <button className="forgot-button" type="button" onClick={onRecover}>
        Esqueci minha senha
      </button>
      <button className="web-primary-button" type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
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
  onSubmit,
}: {
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
  mobile?: boolean;
  onNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form className={mobile ? "mobile-form" : "web-form"} onSubmit={onSubmit}>
      <FormHeader title="Criar conta" subtitle="Solicite seu acesso." />
      <Field label="Nome" value={name} onChange={onNameChange} autoComplete="name" required />
      <Field label="E-mail" type="email" value={email} onChange={onEmailChange} autoComplete="email" required />
      <PasswordField value={password} show={showPassword} onChange={onPasswordChange} onToggle={onTogglePassword} />
      <button className="web-primary-button" type="submit">
        Solicitar acesso
      </button>
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
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent) => void;
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

function Field({ label, type = "text", ...props }: React.ComponentProps<typeof Input> & { label: string }) {
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
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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

const css = `
.web-login-shell {
  min-height: 100dvh;
  background: #dde2e8;
  color: #1a1557;
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
  width: min(920px, calc(100vw - 64px));
  min-height: 520px;
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border-radius: 24px;
  background: #dde2e8;
  box-shadow: 18px 18px 38px rgba(151, 160, 173, 0.55), -18px -18px 38px rgba(255, 255, 255, 0.9);
}

.web-back {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 8;
  border: 0;
  background: transparent;
  color: #1a1557;
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
  min-height: 520px;
  display: grid;
  grid-template-columns: 50% 50%;
  transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

.web-form-panel {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 76px 64px 52px;
}

.web-form {
  width: min(320px, 100%);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-title {
  margin: 0;
  color: #1a1557;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  line-height: 1.08;
}

.form-subtitle {
  margin: 8px 0 8px;
  color: rgba(26, 21, 87, 0.72);
  font-size: 15px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: rgba(26, 21, 87, 0.82);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.neo-input {
  height: 52px;
  border: 0;
  border-radius: 14px;
  background: #dde2e8;
  color: #1a1557;
  padding: 0 18px;
  font-size: 15px;
  box-shadow: inset 8px 8px 14px rgba(151, 160, 173, 0.35), inset -8px -8px 14px rgba(255, 255, 255, 0.88);
}

.neo-input:focus-visible {
  outline: 2px solid rgba(240, 192, 64, 0.68);
  outline-offset: 2px;
  box-shadow: inset 7px 7px 12px rgba(151, 160, 173, 0.28), inset -7px -7px 12px rgba(255, 255, 255, 0.9), 0 0 0 4px rgba(240, 192, 64, 0.16);
}

.password-wrap {
  position: relative;
}

.password-input {
  padding-right: 94px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #1a1557;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

.forgot-button {
  border: 0;
  background: transparent;
  color: rgba(26, 21, 87, 0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  align-self: flex-start;
  padding: 0;
}

.web-primary-button {
  height: 52px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #1a1557 0%, #342a87 100%);
  color: #f0c040;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 8px 8px 16px rgba(112, 119, 132, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.7);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.web-primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.web-primary-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

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
  border-radius: 24px;
  background: linear-gradient(145deg, #1a1557 0%, #21176e 48%, #0f0b36 100%);
  color: #ffffff;
  box-shadow: -18px 0 42px rgba(26, 21, 87, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.web-brand-logo {
  width: 92px;
  height: 92px;
  object-fit: contain;
  margin-bottom: 28px;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.22));
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
  width: min(260px, 100%);
  margin: 18px 0 34px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 15px;
  line-height: 1.5;
}

.web-brand-button {
  min-width: 176px;
  height: 48px;
  border: 1.5px solid #f0c040;
  border-radius: 999px;
  background: transparent;
  color: #f0c040;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
}

.web-login-mobile {
  display: none;
}

@media (max-width: 767px) {
  .web-login-desktop {
    display: none;
  }

  .web-login-mobile {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 18px;
    background: #dde2e8;
  }

  .mobile-logo {
    width: 92px;
    height: 92px;
    object-fit: contain;
    margin-bottom: 22px;
  }

  .mobile-card {
    width: min(100%, 420px);
    border-radius: 24px;
    background: #dde2e8;
    padding: 28px 22px;
    box-shadow: 14px 14px 28px rgba(151, 160, 173, 0.55), -14px -14px 28px rgba(255, 255, 255, 0.88);
  }

  .mobile-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mobile-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 18px;
  }

  .mobile-actions button {
    border-color: rgba(26, 21, 87, 0.24);
    color: #1a1557;
  }

  .form-title {
    font-size: 31px;
  }
}
`;