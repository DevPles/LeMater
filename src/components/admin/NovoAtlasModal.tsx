import { useState, type CSSProperties } from "react";
import AulaEditor from "./AulaEditor";
import NovoConteudoModal from "./NovoConteudoModal";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Tipo = "aula" | "servico";

const OPTIONS: { tipo: Tipo; titulo: string; descricao: string }[] = [
  { tipo: "aula", titulo: "Aula", descricao: "Vídeo, PDF ou texto. Vai para o Atlas, pertence a um ou mais temas, tem preço próprio e pode ter materiais de apoio anexados dentro dela." },
  { tipo: "servico", titulo: "Serviço", descricao: "Consulta, mentoria ou serviço pago oferecido pela Le Mater." },
];

export default function NovoAtlasModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState<Tipo | null>(null);

  if (tipo === "aula") {
    return <AulaEditor onClose={onClose} onSaved={onSaved} />;
  }
  if (tipo === "servico") {
    return <NovoConteudoModal tipoInicial="servico" onClose={onClose} onSaved={onSaved} />;
  }

  return (
    <div style={overlay}>
      <div style={panel}>
        <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 300, margin: "0 0 8px", color: c.ink }}>Novo conteúdo</h2>
        <p style={{ color: c.muted, margin: "0 0 22px", fontSize: 13, fontFamily: sans }}>
          Escolha o tipo de conteúdo que quer criar. Tudo passa por aqui — um único caminho.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {OPTIONS.map((o) => (
            <button
              key={o.tipo}
              onClick={() => setTipo(o.tipo)}
              style={optionBtn}
            >
              <div style={{ fontFamily: serif, fontSize: 22, color: c.sageDark, marginBottom: 4 }}>{o.titulo}</div>
              <div style={{ fontSize: 13, color: c.muted, fontFamily: sans, lineHeight: 1.5 }}>{o.descricao}</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button onClick={onClose} style={cancelBtn}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,28,26,0.65)", zIndex: 310, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const panel: CSSProperties = { background: c.cream, padding: 32, width: "min(560px,100%)", border: `1px solid ${c.border}` };
const optionBtn: CSSProperties = { background: "white", border: `1px solid ${c.border}`, padding: 18, textAlign: "left", cursor: "pointer", fontFamily: sans };
const cancelBtn: CSSProperties = { background: "transparent", border: `1px solid ${c.border}`, color: c.ink, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 18px", cursor: "pointer", fontFamily: sans };
