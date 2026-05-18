import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  listMateriaisVitrine,
  getMaterialAccess,
  getMembroStatus,
  type VitrineMaterial,
  type MaterialAccess,
} from "@/lib/materiais.functions";
import lemateLogo from "@/assets/lemater-logo.png";

export const Route = createFileRoute("/_authenticated/membro")({
  head: () => ({
    meta: [{ title: "Minha Área · Le Mater" }],
    links: [{
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap",
    }],
  }),
  component: MembroPage,
});

const c = {
  cream: "#FAF5EE", warm: "#F5EDE0", sage: "#5C8A6E", sageDark: "#2D5A42",
  ink: "#1C1C1A", muted: "#6B6560", border: "#E8DDD2", gold: "#B8923A",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

function tipoLabel(t: VitrineMaterial["tipo"]) {
  return t === "pdf" ? "PDF" : t === "video_externo" || t === "video_upload" ? "Vídeo" : "Artigo";
}

function MembroPage() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  const listFn = useServerFn(listMateriaisVitrine);
  const statusFn = useServerFn(getMembroStatus);
  const accessFn = useServerFn(getMaterialAccess);

  const [items, setItems] = useState<VitrineMaterial[] | null>(null);
  const [status, setStatus] = useState<{ nome: string | null; email: string | null; admin: boolean; pago: boolean } | null>(null);
  const [openMat, setOpenMat] = useState<VitrineMaterial | null>(null);
  const [acesso, setAcesso] = useState<MaterialAccess | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listFn(), statusFn()])
      .then(([m, s]) => {
        setItems(m as VitrineMaterial[]);
        setStatus(s as any);
      })
      .catch((e) => setErr(e?.message ?? "Erro ao carregar"));
  }, [user?.id]);

  const grupos = useMemo(() => {
    if (!items) return null;
    const meus = items.filter((m) => m.pode_consumir);
    const grat = meus.filter((m) => m.area === "gratis");
    const pago = meus.filter((m) => m.area === "pago");
    const oferta = items.filter((m) => !m.pode_consumir && m.vende_externo);
    return { grat, pago, oferta };
  }, [items]);

  if (loading) return <div style={{ fontFamily: sans, padding: 40, background: c.cream, minHeight: "100vh" }}>Carregando…</div>;

  const abrir = async (m: VitrineMaterial) => {
    if (!m.pode_consumir && m.link_compra) {
      window.open(m.link_compra, "_blank", "noopener,noreferrer");
      return;
    }
    setOpenMat(m); setAcesso(null); setErr(null);
    try {
      const r = await accessFn({ data: { material_id: m.id } });
      setAcesso(r);
    } catch (e: any) {
      setErr(e?.message ?? "Erro");
    }
  };

  const nome = status?.nome?.split(" ")[0] ?? "olá";

  return (
    <div style={{ fontFamily: sans, background: c.cream, color: c.ink, minHeight: "100vh" }}>
      <TopBar onSair={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }} admin={!!status?.admin} />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "120px 32px 80px" }}>
        <header style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.sage, marginBottom: 12 }}>
            Minha área {status?.admin ? "· Admin" : status?.pago ? "· Aluna Le Mater" : "· Acesso gratuito"}
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 48, fontWeight: 300, margin: 0 }}>
            Bem-vinda, <em style={{ color: c.sageDark }}>{nome}</em>.
          </h1>
          <p style={{ color: c.muted, marginTop: 12, maxWidth: 620 }}>
            {status?.pago || status?.admin
              ? "Aqui ficam todos os conteúdos liberados para você — gratuitos e exclusivos da assinatura."
              : "Conteúdos gratuitos liberados. Faça upgrade para acessar os cursos completos e materiais exclusivos."}
          </p>
        </header>

        {err && <p style={{ color: "#B23A48" }}>{err}</p>}
        {!grupos ? <p style={{ color: c.muted }}>Carregando materiais…</p> : (
          <>
            {!status?.pago && !status?.admin && (
              <UpgradeCard />
            )}

            <Secao titulo="Conteúdos pagos" subtitulo={status?.pago || status?.admin ? "Disponíveis para você" : "Acesso exclusivo de alunas"} itens={grupos.pago} abrir={abrir} vazio={status?.pago || status?.admin ? "Nenhum curso liberado ainda." : null} />

            <Secao titulo="Conteúdos gratuitos" itens={grupos.grat} abrir={abrir} vazio="Nenhum conteúdo gratuito publicado." />

            {grupos.oferta.length > 0 && (
              <Secao titulo="Disponíveis para compra" subtitulo="Cursos e materiais à venda nas plataformas parceiras" itens={grupos.oferta} abrir={abrir} vazio={null} />
            )}
          </>
        )}
      </main>

      {openMat && (
        <div onClick={() => { setOpenMat(null); setAcesso(null); }} style={{ position: "fixed", inset: 0, background: "rgba(28,28,26,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.cream, maxWidth: 1000, width: "100%", maxHeight: "92vh", overflow: "auto", padding: 32, border: `1px solid ${c.border}`, position: "relative" }}>
            <button onClick={() => { setOpenMat(null); setAcesso(null); }} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: c.muted }}>×</button>
            <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, margin: "0 0 20px" }}>{openMat.titulo}</h2>
            {!acesso ? <p style={{ color: c.muted }}>Carregando…</p>
              : acesso.kind === "artigo" ? <div style={{ lineHeight: 1.7, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: acesso.html }} />
              : acesso.kind === "pdf" ? (<>
                  <a href={acesso.url} target="_blank" rel="noreferrer" download style={{ ...btn(c.sageDark), textDecoration: "none", display: "inline-block", marginBottom: 16 }}>Baixar PDF</a>
                  <iframe src={acesso.url} style={{ width: "100%", height: "75vh", border: "none" }} />
                </>)
              : acesso.kind === "video_externo" ? (
                <div style={{ aspectRatio: "16/9" }}>
                  <iframe src={acesso.embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                </div>)
              : acesso.kind === "video_upload" ? (<>
                  <video src={acesso.url} controls style={{ width: "100%", maxHeight: "75vh", background: "black" }} />
                </>)
              : <a href={acesso.url} target="_blank" rel="noopener noreferrer" style={{ ...btn(c.sageDark), textDecoration: "none", display: "inline-block" }}>Abrir na plataforma</a>}
          </div>
        </div>
      )}
    </div>
  );
}

