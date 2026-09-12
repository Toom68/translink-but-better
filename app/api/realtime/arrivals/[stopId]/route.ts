import { NextResponse } from "next/server";
import { fetchArrivalsForStop, CACHE_HEADERS } from "@/lib/gtfs/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stopId: string }> }
) {
  try {
    const { stopId } = await params;

    if (!stopId) {
      return NextResponse.json(
        { error: "stopId is required" },
        { status: 400 }
      );
    }

    const arrivals = await fetchArrivalsForStop(stopId);
    return NextResponse.json(arrivals, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error("Arrivals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch arrivals" },
      { status: 502 }
    );
  }
}
