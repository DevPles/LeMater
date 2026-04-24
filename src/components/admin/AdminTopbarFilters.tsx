import { useEffect, useMemo, useState } from "react";
import { useAdminFilters } from "@/contexts/AdminFiltersContext";
import { DRS_XIII_CIDADES } from "@/lib/drs-xiii";
import type { AdminProfile, AdminAlert } from "@/utils/admin-filters";

type Props = {
  profiles: AdminProfile[];
  alerts: AdminAlert[];
  totalFiltrado: number;
};

export function AdminTopbarFilters({ profiles, alerts, totalFiltrado }: Props) {
  const { filters, patch, reset, activeCount } = useAdminFilters();

  // Perfis restritos pelas cidades selecionadas (se houver) — usado para
  // alimentar Bairro e UBS de forma encadeada (cidade → bairro → UBS).
  const profilesNasCidades = useMemo(() => {
    if (filters.cidades.length === 0) return profiles;
    const set = new Set(filters.cidades);
    return profiles.filter((p) => p.cidade && set.has(p.cidade));
  }, [profiles, filters.cidades]);

  const bairrosDisp = useMemo(
    () =>
      Array.from(
        new Set(profilesNasCidades.map((p) => p.bairro).filter((x): x is string => !!x)),
      ).sort(),
    [profilesNasCidades],
  );

  // UBS depende de cidade E bairro (quando definido)
  const ubsDisp = useMemo(() => {
    const base =
      filters.bairro !== "todos"
        ? profilesNasCidades.filter((p) => p.bairro === filters.bairro)
        : profilesNasCidades;
    return Array.from(
      new Set(base.map((p) => p.unidade_saude).filter((x): x is string => !!x)),
    ).sort();
  }, [profilesNasCidades, filters.bairro]);

  const condicoesDisp = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.titulo))).sort(),
    [alerts],
  );

  // Reset automático de bairro/UBS quando ficam inválidos por mudança de cidade
  useEffect(() => {
    if (filters.bairro !== "todos" && !bairrosDisp.includes(filters.bairro)) {
      patch({ bairro: "todos", ubs: "todas" });
    }
  }, [bairrosDisp, filters.bairro, patch]);

  useEffect(() => {
    if (filters.ubs !== "todas" && !ubsDisp.includes(filters.ubs)) {
      patch({ ubs: "todas" });
    }
  }, [ubsDisp, filters.ubs, patch]);

  const toggleCidade = (c: string) => {
    const set = new Set(filters.cidades);
    if (set.has(c)) set.delete(c);
    else set.add(c);
    patch({ cidades: Array.from(set) });
  };

  return (
    <div className="bg-card border-b border-border px-4 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Filtros globais
          </span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0c040] text-[#1a1557]">
              {activeCount} ativo{activeCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#1a1557] text-white">
            {totalFiltrado} gestante{totalFiltrado === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline"
        >
          Limpar tudo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        {/* 1. Geografia: cidade → bairro → UBS (nessa ordem) */}
        <CidadesPopover
          selecionadas={filters.cidades}
          onToggle={toggleCidade}
          onClear={() => patch({ cidades: [], bairro: "todos", ubs: "todas" })}
        />
        <Sel
          label="Bairro"
          value={filters.bairro}
          onChange={(v) => patch({ bairro: v, ubs: "todas" })}
          options={["todos", ...bairrosDisp]}
          disabled={bairrosDisp.length === 0}
          hint={
            filters.cidades.length === 0
              ? "Mostrando bairros de todas as cidades"
              : `${bairrosDisp.length} bairro(s) na seleção`
          }
        />
        <Sel
          label="UBS"
          value={filters.ubs}
          onChange={(v) => patch({ ubs: v })}
          options={["todas", ...ubsDisp]}
          disabled={ubsDisp.length === 0}
          hint={`${ubsDisp.length} UBS na seleção`}
        />

        {/* 2. Busca livre */}
        <Input
          label="Buscar"
          value={filters.busca}
          onChange={(v) => patch({ busca: v })}
          placeholder="nome, e-mail, cidade"
        />

        {/* 3. Perfil clínico */}
        <Sel
          label="Idade"
          value={filters.faixa}
          onChange={(v) => patch({ faixa: v as typeof filters.faixa })}
          options={["todas", "<18", "18-34", "≥35"]}
        />
        <Sel
          label="Trimestre"
          value={filters.trimestre}
          onChange={(v) => patch({ trimestre: v as typeof filters.trimestre })}
          options={["todos", "1", "2", "3"]}
        />

        {/* 4. Alertas */}
        <Sel
          label="Severidade"
          value={filters.severidade}
          onChange={(v) => patch({ severidade: v as typeof filters.severidade })}
          options={["todas", "atencao", "urgente"]}
        />
        <Sel
          label="Origem alerta"
          value={filters.origemAlerta}
          onChange={(v) => patch({ origemAlerta: v as typeof filters.origemAlerta })}
          options={["todas", "medicao", "exame", "imagem", "vacina"]}
        />
        <Sel
          label="Condição"
          value={filters.condicao}
          onChange={(v) => patch({ condicao: v })}
          options={["todas", ...condicoesDisp.slice(0, 50)]}
        />

        {/* 5. Canais e datas */}
        <Sel
          label="WhatsApp"
          value={filters.temWhatsapp}
          onChange={(v) => patch({ temWhatsapp: v as typeof filters.temWhatsapp })}
          options={["todos", "sim", "nao"]}
        />
        <Input
          label="DUM de"
          type="date"
          value={filters.periodoInicio ?? ""}
          onChange={(v) => patch({ periodoInicio: v || null })}
        />
        <Input
          label="DUM até"
          type="date"
          value={filters.periodoFim ?? ""}
          onChange={(v) => patch({ periodoFim: v || null })}
        />
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full h-8 rounded-lg border border-border bg-background px-2 text-xs"
      />
    </label>
  );
}

function Sel({
  label,
  value,
  onChange,
  options,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-0.5 w-full h-8 rounded-lg border border-border bg-background px-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {hint && (
        <span className="text-[9px] text-muted-foreground/80 mt-0.5 block truncate">{hint}</span>
      )}
    </label>
  );
}

function CidadesPopover({
  selecionadas,
  onToggle,
  onClear,
}: {
  selecionadas: string[];
  onToggle: (c: string) => void;
  onClear: () => void;
}) {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block">
          Cidade (DRS-XIII)
        </span>
        <div className="mt-0.5 h-8 rounded-lg border border-border bg-background px-2 text-xs flex items-center justify-between">
          <span className="truncate">
            {selecionadas.length === 0 ? "Todas" : `${selecionadas.length} selec.`}
          </span>
          <span className="text-muted-foreground">▾</span>
        </div>
      </summary>
      <div className="absolute left-0 mt-1 z-50 w-64 max-h-72 overflow-auto bg-card border border-border rounded-xl shadow-lg p-2">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-semibold text-muted-foreground">
            {selecionadas.length} de {DRS_XIII_CIDADES.length}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-[#1a1557] font-semibold hover:underline"
          >
            Limpar
          </button>
        </div>
        {DRS_XIII_CIDADES.map((c) => (
          <label
            key={c}
            className="flex items-center gap-2 py-1 px-1 hover:bg-muted/40 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selecionadas.includes(c)}
              onChange={() => onToggle(c)}
            />
            <span className="text-xs">{c}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
