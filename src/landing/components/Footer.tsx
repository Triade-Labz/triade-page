import type { ComponentType, SVGProps } from "react";
import { LogoMark, Wordmark } from "../../shared/components/LogoMark";
import { SITE, companyWaLabel, companyWaLink, type SocialKey } from "../../shared/siteConfig";
import { NAV_LINKS } from "../content";
import { IconBehance, IconInstagram, IconLinkedin, IconWhatsApp } from "./icons";

const SOCIALS: { key: SocialKey; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: "instagram", label: "Instagram", Icon: IconInstagram },
  { key: "linkedin", label: "LinkedIn", Icon: IconLinkedin },
  { key: "behance", label: "Behance", Icon: IconBehance },
];

const SERVICOS = [
  { href: "#planos", label: "Sites e sistemas" },
  { href: "#servicos", label: "Suporte em TI" },
  { href: "#servicos", label: "Pentest e segurança" },
  { href: "#contato", label: "Projeto sob medida" },
];

export function Footer() {
  const wa = companyWaLink("Olá! Vim pelo site.");
  return (
    <footer className="footer">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <a href="#topo" className="logo" aria-label="Tríade Labs — voltar ao topo">
              <LogoMark className="logo-mark" />
              <Wordmark className="wm" />
            </a>
            <p className="foot-tagline">construir · sustentar · proteger</p>
            <p>Três sócios cuidando da tecnologia da sua empresa: do site ao suporte e à segurança.</p>
            <div className="socials">
              {SOCIALS.filter((s) => SITE[s.key]).map(({ key, label, Icon }) => (
                <a key={key} href={SITE[key]} target="_blank" rel="noopener" aria-label={label}>
                  <Icon />
                </a>
              ))}
              {wa && (
                <a href={wa} target="_blank" rel="noopener" aria-label="WhatsApp">
                  <IconWhatsApp />
                </a>
              )}
            </div>
          </div>
          <div className="foot-col">
            <h4>Navegação</h4>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot-col">
            <h4>Serviços</h4>
            <ul>
              {SERVICOS.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="foot-col">
            <h4>Contato</h4>
            <ul>
              {SITE.email && (
                <li>
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </li>
              )}
              {wa && (
                <li>
                  <a href={wa} target="_blank" rel="noopener">
                    {companyWaLabel()}
                  </a>
                </li>
              )}
              <li>Canoas, RS · Atendimento em todo o Brasil</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Tríade Labs. Todos os direitos reservados.</span>
          <span>
            {SITE.cnpj && <>CNPJ {SITE.cnpj} · </>}
            <a href="politica-de-privacidade.html">Política de privacidade</a>
          </span>
        </div>
        <p className="foot-word" aria-hidden="true">
          tr<i>í</i>ade<small>labs</small>
        </p>
      </div>
    </footer>
  );
}

/** Botão flutuante de WhatsApp (só aparece com o número configurado). */
export function WhatsAppFloat() {
  const wa = companyWaLink("Olá! Vim pelo site e quero um orçamento.");
  if (!wa) return null;
  return (
    <a className="wa-float" href={wa} target="_blank" rel="noopener" aria-label="Conversar pelo WhatsApp">
      <IconWhatsApp strokeWidth={1.8} />
    </a>
  );
}
