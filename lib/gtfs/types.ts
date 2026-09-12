// GTFS static data types (from stops.txt, routes.txt)

export interface GTFSStop {
  id: string; // stop_id
  code: string; // stop_code (public code on signs)
  name: string; // stop_name
  lat: number;
  lng: number;
  locationType: number; // 0=stop, 1=station, etc.
  parentStation: string | null;
  platformCode: string | null;
}

export interface GTFSRoute {
  id: string; // route_id
  shortName: string; // route_short_name
  longName: string; // route_long_name
  type: number; // route_type: 0=tram, 1=subway/metro, 2=rail, 3=bus, 4=ferry
  color: string; // route_color (hex without #)
  textColor: string; // route_text_color (hex without #)
}

// GTFS-RT decoded types (our normalized JSON from API routes)

export interface VehiclePosition {
  vehicleId: string;
  tripId: string;
  routeId: string;
  lat: number;
  lng: number;
  bearing: number;
  speed: number | null;
  timestamp: number;
  currentStopSequence: number | null;
  currentStatus: number | null; // 0=incoming, 1=stopped, 2=in transit
}

export interface StopTimeUpdate {
  stopId: string;
  stopSequence: number;
  arrivalTime: number | null;
  departureTime: number | null;
  delay: number | null; // seconds
  scheduleRelationship: number;
}

export interface Arrival {
  routeId: string;
  tripId: string;
  tripHeadsign: string;
  stopId: string;
  scheduledTime: number | null;
  predictedTime: number | null;
  delay: number | null; // seconds (positive = late)
  scheduleRelationship: string;
  vehicleId: string | null;
}

export interface ServiceAlert {
  id: string;
  cause: string;
  effect: string;
  severity: number;
  headerText: string;
  descriptionText: string;
  routeIds: string[];
  stopIds: string[];
  activePeriods: { start: number | null; end: number | null }[];
}

// Transit mode helpers
export type TransitMode = "bus" | "rail" | "tram" | "ferry" | "all";

export function routeTypeToMode(routeType: number): TransitMode {
  switch (routeType) {
    case 0:
      return "tram";
    case 1:
      return "rail"; // subway/metro — TransLink uses this for rail too
    case 2:
      return "rail";
    case 3:
      return "bus";
    case 4:
      return "ferry";
    default:
      return "bus";
  }
}

export const MODE_ICONS: Record<TransitMode, string> = {
  bus: "bus",
  rail: "train",
  tram: "tram",
  ferry: "ferry",
  all: "layers",
};

export const MODE_LABELS: Record<TransitMode, string> = {
  bus: "Bus",
  rail: "Train",
  tram: "Tram",
  ferry: "Ferry",
  all: "All",
};
