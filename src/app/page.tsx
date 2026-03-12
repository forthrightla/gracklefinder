import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading map…</p>
    </div>
  ),
});

export default function Home() {
  return <MapView />;
}
