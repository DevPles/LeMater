import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "visao"
  | "gestantes-lista"
  | "gestantes-alertas"
  | "gestantes-auditoria"
  | "epi-geral"
  | "epi-drs"
  | "comunicacao-campanhas"
  | "comunicacao-grupos"
  | "comunicacao-templates"
  | "consultas-gravacoes"
  | "config-parametros"
  | "config-profissionais"
  | "config-telas";

type SubItem = {
  key: AdminSection;
  label: string;
  badge?: string;
};

type MenuGroup = {
  id: string;
  label: string;
  items: SubItem[];
};

const MENU: MenuGroup[] = [
  {
    id: "painel",
    label: "Painel",
    items: [{ key: "visao", label: "Visão geral" }],
  },
  {
    id: "gestantes",
    label: "Gestantes",
    items: [
      { key: "gestantes-lista", label: "Lista completa" },
      { key: "gestantes-alertas", label: "Com alertas ativos" },
      { key: "gestantes-auditoria", label: "Auditoria clínica" },
    ],
  },
  {
    id: "epidemiologia",
    label: "Epidemiologia",
    items: [
      { key: "epi-geral", label: "Indicadores gerais" },
      { key: "epi-drs", label: "Relatório DRS-XIII" },
    ],
  },
  {
    id: "comunicacao",
    label: "Comunicação",
    items: [
      { key: "comunicacao-campanhas", label: "Campanhas", badge: "NOVA" },
      { key: "comunicacao-grupos", label: "Grupos dinâmicos" },
      { key: "comunicacao-templates", label: "Templates" },
    ],
  },
  {
    id: "consultas",
    label: "Consultas",
    items: [{ key: "consultas-gravacoes", label: "Gravações", badge: "NOVA" }],
  },
  {
    id: "config",
    label: "Configuração",
    items: [
      { key: "config-parametros", label: "Parâmetros clínicos" },
      { key: "config-profissionais", label: "Profissionais" },
      { key: "config-telas", label: "Conteúdo das telas" },
    ],
  },
];

type Props = {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
  topbar?: ReactNode;
  children: ReactNode;
  onLogout: () => void;
};

const findGroup = (key: AdminSection) =>
  MENU.find((g) => g.items.some((i) => i.key === key))?.id ?? "painel";

const findLabel = (key: AdminSection) =>
  MENU.flatMap((g) => g.items).find((i) => i.key === key)?.label ?? "";

export function AdminLayout({ active, onChange, topbar, children, onLogout }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MENU.forEach((g) => {
      initial[g.id] = g.id === findGroup(active);
    });
    return initial;
  });

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const widthClass = collapsed ? "w-16" : "w-64";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-40 bg-[#1a1557] text-white flex-shrink-0 transition-all duration-200 flex flex-col",
          widthClass,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-3 py-4 border-b border-white/10 flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">Cartão Digital Materno</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wide truncate">
                Painel administrativo
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:flex items-center justify-center bg-white/10 hover:bg-white/20 rounded w-7 h-7 text-xs font-bold flex-shrink-0"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="py-2 overflow-y-auto flex-1">
          {MENU.map((group) => {
            const isOpen = openGroups[group.id] ?? false;
            const groupHasActive = group.items.some((i) => i.key === active);
            return (
              <div key={group.id} className="mb-1">
                {collapsed ? (
                  <p
                    className="px-2 text-[9px] uppercase tracking-wide text-white/40 font-bold mt-3 mb-1 text-center"
                    title={group.label}
                  >
                    {group.label.slice(0, 3)}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-wide font-bold transition-colors",
                      groupHasActive ? "text-[#f0c040]" : "text-white/60 hover:text-white",
                    )}
                  >
                    <span>{group.label}</span>
                    <span className="text-[10px]">{isOpen ? "▾" : "▸"}</span>
                  </button>
                )}

                {(collapsed || isOpen) && (
                  <div className={collapsed ? "" : "pb-1"}>
                    {group.items.map((it) => {
                      const isActive = active === it.key;
                      return (
                        <button
                          key={it.key}
                          type="button"
                          onClick={() => {
                            onChange(it.key);
                            setMobileOpen(false);
                          }}
                          title={collapsed ? it.label : undefined}
                          className={cn(
                            "w-full text-left text-sm transition-colors flex items-center gap-2",
                            collapsed
                              ? "px-2 py-2 justify-center"
                              : "px-6 py-2 border-l-2",
                            isActive
                              ? collapsed
                                ? "bg-white/15 font-bold"
                                : "bg-white/15 border-[#f0c040] font-bold text-white"
                              : collapsed
                                ? "hover:bg-white/5"
                                : "border-transparent hover:bg-white/5 text-white/85",
                          )}
                        >
                          {collapsed ? (
                            <span className="text-xs font-bold">
                              {it.label.charAt(0)}
                            </span>
                          ) : (
                            <>
                              <span className="truncate">{it.label}</span>
                              {it.badge && (
                                <span className="text-[9px] bg-[#f0c040] text-[#1a1557] px-1.5 py-0.5 rounded-full font-bold">
                                  {it.badge}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-2 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "w-full text-xs bg-white/10 hover:bg-white/20 rounded-full py-1.5 font-semibold",
              collapsed && "px-0",
            )}
            title="Sair"
          >
            {collapsed ? "⎋" : "Sair"}
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden bg-[#1a1557] text-white px-4 py-2 flex items-center justify-between sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold"
          >
            Menu
          </button>
          <span className="text-xs font-semibold truncate">{findLabel(active)}</span>
          <span />
        </div>

        {topbar}

        <div className="p-4 md:p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
