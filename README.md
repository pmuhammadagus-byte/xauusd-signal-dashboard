# XAU/USD Live Signal & Decisive Trade Plan — Aggressive Execution Dashboard

A production-grade trading-analysis web application that provides **continuous real-time XAU/USD signals** — just open the page anytime to see the current price, signal status, distance to entry/SL/TP, and live PnL. No refresh needed.

The dashboard combines:
- **Live signal feed** — Real-time price updates every 60s via SSE (Server-Sent Events) from gold-api.com
- **Auto-status tracking** — WAITING → ARMED → FILLED → ACTIVE → HIT_TP / HIT_SL transitions automatically as price moves
- **Live PnL monitor** — Unrealized profit/loss, live R:R, progress bar between SL and TP
- **Full top-down analysis** — Market structure (HH/HL/LH/LL), supply & demand zones, liquidity & stop hunting, BOS/CHoCH, candlestick confirmation, chart-pattern validation
- **Methodology documentation** — Every trading concept explained with concrete applications

The output is a single, decisive trade plan with exact Entry, Hard Stop Loss, and Final Take Profit — every level logically derived from structure, liquidity, and price action.

---

## The Trade Plan

| Field | Value |
|---|---|
| **Symbol** | XAU/USD |
| **Direction** | SHORT |
| **Order type** | LIMIT (sell-on-rally) |
| **Strike Entry** | **$4,055.00** |
| **Hard Stop Loss** | **$4,085.00** |
| **Final Take Profit** | **$3,845.00** |
| **Risk per oz** | $30.00 |
| **Reward per oz** | $210.00 |
| **Risk : Reward** | **1 : 7.00** |
| **Generated** | 2026-07-18 |
| **Spot reference** | $4,009.37 (2026-07-17 close) |

### Why SHORT?

1. **Macro structure is bearish** — Weekly sequence: HH $5,602 (Jan 2026 ATH) → LH $5,400 (Mar) → LL $3,942 (Jul). Trend officially flipped bearish in March 2026.
2. **Daily regime is bearish** — Price trades below 20-SMA ($4,031), 50-SMA ($4,075), and 100-SMA ($4,125). All three SMAs are stacked above spot.
3. **First daily close below $4,000 since October 2025** (2026-07-16) — psychological breakdown confirmed.
4. **Bearish CHoCH already confirmed** — Double-top at $4,200–$4,203 broke neckline at $4,155. Pattern measured move achieved.
5. **5-week consolidation at pivotal support** — Range $3,951.68 – $4,059.90. Breakdown measured move = $3,843 (rounded to $3,845 = our TP).
6. **8-month low at $3,942 swept but not reclaimed** — sell-stops below remain the primary liquidity target.
7. **Fundamental tailwind** — DXY strength, hawkish FOMC minutes (~60% September hike odds), bond market strength.

### Entry derivation

Limit sell at $4,055 — the structural mid-point of the 5-week supply zone ($4,055–$4,060), sitting directly above the daily 20-SMA at $4,031.12. Price is currently BELOW the 20-SMA at $4,009, so a rally into this zone is a textbook sell-on-rally opportunity into origin supply + SMA rejection.

### Stop loss derivation

Hard stop at $4,085 — $25.10 above the 5-week range high ($4,059.90). A daily close above $4,085 simultaneously (a) reclaims the range, (b) closes above the 20-SMA, (c) breaks the LH structure at $4,060, and (d) signals a stop-hunt reversal — invalidating every leg of the bearish thesis.

### Take profit derivation

Final TP at $3,845 — measured-move target from the 5-week range breakdown. Range height = $4,059.90 − $3,951.68 = $108.22. Projected below range low: $3,951.68 − $108.22 = $3,843.46, rounded to $3,845 (clean defensible level below the 8-month low at $3,942).

### Expectancy

At 30% win rate: (0.30 × $210) − (0.70 × $30) = **+$42 per trade per oz**.

