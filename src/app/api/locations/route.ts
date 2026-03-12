import { NextRequest, NextResponse } from "next/server";
import { getAllLocations } from "@/lib/data";
import { computeGrackleScore } from "@/lib/scoring";
import { Location } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Read all locations and compute fresh scores
    const rawLocations = await getAllLocations();
    const allLocations = rawLocations.map((loc) => ({
      ...loc,
      grackleScore: computeGrackleScore(loc),
    }));

    const total = allLocations.length;
    let filtered: Location[] = allLocations;

    // --- Filters ---

    if (searchParams.get("hasWifi") === "true") {
      filtered = filtered.filter((loc) => loc.hasWifi === true);
    }

    const minWorker = searchParams.get("minWorkerScore");
    if (minWorker) {
      const n = parseInt(minWorker, 10);
      if (!isNaN(n)) {
        filtered = filtered.filter((loc) => loc.workerFriendly >= n);
      }
    }

    const minVibe = searchParams.get("minVibeScore");
    if (minVibe) {
      const n = parseInt(minVibe, 10);
      if (!isNaN(n)) {
        filtered = filtered.filter((loc) => loc.vibeScore >= n);
      }
    }

    const tagsParam = searchParams.get("tags");
    if (tagsParam) {
      const requestedTags = tagsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (requestedTags.length > 0) {
        filtered = filtered.filter((loc) =>
          loc.tags.some((t) => requestedTags.includes(t.toLowerCase()))
        );
      }
    }

    const search = searchParams.get("search");
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // --- Sort ---

    const sort = searchParams.get("sort") || "grackleScore";
    switch (sort) {
      case "workerFriendly":
        filtered.sort((a, b) => b.workerFriendly - a.workerFriendly);
        break;
      case "vibeScore":
        filtered.sort((a, b) => b.vibeScore - a.vibeScore);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "grackleScore":
      default:
        filtered.sort((a, b) => b.grackleScore - a.grackleScore);
        break;
    }

    return NextResponse.json(
      { locations: filtered, total, filtered: filtered.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/locations error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
