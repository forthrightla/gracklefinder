"use client";

interface GrackleIconProps {
  color: string;
  size?: number;
}

export default function GrackleIcon({ color, size = 30 }: GrackleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="marker-hover"
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
    >
      {/* Body - elongated oval */}
      <ellipse cx="14" cy="14" rx="6" ry="4.5" fill={color} transform="rotate(-15 14 14)" />
      {/* Head */}
      <circle cx="20" cy="10" r="3" fill={color} />
      {/* Eye */}
      <circle cx="21" cy="9.5" r="0.8" fill="#1a1a1a" />
      {/* Beak */}
      <polygon points="23,9.5 27,8.5 23,10.5" fill="#333" />
      {/* Long tail feathers - signature grackle keel tail */}
      <path
        d="M8 16 Q3 20 1 27 Q4 22 7 19 Q5 23 3 28 Q6 23 8 19"
        fill={color}
      />
      {/* Wing detail */}
      <path
        d="M11 11 Q14 10 17 11 Q14 13 11 14 Z"
        fill={color}
        opacity="0.7"
      />
      {/* Legs */}
      <line x1="13" y1="18" x2="12" y2="23" stroke="#333" strokeWidth="0.8" />
      <line x1="15" y1="18" x2="15" y2="23" stroke="#333" strokeWidth="0.8" />
      {/* Feet */}
      <path d="M10 23 L12 23 L13 22" stroke="#333" strokeWidth="0.7" fill="none" />
      <path d="M13 23 L15 23 L16 22" stroke="#333" strokeWidth="0.7" fill="none" />
    </svg>
  );
}
