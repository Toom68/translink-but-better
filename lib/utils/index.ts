// Haversine distance in meters
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Format countdown time from epoch seconds
export function formatCountdown(epochSeconds: number | null): string {
  if (!epochSeconds) return "—";
  const now = Math.floor(Date.now() / 1000);
  const diff = epochSeconds - now;
  if (diff < 0) return "now";
  if (diff < 60) return `${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

// Format clock time from epoch seconds
export function formatClockTime(epochSeconds: number | null): string {
  if (!epochSeconds) return "—";
  return new Date(epochSeconds * 1000).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Format delay for display
export function formatDelay(delaySeconds: number | null): string {
  if (delaySeconds == null) return "";
  if (delaySeconds === 0) return "on time";
  const mins = Math.floor(Math.abs(delaySeconds) / 60);
  const secs = Math.abs(delaySeconds) % 60;
  if (mins === 0) return `${delaySeconds > 0 ? "+" : "-"}${secs}s`;
  return `${delaySeconds > 0 ? "+" : "-"}${mins}m`;
}

// Get delay status for styling
export function getDelayStatus(
  delaySeconds: number | null
): "on-time" | "late" | "early" | "unknown" {
  if (delaySeconds == null) return "unknown";
  if (Math.abs(delaySeconds) < 60) return "on-time"; // within 1 min
  if (delaySeconds > 0) return "late";
  return "early";
}

// Debounce helper
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Class name helper
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
