import { notFound } from "next/navigation";
import { Metadata } from "next";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { getLocationBySlug } from "@/lib/data";
import { getMarkerColor } from "@/lib/colors";
import { computeGrackleScore } from "@/lib/scoring";
import FeedbackForm from "@/components/FeedbackForm";
import Header from "@/components/Header";

const SpotMiniMap = nextDynamic(() => import("@/components/SpotMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-xl bg-[#1a1a1a] animate-pulse" />
  ),
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const location = await getLocationBySlug(params.slug);
  if (!location) return { title: "Not Found — Gracklefinder" };

  const description =
    location.aiAssessment?.vibeDescription ||
    `Check out ${location.name} on Gracklefinder.`;

  return {
    title: `${location.name} — Gracklefinder`,
    openGraph: {
      title: `${location.name} — Gracklefinder`,
      description,
    },
  };
}

// Dynamic rendering — data lives in Vercel KV, not filesystem
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helper components (server-side, no "use client" needed)
// ---------------------------------------------------------------------------

function WifiStatus({
  hasWifi,
  confidence,
}: {
  hasWifi: boolean | null;
  confidence: string;
}) {
  if (hasWifi === true) {
    const color =
      confidence === "high"
        ? "text-green-400"
        : confidence === "medium"
        ? "text-yellow-400"
        : "text-gray-400";
    return (
      <div>
        <div className="text-xs text-gray-500 mb-1">Wifi</div>
        <div className={`text-sm font-medium ${color}`}>
          &#x2630; Yes ({confidence})
        </div>
      </div>
    );
  }
  if (hasWifi === false) {
    return (
      <div>
        <div className="text-xs text-gray-500 mb-1">Wifi</div>
        <div className="text-sm font-medium text-red-400">&#x2630; No</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">Wifi</div>
      <div className="text-sm font-medium text-gray-500">&#x2630; Unknown</div>
    </div>
  );
}

function LaptopScale({ score }: { score: number }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">Worker Friendly</div>
      <div className="text-sm">
        <span>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < score ? "" : "opacity-25"}>
              💻
            </span>
          ))}
        </span>
        <span className="text-gray-400 ml-1.5 text-xs">{score}/5</span>
      </div>
    </div>
  );
}

function VibeScale({ score }: { score: number }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">Vibe</div>
      <div className="text-sm">
        <span>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < score ? "" : "opacity-25"}>
              ✨
            </span>
          ))}
        </span>
        <span className="text-gray-400 ml-1.5 text-xs">{score}/5</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SpotPage({ params }: PageProps) {
  const locationData = await getLocationBySlug(params.slug);
  if (!locationData) notFound();

  const location = { ...locationData, grackleScore: computeGrackleScore(locationData) };
  const accentColor = getMarkerColor(location.tags);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    location.address
  )}`;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8]">
      <Header />
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-6 sm:pb-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#9b5de5] transition-colors mb-6"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to map
        </Link>

        {/* ---- Header ---- */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
            {location.name}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {location.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: accentColor + "22",
                  color: accentColor,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Grackle Score */}
          <div className="flex items-center gap-3">
            <svg
              width="28"
              height="28"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse
                cx="14"
                cy="14"
                rx="6"
                ry="4.5"
                fill={accentColor}
                transform="rotate(-15 14 14)"
              />
              <circle cx="20" cy="10" r="3" fill={accentColor} />
              <circle cx="21" cy="9.5" r="0.8" fill="#0f0f0f" />
              <polygon points="23,9.5 27,8.5 23,10.5" fill="#333" />
              <path
                d="M8 16 Q3 20 1 27 Q4 22 7 19 Q5 23 3 28 Q6 23 8 19"
                fill={accentColor}
              />
            </svg>
            <div className="flex items-baseline gap-1">
              <span
                className="text-4xl font-bold"
                style={{ color: accentColor }}
              >
                {location.grackleScore}
              </span>
              <span className="text-lg text-gray-500">/100</span>
            </div>
            <span className="text-xs text-gray-500">Grackle Score</span>
          </div>
        </div>

        {/* ---- Quick Stats ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-[#1a1a1a] p-4">
            <WifiStatus
              hasWifi={location.hasWifi}
              confidence={location.wifiConfidence}
            />
          </div>
          <div className="rounded-xl bg-[#1a1a1a] p-4">
            <LaptopScale score={location.workerFriendly} />
          </div>
          <div className="rounded-xl bg-[#1a1a1a] p-4">
            <VibeScale score={location.vibeScore} />
          </div>
        </div>

        {/* ---- AI Assessment ---- */}
        {location.aiAssessment && (
          <div className="rounded-xl bg-[#1a1a1a] border-l-4 border-[#9b5de5] p-5 mb-8">
            <h2 className="text-base font-bold mb-3 text-[#9b5de5]">
              The Grackle&apos;s Take
            </h2>
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                <span className="text-gray-500 font-medium">Wifi: </span>
                {location.aiAssessment.wifiReasoning}
              </p>
              <p>
                <span className="text-gray-500 font-medium">
                  For Workers:{" "}
                </span>
                {location.aiAssessment.workerReasoning}
              </p>
              <p>
                <span className="text-gray-500 font-medium">The Vibe: </span>
                {location.aiAssessment.vibeDescription}
              </p>
            </div>
          </div>
        )}

        {/* ---- Mini Map ---- */}
        <div className="mb-8">
          <SpotMiniMap
            lat={location.lat}
            lng={location.lng}
            color={accentColor}
          />
        </div>

        {/* ---- Review Snippets ---- */}
        {location.reviewSnippets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold mb-3">What People Say</h2>
            <div className="space-y-3">
              {location.reviewSnippets.map((snippet, i) => (
                <div key={i} className="rounded-xl bg-[#1a1a1a] p-4">
                  <p className="text-sm text-gray-300 italic leading-relaxed">
                    &ldquo;{snippet.text}&rdquo;
                  </p>
                  <span
                    className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${
                      snippet.source === "reddit"
                        ? "bg-orange-500/15 text-orange-400"
                        : "bg-blue-500/15 text-blue-400"
                    }`}
                  >
                    via {snippet.source === "reddit" ? "Reddit" : "Google"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Practical Info ---- */}
        <div className="rounded-xl bg-[#1a1a1a] p-5 mb-8">
          <h2 className="text-base font-bold mb-3">Practical Info</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Address: </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  location.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9b5de5] hover:underline"
              >
                {location.address}
              </a>
            </div>
            {location.hours && (
              <div>
                <span className="text-gray-500">Hours: </span>
                <span className="text-gray-300">{location.hours}</span>
              </div>
            )}
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg bg-[#9b5de5] text-white text-sm font-medium hover:bg-[#8a4dd4] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Get Directions
          </a>
        </div>

        {/* ---- Footer / Feedback ---- */}
        <div className="border-t border-white/10 pt-6 pb-10">
          <FeedbackForm slug={location.slug} />
          <p className="text-xs text-gray-600 mt-4">
            Last updated: {location.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
}
