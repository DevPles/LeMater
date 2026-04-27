import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProntuarioConsultaModal } from "@/components/ProntuarioConsultaModal";

type Slot = {
  id: string;
  data_hora: string;
  duracao_min: number;
  modalidade: string;
  status: string;
  professional_id: string;
  gestante_id: string | null;
  reservado_em: string | null;
  observacao: string | null;
  titulo: string | null;
  descricao: string | null;
  tipo_atendimento: string | null;
  recording_path: string | null;
  recording_duration_seg: number | null;
  gravacao_iniciada_em: string | null;
  gravacao_finalizada_em: string | null;
  professionals: { nome: string; especialidade: string } | null;
};

type StatusFiltro = "todos" | "disponivel" | "reservado" | "realizado" | "cancelado";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  disponivel: { label: "Disponível", cls: "bg-emerald-100 text-emerald-700" },
  reservado: { label: "Reservado", cls: "bg-amber-100 text-amber-700" },
  realizado: { label: "Realizado", cls: "bg-sky-100 text-sky-700" },
  cancelado: { label: "Cancelado", cls: "bg-rose-100 text-rose-700" },
};

export function ConsultasTab() {
  const [items, setItems] = useState<Slot[]>([]);
  const [gestantes, setGestantes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [prontuarioId, setProntuarioId] = useState<string | null>(null);

  // filtros
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [profissionalFiltro, setProfissionalFiltro] = useState<string>("todos");
  const [periodoIni, setPeriodoIni] = useState<string>("");
  const [periodoFim, setPeriodoFim] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [apenasGravadas, setApenasGravadas] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointment_slots")
      .select(
        "id, data_hora, duracao_min, modalidade, status, professional_id, gestante_id, reservado_em, observacao, titulo, descricao, tipo_atendimento, recording_path, recording_duration_seg, gravacao_iniciada_em, gravacao_finalizada_em, professionals(nome, especialidade)",
      )
      .order("data_hora", { ascending: false })
      .limit(1000);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as unknown as Slot[];
    setItems(list);

    const ids = Array.from(
      new Set(list.map((x) => x.gestante_id).filter((x): x is string => !!x)),
    );
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", ids);
      const map: Record<string, string> = {};
      (profs as Array<{ user_id: string; nome: string | null }> | null)?.forEach(
        (p) => {
          map[p.user_id] = p.nome ?? "—";
        },
      );
      setGestantes(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const profissionais = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((it) => {
      if (it.professional_id && it.professionals?.nome) {
        m.set(it.professional_id, it.professionals.nome);
      }
    });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const filtered = useMemo(() => {
    const ini = periodoIni ? new Date(periodoIni + "T00:00:00").getTime() : null;
    const fim = periodoFim ? new Date(periodoFim + "T23:59:59").getTime() : null;
    const buscaNorm = busca.trim().toLowerCase();

    return items.filter((it) => {
      if (statusFiltro !== "todos" && it.status !== statusFiltro) return false;
      if (profissionalFiltro !== "todos" && it.professional_id !== profissionalFiltro)
        return false;
      if (apenasGravadas && !it.recording_path) return false;
      const t = new Date(it.data_hora).getTime();
      if (ini && t < ini) return false;
      if (fim && t > fim) return false;
      if (buscaNorm) {
        const gnome = it.gestante_id ? gestantes[it.gestante_id] ?? "" : "";
        const blob = `${it.titulo ?? ""} ${it.tipo_atendimento ?? ""} ${
          it.professionals?.nome ?? ""
        } ${gnome}`.toLowerCase();
        if (!blob.includes(buscaNorm)) return false;
      }
      return true;
    });
  }, [items, statusFiltro, profissionalFiltro, periodoIni, periodoFim, busca, apenasGravadas, gestantes]);

  const counters = useMemo(() => {
    const c = { total: items.length, disponivel: 0, reservado: 0, realizado: 0, cancelado: 0, gravadas: 0 };
    items.forEach((it) => {
      if (it.status in c) (c as unknown as Record<string, number>)[it.status]++;
      if (it.recording_path) c.gravadas++;
    });
    return c;
  }, [items]);

  const gerarLink = async (item: Slot) => {
    if (!item.recording_path) return;
    setGeneratingId(item.id);
    const { data, error } = await supabase.storage
      .from("consultation-recordings")
      .createSignedUrl(item.recording_path, 3600);
    if (data?.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [item.id]: data.signedUrl }));
    } else if (error) {
      alert("Erro ao gerar link: " + error.message);
    }
    setGeneratingId(null);
  };

  const apagar = async (item: Slot) => {
    const dt = new Date(item.data_hora).toLocaleString("pt-BR");
    const confirma = window.confirm(
      `Apagar esta consulta de ${dt}?\n\nEssa ação é permanente e remove o registro do histórico.`,
    );
    if (!confirma) return;
    setDeletingId(item.id);
    const { error } = await supabase
      .from("appointment_slots")
      .delete()
      .eq("id", item.id);
    if (error) {
      alert("Erro ao apagar: " + error.message);
    } else {
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    }
    setDeletingId(null);
  };

  const fmtDur = (seg: number | null) => {
    if (!seg) return "—";
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}m ${s}s`;
  };

  const limparFiltros = () => {
    setStatusFiltro("todos");
    setProfissionalFiltro("todos");
    setPeriodoIni("");
    setPeriodoFim("");
    setBusca("");
    setApenasGravadas(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">Todas as consultas</h1>
          <p className="text-sm text-muted-foreground">
            Histórico completo de atendimentos — disponíveis, reservados, realizados e cancelados.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="bg-[#1a1557] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90"
        >
          Recarregar
        </button>
      </div>

      {/* contadores */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[
          { label: "Total", value: counters.total, cls: "bg-card" },
          { label: "Disponíveis", value: counters.disponivel, cls: "bg-emerald-50" },
          { label: "Reservados", value: counters.reservado, cls: "bg-amber-50" },
          { label: "Realizados", value: counters.realizado, cls: "bg-sky-50" },
          { label: "Cancelados", value: counters.cancelado, cls: "bg-rose-50" },
          { label: "Com gravação", value: counters.gravadas, cls: "bg-violet-50" },
        ].map((k) => (
          <div key={k.label} className={`${k.cls} border border-border rounded-xl px-3 py-2`}>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
              {k.label}
            </p>
            <p className="text-lg font-bold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {/* filtros */}
      <div className="bg-card border border-border rounded-2xl p-3 grid grid-cols-1 md:grid-cols-6 gap-2">
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
          className="border border-border bg-background rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="todos">Todos os status</option>
          <option value="disponivel">Disponível</option>
          <option value="reservado">Reservado</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <select
          value={profissionalFiltro}
          onChange={(e) => setProfissionalFiltro(e.target.value)}
          className="border border-border bg-background rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="todos">Todos os profissionais</option>
          {profissionais.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={periodoIni}
          onChange={(e) => setPeriodoIni(e.target.value)}
          className="border border-border bg-background rounded-lg px-2 py-1.5 text-sm"
          placeholder="De"
        />
        <input
          type="date"
          value={periodoFim}
          onChange={(e) => setPeriodoFim(e.target.value)}
          className="border border-border bg-background rounded-lg px-2 py-1.5 text-sm"
          placeholder="Até"
        />

        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar título, gestante, profissional..."
          className="border border-border bg-background rounded-lg px-2 py-1.5 text-sm md:col-span-1"
        />

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={apenasGravadas}
              onChange={(e) => setApenasGravadas(e.target.checked)}
            />
            Só com gravação
          </label>
          <button
            type="button"
            onClick={limparFiltros}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* tabela */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum atendimento encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Data/hora</th>
                  <th className="text-left px-3 py-2 font-semibold">Atendimento</th>
                  <th className="text-left px-3 py-2 font-semibold">Profissional</th>
                  <th className="text-left px-3 py-2 font-semibold">Gestante</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-left px-3 py-2 font-semibold">Duração</th>
                  <th className="text-right px-3 py-2 font-semibold">Gravação</th>
                  <th className="text-right px-3 py-2 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const dt = new Date(item.data_hora);
                  const url = signedUrls[item.id];
                  const stInfo = STATUS_LABEL[item.status] ?? {
                    label: item.status,
                    cls: "bg-muted text-foreground",
                  };
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-3 py-3 text-foreground whitespace-nowrap">
                        {dt.toLocaleDateString("pt-BR")}
                        <br />
                        <span className="text-muted-foreground text-xs">
                          {dt.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-foreground">
                          {item.titulo ?? "—"}
                        </p>
                        {item.tipo_atendimento && (
                          <p className="text-[10px] uppercase tracking-wide text-primary font-bold">
                            {item.tipo_atendimento}
                          </p>
                        )}
                        {item.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[260px]">
                            {item.descricao}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-foreground">
                          {item.professionals?.nome ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.professionals?.especialidade}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-foreground">
                        {item.gestante_id ? gestantes[item.gestante_id] ?? "—" : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${stInfo.cls}`}
                        >
                          {stInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-foreground whitespace-nowrap">
                        {item.recording_duration_seg
                          ? fmtDur(item.recording_duration_seg)
                          : `${item.duracao_min} min`}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {!item.recording_path ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : !url ? (
                          <button
                            onClick={() => gerarLink(item)}
                            disabled={generatingId === item.id}
                            className="bg-[#1a1557] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90 disabled:opacity-50"
                          >
                            {generatingId === item.id ? "..." : "Gerar link"}
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-90"
                            >
                              Reproduzir
                            </a>
                            <a
                              href={url}
                              download
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                              Baixar
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.gestante_id && (
                            <button
                              type="button"
                              onClick={() => setProntuarioId(item.id)}
                              className="inline-flex items-center justify-center rounded-full bg-[#1a1557] hover:opacity-90 text-white text-xs font-bold px-3 h-8 shadow-sm transition-colors"
                              title="Ver prontuário compilado"
                            >
                              Prontuário
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => apagar(item)}
                            disabled={deletingId === item.id}
                            className="inline-flex items-center justify-center rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 h-8 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {deletingId === item.id ? "Apagando..." : "Apagar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {prontuarioId && (
        <ProntuarioConsultaModal
          appointmentId={prontuarioId}
          onClose={() => setProntuarioId(null)}
        />
      )}
    </div>
  );
}
