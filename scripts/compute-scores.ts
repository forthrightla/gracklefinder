import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getAllLocations, updateLocation } from "../src/lib/data";
import { computeGrackleScore } from "../src/lib/scoring";

async function main() {
  console.log("Gracklefinder — Computing Grackle Scores\n");

  const locations = await getAllLocations();

  const scored: { name: string; score: number }[] = [];
  for (const loc of locations) {
    const score = computeGrackleScore(loc);
    await updateLocation(loc.id, { grackleScore: score });
    scored.push({ name: loc.name, score });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  console.log("Results:\n");
  for (const { name, score } of scored) {
    const bar = "█".repeat(Math.round(score / 5));
    console.log(`  ${String(score).padStart(3)} ${bar} ${name}`);
  }

  console.log(`\nComputed scores for ${scored.length} locations.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
