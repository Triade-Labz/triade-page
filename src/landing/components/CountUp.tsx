import { useEffect, useState } from "react";
import { prefersReducedMotion, useInView } from "../hooks/useInView";

function fmt(n: number, decimals: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Número que conta de 0 até o valor quando aparece na tela. */
export function CountUp({ value, decimals = 0, duration = 1800 }: { value: number; decimals?: number; duration?: number }) {
  const [ref, visible] = useInView<HTMLSpanElement>({ threshold: 0.6 });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const dur = prefersReducedMotion() ? 0 : duration;
    let raf = 0;
    let start: number | null = null;
    const step = (t: number) => {
      start ??= t;
      const p = dur ? Math.min((t - start) / dur, 1) : 1;
      setShown(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, value, duration]);

  return <span ref={ref}>{fmt(shown, decimals)}</span>;
}
