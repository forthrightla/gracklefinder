// Colorblind-safe palette (Wong palette derivatives)
// Tested for deuteranopia, protanopia, and tritanopia
export const COLORS = {
  coffee: "#E69F00",      // warm amber
  beer: "#0072B2",        // strong blue
  both: "#CC79A7",        // pink/mauve
} as const;

export function getMarkerColor(tags: string[]): string {
  if (tags.includes("both")) return COLORS.both;
  if (tags.includes("beer-garden")) return COLORS.beer;
  return COLORS.coffee;
}
