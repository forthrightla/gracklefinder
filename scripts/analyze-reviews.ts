import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { getAllLocations, updateLocation } from "../src/lib/data";
import type { Location, ReviewSnippet } from "../src/lib/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REDDIT_DELAY_MS = 2000;
const GEMINI_DELAY_MS = 1000;

const ALLOWED_SUBREDDITS = new Set([
  "austin",
  "austinfood",
  "digitalnomad",
  "coffee",
  "remotework",
]);

const USER_AGENT = "gracklefinder/1.0 (review analysis script)";

const AI_SYSTEM_PROMPT = `You are analyzing a coffee shop or beer garden in Austin, TX to determine how good it is for remote workers. Based on the provided reviews and Reddit discussions, return ONLY a JSON object with these fields:
- hasWifi: boolean or null if truly unknown
- wifiConfidence: "high", "medium", "low", or "unknown"
- wifiReasoning: one sentence explaining your wifi assessment
- workerFriendly: integer 1-5 (5 = excellent for laptop work)
- workerReasoning: one sentence explaining the score
- vibeScore: integer 1-5 (5 = amazing atmosphere)
- vibeDescription: two sentences describing what it feels like to hang out here
- suggestedTags: string array from this set: coffee, beer-garden, both, shaded-patio, dog-friendly, food-trucks, live-music, quiet, loud-social, fast-wifi, no-wifi, plenty-of-outlets
- bestSnippets: array of 3 objects { text: string (under 120 chars, a compelling excerpt), source: "google" or "reddit" }
Return only valid JSON, no markdown fences.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Reddit search
// ---------------------------------------------------------------------------

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  permalink: string;
}

async function fetchWithBackoff(
  url: string,
  attempt = 0
): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (res.status === 429) {
    if (attempt >= 4) {
      throw new Error("Reddit rate limit: max retries exceeded");
    }
    const backoff = Math.pow(2, attempt + 1) * 1000;
    console.log(`    Rate limited (429), backing off ${backoff / 1000}s...`);
    await sleep(backoff);
    return fetchWithBackoff(url, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Reddit HTTP ${res.status}: ${res.statusText}`);
  }

  return res;
}

