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
type ProfRecipient = {
  user_id: string;
  nome: string;
  email: string | null;
  especialidade: string | null;
  telefone: string | null;
};

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

  const [publico, setPublico] = useState<"gestantes" | "profissionais" | "ambos">("gestantes");
  const [canal, setCanal] = useState<"push" | "whatsapp" | "ambos">("ambos");
  const [titulo, setTitulo] = useState("MãeDigital — lembrete");
  const [msg, setMsg] = useState(
    "Olá {{primeiro_nome}}, este é um lembrete sobre seu acompanhamento na {{ubs}}. Você está com {{semanas}} semanas. Mantenha suas consultas em dia.",
  );
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProfIds, setSelectedProfIds] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [pushUserIds, setPushUserIds] = useState<Set<string>>(new Set());
  const [profissionais, setProfissionais] = useState<ProfRecipient[]>([]);
  const sendPushFn = useServerFn(sendPushCampaign);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("push_subscriptions")
      .select("user_id")
      .then(({ data }) => {
        if (cancelled) return;
        setPushUserIds(new Set((data ?? []).map((row) => row.user_id)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Carrega profissionais ativos + dados do profile (telefone/email)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: profs } = await supabase
        .from("professionals")
        .select("user_id, nome, especialidade")
        .eq("ativo", true);
      if (!profs || profs.length === 0) {
        if (!cancelled) setProfissionais([]);
        return;
      }
      const ids = profs.map((p) => p.user_id);
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("user_id, email, telefone")
        .in("user_id", ids);
      const profileMap = new Map(
        (profileRows ?? []).map((r) => [r.user_id, r] as const),
      );
      const merged: ProfRecipient[] = profs.map((p) => ({
        user_id: p.user_id,
        nome: p.nome,
        especialidade: p.especialidade,
        email: profileMap.get(p.user_id)?.email ?? null,
        telefone: profileMap.get(p.user_id)?.telefone ?? null,
      }));
      if (!cancelled) setProfissionais(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sempre que o recorte filtrado muda, restringe a seleção ao novo conjunto
  useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(filtered.map((p) => p.user_id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      return next;
    });
  }, [filtered]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((p) => {
      const nome = (p.nome ?? "").toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      const cidade = (p.cidade ?? "").toLowerCase();
      return nome.includes(q) || email.includes(q) || cidade.includes(q);
    });
  }, [filtered, busca]);

  const destinatarias = useMemo(
    () => filtered.filter((p) => selectedIds.has(p.user_id)),
    [filtered, selectedIds],
  );
  const destinatariosProf = useMemo(
    () => profissionais.filter((p) => selectedProfIds.has(p.user_id)),
    [profissionais, selectedProfIds],
  );
  const incluiGestantes = publico === "gestantes" || publico === "ambos";
  const incluiProfissionais = publico === "profissionais" || publico === "ambos";

  const totalSelecionados =
    (incluiGestantes ? destinatarias.length : 0) +
    (incluiProfissionais ? destinatariosProf.length : 0);

  const selecionadasComPush = useMemo(() => {
    let n = 0;
    if (incluiGestantes) n += destinatarias.filter((p) => pushUserIds.has(p.user_id)).length;
    if (incluiProfissionais)
      n += destinatariosProf.filter((p) => pushUserIds.has(p.user_id)).length;
    return n;
  }, [destinatarias, destinatariosProf, pushUserIds, incluiGestantes, incluiProfissionais]);

  const previewProfile = incluiGestantes
    ? destinatarias[0] ?? filtered[0]
    : null;
  const previewProfText = incluiProfissionais
    ? destinatariosProf[0] ?? profissionais[0]
    : null;
  const preview = previewProfile
    ? aplicarTemplate(msg, previewProfile, alertsByGestante.get(previewProfile.user_id) ?? [])
    : previewProfText
      ? msg
          .replace(/\{\{primeiro_nome\}\}/g, (previewProfText.nome ?? "").split(" ")[0] || "")
          .replace(/\{\{[^}]+\}\}/g, "")
      : msg;
  const previewNome = previewProfile?.nome ?? previewProfile?.email ?? previewProfText?.nome ?? "—";

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleProf = (id: string) => {
    setSelectedProfIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selecionarTodas = () => {
    if (incluiGestantes) setSelectedIds(new Set(filtered.map((p) => p.user_id)));
    if (incluiProfissionais) setSelectedProfIds(new Set(profissionais.map((p) => p.user_id)));
  };
  const limparSelecao = () => {
    setSelectedIds(new Set());
    setSelectedProfIds(new Set());
  };

  const disparar = async () => {
    if (totalSelecionados === 0) return;
    setEnviando(true);
    setResultado(null);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setResultado("Erro: sessão admin expirada. Entre novamente como pericles.13 e tente de novo.");
      setEnviando(false);
      return;
    }
    const { data: campaign, error } = await supabase
      .from("notification_campaigns")
      .insert({
        canal,
        titulo,
        mensagem: msg,
        total_destinatarios: totalSelecionados,
        enviado_por: authData.user.id,
        filtros_snapshot: { ...filters, publico } as never,
      })
      .select()
      .single();
    if (error || !campaign) {
      setResultado(`Erro ao registrar campanha: ${error?.message ?? "desconhecido"}`);
      setEnviando(false);
      return;
    }

    let pushSent = 0;
    let pushFailed = 0;
    let pushNoDevice = 0;

    if (canal === "push" || canal === "ambos") {
      try {
        const groups = new Map<string, string[]>();
        if (incluiGestantes) {
          destinatarias.forEach((p) => {
            const corpo = aplicarTemplate(msg, p, alertsByGestante.get(p.user_id) ?? []);
            const arr = groups.get(corpo) ?? [];
            arr.push(p.user_id);
            groups.set(corpo, arr);
          });
        }
        if (incluiProfissionais) {
          // Profissionais não têm dados gestacionais; envia mensagem "limpa"
          const corpoProf = msg.replace(/\{\{[^}]+\}\}/g, "").replace(/\s+/g, " ").trim();
          destinatariosProf.forEach((p) => {
            const personalizado = corpoProf.replace(/Olá ,?/i, `Olá ${p.nome.split(" ")[0]},`);
            const arr = groups.get(personalizado) ?? [];
            arr.push(p.user_id);
            groups.set(personalizado, arr);
          });
        }

        for (const [corpo, userIds] of groups.entries()) {
          if (userIds.length === 0) continue;
          const r = await sendPushFn({
            data: {
              campaignId: campaign.id,
              title: titulo || "MãeDigital",
              body: corpo,
              url: "/app/home",
              userIds,
            },
          });
          pushSent += r.sent;
          pushFailed += r.failed;
          pushNoDevice += r.noDevice;
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : "erro";
        setResultado(`Erro ao enviar push: ${m}`);
        setEnviando(false);
        return;
      }
    }

    if (canal === "whatsapp" || canal === "ambos") {
      const wppRows: Array<{
        campaign_id: string;
        gestante_id: string;
        canal: string;
        status: string;
        enviado_em: null;
      }> = [];
      if (incluiGestantes) {
        destinatarias
          .filter((p) => !!p.telefone)
          .forEach((p) =>
            wppRows.push({
              campaign_id: campaign.id,
              gestante_id: p.user_id,
              canal: "whatsapp",
              status: "pendente",
              enviado_em: null,
            }),
          );
      }
      if (incluiProfissionais) {
        destinatariosProf
          .filter((p) => !!p.telefone)
          .forEach((p) =>
            wppRows.push({
              campaign_id: campaign.id,
              gestante_id: p.user_id,
              canal: "whatsapp",
              status: "pendente",
              enviado_em: null,
            }),
          );
      }
      if (wppRows.length > 0) {
        await supabase.from("notification_deliveries").insert(wppRows);
      }
      let abrirIdx = 0;
      if (incluiGestantes) {
        destinatarias.forEach((p) => {
          if (!p.telefone) return;
          const i = abrirIdx++;
          setTimeout(() => {
            const corpo = aplicarTemplate(msg, p, alertsByGestante.get(p.user_id) ?? []);
            abrirWhatsApp(p.telefone!, corpo);
          }, i * 600);
        });
      }
      if (incluiProfissionais) {
        destinatariosProf.forEach((p) => {
          if (!p.telefone) return;
          const i = abrirIdx++;
          setTimeout(() => {
            const corpo = msg.replace(/\{\{[^}]+\}\}/g, "").replace(/\s+/g, " ").trim();
            abrirWhatsApp(p.telefone!, corpo);
          }, i * 600);
        });
      }
    }

    const partes: string[] = [];
    if (canal === "push" || canal === "ambos") {
      partes.push(
        `Push: ${pushSent} enviados, ${pushFailed} falharam, ${pushNoDevice} sem dispositivo`,
      );
    }
    if (canal === "whatsapp" || canal === "ambos") {
      let com = 0;
      if (incluiGestantes) com += destinatarias.filter((p) => p.telefone).length;
      if (incluiProfissionais) com += destinatariosProf.filter((p) => p.telefone).length;
      partes.push(`WhatsApp: ${com} aba(s) abertas`);
    }
    setResultado(`Campanha registrada para ${totalSelecionados} destinatário(s). ${partes.join(" · ")}`);
    setEnviando(false);
  };

  const todasSelecionadas =
    (incluiGestantes ? filtered.length > 0 && selectedIds.size === filtered.length : true) &&
    (incluiProfissionais ? profissionais.length > 0 && selectedProfIds.size === profissionais.length : true);
  const horaPreview = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Coluna 1: Configuração */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 lg:col-span-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Configurar envio
        </p>

        <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
          {incluiGestantes && (
            <p>
              <strong>{destinatarias.length} de {filtered.length}</strong> gestantes selecionadas.
            </p>
          )}
          {incluiProfissionais && (
            <p>
              <strong>{destinatariosProf.length} de {profissionais.length}</strong> profissionais selecionados.
            </p>
          )}
          {(canal === "push" || canal === "ambos") && (
            <p className="text-muted-foreground">
              {selecionadasComPush} têm push ativo neste dispositivo.
            </p>
          )}
          {canal !== "push" && (
            <p className="text-muted-foreground">
              {(incluiGestantes ? destinatarias.filter((p) => p.telefone).length : 0) +
                (incluiProfissionais ? destinatariosProf.filter((p) => p.telefone).length : 0)}{" "}
              têm WhatsApp.
            </p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">Público</label>
          <div className="flex gap-2 mt-1 flex-wrap">
            {(
              [
                { v: "gestantes", l: "Gestantes" },
                { v: "profissionais", l: "Profissionais" },
                { v: "ambos", l: "Ambos" },
              ] as const
            ).map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setPublico(p.v)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  publico === p.v
                    ? "bg-[#1a1557] text-white"
                    : "bg-background border border-border text-muted-foreground"
                }`}
              >
                {p.l}
              </button>
            ))}
          </div>
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
            maxLength={120}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm mt-1"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            Mensagem
          </label>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={5}
            maxLength={2000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Variáveis (gestantes): {`{{primeiro_nome}}, {{semanas}}, {{ubs}}, {{cidade}}, {{exame_pendente}}, {{vacina_pendente}}`}.
            Para profissionais, variáveis ficam em branco.
          </p>
        </div>

        <button
          type="button"
          onClick={disparar}
          disabled={enviando || totalSelecionados === 0}
          className="w-full px-4 py-2 rounded-full text-sm font-bold bg-[#f0c040] text-[#1a1557] hover:bg-[#e5b535] disabled:opacity-50"
        >
          {enviando ? "Enviando..." : `Disparar para ${totalSelecionados} destinatário(s)`}
        </button>

        {(canal === "push" || canal === "ambos") && totalSelecionados > 0 && selecionadasComPush === 0 && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            Nenhum dos selecionados ativou push ainda. O disparo será registrado, mas aparecerá como sem dispositivo.
          </p>
        )}

        {resultado && (
          <div className={`rounded-lg p-2 text-xs ${resultado.startsWith("Erro") ? "bg-red-50 border border-red-200 text-red-900" : "bg-emerald-50 border border-emerald-200 text-emerald-900"}`}>
            {resultado}
          </div>
        )}
      </div>

      {/* Coluna 2: Seleção de gestantes */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 lg:col-span-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Selecionar destinatários
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selecionarTodas}
              className="text-[10px] font-bold text-[#1a1557] hover:underline"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={limparSelecao}
              className="text-[10px] font-bold text-muted-foreground hover:underline"
            >
              Nenhum
            </button>
          </div>
        </div>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail, cidade ou especialidade..."
          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm"
        />

        <div className="max-h-[420px] overflow-y-auto -mx-1 space-y-3">
          {incluiGestantes && (
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground px-1 mb-1">
                Gestantes ({visiveis.length}/{filtered.length})
              </p>
              <ul className="divide-y divide-border">
                {visiveis.length === 0 && (
                  <li className="text-xs text-muted-foreground py-2 text-center">
                    Nenhuma gestante encontrada.
                  </li>
                )}
                {visiveis.map((p) => {
                  const checked = selectedIds.has(p.user_id);
                  return (
                    <li key={p.user_id}>
                      <label className="flex items-center gap-2 px-1 py-2 cursor-pointer hover:bg-muted/30 rounded-md">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.user_id)}
                          className="h-4 w-4 accent-[#1a1557]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{p.nome ?? p.email}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.cidade ?? "—"}
                            <span className={pushUserIds.has(p.user_id) ? "text-emerald-700" : "text-amber-700"}>
                              {pushUserIds.has(p.user_id) ? " · push ativo" : " · sem push"}
                            </span>
                            {!p.telefone && <span className="text-amber-700"> · sem WhatsApp</span>}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {incluiProfissionais && (
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground px-1 mb-1">
                Profissionais ({profissionais.length})
              </p>
              <ul className="divide-y divide-border">
                {profissionais.length === 0 && (
                  <li className="text-xs text-muted-foreground py-2 text-center">
                    Nenhum profissional ativo cadastrado.
                  </li>
                )}
                {profissionais
                  .filter((p) => {
                    const q = busca.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      p.nome.toLowerCase().includes(q) ||
                      (p.email ?? "").toLowerCase().includes(q) ||
                      (p.especialidade ?? "").toLowerCase().includes(q)
                    );
                  })
                  .map((p) => {
                    const checked = selectedProfIds.has(p.user_id);
                    return (
                      <li key={p.user_id}>
                        <label className="flex items-center gap-2 px-1 py-2 cursor-pointer hover:bg-muted/30 rounded-md">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProf(p.user_id)}
                            className="h-4 w-4 accent-[#1a1557]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{p.nome}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {p.especialidade ?? "—"}
                              <span className={pushUserIds.has(p.user_id) ? "text-emerald-700" : "text-amber-700"}>
                                {pushUserIds.has(p.user_id) ? " · push ativo" : " · sem push"}
                              </span>
                              {!p.telefone && <span className="text-amber-700"> · sem WhatsApp</span>}
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Coluna 3: Preview da notificação */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 lg:col-span-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Pré-visualização da notificação
        </p>
        <p className="text-[10px] text-muted-foreground">
          Como aparecerá no celular de{" "}
          <strong>{previewNome}</strong>
        </p>

        {/* Mock de celular */}
        <div className="mx-auto w-full max-w-[280px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.2rem] p-3 shadow-xl">
          <div className="bg-slate-100 rounded-[1.6rem] overflow-hidden min-h-[460px] relative">
            {/* Notch */}
            <div className="bg-slate-900 h-5 flex items-center justify-center">
              <div className="bg-slate-700 h-1.5 w-16 rounded-full" />
            </div>
            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 text-[10px] font-bold text-slate-700">
              <span>{horaPreview}</span>
              <span>•••• 5G</span>
            </div>
            {/* Notificação */}
            <div className="px-3 pt-6 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 px-1">
                Agora
              </p>
              <div className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-md border border-white">
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1a1557] flex items-center justify-center text-[#f0c040] text-[10px] font-bold shrink-0">
                    MD
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-slate-800 truncate">
                        MãeDigital
                      </p>
                      <span className="text-[9px] text-slate-500">agora</span>
                    </div>
                    <p className="text-[12px] font-bold text-slate-900 leading-tight mt-0.5">
                      {titulo || "Sem título"}
                    </p>
                    <p className="text-[11px] text-slate-700 leading-snug mt-0.5 whitespace-pre-wrap">
                      {preview}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!previewProfile && !previewProfText && (
          <p className="text-[11px] text-amber-700 text-center">
            Selecione ao menos um destinatário para ver o preview personalizado.
          </p>
        )}
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
