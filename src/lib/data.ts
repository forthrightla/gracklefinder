import { Redis } from "@upstash/redis";
import { Location } from "./types";

const kv = Redis.fromEnv();

// ---------------------------------------------------------------------------
// Key schema:
//   "locations:all"       → Set of all slugs
//   "location:{slug}"     → Hash containing the full Location object as JSON
// ---------------------------------------------------------------------------

const ALL_KEY = "locations:all";
function locKey(slug: string): string {
  return `location:${slug}`;
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export async function getAllLocations(): Promise<Location[]> {
  const slugs = await kv.smembers(ALL_KEY);
  if (!slugs || slugs.length === 0) return [];

  const pipeline = kv.pipeline();
  for (const slug of slugs) {
    pipeline.get(locKey(slug as string));
  }
  const results = await pipeline.exec();

  return results.filter((r): r is Location => r !== null);
}

export async function getLocationBySlug(
  slug: string
): Promise<Location | undefined> {
  const data = await kv.get<Location>(locKey(slug));
  return data ?? undefined;
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

export async function updateLocation(
  id: string,
  partial: Partial<Location>
): Promise<Location | undefined> {
  // We need to find the location by id — scan all
  const all = await getAllLocations();
  const existing = all.find((loc) => loc.id === id);
  if (!existing) return undefined;

  const updated = { ...existing, ...partial };
  // If slug changed, clean up old key
  if (partial.slug && partial.slug !== existing.slug) {
    await kv.srem(ALL_KEY, existing.slug);
    await kv.del(locKey(existing.slug));
  }
  await kv.set(locKey(updated.slug), updated);
  await kv.sadd(ALL_KEY, updated.slug);
  return updated;
}

export async function addLocation(location: Location): Promise<Location> {
  await kv.set(locKey(location.slug), location);
  await kv.sadd(ALL_KEY, location.slug);
  return location;
}

export async function upsertLocations(
  incoming: Location[],
  matchFn: (existing: Location, candidate: Location) => boolean
): Promise<{ added: number; updated: number; skipped: number }> {
  const existing = await getAllLocations();
  let added = 0;
  let updated = 0;
  const skipped = 0;

  const pipeline = kv.pipeline();
  const slugsToAdd: string[] = [];

  for (const candidate of incoming) {
    const existingIdx = existing.findIndex((loc) => matchFn(loc, candidate));
    if (existingIdx === -1) {
      pipeline.set(locKey(candidate.slug), candidate);
      slugsToAdd.push(candidate.slug);
      added++;
    } else {
      const ex = existing[existingIdx];
      const existingTexts = new Set(ex.reviewSnippets.map((r) => r.text));
      const newSnippets = candidate.reviewSnippets.filter(
        (r) => !existingTexts.has(r.text)
      );
      const merged: Location = {
        ...ex,
        reviewSnippets: [...ex.reviewSnippets, ...newSnippets],
        sourceLinks: Array.from(
          new Set([...ex.sourceLinks, ...candidate.sourceLinks])
        ),
        lastUpdated: candidate.lastUpdated,
      };
      pipeline.set(locKey(merged.slug), merged);
      slugsToAdd.push(merged.slug);
      // Update in-memory copy so subsequent matches work
      existing[existingIdx] = merged;
      updated++;
    }
  }

  for (const slug of slugsToAdd) {
    pipeline.sadd(ALL_KEY, slug);
  }

  await pipeline.exec();
  return { added, updated, skipped };
}
