import { useEffect, useState, type CSSProperties } from "react";

type DialogItem = {
  id: number;
  type: "alert" | "confirm";
  message: string;
  resolve: (value: boolean) => void;
};

type Listener = (items: DialogItem[]) => void;

let queue: DialogItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const l of listeners) l([...queue]);
}

function push(type: "alert" | "confirm", message: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    queue.push({ id: nextId++, type, message: String(message ?? ""), resolve });
    emit();
  });
}

function resolveTop(value: boolean) {
  const item = queue[0];
  if (!item) return;
  queue = queue.slice(1);
  emit();
  item.resolve(value);
}

export function appAlert(message: string): Promise<boolean> {
  return push("alert", message);
}
export function appConfirm(message: string): Promise<boolean> {
  return push("confirm", message);
}

export function installGlobalDialogOverrides() {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    __appDialogInstalled?: boolean;
    alert: (msg?: string) => void;
    confirm: (msg?: string) => boolean;
  };
  if (w.__appDialogInstalled) return;
  w.__appDialogInstalled = true;
  w.alert = (msg?: string) => {
    void appAlert(String(msg ?? ""));
  };
  w.confirm = (msg?: string) => {
    void appConfirm(String(msg ?? ""));
    return true;
  };
}

const c = {
  ink: "#1C1C1A",
  muted: "#6B6560",
  cream: "#FAF5EE",
  border: "#E8DDD2",
  sageDark: "#2D5A42",
  sage: "#5C8A6E",
};
const serif = "'Cormorant Garamond', serif";
const sans = "'DM Sans', sans-serif";

export function AppDialogRoot() {
  const [items, setItems] = useState<DialogItem[]>([]);

  useEffect(() => {
    installGlobalDialogOverrides();
    const l: Listener = (next) => setItems(next);
    listeners.add(l);
    l([...queue]);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const top = items[0];
  if (!top) return null;

  const onClose = (value: boolean) => resolveTop(value);

  return (
    <div
      onClick={() => top.type === "alert" && onClose(true)}
      style={overlay}
    >
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={title}>{top.type === "confirm" ? "Confirmar" : "Aviso"}</div>
        <div style={body}>{top.message}</div>
        <div style={actions}>
          {top.type === "confirm" && (
            <button onClick={() => onClose(false)} style={btnGhost} autoFocus>
              Cancelar
            </button>
          )}
          <button
            onClick={() => onClose(true)}
            style={btnPrimary}
            autoFocus={top.type === "alert"}
          >
            {top.type === "confirm" ? "Confirmar" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(28, 28, 26, 0.55)",
  zIndex: 100000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  fontFamily: sans,
};
const card: CSSProperties = {
  background: c.cream,
  border: `1px solid ${c.border}`,
  maxWidth: 440,
  width: "100%",
  padding: "28px 28px 22px",
  boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
};
const title: CSSProperties = {
  fontFamily: serif,
  fontSize: 28,
  fontWeight: 400,
  color: c.ink,
  marginBottom: 10,
};
const body: CSSProperties = {
  fontSize: 14,
  color: c.ink,
  lineHeight: 1.55,
  marginBottom: 22,
  whiteSpace: "pre-wrap",
};
const actions: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};
const btnBase: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  padding: "10px 20px",
  border: "none",
  cursor: "pointer",
  fontFamily: sans,
};
const btnPrimary: CSSProperties = { ...btnBase, background: c.sageDark, color: "white" };
const btnGhost: CSSProperties = {
  ...btnBase,
  background: "transparent",
  color: c.ink,
  border: `1px solid ${c.border}`,
};