---

## Live Signal System

The dashboard is a **continuous real-time signal** — just open the page anytime to see the current state.

### How it works

1. **Backend (in-process)**: A singleton service runs inside the Next.js server process. Every 60 seconds it fetches the live XAU/USD price from `gold-api.com` (free, no API key required). If the fetch fails, it falls back to a mean-reverting random-walk simulation.

2. **Signal engine** (`src/lib/signal-engine.ts`): Pure functions compute the live signal state from the current price + trade plan. Status transitions automatically:
   - `WAITING` — Price below entry (for SHORT), waiting for rally into supply
   - `ARMED` — Price within $10 of entry, about to trigger
   - `ACTIVE` — Entry was touched in live history, position is live
   - `HIT_TP` — Price reached take profit
   - `HIT_SL` — Price reached stop loss

3. **Real-time push** (SSE): The `/api/signal/stream` endpoint pushes live updates to all connected clients every second via Server-Sent Events. No WebSocket service needed.

4. **Fallback** (REST polling): If SSE fails, the client hook (`useXauSignal`) automatically falls back to polling `/api/signal` every 10s. Auto-reconnect with exponential backoff.

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/signal` | GET | One-shot JSON snapshot of current signal state |
| `/api/signal/stream` | GET | SSE stream — pushes live updates every second |
| `/api/trade-plan` | GET | Static trade plan + market analysis (original) |

### Live Components

- `LiveSignalBanner` — Top-of-page banner with status, live price, distances, countdown, source
- `LiveTradePanel` — Live PnL, progress bar between SL and TP, live R:R
- `LivePriceChart` — Real-time price chart with entry/SL/TP overlays (Recharts)

### Frontend Hook

```typescript
import { useXauSignal } from "@/hooks/use-xau-signal";

function MyComponent() {
  const { state, loading, error, connected, reconnect } = useXauSignal({
    pollIntervalMs: 10000,  // REST polling fallback interval
    useStream: true,         // use SSE stream (default true)
  });

  if (loading) return <div>Connecting…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Status: {state.status}</h2>
      <p>Live price: ${state.currentPrice.toFixed(2)}</p>
      <p>Distance to entry: ${state.distanceToEntry.toFixed(2)}</p>
      {state.pnlPerOz !== null && (
        <p>Unrealized PnL: ${state.pnlPerOz.toFixed(2)}/oz ({state.pnlAsRR?.toFixed(2)}R)</p>
      )}
    </div>
  );
}
```

The hook handles SSE connection, automatic fallback to polling, exponential-backoff reconnection, and cleanup on unmount.

---

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York style) + **Lucide icons**
- **Recharts** for chart visualizations
- **Framer Motion** for animations
- **Bun test runner** for unit tests

## Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/trade-plan/route.ts    # JSON API endpoint (full analysis payload)
│   │   ├── globals.css
│   │   ├── layout.tsx                  # Metadata + fonts
│   │   └── page.tsx                    # Main dashboard page
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (pre-installed)
│   │   └── trading/
│   │       ├── trade-plan-hero.tsx        # Hero card with Entry/SL/TP/R:R
│   │       ├── market-overview.tsx        # Current market state + key levels
│   │       ├── topdown-analysis.tsx       # HTF → MTF → LTF breakdown
│   │       ├── structure-chart.tsx        # HH/HL/LH/LL swing visualization
│   │       ├── supply-demand-chart.tsx    # Zones with entry/SL/TP overlays
│   │       ├── liquidity-map.tsx          # Stop-hunt pool visualization
│   │       ├── bos-choch-timeline.tsx     # Structure events timeline
│   │       ├── candlestick-patterns.tsx   # Candlestick + chart pattern cards
│   │       ├── methodology-docs.tsx       # Trading concepts (accordion)
│   │       ├── risk-calculator.tsx        # Position size calculator
│   │       └── sources.tsx                # Research source links
│   └── lib/
│       ├── trade-plan.ts               # Single source of truth — TradePlan interface
│       ├── market-analysis.ts          # Market state, swings, zones, events
│       ├── methodology.ts              # Educational concept definitions
│       ├── db.ts                       # Prisma client (unused in this build)
│       └── utils.ts
├── tests/
│   └── trade-plan.test.ts             # 40+ unit tests validating plan integrity
├── research/                          # Raw web-search results (JSON)
│   ├── xau_price_now.json
│   ├── xau_structure.json
│   ├── xau_levels.json
│   ├── xau_setup.json
│   ├── xau_macro.json
│   └── xau_bos.json
└── README.md
```

