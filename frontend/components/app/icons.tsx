// Stroke icon set — currentColor, no emoji.
type P = { size?: number };
const S = ({ size = 20, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const IcoDashboard = (p: P) => (
  <S {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </S>
);
export const IcoVault = (p: P) => (
  <S {...p}>
    <path d="M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </S>
);
export const IcoProve = (p: P) => (
  <S {...p}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
  </S>
);
export const IcoAudit = (p: P) => (
  <S {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </S>
);
export const IcoDeposit = (p: P) => (
  <S {...p}>
    <path d="M12 3v11m0 0l-4-4m4 4l4-4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </S>
);
export const IcoContract = (p: P) => (
  <S {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </S>
);
export const IcoGithub = (p: P) => (
  <S {...p}>
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.3 0C6.6 2.3 5.5 2.6 5.5 2.6a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  </S>
);
export const IcoSearch = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </S>
);
export const IcoBell = (p: P) => (
  <S {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10.3 21a2 2 0 0 0 3.4 0" />
  </S>
);
export const IcoChain = (p: P) => (
  <S {...p}>
    <path d="M12 2l7 5-7 4-7-4 7-5z" />
    <path d="M5 12l7 4 7-4M5 17l7 4 7-4" />
  </S>
);
export const IcoLock = (p: P) => (
  <S {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </S>
);
export const IcoPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const IcoCode = (p: P) => (
  <S {...p}>
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </S>
);
export const IcoArrow = (p: P) => (
  <S {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </S>
);
export const IcoDoc = (p: P) => (
  <S {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </S>
);
export const IcoUsers = (p: P) => (
  <S {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1A4 4 0 0 1 16 11" />
  </S>
);
