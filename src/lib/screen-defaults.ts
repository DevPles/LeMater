// Default content stubs for screens that previously had editable content
// managed by the (now-removed) admin TelasTab editor. These keep the mobile
// app routes working with sensible defaults; the database may still override
// these via `app_content` rows.

export const HOME_DEFAULT = {
  pageTitle: "Olá",
  tipsHeading: "Dicas da semana",
  currentWeek: 1,
  weeklyTips: [] as Array<{ week: number; title: string; description: string; body?: string }>,
};

export const CARTAO_DEFAULT = {
  patientName: "Gestante",
  patientAge: 0,
  bloodType: "—",
  dum: "",
  dpp: "",
  vitals: [] as Array<{ label: string; value: string; change: string; unit?: string }>,
};

export const GESTACAO_DEFAULT = {
  pageTitle: "Gestação",
  pageSubtitle: "Acompanhe sua jornada semana a semana.",
};
