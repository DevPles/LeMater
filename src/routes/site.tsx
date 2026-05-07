import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/site")({
  head: () => ({
    meta: [
      { title: "Rayssa Leslie — Estética & Saúde da Mulher" },
      {
        name: "description",
        content:
          "Estética avançada e cuidado materno por Rayssa Leslie em Ribeirão Preto, SP.",
      },
    ],
  }),
  component: SitePage,
});

const palette = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageLight: "#8AB89A",
  sageDark: "#2D5A42",
  terracotta: "#C4714A",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
};

function SitePage() {
  return (
    <div
      style={{
        backgroundColor: palette.cream,
        color: palette.ink,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        minHeight: "100vh",
      }}
    >
      {/* NAV */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 56px",
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: palette.ink,
            }}
          >
            Rayssa Leslie
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: palette.sage,
              marginTop: 2,
            }}
          >
            ESTÉTICA & SAÚDE DA MULHER
          </div>
        </div>

        <nav style={{ display: "flex", gap: 38, fontSize: 15 }}>
          {["Início", "Serviços", "Depoimentos", "Blog", "Contato"].map((l) => (
            <a
              key={l}
              href="#"
              style={{ color: palette.ink, textDecoration: "none" }}
            >
              {l}
            </a>
          ))}
        </nav>

        <Link
          to="/"
          style={{
            backgroundColor: palette.sageDark,
            color: palette.cream,
            padding: "10px 24px",
            borderRadius: 999,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Entrar
        </Link>
      </header>

      {/* HERO */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 48,
          padding: "60px 56px 80px",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              backgroundColor: palette.warm,
              color: palette.sageDark,
              padding: "8px 18px",
              borderRadius: 999,
              fontSize: 14,
              border: `1px solid ${palette.border}`,
              marginBottom: 28,
            }}
          >
            Ribeirão Preto, SP
          </span>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 700,
              margin: 0,
              color: palette.ink,
            }}
          >
            Estética
            <br />
            Especializada em
            <br />
            <span style={{ color: palette.sage }}>Cada Fase</span>
            <br />
            da Vida da <span style={{ color: palette.sage }}>Mulher</span>
          </h1>

          <p
            style={{
              marginTop: 28,
              fontSize: 17,
              lineHeight: 1.6,
              color: palette.muted,
              maxWidth: 560,
            }}
          >
            Estética avançada e cuidado materno integrados por meio de
            protocolos seguros e personalizados, sustentados por ampla
            experiência clínica — por Rayssa Leslie, Esteticista Avançada e
            Enfermeira Obstetra.
          </p>

          <div style={{ marginTop: 36, display: "flex", gap: 16 }}>
            <button
              style={{
                backgroundColor: palette.sageDark,
                color: palette.cream,
                border: "none",
                padding: "16px 32px",
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Agendar Consulta Gratuita →
            </button>
            <button
              style={{
                backgroundColor: palette.warm,
                color: palette.ink,
                border: `1px solid ${palette.border}`,
                padding: "16px 32px",
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Conhecer Serviços
            </button>
          </div>
        </div>

        {/* Card direita */}
        <div
          style={{
            position: "relative",
            backgroundColor: palette.warm,
            borderRadius: 24,
            padding: 28,
            border: `1px solid ${palette.border}`,
            boxShadow: "0 30px 60px -25px rgba(45, 90, 66, 0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -14,
              right: 24,
              backgroundColor: palette.terracotta,
              color: palette.cream,
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ★ 5.0
          </div>

          <div
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 18,
              background: `linear-gradient(160deg, ${palette.sageLight}, ${palette.sage})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Playfair Display', serif",
              fontSize: 96,
              color: palette.cream,
              fontStyle: "italic",
            }}
          >
            RL
          </div>

          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Rayssa Leslie
            </div>
            <div style={{ fontSize: 14, color: palette.muted, marginTop: 4 }}>
              Esteticista & Enfermeira Obstetra
            </div>
          </div>
        </div>
      </section>

      {/* APP — fundo escuro */}
      <section
        style={{
          backgroundColor: palette.sageDark,
          color: palette.cream,
          padding: "72px 56px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: palette.sageLight,
            marginBottom: 12,
          }}
        >
          APLICATIVO MÃEDIGITAL
        </div>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 44,
            margin: 0,
            maxWidth: 720,
          }}
        >
          Acompanhamento contínuo, na palma da sua mão.
        </h2>
        <p style={{ color: palette.sageLight, maxWidth: 620, marginTop: 16 }}>
          Cartão digital da gestante, lembretes, exames e videoconsulta — tudo
          integrado ao seu cuidado.
        </p>
      </section>

      {/* PALETA */}
      <section style={{ padding: "72px 56px" }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: palette.sage,
            marginBottom: 16,
          }}
        >
          PALETA DA MARCA
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            { c: palette.cream, n: "Cream" },
            { c: palette.warm, n: "Warm" },
            { c: palette.sage, n: "Sage" },
            { c: palette.sageLight, n: "Sage Light" },
            { c: palette.sageDark, n: "Sage Dark" },
            { c: palette.terracotta, n: "Terracotta" },
            { c: palette.ink, n: "Ink" },
            { c: palette.muted, n: "Muted" },
            { c: palette.border, n: "Border" },
          ].map((s) => (
            <div key={s.n} style={{ width: 130 }}>
              <div
                style={{
                  height: 90,
                  borderRadius: 14,
                  backgroundColor: s.c,
                  border: `1px solid ${palette.border}`,
                }}
              />
              <div style={{ marginTop: 8, fontSize: 13 }}>{s.n}</div>
              <div
                style={{
                  fontSize: 11,
                  color: palette.muted,
                  fontFamily: "monospace",
                }}
              >
                {s.c}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
