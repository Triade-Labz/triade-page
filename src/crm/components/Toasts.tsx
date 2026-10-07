import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "../../shared/cx";
import { ToastContext, type ToastFn, type ToastKind } from "./toastContext";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string; kind: ToastKind }[]>([]);
  const seq = useRef(0);

  const toast = useCallback<ToastFn>((text, kind) => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-4), { id, text, kind }]);
    setTimeout(() => setItems((xs) => xs.filter((t) => t.id !== id)), kind === "err" ? 6000 : 3500);
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("toast", t.kind)} role={t.kind === "err" ? "alert" : undefined}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
