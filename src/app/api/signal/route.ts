import { NextResponse } from "next/server";
import { ensureSignalServiceStarted, getSignalState } from "@/lib/signal-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// NOTE: Do NOT call ensureSignalServiceStarted() at module load time.
// During `next build`, Next.js evaluates route modules to collect page data.
// If we start the fetcher here, it runs during the build (where network
// access may be restricted or unstable) and can crash the build.
// Instead, we start it lazily on the first request at runtime.

let started = false;
function ensureStarted() {
  if (started) return;
  started = true;
  try {
    ensureSignalServiceStarted();
  } catch (e) {
    console.error("[signal] failed to start service:", e);
  }
}

export function GET() {
  ensureStarted();
  const state = getSignalState();
  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
