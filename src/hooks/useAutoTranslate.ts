import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateBatch } from "@/lib/translate.functions";
import { useLang, isTranslatable, type Lang } from "@/lib/translate.context";

export function useAutoTranslate(containerRef?: React.RefObject<HTMLElement | null>) {
  const { lang } = useLang();
  const [translating, setTranslating] = useState(false);
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const cacheRef = useRef<Map<Lang, Map<string, string>>>(new Map());
  const translateFn = useServerFn(translateBatch);

  useEffect(() => {
    // We observe the whole body to catch Portals/Modals too
    const root = document.body;
    if (!root) return;

    const translateAll = () => {
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
          const newVal = leading + cached + trailing;
          if (node.nodeValue !== newVal) node.nodeValue = newVal;
        } else {
          missing.add(key);
        }
      }

      if (missing.size > 0) {
        setTranslating(true);
        const texts = Array.from(missing);
        translateFn({ data: { texts, target: lang as any } })
          .then((res) => {
            if (res && res.translations) {
              res.translations.forEach((t: string, i: number) => {
                cache.set(texts[i], t);
              });
              // Trigger another pass to apply newly cached values
              translateAll();
            }
          })
          .catch(err => console.error("AutoTranslate error:", err))
          .finally(() => {
            setTranslating(false);
          });
      }
    };

    translateAll();

    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
        if (m.type === "characterData") {
          // If the text changed but it's not what we just set
          const node = m.target as Text;
          const orig = originalsRef.current.get(node);
          if (orig && node.nodeValue === orig) {
             // It was restored to original, maybe need to re-translate if lang != pt
             if (lang !== "pt") shouldTranslate = true;
          }
        }
      }
      if (shouldTranslate) translateAll();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });

    return () => observer.disconnect();
  }, [lang, translateFn]);

  return { translating };
}
