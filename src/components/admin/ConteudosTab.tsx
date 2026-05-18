import { useState, type CSSProperties } from "react";
import CursosTab from "./CursosTab";
import MateriaisTab from "./MateriaisTab";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Sub = "curso" | "material" | "servico";

const OPTIONS: { id: Sub; label: string; desc: string }[] = [
  { id: "curso",    label: "Curso",    desc: "Vídeo-aulas em módulos. Vendido na plataforma ou liberado por matrícula." },
  { id: "material", label: "Material", desc: "PDF, vídeo avulso ou artigo. Pode ser grátis (leads) ou pago." },
  { id: "servico",  label: "Serviço",  desc: "Oferta de atendimento, consulta ou pacote. Link de agendamento / compra externa." },
];

export default function ConteudosTab() {
  const [sub, setSub] = useState<Sub>("curso");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 6px" }}>Conteúdos</h1>
        <p style={{ color: c.muted, margin: 0 }}>Selecione o tipo do conteúdo que quer cadastrar.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 32 }}>
        {OPTIONS.map((o) => {
          const active = sub === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setSub(o.id)}
              style={{
                textAlign: "left", cursor: "pointer", fontFamily: sans,
                background: active ? c.sageDark : "white",
                color: active ? "white" : c.ink,
                border: `1px solid ${active ? c.sageDark : c.border}`,
                padding: "18px 20px",
                transition: "background .2s",
              } as CSSProperties}
            >
              <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: active ? "rgba(255,255,255,0.7)" : c.sage, marginBottom: 6 }}>Tipo</div>
              <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{o.label}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: active ? "rgba(255,255,255,0.75)" : c.muted }}>{o.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 28 }}>
        {sub === "curso" && <CursosTab />}
        {sub === "material" && <MateriaisTab />}
        {sub === "servico" && <MateriaisTab forcarCategoria="Serviço" titulo="Serviços" ctaNovo="Novo serviço" />}
      </div>
    </div>
  );
}
