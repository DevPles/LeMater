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
import { UsuariosTab } from "@/components/admin/UsuariosTab";
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

function AdminGate() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (uid) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);
        const isAdmin = (roles ?? []).some((r) => r.role === "admin");
        if (isAdmin) {
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
  const { profiles, alerts, loading, reload } = useAdminData();
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
      onLogout={async () => {
        await supabase.auth.signOut().catch(() => {});
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
          onReload={reload}
        />
      )}
      {isEpi && <RelatoriosEpidemiologicosTab />}
      {isComunicacao && <ComunicacaoSection profiles={profiles} alerts={alerts} />}
      {section === "config-parametros" && <ParametrosTab />}
      {section === "config-profissionais" && <UsuariosTab />}
      {section === "config-telas" && <TelasTab />}
      
      {section === "consultas-todas" && <ConsultasTab />}
      {section === "consultas-gravacoes" && <GravacoesTab />}
    </AdminLayout>
  );
}
