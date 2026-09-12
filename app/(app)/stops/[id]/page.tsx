"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useArrivals, useAlerts } from "@/lib/hooks/use-realtime";
import { useUser } from "@/lib/hooks/use-user";
import { useSavedStops } from "@/lib/store/saved-stops";
import { loadStops, loadRoutesMap } from "@/lib/gtfs/static";
import { ArrivalsList } from "@/components/ArrivalsList";
import { Button, Card, Skeleton, EmptyState, Badge } from "@/components/ui";
import { ArrowLeft, Star, MapPin, AlertCircle, Share } from "lucide-react";
import { haversineDistance, formatDistance } from "@/lib/utils";
import type { GTFSStop, GTFSRoute, ServiceAlert } from "@/lib/gtfs/types";

export default function StopDetailPage() {
  const params = useParams<{ id: string }>();
  const stopId = params.id;
  const router = useRouter();
  const { userId } = useUser();
  const { isSaved, add, remove } = useSavedStops();

  const [stop, setStop] = useState<GTFSStop | null>(null);
  const [routesMap, setRoutesMap] = useState<Map<string, GTFSRoute>>(new Map());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: arrivals, isLoading: arrivalsLoading } = useArrivals(stopId);
  const { data: alerts } = useAlerts();

  const saved = isSaved(stopId);

  // Load stop data
  useEffect(() => {
    (async () => {
      const [stops, routes] = await Promise.all([loadStops(), loadRoutesMap()]);
      const found = stops.find((s) => s.id === stopId);
      setStop(found ?? null);
      setRoutesMap(routes);
    })();
  }, [stopId]);

  // Get user location for distance
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const stopAlerts = alerts?.filter(
    (a: ServiceAlert) =>
      a.stopIds.includes(stopId) ||
      (arrivals && a.routeIds.some((rid) => arrivals.some((arr) => arr.routeId === rid)))
  ) ?? [];

  function handleSaveToggle() {
    if (!userId) return;
    if (saved) {
      remove(userId, stopId);
    } else {
      add(userId, stopId);
    }
  }

  function handleShare() {
    if (navigator.share && stop) {
      navigator.share({
        title: stop.name,
        text: `Check arrivals at ${stop.name}`,
        url: window.location.href,
      }).catch(() => {});
    }
  }

  if (!stop) {
    return (
      <div className="px-4 pt-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-20 mb-3" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const distance = userLocation
    ? haversineDistance(userLocation.lat, userLocation.lng, stop.lat, stop.lng)
    : null;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button size="icon" variant="ghost" onClick={() => router.back()}>
          <ArrowLeft size={22} />
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" onClick={handleShare}>
          <Share size={20} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSaveToggle}
          className={saved ? "text-accent" : ""}
        >
          <Star size={22} fill={saved ? "currentColor" : "none"} />
        </Button>
      </div>

      {/* Stop info */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1">{stop.name}</h1>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <span>Stop {stop.code || stop.id}</span>
          {distance != null && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {formatDistance(distance)} away
              </span>
            </>
          )}
        </div>
      </div>

      {/* Alerts */}
      {stopAlerts.length > 0 && (
        <Card className="p-4 mb-4 border-warning/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-warning" />
            <h2 className="font-semibold text-sm">Service Alerts</h2>
          </div>
          <div className="space-y-2">
            {stopAlerts.slice(0, 3).map((alert: ServiceAlert) => (
              <div key={alert.id} className="text-sm">
                <p className="font-medium">{alert.headerText}</p>
                {alert.descriptionText && (
                  <p className="text-text-secondary text-xs mt-0.5 line-clamp-2">
                    {alert.descriptionText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Arrivals */}
      <h2 className="text-lg font-semibold mb-3">Live Arrivals</h2>
      <Card className="p-4">
        {arrivalsLoading && !arrivals ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : arrivals && arrivals.length > 0 ? (
          <ArrivalsList arrivals={arrivals} routesMap={routesMap} />
        ) : (
          <EmptyState
            title="No live arrivals"
            description="There are no real-time arrivals at this stop right now. Services may not be running."
          />
        )}
      </Card>
    </div>
  );
}
