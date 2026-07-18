/**
 * XAU/USD Signal Engine — Pure Functions
 * =======================================
 * Computes live signal status from current price + trade plan.
 * Used by BOTH the backend service and the frontend (for instant local updates).
 *
 * Signal states:
 *   - WAITING   : Price below entry (for SHORT) — waiting for rally into supply
 *   - ARMED     : Price within $10 of entry — about to trigger
 *   - FILLED    : Price has touched entry — position is live
 *   - ACTIVE    : Position live and not yet hit SL or TP
 *   - HIT_SL    : Price touched stop loss — trade invalidated
 *   - HIT_TP    : Price touched take profit — target achieved
 *   - CANCELLED : Invalidation condition met (e.g. daily close above $4,085)
 */

import { TRADE_PLAN } from "./trade-plan";
import { CURRENT_MARKET } from "./market-analysis";

export type SignalStatus =
  | "WAITING"
  | "ARMED"
  | "FILLED"
  | "ACTIVE"
  | "HIT_SL"
  | "HIT_TP"
  | "CANCELLED";

export interface SignalState {
  status: SignalStatus;
  currentPrice: number;
  previousPrice: number | null;
  direction: "SHORT" | "LONG";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  /** Distance from current price to entry in USD (always positive) */
  distanceToEntry: number;
  /** Distance from current price to SL in USD (always positive) */
  distanceToStop: number;
  /** Distance from current price to TP in USD (always positive) */
  distanceToTp: number;
  /** Live risk per oz (entry - currentPrice for SHORT filled, entry - SL otherwise) */
  liveRisk: number;
  /** Live reward per oz (currentPrice - TP for SHORT filled, entry - TP otherwise) */
  liveReward: number;
  /** Live R:R if filled */
  liveRr: number | null;
  /** PnL per oz if filled (negative = loss, positive = profit) */
  pnlPerOz: number | null;
  /** PnL as % of risk if filled */
  pnlAsRR: number | null;
  /** Timestamp of last update */
  timestamp: string;
  /** Source of the price */
  source: string;
  /** Historical price buffer (newest last) */
  history: PriceTick[];
  /** Status message for UI */
  message: string;
  /** Bias derived from price vs SMAs */
  bias: "bearish" | "neutral" | "bullish";
  /** Next update countdown (seconds) */
  nextUpdateIn: number;
}

export interface PriceTick {
  price: number;
  timestamp: string;
  source: string;
}

const MAX_HISTORY = 120; // keep last 120 ticks (~2 hours at 60s interval)

/**
 * Compute the live signal state from a new price tick.
 * Pure function — deterministic given inputs.
 */
