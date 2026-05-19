import { useState, type CSSProperties } from "react";
import CursosTab from "./CursosTab";
import MateriaisTab from "./MateriaisTab";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Tipo = "curso" | "material" | "servico";

const LABELS: Record<Tipo, string> = {
  curso: "Cursos",
  material: "Materiais",
  servico: "Serviços",
};

const DESCRICOES: Record<Tipo, string> = {
  curso: "Vídeo-aulas em módulos. Suporta múltiplas aulas, PDFs para download e venda externa.",
  material: "PDF, vídeo avulso ou artigo. Pode ser grátis (captura de leads) ou pago.",
  servico: "Oferta de atendimento, consulta ou pacote com link de compra externo.",
};

export default function AtlasContentTab() {
  const [tipo, setTipo] = useState<Tipo>("curso");
  const [novoOpen, setNovoOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Após escolher o tipo no modal, troca a sub-aba e re-monta o componente
  // forçando seu fluxo interno de "Novo" via prop (handled below via key bump and tipo change).
  const escolherTipo = (t: Tipo) => {
    setTipo(t);
    setNovoOpen(false);
    // bump key para re-montar o sub-tab; usuário clica "Novo X" do componente nativo
    setReloadKey((k) => k + 1);
    // Auto-abrir o modal de criação do sub-tab via custom event
    setTimeout(() => window.dispatchEvent(new CustomEvent(`atlas-novo-${t}`)), 50);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 6px" }}>Atlas Materno</h1>
          <p style={{ color: c.muted, margin: 0, fontSize: 14 }}>Todo o conteúdo do Atlas: cursos, materiais e serviços.</p>
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
        {tipo === "curso" && <CursosTab />}
        {tipo === "material" && <MateriaisTab />}
        {tipo === "servico" && <MateriaisTab forcarCategoria="Serviço" titulo="Serviços" ctaNovo="Novo serviço" />}
      </div>

      {novoOpen && (
        <div onClick={() => setNovoOpen(false)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={modal}>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 8 }}>Novo conteúdo</div>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, margin: "0 0 8px" }}>Qual tipo deseja criar?</h2>
            <p style={{ color: c.muted, fontSize: 14, margin: "0 0 24px" }}>
              Escolha o formato. Cada um abre um formulário específico com seus próprios campos.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {(Object.keys(LABELS) as Tipo[]).map((t) => (
                <button key={t} onClick={() => escolherTipo(t)} style={tipoCard}>
                  <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, marginBottom: 4 }}>
                    {t === "curso" ? "Curso" : t === "material" ? "Material" : "Serviço"}
                  </div>
                  <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.5 }}>{DESCRICOES[t]}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setNovoOpen(false)} style={btnPrimary(c.muted)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlay: CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,28,26,0.6)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
const modal: CSSProperties = { background: "white", maxWidth: 540, width: "100%", padding: 32, border: `1px solid ${c.border}` };
const tipoCard: CSSProperties = {
  textAlign: "left",
  cursor: "pointer",
  fontFamily: sans,
  background: "white",
  color: c.ink,
  border: `1px solid ${c.border}`,
  padding: "18px 20px",
  transition: "background .15s, border-color .15s",
};

function btnPrimary(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans };
}
