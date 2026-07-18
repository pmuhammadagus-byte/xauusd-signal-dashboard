"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STRUCTURE_EVENTS } from "@/lib/market-analysis";
import { motion } from "framer-motion";
import { Zap, GitBranch, Droplets, Split, TrendingDown, TrendingUp } from "lucide-react";

const typeIcon = {
  BOS: GitBranch,
  CHoCH: Zap,
  "LIQUIDITY-SWEEP": Droplets,
  "RANGE-BREAK": Split,
};

const typeColor = {
  BOS: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900",
  CHoCH: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
  "LIQUIDITY-SWEEP": "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900",
  "RANGE-BREAK": "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900",
};

export function BosChochTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>BOS / CHoCH Timeline — Structure Events</CardTitle>
        <CardDescription>
          Chronological sequence of Break of Structure, Change of Character, liquidity sweep,
          and range-break events. Each event is logged with its timeframe, level, and significance.
          The PENDING event (BOS below $3,942) is the trigger that activates our final TP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-px bg-border" />

          <ul className="space-y-4">
            {STRUCTURE_EVENTS.map((ev, i) => {
              const Icon = typeIcon[ev.type] ?? GitBranch;
              const isPending = ev.timestamp === "PENDING";
              const isBullish = ev.direction === "bullish";
              return (
                <motion.li
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-10 sm:pl-12"
                >
                  <div className={`absolute left-0 top-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 bg-background ${typeColor[ev.type]}`}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>

                  <div className="rounded-lg border bg-card p-3 sm:p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={typeColor[ev.type]}>
                          {ev.type}
                        </Badge>
                        <Badge variant={isBullish ? "default" : "destructive"} className="text-xs">
                          {isBullish ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                          {ev.direction}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{ev.timeframe}</Badge>
                        {isPending && (
                          <Badge className="text-xs bg-amber-500 hover:bg-amber-600 animate-pulse">PENDING</Badge>
                        )}
                        {ev.significance === "high" && (
                          <Badge variant="outline" className="text-xs border-rose-400 text-rose-600 dark:text-rose-300">
                            HIGH IMPACT
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isPending ? "Awaiting trigger" : ev.timestamp} · Level{" "}
                        <span className="font-mono font-semibold">${ev.level.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{ev.description}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
