import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "visao"
  | "gestantes-lista"
  | "epi-drs"
  | "comunicacao-campanhas"
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
    items: [{ key: "gestantes-lista", label: "Lista completa" }],
  },
  {
    id: "epidemiologia",
    label: "Epidemiologia",
    items: [{ key: "epi-drs", label: "Relatório DRS-XIII" }],
  },
  {
    id: "comunicacao",
    label: "Comunicação",
    items: [{ key: "comunicacao-campanhas", label: "Campanhas", badge: "NOVA" }],
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
  const [openGroup, setOpenGroup] = useState<string>(() => findGroup(active));

  const toggleGroup = (id: string) =>
    setOpenGroup((prev) => (prev === id ? "" : id));

  const widthClass = collapsed ? "w-[68px]" : "w-64";

  const handleSelect = (key: AdminSection) => {
    onChange(key);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-40 flex-shrink-0 transition-all duration-300 flex flex-col text-white",
          "bg-[#1a1557] border-r border-white/5",
          widthClass,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="relative px-4 py-5 border-b border-white/10 flex items-center gap-3 min-h-[72px]">
          <div className="w-9 h-9 rounded-xl bg-[#f0c040] flex items-center justify-center text-[#1a1557] font-extrabold text-xs flex-shrink-0">
            CD
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p
                className="font-bold text-sm truncate tracking-tight leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Cartão Digital
              </p>
              <p className="text-[10px] text-[#f0c040]/90 uppercase tracking-[0.18em] truncate font-semibold mt-1.5">
                Materno · Admin
              </p>
            </div>
          )}
        </div>

        {/* Toggle button — flutuante na borda, sempre visível */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "hidden md:flex items-center justify-center absolute top-7 -right-3 z-50",
            "w-7 h-7 rounded-full bg-[#f0c040] text-[#1a1557] text-sm font-bold",
            "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] ring-2 ring-[#1a1557]",
            "hover:scale-110 transition-transform",
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* Nav */}
        <nav className="py-3 px-2 overflow-y-auto flex-1 space-y-0.5">
          {MENU.map((group) => {
            const isOpen = openGroup === group.id;
            const groupHasActive = group.items.some((i) => i.key === active);
            const isSingle = group.items.length === 1;
            const singleItem = group.items[0];
            const singleActive = isSingle && active === singleItem.key;

            if (isSingle) {
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelect(singleItem.key)}
                  title={collapsed ? group.label : undefined}
                  className={cn(
                    "w-full text-left transition-colors flex items-center gap-3 rounded-lg",
                    collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2",
                    singleActive
                      ? "bg-white/10 text-[#f0c040] font-medium"
                      : "text-white/70 hover:text-white hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center font-semibold rounded-md flex-shrink-0 text-[11px]",
                      collapsed ? "w-8 h-8" : "w-6 h-6",
                      singleActive ? "bg-[#f0c040] text-[#1a1557]" : "bg-white/10 text-white/70",
                    )}
                  >
                    {group.label.charAt(0)}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-sm">{group.label}</span>
                      {singleItem.badge && (
                        <span className="text-[9px] bg-[#f0c040] text-[#1a1557] px-1.5 py-0.5 rounded-full font-bold">
                          {singleItem.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            }

            return (
              <div key={group.id}>
                {collapsed ? (
                  <div className="my-2 mx-2 h-px bg-white/10" />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wider font-semibold rounded-lg transition-colors",
                      groupHasActive ? "text-[#f0c040]" : "text-white/50 hover:text-white",
                    )}
                  >
                    <span>{group.label}</span>
                    <span
                      className={cn(
                        "text-[10px] transition-transform duration-200",
                        isOpen ? "rotate-90" : "",
                      )}
                    >
                      ›
                    </span>
                  </button>
                )}

                {(collapsed || isOpen) && (
                  <div
                    className={cn(
                      collapsed
                        ? "space-y-1"
                        : "pt-0.5 pb-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150",
                    )}
                  >
                    {group.items.map((it) => {
                      const isActive = active === it.key;
                      return (
                        <button
                          key={it.key}
                          type="button"
                          onClick={() => handleSelect(it.key)}
                          title={collapsed ? it.label : undefined}
                          className={cn(
                            "w-full text-left text-sm transition-colors flex items-center gap-2.5 rounded-lg",
                            collapsed ? "px-2 py-2.5 justify-center mx-1" : "px-3 py-2 ml-3",
                            isActive
                              ? "bg-white/10 text-[#f0c040] font-medium"
                              : "text-white/65 hover:text-white hover:bg-white/5",
                          )}
                        >
                          {collapsed ? (
                            <span
                              className={cn(
                                "text-[11px] font-semibold w-7 h-7 rounded-md flex items-center justify-center",
                                isActive ? "bg-[#f0c040] text-[#1a1557]" : "bg-white/10",
                              )}
                            >
                              {it.label.charAt(0)}
                            </span>
                          ) : (
                            <>
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
              "w-full text-xs bg-white/5 hover:bg-[#f0c040] hover:text-[#1a1557] border border-white/10 hover:border-[#f0c040] rounded-lg py-2 font-semibold transition-colors",
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
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden bg-[#1a1557] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="bg-white/10 hover:bg-[#f0c040] hover:text-[#1a1557] px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
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
