import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: Request) {
  return await updateSession(request as never);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - gtfs (static GTFS JSON files)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|gtfs|api|sw.js|manifest.webmanifest|callback).*)",
  ],
};
