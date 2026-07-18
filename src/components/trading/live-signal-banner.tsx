"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Wifi,
  WifiOff,
  Radio,
  Target,
  Shield,
  Crosshair,
  TrendingDown,
  TrendingUp,
  Clock,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useXauSignal } from "@/hooks/use-xau-signal";
import type { SignalStatus } from "@/lib/signal-engine";

const statusConfig: Record<
  SignalStatus,
  { color: string; bg: string; border: string; icon: typeof Activity; label: string }
> = {
  WAITING: {
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300 dark:border-amber-800",
    icon: Clock,
    label: "WAITING FOR ENTRY",
  },
  ARMED: {
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-300 dark:border-orange-800",
    icon: Zap,
    label: "ARMED — ABOUT TO TRIGGER",
  },
  FILLED: {
    color: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-300 dark:border-sky-800",
    icon: Crosshair,
    label: "FILLED — POSITION LIVE",
  },
  ACTIVE: {
    color: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-300 dark:border-sky-800",
    icon: Activity,
    label: "POSITION ACTIVE",
  },
  HIT_SL: {
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-400 dark:border-rose-700",
    icon: XCircle,
    label: "STOP LOSS HIT",
  },
  HIT_TP: {
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-400 dark:border-emerald-700",
    icon: CheckCircle2,
    label: "TAKE PROFIT HIT 🎯",
  },
  CANCELLED: {
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    border: "border-border",
    icon: AlertTriangle,
    label: "CANCELLED",
  },
};

export function LiveSignalBanner() {
  const { state, loading, error, connected, reconnect } = useXauSignal({
    pollIntervalMs: 10000,
    useStream: true,
  });

  if (loading && !state) {
    return (
      <Card className="border-2 border-sky-300 dark:border-sky-800">
        <CardContent className="p-4 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-sky-500" />
          <span className="text-sm">Connecting to live XAU/USD signal feed…</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !state) {
    return (
      <Card className="border-2 border-rose-400">
        <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-rose-500" />
            <div>
              <div className="font-semibold text-rose-700 dark:text-rose-300">Signal feed error</div>
              <div className="text-xs text-muted-foreground">{error}</div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={reconnect}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!state) return null;

  const cfg = statusConfig[state.status];
  const StatusIcon = cfg.icon;
  const priceChange = state.previousPrice !== null ? state.currentPrice - state.previousPrice : 0;
  const isPriceUp = priceChange >= 0;
  const progressToEntry = state.direction === "SHORT"
    ? Math.min(100, Math.max(0, ((state.currentPrice - state.entry) / (state.stopLoss - state.entry)) * 100))
    : Math.min(100, Math.max(0, ((state.entry - state.currentPrice) / (state.entry - state.stopLoss)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`border-2 ${cfg.border} ${cfg.bg} overflow-hidden`}>
        <CardContent className="p-4 space-y-3">
          {/* Row 1: Status + live price + connection */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div
                key={state.status}
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border-2 ${cfg.border} ${cfg.bg} ${cfg.color}`}
              >
                <StatusIcon className="h-4 w-4" />
                <span className="font-bold text-sm tracking-wide">{cfg.label}</span>
              </motion.div>

              {state.status === "ACTIVE" && state.pnlPerOz !== null && (
                <motion.div
                  key={state.pnlPerOz}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono font-bold text-sm ${
                    state.pnlPerOz >= 0
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {state.pnlPerOz >= 0 ? <TrendingDown className="h-3.5 w-3.5 rotate-180" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {state.pnlPerOz >= 0 ? "+" : ""}${state.pnlPerOz.toFixed(2)}/oz
                  <span className="text-xs opacity-70">
                    ({state.pnlAsRR !== null && state.pnlAsRR >= 0 ? "+" : ""}{state.pnlAsRR?.toFixed(2)}R)
                  </span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ConnectionPill connected={connected} />
              <Button size="sm" variant="ghost" onClick={reconnect} className="h-7 px-2">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Row 2: Live price + tick + countdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-background p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Live Price</div>
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={state.currentPrice}
                  initial={{ opacity: 0.5, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold tabular-nums font-mono"
                >
                  ${state.currentPrice.toFixed(2)}
                </motion.span>
                <span className={`text-xs font-mono ${isPriceUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {isPriceUp ? "+" : ""}{priceChange.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {state.bias === "bearish" ? "▼ below 20-SMA" : state.bias === "bullish" ? "▲ above 20-SMA" : "─ at 20-SMA"}
              </div>
            </div>

            <div className="rounded-lg border bg-background p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance to Entry</div>
              <div className="text-xl font-bold tabular-nums font-mono">
                ${state.distanceToEntry.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {state.currentPrice > state.entry ? "above" : "below"} entry ${state.entry.toFixed(0)}
              </div>
            </div>

            <div className="rounded-lg border bg-background p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance to SL</div>
              <div className="text-xl font-bold tabular-nums font-mono text-rose-600 dark:text-rose-400">
                ${state.distanceToStop.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">stop ${state.stopLoss.toFixed(0)}</div>
            </div>

            <div className="rounded-lg border bg-background p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance to TP</div>
              <div className="text-xl font-bold tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                ${state.distanceToTp.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">target ${state.takeProfit.toFixed(0)}</div>
            </div>
          </div>

          {/* Row 3: Progress to entry + countdown + last update */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Progress: current → entry → stop</span>
              <span>Next refresh in <span className="font-mono font-semibold text-foreground">{state.nextUpdateIn}s</span></span>
            </div>
            <Progress value={progressToEntry} className="h-1.5" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3" />
                Source: <span className="font-mono font-medium text-foreground">{state.source}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last tick: <span className="font-mono font-medium text-foreground">{new Date(state.timestamp).toLocaleTimeString()}</span>
              </span>
            </div>
          </div>

          {/* Row 4: Status message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={`text-xs leading-relaxed ${cfg.color} bg-background/60 rounded-md p-2 border ${cfg.border}`}
            >
              <strong>{cfg.label}:</strong> {state.message}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ConnectionPill({ connected }: { connected: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold border ${
      connected
        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
        : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
    }`}>
      {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {connected ? "LIVE" : "OFFLINE"}
      {connected && (
        <span className="relative flex h-1.5 w-1.5 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
      )}
    </div>
  );
}
