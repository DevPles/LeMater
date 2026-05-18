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
      href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap",
    }],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/atlas" });
  },
  component: LoginPage,
});

// Neumorphic palette
const NEU_BG = "#dde2e8";
const NEU_LIGHT = "#ffffff";
const NEU_DARK = "#a3b1c6";
const NAVY = "#1a1557";
const NAVY_DEEP = "#0f0a3a";
const GOLD = "#f0c040";
const INK = "#1c1c1a";
const MUTED = "#6b7280";

const serif = "'Playfair Display', serif";
const sans = "'DM Sans', sans-serif";

const neuInset: CSSProperties = {
  background: NEU_BG,
  boxShadow: `inset 4px 4px 8px ${NEU_DARK}55, inset -4px -4px 8px ${NEU_LIGHT}`,
  border: "none",
  borderRadius: 12,
};

const neuRaised: CSSProperties = {
  background: NEU_BG,
  boxShadow: `6px 6px 14px ${NEU_DARK}55, -6px -6px 14px ${NEU_LIGHT}`,
  border: "none",
  borderRadius: 16,
};

const inputStyle: CSSProperties = {
  ...neuInset,
  width: "100%",
  padding: "14px 16px",
  fontSize: 14,
  fontFamily: sans,
  color: INK,
  outline: "none",
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: MUTED,
  fontWeight: 500,
  marginBottom: 6,
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

  const handleSignUp = async (e: React.FormEvent) => {
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
        background: NEU_BG,
        color: INK,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      {/* Back button */}
      <Link
        to="/"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          ...neuRaised,
          padding: "10px 18px",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: INK,
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        Voltar
      </Link>

      {/* DESKTOP — neumorphic split card */}
      <div
        className="login-desktop"
        style={{
          ...neuRaised,
          width: "100%",
          maxWidth: 960,
          minHeight: 560,
          position: "relative",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {/* LEFT — form area (two stacked: login/recover on top, signup beneath) */}
        <div style={{ flex: 1, position: "relative" }}>
          {/* Login / Recover panel */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "56px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              opacity: isSignup ? 0 : 1,
              pointerEvents: isSignup ? "none" : "auto",
              transition: "opacity 400ms ease 300ms",
            }}
          >
            {mode === "login" && (
              <form onSubmit={handleLogin}>
                <h1 style={{ fontFamily: serif, fontSize: 34, fontWeight: 600, margin: "0 0 8px", color: NAVY }}>
                  Entrar
                </h1>
                <p style={{ fontSize: 13, color: MUTED, margin: "0 0 32px" }}>
                  Acesse sua área de conteúdos.
                </p>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Senha</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      style={{ ...inputStyle, paddingRight: 90 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: NAVY,
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: "6px 10px",
                      }}
                    >
                      {showPwd ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("recover")}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 12,
                    color: MUTED,
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: 28,
                    textDecoration: "underline",
                  }}
                >
                  Esqueci minha senha
                </button>

                <button type="submit" disabled={loading} style={primaryButton(loading)}>
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            )}

            {mode === "recover" && (
              <form onSubmit={handleRecover}>
                <h1 style={{ fontFamily: serif, fontSize: 32, fontWeight: 600, margin: "0 0 8px", color: NAVY }}>
                  Recuperar senha
                </h1>
                <p style={{ fontSize: 13, color: MUTED, margin: "0 0 32px" }}>
                  Enviaremos um link para redefinir sua senha.
                </p>

                <div style={{ marginBottom: 28 }}>
                  <label style={labelStyle}>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} style={primaryButton(loading)}>
                  {loading ? "Enviando..." : "Enviar link"}
                </button>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 12,
                    color: MUTED,
                    cursor: "pointer",
                    padding: 0,
                    marginTop: 18,
                    textDecoration: "underline",
                  }}
                >
                  Voltar ao login
                </button>
              </form>
            )}
          </div>

          {/* Signup panel */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "56px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              opacity: isSignup ? 1 : 0,
              pointerEvents: isSignup ? "auto" : "none",
              transition: "opacity 400ms ease 300ms",
            }}
          >
            <form onSubmit={handleSignUp}>
              <h1 style={{ fontFamily: serif, fontSize: 34, fontWeight: 600, margin: "0 0 8px", color: NAVY }}>
                Criar conta
              </h1>
              <p style={{ fontSize: 13, color: MUTED, margin: "0 0 28px" }}>
                Solicite seu acesso ao sistema.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nome</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} required />
              </div>

              <button type="submit" style={primaryButton(false)}>
                Solicitar acesso
              </button>
            </form>
          </div>
        </div>

        {/* Right column placeholder (same size as overlay) */}
        <div style={{ flex: 1 }} />

        {/* SLIDING OVERLAY — navy brand panel */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: "50%",
            height: "100%",
            transform: isSignup ? "translateX(-100%)" : "translateX(0)",
            transition: "transform 700ms cubic-bezier(0.77, 0, 0.175, 1)",
            background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            color: "white",
            textAlign: "center",
            borderRadius: 16,
          }}
        >
          <img
            src={lemateLogo}
            alt="Le Mater"
            style={{ height: 80, width: "auto", marginBottom: 28, filter: "brightness(1.1)" }}
          />
          <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 600, margin: "0 0 14px", color: GOLD }}>
            {isSignup ? "Bem-vinda de volta" : "Olá!"}
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.8)", maxWidth: 280, margin: "0 0 32px" }}>
            {isSignup
              ? "Já tem uma conta? Entre e continue sua jornada."
              : "Não possui acesso ainda? Solicite seu cadastro."}
          </p>
          <button
            type="button"
            onClick={() => setMode(isSignup ? "login" : "signup")}
            style={{
              background: "transparent",
              color: "white",
              border: `1.5px solid ${GOLD}`,
              padding: "14px 38px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: sans,
              borderRadius: 8,
              transition: "background 200ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${GOLD}22`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {isSignup ? "Entrar" : "Cadastrar"}
          </button>
        </div>
      </div>

      {/* MOBILE fallback */}
      <div className="login-mobile" style={{ display: "none", width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={lemateLogo} alt="Le Mater" style={{ height: 72, width: "auto" }} />
        </div>

        <div style={{ ...neuRaised, padding: 28 }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {(["login", "signup", "recover"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  ...(mode === m ? neuInset : {}),
                  background: mode === m ? NEU_BG : "transparent",
                  border: "none",
                  padding: "10px 6px",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: mode === m ? NAVY : MUTED,
                  cursor: "pointer",
                  fontWeight: 600,
                  borderRadius: 8,
                }}
              >
                {m === "login" ? "Entrar" : m === "signup" ? "Cadastrar" : "Recuperar"}
              </button>
            ))}
          </div>

          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Senha</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    style={{ ...inputStyle, paddingRight: 90 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={{
                      position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                      background: "transparent", border: "none", fontSize: 11,
                      letterSpacing: "0.1em", textTransform: "uppercase", color: NAVY,
                      cursor: "pointer", fontWeight: 600, padding: "6px 10px",
                    }}
                  >
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={primaryButton(loading)}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignUp}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nome</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} required />
              </div>
              <button type="submit" style={primaryButton(false)}>Solicitar acesso</button>
            </form>
          )}

          {mode === "recover" && (
            <form onSubmit={handleRecover}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>
              <button type="submit" disabled={loading} style={primaryButton(loading)}>
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-desktop { display: none !important; }
          .login-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function primaryButton(loading: boolean): CSSProperties {
  return {
    width: "100%",
    background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
    color: "white",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    padding: "16px 28px",
    border: "none",
    cursor: loading ? "wait" : "pointer",
    fontFamily: sans,
    opacity: loading ? 0.7 : 1,
    borderRadius: 10,
    boxShadow: `4px 4px 10px ${NEU_DARK}66, -4px -4px 10px ${NEU_LIGHT}`,
  };
}
