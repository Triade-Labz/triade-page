/** Formatação de datas, valores e textos do painel (pt-BR). */

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function today(now: Date = new Date()): string {
  return ymd(now);
}

/** "2026-10-06" -> "06/10" */
export function dm(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

export function brl(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n % 1 ? 2 : 0 });
}

export function ago(iso: string, now: number = Date.now()): string {
  const s = (now - new Date(iso).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return d < 30 ? `há ${d} ${d === 1 ? "dia" : "dias"}` : new Date(iso).toLocaleDateString("pt-BR");
}

export function dataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function initials(nome: string | null | undefined): string {
  return (
    String(nome || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/** Busca sem acento e sem maiúsculas. */
export function norm(s: string | null | undefined): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Aceita "1.490", "1490,50", "R$ 6.990,00", "6990.5". */
export function parseValor(s: string): number | null {
  let t = String(s || "").replace(/[^\d,.-]/g, "");
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); // "1.490" é milhar, não decimal
  const n = Number.parseFloat(t);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.min(Math.round(n * 100) / 100, 99_999_999.99); // numeric(10,2)
}

export function formatValorInput(v: number | null): string {
  return v == null ? "" : String(v).replace(".", ",");
}
