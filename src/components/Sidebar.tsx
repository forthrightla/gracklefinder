"use client";

import { useState } from "react";
import { Location } from "@/lib/types";
import { getMarkerColor } from "@/lib/colors";
import { Filters, SortOption, DEFAULT_FILTERS } from "@/lib/filters";

interface SidebarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  filteredLocations: Location[];
  totalCount: number;
  onLocationClick: (location: Location) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PillToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
        active
          ? "bg-[#9b5de5] text-white"
          : "bg-white/10 text-gray-400 hover:bg-white/15"
      }`}
    >
      <span
        className={`w-3 h-3 rounded-full border-2 transition-colors duration-200 ${
          active ? "bg-white border-white" : "border-gray-500"
        }`}
      />
      {label}
    </button>
  );
}

function VibeSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? null : n)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors duration-200 ${
            value !== null && n <= value
              ? "bg-[#9b5de5] text-white"
              : "bg-white/10 text-gray-400 hover:bg-white/15"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function LocationCard({
  location,
  onClick,
}: {
  location: Location;
  onClick: () => void;
}) {
  const color = getMarkerColor(location.tags);
  const topTag = location.tags[0] || "";

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 flex-shrink-0 card-glow"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#e8e8e8] leading-tight">
          {location.name}
        </h4>
        <span
          className="text-lg font-bold flex-shrink-0 leading-none"
          style={{ color }}
        >
          {location.grackleScore}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
        <span title={location.hasWifi ? "Has Wifi" : "No Wifi info"}>
          {location.hasWifi ? (
            <span className="text-green-400">&#x2630;</span>
          ) : (
            <span className="text-gray-600">&#x2630;</span>
          )}
        </span>
        <span title={`Worker Friendly: ${location.workerFriendly}/5`}>
          {"💻".repeat(Math.min(location.workerFriendly, 3))}
          {location.workerFriendly > 3 && "+"}
        </span>
        {location.hasPatio && (
          <span className="text-green-400" title="Has Patio">
            &#9728;
          </span>
        )}
      </div>

      {topTag && (
        <span
          className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color + "22", color }}
        >
          {topTag}
        </span>
      )}
    </button>
  );
}

function LocationCardCompact({
  location,
  onClick,
}: {
  location: Location;
  onClick: () => void;
}) {
  const color = getMarkerColor(location.tags);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[180px] p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 text-left card-glow"
    >
      <h4 className="text-xs font-semibold text-[#e8e8e8] leading-tight truncate">
        {location.name}
      </h4>
      <div className="flex items-center justify-between mt-1">
        <span className="text-lg font-bold leading-none" style={{ color }}>
          {location.grackleScore}
        </span>
        <span className="text-[10px] text-gray-400">
          {"💻".repeat(Math.min(location.workerFriendly, 3))}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared filter controls (used by both desktop and mobile)
// ---------------------------------------------------------------------------

function FilterControls({
  filters,
  update,
}: {
  filters: Filters;
  update: (p: Partial<Filters>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <PillToggle
          label="Has Wifi"
          active={filters.hasWifi}
          onToggle={() => update({ hasWifi: !filters.hasWifi })}
        />
        <PillToggle
          label="Worker Friendly 4+"
          active={filters.workerFriendly4Plus}
          onToggle={() =>
            update({ workerFriendly4Plus: !filters.workerFriendly4Plus })
          }
        />
        <PillToggle
          label="Has Patio"
          active={filters.hasPatio}
          onToggle={() => update({ hasPatio: !filters.hasPatio })}
        />
        <PillToggle
          label="Coffee"
          active={filters.coffee}
          onToggle={() => update({ coffee: !filters.coffee })}
        />
        <PillToggle
          label="Beer Garden"
          active={filters.beerGarden}
          onToggle={() => update({ beerGarden: !filters.beerGarden })}
        />
        <PillToggle
          label="Both Coffee & Beer"
          active={filters.both}
          onToggle={() => update({ both: !filters.both })}
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Minimum Vibe Score
        </label>
        <VibeSelector
          value={filters.minVibe}
          onChange={(v) => update({ minVibe: v })}
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Sort by</label>
        <select
          value={filters.sort}
          onChange={(e) => update({ sort: e.target.value as SortOption })}
          className="w-full bg-white/10 text-sm text-[#e8e8e8] rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#9b5de5]/50 appearance-none"
        >
          <option value="grackle" className="bg-[#1a1a1a]">Best Grackle Score</option>
          <option value="worker" className="bg-[#1a1a1a]">Best for Working</option>
          <option value="vibe" className="bg-[#1a1a1a]">Highest Vibe</option>
          <option value="name" className="bg-[#1a1a1a]">Name A-Z</option>
        </select>
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search by name or tag..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/10 text-sm text-[#e8e8e8] placeholder-gray-500 rounded-lg pl-9 pr-8 py-2 outline-none focus:ring-1 focus:ring-[#9b5de5]/50"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-lg leading-none"
        >
          &times;
        </button>
      )}
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onReset,
}: {
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-400 mb-3">
        No spots match your filters
      </p>
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="text-xs px-4 py-1.5 rounded-lg bg-[#9b5de5]/20 text-[#9b5de5] hover:bg-[#9b5de5]/30 transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar({
  filters,
  onFiltersChange,
  filteredLocations,
  totalCount,
  onLocationClick,
}: SidebarProps) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const update = (partial: Partial<Filters>) =>
    onFiltersChange({ ...filters, ...partial });

  const hasActiveFilters =
    filters.search !== "" ||
    filters.hasWifi ||
    filters.workerFriendly4Plus ||
    !filters.hasPatio ||
    filters.coffee ||
    filters.beerGarden ||
    filters.both ||
    filters.minVibe !== null ||
    filters.sort !== "grackle";

  const resetFilters = () => onFiltersChange(DEFAULT_FILTERS);

  return (
    <>
      {/* ================================================================ */}
      {/* DESKTOP SIDEBAR                                                  */}
      {/* ================================================================ */}
      <div className="hidden md:block fixed top-14 left-0 z-20" style={{ height: "calc(100% - 56px)" }}>
        {/* Toggle button */}
        <button
          onClick={() => setDesktopOpen(!desktopOpen)}
          className="absolute top-3 z-30 w-10 h-10 rounded-r-lg flex items-center justify-center bg-[#1a1a1a]/95 hover:bg-[#252525] transition-all duration-300 border border-l-0 border-[#9b5de5]/30"
          style={{
            left: desktopOpen ? "360px" : "0px",
            transition: "left 300ms ease",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9b5de5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {desktopOpen ? (
              <polyline points="15 18 9 12 15 6" />
            ) : (
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            )}
          </svg>
        </button>

        {/* Panel */}
        <div
          className="h-full w-[360px] border-r border-[#9b5de5]/30 flex flex-col transition-transform duration-300 ease-in-out"
          style={{
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            transform: desktopOpen ? "translateX(0)" : "translateX(-100%)",
          }}
        >
          {/* Title */}
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-lg font-heading font-bold text-[#e8e8e8]">
              <span style={{ color: "#9b5de5" }}>Grackle</span>finder
            </h1>
          </div>

          {/* Search */}
          <div className="px-4 pb-2">
            <SearchInput
              value={filters.search}
              onChange={(v) => update({ search: v })}
            />
          </div>

          {/* Result count */}
          <div className="px-4 pb-2 text-xs text-gray-500">
            Showing {filteredLocations.length} of {totalCount} spots
          </div>

          {/* Filters */}
          <div className="px-4 pb-3 border-b border-white/10">
            <FilterControls filters={filters} update={update} />
          </div>

          {/* Location list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {filteredLocations.length === 0 ? (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onReset={resetFilters}
              />
            ) : (
              filteredLocations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  onClick={() => onLocationClick(loc)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* MOBILE BOTTOM SHEET                                              */}
      {/* ================================================================ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
        <div
          className="border-t border-[#9b5de5]/30 transition-all duration-300 ease-in-out flex flex-col"
          style={{
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            maxHeight: mobileExpanded ? "80vh" : "180px",
          }}
        >
          {/* Drag handle */}
          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="w-full flex justify-center py-2"
          >
            <div className="w-10 h-1 rounded-full bg-gray-600" />
          </button>

          {/* Search + count */}
          <div className="px-4 pb-2">
            <SearchInput
              value={filters.search}
              onChange={(v) => update({ search: v })}
            />
            <div className="text-xs text-gray-500 mt-1">
              Showing {filteredLocations.length} of {totalCount} spots
            </div>
          </div>

          {/* Collapsed: horizontal scroll cards */}
          {!mobileExpanded && (
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
              {filteredLocations.length === 0 ? (
                <div className="flex-shrink-0 text-sm text-gray-400 py-2">
                  No spots match
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="ml-2 text-[#9b5de5] underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              ) : (
                filteredLocations.map((loc) => (
                  <LocationCardCompact
                    key={loc.id}
                    location={loc}
                    onClick={() => onLocationClick(loc)}
                  />
                ))
              )}
            </div>
          )}

          {/* Expanded: full filters + vertical list */}
          {mobileExpanded && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pb-3 border-b border-white/10">
                <FilterControls filters={filters} update={update} />
              </div>

              <div className="px-4 py-3 space-y-2">
                {filteredLocations.length === 0 ? (
                  <EmptyState
                    hasActiveFilters={hasActiveFilters}
                    onReset={resetFilters}
                  />
                ) : (
                  filteredLocations.map((loc) => (
                    <LocationCard
                      key={loc.id}
                      location={loc}
                      onClick={() => {
                        onLocationClick(loc);
                        setMobileExpanded(false);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
