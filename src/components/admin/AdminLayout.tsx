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

  const widthClass = collapsed ? "w-[72px]" : "w-72";

  const handleSelect = (key: AdminSection) => {
    onChange(key);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f4ee] via-white to-[#efeae0] flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-40 flex-shrink-0 transition-all duration-300 flex flex-col text-white",
          "bg-gradient-to-b from-[#1a1557] via-[#1d1762] to-[#0c0830]",
          "shadow-[0_25px_60px_-15px_rgba(26,21,87,0.6)] border-r border-white/5",
          "md:m-3 md:h-[calc(100vh-1.5rem)] md:rounded-3xl md:overflow-hidden",
          "before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_top_right,rgba(240,192,64,0.18),transparent_55%)]",
          widthClass,
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-56 h-56 rounded-full bg-[#f0c040]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-16 w-56 h-56 rounded-full bg-[#3b2fbd]/30 blur-3xl" />

        {/* Header */}
        <div className="relative px-4 py-5 border-b border-white/10 flex items-center justify-between gap-2 backdrop-blur-sm">
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f0c040] to-[#c89020] flex items-center justify-center text-[#1a1557] font-extrabold text-sm shadow-[0_8px_20px_-6px_rgba(240,192,64,0.7)] ring-1 ring-white/20">
                CD
              </div>
              <div className="min-w-0">
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
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f0c040] to-[#c89020] flex items-center justify-center text-[#1a1557] font-extrabold text-sm shadow-[0_8px_20px_-6px_rgba(240,192,64,0.7)] ring-1 ring-white/20">
                CD
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:flex items-center justify-center bg-white/10 hover:bg-[#f0c040] hover:text-[#1a1557] rounded-xl w-8 h-8 text-xs font-bold flex-shrink-0 transition-all shadow-md hover:shadow-[0_6px_14px_-4px_rgba(240,192,64,0.6)] ring-1 ring-white/10"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* Nav */}
        <nav className="relative py-4 px-2.5 overflow-y-auto flex-1 space-y-1.5 scrollbar-thin">
          {MENU.map((group) => {
            const isOpen = openGroup === group.id;
            const groupHasActive = group.items.some((i) => i.key === active);
            const isSingle = group.items.length === 1;
            const singleItem = group.items[0];
            const singleActive = isSingle && active === singleItem.key;

            // Single-item groups render as a direct link
            if (isSingle) {
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelect(singleItem.key)}
                  title={collapsed ? group.label : undefined}
                  className={cn(
                    "w-full text-left transition-all flex items-center gap-3 rounded-xl group relative",
                    collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5",
                    singleActive
                      ? "bg-gradient-to-r from-[#f0c040]/25 via-[#f0c040]/10 to-transparent text-[#f0c040] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_14px_-6px_rgba(240,192,64,0.5)] ring-1 ring-[#f0c040]/30"
                      : "text-white/80 hover:text-white hover:bg-white/8 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                  )}
                >
                  {singleActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-[#f0c040] shadow-[0_0_10px_rgba(240,192,64,0.7)]" />
                  )}
                  <span
                    className={cn(
                      "flex items-center justify-center font-bold rounded-lg flex-shrink-0 transition-all",
                      collapsed ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px]",
                      singleActive
                        ? "bg-gradient-to-br from-[#f0c040] to-[#c89020] text-[#1a1557] shadow-[0_4px_10px_-2px_rgba(240,192,64,0.6)]"
                        : "bg-white/10 text-white/70 group-hover:bg-white/15",
                    )}
                  >
                    {group.label.charAt(0)}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-sm">{group.label}</span>
                      {singleItem.badge && (
                        <span className="text-[9px] bg-[#f0c040] text-[#1a1557] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
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
                  <div className="px-1 my-2">
                    <div
                      className={cn(
                        "h-px mx-2",
                        groupHasActive ? "bg-[#f0c040]/50" : "bg-white/10",
                      )}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all",
                      groupHasActive
                        ? "text-[#f0c040] bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "text-white/55 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          groupHasActive
                            ? "bg-[#f0c040] shadow-[0_0_8px_rgba(240,192,64,0.7)]"
                            : "bg-white/25",
                        )}
                      />
                      {group.label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] transition-transform duration-300",
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
                      collapsed
                        ? "space-y-1"
                        : "pt-1.5 pb-2 pl-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200",
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
                            "w-full text-left text-sm transition-all flex items-center gap-2.5 rounded-xl relative",
                            collapsed
                              ? "px-2 py-2.5 justify-center mx-1"
                              : "px-3 py-2 ml-1",
                            isActive
                              ? "bg-gradient-to-r from-[#f0c040]/20 via-[#f0c040]/5 to-transparent text-[#f0c040] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_4px_12px_-6px_rgba(240,192,64,0.4)] ring-1 ring-[#f0c040]/25"
                              : "text-white/75 hover:text-white hover:bg-white/8",
                          )}
                        >
                          {isActive && !collapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-[#f0c040] shadow-[0_0_8px_rgba(240,192,64,0.6)]" />
                          )}
                          {collapsed ? (
                            <span
                              className={cn(
                                "text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center",
                                isActive
                                  ? "bg-gradient-to-br from-[#f0c040] to-[#c89020] text-[#1a1557] shadow-md"
                                  : "bg-white/10",
                              )}
                            >
                              {it.label.charAt(0)}
                            </span>
                          ) : (
                            <>
                              <span
                                className={cn(
                                  "w-1 h-1 rounded-full flex-shrink-0 transition-all",
                                  isActive
                                    ? "bg-[#f0c040] shadow-[0_0_6px_rgba(240,192,64,0.7)]"
                                    : "bg-white/25",
                                )}
                              />
                              <span className="truncate flex-1">{it.label}</span>
                              {it.badge && (
                                <span className="text-[9px] bg-[#f0c040] text-[#1a1557] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
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
        <div className="relative p-3 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "w-full text-xs bg-white/5 hover:bg-[#f0c040] hover:text-[#1a1557] border border-white/10 hover:border-[#f0c040] rounded-xl py-2.5 font-semibold transition-all shadow-md hover:shadow-[0_8px_20px_-6px_rgba(240,192,64,0.6)]",
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
        <div className="md:hidden bg-gradient-to-r from-[#1a1557] to-[#0f0b3d] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="bg-white/10 hover:bg-[#f0c040] hover:text-[#1a1557] px-3 py-1.5 rounded-full text-xs font-bold transition-all"
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
