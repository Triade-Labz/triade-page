import type { KeyboardEvent } from "react";

/** Enter/Espaço em elementos role="button" que não são <button>. */
export function activateOnKey(e: KeyboardEvent, fn: () => void): void {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  fn();
}
