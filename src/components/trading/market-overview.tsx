"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_MARKET, KEY_LEVELS } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { Globe, Database, AlertTriangle, BookOpen, Radio, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MarketOverview() {
  const { state, connected } = useXauSignal({ pollIntervalMs: 10000 });

  // Use live price if available, fall back to reference spot
  const livePrice = state?.currentPrice ?? CURRENT_MARKET.spot;
  const firstTick = state?.history?.[0];
  const sessionChange = firstTick ? livePrice - firstTick.price : CURRENT_MARKET.change;
  const sessionChangePct = firstTick && firstTick.price > 0
    ? (sessionChange / firstTick.price) * 100
    : CURRENT_MARKET.changePct;
  const liveHigh = state?.history?.length ? Math.max(...state.history.map((t) => t.price)) : CURRENT_MARKET.dayHigh;
  const liveLow = state?.history?.length ? Math.min(...state.history.map((t) => t.price)) : CURRENT_MARKET.dayLow;
  const liveDrawdown = ((livePrice - CURRENT_MARKET.ath) / CURRENT_MARKET.ath) * 100;
  const isUp = sessionChange >= 0;

  // Live SMA bias
  const sma20 = CURRENT_MARKET.sma20_daily;
  const sma50 = CURRENT_MARKET.sma50_daily;
  const sma100 = CURRENT_MARKET.sma100_daily;
  const bias20 = livePrice < sma20 - 5 ? "bearish" : livePrice > sma20 + 5 ? "bullish" : "neutral";
  const bias50 = livePrice < sma50 - 5 ? "bearish" : livePrice > sma50 + 5 ? "bullish" : "neutral";
  const bias100 = livePrice < sma100 - 5 ? "bearish" : livePrice > sma100 + 5 ? "bullish" : "neutral";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-sky-500" />
              Live Market State — {CURRENT_MARKET.symbol}
              {connected && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {state ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Live data as of {new Date(state.timestamp).toLocaleString()} · Source: <span className="font-mono font-medium">{state.source}</span>
                </span>
              ) : (
                <span>Reference data as of {CURRENT_MARKET.asOf}. Loading live feed…</span>
              )}
            </CardDescription>
          </div>
          {state && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Radio className="h-3 w-3" />
              <span className="font-semibold">LIVE</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Live Spot"
            value={`$${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={
              <span className={isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                {isUp ? "+" : ""}{sessionChange.toFixed(2)} ({isUp ? "+" : ""}{sessionChangePct.toFixed(2)}%) session
              </span>
            }
            live={!!state}
          />
          <Metric label="Session Range" value={`$${liveLow.toFixed(2)} – $${liveHigh.toFixed(2)}`} sub={`Prev close $${CURRENT_MARKET.prevClose}`} live={!!state} />
          <Metric label="All-Time High" value={`$${CURRENT_MARKET.ath.toLocaleString()}`} sub={CURRENT_MARKET.athDate} />
          <Metric
            label="Drawdown from ATH"
            value={`${liveDrawdown.toFixed(2)}%`}
            sub={`From live price · 8-mo low $${CURRENT_MARKET.eightMonthLow}`}
            live={!!state}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card className="bg-muted/30">
            <CardContent className="p-3 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consolidation Range (5 weeks)</div>
              <div className="text-sm font-mono">
                <span className="text-rose-600 dark:text-rose-400">${CURRENT_MARKET.rangeHigh_5wk}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="text-emerald-600 dark:text-emerald-400">${CURRENT_MARKET.rangeLow_5wk}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Height: ${(CURRENT_MARKET.rangeHigh_5wk - CURRENT_MARKET.rangeLow_5wk).toFixed(2)} · Live price{" "}
                <span className={livePrice < CURRENT_MARKET.rangeLow_5wk ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-foreground font-semibold"}>
                  {livePrice < CURRENT_MARKET.rangeLow_5wk ? "below range" : livePrice > CURRENT_MARKET.rangeHigh_5wk ? "above range" : "inside range"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Moving Averages (vs live price)</div>
              <div className="text-xs space-y-0.5 font-mono">
                <SmaRow label="20-SMA" value={sma20} livePrice={livePrice} bias={bias20} />
                <SmaRow label="50-SMA" value={sma50} livePrice={livePrice} bias={bias50} />
                <SmaRow label="100-SMA" value={sma100} livePrice={livePrice} bias={bias100} />
              </div>
              <div className="text-xs text-muted-foreground">
                Overall regime:{" "}
                <span className="font-semibold text-rose-600 dark:text-rose-400">bearish</span> (price below all SMAs = downtrend confirmed)
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Key Levels Ladder (live price position highlighted)</span>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <div className="flex flex-col">
              {KEY_LEVELS.slice(0, 5).map((l, i) => (
                <LevelRow key={i} label={l.label} value={l.value} type={l.type} note={l.note} side="resistance" livePrice={livePrice} />
              ))}
              <div className="bg-sky-100 dark:bg-sky-950/40 border-y-2 border-sky-400 px-3 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-300 font-semibold">
                  Live Spot — ${livePrice.toFixed(2)}
                  {state && (
                    <span className="ml-2 text-[9px] font-mono opacity-70">
                      {new Date(state.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              {KEY_LEVELS.slice(5).map((l, i) => (
                <LevelRow key={i} label={l.label} value={l.value} type={l.type} note={l.note} side="support" livePrice={livePrice} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-700 dark:text-amber-300">Macro Context:</strong>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                <li>• Gold in macro bearish correction off January 2026 ATH ($5,602)</li>
                <li>• Drawdown from ATH: <span className="font-semibold text-foreground">{liveDrawdown.toFixed(2)}%</span> (live)</li>
                <li>• 5 weeks consolidating at pivotal support (range $3,951–$4,060)</li>
                <li>• First daily close below $4,000 since October 2025 (2026-07-16)</li>
                <li>• Drivers: DXY strength, hawkish FOMC minutes (~60% Sept hike odds), US-Iran geopolitical tension</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Initial reference sources (2026-07-17):</span>
          {CURRENT_MARKET.sources.map((s) => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-muted/60 font-medium">{s}</span>
          ))}
          <span className="ml-auto text-emerald-700 dark:text-emerald-300">
            + Live feed: gold-api.com (updates every 60s)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, sub, live }: { label: string; value: string; sub: React.ReactNode; live?: boolean }) {
  return (
    <div className={`rounded-lg border bg-background p-3 ${live ? "border-emerald-300 dark:border-emerald-800" : ""}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {label}
        {live && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.5, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-xl font-bold tabular-nums mt-0.5"
      >
        {value}
      </motion.div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function SmaRow({ label, value, livePrice, bias }: { label: string; value: number; livePrice: number; bias: string }) {
  const diff = livePrice - value;
  const diffPct = (diff / value) * 100;
  const color = bias === "bearish" ? "text-rose-600 dark:text-rose-400" : bias === "bullish" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground";
  const arrow = bias === "bearish" ? "▼" : bias === "bullish" ? "▲" : "─";
  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <span className={color}>
        ${value} <span className="text-[10px] opacity-80">{arrow} {diff >= 0 ? "+" : ""}{diff.toFixed(2)} ({diffPct.toFixed(2)}%)</span>
      </span>
    </div>
  );
}

function LevelRow({ label, value, type, note, side, livePrice }: { label: string; value: number; type: string; note: string; side: "support" | "resistance"; livePrice: number }) {
  const toneClass =
    side === "resistance" ? "bg-rose-50/50 dark:bg-rose-950/10" : "bg-emerald-50/50 dark:bg-emerald-950/10";
  // Highlight if live price is within $5 of this level
  const isNear = Math.abs(livePrice - value) <= 5;
  const isAbove = livePrice > value;
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 text-xs ${toneClass} ${isNear ? "ring-2 ring-sky-400 bg-sky-50 dark:bg-sky-950/30" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono font-semibold tabular-nums">${value.toLocaleString()}</span>
        {isNear && <span className="text-[9px] uppercase font-bold text-sky-700 dark:text-sky-300">◀ LIVE NEAR</span>}
        <span className="text-muted-foreground truncate">{label}</span>
        <span className="text-[9px] text-muted-foreground">({isAbove ? "below live" : "above live"})</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:inline">{type}</span>
    </div>
  );
}
