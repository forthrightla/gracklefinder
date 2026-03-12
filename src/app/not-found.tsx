import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8]">
      <Header />
      <div className="flex flex-col items-center justify-center px-4 pt-32">
        <svg
          width="64"
          height="64"
          viewBox="0 0 30 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-6 opacity-40"
        >
          <ellipse cx="14" cy="14" rx="6" ry="4.5" fill="#9b5de5" transform="rotate(-15 14 14)" />
          <circle cx="20" cy="10" r="3" fill="#9b5de5" />
          <circle cx="21" cy="9.5" r="0.8" fill="#0f0f0f" />
          <polygon points="23,9.5 27,8.5 23,10.5" fill="#666" />
          <path d="M8 16 Q3 20 1 27 Q4 22 7 19 Q5 23 3 28 Q6 23 8 19" fill="#9b5de5" />
        </svg>
        <h1 className="font-heading text-2xl font-bold mb-2">404</h1>
        <p className="text-gray-400 mb-6">
          This grackle flew the coop. Head back to the map.
        </p>
        <Link
          href="/"
          className="px-5 py-2 rounded-lg bg-[#9b5de5] text-white text-sm font-medium hover:bg-[#8a4dd4] transition-colors"
        >
          Back to Map
        </Link>
      </div>
    </div>
  );
}
