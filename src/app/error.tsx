"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-bold mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg bg-[#9b5de5] text-white text-sm font-medium hover:bg-[#8a4dd4] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
