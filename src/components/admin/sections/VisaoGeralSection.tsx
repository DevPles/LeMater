import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  applyFilters,
  calcAge,
  calcWeeks,
  faixaEtariaOf,
  trimestreOf,
  type AdminProfile,
  type AdminAlert,
} from "@/utils/admin-filters";
import { useAdminFilters } from "@/contexts/AdminFiltersContext";

type Props = {
  profiles: AdminProfile[];
  alerts: AdminAlert[];
  loading: boolean;
  onGoTo: (s: "gestantes" | "comunicacao" | "epidemiologia") => void;
};

const COLORS = ["#1a1557", "#f0c040", "#ff6b9d", "#4ecdc4", "#a78bfa"];

export function VisaoGeralSection({ profiles, alerts, loading, onGoTo }: Props) {
  const { filters } = useAdminFilters();

  const filtered = useMemo(() => applyFilters(profiles, alerts, filters), [profiles, alerts, filters]);
  const filteredIds = useMemo(() => new Set(filtered.map((p) => p.user_id)), [filtered]);
  const alertsFiltered = useMemo(
    () => alerts.filter((a) => filteredIds.has(a.gestante_id)),
    [alerts, filteredIds],
  );

  const total = filtered.length;
  const altoRisco = useMemo(() => {
    const set = new Set(alertsFiltered.filter((a) => a.severidade === "urgente").map((a) => a.gestante_id));
    return set.size;
  }, [alertsFiltered]);
  const alertasAtivos = alertsFiltered.length;
  const cobertura = useMemo(() => {
    const total = filtered.length;
    if (total === 0) return 0;
    const semVacAtraso = filtered.filter(
      (p) => !alertsFiltered.some((a) => a.origem === "vacina" && a.gestante_id === p.user_id),
    ).length;
    return Math.round((semVacAtraso / total) * 100);
  }, [filtered, alertsFiltered]);

  const porTipoAlerta = useMemo(() => {
    const map: Record<string, number> = { medicao: 0, exame: 0, imagem: 0, vacina: 0 };
    alertsFiltered.forEach((a) => {
      map[a.origem] = (map[a.origem] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [alertsFiltered]);

  const porTrimestre = useMemo(() => {
    const map = { "1º": 0, "2º": 0, "3º": 0, "—": 0 };
    filtered.forEach((p) => {
      const t = trimestreOf(calcWeeks(p.dum));
      const k = t === "1" ? "1º" : t === "2" ? "2º" : t === "3" ? "3º" : "—";
      map[k]++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const porFaixa = useMemo(() => {
    const map = { "<18": 0, "18-34": 0, "≥35": 0, "—": 0 };
    filtered.forEach((p) => {
      const f = faixaEtariaOf(calcAge(p.data_nascimento));
      map[f]++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const topCondicoes = useMemo(() => {
    const map: Record<string, number> = {};
    alertsFiltered.forEach((a) => {
      map[a.titulo] = (map[a.titulo] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qtd]) => ({ name, qtd }));
  }, [alertsFiltered]);

  if (loading) {
    return <p className="text-sm text-center text-muted-foreground py-8">Carregando dashboard...</p>;
  }

  if (profiles.length === 0) {
    return (
      <EmptyState
        title="Nenhuma gestante cadastrada ainda"
        message="Os indicadores aparecerão aqui assim que as primeiras gestantes se cadastrarem no app."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Gestantes no recorte" value={total} />
        <Kpi label="Em alto risco" value={altoRisco} tone="danger" />
        <Kpi label="Alertas ativos" value={alertasAtivos} tone="warn" />
        <Kpi label="Cobertura PNI" value={`${cobertura}%`} tone="ok" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Alertas por origem">
          {alertsFiltered.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={porTipoAlerta} dataKey="value" outerRadius={70} label>
                  {porTipoAlerta.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Distribuição por trimestre">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={porTrimestre} dataKey="value" outerRadius={70} label>
                {porTrimestre.map((_, i) => (
                  <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Faixa etária">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porFaixa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1a1557" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top 5 condições com alerta">
          {topCondicoes.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCondicoes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                <Tooltip />
                <Bar dataKey="qtd" fill="#ff6b9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
          Atalhos rápidos para este recorte
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onGoTo("gestantes")}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#1a1557] text-white hover:bg-[#241e7a]"
          >
            Ver lista de gestantes ({total})
          </button>
          <button
            type="button"
            onClick={() => onGoTo("comunicacao")}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#f0c040] text-[#1a1557] hover:bg-[#e5b535]"
          >
            Disparar campanha
          </button>
          <button
            type="button"
            onClick={() => onGoTo("epidemiologia")}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-card border border-border hover:border-[#1a1557]/50"
          >
            Análise epidemiológica
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "danger" | "warn" | "ok" }) {
  const colors =
    tone === "danger"
      ? "text-red-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "ok"
          ? "text-emerald-700"
          : "text-[#1a1557]";
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors}`}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{title}</p>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground py-12 text-center">Sem dados para o recorte atual.</p>;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-12 text-center">
      <p className="text-base font-bold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
