"use client";

import { Location } from "@/lib/types";
import { getMarkerColor } from "@/lib/colors";

interface LocationPopupProps {
  location: Location;
}

function renderLaptops(count: number): string {
  return "💻".repeat(count);
}

function wifiDisplay(hasWifi: boolean | null, confidence: Location["wifiConfidence"]) {
  if (hasWifi === true) {
    const color =
      confidence === "high"
        ? "text-green-400"
        : confidence === "medium"
        ? "text-yellow-400"
        : "text-gray-400";
    return (
      <span className={color}>
        Wifi: Yes ({confidence} confidence)
      </span>
    );
  }
  if (hasWifi === false) {
    return <span className="text-red-400">Wifi: No</span>;
  }
  return <span className="text-gray-400">Wifi: Unknown</span>;
}

export default function LocationPopup({ location }: LocationPopupProps) {
  const accentColor = getMarkerColor(location.tags);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    location.address
  )}`;

  return (
    <div className="w-[280px] max-w-[calc(100vw-32px)] rounded-xl p-4 text-[#e8e8e8] font-body animate-fade-in"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      {/* Name */}
      <h3 className="text-base font-bold mb-2" style={{ color: accentColor }}>
        {location.name}
      </h3>

      {/* Grackle Score */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold" style={{ color: accentColor }}>
          {location.grackleScore}
        </span>
        <span className="text-sm text-gray-400">/100</span>
        <span className="text-xs text-gray-500 ml-1">Grackle Score</span>
      </div>

      {/* Worker Friendly */}
      <div className="text-sm mb-1">
        <span className="text-gray-400">Worker Friendly: </span>
        <span>{renderLaptops(location.workerFriendly)}</span>
        <span className="text-gray-500 text-xs ml-1">
          {location.workerFriendly}/5
        </span>
      </div>

      {/* Wifi */}
      <div className="text-sm mb-3">
        {wifiDisplay(location.hasWifi, location.wifiConfidence)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {location.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Review snippets */}
      {location.reviewSnippets.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {location.reviewSnippets.slice(0, 2).map((snippet, i) => (
            <p key={i} className="text-xs text-gray-400 leading-snug line-clamp-2">
              {snippet.text.length > 100 ? snippet.text.slice(0, 100) + "..." : snippet.text}
            </p>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex gap-3 pt-2 border-t border-white/10">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          Get Directions
        </a>
        <a
          href={`/spot/${location.slug}`}
          className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          style={{ backgroundColor: accentColor + "33", color: accentColor }}
        >
          See Details
        </a>
      </div>
    </div>
  );
}
