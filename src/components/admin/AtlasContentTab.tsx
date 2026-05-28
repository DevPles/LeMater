import { useState, type CSSProperties } from "react";
import CursosTab from "./CursosTab";
import MateriaisTab from "./MateriaisTab";
import NovoConteudoModal from "./NovoConteudoModal";
import AulasTab from "./AulasTab";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Tipo = "aula" | "curso" | "material" | "servico";

const LABELS: Record<Tipo, string> = {
  aula: "Aulas",
  curso: "Temas / Coleções",
  material: "Materiais",
  servico: "Serviços",
};


export default function AtlasContentTab() {
  const [tipo, setTipo] = useState<Tipo>("curso");
  const [novoOpen, setNovoOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 6px" }}>Atlas Materno</h1>
          <p style={{ color: c.muted, margin: 0, fontSize: 14 }}>Todo o conteúdo do Atlas em um só lugar.</p>
        </div>
        <button onClick={() => setNovoOpen(true)} style={btnPrimary(c.sageDark)}>Novo conteúdo</button>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${c.border}` }}>
        {(Object.keys(LABELS) as Tipo[]).map((t) => {
          const ativo = tipo === t;
          return (
            <button
              key={t}
              onClick={() => setTipo(t)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${ativo ? c.sageDark : "transparent"}`,
                color: ativo ? c.sageDark : c.muted,
                fontFamily: sans,
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "14px 22px",
                cursor: "pointer",
                fontWeight: ativo ? 500 : 400,
              }}
            >
              {LABELS[t]}
            </button>
          );
        })}
      </div>

      <div key={`${tipo}-${reloadKey}`}>
        {tipo === "aula" && <AulasTab />}
        {tipo === "curso" && <CursosTab esconderNovo />}
        {tipo === "material" && <MateriaisTab esconderNovo />}
        {tipo === "servico" && <MateriaisTab esconderNovo forcarCategoria="Serviço" titulo="Serviços" ctaNovo="Novo serviço" />}
      </div>

      {novoOpen && tipo !== "aula" && (
        <NovoConteudoModal
          tipoInicial={tipo}
          onClose={() => setNovoOpen(false)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}

    </div>
  );
}

function btnPrimary(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans };
}
