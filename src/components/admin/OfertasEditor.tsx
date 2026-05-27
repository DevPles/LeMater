import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type CSSProperties,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listOffersByProduct,
  saveOffer,
  deleteOffer,
} from "@/lib/orders.functions";

/**
 * Editor de ofertas reutilizável: gerencia preço por país + plataforma de pagamento
 * para curso, aula, material ou serviço. Padrão de uso:
 *   const ref = useRef<OfertasEditorHandle>(null);
 *   <OfertasEditor ref={ref} produtoTipo="curso" produtoId={curso.id} />
 *   // depois do parent salvar e ter o id: await ref.current?.flush(novoId);
 */

export type Pais = "BR" | "ES" | "US";
export type Moeda = "BRL" | "EUR" | "USD";
export type Plataforma =
  | "mercadopago"
  | "hotmart"
  | "kiwify"
  | "eduzz"
  | "stripe";

export type OfertaRow = {
  id?: string;
  pais: Pais;
  plataforma: Plataforma;
  tipo_link: "nativo" | "externo";
  url_externo: string;
  produto_externo_id: string;
  preco_centavos: number;
  moeda: Moeda;
  label: string;
  ordem: number;
  ativo: boolean;
};

export type OfertasEditorHandle = {
  /** Persiste todas as ofertas (criando/atualizando/removendo) para o produto. */
  flush: (produtoId: string) => Promise<void>;
  /** Retorna true se pelo menos uma oferta válida foi configurada. */
  hasAny: () => boolean;
};

const c = {
  cream: "#FAF5EE",
  warm: "#F5EDE0",
  sage: "#5C8A6E",
  sageDark: "#2D5A42",
  ink: "#1C1C1A",
  muted: "#6B6560",
  border: "#E8DDD2",
  danger: "#B23A48",
};
const sans = "'DM Sans', sans-serif";

const inp: CSSProperties = {
  width: "100%",
  background: "white",
  border: `1px solid ${c.border}`,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: sans,
  color: c.ink,
  outline: "none",
};

const PAISES: { value: Pais; label: string; moedaPadrao: Moeda }[] = [
  { value: "BR", label: "Brasil (BRL)", moedaPadrao: "BRL" },
  { value: "ES", label: "Espanha (EUR)", moedaPadrao: "EUR" },
  { value: "US", label: "EUA (USD)", moedaPadrao: "USD" },
];

const PLATAFORMAS_BR: Plataforma[] = ["mercadopago", "hotmart", "kiwify", "eduzz"];
const PLATAFORMAS_INT: Plataforma[] = ["stripe"];

const PLATAFORMA_LABEL: Record<Plataforma, string> = {
  mercadopago: "Mercado Pago",
  hotmart: "Hotmart",
  kiwify: "Kiwify",
  eduzz: "Eduzz",
  stripe: "Stripe",
};

const novaOferta = (pais: Pais = "BR"): OfertaRow => {
  const paisCfg = PAISES.find((p) => p.value === pais)!;
  return {
    pais,
    plataforma: pais === "BR" ? "mercadopago" : "stripe",
    tipo_link: "nativo",
    url_externo: "",
    produto_externo_id: "",
    preco_centavos: 0,
    moeda: paisCfg.moedaPadrao,
    label: "",
    ordem: 0,
    ativo: true,
  };
};

type Props = {
  produtoTipo: "curso" | "aula" | "material" | "servico";
  produtoId: string | null;
  titulo?: string;
};

