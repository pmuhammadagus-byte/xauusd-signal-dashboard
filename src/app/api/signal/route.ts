import { NextResponse } from "next/server";
import { ensureSignalServiceStarted, getSignalState } from "@/lib/signal-service";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { computeLiveStructure } from "@/lib/live-structure";
import type { PriceTick, SignalState } from "@/lib/signal-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// Lazy-start the in-process singleton (works on Railway/Render/self-hosted)
let started = false;
function ensureStarted() {
  if (started) return;
  started = true;
  try {
    ensureSignalServiceStarted();
  } catch (e) {
    console.error("[signal] failed to start singleton service:", e);
  }
}

// Direct fetch fallback for serverless environments (Vercel)
// where the singleton interval may not persist between invocations.
async function fetchLivePriceDirect(): Promise<{ price: number; source: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.gold-api.com/price/XAU", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { price?: number };
    if (typeof data.price === "number" && data.price > 0) {
      return { price: Math.round(data.price * 100) / 100, source: "gold-api.com" };
    }
    return null;
  } catch (e) {
    console.error("[signal] direct fetch error:", e);
    return null;
  }
}

export async function GET() {
  ensureStarted();

  // Always do a direct fetch to get the freshest price (Vercel serverless friendly)
  const liveResult = await fetchLivePriceDirect();

  let state: SignalState;

  if (liveResult) {
    // Build a fresh state using the live-fetched price
    // Use the singleton's history if available, otherwise start fresh
    const singletonState = getSignalState();
    const history = singletonState.history || [];
    const previousPrice = history.length > 0 ? history[history.length - 1].price : null;

    // Append this tick to history
    const newTick: PriceTick = {
      price: liveResult.price,
      timestamp: new Date().toISOString(),
      source: liveResult.source,
    };
    const updatedHistory = [...history, newTick].slice(-120); // keep last 120

    // Compute signal state with the fresh price
    state = {
      ...singletonState,
      currentPrice: liveResult.price,
      previousPrice,
      source: liveResult.source,
      timestamp: newTick.timestamp,
      history: updatedHistory,
      distanceToEntry: Math.abs(liveResult.price - TRADE_PLAN.entry),
      distanceToStop: Math.abs(liveResult.price - TRADE_PLAN.stopLoss),
      distanceToTp: Math.abs(liveResult.price - TRADE_PLAN.takeProfit),
      nextUpdateIn: 60,
    };

    // Recompute live structure with updated history
    state.liveStructure = computeLiveStructure(updatedHistory);
  } else {
    // Fallback to singleton state (which may have simulated prices)
    state = getSignalState();
  }

  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
