import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REFRESH_SECRET?.trim();
    if (!secret) {
      return NextResponse.json(
        { error: "REFRESH_SECRET not configured" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: {
      fetchPlaces?: { processed: number; added: number; updated: number; skipped: number };
      analyzeReviews?: { succeeded: number; failed: number };
      errors: string[];
    } = { errors: [] };

    try {
      const { runFetchPlaces } = await import(
        "../../../../scripts/fetch-places"
      );
      results.fetchPlaces = await runFetchPlaces(
        process.env.GOOGLE_PLACES_API_KEY
      );
    } catch (err) {
      const msg = `fetch-places failed: ${err instanceof Error ? err.message : err}`;
      console.error(msg);
      results.errors.push(msg);
    }

    try {
      const { runAnalyzeReviews } = await import(
        "../../../../scripts/analyze-reviews"
      );
      results.analyzeReviews = await runAnalyzeReviews(
        process.env.GEMINI_API_KEY
      );
    } catch (err) {
      const msg = `analyze-reviews failed: ${err instanceof Error ? err.message : err}`;
      console.error(msg);
      results.errors.push(msg);
    }

    const status = results.errors.length > 0 ? 207 : 200;
    return NextResponse.json(results, { status });
  } catch (err) {
    console.error("POST /api/refresh error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
