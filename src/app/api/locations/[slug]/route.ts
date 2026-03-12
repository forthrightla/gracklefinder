import { NextResponse } from "next/server";
import { getLocationBySlug } from "@/lib/data";
import { computeGrackleScore } from "@/lib/scoring";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const location = await getLocationBySlug(params.slug);
    if (!location) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { ...location, grackleScore: computeGrackleScore(location) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error(`GET /api/locations/${params.slug} error:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
