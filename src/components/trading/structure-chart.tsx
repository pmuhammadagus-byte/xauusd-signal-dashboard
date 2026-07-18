"use client";

import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SWING_POINTS, CURRENT_MARKET } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { Clock, Radio } from "lucide-react";

const chartData = SWING_POINTS.filter((s) => s.timeframe === "W" || s.timeframe === "D").map((s) => ({
  time: s.time,
  price: s.price,
  kind: s.kind,
  note: s.note,
}));

const kindColor: Record<string, string> = {
  HH: "#16a34a",
  HL: "#22c55e",
  LH: "#ef4444",
  LL: "#dc2626",
};

const kindShape: Record<string, "circle" | "square" | "triangle" | "diamond"> = {
  HH: "triangle",
  HL: "circle",
  LH: "square",
  LL: "diamond",
};

export function StructureChart() {
  const { state, connected } = useXauSignal({ pollIntervalMs: 10000 });
  const livePrice = state?.currentPrice ?? CURRENT_MARKET.spot;
  const liveSwings = state?.liveStructure?.swings ?? [];
  const liveTrend = state?.liveStructure?.trend ?? "unknown";
  const liveSMA20 = state?.liveStructure?.sma20;
  const liveSMA50 = state?.liveStructure?.sma50;

  // Combine static (weekly/daily) + live (intraday) swings
  const combinedData = [
    ...chartData,
    ...liveSwings.map((s, i) => ({
      time: `Live ${i + 1}`,
      price: s.price,
      kind: s.kind,
      note: `Live intraday ${s.kind} at $${s.price.toFixed(2)} (${new Date(s.timestamp).toLocaleTimeString()})`,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              Market Structure — HH / HL / LH / LL Sequence
              {connected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Weekly + Daily swing-point sequence. Macro structure flipped bearish after the March LH at $5,400.
              Live price (sky line) updates in real-time.
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
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData} margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[3500, 5800]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number, _name, item: any) => [
                  `$${value.toLocaleString()}`,
                  `${item?.payload?.kind} — ${item?.payload?.note ?? ""}`,
                ]}
                labelFormatter={(l) => `Swing: ${l}`}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />

              {/* Reference lines */}
              <ReferenceLine y={CURRENT_MARKET.ath} stroke="#7c3aed" strokeDasharray="6 4" label={{ value: `ATH $${CURRENT_MARKET.ath}`, position: "insideTopRight", fontSize: 10, fill: "#7c3aed" }} />
              <ReferenceLine y={CURRENT_MARKET.eightMonthLow} stroke="#dc2626" strokeDasharray="4 2" label={{ value: `8-mo low $${CURRENT_MARKET.eightMonthLow}`, position: "insideBottomRight", fontSize: 10, fill: "#dc2626" }} />
              <ReferenceLine y={TRADE_PLAN.takeProfit} stroke="#059669" strokeDasharray="4 4" label={{ value: `TP $${TRADE_PLAN.takeProfit}`, position: "insideBottomRight", fontSize: 10, fill: "#059669" }} />
              <ReferenceLine y={TRADE_PLAN.entry} stroke="#0ea5e9" strokeDasharray="4 2" label={{ value: `Entry $${TRADE_PLAN.entry}`, position: "insideTopRight", fontSize: 10, fill: "#0ea5e9" }} />

              {/* LIVE price line (bright sky, thick) */}
              <ReferenceLine
                y={livePrice}
                stroke="#0ea5e9"
                strokeWidth={2}
                label={{
                  value: `LIVE $${livePrice.toFixed(2)}`,
                  position: "insideTopLeft",
                  fontSize: 11,
                  fill: "#0ea5e9",
                  fontWeight: 700,
                }}
              />

              {/* Price line connecting swing points */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--foreground))"
                strokeWidth={1.5}
                dot={false}
                legendType="none"
              />

              {/* Swing-point scatter */}
              <Scatter dataKey="price" fill="#8884d8" legendType="none">
                {combinedData.map((entry, index) => (
                  <Scatter
                    key={`sc-${index}`}
                    dataKey="price"
                    data={[entry]}
                    fill={kindColor[entry.kind]}
                    shape={kindShape[entry.kind]}
                  />
                ))}
                <LabelList
                  dataKey="kind"
                  position="top"
                  offset={8}
                  fontSize={10}
                  fill="hsl(var(--foreground))"
                />
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="grid gap-2 sm:grid-cols-4 text-xs">
            {Object.entries(kindColor).map(([k, c]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: c }} />
                <span className="font-mono font-semibold">{k}</span>
                <span className="text-muted-foreground">
                  {k === "HH" && "Higher High"}
                  {k === "HL" && "Higher Low"}
                  {k === "LH" && "Lower High"}
                  {k === "LL" && "Lower Low"}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block h-1 w-6 bg-sky-500" />
            <span className="font-mono font-semibold">LIVE price = ${livePrice.toFixed(2)}</span>
            {state && <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1"><Radio className="h-3 w-3" />{state.source}</span>}
          </div>
        </div>

        {/* Live structure summary */}
        {state?.liveStructure && liveSwings.length > 0 && (
          <div className="mt-4 rounded-lg border-2 border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 p-3">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-sky-500 animate-pulse" />
                <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                  Live Intraday Structure (auto-detected)
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Trend: <span className={`ml-1 font-bold ${liveTrend === "bullish" ? "text-emerald-600" : liveTrend === "bearish" ? "text-rose-600" : "text-muted-foreground"}`}>
                  {liveTrend.toUpperCase()}
                </span>
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-4 text-xs">
              <LiveStat label="Live Swings" value={`${liveSwings.length}`} sub="auto-detected" />
              <LiveStat label="Session High" value={`$${state.liveStructure.sessionHigh.toFixed(2)}`} sub="from live ticks" />
              <LiveStat label="Session Low" value={`$${state.liveStructure.sessionLow.toFixed(2)}`} sub="from live ticks" />
              <LiveStat label="Ticks Analyzed" value={`${state.liveStructure.tickCount}`} sub={`computed ${new Date(state.liveStructure.computedAt).toLocaleTimeString()}`} />
            </div>
            {liveSwings.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-muted-foreground">Recent swings: </span>
                {liveSwings.slice(-5).map((s, i) => (
                  <span key={i} className="inline-block mx-1 px-1.5 py-0.5 rounded font-mono text-[10px]" style={{ background: kindColor[s.kind] + "30", color: kindColor[s.kind] }}>
                    {s.kind} ${s.price.toFixed(0)}
                  </span>
                ))}
              </div>
            )}
            {(liveSMA20 || liveSMA50) && (
              <div className="mt-2 text-xs text-muted-foreground">
                Live SMA: {liveSMA20 && <span className="font-mono">20-tick=${liveSMA20.toFixed(2)}</span>}
                {liveSMA50 && <span className="font-mono ml-3">50-tick=${liveSMA50.toFixed(2)}</span>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LiveStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded border bg-background p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-bold tabular-nums">{value}</div>
      <div className="text-[9px] text-muted-foreground">{sub}</div>
    </div>
  );
}
