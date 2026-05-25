import { useEffect, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { getCursoBySlug, getAulaPlayer, type CursoDetalhe, type AulaPlayer } from "@/lib/cursos.functions";
import { startCursoCheckout } from "@/lib/vendas.functions";
import { useAuth } from "@/hooks/useAuth";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";
type CompraLink = { plataforma: string; url?: string | null; pais?: string | null; tipo?: "curso" | "passe" | null };
const metodosPadrao: CompraLink[] = [
  { pais: "Brasil", tipo: "curso", plataforma: "Mercado Pago" },
  { pais: "Brasil", tipo: "curso", plataforma: "InfinityPay" },
  { pais: "Brasil", tipo: "curso", plataforma: "Hotmart" },
  { pais: "Brasil", tipo: "curso", plataforma: "Kiwify" },
  { pais: "Brasil", tipo: "curso", plataforma: "Eduzz" },
  { pais: "Brasil", tipo: "passe", plataforma: "Mercado Pago" },
  { pais: "Brasil", tipo: "passe", plataforma: "Hotmart" },
  { pais: "Internacional", tipo: "curso", plataforma: "Stripe" },
  { pais: "Internacional", tipo: "curso", plataforma: "Paddle" },
  { pais: "Internacional", tipo: "passe", plataforma: "Stripe" },
];

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
  const checkoutFn = useServerFn(startCursoCheckout);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [data, setData] = useState<CursoDetalhe | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [aulaSel, setAulaSel] = useState<string | null>(null);
  const [player, setPlayer] = useState<AulaPlayer | null>(null);
  const [playerErr, setPlayerErr] = useState<string | null>(null);
  const [bloqueioInfo, setBloqueioInfo] = useState<{ titulo: string } | null>(null);
  const [paisCompra, setPaisCompra] = useState("Brasil");
  const [tipoCompra, setTipoCompra] = useState<"curso" | "passe">("curso");
  const [metodoSel, setMetodoSel] = useState<string | null>(null);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [comprando, setComprando] = useState(false);


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
  const irParaCadastro = () => navigate({ to: "/app" });
  const linksCompra: CompraLink[] = (() => {
    const arr = data?.links_compra ?? [];
    if (arr.length > 0) return arr;
    if (data?.link_compra_externo) return [{ plataforma: data.plataforma_venda || "Comprar", url: data.link_compra_externo }];
    return [];
  })();
  const linksFiltrados = linksCompra.filter((l) => (!l.pais || l.pais === paisCompra) && (!l.tipo || l.tipo === tipoCompra));
  const opcoesCompra = linksFiltrados.length > 0 ? linksFiltrados : metodosPadrao.filter((l) => l.pais === paisCompra && l.tipo === tipoCompra);
  const precoGratis = data?.preco_label?.trim().toLowerCase() === "grátis" || data?.preco_label?.trim().toLowerCase() === "gratis";
  const comprar = async (link: CompraLink) => {
    setCheckoutErr(null);
    if (!user) { navigate({ to: "/app" }); return; }
    setComprando(true);
    try {
      const r = await checkoutFn({ data: { curso_id: data!.id, plataforma: link.plataforma, pais: link.pais ?? paisCompra, tipo: link.tipo ?? tipoCompra } });
      const url = (r as any).url ?? link.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else setCheckoutErr((r as any).message ?? "Este método ainda não possui checkout ativo.");
    } catch (e: any) {
      setCheckoutErr(e?.message ?? "Não foi possível iniciar a compra");
    } finally {
      setComprando(false);
    }
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
      {bloqueioInfo && (() => {
        const metodoAtivo = metodoSel && opcoesCompra.find((o) => o.plataforma === metodoSel)
          ? metodoSel
          : (opcoesCompra[0]?.plataforma ?? null);
        const linkAtivo = opcoesCompra.find((o) => o.plataforma === metodoAtivo);
        const precoTexto = !precoGratis && data?.preco_label ? data.preco_label : (tipoCompra === "passe" ? "Passe completo" : "Curso avulso");
        return (
          <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "hidden" }}>
            {/* Header tipo "Sua compra" */}
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: c.warm }}>
              <span style={{ fontSize: 10, letterSpacing: "0.22em", color: c.sageDark, fontFamily: sans, fontWeight: 600 }}>SUA COMPRA</span>
              <span style={{ fontSize: 10, letterSpacing: "0.18em", color: c.gold, fontFamily: sans }}>CHECKOUT SEGURO</span>
            </div>

            {/* Item */}
            <div style={{ padding: "18px", display: "flex", gap: 14, alignItems: "flex-start", borderBottom: `1px solid ${c.border}` }}>
              {data?.capa_url ? (
                <img src={data.capa_url} alt="" style={{ width: 72, height: 72, objectFit: "cover", flexShrink: 0, background: c.warm }} />
              ) : (
                <div style={{ width: 72, height: 72, background: c.warm, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 22, color: c.sageDark }}>LM</div>
              )}
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", color: c.gold, marginBottom: 4 }}>CONTEÚDO EXCLUSIVO</div>
                <div style={{ fontFamily: serif, fontSize: 18, color: c.ink, lineHeight: 1.25, marginBottom: 4 }}>{data?.titulo}</div>
                <div style={{ fontSize: 12, color: c.muted, fontFamily: sans }}>{bloqueioInfo.titulo}</div>
              </div>
            </div>

            {/* Modalidade */}
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${c.border}`, textAlign: "left" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", color: c.muted, marginBottom: 10, fontFamily: sans }}>MODALIDADE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {([
                  { v: "curso" as const, label: "Curso avulso", sub: "Acesso a esta aula" },
                  { v: "passe" as const, label: "Passe completo", sub: "Todos os cursos" },
                ]).map((opt) => {
                  const ativo = tipoCompra === opt.v;
                  return (
                    <button key={opt.v} onClick={() => { setTipoCompra(opt.v); setMetodoSel(null); }}
                      style={{ padding: "12px 10px", background: ativo ? c.sageDark : "white", color: ativo ? "white" : c.ink, border: `1px solid ${ativo ? c.sageDark : c.border}`, cursor: "pointer", fontFamily: sans, textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["Brasil", "Internacional"]).map((p) => {
                  const ativo = paisCompra === p;
                  return (
                    <button key={p} onClick={() => { setPaisCompra(p); setMetodoSel(null); }}
                      style={{ flex: 1, padding: "8px 10px", background: ativo ? c.ink : "transparent", color: ativo ? "white" : c.muted, border: `1px solid ${ativo ? c.ink : c.border}`, cursor: "pointer", fontFamily: sans, fontSize: 11, letterSpacing: "0.12em" }}>
                      {p.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Métodos de pagamento — dropdown */}
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${c.border}`, textAlign: "left" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", color: c.muted, marginBottom: 10, fontFamily: sans }}>FORMA DE PAGAMENTO</div>
              {opcoesCompra.length === 0 ? (
                <div style={{ fontSize: 12, color: c.muted, fontStyle: "italic", padding: "8px 0" }}>
                  Nenhuma forma de pagamento disponível para esta combinação.
                </div>
              ) : (() => {
                const descricoes: Record<string, string> = {
                  "Mercado Pago": "Pix, cartão e boleto · processado no app",
                  "InfinityPay": "Cartão e Pix com taxas reduzidas",
                  "Hotmart": "Cartão internacional e parcelamento",
                  "Kiwify": "Checkout simplificado em reais",
                  "Eduzz": "Cartão, boleto e Pix",
                  "Stripe": "Pagamentos globais em USD/EUR",
                  "Paddle": "Merchant of record global",
                };
                const descAtiva = metodoAtivo ? (descricoes[metodoAtivo] ?? "Redirecionamento seguro") : "";
                return (
                  <div style={{ position: "relative" }}>
                    <select
                      value={metodoAtivo ?? ""}
                      onChange={(e) => setMetodoSel(e.target.value)}
                      style={{
                        width: "100%",
                        appearance: "none",
                        WebkitAppearance: "none",
                        background: c.warm,
                        border: `1px solid ${c.border}`,
                        padding: "14px 38px 14px 14px",
                        fontFamily: sans,
                        fontSize: 13,
                        color: c.ink,
                        fontWeight: 500,
                        cursor: "pointer",
                        borderRadius: 0,
                      }}
                    >
                      {opcoesCompra.map((l) => (
                        <option key={l.plataforma} value={l.plataforma}>
                          {l.plataforma}{l.plataforma === "Mercado Pago" ? "  — Recomendado" : ""}
                        </option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: c.muted, fontSize: 12, fontFamily: sans }}>▾</span>
                    {descAtiva && (
                      <div style={{ fontSize: 11, color: c.muted, marginTop: 8, fontFamily: sans }}>{descAtiva}</div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Total + CTA */}
            <div style={{ padding: "18px", background: c.warm }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ fontSize: 11, letterSpacing: "0.22em", color: c.muted, fontFamily: sans }}>TOTAL</span>
                <span style={{ fontFamily: serif, fontSize: 28, color: c.sageDark }}>{precoTexto}</span>
              </div>
              <button onClick={() => linkAtivo && comprar(linkAtivo)} disabled={!linkAtivo || comprando}
                style={{ width: "100%", background: c.gold, color: "white", fontFamily: sans, fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", padding: "16px", border: "none", cursor: linkAtivo && !comprando ? "pointer" : "not-allowed", opacity: linkAtivo && !comprando ? 1 : 0.6 }}>
                {comprando ? "Processando…" : `Finalizar compra${metodoAtivo ? " · " + metodoAtivo : ""}`}
              </button>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, fontSize: 10, letterSpacing: "0.16em", color: c.muted, fontFamily: sans }}>
                <span>PAGAMENTO SEGURO</span>
                <span>·</span>
                <span>ACESSO IMEDIATO</span>
              </div>
              {linksCompra.length === 0 && metodoAtivo !== "Mercado Pago" && (
                <div style={{ fontSize: 11, color: c.muted, fontStyle: "italic", marginTop: 10, textAlign: "center" }}>
                  Este método precisa de um link direto para abrir o checkout.
                </div>
              )}
              {checkoutErr && <div style={{ fontSize: 12, color: "#B23A48", marginTop: 10, textAlign: "center" }}>{checkoutErr}</div>}
            </div>
          </div>
        );
      })()}


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
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {player.anexos.map((a, i) => (
                        <li key={i}>
                          <a
                            href={a.url}
                            download={a.nome}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={a.nome}
                            aria-label={`Baixar ${a.nome}`}
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 40, height: 40, background: "white", border: `1px solid ${c.border}`,
                              textDecoration: "none", color: c.sageDark, fontSize: 18, fontFamily: sans,
                              lineHeight: 1,
                            }}
                          >
                            ↓
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
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.18em", color: c.sageDark }}>
            PDF PARA DOWNLOAD
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            {data!.materiais_gratis.map((m, i) => (
              <a
                key={i}
                href={m.url}
                download={m.nome}
                target="_blank"
                rel="noopener noreferrer"
                title={m.nome}
                aria-label={`Baixar ${m.nome}`}
                style={{ textDecoration: "none", color: c.sageDark, fontSize: 16, lineHeight: 1, fontFamily: sans }}
              >
                ↓
              </a>
            ))}
          </div>
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
              <div style={{ padding: "44px 16px 20px", background: c.cream }}>
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
const selectBox: CSSProperties = { width: "100%", background: "white", border: `1px solid ${c.border}`, color: c.ink, padding: "10px 8px", fontFamily: sans, fontSize: 12 };

function btnPrimary(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 22px", border: "none", cursor: "pointer", fontFamily: sans, width: "100%" };
}
