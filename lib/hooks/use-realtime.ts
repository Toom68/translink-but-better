"use client";

import { useQuery } from "@tanstack/react-query";
import type { Arrival, VehiclePosition, ServiceAlert, TransitMode } from "@/lib/gtfs/types";

// ── Arrivals for a specific stop ──
export function useArrivals(stopId: string | null, enabled = true) {
  return useQuery<Arrival[]>({
    queryKey: ["arrivals", stopId],
    queryFn: async () => {
      const res = await fetch(`/api/realtime/arrivals/${stopId}`);
      if (!res.ok) throw new Error("Failed to fetch arrivals");
      return res.json();
    },
    enabled: !!stopId && enabled,
    refetchInterval: 30 * 1000, // 30s
    refetchIntervalInBackground: false,
  });
}

// ── Vehicle positions ──
export function useVehicles(mode: TransitMode = "all", enabled = true) {
  return useQuery<VehiclePosition[]>({
    queryKey: ["vehicles", mode],
    queryFn: async () => {
      const res = await fetch(`/api/realtime/vehicles?type=${mode}`);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
    enabled,
    refetchInterval: 12 * 1000, // 12s
    refetchIntervalInBackground: false,
  });
}

// ── Service alerts ──
export function useAlerts(enabled = true) {
  return useQuery<ServiceAlert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch("/api/realtime/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    enabled,
    refetchInterval: 60 * 1000, // 60s
    refetchIntervalInBackground: false,
  });
}

// ── Arrivals for multiple stops (batched for library screen) ──
export function useMultiStopArrivals(stopIds: string[], enabled = true) {
  return useQuery<Record<string, Arrival[]>>({
    queryKey: ["multi-arrivals", stopIds],
    queryFn: async () => {
      const results = await Promise.all(
        stopIds.map(async (stopId) => {
          const res = await fetch(`/api/realtime/arrivals/${stopId}`);
          if (!res.ok) return [stopId, []] as const;
          const data = await res.json();
          return [stopId, data] as const;
        })
      );
      return Object.fromEntries(results);
    },
    enabled: stopIds.length > 0 && enabled,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });
}
