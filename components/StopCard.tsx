"use client";

import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { ArrivalsList } from "@/components/ArrivalsList";
import { Bus, Train, Sailboat, TramFront, ChevronRight, Star } from "lucide-react";
import type { Arrival, GTFSStop } from "@/lib/gtfs/types";
import { useSavedStops } from "@/lib/store/saved-stops";

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

function getModeFromStop(stop: GTFSStop): string {
  // TransLink stop codes: train stops have 6-digit codes starting with 6,
  // bus stops have shorter codes, ferry stops are 6-digit starting with 3
  const code = stop.code || stop.id;
  if (code.length === 6 && code.startsWith("6")) return "rail";
  if (code.length === 6 && code.startsWith("3")) return "ferry";
  if (stop.locationType === 1) return "rail"; // station
  return "bus";
}

export function StopCard({
  stop,
  customLabel,
  note,
  arrivals,
  routesMap,
}: {
  stop: GTFSStop;
  customLabel?: string | null;
  note?: string | null;
  arrivals?: Arrival[];
  routesMap?: Map<string, { id: string; shortName: string; longName: string; type: number; color: string; textColor: string }>;
}) {
  const mode = getModeFromStop(stop);
  const displayName = customLabel || stop.name;

  return (
    <Link href={`/stops/${stop.id}`} className="block">
      <Card className="p-4 active:scale-[0.99] transition-transform">
        <div className="flex items-start gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-subtle flex-shrink-0">
            <ModeIcon mode={mode} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text truncate">{displayName}</h3>
            <p className="text-xs text-text-muted">
              Stop {stop.code || stop.id}
            </p>
          </div>
          <ChevronRight size={20} className="text-text-muted flex-shrink-0" />
        </div>

        {note && (
          <p className="text-xs text-text-secondary mb-2 italic line-clamp-1">
            {note}
          </p>
        )}

        {arrivals && arrivals.length > 0 ? (
          <ArrivalsList arrivals={arrivals} routesMap={routesMap} compact />
        ) : (
          <p className="text-xs text-text-muted py-1">
            {arrivals ? "No live arrivals" : "Loading arrivals..."}
          </p>
        )}
      </Card>
    </Link>
  );
}

export function StopCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-bg-subtle animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-bg-subtle rounded animate-pulse mb-2 w-3/4" />
          <div className="h-3 bg-bg-subtle rounded animate-pulse w-1/4" />
        </div>
      </div>
      <div className="h-3 bg-bg-subtle rounded animate-pulse mb-2" />
      <div className="h-3 bg-bg-subtle rounded animate-pulse w-2/3" />
    </Card>
  );
}
