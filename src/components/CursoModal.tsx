import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { getCursoBySlug, getAulaPlayer, type CursoDetalhe, type AulaPlayer } from "@/lib/cursos.functions";
import { getPublicOffers, startOfferCheckout } from "@/lib/offers.functions";
import { getPublicAudios } from "@/lib/audios.functions";
import { useAuth } from "@/hooks/useAuth";

const c = { cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42", ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A" };
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

type Offer = {
  id: string;
  pais: string;
  plataforma: string;
  tipo_link: "nativo" | "externo";
  url_externo: string | null;
  preco_centavos: number;
  moeda: "BRL" | "USD" | "EUR" | string;
  label: string | null;
  ordem: number;
};
type Audio = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  spotify_url: string | null;
  audio_url: string | null;
  tipo_audio: string;
  duracao_seg: number;
  gratuito: boolean;
};

const PAISES: { code: string; label: string }[] = [
  { code: "BR", label: "Brasil" },
  { code: "PT", label: "Portugal" },
  { code: "ES", label: "Espanha" },
  { code: "US", label: "Estados Unidos" },
  { code: "EU", label: "Europa" },
  { code: "OUTROS", label: "Outros" },
];

function detectPais(): string {
  if (typeof navigator === "undefined") return "BR";
  const lang = (navigator.language || "pt-BR").toLowerCase();
  if (lang.startsWith("pt-br")) return "BR";
  if (lang.startsWith("pt")) return "PT";
  if (lang.startsWith("es")) return "ES";
  if (lang.startsWith("en-us")) return "US";
  if (lang.startsWith("en") || lang.startsWith("de") || lang.startsWith("fr") || lang.startsWith("it")) return "EU";
  return "OUTROS";
}

function fmtPreco(centavos: number, moeda: string) {
  const v = centavos / 100;
  try {
    const locale = moeda === "BRL" ? "pt-BR" : moeda === "EUR" ? "pt-PT" : "en-US";
    return new Intl.NumberFormat(locale, { style: "currency", currency: moeda }).format(v);
  } catch {
    return `${moeda} ${v.toFixed(2)}`;
  }
}

