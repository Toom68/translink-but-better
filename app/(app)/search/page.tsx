"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { loadStops } from "@/lib/gtfs/static";
import { useNearbyStops } from "@/lib/hooks/use-nearby";
import { useUser } from "@/lib/hooks/use-user";
import { useSavedStops } from "@/lib/store/saved-stops";
import { Card, Button, Input, Skeleton, EmptyState, Badge } from "@/components/ui";
import { Search, MapPin, Plus, Check, Navigation, Bus, Train, Sailboat, TramFront } from "lucide-react";
import { haversineDistance, formatDistance, cn } from "@/lib/utils";
import type { GTFSStop } from "@/lib/gtfs/types";
import FlexSearch from "flexsearch";
import type { Index } from "flexsearch";

function getModeFromStop(stop: GTFSStop): string {
  const code = stop.code || stop.id;
  if (code.length === 6 && code.startsWith("6")) return "rail";
  if (code.length === 6 && code.startsWith("3")) return "ferry";
  if (stop.locationType === 1) return "rail";
  return "bus";
}

function ModeIcon({ mode, size = 18 }: { mode: string; size?: number }) {
  const icons: Record<string, typeof Bus> = {
    bus: Bus,
    rail: Train,
    ferry: Sailboat,
    tram: TramFront,
  };
  const Icon = icons[mode] ?? Bus;
  return <Icon size={size} />;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [stops, setStops] = useState<GTFSStop[]>([]);
  const [index, setIndex] = useState<Index | null>(null);
  const [results, setResults] = useState<GTFSStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const { userId } = useUser();
  const { add, isSaved } = useSavedStops();
  const { nearby, loading: nearbyLoading } = useNearbyStops(
    userLocation?.lat ?? null,
    userLocation?.lng ?? null,
    20
  );

  // Load stops and build FlexSearch index
  useEffect(() => {
    (async () => {
      const data = await loadStops();
      setStops(data);
      const idx = new FlexSearch.Index({
        tokenize: "forward",
        resolution: 9,
      });
      data.forEach((stop, i) => {
        idx.add(i, `${stop.name} ${stop.code} ${stop.id}`);
      });
      setIndex(idx);
      setLoading(false);
    })();
  }, []);

  // Search
  useEffect(() => {
    if (!index || !query.trim()) {
      setResults([]);
      return;
    }

    const ids = index.search(query.trim(), { limit: 50 }) as unknown[];
    const found = ids.map((id) => stops[typeof id === "number" ? id : parseInt(String(id))]).filter(Boolean);
    setResults(found);
  }, [query, index, stops]);

  function handleLocate() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function handleQuickAdd(stopId: string) {
    if (!userId) return;
    if (!isSaved(stopId)) {
      add(userId, stopId);
    }
  }

  const showNearby = !query.trim() && userLocation;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold mb-4">Find Stops</h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Search by name or stop code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11"
          autoFocus
        />
      </div>

      {/* Locate button */}
      {!userLocation && (
        <Button
          variant="secondary"
          size="md"
          onClick={handleLocate}
          disabled={locating}
          className="w-full mb-4"
        >
          <Navigation size={18} />
          {locating ? "Finding location..." : "Find stops near me"}
        </Button>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : query.trim() ? (
        // Search results
        results.length === 0 ? (
          <EmptyState
            icon={<Search size={40} strokeWidth={1.5} />}
            title="No stops found"
            description={`No stops match "${query}"`}
          />
        ) : (
          <div className="space-y-2">
            {results.map((stop) => (
              <StopResultRow
                key={stop.id}
                stop={stop}
                userLocation={userLocation}
                saved={isSaved(stop.id)}
                onAdd={() => handleQuickAdd(stop.id)}
              />
            ))}
          </div>
        )
      ) : showNearby ? (
        // Nearby stops
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            Near you
          </h2>
          {nearbyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : nearby.length === 0 ? (
            <EmptyState
              title="No stops nearby"
              description="No TransLink stops found near your location."
            />
          ) : (
            <div className="space-y-2">
              {nearby.map((stop) => (
                <StopResultRow
                  key={stop.id}
                  stop={stop}
                  userLocation={userLocation}
                  saved={isSaved(stop.id)}
                  onAdd={() => handleQuickAdd(stop.id)}
                  distance={stop.distance}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Search size={40} strokeWidth={1.5} />}
          title="Search for stops"
          description="Search by stop name or stop code, or find stops near your location."
        />
      )}
    </div>
  );
}

function StopResultRow({
  stop,
  userLocation,
  saved,
  onAdd,
  distance,
}: {
  stop: GTFSStop;
  userLocation: { lat: number; lng: number } | null;
  saved: boolean;
  onAdd: () => void;
  distance?: number;
}) {
  const mode = getModeFromStop(stop);
  const dist = distance ?? (userLocation
    ? haversineDistance(userLocation.lat, userLocation.lng, stop.lat, stop.lng)
    : null);

  return (
    <Card className="p-3 flex items-center gap-3">
      <Link href={`/stops/${stop.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-subtle flex-shrink-0">
          <ModeIcon mode={mode} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{stop.name}</p>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Stop {stop.code || stop.id}</span>
            {dist != null && (
              <>
                <span>·</span>
                <span>{formatDistance(dist)}</span>
              </>
            )}
          </div>
        </div>
      </Link>
      <Button
        size="icon"
        variant="ghost"
        onClick={onAdd}
        className={cn("flex-shrink-0", saved && "text-accent")}
      >
        {saved ? <Check size={20} /> : <Plus size={20} />}
      </Button>
    </Card>
  );
}
