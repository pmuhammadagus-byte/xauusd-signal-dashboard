"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Activity,
  Radio,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { TRADE_PLAN } from "@/lib/trade-plan";

const isShort = TRADE_PLAN.direction === "SHORT";

export function LiveTradePanel() {
  const { state, connected } = useXauSignal({ pollIntervalMs: 10000 });

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Trade Monitor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Connecting…</CardContent>
      </Card>
    );
  }

  const isActive = state.status === "ACTIVE" || state.status === "FILLED";
  const pnl = state.pnlPerOz;
  const pnlColor = pnl !== null && pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";

  // Progress from SL to TP (for SHORT: SL above, TP below)
  const totalRange = TRADE_PLAN.stopLoss - TRADE_PLAN.takeProfit;
  const currentProgress = isShort
    ? ((TRADE_PLAN.stopLoss - state.currentPrice) / totalRange) * 100
    : ((state.currentPrice - TRADE_PLAN.stopLoss) / totalRange) * 100;
  const clampedProgress = Math.min(100, Math.max(0, currentProgress));

  return (
    <Card className="overflow-hidden border-2 border-sky-300 dark:border-sky-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Activity className={`h-5 w-5 ${connected ? "text-emerald-500" : "text-muted-foreground"}`} />
            Live Trade Monitor
            {connected && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            <Clock className="mr-1 h-3 w-3" />
            {new Date(state.timestamp).toLocaleTimeString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Live PnL big number */}
        <div className={`rounded-lg border-2 p-4 ${
          pnl === null ? "bg-muted/30 border-border" :
          pnl >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800" :
          "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {isActive ? "Unrealized PnL" : "Live Price"}
            </span>
            {isActive && state.liveRr !== null && (
              <Badge variant="outline" className="text-xs">
                Live R:R 1:{state.liveRr.toFixed(2)}
              </Badge>
            )}
          </div>
          {isActive && pnl !== null ? (
            <motion.div
              key={pnl.toFixed(2)}
              initial={{ scale: 1.05, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`text-4xl font-bold tabular-nums font-mono ${pnlColor}`}
            >
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              <span className="text-base ml-2 opacity-70">/oz</span>
            </motion.div>
          ) : (
            <motion.div
              key={state.currentPrice.toFixed(2)}
              initial={{ scale: 1.05, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-4xl font-bold tabular-nums font-mono"
            >
              ${state.currentPrice.toFixed(2)}
            </motion.div>
          )}
          {isActive && state.pnlAsRR !== null && (
            <div className={`text-xs mt-1 ${pnlColor}`}>
              {state.pnlAsRR >= 0 ? "+" : ""}{state.pnlAsRR.toFixed(2)}R · risk ${state.liveRisk.toFixed(2)} / reward ${state.liveReward.toFixed(2)}
            </div>
          )}
          {!isActive && (
            <div className="text-xs mt-1 text-muted-foreground">
              ${state.distanceToEntry.toFixed(2)} from entry · {state.message.substring(0, 60)}…
            </div>
          )}
        </div>

        {/* SL → current → TP progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-rose-600 dark:text-rose-400">SL ${TRADE_PLAN.stopLoss}</span>
            <span className="text-sky-600 dark:text-sky-400">ENTRY ${TRADE_PLAN.entry}</span>
            <span className="text-emerald-600 dark:text-emerald-400">TP ${TRADE_PLAN.takeProfit}</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-rose-200 via-sky-200 to-emerald-200 dark:from-rose-900/40 dark:via-sky-900/40 dark:to-emerald-900/40">
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
              style={{ left: `${clampedProgress}%` }}
              animate={{ left: `${clampedProgress}%` }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background" />
            </motion.div>
            {/* Entry marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-sky-600 dark:bg-sky-400"
              style={{
                left: `${isShort
                  ? ((TRADE_PLAN.stopLoss - TRADE_PLAN.entry) / totalRange) * 100
                  : ((TRADE_PLAN.entry - TRADE_PLAN.stopLoss) / totalRange) * 100}%` }
              }
            />
          </div>
          <div className="text-[10px] text-center text-muted-foreground">
            Current price position between SL and TP
          </div>
        </div>

        {/* Live distances grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <DistanceCell
            label="To Entry"
            value={`$${state.distanceToEntry.toFixed(2)}`}
            icon={<Crosshair className="h-3 w-3" />}
            tone="sky"
          />
          <DistanceCell
            label="To Stop"
            value={`$${state.distanceToStop.toFixed(2)}`}
            icon={<Shield className="h-3 w-3" />}
            tone="rose"
          />
          <DistanceCell
            label="To Target"
            value={`$${state.distanceToTp.toFixed(2)}`}
            icon={<Target className="h-3 w-3" />}
            tone="emerald"
          />
        </div>

        {/* Status banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.status}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-md border bg-muted/30 p-2.5 text-xs"
          >
            <div className="flex items-start gap-2">
              <Radio className="h-3.5 w-3.5 mt-0.5 text-sky-500 shrink-0" />
              <div>
                <span className="font-semibold">{state.status}</span>
                <span className="text-muted-foreground"> — {state.message}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function DistanceCell({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "sky" | "rose" | "emerald";
}) {
  const toneClass =
    tone === "rose" ? "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900" :
    tone === "emerald" ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" :
    "text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900";
  return (
    <div className={`rounded-md border bg-background p-2 ${toneClass}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="text-base font-bold tabular-nums font-mono">{value}</div>
    </div>
  );
}
