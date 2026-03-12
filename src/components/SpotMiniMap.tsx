"use client";

import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import GrackleIcon from "./GrackleIcon";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface SpotMiniMapProps {
  lat: number;
  lng: number;
  color: string;
}

export default function SpotMiniMap({ lat, lng, color }: SpotMiniMapProps) {
  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden">
      <Map
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: 15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={false}
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <GrackleIcon color={color} size={36} />
        </Marker>
      </Map>
    </div>
  );
}
