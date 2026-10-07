/** Símbolo da marca (o triângulo da Tríade). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <line x1="27.8" y1="13.2" x2="8.2" y2="46.8" stroke="#FF6B3D" strokeWidth="7" strokeLinecap="round" />
      <line x1="12.4" y1="54" x2="51.6" y2="54" stroke="#FF6B3D" strokeWidth="7" strokeLinecap="round" />
      <line x1="55.8" y1="46.8" x2="36.2" y2="13.2" stroke="#FF6B3D" strokeWidth="7" strokeLinecap="round" />
      <circle cx="32" cy="38" r="4.5" fill="#F3F5F9" />
    </svg>
  );
}

/** "tríade labs" com o acento destacado. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      tr<i>í</i>ade<small>labs</small>
    </span>
  );
}
