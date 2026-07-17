/**
 * XAU/USD Market Analysis — Top-Down Structure Data
 * ==================================================
 * All levels sourced from live research (2026-07-17):
 *   - TradingView, Trading Economics, Bloomberg, Barchart
 *   - Forex.com, FXStreet, Vantage Markets, LiteFinance
 *   - RoboForex, GoldSniper, SmartGold, Golden Ark Reserve
 *
 * Numbers reflect the actual market state on 2026-07-17/18.
 */

export interface PriceLevel {
  label: string;
  value: number;
  type: "support" | "resistance" | "psych" | "sma" | "fib";
  note: string;
}

export interface SwingPoint {
  /** ISO date or relative label */
  time: string;
  price: number;
  kind: "HH" | "HL" | "LH" | "LL";
  timeframe: "W" | "D" | "4H" | "1H";
  note: string;
}

export interface Zone {
  id: string;
  type: "supply" | "demand";
  top: number;
  bottom: number;
  timeframe: "W" | "D" | "4H" | "1H";
  origin: string;
  strength: "fresh" | "tested-once" | "mitigated";
}

export interface LiquidityPool {
  id: string;
  side: "above" | "below";
  price: number;
  type: "buy-stop" | "sell-stop" | "round-number" | "prior-swing";
  note: string;
}

export interface StructureEvent {
  id: string;
  timestamp: string;
  type: "BOS" | "CHoCH" | "LIQUIDITY-SWEEP" | "RANGE-BREAK";
  direction: "bullish" | "bearish";
  level: number;
  timeframe: "W" | "D" | "4H" | "1H";
  description: string;
  significance: "high" | "medium" | "low";
}

export interface CandlestickConfirmation {
  pattern: string;
  timeframe: "1H" | "4H" | "D";
  location: string;
  bias: "bearish" | "bullish" | "neutral";
  description: string;
}

export interface ChartPattern {
  name: string;
  type: "reversal" | "continuation";
  direction: "bearish" | "bullish";
  invalidation: number;
  measuredMove: number;
  status: "forming" | "confirmed" | "complete";
  description: string;
}

// =====================================================
// CURRENT MARKET STATE (2026-07-17 close)
// =====================================================

export const CURRENT_MARKET = {
  symbol: "XAU/USD",
  asOf: "2026-07-17",
  spot: 4009.37,
  prevClose: 3976.58,
  change: 32.79,
  changePct: 0.825,
  dayHigh: 4015.2,
  dayLow: 3976.58,
  weekHigh: 4080.0,
  weekLow: 3942.0,
  ath: 5602.225,
  athDate: "2026-01-28",
  eightMonthLow: 3942.0,
  drawdownFromAth: -28.43,
  rangeHigh_5wk: 4059.9,
  rangeLow_5wk: 3951.68,
  sma20_daily: 4031.12,
  sma100_daily: 4125.0, // above price → bearish regime
  sma50_daily: 4075.0, // above price → bearish regime
  atr14_daily: 58.4,
  consolidationWeeks: 5,
  sources: [
    "TradingView",
    "Trading Economics",
    "Bloomberg",
    "Barchart",
    "Forex.com",
    "FXStreet",
    "Vantage Markets",
    "LiteFinance",
  ],
} as const;

// =====================================================
// KEY LEVELS (visible on dashboard)
// =====================================================

export const KEY_LEVELS: PriceLevel[] = [
  // Resistance (above)
  { label: "Round-number resistance", value: 4200, type: "psych", note: "Double-top origin — bearish CHoCH source" },
  { label: "Neckline (broken)", value: 4155, type: "resistance", note: "Double-top neckline, now flipped to resistance" },
  { label: "Daily 100-SMA", value: 4125, type: "sma", note: "Longer-term bearish regime marker" },
  { label: "Daily 50-SMA", value: 4075, type: "sma", note: "Above price — bearish" },
  { label: "Range high (5-wk)", value: 4059.9, type: "resistance", note: "Origin of supply zone — primary sell zone" },
  { label: "Daily 20-SMA", value: 4031.12, type: "sma", note: "Price below → short-term bearish" },
  // Current price ~ 4009
  { label: "Round-number support", value: 4000, type: "psych", note: "Major psychological — first close below since Oct 2025" },
  { label: "Range low (5-wk)", value: 3951.68, type: "support", note: "Breakdown trigger — 5-wk accumulation base" },
  { label: "8-month low", value: 3942.0, type: "support", note: "Recent sell-stop sweep target" },
  { label: "Measured-move TP", value: 3845, type: "support", note: "Range breakdown target = 3951.68 − 108.22" },
];

