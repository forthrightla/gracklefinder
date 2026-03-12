import { Location } from "./types";

export type SortOption = "grackle" | "worker" | "vibe" | "name";

export interface Filters {
  search: string;
  hasWifi: boolean;
  workerFriendly4Plus: boolean;
  hasPatio: boolean;
  coffee: boolean;
  beerGarden: boolean;
  both: boolean;
  minVibe: number | null;
  sort: SortOption;
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  hasWifi: false,
  workerFriendly4Plus: false,
  hasPatio: true,
  coffee: false,
  beerGarden: false,
  both: false,
  minVibe: null,
  sort: "grackle",
};

export function applyFilters(
  locations: Location[],
  filters: Filters
): Location[] {
  let result = locations;

  // Text search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Toggle filters
  if (filters.hasWifi) {
    result = result.filter((loc) => loc.hasWifi === true);
  }
  if (filters.workerFriendly4Plus) {
    result = result.filter((loc) => loc.workerFriendly >= 4);
  }
  if (filters.hasPatio) {
    result = result.filter((loc) => loc.hasPatio);
  }
  if (filters.coffee) {
    result = result.filter((loc) => loc.tags.includes("coffee"));
  }
  if (filters.beerGarden) {
    result = result.filter((loc) => loc.tags.includes("beer-garden"));
  }
  if (filters.both) {
    result = result.filter((loc) => loc.tags.includes("both"));
  }

  // Vibe minimum
  if (filters.minVibe !== null) {
    result = result.filter((loc) => loc.vibeScore >= filters.minVibe!);
  }

  // Sort
  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "grackle":
        return b.grackleScore - a.grackleScore;
      case "worker":
        return b.workerFriendly - a.workerFriendly;
      case "vibe":
        return b.vibeScore - a.vibeScore;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return result;
}
