"use client";

import { useEffect, useState } from "react";
import { loadStops } from "@/lib/gtfs/static";
import { haversineDistance } from "@/lib/utils";
import type { GTFSStop } from "@/lib/gtfs/types";

interface NearbyStop extends GTFSStop {
  distance: number;
}

export function useNearbyStops(lat: number | null, lng: number | null, limit = 20) {
  const [nearby, setNearby] = useState<NearbyStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const stops = await loadStops();
        if (cancelled) return;

        const withDistance = stops
          .map((stop) => ({
            ...stop,
            distance: haversineDistance(lat, lng, stop.lat, stop.lng),
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, limit);

        if (!cancelled) {
          setNearby(withDistance);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load stops");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lat, lng, limit]);

  return { nearby, loading, error };
}