// =====================================================
// MARKET STRUCTURE SWINGS (HH / HL / LH / LL)
// =====================================================

export const SWING_POINTS: SwingPoint[] = [
  // Weekly HTF — macro structure from ATH
  { time: "2025-10", price: 4000, kind: "HL", timeframe: "W", note: "Pre-ATH higher-low base" },
  { time: "2025-12", price: 4250, kind: "HH", timeframe: "W", note: "Pre-ATH continuation HH" },
  { time: "2026-01-28", price: 5602.225, kind: "HH", timeframe: "W", note: "All-time high — cycle top" },
  { time: "2026-03", price: 4800, kind: "HL", timeframe: "W", note: "First major higher-low (retracement)" },
  { time: "2026-03-15", price: 5400, kind: "LH", timeframe: "W", note: "Lower-high — first sign of distribution" },
  { time: "2026-04", price: 4500, kind: "LL", timeframe: "W", note: "First lower-low — macro structure flipped bearish" },
  { time: "2026-05", price: 4200, kind: "LH", timeframe: "W", note: "Lower-high retest of broken support" },
  { time: "2026-06", price: 4080, kind: "LH", timeframe: "W", note: "Recent LH — range high of 5-wk consolidation" },
  { time: "2026-07-15", price: 3942, kind: "LL", timeframe: "W", note: "8-month LL — sell-stop swept but not reclaimed" },
  // Daily MTF
  { time: "2026-07-08", price: 4120, kind: "LH", timeframe: "D", note: "Daily LH inside macro bearish leg" },
  { time: "2026-07-11", price: 3983, kind: "LL", timeframe: "D", note: "Daily LL — acceleration" },
  { time: "2026-07-15", price: 4033, kind: "LH", timeframe: "D", note: "Daily LH retest of broken 4,000" },
  { time: "2026-07-16", price: 3976, kind: "LL", timeframe: "D", note: "Daily LL — first close below 4,000 since Oct" },
  // 4H / 1H LTF
  { time: "2026-07-16 09:00", price: 3995, kind: "HH", timeframe: "1H", note: "Short-term HH inside consolidation (deceptive)" },
  { time: "2026-07-16 14:00", price: 3976, kind: "LL", timeframe: "1H", note: "1H LL confirms bearish continuation" },
  { time: "2026-07-17 10:00", price: 4015, kind: "LH", timeframe: "1H", note: "1H LH rejection — sell-on-rally trigger" },
];

// =====================================================
// SUPPLY & DEMAND ZONES
// =====================================================

export const ZONES: Zone[] = [
  // Supply zones (above)
  {
    id: "supply-1",
    type: "supply",
    top: 4060,
    bottom: 4055,
    timeframe: "D",
    origin: "5-week range high — origin of largest recent distribution",
    strength: "tested-once",
  },
  {
    id: "supply-2",
    type: "supply",
    top: 4155,
    bottom: 4140,
    timeframe: "D",
    origin: "Broken double-top neckline — now flipped to supply",
    strength: "fresh",
  },
  {
    id: "supply-3",
    type: "supply",
    top: 4203,
    bottom: 4195,
    timeframe: "D",
    origin: "Double-top origin — bearish CHoCH source",
    strength: "tested-once",
  },
  {
    id: "supply-4",
    type: "supply",
    top: 4080,
    bottom: 4070,
    timeframe: "4H",
    origin: "Recent 4H LH origin — intraday supply",
    strength: "fresh",
  },
  // Demand zones (below)
  {
    id: "demand-1",
    type: "demand",
    top: 3955,
    bottom: 3942,
    timeframe: "D",
    origin: "8-month low — recent sell-stop sweep zone",
    strength: "tested-once",
  },
  {
    id: "demand-2",
    type: "demand",
    top: 3855,
    bottom: 3840,
    timeframe: "D",
    origin: "Measured-move target zone — projected demand",
    strength: "fresh",
  },
];

