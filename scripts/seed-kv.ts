import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import fs from "fs";
import { kv } from "@vercel/kv";
import type { Location } from "../src/lib/types";

const DATA_PATH = path.join(process.cwd(), "data", "locations.json");
const ALL_KEY = "locations:all";

function locKey(slug: string): string {
  return `location:${slug}`;
}

async function main() {
  console.log("Gracklefinder — Seeding Vercel KV from locations.json\n");

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error(
      "ERROR: KV_REST_API_URL and KV_REST_API_TOKEN must be set in .env.local"
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const locations: Location[] = JSON.parse(raw);
  console.log(`Read ${locations.length} locations from ${DATA_PATH}`);

  // Clear existing data
  const existingSlugs = await kv.smembers(ALL_KEY);
  if (existingSlugs.length > 0) {
    const clearPipeline = kv.pipeline();
    for (const slug of existingSlugs) {
      clearPipeline.del(locKey(slug as string));
    }
    clearPipeline.del(ALL_KEY);
    await clearPipeline.exec();
    console.log(`Cleared ${existingSlugs.length} existing entries`);
  }

  // Batch insert in chunks of 100 (pipeline limits)
  const CHUNK_SIZE = 100;
  let seeded = 0;

  for (let i = 0; i < locations.length; i += CHUNK_SIZE) {
    const chunk = locations.slice(i, i + CHUNK_SIZE);
    const pipeline = kv.pipeline();

    const slugs: string[] = [];
    for (const loc of chunk) {
      pipeline.set(locKey(loc.slug), loc);
      slugs.push(loc.slug);
    }
    pipeline.sadd(ALL_KEY, ...slugs);

    await pipeline.exec();
    seeded += chunk.length;
    console.log(`  Seeded ${seeded}/${locations.length}...`);
  }

  // Verify
  const finalCount = await kv.scard(ALL_KEY);
  console.log(`\nDone. ${finalCount} locations in Vercel KV.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
