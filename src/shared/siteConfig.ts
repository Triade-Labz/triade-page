/**
 * Contatos públicos da empresa. O que ficar vazio simplesmente não aparece no site.
 * (Os dados do Supabase NÃO ficam aqui: ficam no .env, veja .env.example.)
 */
interface SiteConfig {
  empresa: string;
  whatsapp: string;
  email: string;
  cnpj: string;
  instagram: string;
  linkedin: string;
  behance: string;
  emailPrivacidade: string;
}

export const SITE: Readonly<SiteConfig> = {
  empresa: "Tríade Labs",
  /** WhatsApp com DDI + DDD, só números. Ex.: "5551999998888" */
  whatsapp: "",
  /** Ex.: "contato@triadelabs.com.br" */
  email: "",
  /** Ex.: "00.000.000/0001-00" */
  cnpj: "",
  /** URLs completas dos perfis. */
  instagram: "",
  linkedin: "",
  behance: "",
  /** Canal da LGPD citado na política de privacidade. */
  emailPrivacidade: "jvv.moraes05@gmail.com",
};

export type SocialKey = "instagram" | "linkedin" | "behance";

/** Link do WhatsApp da empresa (ou null quando o número ainda não foi configurado). */
export function companyWaLink(text?: string): string | null {
  const n = SITE.whatsapp.replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "(51) 99999-8888" a partir de "5551999998888". */
export function companyWaLabel(): string {
  const d = SITE.whatsapp.replace(/\D/g, "").replace(/^55/, "");
  return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d;
}
