export default function RaceCar({ className }: { className?: string }) {
    return (
      <svg className={className} viewBox="-40 0 570 215" aria-hidden="true">
        <g stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".9">
          <line x1="-40" y1="95" x2="-6" y2="95" />
          <line x1="-34" y1="128" x2="-2" y2="128" />
        </g>
        <rect x="-6" y="40" width="14" height="48" rx="4" fill="#A82418" />
        <rect x="-24" y="26" width="76" height="18" rx="9" fill="#E63B2E" stroke="#fff" strokeWidth="5" />
        <path d="M10 110 Q10 82 40 74 L120 64 Q158 12 238 10 L328 10 Q388 14 418 62 L458 72 Q496 80 496 112 L496 142 Q496 158 480 158 L26 158 Q10 158 10 142 Z" fill="#E63B2E" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
        <path d="M142 64 Q170 30 236 28 L306 28 Q350 32 380 64 Z" fill="#BFE8FF" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
        <line x1="262" y1="30" x2="262" y2="64" stroke="#fff" strokeWidth="6" />
        <path d="M14 112 H492 V126 H14 Z" fill="#FFC928" />
        <circle cx="340" cy="108" r="26" fill="#fff" stroke="#A82418" strokeWidth="5" />
        <path d="M346 90 L326 112 H340 L334 128 L356 104 H342 Z" fill="#E63B2E" stroke="#8a2a12" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="482" cy="98" rx="14" ry="12" fill="#FFF3A0" stroke="#C99200" strokeWidth="4" />
        <rect x="8" y="94" width="14" height="22" rx="5" fill="#FF8A2B" />
        {[120, 396].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="160" r="48" fill="#26262c" />
            <circle cx={cx} cy="160" r="26" fill="#e8e8e8" stroke="#9a9a9a" strokeWidth="4" />
            <g className="spokes" stroke="#9a9a9a" strokeWidth="4">
              <line x1={cx} y1="140" x2={cx} y2="180" />
              <line x1={cx - 20} y1="160" x2={cx + 20} y2="160" />
            </g>
            <circle cx={cx} cy="160" r="8" fill="#6b6b6b" />
          </g>
        ))}
      </svg>
    );
  }