import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { GravacoesTab } from "@/components/admin/GravacoesTab";
import { ConsultasTab } from "@/components/admin/ConsultasTab";


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
    let cancelled = false;
    (async () => {
      // 1) backdoor demo (sessionStorage)
      const demo =
        typeof window !== "undefined" &&
        sessionStorage.getItem(ADMIN_KEY) === "1";
      if (demo) {
        if (!cancelled) {
          setAuthed(true);
          setReady(true);
        }
        return;
      }
      // 2) sessão Supabase com role admin
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (uid) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);
        const isAdmin = (roles ?? []).some((r) => r.role === "admin");
        if (isAdmin) {
          if (typeof window !== "undefined") sessionStorage.setItem(ADMIN_KEY, "1");
          if (!cancelled) {
            setAuthed(true);
            setReady(true);
          }
          return;
        }
      }
      if (!cancelled) {
        setReady(true);
        navigate({ to: "/" });
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const isGestantes = section.startsWith("gestantes-");
  const isEpi = section.startsWith("epi-");
  const isComunicacao = section.startsWith("comunicacao-");
  const isConfig = section.startsWith("config-");

  const showTopbar = section === "visao" || isGestantes || isEpi || isComunicacao;

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
            setSection(
              s === "gestantes"
                ? "gestantes-lista"
                : s === "comunicacao"
                  ? "comunicacao-campanhas"
                  : "epi-drs",
            )
          }
        />
      )}
      {isGestantes && (
        <GestantesSection
          profiles={profiles}
          alerts={alerts}
          loading={loading}
          onAbrirComunicacao={() => setSection("comunicacao-campanhas")}
        />
      )}
      {isEpi && <RelatoriosEpidemiologicosTab />}
      {isComunicacao && <ComunicacaoSection profiles={profiles} alerts={alerts} />}
      {section === "config-parametros" && <ParametrosTab />}
      {section === "config-profissionais" && <ProfissionaisTab />}
      {section === "config-telas" && <TelasTab />}
      
      {section === "consultas-todas" && <ConsultasTab />}
      {section === "consultas-gravacoes" && <GravacoesTab />}
    </AdminLayout>
  );
}
