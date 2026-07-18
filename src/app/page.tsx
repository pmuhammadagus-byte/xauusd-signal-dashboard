import { AlertTriangle, Radio } from "lucide-react";
import { TradePlanHero } from "@/components/trading/trade-plan-hero";
import { LiveSignalBanner } from "@/components/trading/live-signal-banner";
import { LiveTradePanel } from "@/components/trading/live-trade-panel";
import { LivePriceChart } from "@/components/trading/live-price-chart";
import { MarketOverview } from "@/components/trading/market-overview";
import { TopDownAnalysis } from "@/components/trading/topdown-analysis";
import { StructureChart } from "@/components/trading/structure-chart";
import { SupplyDemandChart } from "@/components/trading/supply-demand-chart";
import { LiquidityMap } from "@/components/trading/liquidity-map";
import { BosChochTimeline } from "@/components/trading/bos-choch-timeline";
import { CandlestickConfirmations, ChartPatternValidation } from "@/components/trading/candlestick-patterns";
import { MethodologyDocs } from "@/components/trading/methodology-docs";
import { RiskCalculator } from "@/components/trading/risk-calculator";
import { Sources } from "@/components/trading/sources";
import { CURRENT_MARKET } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-rose-50 via-background to-emerald-50 dark:from-rose-950/20 dark:via-background dark:to-emerald-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
              Au
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                XAU/USD · Aggressive Execution Command
              </div>
              <div className="text-sm font-mono">
                {CURRENT_MARKET.symbol} · Spot ${CURRENT_MARKET.spot.toLocaleString()} · {CURRENT_MARKET.asOf}
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            XAU/USD Live Signal & Trade Plan
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Real-time XAU/USD signal dashboard. Live price feed updates every 60 seconds via SSE —
            just open this page anytime to see current price, signal status, distance to entry/SL/TP,
            and live PnL. Combined with full top-down analysis using market structure, supply & demand,
            liquidity, BOS/CHoCH, candlestick confirmation, and chart-pattern validation.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-sky-700 dark:text-sky-300">
            <Radio className="h-4 w-4" />
            <span><strong>Live feed active</strong> — page auto-updates. No refresh needed.</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-1 font-semibold border border-rose-200 dark:border-rose-900">
              DIRECTION: {TRADE_PLAN.direction}
            </span>
            <span className="rounded-full bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-3 py-1 font-semibold border border-sky-200 dark:border-sky-900">
              ENTRY: ${TRADE_PLAN.entry}
            </span>
            <span className="rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-1 font-semibold border border-rose-200 dark:border-rose-900">
              STOP: ${TRADE_PLAN.stopLoss}
            </span>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 font-semibold border border-emerald-200 dark:border-emerald-900">
              TARGET: ${TRADE_PLAN.takeProfit}
            </span>
            <span className="rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-3 py-1 font-semibold border border-violet-200 dark:border-violet-900">
              R:R = 1:{TRADE_PLAN.rr}
            </span>
          </div>
        </div>
      </header>

      {/* Risk disclaimer banner */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Educational analysis.</strong> Not financial advice. Trading XAU/USD involves substantial risk of loss.
            Always do your own due diligence and never risk capital you cannot afford to lose.
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* LIVE signal banner — always at top */}
        <section id="live-signal">
          <LiveSignalBanner />
        </section>

        {/* Live trade monitor + live chart side by side */}
        <section id="live-monitor" className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <LiveTradePanel />
          <LivePriceChart />
        </section>

        {/* Hero trade plan (the structural setup) */}
        <section id="trade-plan">
          <TradePlanHero />
        </section>

        {/* Market overview */}
        <section id="market">
          <MarketOverview />
        </section>

        {/* Top-down analysis */}
        <section id="topdown">
          <TopDownAnalysis />
        </section>

        {/* Structure chart */}
        <section id="structure">
          <StructureChart />
        </section>

        {/* Supply/demand chart */}
        <section id="zones">
          <SupplyDemandChart />
        </section>

        {/* Liquidity map */}
        <section id="liquidity">
          <LiquidityMap />
        </section>

        {/* BOS/CHoCH timeline */}
        <section id="events">
          <BosChochTimeline />
        </section>

        {/* Candlestick + pattern validation */}
        <section id="confirmations" className="grid gap-6 lg:grid-cols-2">
          <CandlestickConfirmations />
          <ChartPatternValidation />
        </section>

        {/* Risk calculator */}
        <section id="risk">
          <RiskCalculator />
        </section>

        {/* Methodology */}
        <section id="methodology">
          <MethodologyDocs />
        </section>

        {/* Sources */}
        <section id="sources">
          <Sources />
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <strong className="text-foreground">{TRADE_PLAN.symbol} {TRADE_PLAN.direction}</strong> ·
              Entry ${TRADE_PLAN.entry} · Stop ${TRADE_PLAN.stopLoss} · TP ${TRADE_PLAN.takeProfit} · R:R 1:{TRADE_PLAN.rr}
            </div>
            <div>Generated {new Date(TRADE_PLAN.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</div>
          </div>
          <div className="text-[10px] leading-relaxed">
            This analysis is generated by AI using methodologies from canonical trading literature
            (ICT / Smart Money Concepts, classical price action, candlestick analysis, and chart-pattern trading).
            All structural levels are derived from observed market data as of {CURRENT_MARKET.asOf}.
            Market conditions change rapidly — verify all levels against live charts before executing.
            Past performance is not indicative of future results. You are solely responsible for your trading decisions.
          </div>
        </div>
      </footer>
    </main>
  );
}
