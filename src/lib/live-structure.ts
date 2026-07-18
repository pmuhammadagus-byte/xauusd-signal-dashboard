/**
 * Live Structure Engine — Pure Functions
 * =======================================
 * Computes market structure (swing points, supply/demand zones, liquidity
 * pools, BOS/CHoCH events) from a live tick history buffer.
 *
 * This is the "auto-update" brain: instead of relying on static research
 * data from 2026-07-17, these functions re-derive structure from the most
 * recent N ticks of live price data.
 *
 * Algorithm:
 *   - Swing detection: local maxima/minima with a lookback window
 *   - Zone detection: origin of strong directional moves (impulse legs)
 *   - Liquidity: resting stops above recent swing highs / below recent swing lows
 *   - BOS: price breaks the most recent swing high (bullish) or low (bearish)
 *   - CHoCH: a BOS against the prevailing trend direction
 */

import type { PriceTick } from "./signal-engine";

// =====================================================
// Types
// =====================================================

export interface LiveSwingPoint {
  price: number;
  timestamp: string;
  kind: "HH" | "HL" | "LH" | "LL";
  index: number;
  tickIndex: number;
}

export interface LiveZone {
  id: string;
  type: "supply" | "demand";
  top: number;
  bottom: number;
  origin: string;
  strength: "fresh" | "tested-once" | "mitigated";
  formedAt: string;
}

export interface LiveLiquidityPool {
  id: string;
  side: "above" | "below";
  price: number;
  type: "buy-stop" | "sell-stop" | "round-number";
  note: string;
  distanceFromLive: number;
}

export interface LiveStructureEvent {
  id: string;
  type: "BOS" | "CHoCH" | "LIQUIDITY-SWEEP";
  direction: "bullish" | "bearish";
  level: number;
  timestamp: string;
  description: string;
  significance: "high" | "medium" | "low";
}

export interface LiveStructure {
  /** Detected swing points from tick history (newest last) */
  swings: LiveSwingPoint[];
  /** Supply and demand zones derived from impulse legs */
  zones: LiveZone[];
  /** Liquidity pools above and below current price */
  liquidity: LiveLiquidityPool[];
  /** BOS/CHoCH/liquidity-sweep events detected from live data */
  events: LiveStructureEvent[];
  /** Dynamic resistance levels (recent swing highs) */
  resistance: number[];
  /** Dynamic support levels (recent swing lows) */
  support: number[];
  /** Session statistics */
  sessionHigh: number;
  sessionLow: number;
  sessionOpen: number | null;
  /** Simple moving averages computed from tick history */
  sma20: number | null;
  sma50: number | null;
  /** Current trend based on swing sequence */
  trend: "bullish" | "bearish" | "ranging" | "unknown";
  /** Count of ticks analyzed */
  tickCount: number;
  /** Timestamp of computation */
  computedAt: string;
}

// =====================================================
// Swing Detection
// =====================================================

/**
 * Detect swing points from tick history using a rolling window.
 * A swing high at index i = price[i] is the max of [i-lookback, i+lookback].
 * A swing low at index i = price[i] is the min of [i-lookback, i+lookback].
 *
 * @param history  Price ticks (oldest first, newest last)
 * @param lookback Number of ticks on each side to compare (default 3)
 */
export function detectSwings(history: PriceTick[], lookback: number = 3): LiveSwingPoint[] {
  if (history.length < lookback * 2 + 1) return [];

  const swings: LiveSwingPoint[] = [];
  let lastSwingHigh: number | null = null;
  let lastSwingLow: number | null = null;

  for (let i = lookback; i < history.length - lookback; i++) {
    const current = history[i].price;
    let isHigh = true;
    let isLow = true;

    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (history[j].price >= current) isHigh = false;
      if (history[j].price <= current) isLow = false;
    }

    if (isHigh) {
      const kind = lastSwingHigh !== null
        ? (current > lastSwingHigh ? "HH" : "LH")
        : "HH";
      swings.push({
        price: current,
        timestamp: history[i].timestamp,
        kind,
        index: swings.length,
        tickIndex: i,
      });
      lastSwingHigh = current;
    } else if (isLow) {
      const kind = lastSwingLow !== null
        ? (current > lastSwingLow ? "HL" : "LL")
        : "LL";
      swings.push({
        price: current,
        timestamp: history[i].timestamp,
        kind,
        index: swings.length,
        tickIndex: i,
      });
      lastSwingLow = current;
    }
  }

  return swings;
}

