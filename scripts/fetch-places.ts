import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import {
  getAllLocations,
  upsertLocations,
  generateSlug,
} from "../src/lib/data";
import type { Location, ReviewSnippet } from "../src/lib/types";
import {
  sleep,
  normalizeName,
  haversineMeters,
  loadProgress,
  saveProgress,
  clearProgress,
  comboKey,
  logError,
  FetchProgress,
} from "../src/lib/pipeline-utils";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// Zone definitions
// ---------------------------------------------------------------------------

interface Zone {
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
}

const ZONES: Zone[] = [
  // Core Austin (3km)
  { name: "Downtown", lat: 30.2672, lng: -97.7431, radius: 3000 },
  { name: "East Austin / East Cesar Chavez", lat: 30.2621, lng: -97.7206, radius: 3000 },
  { name: "South Congress", lat: 30.2487, lng: -97.7489, radius: 3000 },
  { name: "South Lamar / Zilker", lat: 30.2401, lng: -97.7713, radius: 3000 },
  { name: "South First", lat: 30.2435, lng: -97.7577, radius: 3000 },
  { name: "North Loop / Hyde Park", lat: 30.3074, lng: -97.7227, radius: 3000 },
  { name: "Mueller", lat: 30.2986, lng: -97.7023, radius: 3000 },
  { name: "East Riverside / Oltorf", lat: 30.2375, lng: -97.7280, radius: 3000 },
  { name: "Manor Road / Cherrywood", lat: 30.2810, lng: -97.7150, radius: 3000 },
  { name: "Burnet Road / Allandale", lat: 30.3280, lng: -97.7394, radius: 3000 },
  { name: "Clarksville / Tarrytown", lat: 30.2850, lng: -97.7600, radius: 3000 },
  { name: "Rainey Street / East Downtown", lat: 30.2560, lng: -97.7380, radius: 3000 },
  { name: "Crestview / Brentwood", lat: 30.3350, lng: -97.7300, radius: 3000 },
  { name: "West Campus / UT Area", lat: 30.2880, lng: -97.7430, radius: 3000 },
  { name: "MLK / Rosewood", lat: 30.2750, lng: -97.7100, radius: 3000 },

  // North Austin / Suburbs (5km)
  { name: "The Domain / North Burnet", lat: 30.4020, lng: -97.7253, radius: 5000 },
  { name: "Anderson Mill / 183 Corridor", lat: 30.4450, lng: -97.8050, radius: 5000 },
  { name: "Cedar Park", lat: 30.5083, lng: -97.8206, radius: 5000 },
  { name: "Leander", lat: 30.5789, lng: -97.8531, radius: 5000 },
  { name: "Round Rock", lat: 30.5083, lng: -97.6789, radius: 5000 },
  { name: "Pflugerville", lat: 30.4394, lng: -97.6200, radius: 5000 },
  { name: "Georgetown", lat: 30.6333, lng: -97.6781, radius: 5000 },
  { name: "Hutto", lat: 30.5374, lng: -97.5467, radius: 5000 },
  { name: "Liberty Hill", lat: 30.6641, lng: -97.9206, radius: 5000 },

  // South Austin / Suburbs (5km)
  { name: "St. Elmo / South Park Meadows", lat: 30.1950, lng: -97.7700, radius: 5000 },
  { name: "Manchaca / Slaughter Lane", lat: 30.1600, lng: -97.8300, radius: 5000 },
  { name: "Buda", lat: 30.0852, lng: -97.8403, radius: 5000 },
  { name: "Kyle", lat: 29.9889, lng: -97.8772, radius: 5000 },
  { name: "San Marcos", lat: 29.8833, lng: -97.9414, radius: 5000 },

  // East (5km)
  { name: "Del Valle / COTA", lat: 30.1950, lng: -97.6350, radius: 5000 },
  { name: "Elgin", lat: 30.3497, lng: -97.3703, radius: 5000 },
  { name: "Bastrop", lat: 30.1105, lng: -97.3153, radius: 5000 },
  { name: "Taylor", lat: 30.5706, lng: -97.4094, radius: 5000 },

  // West / Hill Country (8km)
  { name: "Bee Cave / Lakeway", lat: 30.3083, lng: -97.9400, radius: 8000 },
  { name: "Dripping Springs", lat: 30.1902, lng: -98.0867, radius: 8000 },
  { name: "Westlake / Barton Creek", lat: 30.2980, lng: -97.8100, radius: 8000 },
  { name: "Lago Vista / Jonestown", lat: 30.4600, lng: -97.9900, radius: 8000 },
  { name: "Marble Falls", lat: 30.5783, lng: -98.2750, radius: 8000 },
  { name: "Burnet (town)", lat: 30.7583, lng: -98.2283, radius: 8000 },
  { name: "Johnson City", lat: 30.2769, lng: -98.4122, radius: 8000 },
  { name: "Blanco", lat: 30.0972, lng: -98.4217, radius: 8000 },
  { name: "Wimberley", lat: 29.9975, lng: -98.0986, radius: 8000 },
  { name: "Fredericksburg", lat: 30.2752, lng: -98.8720, radius: 8000 },
  { name: "Stonewall / Hye", lat: 30.2400, lng: -98.5800, radius: 8000 },
  { name: "Llano", lat: 30.7497, lng: -98.6822, radius: 8000 },
  { name: "Comfort", lat: 29.9675, lng: -98.9053, radius: 8000 },
  { name: "Boerne", lat: 29.7947, lng: -98.7320, radius: 8000 },
  { name: "New Braunfels", lat: 29.7030, lng: -98.1245, radius: 8000 },
  { name: "Lockhart", lat: 29.8849, lng: -97.6700, radius: 8000 },
  { name: "Gruene", lat: 29.7389, lng: -98.1053, radius: 8000 },
];

