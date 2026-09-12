# TransLink But Better

A mobile-first PWA for TransLink Brisbane (SEQ) whose home screen is a customizable library of saved bus/train/ferry/tram stops, with live arrivals, live vehicle tracking on a map, stop search, and service alerts.

## Features

- **Library of saved stops** — your personalized home screen with live arrival countdowns
- **Live vehicle map** — real-time bus/train/ferry/tram positions on a full-screen map
- **Stop search + nearby** — search by name or stop code, find stops near your location
- **Service alerts** — disruptions and alerts filtered by mode and route
- **Cloud sync** — saved stops follow you across devices via Supabase
- **PWA** — installable, works offline, dark mode

## Tech Stack

- **Next.js 16** (App Router, webpack) + React 19 + TypeScript
- **MapLibre GL** + OpenFreeMap (free, no API key vector tiles)
- **Supabase** (Postgres + Auth, magic-link email)
- **Serwist** (service worker / PWA)
- **Tailwind CSS v4** (minimal-mono design system)
- **Zustand** + **TanStack Query** (state management)
- **FlexSearch** (client-side stop search)
- **@dnd-kit** (drag-to-reorder)

## Data Sources

All data is free, no authentication required, licensed CC-BY-4.0:

- **Realtime (GTFS-RT v2.0 protobuf):** `https://gtfsrt.api.translink.com.au/api/realtime/SEQ/`
  - Vehicle Positions, Trip Updates, Service Alerts
- **Static (weekly GTFS zip):** `https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip`
  - Parsed at build time into compact JSON (`stops.json`, `routes.json`)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable Email auth with magic links (see `supabase/README.md`)
4. Copy your project URL and anon key

### 3. Configure environment variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key-here
```

### 4. Build GTFS data (first run)

```bash
npm run build-gtfs
```

This downloads the ~30MB GTFS zip and extracts stops/routes into `public/gtfs/`. Set `FORCE_GTFS_REBUILD=1` to force a re-download.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

### 6. Build for production

```bash
npm run build
```

The build automatically runs `build-gtfs` first (skips if JSON files already exist).

## Deploy to Netlify

1. Push the repo to GitHub
2. Connect the repo to Netlify
3. Set environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
4. Deploy — `netlify.toml` is preconfigured with the Next.js plugin

## Project Structure

```
app/
  (auth)/          — login + auth callback (no auth guard)
  (app)/           — main app screens (auth guard)
    page.tsx       — Library (home): saved stops with live arrivals
    stops/[id]/    — stop detail: arrivals + alerts
    search/        — stop search + nearby
    map/           — live vehicle map
    alerts/        — service alerts
    settings/      — account, theme, about
  api/realtime/    — API routes (protobuf decode + cache)
  manifest.ts      — PWA manifest
  sw.ts            — Serwist service worker
components/        — UI components (StopCard, ArrivalsList, VehicleMap, etc.)
lib/
  gtfs/            — GTFS types, static data loaders, realtime decode
  hooks/           — React hooks (useArrivals, useVehicles, useAlerts, etc.)
  store/           — Zustand stores (saved stops)
  supabase/        — Supabase client/server/middleware
  utils/           — utilities (distance, time, formatting)
scripts/
  build-gtfs.ts    — prebuild GTFS static data processor
  gen-icons.ts     — PWA icon generator
supabase/
  schema.sql       — database schema + RLS policies
  README.md        — Supabase setup guide
```

## Attribution

- Real-time and schedule data: TransLink Queensland (CC-BY-4.0)
- Map tiles: OpenFreeMap / OpenStreetMap contributors
