import { useEffect, useState, useSyncExternalStore } from "react";

export type CartItem = {
  aula_id: string;
  slug: string;
  titulo: string;
  capa_url: string | null;
  capa_video_url?: string | null;
  preco_centavos: number;
  preco_label: string | null;
  moeda: string;
  link_compra: string | null;
  tema: string | null;
  beneficios?: string[];
};


const STORAGE_KEY = "lemater_cart_v1";
let memo: CartItem[] = [];
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  memo = items;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Hydrate once on client
if (typeof window !== "undefined") {
  memo = read();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      memo = read();
      listeners.forEach((l) => l());
    }
  });
}

export const cartStore = {
  getItems: () => memo,
  add: (item: CartItem) => {
    const exists = memo.some((i) => i.aula_id === item.aula_id);
    write(exists ? memo.map((i) => (i.aula_id === item.aula_id ? item : i)) : [...memo, item]);
  },
  remove: (aula_id: string) => {
    write(memo.filter((i) => i.aula_id !== aula_id));
  },
  clear: () => write([]),
  has: (aula_id: string) => memo.some((i) => i.aula_id === aula_id),
};

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    () => memo,
    () => [] as CartItem[],
  );
  const total = items.reduce((s, i) => s + (i.preco_centavos || 0), 0);
  return {
    items,
    count: items.length,
    total,
    add: cartStore.add,
    remove: cartStore.remove,
    clear: cartStore.clear,
    has: cartStore.has,
  };
}

export function useCartUI() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__lemater_openCart = () => setOpen(true);
  }, []);
  return { open, setOpen };
}

export function openCart() {
  if (typeof window !== "undefined") {
    const fn = (window as any).__lemater_openCart;
    if (typeof fn === "function") fn();
  }
}
