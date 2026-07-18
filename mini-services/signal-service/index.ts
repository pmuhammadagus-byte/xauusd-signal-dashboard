/**
 * XAU/USD Live Signal Service
 * ============================
 * Bun + socket.io mini-service on port 3003.
 *
 * - Fetches live XAU/USD price every 60s from multiple public sources
 * - Falls back to simulated price if all sources fail
 * - Computes live signal state via shared engine
 * - Broadcasts state to all connected clients via WebSocket
 * - Serves REST endpoint GET / for one-shot polling fallback
 *
 * WebSocket events:
 *   - 'signal:update'  : server → client, full SignalState (every 60s)
 *   - 'signal:tick'    : server → client, lightweight tick (every 60s)
 *   - 'signal:status'  : client → server, request current state
 *   - 'signal:history' : server → client, full history buffer on connect
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "socket.io";
import { TRADE_PLAN } from "../../src/lib/trade-plan.ts";
import {
  computeSignalState,
  appendTick,
  simulateNextPrice,
  type SignalState,
  type PriceTick,
} from "../../src/lib/signal-engine.ts";

const PORT = 3003;
const FETCH_INTERVAL_MS = 60_000; // 60 seconds

// =====================================================
// State
// =====================================================
let currentPrice: number = TRADE_PLAN.spotReference;
let previousPrice: number | null = null;
let history: PriceTick[] = [];
let lastFetchOk = false;
let lastFetchSource = "init";
let lastFetchTime = new Date().toISOString();
let nextUpdateIn = 60;
let intervalHandle: Timer | null = null;

// =====================================================
// Price fetching — tries multiple sources, returns first success
// =====================================================
interface PriceResult {
  price: number;
  source: string;
}

async function fetchFromGoldApi(): Promise<PriceResult | null> {
  // gold-api.com — free, no key required, returns {price: 4009.37}
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.gold-api.com/price/XAU", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json() as { price?: number };
    if (typeof data.price === "number" && data.price > 0) {
      return { price: Math.round(data.price * 100) / 100, source: "gold-api.com" };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFromFrankfurter(): Promise<PriceResult | null> {
  // Frankfurter.app returns XAU rates — sometimes available
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.frankfurter.app/latest?from=XAU&to=USD", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json() as { rates?: { USD?: number } };
    if (data.rates?.USD && data.rates.USD > 0) {
      return { price: Math.round(data.rates.USD * 100) / 100, source: "frankfurter.app" };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchLivePrice(): Promise<PriceResult> {
  // Try sources in order
  const sources = [fetchFromGoldApi, fetchFromFrankfurter];
  for (const src of sources) {
    const result = await src();
    if (result) return result;
  }
  // All failed — simulate
  const sim = simulateNextPrice(currentPrice);
  return { price: sim, source: "simulated" };
}

// =====================================================
// Compute + broadcast
// =====================================================
let io: Server;

function computeAndBroadcast(): void {
  void (async () => {
    const result = await fetchLivePrice();
    previousPrice = currentPrice;
    currentPrice = result.price;
    lastFetchOk = result.source !== "simulated";
    lastFetchSource = result.source;
    lastFetchTime = new Date().toISOString();
    nextUpdateIn = Math.floor(FETCH_INTERVAL_MS / 1000);

    const tick: PriceTick = {
      price: currentPrice,
      timestamp: lastFetchTime,
      source: result.source,
    };
    history = appendTick(history, tick);

    const state: SignalState = computeSignalState(
      currentPrice,
      previousPrice,
      history,
      result.source,
      nextUpdateIn,
    );

    // Broadcast full state to all clients
    io.emit("signal:update", state);
    io.emit("signal:tick", tick);

    console.log(
      `[${new Date().toISOString()}] price=$${currentPrice.toFixed(2)} src=${result.source} status=${state.status} dist=$${state.distanceToEntry.toFixed(2)} clients=${io.engine.clientsCount}`,
    );
  })();
}

// Countdown ticker — emits "nextUpdateIn" updates every second
function startCountdown(): void {
  setInterval(() => {
    if (nextUpdateIn > 0) nextUpdateIn -= 1;
    io.emit("signal:countdown", { nextUpdateIn, timestamp: new Date().toISOString() });
  }, 1000);
}

// =====================================================
// HTTP + WebSocket server
// =====================================================
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, port: PORT, uptime: process.uptime() }));
    return;
  }

  // REST fallback — one-shot poll of current state
  if (req.url === "/" || req.url === "/signal") {
    const state = computeSignalState(
      currentPrice,
      previousPrice,
      history,
      lastFetchSource,
      nextUpdateIn,
    );
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(state));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log(`[ws] client connected: ${socket.id}`);

  // Send current state + history immediately on connect
  const state = computeSignalState(
    currentPrice,
    previousPrice,
    history,
    lastFetchSource,
    nextUpdateIn,
  );
  socket.emit("signal:update", state);
  socket.emit("signal:history", history);

  socket.on("signal:status", () => {
    const s = computeSignalState(
      currentPrice,
      previousPrice,
      history,
      lastFetchSource,
      nextUpdateIn,
    );
    socket.emit("signal:update", s);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[ws] client disconnected: ${socket.id} (${reason})`);
  });

  socket.on("error", (err) => {
    console.error(`[ws] socket error (${socket.id}):`, err);
  });
});

// =====================================================
// Start
// =====================================================
httpServer.listen(PORT, () => {
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`  XAU/USD Signal Service running on port ${PORT}`);
  console.log(`  Trade plan: ${TRADE_PLAN.direction} ${TRADE_PLAN.symbol}`);
  console.log(`  Entry: $${TRADE_PLAN.entry} | SL: $${TRADE_PLAN.stopLoss} | TP: $${TRADE_PLAN.takeProfit}`);
  console.log(`  R:R = 1:${TRADE_PLAN.rr}`);
  console.log(`  Fetch interval: ${FETCH_INTERVAL_MS / 1000}s`);
  console.log(`  WebSocket path: /?XTransformPort=${PORT}`);
  console.log(`  REST fallback:  http://localhost:${PORT}/signal`);
  console.log(`═══════════════════════════════════════════════════`);

  // Initial fetch immediately
  computeAndBroadcast();
  // Then every 60s
  intervalHandle = setInterval(computeAndBroadcast, FETCH_INTERVAL_MS);
  // Countdown ticker
  startCountdown();
});

process.on("SIGTERM", () => {
  console.log("[shutdown] SIGTERM received");
  if (intervalHandle) clearInterval(intervalHandle);
  io.close();
  httpServer.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("[shutdown] SIGINT received");
  if (intervalHandle) clearInterval(intervalHandle);
  io.close();
  httpServer.close(() => process.exit(0));
});