// ---------------------------------------------------------------------------
// Search queries
// ---------------------------------------------------------------------------

const SEARCH_QUERIES = [
  "coffee shop with patio",
  "beer garden",
  "coffee and beer outdoor seating",
  "laptop friendly cafe",
  "brewery with patio",
  "taproom outdoor seating",
  "cafe with outdoor seating",
  "coworking coffee",
  "beer garden with food trucks",
  "dog friendly patio bar",
  "shaded patio cafe",
  "coffee shop with wifi",
  "craft brewery outdoor",
  "wine bar with patio",
  "coffee roaster cafe",
];

// ---------------------------------------------------------------------------
// Cost tracking
// ---------------------------------------------------------------------------

// Prices are at Pro tier (reviews field triggers Pro billing)
// First 5,000 Text Search / 5,000 Place Details per month are free
const COST_TEXT_SEARCH = 0.032;
const COST_PLACE_DETAILS = 0.017;
const FREE_TEXT_SEARCH = 5000;
const FREE_PLACE_DETAILS = 5000;

interface CostTracker {
  textSearchCalls: number;
  placeDetailsCalls: number;
}

function estimatedCost(tracker: CostTracker): number {
  const billableSearch = Math.max(0, tracker.textSearchCalls - FREE_TEXT_SEARCH);
  const billableDetails = Math.max(0, tracker.placeDetailsCalls - FREE_PLACE_DETAILS);
  return billableSearch * COST_TEXT_SEARCH + billableDetails * COST_PLACE_DETAILS;
}