// =====================================================
// Zone Detection
// =====================================================

/**
 * Detect supply and demand zones from impulse legs.
 * A supply zone = origin of a strong bearish move (price dropped sharply).
 * A demand zone = origin of a strong bullish move (price rose sharply).
 *
 * @param history  Price ticks
 * @param swings   Detected swing points
 * @param minMove  Minimum move size to qualify as impulse (default $5)
 */
export function detectZones(
  history: PriceTick[],
  swings: LiveSwingPoint[],
  minMove: number = 5,
): LiveZone[] {
  const zones: LiveZone[] = [];

  // Find impulse legs between consecutive swings
  for (let i = 1; i < swings.length; i++) {
    const prev = swings[i - 1];
    const curr = swings[i];
    const moveSize = Math.abs(curr.price - prev.price);

    if (moveSize < minMove) continue;

    // Bearish impulse (high to low) → supply zone at the high
    if ((prev.kind === "HH" || prev.kind === "LH") && (curr.kind === "HL" || curr.kind === "LL")) {
      const zoneTop = prev.price;
      const zoneBottom = Math.max(prev.price - 3, prev.price * 0.999);
      zones.push({
        id: `live-supply-${i}`,
        type: "supply",
        top: zoneTop,
        bottom: zoneBottom,
        origin: `Live: bearish impulse from $${prev.price.toFixed(2)} → $${curr.price.toFixed(2)} ($${moveSize.toFixed(2)})`,
        strength: "fresh",
        formedAt: prev.timestamp,
      });
    }

    // Bullish impulse (low to high) → demand zone at the low
    if ((prev.kind === "HL" || prev.kind === "LL") && (curr.kind === "HH" || curr.kind === "LH")) {
      const zoneBottom = prev.price;
      const zoneTop = Math.min(prev.price + 3, prev.price * 1.001);
      zones.push({
        id: `live-demand-${i}`,
        type: "demand",
        top: zoneTop,
        bottom: zoneBottom,
        origin: `Live: bullish impulse from $${prev.price.toFixed(2)} → $${curr.price.toFixed(2)} ($${moveSize.toFixed(2)})`,
        strength: "fresh",
        formedAt: prev.timestamp,
      });
    }
  }

  // Keep only the most recent 6 zones
  return zones.slice(-6);
}

// =====================================================
// Liquidity Pool Detection
// =====================================================

/**
 * Detect liquidity pools from recent swing highs and lows.
 * Buy-stops rest above recent swing highs; sell-stops rest below recent swing lows.
 *
 * @param swings       Detected swing points
 * @param currentPrice Live price
 */
export function detectLiquidity(
  swings: LiveSwingPoint[],
  currentPrice: number,
): LiveLiquidityPool[] {
  const pools: LiveLiquidityPool[] = [];
  const recentSwings = swings.slice(-10); // last 10 swings

  // Buy-stop pools above recent swing highs
  const swingHighs = recentSwings.filter((s) => s.kind === "HH" || s.kind === "LH");
  for (const sh of swingHighs) {
    if (sh.price > currentPrice) {
      pools.push({
        id: `live-buystop-${sh.index}`,
        side: "above",
        price: sh.price,
        type: "buy-stop",
        note: `Live: resting buy-stops above ${sh.kind} at $${sh.price.toFixed(2)}`,
        distanceFromLive: sh.price - currentPrice,
      });
    }
  }

  // Sell-stop pools below recent swing lows
  const swingLows = recentSwings.filter((s) => s.kind === "HL" || s.kind === "LL");
  for (const sl of swingLows) {
    if (sl.price < currentPrice) {
      pools.push({
        id: `live-sellstop-${sl.index}`,
        side: "below",
        price: sl.price,
        type: "sell-stop",
        note: `Live: resting sell-stops below ${sl.kind} at $${sl.price.toFixed(2)}`,
        distanceFromLive: currentPrice - sl.price,
      });
    }
  }

  // Round-number liquidity (every $50 near current price)
  const round50 = Math.round(currentPrice / 50) * 50;
  for (const rn of [round50 - 50, round50, round50 + 50]) {
    if (rn > currentPrice && !pools.some((p) => Math.abs(p.price - rn) < 5)) {
      pools.push({
        id: `live-round-${rn}`,
        side: "above",
        price: rn,
        type: "round-number",
        note: `Live: round-number magnet $${rn}`,
        distanceFromLive: rn - currentPrice,
      });
    } else if (rn < currentPrice && !pools.some((p) => Math.abs(p.price - rn) < 5)) {
      pools.push({
        id: `live-round-${rn}`,
        side: "below",
        price: rn,
        type: "round-number",
        note: `Live: round-number magnet $${rn}`,
        distanceFromLive: currentPrice - rn,
      });
    }
  }

  // Sort by distance from live price
  return pools.sort((a, b) => a.distanceFromLive - b.distanceFromLive);
}

