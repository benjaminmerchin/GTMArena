// Coliseum brand glyph — domed top, tiered arcade, upper colonnade. One
// currentColor path with the openings cut out (evenodd), so it sits on any
// background with no tile behind it.
export function Coliseum({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 22 V13 Q16 8 27 13 V22 Z
           M6 15.4 H26 V16.2 H6 Z
           M7.1 21 V17.5 Q9.35 16 11.6 17.5 V21 Z
           M13.7 21 V17.5 Q15.95 16 18.2 17.5 V21 Z
           M20.3 21 V17.5 Q22.55 16 24.8 17.5 V21 Z
           M11.5 12.4 H13.3 V14.6 H11.5 Z
           M15.1 11.9 H16.9 V14.6 H15.1 Z
           M18.7 12.4 H20.5 V14.6 H18.7 Z"
      />
    </svg>
  );
}
