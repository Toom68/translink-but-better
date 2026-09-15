"use client";

import { useState, useEffect } from "react";
import { useAlerts } from "@/lib/hooks/use-realtime";
import { loadRoutesMap } from "@/lib/gtfs/static";
import { Card, Skeleton, EmptyState, Badge, Sheet } from "@/components/ui";
import { AlertCircle } from "lucide-react";
import type { ServiceAlert, TransitMode, GTFSRoute } from "@/lib/gtfs/types";
import { cn } from "@/lib/utils";

const FILTER_TABS: { mode: TransitMode | "saved"; label: string }[] = [
  { mode: "all", label: "All" },
  { mode: "bus", label: "Bus" },
  { mode: "rail", label: "Train" },
  { mode: "ferry", label: "Ferry" },
  { mode: "tram", label: "Tram" },
];

function severityToColor(severity: number): "danger" | "warning" | "default" {
  if (severity >= 3) return "danger";
  if (severity >= 2) return "warning";
  return "default";
}

function severityLabel(severity: number): string {
  if (severity >= 3) return "Severe";
  if (severity >= 2) return "Warning";
  if (severity >= 1) return "Info";
  return "Unknown";
}

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const [routesMap, setRoutesMap] = useState<Map<string, GTFSRoute>>(new Map());
  const [filter, setFilter] = useState<TransitMode | "saved">("all");
  const [selectedAlert, setSelectedAlert] = useState<ServiceAlert | null>(null);

  useEffect(() => {
    loadRoutesMap().then(setRoutesMap).catch(() => {});
  }, []);

  function alertMatchesFilter(alert: ServiceAlert, mode: TransitMode): boolean {
    if (mode === "all") return true;
    return alert.routeIds.some((rid) => {
      const route = routesMap.get(rid);
      if (!route) return false;
      const routeMode: TransitMode =
        route.type === 3 ? "bus" :
        route.type === 4 ? "ferry" :
        route.type === 0 ? "tram" : "rail";
      return routeMode === mode;
    });
  }

  const filtered = alerts?.filter((a) => alertMatchesFilter(a, filter as TransitMode)) ?? [];

  return (
    <div className="px-5 pt-10 pb-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Service Alerts</h1>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => setFilter(tab.mode)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
              filter === tab.mode
                ? "bg-accent text-white shadow-sm"
                : "bg-bg-elevated border border-border text-text-secondary hover:bg-bg-subtle"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<AlertCircle size={28} strokeWidth={1.5} />}
          title="No active alerts"
          description="There are no service alerts for this filter right now."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <Card
              key={alert.id}
              className="p-4 cursor-pointer active:scale-[0.98] transition-transform duration-200"
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
                    severityToColor(alert.severity) === "danger" && "bg-danger",
                    severityToColor(alert.severity) === "warning" && "bg-warning",
                    severityToColor(alert.severity) === "default" && "bg-text-muted"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1">{alert.headerText}</p>
                  {alert.descriptionText && (
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {alert.descriptionText}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <Badge color={severityToColor(alert.severity)}>
                      {severityLabel(alert.severity)}
                    </Badge>
                    <Badge>{alert.effect.replace(/_/g, " ").toLowerCase()}</Badge>
                    {alert.routeIds.slice(0, 3).map((rid) => {
                      const route = routesMap.get(rid);
                      return (
                        <Badge
                          key={rid}
                          style={{
                            backgroundColor: route?.color ? `#${route.color}` : undefined,
                            color: route?.textColor ? `#${route.textColor}` : undefined,
                          }}
                        >
                          {route?.shortName || rid}
                        </Badge>
                      );
                    })}
                    {alert.routeIds.length > 3 && (
                      <span className="text-xs text-text-muted">
                        +{alert.routeIds.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Alert detail sheet */}
      <Sheet
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.headerText}
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={severityToColor(selectedAlert.severity)}>
                {severityLabel(selectedAlert.severity)}
              </Badge>
              <Badge>{selectedAlert.cause.replace(/_/g, " ").toLowerCase()}</Badge>
              <Badge>{selectedAlert.effect.replace(/_/g, " ").toLowerCase()}</Badge>
            </div>

            {selectedAlert.descriptionText && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {selectedAlert.descriptionText}
              </p>
            )}

            {selectedAlert.routeIds.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Affected Routes</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAlert.routeIds.map((rid) => {
                    const route = routesMap.get(rid);
                    return (
                      <Badge
                        key={rid}
                        style={{
                          backgroundColor: route?.color ? `#${route.color}` : undefined,
                          color: route?.textColor ? `#${route.textColor}` : undefined,
                        }}
                      >
                        {route?.shortName || route?.longName || rid}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedAlert.stopIds.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Affected Stops</h3>
                <p className="text-sm text-text-secondary">
                  {selectedAlert.stopIds.length} stops affected
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