function costBreakdown(tracker: CostTracker): string {
  const billableSearch = Math.max(0, tracker.textSearchCalls - FREE_TEXT_SEARCH);
  const billableDetails = Math.max(0, tracker.placeDetailsCalls - FREE_PLACE_DETAILS);
  const lines = [
    `Text Search calls:    ${tracker.textSearchCalls} (${Math.min(tracker.textSearchCalls, FREE_TEXT_SEARCH)} free, ${billableSearch} billed @ $${COST_TEXT_SEARCH})`,
    `Place Details calls:  ${tracker.placeDetailsCalls} (${Math.min(tracker.placeDetailsCalls, FREE_PLACE_DETAILS)} free, ${billableDetails} billed @ $${COST_PLACE_DETAILS})`,
    `Total estimated cost: $${estimatedCost(tracker).toFixed(2)}`,
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Keyword scanning & inference
// ---------------------------------------------------------------------------

const KEYWORDS = [
  // wifi / connectivity
  "wifi", "wi-fi", "internet",
  // outdoor
  "patio", "outdoor", "outside seating",
  // work-friendliness
  "laptop", "work from", "remote work", "plug", "outlet",
  // vibe signals (positive)
  "live music", "food truck", "dog friendly", "pet friendly",
  "cozy", "chill", "vibe", "atmosphere", "unique", "gem", "hidden gem",
  "beautiful", "gorgeous", "trendy", "hip", "artsy",
  "garden", "shade", "shaded", "creek", "views", "scenic",
  // vibe signals (negative — chain/generic feel)
  "starbucks", "chain", "generic", "crowded", "loud", "noisy",
  "dirty", "slow service", "rude",
] as const;

interface KeywordHits { [keyword: string]: number }

function scanKeywords(texts: string[]): KeywordHits {
  const hits: KeywordHits = {};
  for (const kw of KEYWORDS) hits[kw] = 0;
  for (const text of texts) {
    const lower = text.toLowerCase();
    for (const kw of KEYWORDS) {
      const regex = new RegExp(kw.replace(/-/g, "[-\\s]?"), "gi");
      const matches = lower.match(regex);
      if (matches) hits[kw] += matches.length;
    }
  }
  return hits;
}

function inferWifi(hits: KeywordHits): {
  hasWifi: boolean | null;
  wifiConfidence: Location["wifiConfidence"];
} {
  const wifiHits =
    (hits["wifi"] || 0) + (hits["wi-fi"] || 0) + (hits["internet"] || 0);
  if (wifiHits >= 3) return { hasWifi: true, wifiConfidence: "high" };
  if (wifiHits >= 1) return { hasWifi: true, wifiConfidence: "medium" };
  return { hasWifi: null, wifiConfidence: "unknown" };
}

function inferHasPatio(hits: KeywordHits): boolean {
  return (
    (hits["patio"] || 0) +
    (hits["outdoor"] || 0) +
    (hits["outside seating"] || 0) >= 1
  );
}

function inferWorkerFriendly(hits: KeywordHits): number {
  const workHits =
    (hits["laptop"] || 0) + (hits["work from"] || 0) +
    (hits["remote work"] || 0) + (hits["plug"] || 0) + (hits["outlet"] || 0);
  if (workHits >= 5) return 5;
  if (workHits >= 3) return 4;
  if (workHits >= 1) return 3;
  return 2;
}

function inferTags(name: string, hits: KeywordHits, editorialSummary: string): string[] {
  const tags: string[] = [];
  const combined = `${name} ${editorialSummary}`.toLowerCase();

  const isCoffee =
    combined.includes("coffee") || combined.includes("cafe") || combined.includes("café");
  const isBeer =
    combined.includes("beer") || combined.includes("brew") ||
    combined.includes("tap") || combined.includes("brewery");

  if (isCoffee) tags.push("coffee");
  if (isBeer) tags.push("beer-garden");
  if (isCoffee && isBeer) tags.push("both");

  if (inferHasPatio(hits) || combined.includes("patio") || combined.includes("garden"))
    tags.push("shaded-patio");
  if (combined.includes("dog") || combined.includes("pet"))
    tags.push("dog-friendly");
  if (combined.includes("food truck") || combined.includes("food-truck"))
    tags.push("food-trucks");

  return Array.from(new Set(tags));
}

function inferVibeScore(rating: number | undefined, hits: KeywordHits): number {
  // Start with a conservative baseline from Google rating
  // Most places are 4.0-4.7 on Google — don't let that auto-inflate
  let score = 2; // default: "fine, nothing special"
  if (rating && rating >= 4.3) score = 3; // above average
  if (rating && rating < 3.0) score = 1;  // below average

  // Positive vibe signals from actual review text push the score up
  const positiveHits =
    (hits["live music"] || 0) + (hits["food truck"] || 0) +
    (hits["cozy"] || 0) + (hits["chill"] || 0) + (hits["vibe"] || 0) +
    (hits["atmosphere"] || 0) + (hits["unique"] || 0) + (hits["gem"] || 0) +
    (hits["hidden gem"] || 0) + (hits["beautiful"] || 0) +
    (hits["gorgeous"] || 0) + (hits["trendy"] || 0) + (hits["hip"] || 0) +
    (hits["artsy"] || 0) + (hits["garden"] || 0) + (hits["shade"] || 0) +
    (hits["shaded"] || 0) + (hits["creek"] || 0) + (hits["views"] || 0) +
    (hits["scenic"] || 0) + (hits["dog friendly"] || 0) +
    (hits["pet friendly"] || 0);

  // Negative signals pull it down
  const negativeHits =
    (hits["chain"] || 0) + (hits["generic"] || 0) + (hits["dirty"] || 0) +
    (hits["slow service"] || 0) + (hits["rude"] || 0) +
    (hits["starbucks"] || 0);

  // Positive signals: need multiple mentions to earn higher scores
  if (positiveHits >= 8) score = Math.max(score, 5);
  else if (positiveHits >= 5) score = Math.max(score, 4);
  else if (positiveHits >= 2) score = Math.max(score, 3);

  // Negative signals drag it down
  if (negativeHits >= 3) score = Math.min(score, 2);
  else if (negativeHits >= 1) score = Math.min(score, 3);

  return Math.min(5, Math.max(1, score));
}

// ---------------------------------------------------------------------------
// Google Places API types & helpers
// ---------------------------------------------------------------------------

const BASE_URL = "https://maps.googleapis.com/maps/api/place";
const TEXT_SEARCH_DELAY = 200;
const DETAILS_DELAY = 100;
const MAX_PAGES = 3;

/** Lightweight record captured in Phase 1 (Text Search). No Details call. */
interface DiscoveredPlace {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  /** Which search query first surfaced this place (useful for debugging). */
  discoveredVia: string;
  /** Which zone first surfaced this place. */
  discoveredInZone: string;
}

interface PlaceReview {
  text?: string;
  rating?: number;
  author_name?: string;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  reviews?: PlaceReview[];
  current_opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  editorial_summary?: { overview?: string };
}

class FatalApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FatalApiError";
  }
}

