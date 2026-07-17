"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TOPDOWN } from "@/lib/market-analysis";
import { ArrowDown, Check, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const biasColor = {
  bearish: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-900",
    accent: "bg-rose-500",
  },
  bullish: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    accent: "bg-emerald-500",
  },
  neutral: {
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    accent: "bg-muted-foreground",
  },
};

export function TopDownAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="h-5 w-5 text-primary" />
          Top-Down Analysis — HTF → MTF → LTF
        </CardTitle>
        <CardDescription>
          Four-timeframe alignment check. The weekly chart sets the macro bias, the daily refines
          the entry zone, the 4-hour locates the strike, and the 1-hour times the execution.
          All four timeframes align bearish → high-conviction SHORT.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {TOPDOWN.map((tf, i) => {
            const c = biasColor[tf.bias];
            const role = tf.label.match(/\(([^)]+)\)/)?.[1] ?? "";
            const tfName = tf.label.split(" ")[0];
            const BiasIcon = tf.bias === "neutral" ? Minus : tf.bias === "bearish" ? TrendingDown : TrendingUp;

            return (
              <motion.div
                key={tf.timeframe}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-lg border ${c.border} ${c.bg} overflow-hidden`}
              >
                {/* Header bar — full width, dense */}
                <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-border/60 bg-background/50">
                  <div className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-md ${c.accent} text-white font-bold text-base shadow-sm`}>
                    {tf.timeframe}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-sm sm:text-base">{tfName}</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{role}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{tf.role}</div>
                  </div>
                  <Badge variant="outline" className={`text-xs capitalize shrink-0 ${c.text} ${c.border}`}>
                    <BiasIcon className="mr-1 h-3 w-3" />
                    {tf.bias}
                  </Badge>
                </div>

                {/* Body — 3-column grid on desktop, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.6fr] divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                  {/* Resistance */}
                  <div className="px-3 sm:px-4 py-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Resistance
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tf.keyLevels.resistance.map((r) => (
                        <span key={r} className="font-mono text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/40 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                          ${r.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Support */}
                  <div className="px-3 sm:px-4 py-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Support
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tf.keyLevels.support.map((s) => (
                        <span key={s} className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                          ${s.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Structure */}
                  <div className="px-3 sm:px-4 py-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Structure</div>
                    <div className="text-xs font-medium leading-snug">{tf.structure}</div>
                  </div>
                </div>

                {/* Narrative — full width */}
                <div className="px-3 sm:px-4 py-2.5 border-t border-border/60 bg-background/30">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Analysis: </span>
                    {tf.narrative}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Alignment summary */}
        <div className="mt-4 rounded-lg border-2 border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
            <Check className="h-4 w-4" />
            Four-Timeframe Alignment: BEARISH (4/4)
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            All four timeframes confirm the bearish bias. Trade direction is structurally mandated as SHORT.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
