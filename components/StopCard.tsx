"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { ArrivalsList } from "@/components/ArrivalsList";
import { Bus, Train, Sailboat, TramFront } from "lucide-react";
import type { Arrival, GTFSStop } from "@/lib/gtfs/types";

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
  const code = stop.code || stop.id;
  if (code.length === 6 && code.startsWith("6")) return "rail";
  if (code.length === 6 && code.startsWith("3")) return "ferry";
  if (stop.locationType === 1) return "rail";
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
      <Card className="p-4 active:scale-[0.98] transition-transform duration-200">
        <div className="flex items-start gap-3 mb-2">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-bg-subtle flex-shrink-0">
            <ModeIcon mode={mode} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text truncate">{displayName}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Stop {stop.code || stop.id}
            </p>
          </div>
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
        <div className="w-11 h-11 rounded-full bg-bg-subtle animate-pulse" />
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
