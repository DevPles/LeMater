import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import RegistrationModal from "@/components/RegistrationModal";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — MãeDigital" },
      { name: "description", content: "Acesse seus conteúdos da plataforma MãeDigital." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: LoginPage,
});

const c = {
  cream: "#FAF5EE",
  warm: "#F0E8D8",
  panel: "#EDE4D2",
  sage: "#5C8A6E",
  sageDark: "#2D5A42",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#D8CCB8",
};

const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [regOpen, setRegOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/app/home" });
  };

  const handleForgot = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Informe seu e-mail para recuperar a senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Enviamos um link de recuperação para o seu e-mail.");
    setForgotMode(false);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: c.cream,
        fontFamily: sans,
        color: c.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: 880,
          background: c.warm,
          borderRadius: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
        className="login-card"
      >
        {/* LEFT — form */}
        <div style={{ padding: "48px 44px" }}>
          <h1 style={{ fontFamily: serif, fontSize: 36, fontWeight: 400, color: c.sageDark, margin: 0 }}>
            Entrar
          </h1>
          <p style={{ color: c.muted, fontSize: 14, marginTop: 6, marginBottom: 28 }}>
            Acesse seus conteúdos.
          </p>

          <form onSubmit={handleLogin}>
            <label style={labelStyle}>E-MAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />

            {!forgotMode && (
              <>
                <label style={{ ...labelStyle, marginTop: 18 }}>SENHA</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: 90 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: c.sageDark,
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? "OCULTAR" : "MOSTRAR"}
                  </button>
                </div>
              </>
            )}

            {error && (
              <div style={{ marginTop: 14, color: "#a3322a", fontSize: 13 }}>{error}</div>
            )}
            {info && (
              <div style={{ marginTop: 14, color: c.sageDark, fontSize: 13 }}>{info}</div>
            )}

            <div style={{ marginTop: 22 }}>
              {forgotMode ? (
                <button
                  type="button"
                  onClick={handleForgot}
                  disabled={loading}
                  style={{ ...btnOutline, width: "100%" }}
                >
                  {loading ? "ENVIANDO..." : "ENVIAR LINK DE RECUPERAÇÃO"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError(null);
                    setInfo(null);
                  }}
                  style={{ ...btnOutline, width: "100%" }}
                >
                  ESQUECI MINHA SENHA
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {forgotMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setError(null);
                    setInfo(null);
                  }}
                  style={btnOutline}
                >
                  VOLTAR
                </button>
              ) : (
                <Link to="/" style={{ textDecoration: "none" }}>
                  <button type="button" style={btnOutline}>VOLTAR</button>
                </Link>
              )}
              {!forgotMode && (
                <button type="submit" disabled={loading} style={btnPrimary}>
                  {loading ? "ENTRANDO..." : "ENTRAR"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT — green panel */}
        <div
          style={{
            background: c.sageDark,
            color: "#F5EFE0",
            padding: "48px 36px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <img
            src="/logo-mater.png"
            alt="MãeDigital"
            style={{ width: 96, height: 96, objectFit: "contain", marginBottom: 24, filter: "brightness(1.2)" }}
          />
          <h2 style={{ fontFamily: serif, fontSize: 38, fontWeight: 400, margin: 0, color: "#F5EFE0" }}>
            Olá!
          </h2>
          <p style={{ fontSize: 14, marginTop: 12, marginBottom: 28, opacity: 0.9, maxWidth: 240, lineHeight: 1.5 }}>
            Sem acesso ainda? Solicite seu cadastro.
          </p>
          <button
            type="button"
            onClick={() => setRegOpen(true)}
            style={{
              background: "transparent",
              color: "#F5EFE0",
              border: "1.5px solid #F5EFE0",
              padding: "14px 38px",
              borderRadius: 999,
              fontFamily: sans,
              fontSize: 12,
              letterSpacing: "0.18em",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            CADASTRAR
          </button>
        </div>
      </motion.div>

      <RegistrationModal open={regOpen} onOpenChange={setRegOpen} initialMode="register" />

      <style>{`
        @media (max-width: 720px) {
          .login-card { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  letterSpacing: "0.14em",
  color: c.ink,
  fontWeight: 500,
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: c.cream,
  border: `1px solid ${c.border}`,
  borderRadius: 10,
  padding: "14px 16px",
  fontFamily: sans,
  fontSize: 14,
  color: c.ink,
  outline: "none",
};

const btnOutline: React.CSSProperties = {
  background: "transparent",
  color: c.ink,
  border: `1.5px solid ${c.sage}`,
  padding: "12px 24px",
  borderRadius: 10,
  fontFamily: sans,
  fontSize: 12,
  letterSpacing: "0.14em",
  fontWeight: 500,
  cursor: "pointer",
  flex: 1,
};

const btnPrimary: React.CSSProperties = {
  background: c.sageDark,
  color: "white",
  border: "none",
  padding: "12px 28px",
  borderRadius: 10,
  fontFamily: sans,
  fontSize: 12,
  letterSpacing: "0.14em",
  fontWeight: 600,
  cursor: "pointer",
  flex: 1,
};
