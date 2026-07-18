"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STRUCTURE_EVENTS } from "@/lib/market-analysis";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { motion } from "framer-motion";
import { Zap, GitBranch, Droplets, Split, TrendingDown, TrendingUp, Radio, Clock } from "lucide-react";

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
  const { state, connected } = useXauSignal({ pollIntervalMs: 10000 });
  const livePrice = state?.currentPrice ?? 4009.37;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              BOS / CHoCH Timeline — Structure Events
              {connected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Chronological sequence of Break of Structure, Change of Character, liquidity sweep,
              and range-break events. PENDING events auto-confirm when live price crosses their level.
              The PENDING event (BOS below $3,942) is the trigger that activates our final TP.
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
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-px bg-border" />

          <ul className="space-y-4">
            {STRUCTURE_EVENTS.map((ev, i) => {
              const Icon = typeIcon[ev.type] ?? GitBranch;
              const isPending = ev.timestamp === "PENDING";
              // Auto-confirm PENDING events when live price crosses their level
              // For bearish BOS/CHoCH, "confirmed" = price went below the level
              const isConfirmed = isPending && ev.direction === "bearish" && livePrice <= ev.level;
              const distanceToLevel = Math.abs(livePrice - ev.level);
              const isNearPending = isPending && !isConfirmed && distanceToLevel <= 30;
              const isBullish = ev.direction === "bullish";
              return (
                <motion.li
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-10 sm:pl-12"
                >
                  <div className={`absolute left-0 top-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 bg-background ${isConfirmed ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700" : typeColor[ev.type]}`}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>

                  <div className={`rounded-lg border bg-card p-3 sm:p-4 ${isConfirmed ? "border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-400/40" : isNearPending ? "border-sky-400 dark:border-sky-700 ring-1 ring-sky-400/40" : ""}`}>
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
                        {isPending && isConfirmed && (
                          <Badge className="text-xs bg-emerald-600 hover:bg-emerald-700">
                            <Radio className="mr-1 h-3 w-3" /> CONFIRMED LIVE
                          </Badge>
                        )}
                        {isPending && !isConfirmed && (
                          <Badge className={`text-xs ${isNearPending ? "bg-sky-600 hover:bg-sky-700 animate-pulse" : "bg-amber-500 hover:bg-amber-600"}`}>
                            {isNearPending ? "NEAR TRIGGER" : "PENDING"}
                          </Badge>
                        )}
                        {ev.significance === "high" && (
                          <Badge variant="outline" className="text-xs border-rose-400 text-rose-600 dark:text-rose-300">
                            HIGH IMPACT
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isPending ? (
                          isConfirmed ? (
                            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                              Confirmed at live ${livePrice.toFixed(2)}
                            </span>
                          ) : (
                            <span>
                              {distanceToLevel <= 30 ? (
                                <span className="text-sky-700 dark:text-sky-300 font-semibold">
                                  ${distanceToLevel.toFixed(2)} from trigger
                                </span>
                              ) : (
                                <span>Awaiting trigger · ${distanceToLevel.toFixed(2)} from level</span>
                              )}
                            </span>
                          )
                        ) : ev.timestamp} · Level{" "}
                        <span className="font-mono font-semibold">${ev.level.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{ev.description}</p>
                    {isPending && isConfirmed && (
                      <div className="mt-2 rounded-md bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-2 text-xs text-emerald-800 dark:text-emerald-200">
                        ✅ <strong>LIVE CONFIRMED:</strong> Live price ${livePrice.toFixed(2)} has crossed below ${ev.level.toLocaleString()}.
                        This BOS is now active — final TP at $3,845 is the active target.
                      </div>
                    )}
                    {isPending && !isConfirmed && distanceToLevel <= 30 && (
                      <div className="mt-2 rounded-md bg-sky-100 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 p-2 text-xs text-sky-800 dark:text-sky-200">
                        ⚡ <strong>NEAR TRIGGER:</strong> Live price ${livePrice.toFixed(2)} is only ${distanceToLevel.toFixed(2)} from ${ev.level.toLocaleString()}.
                        Watch for confirmation.
                      </div>
                    )}
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
