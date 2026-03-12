import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-[#0f0f0f]/95 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2.5 group">
        {/* Inline grackle logo */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 30 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200 group-hover:scale-110"
        >
          <ellipse cx="14" cy="14" rx="6" ry="4.5" fill="#9b5de5" transform="rotate(-15 14 14)" />
          <circle cx="20" cy="10" r="3" fill="#9b5de5" />
          <circle cx="21" cy="9.5" r="0.8" fill="#0f0f0f" />
          <polygon points="23,9.5 27,8.5 23,10.5" fill="#666" />
          <path d="M8 16 Q3 20 1 27 Q4 22 7 19 Q5 23 3 28 Q6 23 8 19" fill="#9b5de5" />
          <path d="M11 11 Q14 10 17 11 Q14 13 11 14 Z" fill="#9b5de5" opacity="0.7" />
          {/* Wifi arcs */}
          <path d="M24 12 Q26 9 28 12" stroke="#9b5de5" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M23.5 13 Q26 8 28.5 13" stroke="#9b5de5" strokeWidth="1" fill="none" opacity="0.3" />
        </svg>
        <span className="font-heading text-lg font-bold tracking-tight text-[#e8e8e8]">
          <span className="text-[#9b5de5]">Grackle</span>finder
        </span>
      </Link>

      <nav className="flex items-center gap-4">
        <Link
          href="/about"
          className="text-sm text-gray-400 hover:text-[#9b5de5] transition-colors duration-200"
        >
          About
        </Link>
      </nav>
    </header>
  );
}