function UpgradeCard() {
  return (
    <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 32, marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: c.gold, marginBottom: 8 }}>Upgrade</div>
        <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 400, margin: 0 }}>Desbloqueie todos os cursos Le Mater</h2>
        <p style={{ color: c.muted, margin: "8px 0 0", maxWidth: 520 }}>
          Acesso completo a cursos, e-books e acompanhamento. Compre nas plataformas parceiras e seu acesso é liberado automaticamente.
        </p>
      </div>
      <Link to="/conteudos-gratis" style={{ ...btn(c.sageDark), textDecoration: "none" }}>Ver vitrine</Link>
    </div>
  );
}

function Secao({ titulo, subtitulo, itens, abrir, vazio }: {
  titulo: string; subtitulo?: string; itens: VitrineMaterial[];
  abrir: (m: VitrineMaterial) => void; vazio: string | null;
}) {
  if (itens.length === 0 && !vazio) return null;
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, margin: 0 }}>{titulo}</h2>
        {subtitulo && <p style={{ color: c.muted, margin: "4px 0 0", fontSize: 14 }}>{subtitulo}</p>}
      </div>
      {itens.length === 0 ? (
        <p style={{ color: c.muted, fontStyle: "italic" }}>{vazio}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {itens.map((m) => (
            <article key={m.id} style={{ background: "white", border: `1px solid ${c.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {m.capa_url && <img src={m.capa_url} alt="" style={{ width: "100%", height: 150, objectFit: "cover" }} />}
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: c.muted }}>
                  {m.categoria} · {tipoLabel(m.tipo)}
                  {m.area === "pago" && m.pode_consumir && <> · <span style={{ color: c.gold }}>SEU</span></>}
                  {!m.pode_consumir && m.vende_externo && <> · <span style={{ color: c.gold }}>{m.plataforma_venda ?? "À VENDA"}</span></>}
                </span>
                <h3 style={{ fontFamily: serif, fontSize: 20, fontWeight: 400, margin: 0, lineHeight: 1.25 }}>{m.titulo}</h3>
                {m.descricao && <p style={{ fontSize: 13, color: c.muted, margin: 0, lineHeight: 1.5 }}>{m.descricao}</p>}
                {m.preco_label && !m.pode_consumir && <span style={{ fontSize: 13, color: c.sageDark, fontWeight: 500 }}>{m.preco_label}</span>}
                <button onClick={() => abrir(m)} style={{ ...btn(m.pode_consumir ? c.sageDark : c.gold), marginTop: "auto", alignSelf: "flex-start" }}>
                  {m.pode_consumir ? "Abrir" : (m.cta_label ?? "Comprar")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TopBar({ onSair, admin }: { onSair: () => void; admin: boolean }) {
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,245,238,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${c.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link to="/"><img src={lemateLogo} alt="Le Mater" style={{ height: 44 }} /></Link>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link to="/membro" style={navLink}>Minha área</Link>
        <Link to="/atlas" style={navLink}>Atlas</Link>
        <Link to="/conteudos-gratis" style={navLink}>Catálogo</Link>
        {admin && <Link to="/admin" style={navLink}>Admin</Link>}
        <button onClick={onSair} style={{ ...btn(c.sage), padding: "10px 20px" }}>Sair</button>
      </div>
    </nav>
  );
}

const navLink: CSSProperties = { fontFamily: sans, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, textDecoration: "none" };

function btn(bg: string): CSSProperties {
  return { background: bg, color: "white", fontSize: 12, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 24px", border: "none", cursor: "pointer", fontFamily: sans };
}
