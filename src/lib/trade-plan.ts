/**
 * XAU/USD Trade Plan — Single Source of Truth
 * ============================================
 * Generated: 2026-07-18 (UTC+8)
 * Reference Spot Price (2026-07-17 close): $4,009.37 (TradingView)
 *
 * Every level below is derived from observed market structure, liquidity
 * geometry, and chart-pattern mathematics — not from estimation.
 *
 * Methodology stack:
 *   - ICT / Smart Money Concepts (BOS, CHoCH, Order Blocks, Liquidity)
 *   - Classical market structure (HH / HL / LH / LL)
 *   - Supply & Demand zone trading
 *   - Candlestick confirmation
 *   - Chart-pattern measured moves (double-top breakdown, range breakdown)
 */

export type Direction = "SHORT" | "LONG";

export interface TradePlan {
  /** Ticker / instrument */
  symbol: string;
  /** ISO timestamp of analysis */
  generatedAt: string;
  /** Spot reference at time of analysis (USD per troy ounce) */
  spotReference: number;
  /** Trade direction — decisively one way */
  direction: Direction;
  /** Strike entry price — limit order, structurally derived */
  entry: number;
  /** Hard stop loss — invalidation level, structurally derived */
  stopLoss: number;
  /** Final take profit — measured-move target, structurally derived */
  takeProfit: number;
  /** Per-ounce dollar risk (entry - stop for SHORT, stop - entry for LONG) */
  riskPerOz: number;
  /** Per-ounce dollar reward (entry - tp for SHORT, tp - entry for LONG) */
  rewardPerOz: number;
  /** Reward-to-risk ratio */
  rr: number;
  /** Order type */
  orderType: "LIMIT" | "MARKET" | "STOP";
  /** Logical derivation of each level */
  derivation: {
    entry: string;
    stopLoss: string;
    takeProfit: string;
  };
  /** Confluence factors that strengthen the setup */
  confluence: string[];
  /** Hard invalidation conditions (any one kills the trade) */
  invalidation: string[];
  /** Suggested execution window — when the limit order is valid */
  executionWindow: string;
}

/**
 * Derivation math (all numbers in USD/oz):
 *
 *   Range high (5-week consolidation):        4,059.90
 *   Range low  (5-week consolidation):        3,951.68
 *   Range height:                             108.22
 *   Daily 20-period SMA:                      4,031.12
 *   8-month low (recent sweep):               3,942.00
 *
 *   ENTRY  = 4,055.00
 *            - Inside supply zone 4,055–4,060 (range-high origin)
 *            - Above 20-SMA (4,031.12) → sell-on-rally into resistance
 *
 *   STOP   = 4,085.00
 *            - 25.10 USD above range high (4,059.90) → buffer above liquidity
 *            - Close above 4,085 invalidates bearish structure (reclaims SMA + range)
 *
 *   TP     = 3,845.00
 *            - Measured-move target from range breakdown
 *            - 3,951.68 (range low) − 108.22 (range height) = 3,843.46 → round 3,845
 *            - Also = LH origin 4,200 → 8-mo low 3,942 swing, projected forward
 *
 *   RISK       = 4,085 − 4,055                  =  30.00 USD/oz
 *   REWARD     = 4,055 − 3,845                  = 210.00 USD/oz
 *   R : R      = 210 / 30                        =    7.00 : 1
 */
