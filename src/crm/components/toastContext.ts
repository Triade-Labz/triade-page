import { createContext, useContext } from "react";

export type ToastKind = "err" | "new" | undefined;
export type ToastFn = (text: string, kind?: ToastKind) => void;

export const ToastContext = createContext<ToastFn>(() => {});

/** Mostra um aviso temporário no rodapé do painel. */
export function useToast(): ToastFn {
  return useContext(ToastContext);
}
