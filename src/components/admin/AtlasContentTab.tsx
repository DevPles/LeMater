import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import MateriaisTab from "./MateriaisTab";
import AulasTab from "./AulasTab";
import TemasTab from "./TemasTab";
import MultimidiaTab from "./MultimidiaTab";
import NovoAtlasModal from "./NovoAtlasModal";
import { listAtlasTemas, type AtlasTema } from "@/lib/cursos.functions";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Aba = "conteudo" | "tema" | "multimidia";
type TipoFiltro = "aula" | "servico";

export default function AtlasContentTab() {
  const [aba, setAba] = useState<Aba>("conteudo");
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("aula");
  const [temaFiltro, setTemaFiltro] = useState<string>("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fnTemas = useServerFn(listAtlasTemas);
  const [temas, setTemas] = useState<AtlasTema[]>([]);
  useEffect(() => { fnTemas().then((d) => setTemas(d as AtlasTema[])).catch(() => {}); }, [reloadKey]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: serif, fontSize: 36, fontWeight: 300, margin: "0 0 6px" }}>Atlas Materno</h1>
          <p style={{ color: c.muted, margin: 0, fontSize: 14 }}>
            Tudo é criado por um único botão. Use os filtros abaixo para ver o que já foi publicado.
          </p>
        </div>
        <button onClick={() => setNovoOpen(true)} style={btnPrimary(c.sageDark)}>Novo conteúdo</button>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${c.border}` }}>
        {([["conteudo", "Conteúdo"], ["tema", "Temas"], ["multimidia", "Multimídia"]] as [Aba, string][]).map(([k, label]) => {
          const ativo = aba === k;
          return (
            <button key={k} onClick={() => setAba(k)} style={{
              background: "transparent", border: "none",
              borderBottom: `2px solid ${ativo ? c.sageDark : "transparent"}`,
              color: ativo ? c.sageDark : c.muted,
              fontFamily: sans, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase",
              padding: "14px 22px", cursor: "pointer", fontWeight: ativo ? 500 : 400,
            }}>{label}</button>
          );
        })}
      </div>

      {aba === "conteudo" && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 18, padding: 14, background: c.warm, border: `1px solid ${c.border}` }}>
            <label style={selWrap}>
              <span style={selLabel}>Tipo</span>
              <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)} style={sel}>
                <option value="aula">Aulas</option>
                <option value="servico">Serviços</option>
              </select>
            </label>
            {tipoFiltro === "aula" && (
              <label style={selWrap}>
                <span style={selLabel}>Tema</span>
                <select value={temaFiltro} onChange={(e) => setTemaFiltro(e.target.value)} style={sel}>
                  <option value="">Todos os temas</option>
                  {temas.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                </select>
              </label>
            )}
          </div>

          {tipoFiltro === "aula" && <AulasTab reloadSignal={reloadKey} temaFilter={temaFiltro || null} />}
          {tipoFiltro === "servico" && <MateriaisTab esconderNovo forcarCategoria="Serviço" titulo="Serviços" />}
        </>
      )}

      {aba === "tema" && <TemasTab />}

      {novoOpen && (
        <NovoAtlasModal
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
const selWrap: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const selLabel: CSSProperties = { fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.muted };
const sel: CSSProperties = { background: "white", border: `1px solid ${c.border}`, padding: "8px 12px", fontFamily: sans, fontSize: 13, color: c.ink, minWidth: 180 };
