// Funções puras para cálculos de gestação e faixas de normalidade.

export const GESTATION_DAYS = 280;
export const GESTATION_WEEKS = 40;

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Semanas completas (pode ser fracionária) entre DUM e data. */
export function weeksBetween(dum: Date, date: Date): number {
  const ms = date.getTime() - dum.getTime();
  return ms / (1000 * 60 * 60 * 24 * 7);
}

export function trimesterOfWeek(week: number): 1 | 2 | 3 {
  if (week < 14) return 1;
  if (week < 28) return 2;
  return 3;
}

export function formatBRDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Faixa de ganho de peso cumulativo esperado (kg) na semana `week`,
 * partindo de `startWeek` com peso `startWeightKg`. Baseado em IOM
 * para IMC pré-gestacional normal: 1ºT: 0,5–2 kg total; 2º/3ºT: 0,35–0,5 kg/sem.
 */
export function expectedWeightRange(
  week: number,
  startWeek: number,
  startWeightKg: number,
): { min: number; max: number } {
  const weeksSince = Math.max(0, week - startWeek);
  // Ganho no 1º trimestre proporcional ao quanto avançou nele
  const t1Weeks = Math.max(0, Math.min(13, week) - Math.max(0, startWeek));
  const t1Min = (t1Weeks / 13) * 0.5;
  const t1Max = (t1Weeks / 13) * 2.0;

  const t23Weeks = Math.max(0, week - Math.max(13, startWeek));
  const t23Min = t23Weeks * 0.35;
  const t23Max = t23Weeks * 0.5;

  // Quando startWeek >= 13, t1Weeks==0 e só vale t23
  void weeksSince;

  return {
    min: startWeightKg + t1Min + t23Min,
    max: startWeightKg + t1Max + t23Max,
  };
}

export const BP_NORMAL = {
  sistolica: { min: 90, max: 120 },
  diastolica: { min: 60, max: 80 },
};