function platLabel(p: string) {
  const m: Record<string, string> = {
    mercadopago: "Mercado Pago",
    hotmart: "Hotmart",
    kiwify: "Kiwify",
    eduzz: "Eduzz",
    stripe: "Stripe",
    teachable: "Teachable",
    gumroad: "Gumroad",
    manual: "Outro",
  };
  return m[p] ?? p;
}

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
  const offersFn = useServerFn(getPublicOffers);
  const audiosFn = useServerFn(getPublicAudios);
  const checkoutFn = useServerFn(startOfferCheckout);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [data, setData] = useState<CursoDetalhe | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [aulaSel, setAulaSel] = useState<string | null>(null);
  const [player, setPlayer] = useState<AulaPlayer | null>(null);
  const [playerErr, setPlayerErr] = useState<string | null>(null);
  const [bloqueioInfo, setBloqueioInfo] = useState<{ titulo: string; aulaId: string } | null>(null);
  const [pais, setPais] = useState<string>(() => detectPais());

  // Ofertas: curso + por aula
  const [cursoOffers, setCursoOffers] = useState<Offer[]>([]);
  const [aulaOffers, setAulaOffers] = useState<Record<string, Offer[]>>({});
  // Áudios do curso
  const [cursoAudios, setCursoAudios] = useState<Audio[]>([]);

  const [offerSel, setOfferSel] = useState<string | null>(null);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [comprando, setComprando] = useState(false);
  const [modulosAbertos, setModulosAbertos] = useState<Record<string, boolean>>({});

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

  // Carrega ofertas do curso + áudios quando muda país ou curso
  useEffect(() => {
    if (!data?.id) return;
    offersFn({ data: { produto_tipo: "curso", produto_id: data.id, pais } })
      .then((r) => setCursoOffers((r.offers ?? []) as Offer[]))
      .catch(() => setCursoOffers([]));
    audiosFn({ data: { vinculo_tipo: "curso", vinculo_id: data.id } })
      .then((r) => setCursoAudios((r.audios ?? []) as Audio[]))
      .catch(() => setCursoAudios([]));
  }, [data?.id, pais]);

  // Carrega ofertas da aula quando bloqueia uma aula
  useEffect(() => {
    if (!bloqueioInfo) return;
    const aId = bloqueioInfo.aulaId;
    if (aulaOffers[aId]) return;
    offersFn({ data: { produto_tipo: "aula", produto_id: aId, pais } })
      .then((r) => setAulaOffers((prev) => ({ ...prev, [aId]: (r.offers ?? []) as Offer[] })))
      .catch(() => setAulaOffers((prev) => ({ ...prev, [aId]: [] })));
  }, [bloqueioInfo?.aulaId, pais]);

  // Reset cache de ofertas de aulas ao mudar país
  useEffect(() => { setAulaOffers({}); setOfferSel(null); }, [pais]);

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

  // Ofertas combinadas (aula bloqueada + curso completo)
  const ofertasAulaAtual = bloqueioInfo ? (aulaOffers[bloqueioInfo.aulaId] ?? []) : [];
  const ofertasCombinadas: { secao: "aula" | "curso"; offer: Offer }[] = useMemo(() => {
    const arr: { secao: "aula" | "curso"; offer: Offer }[] = [];
    ofertasAulaAtual.forEach((o) => arr.push({ secao: "aula", offer: o }));
    cursoOffers.forEach((o) => arr.push({ secao: "curso", offer: o }));
    return arr;
  }, [ofertasAulaAtual, cursoOffers]);

  const offerAtiva = useMemo(() => {
    if (offerSel) return ofertasCombinadas.find((x) => x.offer.id === offerSel) ?? ofertasCombinadas[0] ?? null;
    return ofertasCombinadas[0] ?? null;
  }, [offerSel, ofertasCombinadas]);

  const comprar = async () => {
    setCheckoutErr(null);
    if (!offerAtiva) return;
    if (!user) { navigate({ to: "/app" }); return; }
    const offer = offerAtiva.offer;

    // Plataformas externas → abre direto a URL cadastrada
    if (offer.plataforma !== "mercadopago" && offer.url_externo) {
      window.open(offer.url_externo, "_blank", "noopener");
      // Registra clique via checkoutFn em background (best effort)
      checkoutFn({ data: { offer_id: offer.id } }).catch(() => undefined);
      return;
    }

    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;
    setComprando(true);
    try {
      const r = await checkoutFn({ data: { offer_id: offer.id } });
      const url = r.url;
      if (url) {
        if (win) win.location.href = url; else window.location.href = url;
      } else {
        win?.close();
        setCheckoutErr(r.message ?? "Esta oferta não tem checkout ativo.");
      }
    } catch (e: unknown) {
      win?.close();
      const msg =
        e instanceof Error ? e.message :
        (typeof e === "object" && e && "message" in e) ? String((e as { message: unknown }).message) :
        "Não foi possível iniciar a compra";
      setCheckoutErr(msg);
    } finally {
      setComprando(false);
    }
  };

  const abrirAula = (id: string, bloqueada: boolean, titulo: string) => {
    if (bloqueada) {
      setBloqueioInfo({ titulo, aulaId: id });
      setOfferSel(null);
      setAulaSel(null);
      setPlayer(null);
      if (isMobile) {
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

  const voltarParaLista = () => {
    setBloqueioInfo(null);
    setCheckoutErr(null);
  };

  // ───────── Checkout enxuto ─────────
  const renderCheckout = () => {
    if (!bloqueioInfo) return null;
    const paisLabel = PAISES.find((p) => p.code === pais)?.label ?? pais;
    return (
      <div style={{ background: "white", border: `1px solid ${c.border}`, overflow: "hidden" }}>
        {/* Header: SUA COMPRA + país pill */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: c.warm, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button onClick={voltarParaLista} style={{ background: "transparent", border: "none", color: c.sageDark, fontFamily: sans, fontSize: 12, cursor: "pointer", padding: 0, letterSpacing: "0.06em" }}>
                ← Voltar
              </button>
            )}
            <span style={{ fontSize: 10, letterSpacing: "0.22em", color: c.sageDark, fontFamily: sans, fontWeight: 600 }}>SUA COMPRA</span>
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              aria-label="País de pagamento"
              style={{
                appearance: "none", WebkitAppearance: "none",
                background: "white", border: `1px solid ${c.border}`,
                padding: "6px 24px 6px 10px",
                fontFamily: sans, fontSize: 11, color: c.ink, fontWeight: 500,
                cursor: "pointer", borderRadius: 999, letterSpacing: "0.04em",
              }}
            >
              {PAISES.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
            <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: c.muted, fontSize: 10 }}>▾</span>
          </div>
        </div>

        {/* Item — só nome da aula, sem repetir capa+curso */}
        <div style={{ padding: "14px 16px 4px", textAlign: "left" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", color: c.gold, marginBottom: 4 }}>VOCÊ ESTÁ COMPRANDO</div>
          <div style={{ fontFamily: serif, fontSize: 18, color: c.ink, lineHeight: 1.25 }}>{bloqueioInfo.titulo}</div>
        </div>

        {/* Ofertas — radio list unificada */}
        <div style={{ padding: "12px 16px 4px", textAlign: "left" }}>
          {ofertasCombinadas.length === 0 && (
            <div style={{ fontSize: 12, color: c.muted, fontStyle: "italic", padding: "8px 0" }}>
              Nenhuma oferta disponível para {paisLabel} ainda.
            </div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {ofertasAulaAtual.map((o) => (
              <OfferRow key={o.id} offer={o} secao="aula" ativo={offerAtiva?.offer.id === o.id} onClick={() => setOfferSel(o.id)} />
            ))}
            {cursoOffers.map((o) => (
              <OfferRow key={o.id} offer={o} secao="curso" ativo={offerAtiva?.offer.id === o.id} onClick={() => setOfferSel(o.id)} />
            ))}
          </div>
        </div>

        {/* CTA único — total embutido no botão */}
        {offerAtiva && (
          <div style={{ padding: "14px 16px 16px" }}>
            <button onClick={comprar} disabled={comprando}
              style={{
                width: "100%", background: c.gold, color: "white",
                fontFamily: sans, padding: "14px 16px", border: "none",
                cursor: comprando ? "not-allowed" : "pointer", opacity: comprando ? 0.6 : 1,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {comprando ? "Processando…" : "Finalizar"}
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: "lining-nums tabular-nums" }}>
                {fmtPreco(offerAtiva.offer.preco_centavos, offerAtiva.offer.moeda)}
              </span>
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: c.muted, fontFamily: sans, textAlign: "center", letterSpacing: "0.02em" }}>
              {platLabel(offerAtiva.offer.plataforma)}
              {offerAtiva.offer.label ? ` · ${offerAtiva.offer.label}` : ""}
              {" · pagamento seguro · acesso imediato"}
            </div>
            {checkoutErr && <div style={{ fontSize: 12, color: "#B23A48", marginTop: 8, textAlign: "center" }}>{checkoutErr}</div>}
          </div>
        )}
      </div>
    );
  };

  // ───────── Player ─────────
  const renderPlayer = () => (
    <div>
      {renderCheckout()}

      {!aulaSel && !bloqueioInfo && (
        <div style={{ color: c.muted, padding: 30, textAlign: "center", background: c.warm, border: `1px solid ${c.border}` }}>
          Selecione uma aula para começar.
        </div>
      )}

      {aulaSel && !bloqueioInfo && (
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

              <div style={{ marginTop: 14 }}>
                <h3 style={{ fontFamily: serif, fontSize: isMobile ? 20 : 24, fontWeight: 400, margin: "0 0 8px", lineHeight: 1.25 }}>{player.aula.titulo}</h3>
                {player.aula.descricao && (
                  <p style={{ color: c.muted, lineHeight: 1.55, margin: "0 0 12px", fontSize: 14 }}>{player.aula.descricao}</p>
                )}

                {player.anexos.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {player.anexos.map((a, i) => (
                      <a key={i} href={a.url} download={a.nome} target="_blank" rel="noopener noreferrer" title={a.nome}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", border: `1px solid ${c.border}`, padding: "8px 12px", textDecoration: "none", color: c.sageDark, fontSize: 12, fontFamily: sans, letterSpacing: "0.02em" }}>
                        <span style={{ fontSize: 14, lineHeight: 1 }}>↓</span>
                        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Áudios do curso */}
      {cursoAudios.length > 0 && !bloqueioInfo && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", color: c.sageDark, marginBottom: 10, fontFamily: sans, fontWeight: 600 }}>OUÇA TAMBÉM</div>
          <div style={{ display: "grid", gap: 8 }}>
            {cursoAudios.map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, background: "white", border: `1px solid ${c.border}` }}>
                {a.capa_url && <img src={a.capa_url} alt="" style={{ width: 44, height: 44, objectFit: "cover" }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: serif, fontSize: 15, color: c.ink, lineHeight: 1.2 }}>{a.titulo}</div>
                  {a.descricao && <div style={{ fontSize: 11, color: c.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.descricao}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {a.spotify_url && (
                    <a href={a.spotify_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sageDark, textDecoration: "none", border: `1px solid ${c.sageDark}`, padding: "5px 9px", fontFamily: sans }}>
                      Spotify
                    </a>
                  )}
                  {a.audio_url && (
                    <a href={a.audio_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.gold, textDecoration: "none", border: `1px solid ${c.gold}`, padding: "5px 9px", fontFamily: sans }}>
                      Ouvir
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ───────── Vitrine ─────────
  const precoMin = cursoOffers.length > 0
    ? fmtPreco(Math.min(...cursoOffers.map((o) => o.preco_centavos)), cursoOffers[0].moeda)
    : null;

  const renderLista = () => (
    <div>
      {/* Metadados + título + descrição compactos */}
      <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: c.sage, marginBottom: 6, fontFamily: sans }}>
        {data!.categoria} · {data!.nivel}
      </div>
      <h2 style={{ fontFamily: serif, fontSize: isMobile ? 24 : 28, fontWeight: 400, margin: "0 0 6px", lineHeight: 1.15 }}>{data!.titulo}</h2>
      {data!.descricao_curta && (
        <p style={{ fontSize: 13, color: c.muted, margin: "0 0 14px", lineHeight: 1.5 }}>{data!.descricao_curta}</p>
      )}

      {/* Faixa única: preço + PDFs */}
      {(precoMin || data!.materiais_gratis.length > 0) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "10px 0", borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, marginBottom: 16 }}>
          {!data!.matriculado && precoMin ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.18em", color: c.muted, fontFamily: sans }}>A PARTIR DE</span>
              <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 600, color: c.sageDark, fontVariantNumeric: "lining-nums tabular-nums" }}>{precoMin}</span>
            </div>
          ) : <span />}
          {data!.materiais_gratis.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {data!.materiais_gratis.map((m, i) => (
                <a key={i} href={m.url} download={m.nome} target="_blank" rel="noopener noreferrer" title={m.nome}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${c.sageDark}`, color: c.sageDark, textDecoration: "none", fontSize: 11, fontFamily: sans, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  PDF <span style={{ fontSize: 13, lineHeight: 1 }}>↓</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Módulos como acordeão */}
      {data!.modulos.length === 0 && <p style={{ color: c.muted, fontStyle: "italic", fontSize: 13 }}>Em breve.</p>}
      {data!.modulos.map((m, idx) => {
        const aberto = modulosAbertos[m.id] ?? idx === 0;
        const toggle = () => setModulosAbertos((prev) => ({ ...prev, [m.id]: !aberto }));
        return (
          <div key={m.id} style={{ marginBottom: 10, borderBottom: `1px solid ${c.border}` }}>
            <button onClick={toggle}
              style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "12px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: c.muted, marginBottom: 2, fontFamily: sans }}>MÓDULO {String(idx + 1).padStart(2, "0")}</div>
                <div style={{ fontFamily: serif, fontSize: 17, color: c.ink, lineHeight: 1.2 }}>{m.titulo}</div>
              </div>
              <span style={{ fontSize: 11, color: c.muted, fontFamily: sans, letterSpacing: "0.06em" }}>
                {m.aulas.length} {m.aulas.length === 1 ? "aula" : "aulas"} {aberto ? "−" : "+"}
              </span>
            </button>
            {aberto && (
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px" }}>
                {m.aulas.map((a) => {
                  const ativo = aulaSel === a.id || bloqueioInfo?.aulaId === a.id;
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
                        <span style={{ fontSize: 10, opacity: 0.75, letterSpacing: "0.08em" }}>
                          {a.bloqueada ? "COMPRAR" : a.previa_gratis ? "PRÉVIA" : `${a.duracao_min}min`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
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

function OfferRow({ offer, ativo, onClick }: { offer: Offer; ativo: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
        padding: "12px 14px",
        background: ativo ? c.sageDark : "white",
        color: ativo ? "white" : c.ink,
        border: `1px solid ${ativo ? c.sageDark : c.border}`,
        cursor: "pointer", fontFamily: sans, textAlign: "left",
      }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{platLabel(offer.plataforma)}</div>
        {offer.label && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{offer.label}</div>}
      </div>
      <div style={{ fontFamily: sans, fontSize: 17, fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "lining-nums tabular-nums" }}>{fmtPreco(offer.preco_centavos, offer.moeda)}</div>
    </button>
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