async function fetchWithBackoff(
  url: string,
  attempt = 0
): Promise<Response> {
  const res = await fetch(url);

  if (res.status === 429) {
    if (attempt >= 5) {
      throw new Error("Rate limit: max retries exceeded");
    }
    const backoff = Math.pow(2, attempt + 1) * 1000;
    console.log(`      Rate limited (429), backing off ${backoff / 1000}s...`);
    await sleep(backoff);
    return fetchWithBackoff(url, attempt + 1);
  }

  if (res.status === 403 || res.status === 400) {
    const body = await res.text();
    if (
      body.includes("API key") ||
      body.includes("quota") ||
      body.includes("billing")
    ) {
      throw new FatalApiError(
        `API key invalid or quota exceeded (HTTP ${res.status}): ${body.slice(0, 200)}`
      );
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res;
}

function checkApiStatus(data: { status: string; error_message?: string }): void {
  if (data.status === "REQUEST_DENIED" || data.status === "OVER_QUERY_LIMIT") {
    throw new FatalApiError(
      `API error: ${data.status} - ${data.error_message || "Check API key and billing"}`
    );
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Text Search — collect place_ids
// ---------------------------------------------------------------------------

interface TextSearchPage {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address?: string;
    geometry?: { location: { lat: number; lng: number } };
    rating?: number;
  }>;
  nextPageToken?: string;
}

async function textSearch(
  query: string,
  zone: Zone,
  apiKey: string,
  pageToken?: string
): Promise<TextSearchPage> {
  const params = new URLSearchParams({
    query,
    key: apiKey,
    location: `${zone.lat},${zone.lng}`,
    radius: String(zone.radius),
    type: "establishment",
  });
  if (pageToken) params.set("pagetoken", pageToken);

  const url = `${BASE_URL}/textsearch/json?${params}`;
  const res = await fetchWithBackoff(url);
  const data = await res.json();

  checkApiStatus(data);

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Text Search API: ${data.status} - ${data.error_message || ""}`);
  }

  return {
    results: data.results || [],
    nextPageToken: data.next_page_token || undefined,
  };
}

// ---------------------------------------------------------------------------
// Phase 2: Place Details — enrich unique places
// ---------------------------------------------------------------------------

async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails | null> {
  const fields = [
    "place_id", "name", "formatted_address", "geometry",
    "rating", "reviews", "current_opening_hours", "editorial_summary",
  ].join(",");

  const params = new URLSearchParams({ place_id: placeId, key: apiKey, fields });
  const url = `${BASE_URL}/details/json?${params}`;
  const res = await fetchWithBackoff(url);
  const data = await res.json();

  checkApiStatus(data);

  if (data.status !== "OK") {
    throw new Error(`Place Details API: ${data.status} - ${data.error_message || ""}`);
  }

  return data.result as PlaceDetails;
}

// ---------------------------------------------------------------------------
// Build Location from PlaceDetails
// ---------------------------------------------------------------------------

function buildLocation(details: PlaceDetails, hits: KeywordHits): Location {
  const editorialText = details.editorial_summary?.overview || "";
  const wifi = inferWifi(hits);

  const reviewSnippets: ReviewSnippet[] = (details.reviews || [])
    .filter((r) => r.text && r.text.length > 20)
    .slice(0, 5)
    .map((r) => ({ text: r.text!, source: "google" as const }));

  const hours = details.current_opening_hours?.weekday_text
    ? details.current_opening_hours.weekday_text.join(", ")
    : "";

  const tags = inferTags(details.name, hits, editorialText);

  return {
    id: `loc_${nanoid(10)}`,
    name: details.name,
    slug: generateSlug(details.name),
    address: details.formatted_address,
    lat: details.geometry.location.lat,
    lng: details.geometry.location.lng,
    hasWifi: wifi.hasWifi,
    wifiConfidence: wifi.wifiConfidence,
    hasPatio: inferHasPatio(hits),
    workerFriendly: inferWorkerFriendly(hits),
    vibeScore: inferVibeScore(details.rating, hits),
    grackleScore: 0,
    tags,
    hours,
    sourceLinks: [
      `https://www.google.com/maps/place/?q=place_id:${details.place_id}`,
    ],
    reviewSnippets,
    aiAssessment: null,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

// ---------------------------------------------------------------------------
// Deduplication helpers
// ---------------------------------------------------------------------------

function isMatch(existing: Location, candidate: Location): boolean {
  if (normalizeName(existing.name) === normalizeName(candidate.name)) return true;
  return haversineMeters(existing.lat, existing.lng, candidate.lat, candidate.lng) <= 50;
}

function needsUpdate(location: Location, daysStaleness: number): boolean {
  if (!location.lastUpdated) return true;
  const diffMs = Date.now() - new Date(location.lastUpdated).getTime();
  return diffMs / (1000 * 60 * 60 * 24) >= daysStaleness;
}

/** Check if a discovered place matches an existing DB location. */
function findExisting(
  discovered: DiscoveredPlace,
  existingLocations: Location[]
): Location | undefined {
  const candName = normalizeName(discovered.name);
  return existingLocations.find((loc) => {
    if (normalizeName(loc.name) === candName) return true;
    return haversineMeters(loc.lat, loc.lng, discovered.lat, discovered.lng) <= 50;
  });
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliOptions {
  dryRun: boolean;
  zoneFilter: string[];
  resume: boolean;
  queriesOnly: string[];
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    zoneFilter: [],
    resume: false,
    queriesOnly: [],
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--resume") {
      opts.resume = true;
    } else if (arg === "--zone" && i + 1 < argv.length) {
      i++;
      opts.zoneFilter = argv[i].split(",").map((s) => s.trim().toLowerCase());
    } else if (arg === "--queries-only" && i + 1 < argv.length) {
      i++;
      opts.queriesOnly = argv[i].split(",").map((s) => s.trim().toLowerCase());
    }
  }

  return opts;
}

function filterZones(zones: Zone[], zoneFilter: string[]): Zone[] {
  if (zoneFilter.length === 0) return zones;
  return zones.filter((z) =>
    zoneFilter.some((f) => z.name.toLowerCase().includes(f))
  );
}

function filterQueries(queries: string[], queriesOnly: string[]): string[] {
  if (queriesOnly.length === 0) return queries;
  return queries.filter((q) =>
    queriesOnly.some((f) => q.toLowerCase().includes(f))
  );
}

// ---------------------------------------------------------------------------
// Dry run
// ---------------------------------------------------------------------------

function dryRun(zones: Zone[], queries: string[], existingCount: number): void {
  const totalCombos = zones.length * queries.length;
  // Text Search: ~1.3 pages avg (many Hill Country combos return ZERO_RESULTS)
  const estTextSearchCalls = Math.ceil(totalCombos * 1.3);
  // Unique places: heavy dedup across overlapping zones & queries
  // Core Austin ~15 zones × 15 queries but maybe ~300 unique places
  // Suburbs ~18 zones × 15 queries but maybe ~200 unique places
  // Hill Country ~17 zones × 15 queries but maybe ~100 unique places
  const estUniquePlaces = Math.min(
    Math.ceil(totalCombos * 0.8), // theoretical upper bound
    zones.length * 15 // more realistic: ~15 unique per zone on average
  );
  // After freshness check, only new/stale places need Details
  const estDetailsCalls = Math.max(0, estUniquePlaces - existingCount);

  const cost: CostTracker = {
    textSearchCalls: estTextSearchCalls,
    placeDetailsCalls: estDetailsCalls,
  };

  console.log("=== DRY RUN ===\n");
  console.log(`Zones: ${zones.length}`);
  console.log(`Queries: ${queries.length}`);
  console.log(`Total query+zone combinations: ${totalCombos}`);
  console.log(`Existing locations in DB: ${existingCount}`);
  console.log(`\nEstimated Text Search calls: ~${estTextSearchCalls} (first ${FREE_TEXT_SEARCH} free)`);
  console.log(`Estimated unique places: ~${estUniquePlaces}`);
  console.log(`Estimated Place Details calls: ~${estDetailsCalls} (first ${FREE_PLACE_DETAILS} free)`);
  console.log(`\n${costBreakdown(cost)}\n`);

  console.log(
    "Zone".padEnd(40) + "Radius".padEnd(10) + "Queries"
  );
  console.log("-".repeat(60));

  for (const zone of zones) {
    console.log(
      zone.name.padEnd(40) +
      `${zone.radius / 1000}km`.padEnd(10) +
      String(queries.length)
    );
  }

  console.log(`\nTotal: ${totalCombos} combos`);
}

// ---------------------------------------------------------------------------
// Main pipeline (two-phase)
// ---------------------------------------------------------------------------

export async function runFetchPlaces(
  apiKey?: string,
  cliOpts?: CliOptions
): Promise<{
  processed: number;
  added: number;
  updated: number;
  skipped: number;
}> {
  const key = apiKey || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY not provided");

  const opts = cliOpts || { dryRun: false, zoneFilter: [], resume: false, queriesOnly: [] };

  const activeZones = filterZones(ZONES, opts.zoneFilter);
  const activeQueries = filterQueries(SEARCH_QUERIES, opts.queriesOnly);

  if (activeZones.length === 0) {
    console.error("No zones matched the filter.");
    return { processed: 0, added: 0, updated: 0, skipped: 0 };
  }
  if (activeQueries.length === 0) {
    console.error("No queries matched the filter.");
    return { processed: 0, added: 0, updated: 0, skipped: 0 };
  }

  const existingLocations = await getAllLocations();

  if (opts.dryRun) {
    dryRun(activeZones, activeQueries, existingLocations.length);
    return { processed: 0, added: 0, updated: 0, skipped: 0 };
  }

  console.log(
    `Gracklefinder — Google Places fetch pipeline (two-phase)\n` +
    `Zones: ${activeZones.length}, Queries: ${activeQueries.length}, ` +
    `Combos: ${activeZones.length * activeQueries.length}\n` +
    `Existing locations in DB: ${existingLocations.length}\n`
  );

  // Resume support
  let progress: FetchProgress;
  if (opts.resume) {
    const prev = loadProgress();
    if (prev) {
      console.log(`Resuming run ${prev.runId} (${prev.completedCombos.length} combos already done)\n`);
      progress = prev;
    } else {
      progress = newProgress();
    }
  } else {
    clearProgress();
    progress = newProgress();
  }

  const completedSet = new Set(progress.completedCombos);
  const cost: CostTracker = { textSearchCalls: 0, placeDetailsCalls: 0 };

  // =========================================================================
  // PHASE 1: Discover — collect unique place_ids via Text Search
  // =========================================================================

  console.log("=" .repeat(60));
  console.log("PHASE 1: Discovering places via Text Search");
  console.log("=".repeat(60));

  // Map from place_id → lightweight DiscoveredPlace
  const discovered = new Map<string, DiscoveredPlace>();
  // Re-populate from any previous run's processedPlaceIds (for resume)
  const previouslySeenIds = new Set(progress.processedPlaceIds);
  const zoneDiscoveryCounts = new Map<string, number>();

  try {
    for (let zi = 0; zi < activeZones.length; zi++) {
      const zone = activeZones[zi];
      console.log(`\nZone: ${zone.name} (${zi + 1}/${activeZones.length})`);
      let zoneNewCount = 0;

      for (let qi = 0; qi < activeQueries.length; qi++) {
        const query = activeQueries[qi];
        const ck = comboKey(zone.name, query);

        if (completedSet.has(ck)) continue;

        console.log(`  Query: ${query} (${qi + 1}/${activeQueries.length})`);

        let pageToken: string | undefined;

        try {
          for (let page = 0; page < MAX_PAGES; page++) {
            if (pageToken) await sleep(2000); // Google requires delay before using nextPageToken

            const searchResult = await textSearch(query, zone, key, pageToken);
            cost.textSearchCalls++;

            const results = searchResult.results;
            let newOnPage = 0;

            for (const r of results) {
              if (discovered.has(r.place_id) || previouslySeenIds.has(r.place_id)) continue;

              discovered.set(r.place_id, {
                place_id: r.place_id,
                name: r.name,
                address: r.formatted_address || "",
                lat: r.geometry?.location.lat || 0,
                lng: r.geometry?.location.lng || 0,
                rating: r.rating,
                discoveredVia: query,
                discoveredInZone: zone.name,
              });
              newOnPage++;
              zoneNewCount++;
            }

            console.log(
              `    Page ${page + 1}/${MAX_PAGES}: ${results.length} results, ${newOnPage} new unique`
            );

            if (!searchResult.nextPageToken) break;
            pageToken = searchResult.nextPageToken;
            await sleep(TEXT_SEARCH_DELAY);
          }
        } catch (err) {
          if (err instanceof FatalApiError) throw err;
          const msg = `Phase 1 failed [${zone.name}] "${query}": ${err instanceof Error ? err.message : err}`;
          console.log(`    ERROR: ${msg}`);
          logError(msg);
        }

        // Mark combo done and persist
        progress.completedCombos.push(ck);
        progress.lastUpdated = new Date().toISOString();
        // Save progress periodically (every 5 queries)
        if ((qi + 1) % 5 === 0 || qi === activeQueries.length - 1) {
          progress.processedPlaceIds = Array.from(discovered.keys());
          saveProgress(progress);
        }

        await sleep(TEXT_SEARCH_DELAY);
      }

      zoneDiscoveryCounts.set(zone.name, zoneNewCount);

      // Running total
      console.log(
        `  → ${zoneNewCount} new from this zone, ${discovered.size} unique total ` +
        `[${cost.textSearchCalls} search calls, ~$${estimatedCost(cost).toFixed(2)}]`
      );
    }
  } catch (err) {
    if (err instanceof FatalApiError) {
      console.error(`\nFATAL: ${err.message}`);
      logError(`FATAL: ${err.message}`);
      progress.processedPlaceIds = Array.from(discovered.keys());
      saveProgress(progress);
      console.log("Progress saved. Use --resume to continue.");
    }
    throw err;
  }

  console.log(`\nPhase 1 complete: ${discovered.size} unique places discovered.`);

  // =========================================================================
  // PHASE 2: Enrich — fetch Place Details only for new/stale places
  // =========================================================================

  console.log("\n" + "=".repeat(60));
  console.log("PHASE 2: Enriching with Place Details");
  console.log("=".repeat(60));

  // Filter to only places that are new or stale (14+ days old)
  const toEnrich: DiscoveredPlace[] = [];
  let freshSkipped = 0;

  for (const place of Array.from(discovered.values())) {
    const existing = findExisting(place, existingLocations);
    if (existing && !needsUpdate(existing, 14)) {
      freshSkipped++;
    } else {
      toEnrich.push(place);
    }
  }

  console.log(`\n${discovered.size} unique places discovered`);
  console.log(`${freshSkipped} already fresh in DB (updated <14 days ago) — skipped`);
  console.log(`${toEnrich.length} places need Details calls\n`);

  const allCandidates: Location[] = [];
  let detailsSucceeded = 0;
  let detailsFailed = 0;

  try {
    for (let i = 0; i < toEnrich.length; i++) {
      const place = toEnrich[i];

      if ((i + 1) % 25 === 0 || i === 0) {
        console.log(
          `  Enriching ${i + 1}/${toEnrich.length}... ` +
          `[${cost.placeDetailsCalls} details calls, ~$${estimatedCost(cost).toFixed(2)}]`
        );
      }

      try {
        const details = await getPlaceDetails(place.place_id, key);
        cost.placeDetailsCalls++;

        if (details) {
          // Build keyword scan from all available text: reviews + editorial + name
          const allText: string[] = [details.name];
          if (details.editorial_summary?.overview) {
            allText.push(details.editorial_summary.overview);
          }
          for (const review of details.reviews || []) {
            if (review.text) allText.push(review.text);
          }

          const hits = scanKeywords(allText);
          allCandidates.push(buildLocation(details, hits));
          detailsSucceeded++;
        }
      } catch (err) {
        if (err instanceof FatalApiError) throw err;
        detailsFailed++;
        const msg = `Details failed for ${place.name} (${place.place_id}): ${err instanceof Error ? err.message : err}`;
        console.log(`    ${msg}`);
        logError(msg);
      }

      await sleep(DETAILS_DELAY);
    }
  } catch (err) {
    if (err instanceof FatalApiError) {
      console.error(`\nFATAL: ${err.message}`);
      logError(`FATAL: ${err.message}`);
      // Still upsert whatever we got
      console.log(`Upserting ${allCandidates.length} locations collected before failure...`);
    } else {
      throw err;
    }
  }

  console.log(`\nPhase 2 complete: ${detailsSucceeded} enriched, ${detailsFailed} failed.`);

  // =========================================================================
  // Upsert
  // =========================================================================

  console.log(`\nUpserting ${allCandidates.length} locations...`);
  const result = await upsertLocations(allCandidates, isMatch);
  clearProgress();

  // =========================================================================
  // Summary
  // =========================================================================

  console.log("\n" + "=".repeat(60));
  console.log("DISCOVERY BY ZONE");
  console.log("=".repeat(60));
  console.log("Zone".padEnd(40) + "New Places Found");
  console.log("-".repeat(56));

  const sortedStats = Array.from(zoneDiscoveryCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [zoneName, count] of sortedStats) {
    if (count > 0) console.log(zoneName.padEnd(40) + String(count));
  }
  const zonesWithZero = sortedStats.filter(([, c]) => c === 0).length;
  if (zonesWithZero > 0) {
    console.log(`(${zonesWithZero} zones found no new places)`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("PIPELINE SUMMARY");
  console.log("=".repeat(60));
  console.log(`Unique places discovered:  ${discovered.size}`);
  console.log(`Skipped (fresh in DB):     ${freshSkipped}`);
  console.log(`Details fetched:           ${detailsSucceeded}`);
  console.log(`Details failed:            ${detailsFailed}`);
  console.log(`New locations added:       ${result.added}`);
  console.log(`Existing locations updated:${result.updated}`);
  console.log(`Duplicates skipped:        ${result.skipped}`);
  console.log("");
  console.log(costBreakdown(cost));
  console.log("=".repeat(60));

  return {
    processed: allCandidates.length,
    added: result.added,
    updated: result.updated,
    skipped: result.skipped,
  };
}

function newProgress(): FetchProgress {
  return {
    runId: nanoid(8),
    startedAt: new Date().toISOString(),
    completedCombos: [],
    processedPlaceIds: [],
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

const isMain =
  (typeof require !== "undefined" && require.main === module) ||
  (typeof process !== "undefined" &&
    process.argv[1] &&
    import.meta.url === `file://${process.argv[1]}`);

if (isMain) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_PLACES_API_KEY not set in .env.local");
    process.exit(1);
  }

  const opts = parseArgs(process.argv);

  runFetchPlaces(apiKey, opts).catch((err) => {
    if (err instanceof FatalApiError) {
      process.exit(2);
    }
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
