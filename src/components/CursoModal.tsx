import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { getCursoBySlug, getAulaPlayer, type CursoDetalhe, type AulaPlayer } from "@/lib/cursos.functions";
import { useAuth } from "@/hooks/useAuth";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const upd = () => setM(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  return m;
}

export function CursoModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const fn = useServerFn(getCursoBySlug);
  const playerFn = useServerFn(getAulaPlayer);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [data, setData] = useState<CursoDetalhe | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [aulaSel, setAulaSel] = useState<string | null>(null);
  const [player, setPlayer] = useState<AulaPlayer | null>(null);
  const [playerErr, setPlayerErr] = useState<string | null>(null);
  const [bloqueioInfo, setBloqueioInfo] = useState<{ titulo: string } | null>(null);

  useEffect(() => {
    fn({ data: { slug } })
      .then((d) => {
        const det = d as CursoDetalhe | null;
        setData(det);
        if (det) {
          const first = det.modulos.flatMap((m) => m.aulas).find((a) => !a.bloqueada);
          if (first) {
            setAulaSel(first.id);
            setBloqueioInfo(null);
          }
        }
      })
      .catch((e) => setErr(e?.message ?? "Erro"));
  }, [slug, user?.id]);

  useEffect(() => {
    if (!aulaSel) { setPlayer(null); return; }
    setPlayer(null); setPlayerErr(null);
    playerFn({ data: { aula_id: aulaSel } })
      .then((r) => setPlayer(r as AulaPlayer))
      .catch((e) => setPlayerErr(e?.message ?? "Erro"));
  }, [aulaSel]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const fechar = () => onClose();
  const irParaCadastro = () => navigate({ to: "/login" });
  const comprar = () => {
    if (!data) return;
    if (data.link_compra_externo) window.open(data.link_compra_externo, "_blank", "noopener,noreferrer");
    else if (!user) navigate({ to: "/login" });
  };

  const abrirAula = (id: string, bloqueada: boolean, titulo: string) => {
    if (bloqueada) {
      setBloqueioInfo({ titulo });
      setAulaSel(null);
      setPlayer(null);
      if (isMobile) {
        // Rola pro topo onde o card de bloqueio aparece
        requestAnimationFrame(() => document.getElementById("curso-modal-top")?.scrollIntoView({ behavior: "smooth" }));
      }
      return;
    }
    setBloqueioInfo(null);
    setAulaSel(id);
    if (isMobile) {
      requestAnimationFrame(() => document.getElementById("curso-modal-top")?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  // Player block (vídeo + título + anexos) — usado tanto desktop quanto mobile
  const renderPlayer = () => (
    <div>
      {bloqueioInfo && (
        <div style={{ padding: isMobile ? 20 : 40, textAlign: "center", background: c.warm, border: `1px solid ${c.border}` }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: c.gold, marginBottom: 10 }}>CONTEÚDO EXCLUSIVO</div>
          <h3 style={{ fontFamily: serif, fontSize: isMobile ? 22 : 30, fontWeight: 400, margin: "0 0 10px" }}>{bloqueioInfo.titulo}</h3>
          <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.6, margin: "0 auto 20px", maxWidth: 460 }}>
            Esta aula faz parte do conteúdo pago. Entre na área de aluna para acessar o Atlas Materno completo.
          </p>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, justifyContent: "center" }}>
            <button onClick={irParaCadastro} style={btnPrimary(c.sageDark)}>
              {user ? "Ir para minha área" : "Entrar"}
            </button>
            {data?.link_compra_externo && (
              <button onClick={comprar} style={btnPrimary(c.gold)}>
                Comprar agora{data.plataforma_venda ? ` · ${data.plataforma_venda}` : ""}
              </button>
            )}
          </div>
        </div>
      )}

      {!aulaSel && !bloqueioInfo && (
        <div style={{ color: c.muted, padding: 30, textAlign: "center", background: c.warm, border: `1px solid ${c.border}` }}>
          Selecione uma aula para começar.
        </div>
      )}

      {aulaSel && (
        <>
          {playerErr && <p style={{ color: "#B23A48" }}>{playerErr}</p>}
          {!player && !playerErr && (
            <div style={{ aspectRatio: "16/9", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              Carregando aula…
            </div>
          )}
          {player && (
            <>
              {player.conteudo.kind === "video_externo" && (
                <div style={{ aspectRatio: "16/9", background: "black" }}>
                  <iframe src={player.conteudo.embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                </div>
              )}
              {player.conteudo.kind === "video_upload" && (
                <video src={player.conteudo.url} controls style={{ width: "100%", aspectRatio: "16/9", background: "black", display: "block" }} />
              )}
              {player.conteudo.kind === "pdf" && (
                <iframe src={player.conteudo.url} style={{ width: "100%", height: isMobile ? "60vh" : "560px", border: `1px solid ${c.border}` }} />
              )}
              {player.conteudo.kind === "texto" && (
                <div style={{ lineHeight: 1.7, fontSize: 15, padding: 16, background: "white", border: `1px solid ${c.border}` }} dangerouslySetInnerHTML={{ __html: player.conteudo.html }} />
              )}
              {player.conteudo.kind === "vazio" && (
                <div style={{ padding: 24, background: c.warm, border: `1px solid ${c.border}`, textAlign: "center" }}>
                  <p style={{ color: c.muted, margin: 0 }}>Esta aula ainda não tem vídeo cadastrado.</p>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.18em", color: c.muted, marginBottom: 6 }}>AULA</div>
                <h3 style={{ fontFamily: serif, fontSize: isMobile ? 22 : 26, fontWeight: 400, margin: "0 0 10px" }}>{player.aula.titulo}</h3>
                {player.aula.descricao && (
                  <p style={{ color: c.muted, lineHeight: 1.6, margin: "0 0 16px", fontSize: 14 }}>{player.aula.descricao}</p>
                )}

                {player.anexos.length > 0 && (
                  <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 14, marginTop: 12 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.18em", color: c.sageDark, marginBottom: 10 }}>MATERIAIS PARA DOWNLOAD</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
                      {player.anexos.map((a, i) => (
                        <li key={i}>
                          <a
                            href={a.url}
                            download={a.nome}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "10px 12px", background: "white", border: `1px solid ${c.border}`,
                              textDecoration: "none", color: c.ink, fontSize: 14, fontFamily: sans,
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</span>
                            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sageDark, marginLeft: 12 }}>Baixar ↓</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  const renderLista = () => (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 8 }}>
        {data!.categoria} · {data!.nivel}
      </div>
      <h2 style={{ fontFamily: serif, fontSize: isMobile ? 24 : 26, fontWeight: 400, margin: "0 0 8px", lineHeight: 1.2 }}>{data!.titulo}</h2>
      {data!.descricao_curta && <p style={{ fontSize: 13, color: c.muted, margin: "0 0 20px", lineHeight: 1.5 }}>{data!.descricao_curta}</p>}

      {!data!.matriculado && data!.preco_label && data!.preco_label.toLowerCase() !== "grátis" && data!.preco_label.toLowerCase() !== "gratis" && (
        <div style={{ background: "white", padding: 14, border: `1px solid ${c.border}`, marginBottom: 16 }}>
          <div style={{ fontFamily: serif, fontSize: 22, color: c.sageDark }}>{data!.preco_label}</div>
        </div>
      )}

      {data!.materiais_gratis.length > 0 && (
        <div style={{ background: c.warm, padding: 14, border: `1px solid ${c.border}`, marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: c.sageDark, marginBottom: 10 }}>
            CONTEÚDO PDF PARA DOWNLOAD
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {data!.materiais_gratis.map((m, i) => (
              <li key={i}>
                <a
                  href={m.url}
                  download={m.nome}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", background: "white", border: `1px solid ${c.border}`,
                    textDecoration: "none", color: c.ink, fontSize: 13, fontFamily: sans,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nome}</span>
                    <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sageDark, marginLeft: 12 }}>Baixar PDF</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}


      <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted, marginBottom: 12 }}>
        Conteúdo programático
      </div>
      {data!.modulos.length === 0 && <p style={{ color: c.muted, fontStyle: "italic", fontSize: 13 }}>Em breve.</p>}
      {data!.modulos.map((m, idx) => (
        <div key={m.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: c.muted, marginBottom: 6 }}>MÓDULO {String(idx + 1).padStart(2, "0")}</div>
          <div style={{ fontFamily: serif, fontSize: 17, marginBottom: 8 }}>{m.titulo}</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {m.aulas.map((a) => {
              const ativo = aulaSel === a.id;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => abrirAula(a.id, a.bloqueada, a.titulo)}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 12px",
                      background: ativo ? c.sageDark : "transparent",
                      color: ativo ? "white" : (a.bloqueada ? c.muted : c.ink),
                      border: "none", borderLeft: `2px solid ${ativo ? c.gold : "transparent"}`,
                      cursor: "pointer",
                      fontFamily: sans, fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8,
                    }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.titulo}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      {a.bloqueada ? "BLOQ" : a.previa_gratis ? "PRÉVIA" : `${a.duracao_min}min`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div onClick={fechar} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={modal(isMobile)}>
        <button onClick={fechar} aria-label="Fechar" style={closeBtn}>×</button>

        {err && <div style={{ padding: 40 }}><p style={{ color: "#B23A48" }}>{err}</p></div>}
        {data === undefined && !err && <div style={{ padding: 60, color: c.muted }}>Carregando…</div>}
        {data === null && (
          <div style={{ padding: 60 }}>
            <h2 style={{ fontFamily: serif }}>Conteúdo não encontrado</h2>
          </div>
        )}

        {data && (
          isMobile ? (
            // MOBILE: uma única coluna, player no topo, lista embaixo
            <div style={{ height: "100dvh", overflow: "auto", background: c.cream }}>
              <div id="curso-modal-top" />
              <div style={{ padding: "44px 16px 20px", background: "#000" }}>
                {renderPlayer()}
              </div>
              <div style={{ padding: "20px 16px 32px", background: c.warm }}>
                {renderLista()}
              </div>
            </div>
          ) : (
            // DESKTOP: 2 colunas
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "min(92vh, 760px)" }}>
              <aside style={{ background: c.warm, borderRight: `1px solid ${c.border}`, overflow: "auto", padding: 24 }}>
                {renderLista()}
              </aside>
              <section style={{ background: c.cream, overflow: "auto", padding: 32 }}>
                {renderPlayer()}
              </section>
            </div>
          )
        )}
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: "fixed", inset: 0, background: "rgba(28,28,26,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
const modal = (isMobile: boolean): CSSProperties => ({
  background: c.cream,
  width: "100%",
  maxWidth: isMobile ? "100%" : 1200,
  height: isMobile ? "100dvh" : "auto",
  maxHeight: isMobile ? "100dvh" : "94vh",
  border: isMobile ? "none" : `1px solid ${c.border}`,
  position: "relative",
  overflow: "hidden",
});
const closeBtn: CSSProperties = { position: "absolute", top: 10, right: 14, background: "rgba(255,255,255,0.95)", border: `1px solid ${c.border}`, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 22, color: c.ink, zIndex: 10, fontFamily: sans, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" };

function btnPrimary(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans, width: "100%" };
}
