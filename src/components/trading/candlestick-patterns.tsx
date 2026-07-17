"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CANDLESTICKS, CHART_PATTERNS } from "@/lib/market-analysis";
import { Flame, Layers, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function CandlestickConfirmations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-500" />
          Candlestick Confirmations
        </CardTitle>
        <CardDescription>
          Four independent candlestick confirmations across multiple timeframes. Each pattern
          occurs at a structurally significant level (supply zone or 20-SMA rejection), validating
          the bearish bias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {CANDLESTICKS.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border bg-card p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{c.pattern}</span>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">{c.timeframe}</Badge>
                  <Badge variant="outline" className="text-xs text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800">
                    {c.bias}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2 font-mono">{c.location}</div>
              <p className="text-xs leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartPatternValidation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-violet-500" />
          Chart Pattern Validation
        </CardTitle>
        <CardDescription>
          Three independent chart patterns (one complete, two forming) all point to continued
          bearish continuation. The 5-week range breakdown measured move is the math behind our TP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {CHART_PATTERNS.map((p, i) => {
            const statusIcon =
              p.status === "complete" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
              p.status === "confirmed" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
              <Clock className="h-4 w-4 text-amber-500" />;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {statusIcon}
                    <h4 className="font-semibold">{p.name}</h4>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs capitalize">{p.type}</Badge>
                    <Badge variant="destructive" className="text-xs capitalize">{p.direction}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{p.status}</Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-3">{p.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border bg-muted/30 p-2">
                    <div className="text-muted-foreground uppercase tracking-wide text-[10px]">Invalidation</div>
                    <div className="font-mono font-semibold">${p.invalidation}</div>
                  </div>
                  <div className="rounded border bg-muted/30 p-2">
                    <div className="text-muted-foreground uppercase tracking-wide text-[10px]">Measured Move</div>
                    <div className="font-mono font-semibold">${p.measuredMove}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
