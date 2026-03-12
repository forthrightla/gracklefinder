import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const kv = Redis.fromEnv();

interface FeedbackEntry {
  slug: string;
  message: string;
  timestamp: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, message } = body;

    if (!slug || !message || typeof message !== "string") {
      return NextResponse.json(
        { error: "slug and message are required" },
        { status: 400 }
      );
    }

    const entry: FeedbackEntry = {
      slug: String(slug),
      message: message.slice(0, 1000),
      timestamp: new Date().toISOString(),
    };

    await kv.rpush("feedback", JSON.stringify(entry));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/feedback error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save feedback" },
      { status: 500 }
    );
  }
}
