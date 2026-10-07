/**
 * Telefones brasileiros: o banco guarda só os dígitos com DDD, sem o 55
 * (10 dígitos para fixo, 11 para celular). Estas funções são usadas no
 * formulário do site e no cadastro manual do CRM.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Converte o que a pessoa digitou (ou o que o navegador preencheu sozinho)
 * para o formato do banco. Trata os casos que antes viravam número errado:
 *   "+55 51 99999-8888"  -> "51999998888"   (autopreenchimento com DDI)
 *   "0 51 99999-8888"    -> "51999998888"   (prefixo de operadora/tronco)
 *   "(55) 99999-8888"    -> "55999998888"   (DDD 55 é válido: Santa Maria, RS)
 * O 55/0 só é removido quando sobram dígitos demais, para não estragar o DDD 55.
 */
export function normalizeBrPhone(value: string): string {
  let d = onlyDigits(value);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length > 11 && d.startsWith("0")) d = d.replace(/^0+/, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 11);
}

/** Máscara de exibição: (51) 99999-8888 / (51) 3333-4444. Aceita entrada parcial. */
export function formatBrPhone(value: string): string {
  const d = normalizeBrPhone(value);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Valida o número já normalizado: DDD sem zero (11 a 99) e
 * 9 dígitos começando com 9 (celular) ou 8 dígitos (fixo / WhatsApp Business
 * em número antigo). É propositalmente tolerante: recusar um número real
 * custa um lead, e quem atende confirma o contato no WhatsApp.
 */
export function isValidBrPhone(digits: string): boolean {
  return /^[1-9]{2}(?:9\d{8}|[2-9]\d{7})$/.test(digits);
}

/** Link do WhatsApp para um número salvo no banco (adiciona o 55). */
export function waMeLink(digits: string, text?: string): string {
  const base = `https://wa.me/55${onlyDigits(digits)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
