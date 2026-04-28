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
  | "consultas-todas"
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
    items: [
      { key: "consultas-todas", label: "Todas as consultas", badge: "NOVA" },
      { key: "consultas-gravacoes", label: "Gravações" },
    ],
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
  // Accordion: apenas um grupo aberto por vez
  const [openGroup, setOpenGroup] = useState<string>(() => findGroup(active));

  const toggleGroup = (id: string) =>
    setOpenGroup((prev) => (prev === id ? "" : id));

  const widthClass = collapsed ? "w-[68px]" : "w-64";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-40 flex-shrink-0 transition-all duration-300 flex flex-col text-white",
          "bg-gradient-to-b from-[#1a1557] via-[#211b6b] to-[#0f0b3d]",
          "shadow-2xl shadow-[#1a1557]/40 border-r border-white/5",
          widthClass,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="min-w-0">
              <p className="font-bold text-sm truncate tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Cartão Digital
              </p>
              <p className="text-[10px] text-[#f0c040]/80 uppercase tracking-[0.15em] truncate font-semibold mt-0.5">
                Materno · Admin
              </p>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f0c040] to-[#d4a020] flex items-center justify-center text-[#1a1557] font-bold text-sm shadow-lg">
                CD
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:flex items-center justify-center bg-white/10 hover:bg-[#f0c040]/20 hover:text-[#f0c040] rounded-lg w-7 h-7 text-xs font-bold flex-shrink-0 transition-colors"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Nav */}
        <nav className="py-3 px-2 overflow-y-auto flex-1 space-y-1 scrollbar-thin">
          {MENU.map((group) => {
            const isOpen = openGroup === group.id;
            const groupHasActive = group.items.some((i) => i.key === active);
            return (
              <div key={group.id}>
                {collapsed ? (
                  <div className="px-1 mb-1">
                    <div
                      className={cn(
                        "h-px mx-2 my-2",
                        groupHasActive ? "bg-[#f0c040]/40" : "bg-white/10",
                      )}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-all",
                      groupHasActive
                        ? "text-[#f0c040] bg-white/5"
                        : "text-white/55 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {groupHasActive && (
                        <span className="w-1 h-1 rounded-full bg-[#f0c040]" />
                      )}
                      {group.label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] transition-transform duration-200",
                        isOpen ? "rotate-90" : "",
                      )}
                    >
                      ▸
                    </span>
                  </button>
                )}

                {(collapsed || isOpen) && (
                  <div
                    className={cn(
                      collapsed ? "space-y-1" : "pt-1 pb-2 pl-2 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200",
                    )}
                  >
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
                            "w-full text-left text-sm transition-all flex items-center gap-2 rounded-lg",
                            collapsed
                              ? "px-2 py-2.5 justify-center mx-1"
                              : "px-3 py-2 ml-1",
                            isActive
                              ? "bg-gradient-to-r from-[#f0c040]/20 to-[#f0c040]/5 text-[#f0c040] font-semibold shadow-inner border border-[#f0c040]/20"
                              : "text-white/75 hover:text-white hover:bg-white/8",
                          )}
                        >
                          {collapsed ? (
                            <span
                              className={cn(
                                "text-xs font-bold w-7 h-7 rounded-md flex items-center justify-center",
                                isActive
                                  ? "bg-[#f0c040] text-[#1a1557]"
                                  : "bg-white/10",
                              )}
                            >
                              {it.label.charAt(0)}
                            </span>
                          ) : (
                            <>
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors",
                                  isActive ? "bg-[#f0c040]" : "bg-white/20",
                                )}
                              />
                              <span className="truncate flex-1">{it.label}</span>
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

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "w-full text-xs bg-white/5 hover:bg-[#f0c040] hover:text-[#1a1557] border border-white/10 hover:border-[#f0c040] rounded-xl py-2 font-semibold transition-all",
              collapsed && "px-0",
            )}
            title="Sair"
          >
            {collapsed ? "⎋" : "Sair da conta"}
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
