import type { ComponentPropsWithoutRef, ElementType, Ref } from "react";
import { cx } from "../../shared/cx";
import { useInView } from "../hooks/useInView";

type RevealProps<T extends ElementType> = {
  as?: T;
  /** Atraso escalonado da animação (0,08s por nível). */
  delay?: 1 | 2 | 3 | 4;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/** Elemento que aparece deslizando quando entra na tela (classe .reveal / .in). */
export function Reveal<T extends ElementType = "div">({ as, delay, className, ...rest }: RevealProps<T>) {
  const Tag: ElementType = as ?? "div";
  const [ref, visible] = useInView<HTMLElement>({ threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  return <Tag ref={ref as Ref<HTMLElement>} className={cx("reveal", className, visible && "in")} data-delay={delay} {...rest} />;
}
