import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", "aria-hidden": true } as const;
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconSearch = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} strokeWidth={2.2} d="M12 5v14M5 12h14" />
  </svg>
);
export const IconX = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconDown = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14" />
  </svg>
);
export const IconWa = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} strokeWidth={1.9} d="M4 20l1.3-4A8 8 0 1 1 8 18.8z" />
  </svg>
);
export const IconCopy = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M9 9h10v10H9zM5 15V5h10" />
  </svg>
);
export const IconBell = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4" />
  </svg>
);
export const IconOut = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
  </svg>
);
export const IconKey = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M14.5 9.5a4 4 0 1 1-1.4-3.05M14.5 9.5 21 16v3h-3v-2h-2v-2h-2l-1.2-1.2" />
  </svg>
);
export const IconFolder = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
export const IconLink = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
);
export const IconArrow = (p: P) => (
  <svg {...base} {...p}>
    <path {...stroke} d="M5 12h14m0 0-5-5m5 5-5 5" />
  </svg>
);
