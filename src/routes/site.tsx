import { createFileRoute } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import rayssa from "@/assets/rayssa-portrait.jpg";
import { LiquidCard } from "@/components/LiquidCard";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/site")({
  head: () => ({
    meta: [
      { title: "LeMater · Saúde materna com credencial clínica" },
      {
        name: "description",
        content:
          "Programas, app e teleconsulta materna por Rayssa Leslie, Enf. Obstetra UNAERP.",
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

type SectionId = "inicio" | "sobre" | "produtos" | "contato";

const NAV_ITEMS: ReadonlyArray<readonly [SectionId, string]> = [
  ["inicio", "Início"],
  ["sobre", "Sobre"],
  ["produtos", "ATLAS MATERNO"],
  ["contato", "Contato"],
];

function SitePage() {
  const [active, setActive] = useState<SectionId>("inicio");
  const go = (id: SectionId) => {
    setActive(id);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh", overflowX: "hidden" }}>
      <Nav active={active} go={go} />
      <main>
        {active === "inicio" && <Inicio go={go} />}
        {active === "sobre" && <Sobre />}
        {active === "produtos" && <Produtos />}
        {active === "contato" && <Contato />}
      </main>
      <Footer />
    </div>
  );
}

function Nav({ active, go }: { active: SectionId; go: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const linkStyle = (id: SectionId): CSSProperties => ({
    fontSize: isMobile ? 15 : 13,
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: active === id ? c.sageDark : c.muted,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: isMobile ? "12px 0" : 0,
    fontFamily: sans,
  });
  const handleGo = (id: SectionId) => {
    setOpen(false);
    go(id);
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
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, letterSpacing: "0.08em" }}>
          Le<span style={{ color: c.sage }}>Mater</span>
        </div>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none", margin: 0, padding: 0 }}>
            {NAV_ITEMS.map(([id, label]) => (
              <li key={id}>
                <button onClick={() => handleGo(id)} style={linkStyle(id)}>{label}</button>
              </li>
            ))}
          </ul>
        )}
        {!isMobile ? (
          <button
            onClick={() => handleGo("contato")}
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
            <button key={id} onClick={() => handleGo(id)} style={{ ...linkStyle(id), textAlign: "left", borderBottom: `1px solid ${c.border}` }}>
              {label}
            </button>
          ))}
          <button
            onClick={() => handleGo("contato")}
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
              marginTop: 16,
            }}
          >
            ACESSE APP
          </button>
        </div>
      )}
    </nav>
  );
}

const SectionTag = ({ text, light = false, center = false }: { text: string; light?: boolean; center?: boolean }) => (
  <div
    style={{
      fontSize: 11,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: light ? c.sageLight : c.sage,
      fontWeight: 500,
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: center ? "center" : "flex-start",
    }}
  >
    <span style={{ width: 24, height: 1, background: light ? c.sageLight : c.sage }} />
    {text}
  </div>
);

const h2: CSSProperties = {
  fontFamily: serif,
  fontSize: "clamp(28px, 3vw, 44px)",
  fontWeight: 300,
  lineHeight: 1.1,
  color: c.ink,
  marginBottom: 20,
};

