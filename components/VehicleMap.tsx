"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Map, { Marker, Source, Layer, NavigationControl, GeolocateControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useVehicles } from "@/lib/hooks/use-realtime";
import { loadRoutesMap, getRouteColor } from "@/lib/gtfs/static";
import type { VehiclePosition, TransitMode, GTFSRoute } from "@/lib/gtfs/types";
import { cn } from "@/lib/utils";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

const BRISBANE_CENTER = {
  longitude: 153.0260,
  latitude: -27.4701,
  zoom: 11,
};

interface VehicleMapProps {
  mode: TransitMode;
  onVehicleClick?: (vehicle: VehiclePosition) => void;
}

export function VehicleMap({ mode, onVehicleClick }: VehicleMapProps) {
  const mapRef = useRef(null);
  const { data: vehicles, isLoading } = useVehicles(mode);
  const [routesMap, setRoutesMap] = useState<globalThis.Map<string, GTFSRoute>>(new globalThis.Map());
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [dark, setDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Load routes for coloring
  useEffect(() => {
    loadRoutesMap().then(setRoutesMap).catch(() => {});
  }, []);

  const handleVehicleClick = useCallback(
    (vehicle: VehiclePosition) => {
      setSelectedVehicle(vehicle);
      onVehicleClick?.(vehicle);
    },
    [onVehicleClick]
  );

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef as never}
        initialViewState={BRISBANE_CENTER}
        mapStyle={dark ? "https://tiles.openfreemap.org/styles/dark" : OPENFREEMAP_STYLE}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
        />

        {/* Vehicle markers */}
        {vehicles?.map((vehicle) => {
          const route = routesMap.get(vehicle.routeId);
          const color = getRouteColor(route);
          const bearing = vehicle.bearing || 0;

          return (
            <Marker
              key={vehicle.vehicleId || vehicle.tripId}
              longitude={vehicle.lng}
              latitude={vehicle.lat}
              rotationAlignment="map"
              rotation={bearing}
              onClick={() => handleVehicleClick(vehicle)}
            >
              <div
                className="vehicle-marker cursor-pointer"
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: "2px solid white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2 L8 18 L12 14 L16 18 Z" />
                </svg>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-bg-elevated/90 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-xs text-text-secondary shadow-md">
          Loading vehicles...
        </div>
      )}

      {/* Vehicle count */}
      {vehicles && (
        <div className="absolute bottom-4 left-4 bg-bg-elevated/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-text-secondary shadow-md">
          {vehicles.length} vehicles
        </div>
      )}

      {/* Selected vehicle popup */}
      {selectedVehicle && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-bg-elevated border border-border rounded-[var(--radius)] shadow-lg p-4 max-w-xs w-[calc(100%-2rem)] z-50">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm">
                {routesMap.get(selectedVehicle.routeId)?.shortName || "Route"}{" "}
                {routesMap.get(selectedVehicle.routeId)?.longName || ""}
              </p>
              <p className="text-xs text-text-muted">
                Vehicle {selectedVehicle.vehicleId}
              </p>
            </div>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-text-muted hover:text-text"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-text-secondary space-y-1">
            <p>
              Bearing: {Math.round(selectedVehicle.bearing)}°
              {selectedVehicle.speed != null && ` · Speed: ${Math.round(selectedVehicle.speed * 3.6)} km/h`}
            </p>
            <p>
              Updated:{" "}
              {new Date(selectedVehicle.timestamp * 1000).toLocaleTimeString("en-AU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
