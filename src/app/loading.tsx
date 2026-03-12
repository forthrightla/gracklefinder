export default function Loading() {
  return (
    <div className="w-screen h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#9b5de5]/30 border-t-[#9b5de5] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    </div>
  );
}
