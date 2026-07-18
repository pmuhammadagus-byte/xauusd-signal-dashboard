/**
 * In-Process Signal Service — Singleton
 * =======================================
 * Lives inside the Next.js server process (no separate mini-service needed).
 * Starts a background interval that fetches live XAU/USD prices every 60s
 * and caches the latest signal state in memory.
 *
 * Frontend polls GET /api/signal every ~10s (or uses the data directly).
 * For real-time push, we use Server-Sent Events (SSE) at /api/signal/stream
 * which works without a separate WebSocket service.
 */

import { TRADE_PLAN } from "@/lib/trade-plan";
import {
  computeSignalState,
  appendTick,
  simulateNextPrice,
  type SignalState,
  type PriceTick,
} from "@/lib/signal-engine";

const FETCH_INTERVAL_MS = 60_000;
const MAX_HISTORY = 120;

// Singleton state — module-level, shared across all requests in the same process
let currentPrice: number = TRADE_PLAN.spotReference;
let previousPrice: number | null = null;
let history: PriceTick[] = [];
let lastFetchSource = "init";
let lastFetchTime = new Date().toISOString();
let nextUpdateIn = 60;
let lastFetchAt = Date.now();
let intervalStarted = false;
let countdownInterval: NodeJS.Timeout | null = null;
let fetchInterval: NodeJS.Timeout | null = null;

// SSE subscribers
type Subscriber = (state: SignalState) => void;
const subscribers = new Set<Subscriber>();

interface PriceResult {
  price: number;
  source: string;
}

async function fetchFromGoldApi(): Promise<PriceResult | null> {
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
  } catch {
    return null;
  }
}

async function fetchLivePrice(): Promise<PriceResult> {
  const sources = [fetchFromGoldApi];
  for (const src of sources) {
    const result = await src();
    if (result) return result;
  }
  const sim = simulateNextPrice(currentPrice);
  return { price: sim, source: "simulated" };
}

function getCurrentState(nextUpdateOverride?: number): SignalState {
  return computeSignalState(
    currentPrice,
    previousPrice,
    history,
    lastFetchSource,
    nextUpdateOverride ?? nextUpdateIn,
  );
}

function notifySubscribers(state: SignalState): void {
  for (const sub of subscribers) {
    try {
      sub(state);
    } catch (e) {
      console.error("[signal] subscriber error:", e);
    }
  }
}

async function tick(): Promise<void> {
  const result = await fetchLivePrice();
  previousPrice = currentPrice;
  currentPrice = result.price;
  lastFetchSource = result.source;
  lastFetchTime = new Date().toISOString();
  lastFetchAt = Date.now();
  nextUpdateIn = Math.floor(FETCH_INTERVAL_MS / 1000);

  const tickData: PriceTick = {
    price: currentPrice,
    timestamp: lastFetchTime,
    source: result.source,
  };
  history = appendTick(history, tickData);

  const state = getCurrentState();
  notifySubscribers(state);

  console.log(
    `[signal] price=$${currentPrice.toFixed(2)} src=${result.source} status=${state.status} dist=$${state.distanceToEntry.toFixed(2)} subs=${subscribers.size}`,
  );
}

/**
 * Start the background fetcher — idempotent, safe to call multiple times.
 */
export function ensureSignalServiceStarted(): void {
  if (intervalStarted) return;
  intervalStarted = true;

  console.log("[signal] starting in-process signal service (60s interval)");

  // Initial fetch immediately
  tick().catch((e) => console.error("[signal] initial fetch error:", e));

  // Periodic fetch every 60s
  fetchInterval = setInterval(() => {
    tick().catch((e) => console.error("[signal] tick error:", e));
  }, FETCH_INTERVAL_MS);

  // Countdown ticker every 1s
  countdownInterval = setInterval(() => {
    if (nextUpdateIn > 0) nextUpdateIn -= 1;
    // Notify subscribers of countdown (lightweight — just send current state)
    notifySubscribers(getCurrentState());
  }, 1000);
}

/**
 * Get the current signal state (one-shot).
 */
export function getSignalState(): SignalState {
  return getCurrentState();
}

/**
 * Subscribe to live updates (used by SSE endpoint).
 * Returns an unsubscribe function.
 */
export function subscribeToSignal(cb: Subscriber): () => void {
  subscribers.add(cb);
  // Send current state immediately
  cb(getCurrentState());
  return () => {
    subscribers.delete(cb);
  };
}

/**
 * Get the price history buffer.
 */
export function getHistory(): PriceTick[] {
  return [...history];
}

export { MAX_HISTORY };
