"use client";

const SCORE_THRESHOLD = 80;

interface MapMarkerProps {
  color: string;
  grackleScore: number;
  isSelected?: boolean;
}

export default function MapMarker({ color, grackleScore, isSelected }: MapMarkerProps) {
  const showScore = grackleScore >= SCORE_THRESHOLD;

  if (showScore) {
    return (
      <div
        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none whitespace-nowrap transition-transform duration-150 hover:scale-110"
        style={{
          backgroundColor: color,
          color: "#fff",
          boxShadow: isSelected
            ? `0 0 0 3px ${color}66, 0 2px 8px rgba(0,0,0,0.5)`
            : "0 1px 4px rgba(0,0,0,0.4)",
          transform: isSelected ? "scale(1.15)" : undefined,
        }}
      >
        <span>{grackleScore}</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-full transition-transform duration-150 hover:scale-125"
      style={{
        width: 12,
        height: 12,
        backgroundColor: color,
        border: "2px solid rgba(15,15,15,0.6)",
        boxShadow: isSelected
          ? `0 0 0 3px ${color}66, 0 2px 6px rgba(0,0,0,0.5)`
          : "0 1px 3px rgba(0,0,0,0.4)",
        transform: isSelected ? "scale(1.3)" : undefined,
      }}
    />
  );
}
