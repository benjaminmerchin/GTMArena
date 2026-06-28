// Coliseum brand glyph — a single currentColor path with the arch openings cut
// out (evenodd), so it works on any background with no tile behind it.
export function Coliseum({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 9 H25 A2 2 0 0 1 27 11 V21 A2 2 0 0 1 25 23 H7 A2 2 0 0 1 5 21 V11 A2 2 0 0 1 7 9 Z
           M6.6 15.6 V13 Q8.35 11.5 10.1 13 V15.6 Z
           M11.7 15.6 V13 Q13.45 11.5 15.2 13 V15.6 Z
           M16.8 15.6 V13 Q18.55 11.5 20.3 13 V15.6 Z
           M21.9 15.6 V13 Q23.65 11.5 25.4 13 V15.6 Z
           M6.6 22 V18.2 Q8.35 16.7 10.1 18.2 V22 Z
           M11.7 22 V18.2 Q13.45 16.7 15.2 18.2 V22 Z
           M16.8 22 V18.2 Q18.55 16.7 20.3 18.2 V22 Z
           M21.9 22 V18.2 Q23.65 16.7 25.4 18.2 V22 Z"
      />
    </svg>
  );
}