const sectionP: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: c.muted,
  fontWeight: 300,
  maxWidth: 480,
  marginBottom: 24,
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
  const isMobile = useIsMobile();
  return (
    <section style={{ paddingTop: isMobile ? 80 : 40, minHeight: "75vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flex: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div
          style={{
            flex: "1 1 480px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: isMobile ? "20px 24px 32px" : "20px 48px 40px",
            alignItems: isMobile ? "center" : "flex-start",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          {!isMobile && <SectionTag text="Saúde materna com credencial clínica real" />}
          <h1 style={{ fontFamily: serif, fontSize: "clamp(32px,4vw,54px)", fontWeight: 300, lineHeight: 1.1, marginBottom: 20, marginTop: isMobile ? 0 : 60 }}>
            A gestação que você <em style={{ fontStyle: "italic", color: c.sage }}>merece viver.</em>
          </h1>
          <p
            style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.6, color: c.muted, maxWidth: 640, marginBottom: 36, textAlign: "center", marginInline: "auto" }}
          >
            Criada por Rayssa Leslie, Enfermeira Pós Graduada em Obstetricia formada pela UNAERP, a Le Mater une orientação Pré-Concepcional, Educação Materna, Carteira Digital da Gestante e Inteligência Artificial para Acompanhar mulheres da tentativa natural de Engravidar aos Primeiros Cuidados com o bebê.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", width: isMobile ? "100%" : "auto" }}>
            <button style={btnPrimary} onClick={() => go("produtos")}>ACESSAR ATLAS MATERNO</button>
            <button style={btnSecondary} onClick={() => go("sobre")}>Conhecer a Rayssa</button>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 48, paddingTop: 32, borderTop: `1px solid ${c.border}`, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", width: "100%" }}>
            {[["6+", "Anos em obstetrícia"], ["3", "Idiomas disponíveis"], ["UNAERP", "Parceria institucional"]].map(([num, lbl]) => (
              <div key={lbl} style={{ textAlign: isMobile ? "center" : "left" }}>
                <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300, color: c.sageDark }}>{num}</div>
                <div style={{ fontSize: 10, color: c.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "0 1 460px", background: c.warm, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden", padding: isMobile ? 20 : 32, minHeight: isMobile ? 360 : 480, alignSelf: "center", borderRadius: 16, width: isMobile ? "calc(100% - 40px)" : undefined, marginInline: isMobile ? 20 : undefined, marginBottom: isMobile ? 24 : undefined }}>
          <img
            src={rayssa}
            alt="Rayssa Leslie, Enfermeira Pós Graduada em Obstetricia"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
          <LiquidCard bgOpacity={0} style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 12, position: "relative", zIndex: 2, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px) saturate(180%)", WebkitBackdropFilter: "blur(14px) saturate(180%)", borderColor: "rgba(255,255,255,0.5)", boxShadow: "0 10px 30px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.ink }}>Rayssa Leslie</div>
                <div style={{ background: c.sageDark, color: "white", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", flexShrink: 0 }}>★ 5.0</div>
              </div>
              <div style={{ fontSize: 11.5, color: c.ink, lineHeight: 1.55, fontWeight: 400 }}>
                Enfermeira Pós Graduada em Obstetricia<br />
                Enfermeira Pós Graduada em Neonatologista<br />
                Especialista ACLS pelo American Heart Association (AHA)<br />
                Criadora do Método Le Mater
              </div>
            </div>
          </LiquidCard>
        </div>
      </div>
      <Ticker />
    </section>
  );
}

function Ticker() {
  const items = ["Pré-Natal", "Parto Humanizado", "Cuidados Neonatais", "Carteira Digital da Gestante", "Pós-Parto", "Amamentação", "UTI Neonatal", "UNAERP"];
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
    <section style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 60, padding: "80px 48px", flexWrap: "wrap" }}>
        <div style={{ fontFamily: serif, fontSize: 140, fontWeight: 300, color: c.border, lineHeight: 1, flexShrink: 0, userSelect: "none" }}>01</div>
        <div style={{ flex: "1 1 320px" }}>
          <SectionTag text="Sobre Rayssa Leslie" />
          <h2 style={h2}>
            Experiência clínica<br />que <em style={{ fontStyle: "italic", color: c.sage }}>transforma</em><br />o cuidado.
          </h2>
          <p style={sectionP}>
            Enfermeira Pós Graduada em Obstetricia e Neonatologista com sólida experiência em assistência ao parto seguro, saúde da mulher e cuidado neonatal. Atuação em ambientes hospitalares de média e alta complexidade, com foco em segurança do paciente, humanização do cuidado e protocolos baseados em evidências.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "Graduação e Pós-Graduação em Obstetrícia · UNAERP",
              "ACLS · Advanced Cardiovascular Life Support · American Heart Association",
              "ALSO · Advanced Life Support in Obstetrics",
              "Especialização em PICC",
              "Enf. Obstetra III · Hospital Regional Baixada Santista",
              "Parto Seguro · CEJAM · Hospital Dr. João Amorim, SP",
              "Hospital Electro Bonini UNAERP · Ribeirão Preto",
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

type Momento = {
  num: string;
  categoria: string;
  titulo: string;
  texto: string;
  conteudoGratuito: string;
  rotaGratuita: string;
  caminhoRecomendado: string;
  rotaPrograma: string;
  dark?: boolean;
};

const MOMENTOS: Momento[] = [
  {
    num: "01",
    categoria: "Concepção",
    titulo: "Estou tentando engravidar",
    texto: "Entenda seu ciclo, sua janela fértil e os sinais reais do corpo antes de depender apenas de aplicativos.",
    conteudoGratuito: "Guia gratuito: 7 sinais de que você pode estar errando sua janela fértil",
    rotaGratuita: "/atlas-materno/concepcao",
    caminhoRecomendado: "Ajuda na Concepção Le Mater",
    rotaPrograma: "/programas/concepcao",
  },
  {
    num: "02",
    categoria: "Gestação",
    titulo: "Estou grávida",
    texto: "Organize os primeiros passos da gestação, entenda exames, consultas e sinais importantes de acompanhamento.",
    conteudoGratuito: "Mapa gratuito: primeiros passos depois do positivo",
    rotaGratuita: "/atlas-materno/gestacao",
    caminhoRecomendado: "Programa Gestação Le Mater",
    rotaPrograma: "/programas/gestacao",
  },
  {
    num: "03",
    categoria: "Puerpério",
    titulo: "Estou no pós-parto",
    texto: "Cuide da recuperação, da saúde emocional, da adaptação materna e dos sinais importantes dessa fase.",
    conteudoGratuito: "Checklist gratuito: cuidados essenciais no puerpério",
    rotaGratuita: "/atlas-materno/pos-parto",
    caminhoRecomendado: "Pós-Parto Le Mater",
    rotaPrograma: "/programas/pos-parto",
  },
  {
    num: "04",
    categoria: "Bebê e primeiros cuidados",
    titulo: "Quero cuidar melhor do bebê",
    texto: "Receba orientações simples sobre banho, amamentação, sono, cólicas, rotina e primeiros cuidados neonatais.",
    conteudoGratuito: "Guia gratuito: primeiros cuidados com o recém-nascido",
    rotaGratuita: "/atlas-materno/bebe",
    caminhoRecomendado: "Bebê e Primeiros Cuidados Le Mater",
    rotaPrograma: "/programas/bebe-primeiros-cuidados",
    dark: true,
  },
];

function MomentoCard({ m }: { m: Momento }) {
  const [hover, setHover] = useState(false);
  const isDark = m.dark || hover;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isDark ? c.sageDark : c.warm,
        padding: 40,
        transition: "background .3s",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ fontFamily: serif, fontSize: 64, fontWeight: 300, color: isDark ? "rgba(255,255,255,0.18)" : c.border, lineHeight: 1, marginBottom: 16 }}>
        {m.num}
      </div>
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? c.sageLight : c.sage, marginBottom: 14, fontWeight: 500 }}>
        {m.categoria}
      </div>
      <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: isDark ? "white" : c.ink, marginBottom: 14, lineHeight: 1.15 }}>
        {m.titulo}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: isDark ? "rgba(255,255,255,0.75)" : c.muted, marginBottom: 24 }}>
        {m.texto}
      </p>
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : c.border}`, paddingTop: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 8 }}>
          Conteúdo gratuito
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: isDark ? "white" : c.ink, fontWeight: 400 }}>
          {m.conteudoGratuito}
        </div>
      </div>
      <a href={m.rotaGratuita} style={{ textDecoration: "none", marginBottom: 24 }}>
        <button style={{
          background: isDark ? "white" : c.sageDark,
          color: isDark ? c.sageDark : "white",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "14px 24px",
          border: "none",
          cursor: "pointer",
          fontFamily: sans,
          width: "100%",
        }}>
          Acessar conteúdo gratuito
        </button>
      </a>
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 8, fontStyle: "italic", fontFamily: serif }}>
          Caminho recomendado: {m.caminhoRecomendado}
        </div>
        <a href={m.rotaPrograma} style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: isDark ? "white" : c.sageDark,
          textDecoration: "none",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.5)" : c.sageDark}`,
          paddingBottom: 2,
          display: "inline-block",
          fontWeight: 500,
        }}>
          Ver caminho completo
        </a>
      </div>
    </div>
  );
}

