"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LIQUIDITY } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { ArrowDown, ArrowUp, Droplets, Flame } from "lucide-react";
import { motion } from "framer-motion";

export function LiquidityMap() {
  const above = LIQUIDITY.filter((l) => l.side === "above").sort((a, b) => a.price - b.price);
  const below = LIQUIDITY.filter((l) => l.side === "below").sort((a, b) => b.price - a.price);

  const minPrice = Math.min(...above.map((l) => l.price), TRADE_PLAN.spotReference);
  const maxPrice = Math.max(...above.map((l) => l.price));
  const range = maxPrice - minPrice;

  // Vertical scale: position % of vertical bar
  const pct = (price: number) => {
    if (price >= minPrice) return 100 - ((price - minPrice) / range) * 100;
    return 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-sky-500" />
          Liquidity Map & Stop-Hunt Targets
        </CardTitle>
        <CardDescription>
          Resting stop-order clusters above resistance (buy-stops, red) and below support
          (sell-stops, green). The 8-month low at $3,942 holds the primary sell-stop pool —
          our TP at $3,845 is positioned below this sweep target.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Visual liquidity ladder */}
          <div className="relative h-[420px] rounded-lg border bg-gradient-to-b from-rose-50/40 via-background to-emerald-50/40 dark:from-rose-950/20 dark:via-background dark:to-emerald-950/20">
            {/* Spot line */}
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-sky-500"
              style={{ top: `${pct(TRADE_PLAN.spotReference)}%` }}
            >
              <span className="absolute right-2 -top-2.5 text-[10px] font-semibold bg-sky-500 text-white px-1.5 py-0.5 rounded">
                SPOT ${TRADE_PLAN.spotReference}
              </span>
            </div>

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
                <ArrowUp className="h-4 w-4" /> Above Spot (Buy-stops)
              </h4>
              <div className="space-y-1.5">
                {above.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-1.5">
                    <div>
                      <span className="font-mono font-semibold text-sm">${l.price}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{l.type.replace("-", " ")}</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{l.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <ArrowDown className="h-4 w-4" /> Below Spot (Sell-stops — PRIMARY TARGET)
              </h4>
              <div className="space-y-1.5">
                {below.map((l) => (
                  <div key={l.id} className={`flex items-center justify-between rounded border px-3 py-1.5 ${l.price === 3942 ? "border-emerald-500 dark:border-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 ring-1 ring-emerald-400/40" : "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20"}`}>
                    <div>
                      <span className="font-mono font-semibold text-sm">${l.price}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">{l.type.replace("-", " ")}</span>
                      {l.price === 3942 && (
                        <span className="ml-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Primary</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{l.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
