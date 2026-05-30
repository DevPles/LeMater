export const vidEngravidar = "/__l5e/assets-v1/fee6877d-6bbc-417b-9f9d-c37940580cd3/engravidar.mp4";
export const vidPreNatal = "/__l5e/assets-v1/50839f2b-be10-4be1-9dff-fe20596bd45f/pre-natal.mp4";
export const vidExercicios = "/__l5e/assets-v1/8c0b94d4-eb3d-464f-9f8c-73a6009d7684/exercicios.mp4";
export const vidAlimentacao = "/__l5e/assets-v1/87664664-23c3-47f7-b3dd-c3f31fbfbfec/alimentacao.mp4";
export const vidPartoHumanizado = "/__l5e/assets-v1/06ac26f0-ccd4-4aa2-a764-a7181a85a02f/parto-humanizado.mp4";
export const vidPlanoParto = "/__l5e/assets-v1/30cdf9be-7952-41d3-aaab-14c2d5b99a83/plano-parto.mp4";
export const vidPuerperio = "/__l5e/assets-v1/dd1716d3-39c8-4fe9-889b-1b7cd8322bea/puerperio.mp4";
export const vidAmamentacao = "/__l5e/assets-v1/8c0f8f04-712e-4fae-ad75-da2004db899c/amamentacao.mp4";
export const vidPrimeirosCuidados = "/__l5e/assets-v1/8ce71800-7382-4980-a806-b85f9b1ea675/primeiros-cuidados.mp4";
export const vidSonoBebe = "/__l5e/assets-v1/83670fc6-ff2e-4d7e-9dfe-1bf4ace22827/sono-bebe.mp4";

export type AtlasCoverVideoSource = {
  capa_video_url?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  temas?: Array<{ slug?: string | null; titulo?: string | null }>;
};

export function videoForAulaCover(a: AtlasCoverVideoSource): string {
  if (a.capa_video_url) return a.capa_video_url;
  const haystack = [
    ...(a.temas ?? []).map((t) => `${t.slug ?? ""} ${t.titulo ?? ""}`),
    a.titulo ?? "",
    a.descricao ?? "",
  ].join(" ").toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => haystack.includes(k));
  if (has("conceb", "concep", "engravid", "fertil")) return vidEngravidar;
  if (has("amament", "leite", "peito")) return vidAmamentacao;
  if (has("plano de parto", "plano-de-parto", "plano parto")) return vidPlanoParto;
  if (has("parto", "trabalho de parto", "humaniz")) return vidPartoHumanizado;
  if (has("puerp", "pos-parto", "pós-parto", "pos parto")) return vidPuerperio;
  if (has("sono", "dormir")) return vidSonoBebe;
  if (has("cuidad", "bebê", "bebe", "recem", "recém")) return vidPrimeirosCuidados;
  if (has("exerc", "movimento", "yoga", "atividade")) return vidExercicios;
  if (has("aliment", "nutri", "comida", "dieta")) return vidAlimentacao;
  if (has("gesta", "pre-natal", "pré-natal", "pre natal", "grávid", "gravid")) return vidPreNatal;
  return vidPreNatal;
}