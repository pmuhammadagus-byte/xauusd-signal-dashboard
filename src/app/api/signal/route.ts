import { NextResponse } from "next/server";
import { ensureSignalServiceStarted, getSignalState } from "@/lib/signal-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Start the in-process service on first request
ensureSignalServiceStarted();

export function GET() {
  const state = getSignalState();
  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
