import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { sendPushCampaign } from "@/server/push.functions";
import {
  applyFilters,
  aplicarTemplate,
  abrirWhatsApp,
  type AdminProfile,
  type AdminAlert,
} from "@/utils/admin-filters";
import { useAdminFilters, type AdminFilters } from "@/contexts/AdminFiltersContext";

type Props = {
  profiles: AdminProfile[];
  alerts: AdminAlert[];
};

type SubTab = "campanhas" | "grupos" | "historico";

type Group = {
  id: string;
  nome: string;
  descricao: string | null;
  filtros: AdminFilters;
  created_at: string;
};

type Campaign = {
  id: string;
  canal: string;
  titulo: string | null;
  mensagem: string;
  total_destinatarios: number;
  created_at: string;
  group_id: string | null;
};

export function ComunicacaoSection({ profiles, alerts }: Props) {
  const [tab, setTab] = useState<SubTab>("campanhas");
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <p className="text-xs text-emerald-900">
          <strong>Central de comunicação.</strong> Envie push e WhatsApp em massa para grupos
          dinâmicos baseados em filtros e alertas reais. Cada envio é registrado para auditoria.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap border-b border-border">
        {(
          [
            { v: "campanhas", l: "Disparar campanha" },
            { v: "grupos", l: "Grupos dinâmicos" },
            { v: "historico", l: "Histórico" },
          ] as const
        ).map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.v
                ? "border-[#1a1557] text-[#1a1557]"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "campanhas" && <CampanhasView profiles={profiles} alerts={alerts} />}
      {tab === "grupos" && <GruposView profiles={profiles} alerts={alerts} />}
      {tab === "historico" && <HistoricoView />}
    </div>
  );
}