export function computeSignalState(
  currentPrice: number,
  previousPrice: number | null,
  history: PriceTick[],
  source: string,
  nextUpdateIn: number = 60,
): SignalState {
  const isShort = TRADE_PLAN.direction === "SHORT";
  const { entry, stopLoss, takeProfit } = TRADE_PLAN;

  // Distance calculations (always positive)
  const distanceToEntry = Math.abs(currentPrice - entry);
  const distanceToStop = Math.abs(currentPrice - stopLoss);
  const distanceToTp = Math.abs(currentPrice - takeProfit);

  // Determine status — SHORT logic
  let status: SignalStatus;
  let message: string;

  if (isShort) {
    // Check invalidation first (highest priority)
    if (currentPrice >= stopLoss) {
      status = "HIT_SL";
      message = `STOP LOSS HIT — price reached $${currentPrice.toFixed(2)}. Trade invalidated. Wait for next setup.`;
    } else if (currentPrice <= takeProfit) {
      status = "HIT_TP";
      message = `TAKE PROFIT HIT — price reached $${currentPrice.toFixed(2)}. Target achieved. Book the win.`;
    } else if (currentPrice <= entry && history.length > 0 && history.some((t) => t.price >= entry)) {
      // Entry was actually touched in live history — position is filled/active
      status = "ACTIVE";
      message = `POSITION ACTIVE — filled at $${entry.toFixed(2)}, now $${currentPrice.toFixed(2)}. Manage the trade.`;
    } else if (currentPrice <= entry) {
      // Price is below entry but entry was never touched in live history
      // (this is the initial state when spot is already below the limit-entry strike)
      status = "WAITING";
      message = `WAITING FOR ENTRY — price $${currentPrice.toFixed(2)} is $${distanceToEntry.toFixed(2)} below entry $${entry.toFixed(2)}. Limit order will fill on any rally into supply.`;
    } else if (distanceToEntry <= 10) {
      status = "ARMED";
      message = `ARMED — price $${currentPrice.toFixed(2)} is within $10 of entry $${entry.toFixed(2)}. Limit order about to trigger.`;
    } else {
      status = "WAITING";
      message = `WAITING FOR ENTRY — price $${currentPrice.toFixed(2)} is $${distanceToEntry.toFixed(2)} below entry $${entry.toFixed(2)}. Wait for rally into supply.`;
    }
  } else {
    // LONG logic (mirrored)
    if (currentPrice <= stopLoss) {
      status = "HIT_SL";
      message = `STOP LOSS HIT — price reached $${currentPrice.toFixed(2)}. Trade invalidated.`;
    } else if (currentPrice >= takeProfit) {
      status = "HIT_TP";
      message = `TAKE PROFIT HIT — price reached $${currentPrice.toFixed(2)}. Target achieved.`;
    } else if (currentPrice >= entry && history.length > 0 && history.some((t) => t.price <= entry)) {
      status = "ACTIVE";
      message = `POSITION ACTIVE — filled at $${entry.toFixed(2)}, now $${currentPrice.toFixed(2)}. Manage the trade.`;
    } else if (currentPrice >= entry) {
      status = "WAITING";
      message = `WAITING FOR ENTRY — price $${currentPrice.toFixed(2)} is above entry $${entry.toFixed(2)} but entry not yet touched in live feed.`;
    } else if (distanceToEntry <= 10) {
      status = "ARMED";
      message = `ARMED — price within $10 of entry. Limit order about to trigger.`;
    } else {
      status = "WAITING";
      message = `WAITING FOR ENTRY — price $${distanceToEntry.toFixed(2)} away from entry.`;
    }
  }

  // Filled checks (was the entry ever touched in recorded history?)
  // Only consider filled if we have actual tick history showing entry was touched.
  // This avoids false "ACTIVE" status on first load when price happens to be below entry.
  const filled = history.length > 0 && (
    isShort
      ? history.some((t) => t.price >= entry)
      : history.some((t) => t.price <= entry)
  );
  if (filled && status === "WAITING") {
    status = "ACTIVE";
    message = `POSITION ACTIVE — entry was touched in live feed, now $${currentPrice.toFixed(2)}. Manage the trade.`;
  }

  // Live PnL (only if filled)
  let pnlPerOz: number | null = null;
  let pnlAsRR: number | null = null;
  let liveRisk = TRADE_PLAN.riskPerOz;
  let liveReward = TRADE_PLAN.rewardPerOz;
  let liveRr: number | null = TRADE_PLAN.rr;

  if (status === "ACTIVE" || status === "HIT_SL" || status === "HIT_TP") {
    if (isShort) {
      pnlPerOz = entry - currentPrice; // positive = profit (price went down)
    } else {
      pnlPerOz = currentPrice - entry;
    }
    pnlAsRR = pnlPerOz / TRADE_PLAN.riskPerOz;

    // Live R:R from current price
    if (isShort) {
      liveRisk = stopLoss - currentPrice; // distance from current UP to SL (always positive when below SL)
      liveReward = currentPrice - takeProfit; // distance from current DOWN to TP (always positive when above TP)
    } else {
      liveRisk = stopLoss - currentPrice;
      liveReward = takeProfit - currentPrice;
    }
    liveRr = liveRisk > 0 ? liveReward / liveRisk : null;
  }

  // Bias from SMAs (currentPrice vs 20-SMA)
  let bias: "bearish" | "neutral" | "bullish" = "neutral";
  if (currentPrice < CURRENT_MARKET.sma20_daily - 5) bias = "bearish";
  else if (currentPrice > CURRENT_MARKET.sma20_daily + 5) bias = "bullish";

  return {
    status,
    currentPrice,
    previousPrice,
    direction: TRADE_PLAN.direction,
    entry,
    stopLoss,
    takeProfit,
    distanceToEntry,
    distanceToStop,
    distanceToTp,
    liveRisk,
    liveReward,
    liveRr,
    pnlPerOz,
    pnlAsRR,
    timestamp: new Date().toISOString(),
    source,
    history,
    message,
    bias,
    nextUpdateIn,
  };
}

/**
 * Append a tick to history, capping at MAX_HISTORY.
 */
export function appendTick(history: PriceTick[], tick: PriceTick): PriceTick[] {
  const next = [...history, tick];
  return next.slice(-MAX_HISTORY);
}

/**
 * Generate a small synthetic price movement for fallback mode
 * (when no live API is available). Uses a random walk with mean reversion
 * to the spot reference.
 */
export function simulateNextPrice(
  currentPrice: number,
  referencePrice: number = TRADE_PLAN.spotReference,
): number {
  // Mean-reverting random walk
  const drift = (referencePrice - currentPrice) * 0.02;
  const noise = (Math.random() - 0.5) * 8; // ±$4 noise
  const next = currentPrice + drift + noise;
  // Clamp to a sane range
  return Math.round(Math.max(3700, Math.min(4300, next)) * 100) / 100;
}
