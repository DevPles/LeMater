import { createContext, useContext, useState, type ReactNode } from "react";

export type AdminFilters = {
  cidades: string[];           // multi
  bairro: string;              // "todos" ou nome
  ubs: string;                 // "todas" ou nome
  faixa: "todas" | "<18" | "18-34" | "≥35";
  trimestre: "todos" | "1" | "2" | "3";
  condicao: string;            // "todas" ou parametro com alerta (ex: "Pressão arterial")
  origemAlerta: "todas" | "medicao" | "exame" | "imagem" | "vacina";
  severidade: "todas" | "atencao" | "urgente";
  temWhatsapp: "todos" | "sim" | "nao";
  periodoInicio: string | null; // ISO date (filtra por DUM)
  periodoFim: string | null;
  busca: string;               // busca por nome/email
};

export const DEFAULT_FILTERS: AdminFilters = {
  cidades: [],
  bairro: "todos",
  ubs: "todas",
  faixa: "todas",
  trimestre: "todos",
  condicao: "todas",
  origemAlerta: "todas",
  severidade: "todas",
  temWhatsapp: "todos",
  periodoInicio: null,
  periodoFim: null,
  busca: "",
};

type Ctx = {
  filters: AdminFilters;
  setFilters: (f: AdminFilters) => void;
  patch: (p: Partial<AdminFilters>) => void;
  reset: () => void;
  activeCount: number;
};

const AdminFiltersContext = createContext<Ctx | null>(null);

export function AdminFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<AdminFilters>(DEFAULT_FILTERS);

  const patch = (p: Partial<AdminFilters>) => setFilters((prev) => ({ ...prev, ...p }));
  const reset = () => setFilters(DEFAULT_FILTERS);

  const activeCount =
    (filters.cidades.length > 0 ? 1 : 0) +
    (filters.bairro !== "todos" ? 1 : 0) +
    (filters.ubs !== "todas" ? 1 : 0) +
    (filters.faixa !== "todas" ? 1 : 0) +
    (filters.trimestre !== "todos" ? 1 : 0) +
    (filters.condicao !== "todas" ? 1 : 0) +
    (filters.origemAlerta !== "todas" ? 1 : 0) +
    (filters.severidade !== "todas" ? 1 : 0) +
    (filters.temWhatsapp !== "todos" ? 1 : 0) +
    (filters.periodoInicio ? 1 : 0) +
    (filters.periodoFim ? 1 : 0) +
    (filters.busca.trim() ? 1 : 0);

  return (
    <AdminFiltersContext.Provider value={{ filters, setFilters, patch, reset, activeCount }}>
      {children}
    </AdminFiltersContext.Provider>
  );
}

export function useAdminFilters() {
  const ctx = useContext(AdminFiltersContext);
  if (!ctx) throw new Error("useAdminFilters precisa estar dentro de <AdminFiltersProvider>");
  return ctx;
}