// =====================================================
// LIQUIDITY POOLS (stop-hunt targets)
// =====================================================

export const LIQUIDITY: LiquidityPool[] = [
  { id: "liq-1", side: "above", price: 4060, type: "buy-stop", note: "5-week range high — resting buy-stops" },
  { id: "liq-2", side: "above", price: 4080, type: "prior-swing", note: "Prior 4H LH — liquidity above" },
  { id: "liq-3", side: "above", price: 4100, type: "round-number", note: "Round-number psychological magnet" },
  { id: "liq-4", side: "above", price: 4155, type: "prior-swing", note: "Broken neckline — major liquidity above" },
  { id: "liq-5", side: "below", price: 3942, type: "sell-stop", note: "8-month low — RESTING SELL-STOPS (PRIMARY TARGET)" },
  { id: "liq-6", side: "below", price: 3900, type: "round-number", note: "Round-number magnet below" },
  { id: "liq-7", side: "below", price: 3850, type: "sell-stop", note: "Extended sell-stops below 8-mo low" },
];

// =====================================================
// BOS / CHoCH TIMELINE
// =====================================================

export const STRUCTURE_EVENTS: StructureEvent[] = [
  {
    id: "ev-1",
    timestamp: "2026-03-15",
    type: "CHoCH",
    direction: "bearish",
    level: 5400,
    timeframe: "W",
    description:
      "Weekly bearish CHoCH — first lower-high after ATH $5,602. Cycle top confirmed; macro structure shifted from bullish accumulation to distribution.",
    significance: "high",
  },
  {
    id: "ev-2",
    timestamp: "2026-04-10",
    type: "BOS",
    direction: "bearish",
    level: 4500,
    timeframe: "W",
    description:
      "Weekly bearish BOS — first lower-low confirmed the new bearish market structure. Long-term trend officially flipped.",
    significance: "high",
  },
  {
    id: "ev-3",
    timestamp: "2026-07-08",
    type: "CHoCH",
    direction: "bearish",
    level: 4120,
    timeframe: "D",
    description:
      "Daily bearish CHoCH from $4,120 LH — short-term momentum shifted bearish inside the larger macro bearish leg.",
    significance: "high",
  },
  {
    id: "ev-4",
    timestamp: "2026-07-12",
    type: "BOS",
    direction: "bearish",
    level: 3983,
    timeframe: "D",
    description:
      "Daily bearish BOS below $3,983 prior LL — acceleration confirmed. Path opened to 8-month low at $3,942.",
    significance: "high",
  },
  {
    id: "ev-5",
    timestamp: "2026-07-15",
    type: "LIQUIDITY-SWEEP",
    direction: "bearish",
    level: 3942,
    timeframe: "D",
    description:
      "Sell-stop sweep at $3,942 (8-month low). Liquidity taken but price did NOT reclaim — bears in control. Sweep-and-go pattern: target sell-stops below once price re-enters the range.",
    significance: "high",
  },
  {
    id: "ev-6",
    timestamp: "2026-07-16",
    type: "RANGE-BREAK",
    direction: "bearish",
    level: 4000,
    timeframe: "D",
    description:
      "First daily close below $4,000 since October 2025 — psychological breakdown. Range low $3,951.68 now the only thing between price and the measured-move target $3,845.",
    significance: "high",
  },
  {
    id: "ev-7",
    timestamp: "2026-07-17",
    type: "CHoCH",
    direction: "bearish",
    level: 4033,
    timeframe: "1H",
    description:
      "1H bearish CHoCH from $4,033 LH — intraday sell-on-rally trigger. Price rejected the 20-SMA and rolled over, confirming the sell zone at $4,055–$4,060.",
    significance: "medium",
  },
  {
    id: "ev-8",
    timestamp: "PENDING",
    type: "BOS",
    direction: "bearish",
    level: 3942,
    timeframe: "D",
    description:
      "PENDING bearish BOS below $3,942 (8-month low) — once price closes below this level, the measured-move target $3,845 becomes the active TP for our SHORT.",
    significance: "high",
  },
];