## Running

```bash
# Install dependencies (already done by fullstack-dev init)
bun install

# Run the dev server (auto-started in this sandbox)
bun run dev

# Run tests
bun test tests/trade-plan.test.ts

# Lint
bun run lint
```

## API

The full analysis payload is also exposed as JSON at `/api/trade-plan`:

```bash
curl http://localhost:3000/api/trade-plan
```

Returns:

```json
{
  "tradePlan": { "direction": "SHORT", "entry": 4055.0, "stopLoss": 4085.0, "takeProfit": 3845.0, "rr": 7.0, ... },
  "market": { "spot": 4009.37, "ath": 5602.225, ... },
  "levels": [...],
  "swings": [...],
  "zones": [...],
  "liquidity": [...],
  "events": [...],
  "candles": [...],
  "patterns": [...],
  "topdown": [...],
  "methodology": [...]
}
```

## Tests

The test suite (`tests/trade-plan.test.ts`) validates 40+ properties of the trade plan:

- **Structural integrity** — direction is SHORT, entry is above spot, SL is above entry, TP is below entry, SL is above range high, TP matches the measured move
- **Risk math** — `riskPerOz = stop − entry`, `rewardPerOz = entry − tp`, `R:R = reward / risk`, positive expectancy at 20% / 30% win rate
- **Derivation completeness** — every level has a 50+ char derivation citing structural logic
- **Market data consistency** — SMAs ordered correctly, spot within range, drawdown computed correctly
- **Structure events** — at least one BOS, one CHoCH, one liquidity sweep, all events bearish
- **Position sizing** — linear scaling, professional risk cap (5%), sane output for $10k account

Run with:

```bash
bun test tests/trade-plan.test.ts
```

---

## Methodology References

This analysis synthesizes concepts from canonical trading literature:

1. **Smart Money Concepts (ICT)** — Michael J. Huddleston's Inner Circle Trader methodology
2. **Classical Market Structure** — Al Brooks' price-action framework
3. **Japanese Candlestick Analysis** — Steve Nison's classical work
4. **Chart Pattern Trading** — Thomas Bulkowski's pattern encyclopedia
5. **Supply & Demand Trading** — Sam Seiden's methodology

These concepts are documented in the in-app Methodology section (click any concept to expand).

## Research Sources

Market data was gathered from the following live sources on 2026-07-17:

- TradingView, Trading Economics, Bloomberg, Barchart (price data)
- Forex.com, FXStreet, Vantage Markets, LiteFinance (analysis)
- Investing.com, Golden Ark Reserve, JPMorgan (macro context)
- TradingView chart ideas (BOS/CHoCH/liquidity sweep analysis)

All raw search results are saved in `/research/*.json` for transparency.

---

## ⚠️ Risk Disclaimer

This is an **educational analysis** generated by AI. It is not financial advice.

- Trading XAU/USD involves substantial risk of loss.
- Leverage can amplify both gains and losses.
- Past performance is not indicative of future results.
- Market conditions change rapidly — verify all levels against live charts before executing.
- Never risk capital you cannot afford to lose.
- You are solely responsible for your trading decisions.

The analysis reflects the market state as of **2026-07-17** and should be re-validated before any execution.
