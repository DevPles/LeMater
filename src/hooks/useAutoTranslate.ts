import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "@/lib/translate.functions";
import { useLang, isTranslatable, type Lang } from "@/lib/translate.context";

export function useAutoTranslate(containerRef: React.RefObject<HTMLElement | null>) {
  const { lang } = useLang();
  const [translating, setTranslating] = useState(false);
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const cacheRef = useRef<Map<Lang, Map<string, string>>>(new Map());
  const translateFn = useServerFn(translateBatch);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = (node as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
        if (!isTranslatable((node as Text).nodeValue ?? "")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) nodes.push(n as Text);

    for (const node of nodes) {
      if (!originalsRef.current.has(node)) {
        originalsRef.current.set(node, node.nodeValue ?? "");
      }
    }

    if (lang === "pt") {
      for (const node of nodes) {
        const orig = originalsRef.current.get(node);
        if (orig != null && node.nodeValue !== orig) node.nodeValue = orig;
      }
      return;
    }

    if (!cacheRef.current.has(lang)) cacheRef.current.set(lang, new Map());
    const cache = cacheRef.current.get(lang)!;

    const missing = new Set<string>();
    for (const node of nodes) {
      const orig = originalsRef.current.get(node) ?? "";
      const key = orig.trim();
      if (!key) continue;
      const cached = cache.get(key);
      if (cached) {
        const leading = orig.match(/^\s*/)?.[0] ?? "";
        const trailing = orig.match(/\s*$/)?.[0] ?? "";
        node.nodeValue = leading + cached + trailing;
      } else {
        missing.add(key);
      }
    }

    if (missing.size > 0) {
      let cancelled = false;
      setTranslating(true);
      const texts = Array.from(missing);
      translateFn({ data: { texts, target: lang as any } })
        .then((res) => {
          if (cancelled) return;
          if (res && res.translations) {
            res.translations.forEach((t: string, i: number) => {
              cache.set(texts[i], t);
            });
            for (const node of nodes) {
              const orig = originalsRef.current.get(node) ?? "";
              const key = orig.trim();
              const translated = cache.get(key);
              if (translated) {
                const leading = orig.match(/^\s*/)?.[0] ?? "";
                const trailing = orig.match(/\s*$/)?.[0] ?? "";
                node.nodeValue = leading + translated + trailing;
              }
            }
          }
        })
        .finally(() => {
          if (!cancelled) setTranslating(false);
        });
      return () => { cancelled = true; };
    }
  }, [lang, translateFn, containerRef]);

  return { translating };
}
