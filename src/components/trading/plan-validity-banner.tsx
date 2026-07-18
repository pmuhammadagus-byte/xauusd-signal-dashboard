"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { computePlanValidity, TRADE_PLAN } from "@/lib/trade-plan";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Target,
  Shield,
  RefreshCw,
} from "lucide-react";

const statusConfig = {
  ACTIVE: {
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  HIT_TP: {
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-400 dark:border-emerald-700",
    icon: Target,
  },
  HIT_SL: {
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-400 dark:border-rose-700",
    icon: XCircle,
  },
  EXPIRED: {
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-400 dark:border-amber-700",
    icon: Clock,
  },
  INVALIDATED: {
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-400 dark:border-rose-700",
    icon: AlertTriangle,
  },
};

export function PlanValidityBanner() {
  const { state } = useXauSignal({ pollIntervalMs: 10000 });
  const livePrice = state?.currentPrice ?? null;
  const signalStatus = state?.status ?? null;
  const validity = computePlanValidity(livePrice, signalStatus);
  const cfg = statusConfig[validity.status];
  const Icon = cfg.icon;
  const isActionable = validity.isActionable;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={validity.status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`border-2 ${cfg.border} ${cfg.bg}`}>
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${cfg.color}`} />
                <div>
                  <div className={`font-bold text-sm ${cfg.color}`}>
                    Trade Plan Status: {validity.status.replace("_", " ")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Generated {new Date(TRADE_PLAN.generatedAt).toLocaleDateString()} ·
                    {" "}{validity.ageInDays} day{validity.ageInDays === 1 ? "" : "s"} old ·
                    {" "}Expires {new Date(validity.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="mr-1 h-2.5 w-2.5" />
                  Max age: {validity.maxAgeInDays} days
                </Badge>
                {isActionable ? (
                  <Badge className="text-[10px] bg-emerald-600 hover:bg-emerald-700">
                    ACTIONABLE
                  </Badge>
                ) : (
                  <Badge className="text-[10px] bg-rose-600 hover:bg-rose-700">
                    NOT ACTIONABLE
                  </Badge>
                )}
              </div>
            </div>

            {/* Message */}
            <div className={`text-sm font-medium ${cfg.color}`}>
              {validity.message}
            </div>

            {/* Next action */}
            <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Next Action
              </div>
              <p className="text-xs leading-relaxed">{validity.nextAction}</p>
            </div>

            {/* Time-sensitive disclaimer */}
            {!isActionable && (
              <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-amber-800 dark:text-amber-200">
                    <strong>This specific trade plan is closed.</strong> The Entry/SL/TP levels above
                    are kept for reference only — do NOT place new orders at these levels.
                    The <strong>methodology</strong> and <strong>top-down analysis workflow</strong>{" "}
                    remain valid forever, but you must re-derive fresh structural levels
                    from current market data before placing any new trade.
                  </div>
                </div>
              </div>
            )}

            {/* Timeless note */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span>
                <strong>Methodology</strong> (HH/HL/LH/LL, BOS, CHoCH, supply/demand, liquidity, candlestick, chart patterns)
                is <strong>timeless</strong> — these concepts apply the same way forever.
                The <strong>top-down workflow</strong> (Weekly → Daily → 4H → 1H) is also timeless.
                Only the <strong>specific levels</strong> expire.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
