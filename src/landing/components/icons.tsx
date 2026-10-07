import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { viewBox: "0 0 24 24", "aria-hidden": true } as const;

export function IconCheck(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

export function IconArrow(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export function IconStar(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path fill="currentColor" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" />
    </svg>
  );
}

export function IconChat(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 1 3.4 6.5L4 20l1.2-3.6A8 8 0 0 1 4 12Z" />
    </svg>
  );
}

export function IconWhatsApp({ strokeWidth = 1.7, ...p }: IconProps) {
  return (
    <svg {...base} {...p}>
      <path fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" d="M4 20l1.3-4A8 8 0 1 1 8 18.8z" />
      <path
        fill="currentColor"
        d="M9.2 8.3c.2-.4.5-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.1.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.5-.4.7-.5.3-1.3.5-2.2.2a8 8 0 0 1-4.9-4.9c-.3-.9-.1-1.7.2-2.2z"
      />
    </svg>
  );
}

export function IconInstagram(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function IconLinkedin(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path
        fill="currentColor"
        d="M6.9 8.6H3.6V20h3.3zM5.2 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM20.4 13.4c0-3-1.6-4.9-4.2-4.9-1.4 0-2.4.7-2.9 1.5V8.6H10V20h3.3v-5.9c0-1.5.6-2.6 2-2.6s1.8 1.1 1.8 2.6V20h3.3z"
      />
    </svg>
  );
}

export function IconBehance(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h5a3 3 0 0 1 0 6H3zm0 6h6a3 3 0 0 1 0 6H3zM15 7h5m-6 7h7a3.5 3.5 0 1 0-.8 2.3"
      />
    </svg>
  );
}
