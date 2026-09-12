import { NextResponse } from "next/server";
import { fetchServiceAlerts, CACHE_HEADERS } from "@/lib/gtfs/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET() {
  try {
    const alerts = await fetchServiceAlerts();
    return NextResponse.json(alerts, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error("Alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service alerts" },
      { status: 502 }
    );
  }
}
