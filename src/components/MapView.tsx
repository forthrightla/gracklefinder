"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Location } from "@/lib/types";
import { getMarkerColor } from "@/lib/colors";
import { Filters, DEFAULT_FILTERS, applyFilters } from "@/lib/filters";
import MapMarker from "./MapMarker";
import LocationPopup from "./LocationPopup";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MapLegend from "./MapLegend";

import fallbackData from "../../data/locations.json";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => {
          const locations = Array.isArray(data) ? data : data.locations;
          setAllLocations(locations as Location[]);
        })
      .catch(() => {
        setAllLocations(fallbackData as Location[]);
      });
  }, []);

  const filteredLocations = useMemo(
    () => applyFilters(allLocations, filters),
    [allLocations, filters]
  );

  const filteredIds = useMemo(
    () => new Set(filteredLocations.map((l) => l.id)),
    [filteredLocations]
  );

  const handleMapClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleLocationClick = useCallback((location: Location) => {
    setSelectedId(location.id);
    mapRef.current?.flyTo({
      center: [location.lng, location.lat],
      zoom: 14,
      duration: 800,
    });
  }, []);

  const selectedLocation = allLocations.find(
    (loc) => loc.id === selectedId && filteredIds.has(loc.id)
  );

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <Header />
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -97.7431,
          latitude: 30.2672,
          zoom: 12,
        }}
        style={{ width: "100%", height: "calc(100% - 56px)", marginTop: "56px" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleMapClick}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        {allLocations.map((loc) =>
          filteredIds.has(loc.id) ? (
            <Marker
              key={loc.id}
              longitude={loc.lng}
              latitude={loc.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedId(loc.id);
              }}
              style={{ cursor: "pointer" }}
            >
              <MapMarker
                color={getMarkerColor(loc.tags)}
                grackleScore={loc.grackleScore}
                isSelected={loc.id === selectedId}
              />
            </Marker>
          ) : null
        )}

        {selectedLocation && (
          <Popup
            longitude={selectedLocation.lng}
            latitude={selectedLocation.lat}
            offset={12}
            closeOnClick={false}
            onClose={() => setSelectedId(null)}
            maxWidth="320px"
          >
            <LocationPopup location={selectedLocation} />
          </Popup>
        )}
      </Map>

      <MapLegend />

      <Sidebar
        filters={filters}
        onFiltersChange={setFilters}
        filteredLocations={filteredLocations}
        totalCount={allLocations.length}
        onLocationClick={handleLocationClick}
      />
    </div>
  );
}
