import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import lemateLogo from "@/assets/logo_oficial.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar · Le Mater" }],
    links: [{
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap",
    }],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/atlas" });
  },
  component: LoginPage,
});

// Site palette
const CREAM = "#FAF5EE";
const WARM = "#F5EDE0";
const SAGE = "#5C8A6E";
const SAGE_DARK = "#2D5A42";
const TERRACOTTA = "#C4714A";
const INK = "#1C1C1A";
const MUTED = "#6B6560";

// Soft neumorphic surface based on warm cream
const SURFACE = "#EDE5D6";
const SHADOW_DARK = "rgba(120, 100, 70, 0.25)";
const SHADOW_LIGHT = "rgba(255, 250, 240, 0.95)";

const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const neuInset: CSSProperties = {
  background: SURFACE,
  boxShadow: `inset 3px 3px 6px ${SHADOW_DARK}, inset -3px -3px 6px ${SHADOW_LIGHT}`,
  border: "none",
  borderRadius: 8,
};

const neuRaised: CSSProperties = {
  background: SURFACE,
  boxShadow: `8px 8px 20px ${SHADOW_DARK}, -8px -8px 20px ${SHADOW_LIGHT}`,
  border: "none",
  borderRadius: 14,
};

const inputStyle: CSSProperties = {
  ...neuInset,
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  fontFamily: sans,
  color: INK,
  outline: "none",
};

const labelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: MUTED,
  fontWeight: 500,
  marginBottom: 4,
  display: "block",
};

type Mode = "login" | "signup" | "recover";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [showPwd, setShowPwd] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("role", "admin").limit(1);
    navigate({ to: roles && roles.length > 0 ? "/admin" : "/atlas" });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Cadastro por convite", {
      description: "Novas contas são criadas mediante convite do administrador. Entre em contato para solicitar acesso.",
    });
    setMode("login");
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail.");
      return;
    }
    toast.success("Verifique seu e-mail para redefinir a senha.");
    setMode("login");
  };

  const isSignup = mode === "signup";

  return (
    <div
      style={{
        fontFamily: sans,
        background: CREAM,
        color: INK,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <Link
        to="/"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          ...neuRaised,
          padding: "8px 16px",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: INK,
          textDecoration: "none",
          fontWeight: 500,
          borderRadius: 999,
        }}
      >
        Voltar
      </Link>

      {/* Neumorphic split card — same on desktop and mobile */}
      <div
        className="login-card"
        data-mode={mode}
        style={{
          ...neuRaised,
          width: "100%",
          maxWidth: 600,
          height: 380,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* LEFT half — LOGIN / RECOVER */}
        <div
          className="form-pane form-pane-left"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "50%",
            height: "100%",
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transition: "opacity 300ms",
          }}
        >
          {mode === "recover" ? (
            <form onSubmit={handleRecover}>
              <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, margin: "0 0 4px", color: SAGE_DARK }}>
                Recuperar senha
              </h1>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 20px" }}>
                Enviaremos um link de redefinição.
              </p>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>
              <button type="submit" disabled={loading} style={primaryButton(loading)}>
                {loading ? "Enviando..." : "Enviar link"}
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                style={linkButton}
              >
                Voltar ao login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, margin: "0 0 4px", color: SAGE_DARK }}>
                Entrar
              </h1>
              <p style={{ fontSize: 12, color: MUTED, margin: "0 0 18px" }}>
                Acesse seus conteúdos.
              </p>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>Senha</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 72 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={eyeButton}
                  >
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMode("recover")}
                style={{ ...linkButton, marginTop: 4, marginBottom: 16 }}
              >
                Esqueci minha senha
              </button>

              <button type="submit" disabled={loading} style={primaryButton(loading)}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT half — SIGNUP */}
        <div
          className="form-pane form-pane-right"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "100%",
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transition: "opacity 300ms",
          }}
        >
          <form onSubmit={handleSignUp}>
            <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, margin: "0 0 4px", color: SAGE_DARK }}>
              Criar conta
            </h1>
            <p style={{ fontSize: 12, color: MUTED, margin: "0 0 16px" }}>
              Solicite seu acesso.
            </p>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Nome</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} required />
            </div>

            <button type="submit" style={primaryButton(false)}>
              Solicitar acesso
            </button>
          </form>
        </div>

        {/* SLIDING OVERLAY — sage brand panel */}
        <div
          className="brand-pane"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "50%",
            height: "100%",
            transform: isSignup ? "translateX(100%)" : "translateX(0)",
            transition: "transform 700ms cubic-bezier(0.77, 0, 0.175, 1)",
            background: `linear-gradient(135deg, ${SAGE_DARK} 0%, ${SAGE} 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            color: "white",
            textAlign: "center",
            borderRadius: 14,
            zIndex: 2,
          }}
        >
          <img
            src={lemateLogo}
            alt="Le Mater"
            style={{ height: 56, width: "auto", marginBottom: 18 }}
          />
          <h2 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, margin: "0 0 8px", color: WARM }}>
            {isSignup ? "Bem-vinda de volta" : "Olá!"}
          </h2>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.85)", maxWidth: 220, margin: "0 0 22px" }}>
            {isSignup
              ? "Já tem conta? Entre e continue."
              : "Sem acesso ainda? Solicite seu cadastro."}
          </p>
          <button
            type="button"
            onClick={() => setMode(isSignup ? "login" : "signup")}
            style={{
              background: "transparent",
              color: "white",
              border: `1.5px solid ${TERRACOTTA}`,
              padding: "10px 28px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: sans,
              borderRadius: 999,
              transition: "background 200ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${TERRACOTTA}33`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {isSignup ? "Entrar" : "Cadastrar"}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .login-card { height: 460px !important; max-width: 360px !important; }
          .login-card form h1 { font-size: 20px !important; }
        }
      `}</style>
    </div>
  );
}

const eyeButton: CSSProperties = {
  position: "absolute",
  right: 6,
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "none",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SAGE_DARK,
  cursor: "pointer",
  fontWeight: 600,
  padding: "4px 8px",
};

const linkButton: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 11,
  color: MUTED,
  cursor: "pointer",
  padding: 0,
  marginTop: 12,
  textDecoration: "underline",
  display: "block",
};

function primaryButton(loading: boolean): CSSProperties {
  return {
    width: "100%",
    background: `linear-gradient(135deg, ${SAGE_DARK} 0%, ${SAGE} 100%)`,
    color: "white",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "12px 24px",
    border: "none",
    cursor: loading ? "wait" : "pointer",
    fontFamily: sans,
    opacity: loading ? 0.7 : 1,
    borderRadius: 8,
    boxShadow: `4px 4px 10px ${SHADOW_DARK}, -4px -4px 10px ${SHADOW_LIGHT}`,
  };
}
