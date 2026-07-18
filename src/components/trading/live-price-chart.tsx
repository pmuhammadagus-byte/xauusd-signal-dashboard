"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { Activity, Radio } from "lucide-react";

export function LivePriceChart() {
  const { state, connected } = useXauSignal({ pollIntervalMs: 10000 });

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-500" />
            Live Price Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
            Connecting to live feed…
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = state.history.map((tick, idx) => ({
    idx,
    time: new Date(tick.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    price: tick.price,
    source: tick.source,
  }));

  // Compute Y-axis domain dynamically around current price
  const prices = data.map((d) => d.price);
  const minPrice = prices.length > 0 ? Math.min(...prices, TRADE_PLAN.takeProfit) : TRADE_PLAN.spotReference - 50;
  const maxPrice = prices.length > 0 ? Math.max(...prices, TRADE_PLAN.stopLoss) : TRADE_PLAN.spotReference + 50;
  const padding = Math.max(15, (maxPrice - minPrice) * 0.1);
  const yDomain: [number, number] = [
    Math.floor(minPrice - padding),
    Math.ceil(maxPrice + padding),
  ];

  const lastTick = state.history[state.history.length - 1];
  const firstTick = state.history[0];
  const sessionChange = lastTick && firstTick ? lastTick.price - firstTick.price : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-500" />
              Live Price Chart
              {connected && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Real-time XAU/USD price ticks with entry / SL / TP overlays.
              Updates every 60 seconds via SSE stream.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono">
              ${state.currentPrice.toFixed(2)}
            </Badge>
            <Badge variant={sessionChange >= 0 ? "default" : "destructive"} className="font-mono">
              {sessionChange >= 0 ? "+" : ""}{sessionChange.toFixed(2)}
            </Badge>
            <Badge variant="secondary" className="font-mono text-xs">
              {state.history.length} ticks
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                angle={-20}
                textAnchor="end"
                height={50}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                width={50}
              />
              <Tooltip
                formatter={(value: number, _name, item: any) => [
                  `$${value.toFixed(2)}`,
                  `${item?.payload?.source ?? ""}`,
                ]}
                contentStyle={{ fontSize: 11 }}
              />

              {/* TP zone (green) */}
              <ReferenceArea
                y1={TRADE_PLAN.takeProfit - 3}
                y2={TRADE_PLAN.takeProfit + 3}
                fill="#059669"
                fillOpacity={0.25}
                stroke="#059669"
                strokeOpacity={0.5}
              />
              {/* SL zone (red) */}
              <ReferenceArea
                y1={TRADE_PLAN.stopLoss - 3}
                y2={TRADE_PLAN.stopLoss + 3}
                fill="#dc2626"
                fillOpacity={0.25}
                stroke="#dc2626"
                strokeOpacity={0.5}
              />
              {/* Entry zone (sky) */}
              <ReferenceArea
                y1={TRADE_PLAN.entry - 1.5}
                y2={TRADE_PLAN.entry + 1.5}
                fill="#0ea5e9"
                fillOpacity={0.3}
                stroke="#0ea5e9"
                strokeOpacity={0.6}
              />

              <ReferenceLine
                y={TRADE_PLAN.entry}
                stroke="#0ea5e9"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{ value: `ENTRY $${TRADE_PLAN.entry}`, position: "insideTopLeft", fontSize: 10, fill: "#0ea5e9" }}
              />
              <ReferenceLine
                y={TRADE_PLAN.stopLoss}
                stroke="#dc2626"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{ value: `SL $${TRADE_PLAN.stopLoss}`, position: "insideTopLeft", fontSize: 10, fill: "#dc2626" }}
              />
              <ReferenceLine
                y={TRADE_PLAN.takeProfit}
                stroke="#059669"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{ value: `TP $${TRADE_PLAN.takeProfit}`, position: "insideBottomLeft", fontSize: 10, fill: "#059669" }}
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                fill="hsl(var(--foreground))"
                fillOpacity={0.05}
                dot={false}
                activeDot={{ r: 5, fill: "#0ea5e9" }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                legendType="none"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-sm bg-sky-400" /> Entry ${TRADE_PLAN.entry}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-sm bg-rose-500" /> SL ${TRADE_PLAN.stopLoss}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-sm bg-emerald-500" /> TP ${TRADE_PLAN.takeProfit}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="h-3 w-3" />
            Source: <span className="font-mono font-medium text-foreground">{state.source}</span>
            {state.source === "simulated" && (
              <span className="text-amber-600 dark:text-amber-400">(fallback)</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