function Produtos() {
  const isMobile = useIsMobile();
  return (
    <section style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ padding: isMobile ? "60px 24px" : "80px 48px" }}>
        <div style={{ marginBottom: 48, maxWidth: 720 }}>
          <SectionTag text="ATLAS MATERNO" />
          <h2 style={h2}>
            Quatro fases.<br />
            <em style={{ fontStyle: "italic", color: c.sage }}>Uma jornada completa.</em>
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: c.muted, fontWeight: 300, maxWidth: 560, marginTop: 8 }}>
            Escolha seu momento, acesse um conteúdo gratuito e descubra o caminho Le Mater recomendado para você.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 2 }}>
          {MOMENTOS.map((m) => <MomentoCard key={m.num} m={m} />)}
        </div>
        <div style={{ marginTop: 2, background: c.warm, padding: isMobile ? "36px 28px" : "48px 56px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sage, marginBottom: 14, fontWeight: 500 }}>
            Plano completo
          </div>
          <div style={{ fontFamily: serif, fontSize: isMobile ? 28 : 34, fontWeight: 400, color: c.ink, marginBottom: 14 }}>
            Plano Completo Le Mater
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: c.muted, maxWidth: 620, marginBottom: 28, fontWeight: 300 }}>
            Para quem deseja acesso aos principais conteúdos da jornada materna, organização digital, carteira da gestante e recomendações inteligentes por fase.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0, marginBottom: 32, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
            {["Conteúdos por fase", "Carteira digital da gestante", "Recomendações inteligentes"].map((b, i, arr) => (
              <div key={b} style={{
                flex: isMobile ? "1 1 100%" : "1 1 0",
                padding: "20px 24px",
                fontSize: 13,
                color: c.ink,
                fontWeight: 400,
                letterSpacing: "0.02em",
                borderRight: !isMobile && i < arr.length - 1 ? `1px solid ${c.border}` : "none",
                borderBottom: isMobile && i < arr.length - 1 ? `1px solid ${c.border}` : "none",
              }}>
                {b}
              </div>
            ))}
          </div>
          <a href="/planos/completo" style={{ textDecoration: "none" }}>
            <button style={{ ...btnPrimary, whiteSpace: "nowrap" }}>Conhecer plano completo</button>
          </a>
          <p style={{ fontSize: 12, color: c.muted, marginTop: 20, fontStyle: "italic", fontFamily: serif, maxWidth: 560 }}>
            Ideal para quem quer uma experiência materna mais organizada, do início da jornada aos primeiros cuidados com o bebê.
          </p>
        </div>
      </div>
    </section>
  );
}

