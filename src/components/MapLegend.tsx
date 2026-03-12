"use client";

export default function MapLegend() {
  return (
    <div className="absolute top-[68px] right-3 z-10 bg-[#1a1a1a]/90 backdrop-blur-sm rounded-lg px-3 py-2.5 flex flex-col gap-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E69F00] flex-shrink-0" />
        <span className="text-gray-300">Coffee</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#0072B2] flex-shrink-0" />
        <span className="text-gray-300">Beer / Brewery</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#CC79A7] flex-shrink-0" />
        <span className="text-gray-300">Both</span>
      </div>
    </div>
  );
}
