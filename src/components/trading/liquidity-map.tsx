"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LIQUIDITY, CURRENT_MARKET } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { ArrowDown, ArrowUp, Droplets, Flame, Clock, Radio } from "lucide-react";
import { motion } from "framer-motion";

export function LiquidityMap() {
  const { state, connected } = useXauSignal({ pollIntervalMs: 10000 });
  const livePrice = state?.currentPrice ?? TRADE_PLAN.spotReference;

  // Static pools from research
  const staticAbove = LIQUIDITY.filter((l) => l.side === "above").sort((a, b) => a.price - b.price);
  const staticBelow = LIQUIDITY.filter((l) => l.side === "below").sort((a, b) => b.price - a.price);

  // Live pools from tick history (auto-detected)
  const livePools = state?.liveStructure?.liquidity ?? [];
  const liveAbove = livePools.filter((l) => l.side === "above").sort((a, b) => a.price - b.price);
  const liveBelow = livePools.filter((l) => l.side === "below").sort((a, b) => b.price - a.price);

  // Merge static + live (deduplicate by price proximity)
  const allPools = [...LIQUIDITY.map((l) => ({ ...l, isLive: false }))];
  for (const lp of livePools) {
    const isDuplicate = allPools.some((p) => Math.abs(p.price - lp.price) < 3);
    if (!isDuplicate) {
      allPools.push({
        id: lp.id,
        side: lp.side,
        price: lp.price,
        type: lp.type,
        note: lp.note,
        isLive: true,
      });
    }
  }

  const above = allPools.filter((l) => l.side === "above").sort((a, b) => a.price - b.price);
  const below = allPools.filter((l) => l.side === "below").sort((a, b) => b.price - a.price);

  // Find nearest liquidity pool to live price (above and below)
  const nearestAbove = above.reduce((closest, l) =>
    Math.abs(l.price - livePrice) < Math.abs(closest.price - livePrice) ? l : closest, above[0]);
  const nearestBelow = below.reduce((closest, l) =>
    Math.abs(l.price - livePrice) < Math.abs(closest.price - livePrice) ? l : closest, below[0]);

  const minPrice = Math.min(...allPools.map((l) => l.price), livePrice, CURRENT_MARKET.eightMonthLow);
  const maxPrice = Math.max(...allPools.map((l) => l.price), livePrice);
  const range = Math.max(maxPrice - minPrice, 1);

  const pct = (price: number) => {
    if (price >= minPrice) return 100 - ((price - minPrice) / range) * 100;
    return 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-sky-500" />
              Liquidity Map & Stop-Hunt Targets
              {connected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Resting stop-order clusters above/below spot. Live price (sky line) updates in real-time.
              Nearest stop pools are highlighted as the most likely next liquidity targets.
            </CardDescription>
          </div>
          {state && (
            <Badge variant="outline" className="font-mono text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(state.timestamp).toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Visual liquidity ladder */}
          <div className="relative h-[420px] rounded-lg border bg-gradient-to-b from-rose-50/40 via-background to-emerald-50/40 dark:from-rose-950/20 dark:via-background dark:to-emerald-950/20">
            {/* LIVE price line (animated, sky) */}
            <motion.div
              animate={{ top: `${pct(livePrice)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-x-0 border-t-4 border-sky-500 z-10"
              style={{ top: `${pct(livePrice)}%` }}
            >
              <span className="absolute right-2 -top-3 text-[11px] font-bold bg-sky-500 text-white px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                LIVE ${livePrice.toFixed(2)}
              </span>
            </motion.div>

            {/* Entry line */}
            <div
              className="absolute inset-x-0 border-t-2 border-sky-700"
              style={{ top: `${pct(TRADE_PLAN.entry)}%` }}
            >
              <span className="absolute left-2 -top-2.5 text-[10px] font-semibold bg-sky-700 text-white px-1.5 py-0.5 rounded">
                ENTRY ${TRADE_PLAN.entry}
              </span>
            </div>

            {/* SL line */}
            <div
              className="absolute inset-x-0 border-t-2 border-rose-700"
              style={{ top: `${pct(TRADE_PLAN.stopLoss)}%` }}
            >
              <span className="absolute left-2 -top-2.5 text-[10px] font-semibold bg-rose-700 text-white px-1.5 py-0.5 rounded">
                SL ${TRADE_PLAN.stopLoss}
              </span>
            </div>

            {/* TP line */}
            <div
              className="absolute inset-x-0 border-t-2 border-emerald-700"
              style={{ top: `${pct(TRADE_PLAN.takeProfit)}%` }}
            >
              <span className="absolute right-2 -top-2.5 text-[10px] font-semibold bg-emerald-700 text-white px-1.5 py-0.5 rounded">
                TP ${TRADE_PLAN.takeProfit}
              </span>
            </div>

            {/* Buy-stop pools (above) */}
            {above.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="absolute right-12 flex items-center gap-1"
                style={{ top: `calc(${pct(l.price)}% - 8px)` }}
              >
                <Flame className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-[10px] font-mono font-semibold text-rose-700 dark:text-rose-300">
                  ${l.price}
                </span>
              </motion.div>
            ))}

            {/* Sell-stop pools (below) */}
            {below.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 + 0.2 }}
                className="absolute left-12 flex items-center gap-1"
                style={{ top: `calc(${pct(l.price)}% - 8px)` }}
              >
                <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                  ${l.price}
                </span>
                <Flame className="h-3.5 w-3.5 text-emerald-500" />
              </motion.div>
            ))}

            {/* Side labels */}
            <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <ArrowUp className="h-3 w-3" /> Buy-stops
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              Sell-stops <ArrowDown className="h-3 w-3" />
            </div>
          </div>

          {/* Pool list */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <ArrowUp className="h-4 w-4" /> Above Live (Buy-stops)
              </h4>
              <div className="space-y-1.5">
                {above.map((l) => {
                  const isNearest = nearestAbove?.id === l.id;
                  const distance = Math.abs(l.price - livePrice);
                  const isLive = (l as any).isLive === true;
                  return (
                    <div key={l.id} className={`flex items-center justify-between rounded border px-3 py-1.5 ${isNearest ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30 ring-1 ring-sky-400/40" : isLive ? "border-sky-300 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/10" : "border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20"}`}>
                      <div>
                        <span className="font-mono font-semibold text-sm">${l.price}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">{l.type.replace("-", " ")}</span>
                        {isLive && (
                          <span className="ml-2 text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase bg-sky-100 dark:bg-sky-950/40 px-1 py-0.5 rounded">LIVE</span>
                        )}
                        {isNearest && (
                          <span className="ml-2 text-[10px] font-semibold text-sky-700 dark:text-sky-300 uppercase">◀ Nearest</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        ${distance.toFixed(0)} away · {l.note}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <ArrowDown className="h-4 w-4" /> Below Live (Sell-stops — PRIMARY TARGET)
              </h4>
              <div className="space-y-1.5">
                {below.map((l) => {
                  const isNearest = nearestBelow?.id === l.id;
                  const isPrimary = l.price === 3942;
                  const isLive = (l as any).isLive === true;
                  const distance = Math.abs(l.price - livePrice);
                  return (
                    <div key={l.id} className={`flex items-center justify-between rounded border px-3 py-1.5 ${
                      isNearest ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30 ring-1 ring-sky-400/40" :
                      isLive ? "border-sky-300 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/10" :
                      isPrimary ? "border-emerald-500 dark:border-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 ring-1 ring-emerald-400/40" :
                      "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20"
                    }`}>
                      <div>
                        <span className="font-mono font-semibold text-sm">${l.price}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">{l.type.replace("-", " ")}</span>
                        {isLive && (
                          <span className="ml-2 text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase bg-sky-100 dark:bg-sky-950/40 px-1 py-0.5 rounded">LIVE</span>
                        )}
                        {isPrimary && (
                          <span className="ml-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Primary</span>
                        )}
                        {isNearest && (
                          <span className="ml-2 text-[10px] font-semibold text-sky-700 dark:text-sky-300 uppercase">◀ Nearest</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        ${distance.toFixed(0)} away · {l.note}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
