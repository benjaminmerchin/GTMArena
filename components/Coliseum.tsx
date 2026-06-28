// Coliseum brand glyph — white facade with navy arch openings, meant to sit on
// the navy logo tile (so the arches read as openings against #0A2540).
export function Coliseum({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="5" y="9" width="22" height="14" rx="2" fill="#ffffff" />
      <g fill="#0A2540">
        <path d="M6.6 15.6 V13 Q8.35 11.5 10.1 13 V15.6 Z" />
        <path d="M11.7 15.6 V13 Q13.45 11.5 15.2 13 V15.6 Z" />
        <path d="M16.8 15.6 V13 Q18.55 11.5 20.3 13 V15.6 Z" />
        <path d="M21.9 15.6 V13 Q23.65 11.5 25.4 13 V15.6 Z" />
        <path d="M6.6 22 V18.2 Q8.35 16.7 10.1 18.2 V22 Z" />
        <path d="M11.7 22 V18.2 Q13.45 16.7 15.2 18.2 V22 Z" />
        <path d="M16.8 22 V18.2 Q18.55 16.7 20.3 18.2 V22 Z" />
        <path d="M21.9 22 V18.2 Q23.65 16.7 25.4 18.2 V22 Z" />
      </g>
    </svg>
  );
}
