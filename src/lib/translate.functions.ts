import { createServerFn } from "@tanstack/react-start";

type TranslateInput = { texts: string[]; target: "es" | "en" | "fr" };

const LANG_NAME: Record<TranslateInput["target"], string> = {
  es: "Spanish (Spain)",
  en: "English (US)",
  fr: "French (France)",
};

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input: TranslateInput) => {
    if (!input || !Array.isArray(input.texts)) throw new Error("Invalid input");
    if (input.target !== "es" && input.target !== "en" && input.target !== "fr") throw new Error("Invalid target");
    if (input.texts.length === 0) return input;
    if (input.texts.length > 400) throw new Error("Too many strings");
    return input;
  })
  .handler(async ({ data }) => {
    if (data.texts.length === 0) return { translations: [] as string[] };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const numbered = data.texts
      .map((t, i) => `${i + 1}. ${t.replace(/\s+/g, " ").trim()}`)
      .join("\n");

    const prompt = `Translate the following Brazilian Portuguese UI strings to ${LANG_NAME[data.target]}.
Rules:
- Preserve the numbering exactly (1., 2., ...).
- Keep proper nouns (Le Mater, Rayssa Leslie, UNAERP, Atlas Materno, Clínica de Estética Leslie) untranslated.
- Keep the same tone (warm, clinical, refined).
- Do not add explanations. Output only the numbered translated lines, one per line.

${numbered}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise UI translator. Output only the requested numbered lines." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";

    const map = new Map<number, string>();
    for (const raw of content.split("\n")) {
      const m = raw.match(/^\s*(\d+)[.)\]]\s*(.+)$/);
      if (m) map.set(Number(m[1]), m[2].trim());
    }
    const translations = data.texts.map((orig, i) => map.get(i + 1) ?? orig);
    return { translations };
  });
