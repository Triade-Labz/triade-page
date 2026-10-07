import { LIMITES, isPlano, type Plano } from "./leads";
import { isValidBrPhone, normalizeBrPhone } from "./phone";

export interface LeadFormValues {
  nome: string;
  empresa: string;
  whatsapp: string;
  plano: Plano | "";
  consentimento: boolean;
}

export type LeadFormField = keyof LeadFormValues;
export type LeadFormErrors = Partial<Record<LeadFormField, string>>;

export const MENSAGENS: Record<LeadFormField, string> = {
  nome: "Informe seu nome.",
  empresa: "Informe o nome da empresa.",
  whatsapp: "Informe um WhatsApp válido com DDD.",
  plano: "Escolha uma opção.",
  consentimento: "Para enviar, aceite a Política de Privacidade.",
};

/** Ordem em que os campos aparecem na tela (o primeiro com erro recebe o foco). */
export const ORDEM_CAMPOS: readonly LeadFormField[] = ["nome", "empresa", "whatsapp", "plano", "consentimento"];

/** Remove espaços repetidos e caracteres de controle colados de outros apps. */
export function cleanText(value: string): string {
  return value.replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim();
}

/** Mesmas regras dos CHECKs do banco, para o erro aparecer no campo e não como falha de envio. */
export function validateLeadForm(v: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {};
  const nome = cleanText(v.nome);
  const empresa = cleanText(v.empresa);
  if (nome.length < LIMITES.nome.min) errors.nome = MENSAGENS.nome;
  if (empresa.length < LIMITES.empresa.min) errors.empresa = MENSAGENS.empresa;
  if (!isValidBrPhone(normalizeBrPhone(v.whatsapp))) errors.whatsapp = MENSAGENS.whatsapp;
  if (!isPlano(v.plano)) errors.plano = MENSAGENS.plano;
  if (!v.consentimento) errors.consentimento = MENSAGENS.consentimento;
  return errors;
}

export function firstError(errors: LeadFormErrors): LeadFormField | undefined {
  return ORDEM_CAMPOS.find((f) => errors[f]);
}