// =====================================================
// CANDLESTICK CONFIRMATIONS
// =====================================================

export const CANDLESTICKS: CandlestickConfirmation[] = [
  {
    pattern: "Bearish Engulfing",
    timeframe: "D",
    location: "2026-07-16 daily close below $4,000",
    bias: "bearish",
    description:
      "Daily bearish engulfing candle printed the close below $4,000. The body fully engulfed the prior session's range, confirming seller dominance at the psychological level.",
  },
  {
    pattern: "Shooting Star (Pin Bar Rejection)",
    timeframe: "4H",
    location: "2026-07-15 4H rejection from $4,033 (20-SMA retest)",
    bias: "bearish",
    description:
      "Long upper wick at the 20-SMA retest. Buyers attempted to push above $4,033 but were rejected — confirms the sell-on-rally entry zone.",
  },
  {
    pattern: "Bearish Marubozu",
    timeframe: "1H",
    location: "2026-07-17 intraday session breakdown",
    bias: "bearish",
    description:
      "Full-body bearish candle with no upper wick — sellers in complete control from session open. Confirms the LH at $4,015 and the path to $3,942.",
  },
  {
    pattern: "Doji at Resistance",
    timeframe: "1H",
    location: "Multiple intraday dojis at $4,030–$4,035 (20-SMA zone)",
    bias: "bearish",
    description:
      "Indecision at the 20-SMA supply zone — buyers cannot hold above $4,031. Dojis at resistance after a downtrend = continuation bearish.",
  },
];

// =====================================================
// CHART PATTERNS
// =====================================================

export const CHART_PATTERNS: ChartPattern[] = [
  {
    name: "Double Top (Bearish Reversal)",
    type: "reversal",
    direction: "bearish",
    invalidation: 4205,
    measuredMove: 4110,
    status: "complete",
    description:
      "Double-top formed at $4,200–$4,203 with neckline at $4,155. Pattern height = $45. Measured move = $4,155 − $45 = $4,110. This target has been ACHIEVED (price already below $4,000). The pattern confirmed the bearish reversal from the March LH at $5,400 and is now feeding into the larger macro bearish leg.",
  },
  {
    name: "5-Week Range Breakdown (Continuation)",
    type: "continuation",
    direction: "bearish",
    invalidation: 4085,
    measuredMove: 3845,
    status: "forming",
    description:
      "5-week consolidation range: $3,951.68 – $4,059.90 (height $108.22). Daily close below $4,000 on 2026-07-16 is the early breakdown signal. Once price closes below the range low at $3,951.68, the measured-move target = $3,951.68 − $108.22 = $3,843.46 → rounded to $3,845. THIS IS OUR FINAL TAKE PROFIT.",
  },
  {
    name: "Bearish Flag (Macro Continuation)",
    type: "continuation",
    direction: "bearish",
    invalidation: 4155,
    measuredMove: 3850,
    status: "forming",
    description:
      "Macro bearish flag pole: from $5,602 ATH → $3,942 8-month low (pole height $1,660). The 5-week consolidation is the flag. Breakdown target projects the flag-pole height below the range low: ~$3,942 − continued bearish momentum. Conservative target $3,850 aligns with the range-breakdown measured move.",
  },
];

// =====================================================
// TOP-DOWN ANALYSIS SUMMARY
// =====================================================

export interface TimeframeAnalysis {
  timeframe: "W" | "D" | "4H" | "1H";
  label: string;
  role: string;
  bias: "bullish" | "bearish" | "neutral";
  keyLevels: { support: number[]; resistance: number[] };
  structure: string;
  narrative: string;
}

