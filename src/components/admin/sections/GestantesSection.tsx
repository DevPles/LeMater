import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import {
  applyFilters,
  calcAge,
  calcWeeks,
  maxSeveridade,
  abrirWhatsApp,
  type AdminProfile,
  type AdminAlert,
} from "@/utils/admin-filters";
import { useAdminFilters } from "@/contexts/AdminFiltersContext";

type Props = {
  profiles: AdminProfile[];
  alerts: AdminAlert[];
  loading: boolean;
  onAbrirComunicacao: () => void;
  onReload?: () => void | Promise<void>;
};

export function GestantesSection({ profiles, alerts, loading, onAbrirComunicacao, onReload }: Props) {
  const { filters } = useAdminFilters();
  const filtered = useMemo(() => applyFilters(profiles, alerts, filters), [profiles, alerts, filters]);
  const [drawer, setDrawer] = useState<string | null>(null);

  const alertsByGestante = useMemo(() => {
    const m = new Map<string, AdminAlert[]>();
    alerts.forEach((a) => {
      const arr = m.get(a.gestante_id) ?? [];
      arr.push(a);
      m.set(a.gestante_id, arr);
    });
    return m;
  }, [alerts]);

  const exportar = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map((p) => {
      const myAlerts = alertsByGestante.get(p.user_id) ?? [];
      return {
        Nome: p.nome ?? "",
        Email: p.email ?? "",
        Telefone: p.telefone ?? "",
        Idade: calcAge(p.data_nascimento) ?? "",
        Semanas: calcWeeks(p.dum) ?? "",
        Cidade: p.cidade ?? "",
        Bairro: p.bairro ?? "",
        UBS: p.unidade_saude ?? "",
        Gestações: p.numero_gestacoes ?? "",
        Partos: p.numero_partos ?? "",
        Abortos: p.numero_abortos ?? "",
        "Alertas ativos": myAlerts.length,
        "Severidade máx": maxSeveridade(myAlerts) ?? "—",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gestantes");
    XLSX.writeFile(wb, `gestantes-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return <p className="text-sm text-center text-muted-foreground py-8">Carregando gestantes...</p>;
  }

  if (profiles.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center">
        <p className="text-base font-bold mb-1">Nenhuma gestante cadastrada ainda</p>
        <p className="text-sm text-muted-foreground">
          Quando uma gestante se cadastrar no app, ela aparecerá aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length} gestante{filtered.length === 1 ? "" : "s"} no recorte • dados em tempo real do banco
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAbrirComunicacao}
            disabled={filtered.length === 0}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#f0c040] text-[#1a1557] hover:bg-[#e5b535] disabled:opacity-50"
          >
            Disparar para este recorte
          </button>
          <button
            type="button"
            onClick={exportar}
            disabled={filtered.length === 0}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a] disabled:opacity-50"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1557] text-white text-[11px] uppercase tracking-wide">
              <tr>
                <Th>Nome</Th>
                <Th>Idade</Th>
                <Th>Semanas</Th>
                <Th>Cidade / Bairro</Th>
                <Th>UBS</Th>
                <Th>G/P/A</Th>
                <Th>Alertas</Th>
                <Th>Risco</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                    Nenhuma gestante encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => {
                  const myAlerts = alertsByGestante.get(p.user_id) ?? [];
                  const sev = maxSeveridade(myAlerts);
                  const idade = calcAge(p.data_nascimento);
                  const weeks = calcWeeks(p.dum);
                  return (
                    <tr key={p.user_id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDrawer(p.user_id)}
                          className="text-left hover:underline text-[#1a1557]"
                        >
                          {p.nome ?? p.email ?? p.user_id.slice(0, 8)}
                        </button>
                        {p.email && <div className="text-[10px] text-muted-foreground">{p.email}</div>}
                      </td>
                      <td className="px-3 py-2">
                        {idade ?? "—"}
                        {idade !== null && idade < 18 && (
                          <span className="ml-1 text-[9px] font-bold text-red-700">MENOR</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{weeks ?? "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <div>{p.cidade ?? "—"}</div>
                        <div className="text-muted-foreground">{p.bairro ?? ""}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">{p.unidade_saude ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {(p.numero_gestacoes ?? 0)}/{(p.numero_partos ?? 0)}/{(p.numero_abortos ?? 0)}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {myAlerts.length === 0 ? (
                          <span className="text-emerald-700">Nenhum</span>
                        ) : (
                          <span className="font-bold text-foreground">{myAlerts.length}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <RiscoBadge sev={sev} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setDrawer(p.user_id)}
                            className="text-[10px] font-semibold text-[#1a1557] hover:underline"
                          >
                            Ver
                          </button>
                          {p.telefone && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirWhatsApp(
                                  p.telefone!,
                                  `Olá ${(p.nome ?? "").split(" ")[0]}, lembrete do MãeDigital sobre seu acompanhamento.`,
                                )
                              }
                              className="text-[10px] font-semibold text-emerald-700 hover:underline ml-1"
                            >
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawer && (
        <Drawer
          gestante={profiles.find((p) => p.user_id === drawer)!}
          alerts={alertsByGestante.get(drawer) ?? []}
          onClose={() => setDrawer(null)}
          onReload={onReload}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2 font-semibold">{children}</th>;
}

function RiscoBadge({ sev }: { sev: "urgente" | "atencao" | null }) {
  if (sev === "urgente")
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border bg-red-100 text-red-700 border-red-300">
        Urgente
      </span>
    );
  if (sev === "atencao")
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border bg-amber-100 text-amber-700 border-amber-300">
        Atenção
      </span>
    );
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border bg-emerald-100 text-emerald-700 border-emerald-300">
      OK
    </span>
  );
}

function Drawer({
  gestante,
  alerts: alertsInicial,
  onClose,
  onReload,
}: {
  gestante: AdminProfile;
  alerts: AdminAlert[];
  onClose: () => void;
  onReload?: () => void | Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [alertasLocal, setAlertasLocal] = useState<AdminAlert[]>(alertasInicialOuVazio(alertsInicial));
  const [carregandoAlertas, setCarregandoAlertas] = useState(false);

  // Form state
  const [nome, setNome] = useState(gestante.nome ?? "");
  const [email, setEmail] = useState(gestante.email ?? "");
  const [telefone, setTelefone] = useState(gestante.telefone ?? "");
  const [dataNasc, setDataNasc] = useState(gestante.data_nascimento ?? "");
  const [dum, setDum] = useState(gestante.dum ?? "");
  const [cidade, setCidade] = useState(gestante.cidade ?? "");
  const [bairro, setBairro] = useState(gestante.bairro ?? "");
  const [ubs, setUbs] = useState(gestante.unidade_saude ?? "");

  // Se a lista global de alertas chegou vazia (ex.: backdoor sem auth), busca sob demanda
  useEffect(() => {
    let ativo = true;
    if (alertsInicial && alertsInicial.length > 0) {
      setAlertasLocal(alertsInicial);
      return;
    }
    setCarregandoAlertas(true);
    supabase
      .rpc("get_active_alerts", { _gestante_id: gestante.user_id })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (!error && Array.isArray(data)) {
          setAlertasLocal(
            data.map((a: { id: string; origem: string; severidade: string; titulo: string; mensagem: string; data: string }) => ({
              ...a,
              gestante_id: gestante.user_id,
            })) as AdminAlert[],
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregandoAlertas(false);
      });
    return () => {
      ativo = false;
    };
  }, [gestante.user_id, alertsInicial]);

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    setErro(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: nome.trim() || null,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        data_nascimento: dataNasc || null,
        dum: dum || null,
        cidade: cidade.trim() || null,
        bairro: bairro.trim() || null,
        unidade_saude: ubs.trim() || null,
      })
      .eq("user_id", gestante.user_id);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setMsg("Dados atualizados");
    setEditando(false);
    if (onReload) await onReload();
    setTimeout(() => setMsg(null), 2500);
  };

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="flex-1 bg-black/40"
      />
      <aside className="w-full max-w-md bg-card border-l border-border overflow-y-auto p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">
              Gestante
            </p>
            <h3 className="text-lg font-bold truncate">{nome || email || "—"}</h3>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/70"
            >
              Fechar
            </button>
            {!editando ? (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-[#1a1557] text-white hover:opacity-90"
              >
                Editar dados
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditando(false);
                  setNome(gestante.nome ?? "");
                  setEmail(gestante.email ?? "");
                  setTelefone(gestante.telefone ?? "");
                  setDataNasc(gestante.data_nascimento ?? "");
                  setDum(gestante.dum ?? "");
                  setCidade(gestante.cidade ?? "");
                  setBairro(gestante.bairro ?? "");
                  setUbs(gestante.unidade_saude ?? "");
                  setErro(null);
                }}
                className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-muted hover:bg-muted/70"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {msg && (
          <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {msg}
          </p>
        )}
        {erro && (
          <p className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Erro ao salvar: {erro}
          </p>
        )}

        {!editando ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Info label="Idade" value={calcAge(gestante.data_nascimento)?.toString() ?? "—"} />
            <Info label="Semanas" value={calcWeeks(gestante.dum)?.toString() ?? "—"} />
            <Info label="Cidade" value={gestante.cidade ?? "—"} />
            <Info label="Bairro" value={gestante.bairro ?? "—"} />
            <Info label="UBS" value={gestante.unidade_saude ?? "—"} />
            <Info label="Telefone" value={gestante.telefone ?? "—"} />
            <Info label="Gestações" value={String(gestante.numero_gestacoes ?? 0)} />
            <Info label="Partos" value={String(gestante.numero_partos ?? 0)} />
            <Info label="Abortos" value={String(gestante.numero_abortos ?? 0)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Field label="Nome completo" full>
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} />
            </Field>
            <Field label="E-mail" full>
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Telefone (WhatsApp)">
              <input className={inputCls} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(16) 9..." />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" className={inputCls} value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
            </Field>
            <Field label="DUM (última menstruação)">
              <input type="date" className={inputCls} value={dum} onChange={(e) => setDum(e.target.value)} />
            </Field>
            <Field label="Cidade">
              <input className={inputCls} value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </Field>
            <Field label="Bairro">
              <input className={inputCls} value={bairro} onChange={(e) => setBairro(e.target.value)} />
            </Field>
            <Field label="UBS / Unidade de saúde" full>
              <input className={inputCls} value={ubs} onChange={(e) => setUbs(e.target.value)} />
            </Field>
            <div className="col-span-2 flex justify-end pt-1">
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 rounded-full bg-[#f0c040] text-[#1a1557] text-xs font-bold hover:bg-[#e5b535] disabled:opacity-50"
              >
                {salvando ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
            Alertas ativos ({alertasLocal.length})
            {carregandoAlertas && <span className="ml-2 font-normal normal-case text-[10px]">carregando…</span>}
          </p>
          {alertasLocal.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {carregandoAlertas ? "Buscando alertas…" : "Nenhum alerta no momento."}
            </p>
          ) : (
            <ul className="space-y-2">
              {alertasLocal.map((a) => (
                <li key={a.id} className="border border-border rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.severidade === "urgente"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {a.severidade}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                      {a.origem}
                    </span>
                  </div>
                  <p className="text-xs font-bold">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">{a.mensagem}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function alertasInicialOuVazio(a: AdminAlert[] | undefined): AdminAlert[] {
  return Array.isArray(a) ? a : [];
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-lg p-2">
      <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-[10px] uppercase text-muted-foreground font-semibold block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
