import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import lemateLogo from "@/assets/lemater-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  listMateriaisVitrine,
  getMaterialGratisAccess,
  getMaterialAccess,
  type VitrineMaterial,
  type MaterialAccess,
} from "@/lib/materiais.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/conteudos-gratis")({
  head: () => ({
    meta: [
      { title: "Conteúdos & Cursos · Le Mater" },
      {
        name: "description",
        content:
          "Materiais e cursos para mulheres em todas as fases da jornada materna — concepção, gestação, pós-parto e bebê.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
      },
    ],
  }),
  component: ConteudosGratisPage,
});

const NAV_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ["inicio", "Início"],
  ["sobre", "Sobre"],
  ["produtos", "ATLAS MATERNO"],
  ["contato", "Contato"],
];

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageLight: "#8AB89A",
  sageDark: "#2D5A42",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
  gold: "#B8923A",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

const FILTROS = ["Tudo", "Grátis", "Cursos", "Concepção", "Gestação", "Puerpério", "Bebê"] as const;
type Filtro = typeof FILTROS[number];

function ConteudoNav({ isMobile }: { isMobile: boolean }) {
  const [open, setOpen] = useState(false);
  const linkStyle: CSSProperties = {
    fontSize: isMobile ? 15 : 13,
    fontWeight: 400,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: c.muted,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: isMobile ? "12px 0" : 0,
    fontFamily: sans,
    textDecoration: "none",
    display: "block",
  };
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "16px 20px" : "20px 48px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src={lemateLogo} alt="Le Mater" style={{ height: isMobile ? 40 : 52, width: "auto", display: "block" }} />
        </Link>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
            {NAV_ITEMS.map(([id, label]) => (
              <li key={id}><Link to="/" search={{ s: id } as any} style={linkStyle}>{label}</Link></li>
            ))}
          </ul>
        )}
        {!isMobile ? (
          <Link to="/login" style={{ textDecoration: "none" }}>
            <button style={{ background: `linear-gradient(135deg, ${c.sageDark} 0%, ${c.sage} 100%)`, color: "white", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", padding: "12px 24px", border: "1.5px solid transparent", borderRadius: 8, cursor: "pointer", fontFamily: sans }}>ENTRAR</button>
          </Link>
        ) : (
          <button onClick={() => setOpen((v) => !v)} aria-label="Abrir menu" style={{ background: "none", border: `1px solid ${c.border}`, color: c.ink, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 14px", cursor: "pointer", fontFamily: sans }}>
            {open ? "Fechar" : "Menu"}
          </button>
        )}
      </div>
      {isMobile && open && (
        <div style={{ padding: "8px 20px 20px", borderTop: `1px solid ${c.border}`, display: "flex", flexDirection: "column" }}>
          {NAV_ITEMS.map(([id, label]) => (
            <Link key={id} to="/" search={{ s: id } as any} style={{ ...linkStyle, textAlign: "left", borderBottom: `1px solid ${c.border}` }}>{label}</Link>
          ))}
          <Link to="/login" style={{ textDecoration: "none", marginTop: 16 }}>
            <button style={{ background: `linear-gradient(135deg, ${c.sageDark} 0%, ${c.sage} 100%)`, color: "white", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", padding: "12px 24px", border: "1.5px solid transparent", borderRadius: 8, cursor: "pointer", fontFamily: sans, width: "100%" }}>ENTRAR</button>
          </Link>
        </div>
      )}
    </nav>
  );
}

function plataformaLabel(p: string | null): string {
  if (!p) return "Comprar";
  const map: Record<string, string> = {
    hotmart: "Hotmart", kiwify: "Kiwify", teachable: "Teachable", eduzz: "Eduzz", outro: "Curso externo",
  };
  return map[p.toLowerCase()] ?? p;
}

function tipoLabel(t: VitrineMaterial["tipo"]): string {
  return t === "pdf" ? "PDF" : t === "video_externo" ? "Vídeo" : t === "video_upload" ? "Vídeo" : "Artigo";
}

function badgeFor(m: VitrineMaterial): { label: string; color: string } {
  if (m.vende_externo) return { label: plataformaLabel(m.plataforma_venda), color: c.gold };
  if (m.area === "gratis") return { label: "Grátis", color: c.sage };
  if (m.acesso === "restrito" && m.pode_consumir) return { label: "Liberado para você", color: c.sage };
  if (m.area === "pago" && m.pode_consumir) return { label: "Seu curso", color: c.sageDark };
  return { label: "Curso", color: c.muted };
}

function ctaTextFor(m: VitrineMaterial): string {
  if (m.cta_label) return m.cta_label;
  if (m.vende_externo) return "Comprar agora";
  if (m.pode_consumir && m.area === "pago") return "Acessar curso";
  if (m.pode_consumir) return "Acessar agora";
  if (m.area === "gratis") return "Acessar gratuitamente";
  return "Entrar para acessar";
}

function ConteudoCard({ item, numero, onAcao }: { item: VitrineMaterial; numero: string; onAcao: (m: VitrineMaterial) => void }) {
  const [hover, setHover] = useState(false);
  const isDark = hover;
  const badge = badgeFor(item);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: isDark ? c.sageDark : c.warm, padding: 40, transition: "background .3s", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {item.capa_url && (
        <div style={{ marginBottom: 18, marginLeft: -40, marginRight: -40, marginTop: -40 }}>
          <img src={item.capa_url} alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div style={{ fontFamily: serif, fontSize: 64, fontWeight: 300, color: isDark ? "rgba(255,255,255,0.18)" : c.border, lineHeight: 1 }}>{numero}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? "white" : "white", background: badge.color, padding: "4px 10px", fontWeight: 600 }}>{badge.label}</span>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? c.sageLight : c.sage, fontWeight: 500 }}>{item.categoria}</div>
        </div>
      </div>
      <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, color: isDark ? "white" : c.ink, marginBottom: 14, lineHeight: 1.2 }}>
        {item.titulo}
      </div>
      {item.descricao && (
        <p style={{ fontSize: 14, lineHeight: 1.7, color: isDark ? "rgba(255,255,255,0.75)" : c.muted, marginBottom: 24 }}>
          {item.descricao}
        </p>
      )}
      <div style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : c.border}`, paddingTop: 16, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 4 }}>Formato</div>
          <div style={{ fontSize: 14, color: isDark ? "white" : c.ink }}>{tipoLabel(item.tipo)}</div>
        </div>
        {item.preco_label && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.6)" : c.muted, marginBottom: 4 }}>Investimento</div>
            <div style={{ fontFamily: serif, fontSize: 22, color: isDark ? "white" : c.sageDark }}>{item.preco_label}</div>
          </div>
        )}
      </div>
      <button
        onClick={() => onAcao(item)}
        style={{ background: isDark ? "white" : c.sageDark, color: isDark ? c.sageDark : "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 24px", border: "none", cursor: "pointer", fontFamily: sans, width: "100%", marginTop: "auto" }}
      >
        {ctaTextFor(item)}
      </button>
    </div>
  );
}

function ConteudosGratisPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const listFn = useServerFn(listMateriaisVitrine);
  const acessoGratis = useServerFn(getMaterialGratisAccess);
  const acessoAuth = useServerFn(getMaterialAccess);

  const [items, setItems] = useState<VitrineMaterial[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("Tudo");
  const [selecionado, setSelecionado] = useState<VitrineMaterial | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [acesso, setAcesso] = useState<MaterialAccess | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  useEffect(() => {
    listFn()
      .then((d) => setItems(d as VitrineMaterial[]))
      .catch((e) => setErroLista(e?.message ?? "Erro ao carregar"));
  }, [user?.id]);

  const filtrados = useMemo(() => {
    if (!items) return [];
    if (filtro === "Tudo") return items;
    if (filtro === "Grátis") return items.filter((m) => m.area === "gratis");
    if (filtro === "Cursos") return items.filter((m) => m.area === "pago" || m.vende_externo);
    return items.filter((m) => m.categoria?.toLowerCase().includes(filtro.toLowerCase()));
  }, [items, filtro]);

  const fechar = () => {
    setSelecionado(null);
    setAcesso(null);
    setErroModal(null);
    setForm({ nome: "", email: "", telefone: "" });
  };

  const abrir = async (m: VitrineMaterial) => {
    setSelecionado(m);
    setAcesso(null);
    setErroModal(null);
    setForm({ nome: "", email: "", telefone: "" });

    // Caminho externo: abre direto a página de venda
    if (m.vende_externo && m.link_compra) {
      window.open(m.link_compra, "_blank", "noopener,noreferrer");
      setSelecionado(null);
      return;
    }

    // Já pode consumir: busca acesso imediato (autenticado)
    if (m.pode_consumir) {
      try {
        const r = await acessoAuth({ data: { material_id: m.id } });
        setAcesso(r);
      } catch (e: any) {
        setErroModal(e?.message ?? "Erro");
      }
      return;
    }

    // Pago sem permissão e sem link → manda pro login
    if (m.area === "pago") {
      window.location.href = "/login";
      setSelecionado(null);
      return;
    }
    // Grátis público → cai no formulário de lead
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal(null);
    if (!selecionado) return;
    if (!form.nome.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || form.telefone.replace(/\D/g, "").length < 8) {
      setErroModal("Preencha nome, e-mail válido e telefone (mín. 8 dígitos).");
      return;
    }
    setEnviando(true);
    try {
      const r = await acessoGratis({
        data: {
          material_id: selecionado.id,
          lead: { nome: form.nome.trim(), email: form.email.trim(), telefone: form.telefone.trim() },
        },
      });
      setAcesso(r);
    } catch (err: any) {
      setErroModal(err?.message ?? "Erro ao enviar.");
    }
    setEnviando(false);
  };

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <ConteudoNav isMobile={isMobile} />

      <section style={{ paddingTop: 70 }}>
        <div style={{ padding: isMobile ? "60px 24px" : "80px 48px" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.sage, fontWeight: 500, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 1, background: c.sage }} />
              Conteúdos & Cursos
            </div>
            <h1 style={{ fontFamily: serif, fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 300, lineHeight: 1.1, color: c.ink, marginBottom: 16 }}>
              Materiais educativos e cursos. <em style={{ fontStyle: "italic", color: c.sage }}>Toda a jornada materna.</em>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: c.muted, fontWeight: 300 }}>
              Concepção, gestação, pós-parto, bebê e cursos completos para você acessar agora.
            </p>
          </div>

          {/* Filtros */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {FILTROS.map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  fontFamily: sans, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "10px 18px", cursor: "pointer",
                  background: filtro === f ? c.sageDark : "transparent",
                  color: filtro === f ? "white" : c.muted,
                  border: `1px solid ${filtro === f ? c.sageDark : c.border}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {erroLista ? (
            <p style={{ color: "#B23A48" }}>{erroLista}</p>
          ) : items === null ? (
            <p style={{ color: c.muted }}>Carregando conteúdos…</p>
          ) : filtrados.length === 0 ? (
            <div style={{ background: c.warm, padding: 60, textAlign: "center", border: `1px solid ${c.border}` }}>
              <p style={{ fontFamily: serif, fontSize: 22, color: c.muted, margin: 0 }}>
                Nenhum conteúdo nesta categoria ainda.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 2 }}>
              {filtrados.map((m, i) => (
                <ConteudoCard
                  key={m.id}
                  item={m}
                  numero={String(i + 1).padStart(2, "0")}
                  onAcao={abrir}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer style={{ padding: isMobile ? "60px 24px 40px" : "80px 48px 48px", background: "white", borderTop: `1px solid ${c.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr 1fr", gap: 40, maxWidth: 1200, margin: "0 auto", marginBottom: 60 }}>
          <div style={{ maxWidth: 300 }}>
            <Link to="/"><img src={lemateLogo} alt="Le Mater" style={{ height: 48, marginBottom: 24 }} /></Link>
            <p style={{ fontSize: 14, color: c.muted, lineHeight: 1.6, fontWeight: 300 }}>
              Acompanhando mulheres da tentativa natural de engravidar aos primeiros cuidados com o bebê.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.ink, marginBottom: 20, fontWeight: 600 }}>Plataforma</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li><Link to="/" search={{ s: "inicio" } as any} style={{ fontSize: 13, color: c.muted, textDecoration: "none" }}>Início</Link></li>
              <li><Link to="/conteudos-gratis" style={{ fontSize: 13, color: c.muted, textDecoration: "none" }}>Conteúdos & Cursos</Link></li>
              <li><Link to="/login" style={{ fontSize: 13, color: c.muted, textDecoration: "none" }}>Acessar Atlas</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: c.ink, marginBottom: 20, fontWeight: 600 }}>Contato</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ fontSize: 13, color: c.muted }}>contato@lemater.com</li>
              <li style={{ fontSize: 13, color: c.muted }}>Ribeirão Preto, SP</li>
            </ul>
          </div>
          <div />
        </div>
        <div style={{ paddingTop: 32, borderTop: `1px solid ${c.border}`, fontSize: 11, color: c.muted, textAlign: "center" }}>
          © 2026 · Le Mater · Todos os direitos reservados
        </div>
      </footer>

      {/* Modal */}
      {selecionado && (
        <div onClick={fechar} style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.cream, maxWidth: acesso ? 1000 : 520, width: "100%", maxHeight: "92vh", overflow: "auto", padding: isMobile ? 24 : 36, position: "relative", border: `1px solid ${c.border}` }}>
            <button onClick={fechar} aria-label="Fechar" style={{ position: "absolute", top: 12, right: 18, background: "none", border: "none", fontSize: 26, color: c.muted, cursor: "pointer", fontFamily: serif }}>×</button>

            {acesso ? (
              <PlayerView mat={selecionado} acesso={acesso} />
            ) : (
              <form onSubmit={submitLead} noValidate>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted, marginBottom: 8 }}>
                  {selecionado.categoria} · {tipoLabel(selecionado.tipo)}
                </div>
                <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, marginBottom: 10, lineHeight: 1.25 }}>
                  {selecionado.titulo}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: c.muted, marginBottom: 24 }}>
                  Preencha abaixo para liberar o conteúdo gratuitamente.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
                  <input placeholder="Seu nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
                  <input type="email" placeholder="Seu melhor e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                  <input type="tel" placeholder="WhatsApp / Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} style={inputStyle} />
                </div>
                {erroModal && <div style={{ fontSize: 13, color: "#B23A48", marginBottom: 12 }}>{erroModal}</div>}
                <button type="submit" disabled={enviando} style={{ background: c.sageDark, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "16px 28px", border: "none", cursor: enviando ? "wait" : "pointer", fontFamily: sans, width: "100%", opacity: enviando ? 0.7 : 1 }}>
                  {enviando ? "Liberando…" : "Liberar conteúdo agora"}
                </button>
              </form>
            )}

            {!acesso && erroModal && !enviando && (
              <div style={{ fontSize: 13, color: "#B23A48", marginTop: 12 }}>{erroModal}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerView({ mat, acesso }: { mat: VitrineMaterial; acesso: MaterialAccess }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: c.sage, marginBottom: 10 }}>
        {mat.categoria} · Liberado
      </div>
      <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, margin: "0 0 20px" }}>{mat.titulo}</h2>

      {acesso.kind === "pdf" && (
        <>
          <a href={acesso.url} download target="_blank" rel="noreferrer" style={dlBtn}>Baixar PDF</a>
          <iframe src={acesso.url} title={mat.titulo} style={{ width: "100%", height: "70vh", border: `1px solid ${c.border}`, marginTop: 16 }} />
        </>
      )}
      {acesso.kind === "video_upload" && (
        <>
          <video src={acesso.url} controls style={{ width: "100%", maxHeight: "70vh", background: "black" }} />
          <a href={acesso.url} download target="_blank" rel="noreferrer" style={{ ...dlBtn, marginTop: 16 }}>Baixar vídeo</a>
        </>
      )}
      {acesso.kind === "video_externo" && (
        <div style={{ aspectRatio: "16/9", width: "100%" }}>
          <iframe src={acesso.embedUrl} title={mat.titulo} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      )}
      {acesso.kind === "artigo" && (
        <div style={{ lineHeight: 1.7, fontSize: 15, color: c.ink }} dangerouslySetInnerHTML={{ __html: acesso.html }} />
      )}
      {acesso.kind === "externo" && (
        <div>
          <p style={{ fontSize: 15, color: c.muted, marginBottom: 16 }}>Este conteúdo está disponível na plataforma de vendas.</p>
          <a href={acesso.url} target="_blank" rel="noopener noreferrer" style={dlBtn}>Abrir agora</a>
        </div>
      )}
    </div>
  );
}

const dlBtn: CSSProperties = {
  display: "inline-block", background: c.sageDark, color: "white", fontSize: 12, fontWeight: 500,
  letterSpacing: "0.14em", textTransform: "uppercase", padding: "14px 28px", textDecoration: "none", fontFamily: sans,
};

const inputStyle: CSSProperties = {
  width: "100%", background: "white", border: `1px solid ${c.border}`, padding: "14px 16px",
  fontSize: 14, fontFamily: sans, color: c.ink, outline: "none",
};
