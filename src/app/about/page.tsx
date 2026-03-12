import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "About — Gracklefinder",
  description:
    "Gracklefinder helps remote workers find the best coffee shops, beer gardens, and patios in Austin, TX.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8]">
      <Header />

      <main className="max-w-[640px] mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">
          About <span className="text-[#9b5de5]">Grackle</span>finder
        </h1>

        <div className="space-y-5 text-gray-300 leading-relaxed">
          <p>
            Austin&apos;s great-tailed grackles know every patio, courtyard, and
            shaded table in the city. Gracklefinder channels that instinct to
            help remote workers discover the best spots to open a laptop, grab a
            coffee (or a cold beer), and get things done.
          </p>

          <h2 className="font-heading text-xl font-bold text-[#e8e8e8] pt-2">
            How It Works
          </h2>

          <p>
            We pull data from Google Places and Reddit, then run it through an
            AI analysis pipeline to score every location on wifi quality,
            worker-friendliness, and overall vibe. The result is the{" "}
            <span className="text-[#9b5de5] font-semibold">Grackle Score</span>
            &mdash;a single number (0&ndash;100) that tells you how good a spot
            is for getting work done outdoors.
          </p>

          <h2 className="font-heading text-xl font-bold text-[#e8e8e8] pt-2">
            The Grackle Score
          </h2>

          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-[#E69F00] font-bold w-10 flex-shrink-0">35%</span>
              <span>Worker-friendliness (outlets, laptop culture, vibe)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#0072B2] font-bold w-10 flex-shrink-0">25%</span>
              <span>Wifi availability and confidence</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#9b5de5] font-bold w-10 flex-shrink-0">20%</span>
              <span>Atmosphere and vibe score</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400 font-bold w-10 flex-shrink-0">10%</span>
              <span>Outdoor patio seating</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400 font-bold w-10 flex-shrink-0">10%</span>
              <span>Serves both coffee and beer</span>
            </li>
          </ul>

          <h2 className="font-heading text-xl font-bold text-[#e8e8e8] pt-2">
            Color Guide
          </h2>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E69F00]" />
              <span>Coffee shops</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0072B2]" />
              <span>Beer gardens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#CC79A7]" />
              <span>Both coffee &amp; beer</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 pt-4">
            Built in Austin, TX. Data refreshed periodically via automated
            pipelines. Think a listing is wrong?{" "}
            <Link href="/" className="text-[#9b5de5] hover:underline">
              Find the spot on the map
            </Link>{" "}
            and hit &ldquo;Report Outdated Info&rdquo; on its detail page.
          </p>
        </div>
      </main>
    </div>
  );
}