// =====================================================
// BOS / CHoCH Detection
// =====================================================

/**
 * Detect BOS and CHoCH events by checking if live price has crossed
 * recent swing highs/lows.
 *
 * - BOS (Break of Structure): price breaks the most recent swing high (bullish)
 *   or swing low (bearish) in the direction of the prevailing trend.
 * - CHoCH (Change of Character): price breaks against the prevailing trend
 *   (e.g., in a bearish LH/LL sequence, a break above the recent LH = bullish CHoCH).
 *
 * @param swings       Detected swing points
 * @param history      Full tick history (to check when the break happened)
 * @param currentPrice Live price
 */
export function detectStructureEvents(
  swings: LiveSwingPoint[],
  history: PriceTick[],
  currentPrice: number,
): LiveStructureEvent[] {
  const events: LiveStructureEvent[] = [];
  if (swings.length < 1 || history.length < 2) return events;

  // Determine prevailing trend from swing sequence
  const trend = detectTrend(swings);

  // Find the most recent swing high and swing low
  const recentHighs = swings.filter((s) => s.kind === "HH" || s.kind === "LH");
  const recentLows = swings.filter((s) => s.kind === "HL" || s.kind === "LL");
  const lastHigh = recentHighs[recentHighs.length - 1];
  const lastLow = recentLows[recentLows.length - 1];

  // Check for bullish break (price above last swing high)
  if (lastHigh && currentPrice > lastHigh.price) {
    const isCHoCH = trend === "bearish"; // breaking above in a bearish trend = CHoCH
    events.push({
      id: `live-bos-up-${lastHigh.index}`,
      type: isCHoCH ? "CHoCH" : "BOS",
      direction: "bullish",
      level: lastHigh.price,
      timestamp: history[history.length - 1].timestamp,
      description: `Live: price $${currentPrice.toFixed(2)} broke above ${lastHigh.kind} at $${lastHigh.price.toFixed(2)} — ${isCHoCH ? "Change of Character (potential reversal)" : "continuation of bullish structure"}.`,
      significance: isCHoCH ? "high" : "medium",
    });
  }

  // Check for bearish break (price below last swing low)
  if (lastLow && currentPrice < lastLow.price) {
    const isCHoCH = trend === "bullish"; // breaking below in a bullish trend = CHoCH
    events.push({
      id: `live-bos-down-${lastLow.index}`,
      type: isCHoCH ? "CHoCH" : "BOS",
      direction: "bearish",
      level: lastLow.price,
      timestamp: history[history.length - 1].timestamp,
      description: `Live: price $${currentPrice.toFixed(2)} broke below ${lastLow.kind} at $${lastLow.price.toFixed(2)} — ${isCHoCH ? "Change of Character (potential reversal)" : "continuation of bearish structure"}.`,
      significance: isCHoCH ? "high" : "medium",
    });
  }

  // Check for liquidity sweep (price wicked below a swing low then recovered)
  if (lastLow && history.length >= 3) {
    const recent = history.slice(-5);
    const sweptBelow = recent.some((t) => t.price < lastLow.price);
    const recovered = currentPrice > lastLow.price;
    if (sweptBelow && recovered) {
      events.push({
        id: `live-sweep-${lastLow.index}`,
        type: "LIQUIDITY-SWEEP",
        direction: "bullish",
        level: lastLow.price,
        timestamp: history[history.length - 1].timestamp,
        description: `Live: sell-stop sweep below ${lastLow.kind} at $${lastLow.price.toFixed(2)} — price wicked below and recovered. Bullish signal.`,
        significance: "high",
      });
    }
  }

  // Check for liquidity sweep above (price wicked above a swing high then dropped)
  if (lastHigh && history.length >= 3) {
    const recent = history.slice(-5);
    const sweptAbove = recent.some((t) => t.price > lastHigh.price);
    const dropped = currentPrice < lastHigh.price;
    if (sweptAbove && dropped) {
      events.push({
        id: `live-sweep-up-${lastHigh.index}`,
        type: "LIQUIDITY-SWEEP",
        direction: "bearish",
        level: lastHigh.price,
        timestamp: history[history.length - 1].timestamp,
        description: `Live: buy-stop sweep above ${lastHigh.kind} at $${lastHigh.price.toFixed(2)} — price wicked above and dropped. Bearish signal.`,
        significance: "high",
      });
    }
  }

  return events;
}