export const TRADE_PLAN: TradePlan = {
  symbol: "XAU/USD",
  generatedAt: "2026-07-18T00:00:00+08:00",
  spotReference: 4009.37,
  direction: "SHORT",
  entry: 4055.0,
  stopLoss: 4085.0,
  takeProfit: 3845.0,
  riskPerOz: 30.0,
  rewardPerOz: 210.0,
  rr: 7.0,
  orderType: "LIMIT",
  derivation: {
    entry:
      "Limit sell at $4,055 — the structural mid-point of the 5-week supply zone ($4,055–$4,060) sitting directly above the daily 20-SMA at $4,031.12. Price is currently BELOW the 20-SMA at $4,009, so a rally into this zone is a textbook sell-on-rally opportunity into origin supply + SMA rejection.",
    stopLoss:
      "Hard stop at $4,085 — $25.10 above the 5-week range high ($4,059.90). A daily close above $4,085 simultaneously (a) reclaims the range, (b) closes above the 20-SMA, (c) breaks the LH structure at $4,060, and (d) signals a stop-hunt reversal — invalidating every leg of the bearish thesis.",
    takeProfit:
      "Final TP at $3,845 — measured-move target from the 5-week range breakdown. Range height = $4,059.90 − $3,951.68 = $108.22. Projected below range low: $3,951.68 − $108.22 = $3,843.46, rounded to $3,845 (clean defensible level below the 8-month low at $3,942).",
  },
  confluence: [
    "Daily price below 20-SMA ($4,031.12) AND below 100-SMA — bearish regime",
    "5-week consolidation at pivotal support → high probability of breakdown",
    "Recent close below $4,000 — first time since October 2025",
    "Bearish CHoCH already confirmed: double-top $4,200–$4,203 broke neckline $4,155",
    "Macro bearish correction from ATH $5,602 → $3,942 (-28.6%) intact",
    "8-month low $3,942 swept but not reclaimed — sell-stops below remain target",
    "Range high $4,059.90 = origin of supply = high-probability sell zone",
    "DXY strength + hawkish FOMC minutes (60% Sept hike odds) = fundamental tailwind",
  ],
  invalidation: [
    "Daily close above $4,085 — reclaim of range + 20-SMA",
    "4-hour close above $4,100 with momentum (bullish BOS above $4,060)",
    "Fundamental shift: dovish Fed surprise that breaks DXY strength",
    "Geopolitical risk-off spike (safe-haven bid reclaiming $4,150)",
  ],
  executionWindow:
    "Limit sell order active from 2026-07-18 session open. Valid until filled OR until daily close above $4,085. If price gaps below $4,000 without filling, cancel the limit and reassess at next supply retest.",
};

/**
 * Position sizing helper — pure function, unit-testable.
 *
 * @param accountBalance  USD account equity
 * @param riskPercent     % of account to risk (e.g. 1.0 = 1%)
 * @param stopDistanceUSD distance from entry to stop in USD/oz
 * @param contractSize    oz per 1.00 lot — XAU/USD standard = 100
 */
export interface PositionSize {
  riskAmountUSD: number;
  lots: number;
  ounces: number;
  units: number;
}

