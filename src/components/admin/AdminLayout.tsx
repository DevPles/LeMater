import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "visao"
  | "gestantes"
  | "epidemiologia"
  | "comunicacao"
  | "parametros"
  | "dados"
  | "profissionais"
  | "telas";

type Item = {
  key: AdminSection;
  label: string;
  group: "Operação" | "Configuração";
};

const ITEMS: Item[] = [
  { key: "visao", label: "Visão geral", group: "Operação" },
  { key: "gestantes", label: "Gestantes", group: "Operação" },
  { key: "epidemiologia", label: "Epidemiologia DRS-XIII", group: "Operação" },
  { key: "comunicacao", label: "Comunicação", group: "Operação" },
  { key: "parametros", label: "Parâmetros clínicos", group: "Configuração" },
  { key: "dados", label: "Dados clínicos (auditoria)", group: "Configuração" },
  { key: "profissionais", label: "Profissionais", group: "Configuração" },
  { key: "telas", label: "Conteúdo das telas", group: "Configuração" },
];

type Props = {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
  topbar?: ReactNode;
  children: ReactNode;
  onLogout: () => void;
};

export function AdminLayout({ active, onChange, topbar, children, onLogout }: Props) {
  const [open, setOpen] = useState(false);

  const groups = ITEMS.reduce<Record<string, Item[]>>((acc, it) => {
    (acc[it.group] = acc[it.group] ?? []).push(it);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-40 bg-[#1a1557] text-white w-64 flex-shrink-0 transition-transform",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="px-4 py-4 border-b border-white/10">
          <p className="font-bold text-sm">MãeDigital</p>
          <p className="text-[10px] text-white/60 uppercase tracking-wide">Painel administrativo</p>
        </div>
        <nav className="py-3 overflow-y-auto h-[calc(100vh-110px)]">
          {Object.entries(groups).map(([grupo, items]) => (
            <div key={grupo} className="mb-3">
              <p className="px-4 text-[10px] uppercase tracking-wide text-white/40 font-bold mb-1">
                {grupo}
              </p>
              {items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => {
                    onChange(it.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    active === it.key
                      ? "bg-white/15 border-l-4 border-[#f0c040] font-bold"
                      : "hover:bg-white/5 border-l-4 border-transparent",
                  )}
                >
                  {it.label}
                  {it.key === "comunicacao" && (
                    <span className="ml-2 text-[9px] bg-[#f0c040] text-[#1a1557] px-1.5 py-0.5 rounded-full font-bold">
                      NOVA
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-xs bg-white/10 hover:bg-white/20 rounded-full py-1.5"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden bg-[#1a1557] text-white px-4 py-2 flex items-center justify-between sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold"
          >
            Menu
          </button>
          <span className="text-xs font-semibold">{ITEMS.find((i) => i.key === active)?.label}</span>
          <span />
        </div>

        {topbar}

        <div className="p-4 md:p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
