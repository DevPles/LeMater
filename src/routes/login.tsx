import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import lemateLogo from "@/assets/lemater-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Entrar · Le Mater" }],
    links: [{
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap",
    }],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/atlas" });
  },
  component: LoginPage,
});

const c = { cream: "#FAF5EE", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";
const inputStyle: CSSProperties = {
  width: "100%", background: "white", border: `1px solid ${c.border}`,
  padding: "14px 16px", fontSize: 14, fontFamily: sans, color: c.ink, outline: "none",
};

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
    setLoading(false);
    if (error) { setErro("E-mail ou senha incorretos."); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("role", "admin").limit(1);
    navigate({ to: roles && roles.length > 0 ? "/admin" : "/atlas" });
  };

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link to="/" style={{ display: "block", textAlign: "center", marginBottom: 32 }}>
          <img src={lemateLogo} alt="Le Mater" style={{ height: 64, width: "auto" }} />
        </Link>
        <div style={{ background: "white", border: `1px solid ${c.border}`, padding: 40 }}>
          <h1 style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, margin: "0 0 8px" }}>Entrar</h1>
          <p style={{ fontSize: 14, color: c.muted, margin: "0 0 28px" }}>Acesse sua área de conteúdos.</p>
          <form onSubmit={submit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} required />
            </div>
            {erro && <div style={{ fontSize: 13, color: "#B23A48", marginTop: 14 }}>{erro}</div>}
            <button type="submit" disabled={loading} style={{ marginTop: 24, width: "100%", background: c.sageDark, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "16px 28px", border: "none", cursor: loading ? "wait" : "pointer", fontFamily: sans, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link to="/" style={{ fontSize: 12, color: c.muted, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}>← Voltar ao site</Link>
        </div>
      </div>
    </div>
  );
}
