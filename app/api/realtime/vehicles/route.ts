import { NextResponse } from "next/server";
import { fetchVehiclePositions, CACHE_HEADERS } from "@/lib/gtfs/realtime";
import type { TransitMode } from "@/lib/gtfs/types";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") ?? "all") as TransitMode;

    const validTypes: TransitMode[] = ["all", "bus", "rail", "tram", "ferry"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type parameter" },
        { status: 400 }
      );
    }

    const vehicles = await fetchVehiclePositions(type);
    return NextResponse.json(vehicles, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error("VehiclePositions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle positions" },
      { status: 502 }
    );
  }
}
