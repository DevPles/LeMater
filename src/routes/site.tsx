import { createFileRoute } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";

export const Route = createFileRoute("/site")({
  head: () => ({
    meta: [
      { title: "LeMater — Saúde materna com credencial clínica" },
      {
        name: "description",
        content:
          "Acompanhamento pré-natal, cursos para gestantes e sistema digital — por Rayssa Leslie, Enf. Obstetra UNAERP.",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: SitePage,
});

const c = {
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

const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type SectionId = "inicio" | "sobre" | "produtos" | "app" | "contato";

function SitePage() {
  const [active, setActive] = useState<SectionId>("inicio");

  const go = (id: SectionId) => {
    setActive(id);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  return (
    <div
      style={{
        fontFamily: sans,
        background: c.cream,
        color: c.ink,
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <Nav active={active} go={go} />

      <main>
        {active === "inicio" && <Inicio go={go} />}
        {active === "sobre" && <Sobre />}
        {active === "produtos" && <Produtos />}
        {active === "app" && <App />}
        {active === "contato" && <Contato />}
      </main>

      <Footer />
    </div>
  );
}

function Nav({ active, go }: { active: SectionId; go: (id: SectionId) => void }) {
  const linkStyle = (id: SectionId): CSSProperties => ({
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: active === id ? c.sageDark : c.muted,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: sans,
  });
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        background: "rgba(250,245,238,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, letterSpacing: "0.08em" }}>
        Le<span style={{ color: c.sage }}>Mater</span>
      </div>
      <ul style={{ display: "flex", gap: 32, listStyle: "none", margin: 0, padding: 0 }}>
        {([
          ["inicio", "Início"],
          ["sobre", "Sobre"],
          ["produtos", "Programas"],
          ["app", "App"],
          ["contato", "Contato"],
        ] as const).map(([id, label]) => (
          <li key={id}>
            <button onClick={() => go(id)} style={linkStyle(id)}>
              {label}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => go("contato")}
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
        Acessar Sistema →
      </button>
    </nav>
  );
}

const sectionTag = (text: string, withDash = true) => (
  <div
    style={{
      fontSize: 11,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: c.sage,
      fontWeight: 500,
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    {withDash && <span style={{ width: 24, height: 1, background: c.sage }} />}
    {text}
  </div>
);

const h2: CSSProperties = {
  fontFamily: serif,
  fontSize: "clamp(36px, 4vw, 56px)",
  fontWeight: 300,
  lineHeight: 1.1,
  color: c.ink,
  marginBottom: 24,
};

const sectionP: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.8,
  color: c.muted,
  fontWeight: 300,
  maxWidth: 520,
  marginBottom: 32,
};

const btnPrimary: CSSProperties = {
  background: c.sageDark,
  color: "white",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "14px 32px",
  border: "none",
  cursor: "pointer",
  fontFamily: sans,
};

const btnSecondary: CSSProperties = {
  background: "transparent",
  color: c.ink,
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "14px 32px",
  border: `1.5px solid ${c.border}`,
  cursor: "pointer",
  fontFamily: sans,
};

function Inicio({ go }: { go: (id: SectionId) => void }) {
  return (
    <section style={{ paddingTop: 80, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: 32, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 1, background: c.sage }} />
            Saúde materna com credencial clínica real
          </div>
          <h1 style={{ fontFamily: serif, fontSize: "clamp(48px,6vw,80px)", fontWeight: 300, lineHeight: 1.05, marginBottom: 24 }}>
            A gestação<br />que você<br />
            <em style={{ fontStyle: "italic", color: c.sage }}>merece viver.</em>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: c.muted, maxWidth: 440, marginBottom: 48, fontWeight: 300 }}>
            Acompanhamento pré-natal, cursos para gestantes e sistema digital de saúde materna — por Rayssa Leslie, Enfermeira Obstetra com formação UNAERP e 6 anos em alta complexidade.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <button style={btnPrimary} onClick={() => go("produtos")}>Ver Programas →</button>
            <button style={btnSecondary} onClick={() => go("app")}>Conhecer o App</button>
          </div>
          <div style={{ display: "flex", gap: 40, marginTop: 64, paddingTop: 40, borderTop: `1px solid ${c.border}` }}>
            {[
              ["6+", "Anos em obstetrícia"],
              ["3", "Idiomas disponíveis"],
              ["UNAERP", "Parceria institucional"],
            ].map(([num, lbl]) => (
              <div key={lbl}>
                <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 300, color: c.sageDark }}>{num}</div>
                <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: "42%", background: c.warm, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden", padding: 48 }}>
          <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 120, fontWeight: 300, color: c.border, letterSpacing: -4, userSelect: "none" }}>RL</div>
          <div style={{ background: "white", padding: "20px 24px", boxShadow: "0 4px 32px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.sage, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Rayssa Leslie</div>
              <div style={{ fontSize: 11, color: c.muted, letterSpacing: "0.04em", marginTop: 2 }}>Enf. Obstetra · COREN · ACLS · PICC</div>
            </div>
            <div style={{ marginLeft: "auto", background: c.sageDark, color: "white", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px" }}>★ 5.0</div>
          </div>
        </div>
      </div>
      <Ticker />
    </section>
  );
}

function Ticker() {
  const items = ["Pré-Natal", "Parto Humanizado", "Cuidados Neonatais", "Cartão Digital da Gestante", "Pós-Parto", "Amamentação", "UTI Neonatal", "UNAERP"];
  const all = [...items, ...items];
  return (
    <div style={{ background: c.sageDark, color: "white", padding: "12px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: "inline-flex", animation: "ticker 30s linear infinite" }}>
        {all.map((it, i) => (
          <span key={i} style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 32px", opacity: 0.7 }}>
            {it} <strong style={{ opacity: 1, color: c.sageLight }}>/</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function Sobre() {
  return (
    <section style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 80, padding: "120px 64px" }}>
        <div style={{ fontFamily: serif, fontSize: 200, fontWeight: 300, color: c.border, lineHeight: 1, flexShrink: 0, userSelect: "none" }}>01</div>
        <div>
          {sectionTag("Sobre Rayssa Leslie")}
          <h2 style={h2}>
            Experiência clínica<br />que <em style={{ fontStyle: "italic", color: c.sage }}>transforma</em><br />o cuidado.
          </h2>
          <p style={sectionP}>
            Enfermeira Obstetra e Neonatologista com sólida experiência em assistência ao parto seguro, saúde da mulher e cuidado neonatal. Atuação em ambientes hospitalares de média e alta complexidade, com foco em segurança do paciente, humanização do cuidado e protocolos baseados em evidências.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Graduação e Pós-Graduação em Obstetrícia — UNAERP",
              "ACLS — Advanced Cardiac Life Support · American Heart Association",
              "Especialização em PICC",
              "Enf. Obstetra III — Hospital Regional Baixada Santista",
              "Parto Seguro — CEJAM / Hospital Dr. João Amorim, SP",
              "Hospital Electro Bonini UNAERP — Ribeirão Preto",
            ].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.sage, flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProdutoCard({ num, titulo, desc, dark = false, badge }: { num: string; titulo: string; desc: string; dark?: boolean; badge?: string }) {
  const [hover, setHover] = useState(false);
  const isDark = dark || hover;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isDark ? c.sageDark : c.warm,
        padding: 48,
        transition: "background .3s",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ fontFamily: serif, fontSize: 64, fontWeight: 300, color: isDark ? "rgba(255,255,255,0.15)" : c.border, lineHeight: 1, marginBottom: 24 }}>{num}</div>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: isDark ? "white" : c.ink, marginBottom: 12 }}>{titulo}</div>
      <p style={{ fontSize: 13, lineHeight: 1.7, color: isDark ? "rgba(255,255,255,0.7)" : c.muted, marginBottom: 32 }}>{desc}</p>
      <div style={{ fontFamily: serif, fontSize: 40, fontWeight: 300, color: isDark ? c.sageLight : c.sageDark, marginBottom: 24 }}>
        <span style={{ fontSize: 16 }}>R$</span> 297
      </div>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: isDark ? "white" : c.sageDark, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.4)" : c.sageDark}`, paddingBottom: 2, display: "inline-block" }}>
        Acessar programa →
      </div>
      {badge && (
        <div style={{ position: "absolute", top: 24, right: 24, background: c.terracotta, color: "white", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px" }}>{badge}</div>
      )}
    </div>
  );
}

function Produtos() {
  return (
    <section style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ padding: "120px 64px" }}>
        <div style={{ marginBottom: 64 }}>
          {sectionTag("Programas")}
          <h2 style={h2}>
            Quatro fases.<br />
            <em style={{ fontStyle: "italic", color: c.sage }}>Uma jornada completa.</em>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 2 }}>
          <ProdutoCard num="01" titulo="Ajuda na Concepção" desc="Orientação especializada para quem está planejando engravidar. Saúde pré-concepcional, ciclo menstrual e preparo do corpo." />
          <ProdutoCard num="02" titulo="Gestação" desc="Acompanhamento completo trimestre a trimestre. Pré-natal, exames, desenvolvimento fetal e preparação para o parto." />
          <ProdutoCard num="03" titulo="Pós-Gestação" desc="Puerpério, recuperação física, saúde mental pós-parto e os primeiros dias com o bebê em casa." />
          <ProdutoCard num="04" titulo="Bebê & Primeiros Cuidados" desc="Banho, amamentação, cólica, sono e tudo o que ninguém ensina antes do bebê chegar." dark badge="Mais vendido" />
        </div>
        <div style={{ marginTop: 2, background: c.warm, padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400 }}>Combo Completo + App LeMater 1 ano</div>
            <div style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>4 programas · App com cartão digital · Alertas clínicos · Teleconsulta</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: c.muted, textDecoration: "line-through" }}>R$ 1.188</div>
              <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, color: c.sageDark }}>
                <span style={{ fontSize: 18 }}>R$</span> 797
              </div>
            </div>
            <button style={{ ...btnPrimary, whiteSpace: "nowrap" }}>Garantir acesso →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function App() {
  return (
    <section style={{ paddingTop: 80 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 80, padding: "120px 64px", background: c.sageDark, color: "white", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sageLight, fontWeight: 500, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 24, height: 1, background: c.sageLight }} />
            App LeMater
          </div>
          <h2 style={{ ...h2, color: "white" }}>
            Sua gestação<br />
            <em style={{ fontStyle: "italic", color: c.sageLight }}>no seu bolso.</em>
          </h2>
          <p style={{ ...sectionP, color: "rgba(255,255,255,0.6)" }}>
            O único app de saúde materna com alertas clínicos automáticos baseados em protocolos do Ministério da Saúde, OMS e FEBRASGO — com cartão digital da gestante via QR Code.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 40 }}>
            {[
              ["Cartão Digital da Gestante", "QR Code para acesso em emergências. Sinais vitais, vacinas, exames e histórico."],
              ["Alertas Clínicos Automáticos", "Parâmetros configurados conforme MS Caderno 32, OMS e FEBRASGO."],
              ["Teleconsulta Integrada", "Consulta por vídeo com prontuário e gravação disponível diretamente no app."],
            ].map(([t, d]) => (
              <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 20 }}>·</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "white", marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 280 }}>
          <div style={{ width: 260, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: 24, fontFamily: serif }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 16, fontFamily: sans }}>Minha gestação</div>
            <div style={{ fontSize: 72, fontWeight: 300, color: "white", lineHeight: 1 }}>31</div>
            <div style={{ fontSize: 13, color: c.sageLight, marginBottom: 24 }}>Semana · 3º Trimestre</div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.1)", marginBottom: 8 }}>
              <div style={{ height: "100%", background: c.sageLight, width: "74%" }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20, fontFamily: sans }}>9 semanas restantes</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[["68,5", "Peso kg"], ["110/70", "Pressão"], ["142", "BCF bpm"]].map(([v, l]) => (
                <div key={l} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 18, fontWeight: 300, color: "white" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2, fontFamily: sans }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contato() {
  return (
    <section style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 64px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: 24, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <span style={{ width: 24, height: 1, background: c.sage }} />
          Fale conosco
        </div>
        <h2 style={{ ...h2, maxWidth: 600, margin: "0 auto 24px" }}>
          Pronta para começar<br />
          <em style={{ fontStyle: "italic", color: c.sage }}>sua jornada?</em>
        </h2>
        <p style={{ ...sectionP, textAlign: "center", margin: "0 auto 48px" }}>
          Entre em contato ou acesse o sistema para iniciar seu acompanhamento com a Rayssa Leslie.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={btnPrimary}>Agendar Consulta →</button>
          <button style={btnSecondary}>Acessar Sistema</button>
        </div>
        <div style={{ display: "flex", gap: 48, marginTop: 80, paddingTop: 48, borderTop: `1px solid ${c.border}`, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            ["Localização", "Ribeirão Preto, SP"],
            ["Email", "contato@lemater.com"],
            ["Parceria", "UNAERP"],
            ["Disponível em", "PT · ES · EN"],
          ].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.muted, marginBottom: 8 }}>{l}</div>
              <div style={{ fontFamily: serif, fontSize: 18 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "32px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${c.border}`, fontSize: 11, color: c.muted, letterSpacing: "0.06em", flexWrap: "wrap", gap: 16 }}>
      <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 300, color: c.ink, letterSpacing: "0.06em" }}>
        Le<span style={{ color: c.sage }}>Mater</span>
      </div>
      <div>© 2026 — Rayssa Leslie · Todos os direitos reservados</div>
      <div>UNAERP · COREN · ACLS</div>
    </footer>
  );
}
