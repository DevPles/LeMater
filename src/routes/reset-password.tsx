import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Redefinir senha · Le Mater" }],
    links: [{
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap",
    }],
  }),
  component: ResetPasswordPage,
});

const CREAM = "#FAF5EE";
const SAGE = "#5C8A6E";
const SAGE_DARK = "#2D5A42";
const INK = "#1C1C1A";
const MUTED = "#6B6560";
const SURFACE = "#EDE5D6";
const SHADOW_DARK = "rgba(120, 100, 70, 0.25)";
const SHADOW_LIGHT = "rgba(255, 250, 240, 0.95)";
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-processes the recovery token in the URL hash on load
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível redefinir a senha.");
      return;
    }
    toast.success("Senha redefinida com sucesso.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const inputStyle: CSSProperties = {
    background: SURFACE,
    boxShadow: `inset 3px 3px 6px ${SHADOW_DARK}, inset -3px -3px 6px ${SHADOW_LIGHT}`,
    border: "none",
    borderRadius: 8,
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
  const primary: CSSProperties = {
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
    flex: 1,
  };

  return (
    <div style={{
      fontFamily: sans, background: CREAM, color: INK, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: SURFACE,
        boxShadow: `8px 8px 20px ${SHADOW_DARK}, -8px -8px 20px ${SHADOW_LIGHT}`,
        borderRadius: 14, padding: "36px 32px", width: "100%", maxWidth: 420,
      }}>
        <h1 style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, margin: "0 0 4px", color: SAGE_DARK }}>
          Redefinir senha
        </h1>
        <p style={{ fontSize: 12, color: MUTED, margin: "0 0 22px" }}>
          {ready ? "Defina sua nova senha." : "Validando link de recuperação..."}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nova senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required minLength={6} disabled={!ready} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Confirmar senha</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} required minLength={6} disabled={!ready} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/login" style={{
              background: "transparent", color: SAGE_DARK, border: `1.5px solid ${SAGE_DARK}`,
              padding: "12px 18px", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: sans, borderRadius: 8,
              textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              Voltar
            </Link>
            <button type="submit" disabled={loading || !ready} style={primary}>
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
