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
  bg: "#f4ebe1",
  bgSoft: "#efe4d8",
  rose: "#e8a6c3",
  rosePale: "#f5d3e0",
  gold: "#c9a66b",
  ink: "#2b2226",
  inkSoft: "#5a4a52",
  cream: "#fbf6f1",
};

function SitePage() {
  return (
    <div
      style={{
        backgroundColor: palette.bg,
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
              color: palette.gold,
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

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            to="/"
            style={{
              backgroundColor: palette.cream,
              color: palette.ink,
              padding: "10px 24px",
              borderRadius: 999,
              fontWeight: 600,
              textDecoration: "none",
              border: `1px solid ${palette.rosePale}`,
            }}
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 48,
          padding: "40px 56px 80px",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              backgroundColor: palette.rosePale,
              color: palette.ink,
              padding: "8px 18px",
              borderRadius: 999,
              fontSize: 14,
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
            <span style={{ color: palette.rose }}>Cada Fase</span>
            <br />
            da Vida da <span style={{ color: palette.rose }}>Mulher</span>
          </h1>

          <p
            style={{
              marginTop: 28,
              fontSize: 17,
              lineHeight: 1.6,
              color: palette.inkSoft,
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
                background: `linear-gradient(135deg, ${palette.rose}, #c98bb0)`,
                color: "white",
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
                backgroundColor: palette.cream,
                color: palette.ink,
                border: "none",
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
            backgroundColor: palette.cream,
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 30px 60px -20px rgba(120, 70, 90, 0.25)",
            border: `1px solid ${palette.rosePale}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -14,
              right: 24,
              backgroundColor: palette.rose,
              color: "white",
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
              background: `linear-gradient(160deg, ${palette.rosePale}, ${palette.bgSoft})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Playfair Display', serif",
              fontSize: 80,
              color: palette.gold,
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
            <div style={{ fontSize: 14, color: palette.inkSoft, marginTop: 4 }}>
              Esteticista & Enfermeira Obstetra
            </div>
          </div>
        </div>
      </section>

      {/* PALETA */}
      <section style={{ padding: "0 56px 80px" }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: palette.gold,
            marginBottom: 16,
          }}
        >
          PALETA DA MARCA
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            { c: palette.bg, n: "Areia" },
            { c: palette.rosePale, n: "Rosé Claro" },
            { c: palette.rose, n: "Rosé" },
            { c: palette.gold, n: "Dourado" },
            { c: palette.ink, n: "Tinta" },
            { c: palette.cream, n: "Creme" },
          ].map((s) => (
            <div key={s.n} style={{ width: 140 }}>
              <div
                style={{
                  height: 90,
                  borderRadius: 14,
                  backgroundColor: s.c,
                  border: `1px solid ${palette.rosePale}`,
                }}
              />
              <div style={{ marginTop: 8, fontSize: 13 }}>{s.n}</div>
              <div
                style={{
                  fontSize: 11,
                  color: palette.inkSoft,
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
