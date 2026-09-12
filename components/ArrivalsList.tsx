"use client";

import { Badge } from "@/components/ui";
import { formatCountdown, formatClockTime, formatDelay, getDelayStatus, cn } from "@/lib/utils";
import type { Arrival } from "@/lib/gtfs/types";
import { Bus, Train, Sailboat, TramFront } from "lucide-react";

function ModeIcon({ mode, size = 16 }: { mode: string; size?: number }) {
  const icons: Record<string, typeof Bus> = {
    bus: Bus,
    rail: Train,
    ferry: Sailboat,
    tram: TramFront,
  };
  const Icon = icons[mode] ?? Bus;
  return <Icon size={size} />;
}

export function ArrivalsList({
  arrivals,
  routesMap,
  compact = false,
}: {
  arrivals: Arrival[];
  routesMap?: Map<string, { id: string; shortName: string; longName: string; type: number; color: string; textColor: string }>;
  compact?: boolean;
}) {
  if (!arrivals || arrivals.length === 0) {
    return (
      <p className="text-sm text-text-muted py-2">
        No live arrivals found.
      </p>
    );
  }

  const max = compact ? 3 : 50;
  const visible = arrivals.slice(0, max);

  return (
    <div className="space-y-1">
      {visible.map((arrival, i) => {
        const route = routesMap?.get(arrival.routeId);
        const routeName = route?.shortName || arrival.routeId;
        const routeColor = route?.color ? `#${route.color}` : "#525252";
        const delayStatus = getDelayStatus(arrival.delay);
        const headsign = arrival.tripHeadsign || route?.longName || "";

        return (
          <div
            key={`${arrival.tripId}-${i}`}
            className={cn(
              "flex items-center gap-3 py-1.5",
              !compact && "border-b border-border last:border-0 py-3"
            )}
          >
            {/* Route badge */}
            <div
              className="flex items-center justify-center min-w-[44px] h-9 px-2 rounded-md text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: routeColor,
                color: route?.textColor ? `#${route.textColor}` : "#fff",
              }}
            >
              {routeName}
            </div>

            {/* Headsign */}
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", compact ? "text-text" : "text-text")}>
                {headsign}
              </p>
              {!compact && (
                <p className="text-xs text-text-muted">
                  {formatClockTime(arrival.predictedTime ?? arrival.scheduledTime)}
                  {arrival.delay != null && arrival.delay !== 0 && (
                    <span
                      className={cn(
                        "ml-2",
                        delayStatus === "late" && "text-warning",
                        delayStatus === "early" && "text-success"
                      )}
                    >
                      {formatDelay(arrival.delay)}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Countdown */}
            <div className="text-right flex-shrink-0">
              <p className={cn("font-semibold tabular-nums", compact ? "text-sm" : "text-base")}>
                {formatCountdown(arrival.predictedTime ?? arrival.scheduledTime)}
              </p>
              {!compact && delayStatus === "on-time" && (
                <p className="text-[10px] text-text-muted">on time</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
