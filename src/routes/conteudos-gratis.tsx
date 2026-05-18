import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type CSSProperties } from "react";
import lemateLogo from "@/assets/lemater-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { registrarLead } from "@/lib/leads.functions";

export const Route = createFileRoute("/conteudos-gratis")({
  head: () => ({
    meta: [
      { title: "Conteúdo · Le Mater" },
      {
        name: "description",
        content:
          "Materiais para mulheres em todas as fases da jornada materna — concepção, gestação, pós-parto e primeiros cuidados com o bebê.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: ConteudosGratisPage,
});

const NAV_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ["inicio", "Início"],
  ["sobre", "Sobre"],
  ["produtos", "ATLAS MATERNO"],
  ["contato", "Contato"],
];

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

type Conteudo = {
  numero: string;
  categoria: string;
  titulo: string;
  descricao: string;
  formato: string;
};

const CONTEUDOS: Conteudo[] = [
  {
    numero: "01",
    categoria: "Concepção",
    titulo: "7 sinais de que você pode estar errando sua janela fértil",
    descricao:
      "Um guia direto para entender o seu ciclo, identificar o período fértil real e aumentar suas chances naturais de engravidar.",
    formato: "PDF · Guia gratuito",
  },
  {
    numero: "02",
    categoria: "Gestação",
    titulo: "Primeiros passos depois do positivo",
    descricao:
      "Mapa com tudo o que importa nas primeiras semanas: exames, suplementação, sinais de alerta e organização do pré-natal.",
    formato: "PDF · Mapa gratuito",
  },
  {
    numero: "03",
    categoria: "Puerpério",
    titulo: "Cuidados essenciais no pós-parto",
    descricao:
      "Checklist clínico de recuperação física, emocional e amamentação para os primeiros 40 dias depois do parto.",
    formato: "PDF · Checklist gratuito",
  },
  {
    numero: "04",
    categoria: "Bebê",
    titulo: "Primeiros cuidados com o recém-nascido",
    descricao:
      "Banho, sono seguro, coto umbilical, sinais de alerta e rotina prática para os primeiros dias do bebê em casa.",
    formato: "PDF · Guia gratuito",
  },
];

function ConteudoNav({ isMobile }: { isMobile: boolean }) {
  const [open, setOpen] = useState(false);
  const linkStyle: CSSProperties = {
    fontSize: isMobile ? 15 : 13,
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: c.muted,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: isMobile ? "12px 0" : 0,
    fontFamily: sans,
    textDecoration: "none",
    display: "block",
  };
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(250,245,238,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "16px 20px" : "20px 48px",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src={lemateLogo}
            alt="Le Mater"
            style={{ height: isMobile ? 40 : 52, width: "auto", display: "block" }}
          />
        </Link>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
            {NAV_ITEMS.map(([id, label]) => (
              <li key={id}>
                <Link to="/" search={{ s: id } as any} style={linkStyle}>{label}</Link>
              </li>
            ))}
          </ul>
        )}
        {!isMobile ? (
          <Link to="/" search={{ s: "contato" } as any} style={{ textDecoration: "none" }}>
            <button
              style={{
                background: c.sageDark,
                color: "white",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "10px 24px",
                border: "none",
                cursor: "pointer",
                fontFamily: sans,
              }}
            >
              ACESSE APP
            </button>
          </Link>
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              color: c.ink,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "8px 14px",
              cursor: "pointer",
              fontFamily: sans,
            }}
          >
            {open ? "Fechar" : "Menu"}
          </button>
        )}
      </div>
      {isMobile && open && (
        <div style={{ padding: "8px 20px 20px", borderTop: `1px solid ${c.border}`, display: "flex", flexDirection: "column" }}>
          {NAV_ITEMS.map(([id, label]) => (
            <Link
              key={id}
              to="/"
              search={{ s: id } as any}
              style={{ ...linkStyle, textAlign: "left", borderBottom: `1px solid ${c.border}` }}
            >
              {label}
            </Link>
          ))}
          <Link to="/" search={{ s: "contato" } as any} style={{ textDecoration: "none", marginTop: 16 }}>
            <button
              style={{
                background: c.sageDark,
                color: "white",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "14px 24px",
                border: "none",
                cursor: "pointer",
                fontFamily: sans,
                width: "100%",
              }}
            >
              ACESSE APP
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
}

function ConteudosGratisPage() {
  const isMobile = useIsMobile();
  const [selecionado, setSelecionado] = useState<Conteudo | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const enviarLead = useServerFn(registrarLead);

  const abrir = (item: Conteudo) => {
    setSelecionado(item);
    setEnviado(false);
    setErro(null);
    setForm({ nome: "", email: "", telefone: "" });
  };

  const fechar = () => setSelecionado(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!form.nome.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || form.telefone.replace(/\D/g, "").length < 8) {
      setErro("Preencha nome, e-mail válido e telefone (mín. 8 dígitos).");
      return;
    }
    setEnviando(true);
    try {
      await enviarLead({ data: { nome: form.nome.trim(), email: form.email.trim(), telefone: form.telefone.trim() } });
      setEnviado(true);
    } catch (err: any) {
      setErro(err?.message ?? "Erro ao enviar.");
    }
    setEnviando(false);
  };

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <ConteudoNav isMobile={isMobile} />

      {/* Hero */}
      <header
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: isMobile ? "120px 24px 32px" : "160px 48px 48px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: serif,
            fontSize: "clamp(34px,5vw,64px)",
            fontWeight: 300,
            lineHeight: 1.1,
            margin: "0 0 24px",
            letterSpacing: "-0.01em",
          }}
        >
          Conteúdo
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: c.muted,
            fontWeight: 300,
            maxWidth: 680,
            margin: "0 auto",
            whiteSpace: "pre-line",
          }}
        >
          Materiais educativos sobre concepção, gestação, parto, pós-parto e cuidados maternos.
          {"\n\n"}
          Escolha o seu momento e faça o download gratuito.
        </p>
      </header>

      {/* Cards */}
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: isMobile ? "16px 20px 80px" : "32px 48px 120px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 20 : 28,
        }}
      >
        {CONTEUDOS.map((item) => (
          <article
            key={item.numero}
            style={{
              background: "white",
              border: `1px solid ${c.border}`,
              padding: isMobile ? 28 : 40,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span
                style={{
                  fontFamily: serif,
                  fontSize: 28,
                  color: c.sage,
                  fontWeight: 300,
                }}
              >
                {item.numero}
              </span>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: c.muted,
                }}
              >
                {item.categoria}
              </span>
            </div>
            <h2
              style={{
                fontFamily: serif,
                fontSize: 26,
                lineHeight: 1.2,
                fontWeight: 400,
                margin: 0,
                color: c.ink,
              }}
            >
              {item.titulo}
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: c.muted, margin: 0 }}>
              {item.descricao}
            </p>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: c.sage,
                paddingTop: 8,
                borderTop: `1px solid ${c.border}`,
                marginTop: "auto",
              }}
            >
              {item.formato}
            </div>
            <button
              onClick={() => abrir(item)}
              style={{
                background: c.sageDark,
                color: "white",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "16px 28px",
                border: "none",
                cursor: "pointer",
                fontFamily: sans,
                marginTop: 8,
                alignSelf: "flex-start",
              }}
            >
              Acessar gratuitamente
            </button>
          </article>
        ))}
      </section>

      {/* CTA Programa Pago */}
      <section
        style={{
          background: c.warm,
          padding: isMobile ? "56px 24px" : "88px 48px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: c.muted,
            marginBottom: 18,
          }}
        >
          Quer ir além?
        </div>
        <h2
          style={{
            fontFamily: serif,
            fontSize: "clamp(28px,3.4vw,42px)",
            fontWeight: 300,
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}
        >
          Conheça o Atlas Materno completo
        </h2>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: c.muted,
            maxWidth: 620,
            margin: "0 auto 32px",
            fontWeight: 300,
          }}
        >
          Programas pagos com acompanhamento, cartão digital da gestante, recomendações inteligentes por
          fase e teleconsulta com a Rayssa.
        </p>
        <Link to="/" style={{ textDecoration: "none" }}>
          <button
            style={{
              background: "transparent",
              color: c.sageDark,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "16px 36px",
              border: `1.5px solid ${c.sageDark}`,
              cursor: "pointer",
              fontFamily: sans,
            }}
          >
            Ver programas completos
          </button>
        </Link>
      </section>

      <footer
        style={{
          padding: isMobile ? "60px 24px 40px" : "80px 48px 48px",
          background: "white",
          borderTop: `1px solid ${c.border}`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr",
            gap: 40,
            maxWidth: 1200,
            margin: "0 auto",
            marginBottom: 60,
          }}
        >
          <div style={{ maxWidth: 300 }}>
            <Link to="/">
              <img src={lemateLogo} alt="Le Mater" style={{ height: 48, width: "auto", marginBottom: 24 }} />
            </Link>
            <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.6, fontWeight: 300 }}>
              Acompanhando mulheres da tentativa natural de engravidar aos primeiros cuidados com o bebê. 
              Educação materna, tecnologia e acolhimento.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.ink, marginBottom: 20, fontWeight: 600 }}>Plataforma</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li><Link to="/" search={{ s: "inicio" } as any} style={{ fontSize: 13, color: c.muted, textDecoration: "none" }}>Início</Link></li>
              <li><Link to="/" search={{ s: "sobre" } as any} style={{ fontSize: 13, color: c.muted, textDecoration: "none" }}>Rayssa Leslie</Link></li>
              <li><Link to="/conteudos-gratis" style={{ fontSize: 13, color: c.muted, textDecoration: "none" }}>Conteúdos Grátis</Link></li>
              <li><Link to="/login" style={{ fontSize: 13, color: c.muted, textDecoration: "none" }}>Acessar Atlas</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.ink, marginBottom: 20, fontWeight: 600 }}>Contato</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ fontSize: 13, color: c.muted }}>contato@lemater.com</li>
              <li style={{ fontSize: 13, color: c.muted }}>Ribeirão Preto, SP</li>
              <li style={{ fontSize: 13, color: c.muted }}>UNAERP</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.ink, marginBottom: 20, fontWeight: 600 }}>Idiomas</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ fontSize: 13, color: c.muted }}>Português</li>
              <li style={{ fontSize: 13, color: c.muted }}>English</li>
              <li style={{ fontSize: 13, color: c.muted }}>Español</li>
            </ul>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 32,
            borderTop: `1px solid ${c.border}`,
            fontSize: 11,
            color: c.muted,
            letterSpacing: "0.06em",
            flexWrap: "wrap",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div>© 2026 · Le Mater · Todos os direitos reservados</div>
          <div style={{ display: "flex", gap: 24 }}>
            <span>Privacidade</span>
            <span>Termos</span>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {selecionado && (
        <div
          onClick={fechar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,28,26,0.55)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: c.cream,
              maxWidth: 520,
              width: "100%",
              padding: isMobile ? 28 : 44,
              position: "relative",
              border: `1px solid ${c.border}`,
            }}
          >
            <button
              onClick={fechar}
              style={{
                position: "absolute",
                top: 14,
                right: 18,
                background: "none",
                border: "none",
                fontSize: 22,
                color: c.muted,
                cursor: "pointer",
                fontFamily: serif,
              }}
              aria-label="Fechar"
            >
              ×
            </button>
            {enviado ? (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: c.sage,
                    marginBottom: 12,
                  }}
                >
                  Material liberado
                </div>
                <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, marginBottom: 12 }}>
                  Obrigada, {form.nome.split(" ")[0]}.
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: c.muted, margin: 0 }}>
                  Enviamos o material <strong style={{ color: c.ink }}>"{selecionado.titulo}"</strong>{" "}
                  para <strong style={{ color: c.ink }}>{form.email}</strong>. Confira sua caixa de
                  entrada nos próximos minutos.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: c.muted,
                    marginBottom: 8,
                  }}
                >
                  {selecionado.categoria} · {selecionado.formato}
                </div>
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 24,
                    fontWeight: 400,
                    marginBottom: 10,
                    lineHeight: 1.25,
                  }}
                >
                  {selecionado.titulo}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: c.muted, marginBottom: 24 }}>
                  Preencha abaixo e receba o material gratuitamente no seu e-mail.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
                  <input
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp / Telefone"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                {erro && <div style={{ fontSize: 13, color: "#B23A48", marginBottom: 12 }}>{erro}</div>}
                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    background: c.sageDark,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "16px 28px",
                    border: "none",
                    cursor: enviando ? "wait" : "pointer",
                    fontFamily: sans,
                    width: "100%",
                    opacity: enviando ? 0.7 : 1,
                  }}
                >
                  {enviando ? "Enviando…" : "Liberar conteúdo gratuito"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
