"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOPDOWN } from "@/lib/market-analysis";
import { ArrowDown, Check, Minus } from "lucide-react";
import { motion } from "framer-motion";

const biasColor = {
  bearish: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900",
  bullish: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
  neutral: "text-muted-foreground bg-muted/40 border-border",
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
          {TOPDOWN.map((tf, i) => (
            <motion.div
              key={tf.timeframe}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg border bg-card overflow-hidden"
            >
              <div className="flex items-stretch">
                <div className={`flex flex-col items-center justify-center px-4 sm:px-6 border-r-2 ${biasColor[tf.bias]}`}>
                  <span className="text-2xl sm:text-3xl font-bold">{tf.timeframe}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-80 mt-1">{tf.label.split(" ")[1]?.replace(/[()]/g, "")}</span>
                </div>

                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div>
                      <div className="text-sm font-semibold">{tf.label}</div>
                      <div className="text-xs text-muted-foreground">{tf.role}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs capitalize ${biasColor[tf.bias]}`}>
                        {tf.bias === "bearish" ? <Check className="mr-1 h-3 w-3" /> : tf.bias === "bullish" ? <Check className="mr-1 h-3 w-3" /> : <Minus className="mr-1 h-3 w-3" />}
                        {tf.bias}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 mb-2">
                    <div className="text-xs">
                      <div className="text-muted-foreground uppercase tracking-wide text-[10px] mb-0.5">Resistance</div>
                      <div className="flex flex-wrap gap-1">
                        {tf.keyLevels.resistance.map((r) => (
                          <span key={r} className="font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded text-[11px]">${r}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="text-muted-foreground uppercase tracking-wide text-[10px] mb-0.5">Support</div>
                      <div className="flex flex-wrap gap-1">
                        {tf.keyLevels.support.map((s) => (
                          <span key={s} className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded text-[11px]">${s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">
                    <span className="font-semibold text-foreground">Structure:</span> {tf.structure}
                  </div>

                  <p className="text-xs leading-relaxed">{tf.narrative}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border-2 border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-3">
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
