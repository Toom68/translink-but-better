/**
 * Build-time script: downloads the TransLink SEQ GTFS static zip,
 * extracts stops.txt and routes.txt, and emits compact JSON to public/gtfs/.
 *
 * Runs as a prebuild step via npm scripts.
 */
import { existsSync, mkdirSync, writeFileSync, createWriteStream } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Open } from "unzipper";
import { parse } from "csv-parse";
import type { GTFSStop, GTFSRoute } from "../lib/gtfs/types";

const GTFS_URL = "https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip";
const CACHE_DIR = join(process.cwd(), "node_modules", ".cache", "gtfs");
const OUTPUT_DIR = join(process.cwd(), "public", "gtfs");

async function downloadZip(): Promise<string> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const zipPath = join(CACHE_DIR, "SEQ_GTFS.zip");

  console.log("[build-gtfs] Downloading SEQ_GTFS.zip...");
  const res = await fetch(GTFS_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download GTFS zip: ${res.status}`);
  }

  await pipeline(res.body as never, createWriteStream(zipPath));
  console.log(`[build-gtfs] Saved to ${zipPath}`);
  return zipPath;
}

async function extractCsv(zipPath: string, filename: string): Promise<string> {
  const directory = await Open.file(zipPath);
  const file = directory.files.find((f) => f.path.endsWith(filename));
  if (!file) {
    throw new Error(`${filename} not found in zip`);
  }
  const content = await file.buffer();
  return content.toString("utf-8");
}

function parseCsv(csvText: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const records: Record<string, string>[] = [];
    parse(csvText, { columns: true, skip_empty_lines: true })
      .on("data", (row: Record<string, string>) => records.push(row))
      .on("end", () => resolve(records))
      .on("error", reject);
  });
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Check if we already have built files (skip during dev unless forced)
  if (
    process.env.FORCE_GTFS_REBUILD !== "1" &&
    existsSync(join(OUTPUT_DIR, "stops.json")) &&
    existsSync(join(OUTPUT_DIR, "routes.json"))
  ) {
    console.log("[build-gtfs] stops.json and routes.json already exist, skipping.");
    console.log("[build-gtfs] Set FORCE_GTFS_REBUILD=1 to force rebuild.");
    return;
  }

  const zipPath = await downloadZip();

  console.log("[build-gtfs] Extracting stops.txt...");
  const stopsCsv = await extractCsv(zipPath, "stops.txt");
  const stopsRaw = await parseCsv(stopsCsv);

  const stops: GTFSStop[] = stopsRaw.map((row) => ({
    id: row.stop_id,
    code: row.stop_code ?? "",
    name: row.stop_name ?? "",
    lat: parseFloat(row.stop_lat) || 0,
    lng: parseFloat(row.stop_lon) || 0,
    locationType: parseInt(row.location_type ?? "0", 10) || 0,
    parentStation: row.parent_station || null,
    platformCode: row.platform_code || null,
  }));

  console.log(`[build-gtfs] Parsed ${stops.length} stops`);

  console.log("[build-gtfs] Extracting routes.txt...");
  const routesCsv = await extractCsv(zipPath, "routes.txt");
  const routesRaw = await parseCsv(routesCsv);

  const routes: GTFSRoute[] = routesRaw.map((row) => ({
    id: row.route_id,
    shortName: row.route_short_name ?? "",
    longName: row.route_long_name ?? "",
    type: parseInt(row.route_type ?? "3", 10) || 3,
    color: row.route_color ?? "",
    textColor: row.route_text_color ?? "",
  }));

  console.log(`[build-gtfs] Parsed ${routes.length} routes`);

  // Write JSON files
  writeFileSync(join(OUTPUT_DIR, "stops.json"), JSON.stringify(stops));
  writeFileSync(join(OUTPUT_DIR, "routes.json"), JSON.stringify(routes));

  console.log(
    `[build-gtfs] Wrote stops.json (${(JSON.stringify(stops).length / 1024 / 1024).toFixed(1)} MB)`
  );
  console.log(
    `[build-gtfs] Wrote routes.json (${(JSON.stringify(routes).length / 1024).toFixed(0)} KB)`
  );
  console.log("[build-gtfs] Done!");
}

main().catch((err) => {
  console.error("[build-gtfs] FATAL:", err);
  process.exit(1);
});
