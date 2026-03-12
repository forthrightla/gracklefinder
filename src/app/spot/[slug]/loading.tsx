import Header from "@/components/Header";

export default function SpotLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8]">
      <Header />
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-6">
        {/* Back link skeleton */}
        <div className="w-24 h-4 bg-[#1a1a1a] rounded animate-pulse mb-6" />

        {/* Title skeleton */}
        <div className="mb-8">
          <div className="w-64 h-8 bg-[#1a1a1a] rounded animate-pulse mb-3" />
          <div className="flex gap-2 mb-4">
            <div className="w-16 h-6 bg-[#1a1a1a] rounded-full animate-pulse" />
            <div className="w-20 h-6 bg-[#1a1a1a] rounded-full animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-[#1a1a1a] rounded animate-pulse" />
        </div>

        {/* Quick stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-[#1a1a1a] h-20 animate-pulse" />
          <div className="rounded-xl bg-[#1a1a1a] h-20 animate-pulse" />
          <div className="rounded-xl bg-[#1a1a1a] h-20 animate-pulse" />
        </div>

        {/* Map skeleton */}
        <div className="w-full h-[300px] rounded-xl bg-[#1a1a1a] animate-pulse mb-8" />
      </div>
    </div>
  );
}