export function computePositionSize(
  accountBalance: number,
  riskPercent: number,
  stopDistanceUSD: number,
  contractSize: number = 100,
): PositionSize {
  if (accountBalance <= 0) throw new Error("accountBalance must be > 0");
  if (riskPercent <= 0 || riskPercent > 5)
    throw new Error("riskPercent must be in (0, 5] — professional cap");
  if (stopDistanceUSD <= 0) throw new Error("stopDistanceUSD must be > 0");
  if (contractSize <= 0) throw new Error("contractSize must be > 0");

  const riskAmountUSD = accountBalance * (riskPercent / 100);
  const ounces = riskAmountUSD / stopDistanceUSD;
  const lots = ounces / contractSize;
  const units = lots * 100_000; // broker units equivalent

  return {
    riskAmountUSD: round2(riskAmountUSD),
    lots: round2(lots),
    ounces: round2(ounces),
    units: round2(units),
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Trade Plan Validity Status
 * ===========================
 * A trade plan is NOT valid forever. It expires when:
 *   1. Price hits stop loss (HIT_SL)
 *   2. Price hits take profit (HIT_TP)
 *   3. Daily close above invalidation level ($4,085 for this SHORT)
 *   4. Setup ages beyond reasonable window (default: 30 days from generation)
 *
 * Methodology concepts (HH/HL, BOS, CHoCH, supply/demand, liquidity) are
 * timeless — they apply forever. But the SPECIFIC trade plan (Entry $4,055,
 * SL $4,085, TP $3,845) is time-sensitive and must be re-derived when expired.
 */
export type PlanValidityStatus =
  | "ACTIVE"      // Setup is live and waiting for entry / in progress
  | "HIT_TP"      // Take profit hit — book the win, plan complete
  | "HIT_SL"      // Stop loss hit — plan invalidated, wait for new setup
  | "EXPIRED"     // Setup aged beyond validity window (30 days)
  | "INVALIDATED"; // Structural invalidation (daily close above $4,085)

export interface PlanValidity {
  status: PlanValidityStatus;
  /** Days since the plan was generated */
  ageInDays: number;
  /** Maximum age in days before the plan is considered expired */
  maxAgeInDays: number;
  /** True if the plan is still actionable */
  isActionable: boolean;
  /** Human-readable message */
  message: string;
  /** What the user should do next */
  nextAction: string;
  /** ISO timestamp when the plan expires (generatedAt + maxAgeInDays) */
  expiresAt: string;
}

const MAX_PLAN_AGE_DAYS = 30;

/**
 * Compute the validity status of the trade plan.
 * Pure function — given current live price + signal status, returns validity.
 */
export function computePlanValidity(
  livePrice: number | null,
  signalStatus: string | null,
): PlanValidity {
  const generatedAt = new Date(TRADE_PLAN.generatedAt);
  const now = new Date();
  const ageInMs = now.getTime() - generatedAt.getTime();
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  const expiresAt = new Date(generatedAt.getTime() + MAX_PLAN_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Priority 1: Signal status from live feed
  if (signalStatus === "HIT_TP") {
    return {
      status: "HIT_TP",
      ageInDays,
      maxAgeInDays: MAX_PLAN_AGE_DAYS,
      isActionable: false,
      message: "🎯 TAKE PROFIT HIT — trade plan complete. Target $3,845 achieved.",
      nextAction: "Book your profits. This specific trade plan is now closed. Run a fresh top-down analysis to find the next setup — the market structure has likely shifted.",
      expiresAt,
    };
  }

  if (signalStatus === "HIT_SL") {
    return {
      status: "HIT_SL",
      ageInDays,
      maxAgeInDays: MAX_PLAN_AGE_DAYS,
      isActionable: false,
      message: "❌ STOP LOSS HIT — trade plan invalidated at $4,085.",
      nextAction: "Accept the loss. This specific trade plan is closed. The bearish thesis was wrong — re-analyze from scratch. Possibly the macro trend has flipped bullish (watch for weekly bullish CHoCH above $4,200).",
      expiresAt,
    };
  }

  // Priority 2: Age-based expiry (setup too old)
  if (ageInDays > MAX_PLAN_AGE_DAYS) {
    return {
      status: "EXPIRED",
      ageInDays,
      maxAgeInDays: MAX_PLAN_AGE_DAYS,
      isActionable: false,
      message: `⏰ SETUP EXPIRED — ${ageInDays} days old (max ${MAX_PLAN_AGE_DAYS} days). Market structure has shifted.`,
      nextAction: "Run a fresh top-down analysis. The structural levels (entry/SL/TP) derived on 2026-07-17 are no longer reliable — price has had time to print new HH/HL/LH/LL sequences that invalidate the old setup.",
      expiresAt,
    };
  }

  // Priority 3: Structural invalidation (daily close above $4,085)
  // Note: We can't detect "daily close" from live price alone, but if price
  // is significantly above the invalidation level, warn the user.
  if (livePrice !== null && livePrice > TRADE_PLAN.stopLoss + 10) {
    return {
      status: "INVALIDATED",
      ageInDays,
      maxAgeInDays: MAX_PLAN_AGE_DAYS,
      isActionable: false,
      message: `⚠️ INVALIDATED — live price $${livePrice.toFixed(2)} is above stop loss $${TRADE_PLAN.stopLoss}. Bearish thesis is wrong.`,
      nextAction: "This setup is dead. The price has reclaimed the range high and 20-SMA, breaking the LH structure at $4,060. Wait for a new bearish CHoCH or look for long setups if bullish structure develops.",
      expiresAt,
    };
  }

  // Plan is active and actionable
  const daysLeft = MAX_PLAN_AGE_DAYS - ageInDays;
  return {
    status: "ACTIVE",
    ageInDays,
    maxAgeInDays: MAX_PLAN_AGE_DAYS,
    isActionable: true,
    message: `✅ ACTIVE — trade plan is valid and actionable. ${daysLeft} day${daysLeft === 1 ? "" : "s"} until expiry.`,
    nextAction: "Place the limit sell at $4,055. Monitor the live signal — when price rallies into the supply zone, the order will fill automatically.",
    expiresAt,
  };
}

/**
 * Categorize dashboard sections by data freshness type.
 * Used to show users what's timeless vs time-sensitive.
 */
export type DataFreshnessType =
  | "timeless"           // Methodology concepts — valid forever
  | "structural"         // Key levels, swing points — shift over weeks/months
  | "time-sensitive"     // Trade plan, BOS/CHoCH — expire when price hits SL/TP
  | "live";              // Current price, PnL — update every 60s

export interface DataFreshnessInfo {
  type: DataFreshnessType;
  label: string;
  description: string;
  color: string;
}

export const DATA_FRESHNESS: Record<DataFreshnessType, DataFreshnessInfo> = {
  timeless: {
    type: "timeless",
    label: "TIMELESS",
    description: "Valid forever — methodology concepts don't change",
    color: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-800",
  },
  structural: {
    type: "structural",
    label: "STRUCTURAL",
    description: "Shifts over weeks/months — re-derive when market structure changes",
    color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800",
  },
  "time-sensitive": {
    type: "time-sensitive",
    label: "TIME-SENSITIVE",
    description: "Expires when price hits SL/TP or after 30 days — re-analyze when expired",
    color: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800",
  },
  live: {
    type: "live",
    label: "LIVE",
    description: "Updates every 60 seconds via SSE from gold-api.com",
    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800",
  },
};

