import { ensureSignalServiceStarted, subscribeToSignal, getSignalState } from "@/lib/signal-service";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { computeLiveStructure } from "@/lib/live-structure";
import type { PriceTick, SignalState } from "@/lib/signal-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

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

// Direct fetch for serverless environments
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let history: PriceTick[] = [];
      let previousPrice: number | null = null;

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Subscribe to singleton updates (works on long-running hosts)
      const unsubscribe = subscribeToSignal((state) => {
        // Only use singleton state if it has real (non-simulated) data
        if (state.source !== "simulated" && state.source !== "init") {
          history = state.history;
          send(state);
        }
      });

      // For serverless (Vercel), do direct fetches every 10s
      const directFetchInterval = setInterval(async () => {
        if (closed) return;
        const result = await fetchLivePriceDirect();
        if (!result) return;

        const newTick: PriceTick = {
          price: result.price,
          timestamp: new Date().toISOString(),
          source: result.source,
        };
        previousPrice = history.length > 0 ? history[history.length - 1].price : null;
        history = [...history, newTick].slice(-120);

        // Build state with fresh data
        const singletonState = getSignalState();
        const state: SignalState = {
          ...singletonState,
          currentPrice: result.price,
          previousPrice,
          source: result.source,
          timestamp: newTick.timestamp,
          history,
          distanceToEntry: Math.abs(result.price - TRADE_PLAN.entry),
          distanceToStop: Math.abs(result.price - TRADE_PLAN.stopLoss),
          distanceToTp: Math.abs(result.price - TRADE_PLAN.takeProfit),
          nextUpdateIn: 10,
        };
        state.liveStructure = computeLiveStructure(history);
        send(state);
      }, 10000);

      // Initial fetch immediately
      const initialResult = await fetchLivePriceDirect();
      if (initialResult) {
        const newTick: PriceTick = {
          price: initialResult.price,
          timestamp: new Date().toISOString(),
          source: initialResult.source,
        };
        history = [newTick];

        const singletonState = getSignalState();
        const state: SignalState = {
          ...singletonState,
          currentPrice: initialResult.price,
          previousPrice: null,
          source: initialResult.source,
          timestamp: newTick.timestamp,
          history,
          distanceToEntry: Math.abs(initialResult.price - TRADE_PLAN.entry),
          distanceToStop: Math.abs(initialResult.price - TRADE_PLAN.stopLoss),
          distanceToTp: Math.abs(initialResult.price - TRADE_PLAN.takeProfit),
          nextUpdateIn: 10,
        };
        state.liveStructure = computeLiveStructure(history);
        send(state);
      }

      // Heartbeat every 15s
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          closed = true;
        }
      }, 15000);

      // Cleanup
      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(directFetchInterval);
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Max lifetime 5 minutes per SSE connection
      setTimeout(cleanup, 5 * 60 * 1000);
    },
    cancel() {
      // Client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
}