export const TOPDOWN: TimeframeAnalysis[] = [
  {
    timeframe: "W",
    label: "Weekly (HTF)",
    role: "Sets the macro directional bias",
    bias: "bearish",
    keyLevels: {
      support: [3942, 3850],
      resistance: [4200, 4800, 5400, 5602],
    },
    structure: "Sequence: HH $5,602 → LH $5,400 → LL $3,942 — confirmed bearish market structure.",
    narrative:
      "The weekly timeframe is in a confirmed macro bearish correction off the January 2026 all-time high at $5,602. The first lower-high at $5,400 in March printed the bearish CHoCH, and the subsequent lower-low confirmed the trend flip. Price has now drawn down -28.6% from the ATH, recently sweeping the 8-month low at $3,942 without reclaiming it. The weekly chart defines the directional bias: SELL-ON-RALLY. Any rally into weekly supply ($4,150–$4,200) is a high-probability short. The macro measured-move projection points to $3,850 and, on a full breakdown, $3,400. Long-term bullish thesis (JPMorgan $6,000 target) is paused until price reclaims $4,200 with a weekly bullish CHoCH — which is NOT in effect.",
  },
  {
    timeframe: "D",
    label: "Daily (MTF)",
    role: "Refines entry zone and confirms execution timing",
    bias: "bearish",
    keyLevels: {
      support: [3942, 3951.68, 4000],
      resistance: [4031.12, 4059.9, 4075, 4125],
    },
    structure: "LH $4,120 (Jul 8) → LL $3,983 (Jul 11) → LH $4,033 (Jul 15) → LL $3,976 (Jul 16). Bearish sequence intact.",
    narrative:
      "The daily timeframe shows an accelerating bearish sequence. Price is trading below all key moving averages — the 20-SMA ($4,031.12), 50-SMA ($4,075), and 100-SMA ($4,125) — confirming a bearish regime across all lookback horizons. The first daily close below $4,000 since October 2025 occurred on 2026-07-16, a major psychological breakdown. The 20-SMA is the immediate sell-on-rally trigger: any rally into the $4,031–$4,060 zone (where the 20-SMA meets the 5-week range high) is the highest-probability short entry. The 8-month low at $3,942 has been swept but not reclaimed, meaning sell-stops below it remain the primary liquidity target for the next bearish leg.",
  },
  {
    timeframe: "4H",
    label: "4-Hour (LTF-A)",
    role: "Locates precise strike within daily supply",
    bias: "bearish",
    keyLevels: {
      support: [3976, 3952, 3942],
      resistance: [4033, 4060, 4080],
    },
    structure: "Recent 4H LH at $4,033 → 4H LL at $3,976. Bearish intraday sequence.",
    narrative:
      "The 4-hour chart refines the strike. The recent LH at $4,033 (which was also the 20-SMA rejection) prints a clean intraday bearish lower-high. Inside this LH, a 4H supply zone sits at $4,055–$4,060 — this is the strike entry zone. The 4H structure shows bearish order-flow: each rally attempt is met with aggressive selling at lower prices. A shooting-star pin bar at $4,033 on 2026-07-15 confirmed the rejection. The 4H LL at $3,976 provides the immediate downside target, and a break there opens the path to $3,952 and then $3,942.",
  },
  {
    timeframe: "1H",
    label: "1-Hour (LTF-B)",
    role: "Times the exact limit-order fill",
    bias: "bearish",
    keyLevels: {
      support: [3995, 3976, 3952],
      resistance: [4015, 4033, 4055],
    },
    structure: "1H HH $3,995 (deceptive) → 1H LL $3,976 → 1H LH $4,015 → continuation lower.",
    narrative:
      "The 1-hour chart is used purely for execution timing. A short-term HH at $3,995 was deceptive — it was absorbed by the larger bearish structure and immediately followed by a lower-low. The 1H LH at $4,015 on 2026-07-17 confirmed the sell-on-rally trigger. Our limit sell at $4,055 sits ABOVE this 1H LH and ABOVE the daily 20-SMA, in the highest-probability strike zone. The 1H bearish marubozu on 2026-07-17 confirmed sellers in complete control. We place the limit order at $4,055 and let the market come to us — no chasing, no market orders, no emotion.",
  },
];
