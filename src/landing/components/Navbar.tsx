import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "../../shared/cx";
import { LogoMark, Wordmark } from "../../shared/components/LogoMark";
import { NAV_LINKS } from "../content";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) firstLinkRef.current?.focus();
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header>
      <nav className={cx("nav", scrolled && "scrolled")} aria-label="Navegação principal">
        <a href="#topo" className="logo" aria-label="Tríade Labs — início">
          <LogoMark className="logo-mark" />
          <Wordmark className="wm" />
        </a>
        <ul className="nav-links">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <a href="#contato" className="btn btn-primary btn-sm nav-cta">
          Solicitar orçamento
        </a>
        <button
          ref={burgerRef}
          className="burger"
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
        </button>
      </nav>
      <div className={cx("mobile-menu", open && "open")} id="mobile-menu" aria-hidden={!open} inert={!open}>
        {NAV_LINKS.map((l, i) => (
          <a key={l.href} ref={i === 0 ? firstLinkRef : undefined} className="m-link" href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
        <a href="#contato" className="btn btn-primary" onClick={close}>
          Solicitar orçamento
        </a>
      </div>
    </header>
  );
}