/* ================ CAMPANHAS ================ */
function CampanhasView({ profiles, alerts }: Props) {
  const { filters } = useAdminFilters();
  const filtered = useMemo(() => applyFilters(profiles, alerts, filters), [profiles, alerts, filters]);
  const alertsByGestante = useMemo(() => {
    const m = new Map<string, AdminAlert[]>();
    alerts.forEach((a) => {
      const arr = m.get(a.gestante_id) ?? [];
      arr.push(a);
      m.set(a.gestante_id, arr);
    });
    return m;
  }, [alerts]);

  const [canal, setCanal] = useState<"push" | "whatsapp" | "ambos">("ambos");
  const [titulo, setTitulo] = useState("MãeDigital — lembrete");
  const [msg, setMsg] = useState(
    "Olá {{primeiro_nome}}, este é um lembrete sobre seu acompanhamento na {{ubs}}. Você está com {{semanas}} semanas. Mantenha suas consultas em dia.",
  );
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const preview = filtered[0]
    ? aplicarTemplate(msg, filtered[0], alertsByGestante.get(filtered[0].user_id) ?? [])
    : msg;

  const disparar = async () => {
    if (filtered.length === 0) return;
    setEnviando(true);
    setResultado(null);
    const { data: campaign, error } = await supabase
      .from("notification_campaigns")
      .insert({
        canal,
        titulo,
        mensagem: msg,
        total_destinatarios: filtered.length,
        filtros_snapshot: filters as never,
      })
      .select()
      .single();
    if (error || !campaign) {
      setResultado(`Erro ao registrar campanha: ${error?.message ?? "desconhecido"}`);
      setEnviando(false);
      return;
    }

    const deliveries = filtered.flatMap((p) => {
      const canais: ("push" | "whatsapp")[] =
        canal === "ambos" ? ["push", "whatsapp"] : [canal];
      return canais
        .filter((c) => c !== "whatsapp" || !!p.telefone)
        .map((c) => ({
          campaign_id: campaign.id,
          gestante_id: p.user_id,
          canal: c,
          status: c === "push" ? "enviado" : "pendente",
          enviado_em: c === "push" ? new Date().toISOString() : null,
        }));
    });

    if (deliveries.length > 0) {
      await supabase.from("notification_deliveries").insert(deliveries);
    }

    // WhatsApp: abre uma aba por gestante
    if (canal === "whatsapp" || canal === "ambos") {
      filtered.forEach((p, idx) => {
        if (!p.telefone) return;
        setTimeout(() => {
          const corpo = aplicarTemplate(msg, p, alertsByGestante.get(p.user_id) ?? []);
          abrirWhatsApp(p.telefone!, corpo);
        }, idx * 600);
      });
    }

    setResultado(`Campanha registrada para ${filtered.length} gestantes (${deliveries.length} entregas).`);
    setEnviando(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Configurar envio
        </p>

        <div className="bg-muted/30 rounded-lg p-3 text-xs">
          <strong>{filtered.length} destinatárias</strong> com base nos filtros globais.
          {canal !== "push" && (
            <p className="text-muted-foreground mt-1">
              {filtered.filter((p) => p.telefone).length} têm WhatsApp cadastrado.
            </p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">Canal</label>
          <div className="flex gap-2 mt-1">
            {(["push", "whatsapp", "ambos"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCanal(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  canal === c
                    ? "bg-[#1a1557] text-white"
                    : "bg-background border border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm mt-1"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            Mensagem (variáveis: {`{{primeiro_nome}}, {{semanas}}, {{ubs}}, {{cidade}}, {{exame_pendente}}, {{vacina_pendente}}`})
          </label>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
          />
        </div>

        <button
          type="button"
          onClick={disparar}
          disabled={enviando || filtered.length === 0}
          className="w-full px-4 py-2 rounded-full text-sm font-bold bg-[#f0c040] text-[#1a1557] hover:bg-[#e5b535] disabled:opacity-50"
        >
          {enviando ? "Enviando..." : `Disparar para ${filtered.length} gestante(s)`}
        </button>

        {resultado && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-900">
            {resultado}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Pré-visualização (primeira gestante)
        </p>
        <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
          <p className="font-bold">{titulo}</p>
          <p className="whitespace-pre-wrap">{preview}</p>
        </div>

        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-3">
          Destinatárias (primeiras 10)
        </p>
        <ul className="text-xs divide-y divide-border max-h-64 overflow-y-auto">
          {filtered.slice(0, 10).map((p) => (
            <li key={p.user_id} className="py-1.5">
              <span className="font-semibold">{p.nome ?? p.email}</span>
              <span className="text-muted-foreground"> — {p.cidade ?? "—"}</span>
              {!p.telefone && (
                <span className="ml-2 text-[10px] text-amber-700">sem WhatsApp</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ================ GRUPOS DINÂMICOS ================ */
function GruposView({ profiles, alerts }: Props) {
  const { filters, setFilters, activeCount } = useAdminFilters();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notification_groups")
      .select("*")
      .order("created_at", { ascending: false });
    setGroups((data ?? []) as unknown as Group[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const salvar = async () => {
    if (!nome.trim()) return;
    await supabase.from("notification_groups").insert({
      nome,
      descricao: descricao || null,
      filtros: filters as never,
    });
    setNome("");
    setDescricao("");
    load();
  };

  const aplicarGrupo = (g: Group) => {
    setFilters({ ...filters, ...g.filtros });
  };

  const remover = async (id: string) => {
    await supabase.from("notification_groups").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Salvar recorte atual como grupo
        </p>
        <p className="text-xs text-muted-foreground">
          {activeCount} filtro{activeCount === 1 ? "" : "s"} ativo{activeCount === 1 ? "" : "s"}.
          Ao aplicar um grupo, os destinatários são recalculados em tempo real.
        </p>
        <div className="grid md:grid-cols-2 gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do grupo (ex: 3º trim PA alterada)"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          />
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={!nome.trim()}
          className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#1a1557] text-white disabled:opacity-50"
        >
          Salvar grupo com filtros atuais
        </button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
          Grupos salvos ({groups.length})
        </p>
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum grupo criado ainda.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {groups.map((g) => {
              const matched = applyFilters(profiles, alerts, { ...filters, ...g.filtros });
              return (
                <div key={g.id} className="bg-card border border-border rounded-2xl p-3">
                  <p className="font-bold text-sm">{g.nome}</p>
                  {g.descricao && (
                    <p className="text-xs text-muted-foreground">{g.descricao}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {matched.length} gestante(s) atendem ao grupo agora
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => aplicarGrupo(g)}
                      className="text-[10px] font-semibold text-[#1a1557] hover:underline"
                    >
                      Aplicar filtros
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(g.id)}
                      className="text-[10px] font-semibold text-red-700 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================ HISTÓRICO ================ */
function HistoricoView() {
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("notification_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setList((data ?? []) as Campaign[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-xs text-muted-foreground">Carregando...</p>;
  if (list.length === 0)
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhuma campanha disparada ainda.
      </p>
    );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase">
          <tr>
            <th className="text-left px-3 py-2">Data</th>
            <th className="text-left px-3 py-2">Canal</th>
            <th className="text-left px-3 py-2">Título</th>
            <th className="text-left px-3 py-2">Destinatárias</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-3 py-2 text-xs">
                {new Date(c.created_at).toLocaleString("pt-BR")}
              </td>
              <td className="px-3 py-2 text-xs font-semibold">{c.canal}</td>
              <td className="px-3 py-2 text-xs">{c.titulo ?? "—"}</td>
              <td className="px-3 py-2 text-xs">{c.total_destinatarios}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