// =====================================================
// Trend Detection
// =====================================================

/**
 * Detect the prevailing trend from the swing sequence.
 * - Bullish: sequence of HH and HL
 * - Bearish: sequence of LH and LL
 * - Ranging: mixed or insufficient data
 */
export function detectTrend(swings: LiveSwingPoint[]): "bullish" | "bearish" | "ranging" | "unknown" {
  if (swings.length < 2) return "unknown";

  const recent = swings.slice(-4);
  const highs = recent.filter((s) => s.kind === "HH" || s.kind === "LH");
  const lows = recent.filter((s) => s.kind === "HL" || s.kind === "LL");

  const bullishHighs = highs.filter((s) => s.kind === "HH").length;
  const bearishHighs = highs.filter((s) => s.kind === "LH").length;
  const bullishLows = lows.filter((s) => s.kind === "HL").length;
  const bearishLows = lows.filter((s) => s.kind === "LL").length;

  const bullishScore = bullishHighs + bullishLows;
  const bearishScore = bearishHighs + bearishLows;

  if (bullishScore > bearishScore && bullishScore >= 2) return "bullish";
  if (bearishScore > bullishScore && bearishScore >= 2) return "bearish";
  if (recent.length >= 2) return "ranging";
  return "unknown";
}

// =====================================================
// SMA Computation
// =====================================================

/**
 * Compute simple moving averages from tick history.
 */
export function computeSMAs(history: PriceTick[]): {
  sma20: number | null;
  sma50: number | null;
} {
  if (history.length === 0) return { sma20: null, sma50: null };

  const sma = (period: number): number | null => {
    if (history.length < period) return null;
    const slice = history.slice(-period);
    const sum = slice.reduce((acc, t) => acc + t.price, 0);
    return sum / period;
  };

  return { sma20: sma(20), sma50: sma(50) };
}

// =====================================================
// Main: Compute Full Live Structure
// =====================================================

/**
 * Compute the full live structure from tick history.
 * This is the entry point — call this on every tick to refresh all structure.
 */
export function computeLiveStructure(history: PriceTick[]): LiveStructure {
  const currentPrice = history.length > 0 ? history[history.length - 1].price : 0;

  const swings = detectSwings(history);
  const zones = detectZones(history, swings);
  const liquidity = detectLiquidity(swings, currentPrice);
  const events = detectStructureEvents(swings, history, currentPrice);
  const trend = detectTrend(swings);
  const { sma20, sma50 } = computeSMAs(history);

  // Dynamic resistance = recent swing highs (above current price)
  const resistance = swings
    .filter((s) => (s.kind === "HH" || s.kind === "LH") && s.price > currentPrice)
    .map((s) => s.price)
    .sort((a, b) => a - b)
    .slice(0, 5);

  // Dynamic support = recent swing lows (below current price)
  const support = swings
    .filter((s) => (s.kind === "HL" || s.kind === "LL") && s.price < currentPrice)
    .map((s) => s.price)
    .sort((a, b) => b - a)
    .slice(0, 5);

  // Session stats
  const prices = history.map((t) => t.price);
  const sessionHigh = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const sessionLow = prices.length > 0 ? Math.min(...prices) : currentPrice;
  const sessionOpen = history.length > 0 ? history[0].price : null;

  return {
    swings,
    zones,
    liquidity,
    events,
    resistance,
    support,
    sessionHigh,
    sessionLow,
    sessionOpen,
    sma20,
    sma50,
    trend,
    tickCount: history.length,
    computedAt: new Date().toISOString(),
  };
}
