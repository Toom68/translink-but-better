import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import type {
  VehiclePosition,
  Arrival,
  ServiceAlert,
  TransitMode,
} from "./types";

const BASE_URL =
  process.env.TRANSLINK_GTFSRT_BASE_URL || "https://gtfsrt.api.translink.com.au";

const REGION = "SEQ";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
};

export { CACHE_HEADERS };

// Helper: convert Long or number to number
function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  // Long type
  const long = v as { toNumber?: () => number; low?: number; high?: number };
  if (typeof long.toNumber === "function") return long.toNumber();
  return Number(v);
}

function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  return toNum(v);
}

// ── Vehicle Positions ──

export async function fetchVehiclePositions(
  mode: TransitMode = "all"
): Promise<VehiclePosition[]> {
  const typePath =
    mode === "all" ? "" : `/${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  const url = `${BASE_URL}/api/realtime/${REGION}/VehiclePositions${typePath}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`VehiclePositions fetch failed: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );

  const vehicles: VehiclePosition[] = [];

  for (const entity of feed.entity) {
    const vp = entity.vehicle;
    if (!vp) continue;

    vehicles.push({
      vehicleId: vp.vehicle?.id ?? "",
      tripId: vp.trip?.tripId ?? "",
      routeId: vp.trip?.routeId ?? "",
      lat: toNum(vp.position?.latitude) || 0,
      lng: toNum(vp.position?.longitude) || 0,
      bearing: toNum(vp.position?.bearing) || 0,
      speed: vp.position?.speed != null ? toNum(vp.position.speed) : null,
      timestamp: toNum(vp.timestamp) || 0,
      currentStopSequence: vp.currentStopSequence ?? null,
      currentStatus: vp.currentStatus ?? null,
    });
  }

  return vehicles;
}

// ── Trip Updates (Arrivals for a specific stop) ──

export async function fetchArrivalsForStop(stopId: string): Promise<Arrival[]> {
  const url = `${BASE_URL}/api/realtime/${REGION}/TripUpdates`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TripUpdates fetch failed: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );

  const arrivals: Arrival[] = [];

  for (const entity of feed.entity) {
    const tu = entity.tripUpdate;
    if (!tu) continue;

    const stopUpdates = tu.stopTimeUpdate ?? [];
    for (const stu of stopUpdates) {
      if (stu.stopId !== stopId) continue;

      const delay = toNumOrNull(stu.arrival?.delay ?? stu.departure?.delay);
      const scheduledTime = toNumOrNull(stu.arrival?.time ?? stu.departure?.time);
      const predictedTime =
        scheduledTime != null && delay != null ? scheduledTime + delay : scheduledTime;

      arrivals.push({
        routeId: tu.trip?.routeId ?? "",
        tripId: tu.trip?.tripId ?? "",
        tripHeadsign: (tu.trip as { tripHeadsign?: string }).tripHeadsign ?? "",
        stopId: stu.stopId ?? "",
        scheduledTime,
        predictedTime,
        delay,
        scheduleRelationship: scheduleRelationshipToString(stu.scheduleRelationship),
        vehicleId: tu.vehicle?.id ?? null,
      });
    }
  }

  // Sort by predicted time ascending
  arrivals.sort((a, b) => {
    const ta = a.predictedTime ?? a.scheduledTime ?? 0;
    const tb = b.predictedTime ?? b.scheduledTime ?? 0;
    return ta - tb;
  });

  return arrivals;
}

function scheduleRelationshipToString(sr: number | null | undefined): string {
  switch (sr) {
    case 0:
      return "SCHEDULED";
    case 1:
      return "SKIPPED";
    case 2:
      return "NO_DATA";
    case 3:
      return "UNSCHEDULED";
    default:
      return "UNKNOWN";
  }
}

// ── Service Alerts ──

export async function fetchServiceAlerts(): Promise<ServiceAlert[]> {
  const url = `${BASE_URL}/api/realtime/${REGION}/Alerts`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Alerts fetch failed: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );

  const alerts: ServiceAlert[] = [];

  for (const entity of feed.entity) {
    const sa = entity.alert;
    if (!sa) continue;

    const routeIds: string[] = [];
    const stopIds: string[] = [];

    for (const ie of sa.informedEntity ?? []) {
      if (ie.routeId) routeIds.push(ie.routeId);
      if (ie.stopId) stopIds.push(ie.stopId);
    }

    const headerText =
      (sa as { header?: { translation?: { text?: string }[] } }).header?.translation?.[0]?.text ?? "";
    const descriptionText =
      sa.descriptionText?.translation?.[0]?.text ?? "";

    alerts.push({
      id: entity.id,
      cause: causeToString(sa.cause),
      effect: effectToString(sa.effect),
      severity: toNum(sa.severityLevel) || 0,
      headerText,
      descriptionText,
      routeIds: [...new Set(routeIds)],
      stopIds: [...new Set(stopIds)],
      activePeriods: (sa.activePeriod ?? []).map((p) => ({
        start: toNumOrNull(p.start),
        end: toNumOrNull(p.end),
      })),
    });
  }

  return alerts;
}

function causeToString(cause: number | null | undefined): string {
  const causes = [
    "UNKNOWN_CAUSE",
    "OTHER_CAUSE",
    "TECHNICAL_PROBLEM",
    "STRIKE",
    "DEMONSTRATION",
    "ACCIDENT",
    "HOLIDAY",
    "WEATHER",
    "MAINTENANCE",
    "CONSTRUCTION",
    "POLICE_ACTIVITY",
    "MEDICAL_EMERGENCY",
  ];
  return causes[cause ?? 0] ?? "UNKNOWN_CAUSE";
}

function effectToString(effect: number | null | undefined): string {
  const effects = [
    "NO_SERVICE",
    "REDUCED_SERVICE",
    "SIGNIFICANT_DELAYS",
    "DETOUR",
    "ADDITIONAL_SERVICE",
    "MODIFIED_SERVICE",
    "OTHER_EFFECT",
    "UNKNOWN_EFFECT",
    "STOP_MOVED",
  ];
  return effects[effect ?? 7] ?? "UNKNOWN_EFFECT";
}
