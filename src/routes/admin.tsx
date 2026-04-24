import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminFiltersProvider } from "@/contexts/AdminFiltersContext";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { AdminTopbarFilters } from "@/components/admin/AdminTopbarFilters";
import { useAdminData } from "@/hooks/useAdminData";
import { applyFilters } from "@/utils/admin-filters";
import { useAdminFilters } from "@/contexts/AdminFiltersContext";
import { VisaoGeralSection } from "@/components/admin/sections/VisaoGeralSection";
import { GestantesSection } from "@/components/admin/sections/GestantesSection";
import { ComunicacaoSection } from "@/components/admin/sections/ComunicacaoSection";
import { TelasTab } from "@/components/admin/TelasTab";
import { ProfissionaisTab } from "@/components/admin/ProfissionaisTab";
import { ParametrosTab } from "@/components/admin/ParametrosTab";
import { DadosClinicosTab } from "@/components/admin/DadosClinicosTab";
import { RelatoriosEpidemiologicosTab } from "@/components/admin/RelatoriosEpidemiologicosTab";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — MãeDigital" },
      { name: "description", content: "Painel administrativo restrito." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: AdminGate,
});

const ADMIN_KEY = "maedigital_admin_auth";

function AdminGate() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ok = sessionStorage.getItem(ADMIN_KEY) === "1";
      setAuthed(ok);
      setReady(true);
      if (!ok) navigate({ to: "/" });
    }
  }, [navigate]);

  if (!ready) return null;
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-sm text-gray-600">Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <AdminFiltersProvider>
      <AdminShell />
    </AdminFiltersProvider>
  );
}

function AdminShell() {
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>("visao");
  const { profiles, alerts, loading } = useAdminData();
  const { filters } = useAdminFilters();

  const filtered = useMemo(() => applyFilters(profiles, alerts, filters), [profiles, alerts, filters]);

  const showTopbar = ["visao", "gestantes", "epidemiologia", "comunicacao"].includes(section);

  return (
    <AdminLayout
      active={section}
      onChange={setSection}
      onLogout={() => {
        sessionStorage.removeItem(ADMIN_KEY);
        navigate({ to: "/" });
      }}
      topbar={
        showTopbar ? (
          <AdminTopbarFilters
            profiles={profiles}
            alerts={alerts}
            totalFiltrado={filtered.length}
          />
        ) : null
      }
    >
      {section === "visao" && (
        <VisaoGeralSection
          profiles={profiles}
          alerts={alerts}
          loading={loading}
          onGoTo={(s) =>
            setSection(s === "gestantes" ? "gestantes" : s === "comunicacao" ? "comunicacao" : "epidemiologia")
          }
        />
      )}
      {section === "gestantes" && (
        <GestantesSection
          profiles={profiles}
          alerts={alerts}
          loading={loading}
          onAbrirComunicacao={() => setSection("comunicacao")}
        />
      )}
      {section === "epidemiologia" && <RelatoriosEpidemiologicosTab />}
      {section === "comunicacao" && <ComunicacaoSection profiles={profiles} alerts={alerts} />}
      {section === "parametros" && <ParametrosTab />}
      {section === "dados" && <DadosClinicosTab />}
      {section === "profissionais" && <ProfissionaisTab />}
      {section === "telas" && <TelasTab />}
    </AdminLayout>
  );
}
