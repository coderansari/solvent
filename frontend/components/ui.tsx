"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Toast = { id: number; msg: string; kind: "ok" | "err" | "info" };
type ToastCtx = { push: (msg: string, kind?: Toast["kind"]) => void };

const Ctx = createContext<ToastCtx | null>(null);
let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: Toast["kind"] = "info") => {
    const id = ++seq;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="toast-wrap">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`toast ${t.kind === "ok" ? "ok" : t.kind === "err" ? "err" : ""}`}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast within ToastProvider");
  return v;
}

/** A short handle preview that copies the full value on click. */
export function HandleChip({ value }: { value?: string }) {
  if (!value || value === "0x" + "0".repeat(64))
    return <span className="mono hint">uninitialized</span>;
  const s = `${value.slice(0, 10)}…${value.slice(-6)}`;
  return (
    <span
      className="mono pill"
      title={value}
      style={{ cursor: "pointer" }}
      onClick={() => navigator.clipboard.writeText(value)}
    >
      🔒 {s}
    </span>
  );
}

/** Button that runs an async action with idle/busy/error states. */
export function TxButton({
  children,
  onRun,
  disabled,
  primary,
  full,
}: {
  children: React.ReactNode;
  onRun: () => Promise<void>;
  disabled?: boolean;
  primary?: boolean;
  full?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`btn ${primary ? "primary" : ""} ${full ? "full" : ""}`}
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onRun();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <>
          <span className="shimmer">◠</span> Working…
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