function Contato() {
  return (
    <section style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px", textAlign: "center" }}>
        <SectionTag text="Fale conosco" center />
        <h2 style={{ ...h2, maxWidth: 600, margin: "0 auto 24px" }}>
          Pronta para começar<br />
          <em style={{ fontStyle: "italic", color: c.sage }}>sua jornada?</em>
        </h2>
        <p style={{ ...sectionP, textAlign: "center", margin: "0 auto 48px" }}>
          Entre em contato ou acesse o sistema para iniciar seu acompanhamento com a Rayssa Leslie.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={btnPrimary}>Agendar Consulta</button>
          <button style={btnSecondary}>Acessar Sistema</button>
        </div>
        <div style={{ display: "flex", gap: 36, marginTop: 60, paddingTop: 40, borderTop: `1px solid ${c.border}`, flexWrap: "wrap", justifyContent: "center" }}>
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
    <footer style={{ padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${c.border}`, fontSize: 11, color: c.muted, letterSpacing: "0.06em", flexWrap: "wrap", gap: 16 }}>
      <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 300, color: c.ink, letterSpacing: "0.06em" }}>
        Le<span style={{ color: c.sage }}>Mater</span>
      </div>
      <div>© 2026 · Rayssa Leslie · Todos os direitos reservados</div>
      <div>UNAERP · COREN · ACLS</div>
    </footer>
  );
}
