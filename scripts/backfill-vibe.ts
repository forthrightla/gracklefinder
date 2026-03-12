import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getAllLocations, updateLocation } from "../src/lib/data";
import { computeGrackleScore } from "../src/lib/scoring";

// Same keyword list and vibe logic as fetch-places.ts
const KEYWORDS = [
  "wifi", "wi-fi", "internet",
  "patio", "outdoor", "outside seating",
  "laptop", "work from", "remote work", "plug", "outlet",
  "live music", "food truck", "dog friendly", "pet friendly",
  "cozy", "chill", "vibe", "atmosphere", "unique", "gem", "hidden gem",
  "beautiful", "gorgeous", "trendy", "hip", "artsy",
  "garden", "shade", "shaded", "creek", "views", "scenic",
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

function inferVibeScore(hits: KeywordHits): number {
  let score = 2;

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

  const negativeHits =
    (hits["chain"] || 0) + (hits["generic"] || 0) + (hits["dirty"] || 0) +
    (hits["slow service"] || 0) + (hits["rude"] || 0) +
    (hits["starbucks"] || 0);

  if (positiveHits >= 8) score = Math.max(score, 5);
  else if (positiveHits >= 5) score = Math.max(score, 4);
  else if (positiveHits >= 2) score = Math.max(score, 3);

  if (negativeHits >= 3) score = Math.min(score, 2);
  else if (negativeHits >= 1) score = Math.min(score, 3);

  return Math.min(5, Math.max(1, score));
}

async function main() {
  const locations = await getAllLocations();
  console.log(`Backfilling vibe scores for ${locations.length} locations...\n`);

  let changed = 0;
  const distribution = [0, 0, 0, 0, 0]; // index 0 = score 1, etc.

  for (const loc of locations) {
    const texts = [
      loc.name,
      ...loc.reviewSnippets.map((s) => s.text),
      ...(loc.aiAssessment ? [
        loc.aiAssessment.vibeDescription,
        loc.aiAssessment.workerReasoning,
      ] : []),
    ];

    const hits = scanKeywords(texts);
    const newVibe = inferVibeScore(hits);
    distribution[newVibe - 1]++;

    if (newVibe !== loc.vibeScore) {
      const newGrackle = computeGrackleScore({ ...loc, vibeScore: newVibe });
      await updateLocation(loc.id, { vibeScore: newVibe, grackleScore: newGrackle });
      console.log(
        `  ${loc.name}: vibe ${loc.vibeScore} → ${newVibe}, grackle ${loc.grackleScore} → ${newGrackle}`
      );
      changed++;
    }
  }

  console.log(`\nDone. ${changed} of ${locations.length} locations updated.\n`);
  console.log("Vibe score distribution:");
  for (let i = 0; i < 5; i++) {
    const bar = "█".repeat(Math.round(distribution[i] / 2));
    console.log(`  ${i + 1}: ${String(distribution[i]).padStart(4)} ${bar}`);
  }
}

main();