async function searchReddit(locationName: string): Promise<string[]> {
  const query = encodeURIComponent(`${locationName} austin`);
  const url = `https://www.reddit.com/search.json?q=${query}&limit=10&sort=relevance`;

  const res = await fetchWithBackoff(url);
  const data = await res.json();

  const texts: string[] = [];
  const posts: RedditPost[] = [];

  for (const child of data?.data?.children || []) {
    const post = child.data;
    const subreddit = (post.subreddit || "").toLowerCase();

    if (!ALLOWED_SUBREDDITS.has(subreddit)) continue;

    posts.push({
      title: post.title || "",
      selftext: post.selftext || "",
      subreddit,
      permalink: post.permalink || "",
    });

    if (post.title) texts.push(post.title);
    if (post.selftext) texts.push(post.selftext);
  }

  for (const post of posts.slice(0, 3)) {
    await sleep(REDDIT_DELAY_MS);
    try {
      const commentsUrl = `https://www.reddit.com${post.permalink}.json?limit=10&depth=1&sort=top`;
      const commentsRes = await fetchWithBackoff(commentsUrl);
      const commentsData = await commentsRes.json();

      const commentListing = commentsData?.[1]?.data?.children || [];
      for (const child of commentListing) {
        if (child.kind === "t1" && child.data?.body) {
          texts.push(child.data.body);
        }
      }
    } catch (err) {
      console.log(
        `    Warning: failed to fetch comments for ${post.permalink}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  return texts;
}

// ---------------------------------------------------------------------------
// AI analysis (Gemini Flash 2.5)
// ---------------------------------------------------------------------------

interface AiAnalysisResult {
  hasWifi: boolean | null;
  wifiConfidence: "high" | "medium" | "low" | "unknown";
  wifiReasoning: string;
  workerFriendly: number;
  workerReasoning: string;
  vibeScore: number;
  vibeDescription: string;
  suggestedTags: string[];
  bestSnippets: { text: string; source: "google" | "reddit" }[];
}

function buildUserPrompt(
  location: Location,
  redditTexts: string[]
): string {
  const parts: string[] = [];

  parts.push(`LOCATION: ${location.name}`);
  parts.push(`ADDRESS: ${location.address}`);
  parts.push(`EXISTING TAGS: ${location.tags.join(", ")}`);
  parts.push("");

  if (location.reviewSnippets.length > 0) {
    parts.push("GOOGLE REVIEW SNIPPETS:");
    for (const snippet of location.reviewSnippets) {
      parts.push(`- "${snippet.text}"`);
    }
    parts.push("");
  }

  if (redditTexts.length > 0) {
    parts.push("REDDIT POSTS AND COMMENTS:");
    let totalChars = 0;
    const maxChars = 8000;
    for (const text of redditTexts) {
      if (totalChars >= maxChars) break;
      const trimmed = text.slice(0, maxChars - totalChars);
      parts.push(`- "${trimmed}"`);
      totalChars += trimmed.length;
    }
    parts.push("");
  }

  if (location.reviewSnippets.length === 0 && redditTexts.length === 0) {
    parts.push(
      "NO REVIEW DATA AVAILABLE. Make your best assessment based on the location name, address, and tags. Use null/unknown for anything you cannot determine."
    );
  }

  return parts.join("\n");
}

async function analyzeWithAI(
  location: Location,
  redditTexts: string[],
  geminiUrl: string
): Promise<AiAnalysisResult> {
  const userPrompt = buildUserPrompt(location, redditTexts);

  const body = {
    system_instruction: {
      parts: [{ text: AI_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.2,
    },
  };

  const res = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.length) {
    throw new Error(
      `Gemini returned no content. finishReason: ${candidate?.finishReason || "unknown"}`
    );
  }

  let jsonStr = candidate.content.parts
    .map((p: { text?: string }) => p.text || "")
    .join("")
    .trim();

  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  return {
    hasWifi:
      parsed.hasWifi === true
        ? true
        : parsed.hasWifi === false
        ? false
        : null,
    wifiConfidence: ["high", "medium", "low", "unknown"].includes(
      parsed.wifiConfidence
    )
      ? parsed.wifiConfidence
      : "unknown",
    wifiReasoning: String(parsed.wifiReasoning || ""),
    workerFriendly: Math.min(
      5,
      Math.max(1, Math.round(Number(parsed.workerFriendly) || 3))
    ),
    workerReasoning: String(parsed.workerReasoning || ""),
    vibeScore: Math.min(
      5,
      Math.max(1, Math.round(Number(parsed.vibeScore) || 3))
    ),
    vibeDescription: String(parsed.vibeDescription || ""),
    suggestedTags: Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags.map(String)
      : [],
    bestSnippets: Array.isArray(parsed.bestSnippets)
      ? parsed.bestSnippets
          .filter(
            (s: { text?: string; source?: string }) =>
              s && typeof s.text === "string" && typeof s.source === "string"
          )
          .map((s: { text: string; source: string }) => ({
            text: s.text.slice(0, 120),
            source:
              s.source === "reddit"
                ? ("reddit" as const)
                : ("google" as const),
          }))
      : [],
  };
}

// ---------------------------------------------------------------------------
// Apply analysis to location
// ---------------------------------------------------------------------------

function applyAnalysis(
  location: Location,
  analysis: AiAnalysisResult
): Partial<Location> {
  const mergedTags = Array.from(
    new Set([...location.tags, ...analysis.suggestedTags])
  );

  const reviewSnippets: ReviewSnippet[] = analysis.bestSnippets.map((s) => ({
    text: s.text,
    source: s.source,
  }));

  return {
    hasWifi: analysis.hasWifi,
    wifiConfidence: analysis.wifiConfidence,
    workerFriendly: analysis.workerFriendly,
    vibeScore: analysis.vibeScore,
    tags: mergedTags,
    reviewSnippets,
    aiAssessment: {
      wifiReasoning: analysis.wifiReasoning,
      workerReasoning: analysis.workerReasoning,
      vibeDescription: analysis.vibeDescription,
    },
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

// ---------------------------------------------------------------------------
// Exported pipeline function
// ---------------------------------------------------------------------------

export async function runAnalyzeReviews(
  geminiApiKey?: string
): Promise<{ succeeded: number; failed: number }> {
  const key = geminiApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not provided");
  }

  const geminiModel = "gemini-2.5-flash";
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`;

  console.log("Gracklefinder — Review analysis pipeline (Gemini Flash 2.5)\n");

  const locations = await getAllLocations();
  console.log(`Found ${locations.length} locations to analyze.\n`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    const label = `[${i + 1}/${locations.length}]`;
    process.stdout.write(`Analyzing ${label}: ${location.name}...`);

    try {
      let redditTexts: string[] = [];
      try {
        redditTexts = await searchReddit(location.name);
        if (redditTexts.length > 0) {
          process.stdout.write(` ${redditTexts.length} reddit texts...`);
        }
      } catch (err) {
        console.log(
          `\n  Warning: Reddit search failed for "${location.name}": ${err instanceof Error ? err.message : err}`
        );
      }

      const analysis = await analyzeWithAI(location, redditTexts, geminiUrl);
      const updates = applyAnalysis(location, analysis);
      await updateLocation(location.id, updates);

      console.log(" done");
      succeeded++;
    } catch (err) {
      console.log(
        ` FAILED\n  Error: ${err instanceof Error ? err.message : err}`
      );
      failed++;
    }

    if (i < locations.length - 1) {
      await sleep(GEMINI_DELAY_MS);
    }
  }

  console.log(
    `\nComplete. ${succeeded} analyzed successfully, ${failed} failed.`
  );

  return { succeeded, failed };
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

const isMain =
  typeof require !== "undefined" && require.main === module
  || typeof process !== "undefined" && process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("ERROR: GEMINI_API_KEY not set in .env.local");
    process.exit(1);
  }
  runAnalyzeReviews(key).catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
