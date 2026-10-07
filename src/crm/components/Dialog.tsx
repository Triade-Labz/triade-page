import { useEffect, useRef, type ReactNode } from "react";

/** <dialog> nativo controlado pelo React (foco preso, Esc e fundo escuro vêm do navegador). */
export function Dialog({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault(); // Esc: quem fecha é o estado do React
        onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}
