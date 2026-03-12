import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Progress tracker for resumable pipeline runs
// ---------------------------------------------------------------------------

export interface FetchProgress {
  runId: string;
  startedAt: string;
  completedCombos: string[]; // "zone::query" keys
  processedPlaceIds: string[];
  lastUpdated: string;
}

const PROGRESS_PATH = path.join(process.cwd(), "data", "fetch-progress.json");

export function loadProgress(): FetchProgress | null {
  try {
    if (!fs.existsSync(PROGRESS_PATH)) return null;
    const raw = fs.readFileSync(PROGRESS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProgress(progress: FetchProgress): void {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2), "utf-8");
}

export function clearProgress(): void {
  if (fs.existsSync(PROGRESS_PATH)) {
    fs.unlinkSync(PROGRESS_PATH);
  }
}

export function comboKey(zoneName: string, query: string): string {
  return `${zoneName}::${query}`;
}

// ---------------------------------------------------------------------------
// Error logger
// ---------------------------------------------------------------------------

const ERROR_LOG_PATH = path.join(process.cwd(), "data", "fetch-errors.log");

export function logError(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(ERROR_LOG_PATH, line, "utf-8");
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
