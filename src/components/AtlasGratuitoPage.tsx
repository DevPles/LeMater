import { useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageLight: "#8AB89A",
  sageDark: "#2D5A42",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(200),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido").max(40),
  momento: z.string().min(1, "Selecione um momento"),
});

const btnPrimary: CSSProperties = {
  background: c.sageDark,
  color: "white",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "16px 36px",
  border: "none",
  cursor: "pointer",
  fontFamily: sans,
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "white",
  border: `1px solid ${c.border}`,
  padding: "14px 16px",
  fontSize: 14,
  fontFamily: sans,
  color: c.ink,
  outline: "none",
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: c.muted,
  marginBottom: 8,
  display: "block",
};

export type AtlasGratuitoProps = {
  categoria: string;
  titulo: string;
  intro: string[];
  aprendizados: string[];
  slug: string;
  programa: { titulo: string; descricao: string; rota: string };
};

export function AtlasGratuitoPage({ categoria, titulo, intro, aprendizados, slug, programa }: AtlasGratuitoProps) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", momento: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("atlas_leads").insert({
      nome: parsed.data.nome,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      momento: parsed.data.momento,
      origem: slug,
    });
    setSubmitting(false);
    if (error) {
      setErrors({ form: "Não foi possível enviar agora. Tente novamente em instantes." });
      return;
    }
    setSuccess(true);
  };

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      {/* Header simples */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}`, padding: isMobile ? "16px 20px" : "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ textDecoration: "none", color: c.ink }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, letterSpacing: "0.08em" }}>
            Le<span style={{ color: c.sage }}>Mater</span>
          </div>
        </Link>
        <Link to="/" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, textDecoration: "none" }}>
          Voltar ao Atlas Materno
        </Link>
      </nav>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: isMobile ? "48px 24px 80px" : "80px 48px 120px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, height: 1, background: c.sage }} />
          {categoria}
        </div>
        <h1 style={{ fontFamily: serif, fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, lineHeight: 1.15, marginBottom: 32, color: c.ink }}>
          {titulo}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 56 }}>
          {intro.map((p, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.7, color: c.muted, fontWeight: 300 }}>{p}</p>
          ))}
        </div>

        {/* O que você vai aprender */}
        <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 40, marginBottom: 56 }}>
          <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, marginBottom: 24 }}>O que você vai aprender</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {aprendizados.map((item) => (
              <li key={item} style={{ display: "flex", gap: 14, alignItems: "flex-start", fontSize: 15, lineHeight: 1.6, color: c.ink }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.sage, marginTop: 9, flexShrink: 0 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Formulário */}
        <div style={{ background: c.warm, padding: isMobile ? 28 : 48, borderRadius: 4 }}>
          {success ? (
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sage, marginBottom: 12 }}>Conteúdo liberado</div>
              <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, marginBottom: 12 }}>Obrigada, {form.nome.split(" ")[0]}.</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: c.muted }}>
                Enviamos o material para <strong style={{ color: c.ink }}>{form.email}</strong>. Em instantes você também receberá uma mensagem no WhatsApp com o link de acesso.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, marginBottom: 8 }}>Liberar este conteúdo gratuito</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: c.muted, marginBottom: 28 }}>
                Preencha abaixo e receba o material no seu e-mail e WhatsApp.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  {errors.nome && <div style={{ fontSize: 12, color: "#B0451E", marginTop: 6 }}>{errors.nome}</div>}
                </div>
                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  {errors.email && <div style={{ fontSize: 12, color: "#B0451E", marginTop: 6 }}>{errors.email}</div>}
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input type="tel" style={inputStyle} placeholder="(00) 00000-0000" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                  {errors.whatsapp && <div style={{ fontSize: 12, color: "#B0451E", marginTop: 6 }}>{errors.whatsapp}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Momento atual</label>
                  <select style={inputStyle} value={form.momento} onChange={(e) => setForm({ ...form, momento: e.target.value })}>
                    <option value="">Selecione</option>
                    <option value="tentando">Tentando engravidar</option>
                    <option value="gravida">Estou grávida</option>
                    <option value="pos-parto">Estou no pós-parto</option>
                    <option value="bebe">Com bebê em casa</option>
                  </select>
                  {errors.momento && <div style={{ fontSize: 12, color: "#B0451E", marginTop: 6 }}>{errors.momento}</div>}
                </div>
              </div>
              {errors.form && <div style={{ fontSize: 13, color: "#B0451E", marginBottom: 16 }}>{errors.form}</div>}
              <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, width: isMobile ? "100%" : "auto" }}>
                {submitting ? "Enviando..." : "LIBERAR CONTEÚDO GRATUITO"}
              </button>
            </form>
          )}
        </div>

        {/* Próximo passo recomendado */}
        <div style={{ marginTop: 80 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted, marginBottom: 12 }}>Próximo passo recomendado</div>
          <div style={{ background: "white", border: `1px solid ${c.border}`, padding: isMobile ? 28 : 40, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, marginBottom: 8, color: c.ink }}>{programa.titulo}</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: c.muted, margin: 0 }}>{programa.descricao}</p>
            </div>
            <a href={programa.rota} style={{ textDecoration: "none" }}>
              <button style={{ ...btnPrimary, background: "transparent", color: c.sageDark, border: `1.5px solid ${c.sageDark}`, whiteSpace: "nowrap" }}>
                CONHECER PROGRAMA COMPLETO
              </button>
            </a>
          </div>
        </div>
      </main>

      <footer style={{ padding: "24px 48px", borderTop: `1px solid ${c.border}`, fontSize: 11, color: c.muted, letterSpacing: "0.06em", textAlign: "center" }}>
        © 2026 · Le Mater · Rayssa Leslie
      </footer>
    </div>
  );
}