const OfertasEditor = forwardRef<OfertasEditorHandle, Props>(function OfertasEditor(
  { produtoTipo, produtoId, titulo = "Opções de compra" },
  ref,
) {
  const fnList = useServerFn(listOffersByProduct);
  const fnSave = useServerFn(saveOffer);
  const fnDel = useServerFn(deleteOffer);

  const [ofertas, setOfertas] = useState<OfertaRow[]>([]);
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!produtoId) return;
    (async () => {
      setLoading(true);
      try {
        const { offers } = await fnList({ data: { produto_tipo: produtoTipo, produto_id: produtoId } });
        setOfertas(
          (offers ?? []).map((o: any) => ({
            id: o.id,
            pais: (o.pais ?? "BR") as Pais,
            plataforma: (o.plataforma ?? "mercadopago") as Plataforma,
            tipo_link: (o.tipo_link ?? "nativo") as "nativo" | "externo",
            url_externo: o.url_externo ?? "",
            produto_externo_id: o.produto_externo_id ?? "",
            preco_centavos: o.preco_centavos ?? 0,
            moeda: (o.moeda ?? "BRL") as Moeda,
            label: o.label ?? "",
            ordem: o.ordem ?? 0,
            ativo: o.ativo ?? true,
          })),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [produtoId, produtoTipo, fnList]);

  useImperativeHandle(ref, () => ({
    hasAny: () => ofertas.some((o) => o.ativo && (o.preco_centavos > 0 || o.url_externo)),
    flush: async (id: string) => {
      for (const removedId of removidos) {
        try { await fnDel({ data: { id: removedId } }); } catch {}
      }
      setRemovidos([]);
      for (let i = 0; i < ofertas.length; i++) {
        const o = ofertas[i];
        const valida = o.preco_centavos > 0 || o.url_externo.trim() || o.produto_externo_id.trim();
        if (!valida) continue;
        await fnSave({
          data: {
            id: o.id,
            produto_tipo: produtoTipo,
            produto_id: id,
            pais: o.pais,
            plataforma: o.plataforma,
            tipo_link: o.tipo_link,
            url_externo: o.url_externo.trim() || null,
            produto_externo_id: o.produto_externo_id.trim() || null,
            preco_centavos: Math.max(0, Math.floor(o.preco_centavos)),
            moeda: o.moeda,
            label: o.label.trim() || null,
            ordem: i,
            ativo: o.ativo,
          },
        });
      }
    },
  }), [ofertas, removidos, fnSave, fnDel, produtoTipo]);

  const update = (idx: number, patch: Partial<OfertaRow>) => {
    setOfertas((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], ...patch };
      return arr;
    });
  };

  const remove = (idx: number) => {
    setOfertas((prev) => {
      const arr = [...prev];
      const [removed] = arr.splice(idx, 1);
      if (removed?.id) setRemovidos((r) => [...r, removed.id!]);
      return arr;
    });
  };

  const add = () => setOfertas((prev) => [...prev, novaOferta("BR")]);

  return (
    <div style={{ background: c.warm, border: `1px solid ${c.border}`, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, fontFamily: sans }}>
          {titulo}
        </div>
        {loading && <div style={{ fontSize: 11, color: c.muted }}>carregando…</div>}
      </div>

      {ofertas.length === 0 && (
        <div style={{ fontSize: 12, color: c.muted, marginBottom: 10, fontFamily: sans }}>
          Nenhuma oferta. Adicione uma para liberar venda deste item.
        </div>
      )}

      {ofertas.map((o, i) => {
        const plataformasDisponiveis = o.pais === "BR" ? PLATAFORMAS_BR : PLATAFORMAS_INT;
        return (
          <div
            key={o.id ?? `new-${i}`}
            style={{
              background: "white",
              border: `1px solid ${c.border}`,
              padding: 10,
              marginBottom: 10,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>País</div>
                <select
                  value={o.pais}
                  onChange={(e) => {
                    const novoPais = e.target.value as Pais;
                    const paisCfg = PAISES.find((p) => p.value === novoPais)!;
                    const novaPlat = novoPais === "BR" ? "mercadopago" : "stripe";
                    update(i, { pais: novoPais, moeda: paisCfg.moedaPadrao, plataforma: novaPlat as Plataforma });
                  }}
                  style={inp}
                >
                  {PAISES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Plataforma</div>
                <select
                  value={o.plataforma}
                  onChange={(e) => update(i, { plataforma: e.target.value as Plataforma })}
                  style={inp}
                >
                  {plataformasDisponiveis.map((p) => (
                    <option key={p} value={p}>{PLATAFORMA_LABEL[p]}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Tipo de checkout</div>
                <select
                  value={o.tipo_link}
                  onChange={(e) => update(i, { tipo_link: e.target.value as "nativo" | "externo" })}
                  style={inp}
                >
                  <option value="nativo">Nativo no app</option>
                  <option value="externo">Link externo</option>
                </select>
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Moeda</div>
                <select
                  value={o.moeda}
                  onChange={(e) => update(i, { moeda: e.target.value as Moeda })}
                  style={inp}
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dólar (USD)</option>
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Preço (centavos)</div>
                <input
                  type="number"
                  min={0}
                  value={o.preco_centavos}
                  onChange={(e) => update(i, { preco_centavos: parseInt(e.target.value) || 0 })}
                  style={inp}
                />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>Etiqueta exibida</div>
                <input
                  value={o.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Pix à vista · 12x sem juros"
                  style={inp}
                />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>ID externo (webhook)</div>
                <input
                  value={o.produto_externo_id}
                  onChange={(e) => update(i, { produto_externo_id: e.target.value })}
                  placeholder="ID do produto na plataforma"
                  style={inp}
                />
              </label>
            </div>

            {o.tipo_link === "externo" && (
              <label style={{ display: "block" }}>
                <div style={{ fontSize: 10, color: c.muted, marginBottom: 2 }}>URL do checkout</div>
                <input
                  value={o.url_externo}
                  onChange={(e) => update(i, { url_externo: e.target.value })}
                  placeholder="https://…"
                  style={inp}
                />
              </label>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.ink }}>
                <input
                  type="checkbox"
                  checked={o.ativo}
                  onChange={(e) => update(i, { ativo: e.target.checked })}
                />
                Ativa
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                style={{
                  background: "transparent",
                  border: `1px solid ${c.border}`,
                  color: c.danger,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: sans,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Remover
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        style={{
          background: c.sage,
          color: "white",
          border: "none",
          padding: "8px 14px",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: sans,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        + Adicionar oferta
      </button>
    </div>
  );
});

export default OfertasEditor;
