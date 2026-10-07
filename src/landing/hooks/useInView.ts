import { useEffect, useRef, useState, type RefObject } from "react";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

type Listener = (visible: boolean) => void;
interface Shared {
  io: IntersectionObserver;
  listeners: Map<Element, Listener>;
}

// Um IntersectionObserver por configuração, compartilhado pelos ~50 elementos animados da página.
const shared = new Map<string, Shared>();

function observe(el: Element, threshold: number, rootMargin: string, listener: Listener): () => void {
  const key = `${threshold}|${rootMargin}`;
  let entry = shared.get(key);
  if (!entry) {
    const listeners = new Map<Element, Listener>();
    const io = new IntersectionObserver(
      (records) => {
        for (const r of records) listeners.get(r.target)?.(r.isIntersecting);
      },
      { threshold, rootMargin },
    );
    entry = { io, listeners };
    shared.set(key, entry);
  }
  entry.listeners.set(el, listener);
  entry.io.observe(el);
  const current = entry;
  return () => {
    current.io.unobserve(el);
    current.listeners.delete(el);
  };
}

interface InViewOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * true quando o elemento entra na tela (e continua true depois disso).
 * Sem IntersectionObserver ou com "reduzir movimento", aparece logo após montar.
 * Começa sempre false para o HTML pré-renderizado bater com o do navegador.
 */
export function useInView<T extends Element>({ threshold = 0, rootMargin = "0px" }: InViewOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (visible || !el) return;
    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const stop = observe(el, threshold, rootMargin, (isIn) => {
      if (isIn) {
        setVisible(true);
        stop();
      }
    });
    return stop;
  }, [visible, threshold, rootMargin]);

  return [ref, visible];
}
