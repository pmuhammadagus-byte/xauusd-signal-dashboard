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
  ReferenceArea,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZONES, CURRENT_MARKET } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { useXauSignal } from "@/hooks/use-xau-signal";
import { Clock, Radio } from "lucide-react";

/**
 * Synthetic price-action series showing the recent 5-week consolidation
 * with supply/demand zones overlaid and entry/SL/TP marked.
 * The series is a faithful representation of the actual price path
 * from the March LH at $5,400 down through the recent consolidation.
 */
const PRICE_SERIES = [
  { t: "Mar LH", price: 5400, note: "Weekly LH (cycle top confirmation)" },
  { t: "Apr LL", price: 4500, note: "Weekly LL — trend flip" },
  { t: "May LH", price: 4200, note: "LH retest of broken support" },
  { t: "Jun 1", price: 4120, note: "Daily LH inside macro bearish leg" },
  { t: "Jun 8", price: 4080, note: "Range high established" },
  { t: "Jun 15", price: 4030, note: "Mid-range" },
  { t: "Jun 22", price: 3960, note: "Range low test" },
  { t: "Jun 29", price: 4020, note: "Range mid retest" },
  { t: "Jul 6", price: 4055, note: "Supply zone retest" },
  { t: "Jul 8", price: 4120, note: "Daily LH origin" },
  { t: "Jul 11", price: 3983, note: "Daily LL — BOS" },
  { t: "Jul 13", price: 4033, note: "1H LH — 20-SMA rejection" },
  { t: "Jul 15", price: 3942, note: "8-mo low sweep" },
  { t: "Jul 16", price: 3976, note: "Daily close < $4,000" },
  { t: "Jul 17", price: 4009, note: "Spot reference" },
];

export function SupplyDemandChart() {
  const { state, connected } = useXauSignal({ pollIntervalMs: 10000 });
  const livePrice = state?.currentPrice ?? CURRENT_MARKET.spot;

  // Append live ticks to the chart data
  const liveTicks = state?.history?.slice(-8).map((tick, i) => ({
    t: `Live ${i + 1}`,
    price: tick.price,
    note: `Live tick ${new Date(tick.timestamp).toLocaleTimeString()} (${tick.source})`,
  })) ?? [];
  const combinedData = [...PRICE_SERIES, ...liveTicks];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              Supply & Demand Zones — Entry / Stop / TP Map
              {connected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </CardTitle>
            <CardDescription>
              5-week consolidation with supply/demand zones + entry/SL/TP overlays. Live ticks (right side) update every 60s.
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
        <div className="h-[460px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData} margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="t" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
              <YAxis
                domain={[3800, 4250]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(value: number, _name, item: any) => [
                  `$${value}`,
                  item?.payload?.note ?? "Price",
                ]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />

              {/* Supply zones (red) */}
              {ZONES.filter((z) => z.type === "supply").map((z) => (
                <ReferenceArea
                  key={z.id}
                  y1={z.bottom}
                  y2={z.top}
                  fill="#dc2626"
                  fillOpacity={0.15}
                  stroke="#dc2626"
                  strokeOpacity={0.4}
                  strokeDasharray="3 3"
                  label={{ value: `SUPPLY ${z.bottom}-${z.top}`, position: "insideTop", fontSize: 9, fill: "#dc2626" }}
                />
              ))}

              {/* Demand zones (green) */}
              {ZONES.filter((z) => z.type === "demand").map((z) => (
                <ReferenceArea
                  key={z.id}
                  y1={z.bottom}
                  y2={z.top}
                  fill="#059669"
                  fillOpacity={0.15}
                  stroke="#059669"
                  strokeOpacity={0.4}
                  strokeDasharray="3 3"
                  label={{ value: `DEMAND ${z.bottom}-${z.top}`, position: "insideBottom", fontSize: 9, fill: "#059669" }}
                />
              ))}

              {/* Entry / SL / TP reference lines */}
              <ReferenceLine
                y={TRADE_PLAN.entry}
                stroke="#0ea5e9"
                strokeWidth={2}
                label={{ value: `ENTRY $${TRADE_PLAN.entry}`, position: "right", fontSize: 11, fill: "#0ea5e9", fontWeight: 700 }}
              />
              <ReferenceLine
                y={TRADE_PLAN.stopLoss}
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{ value: `SL $${TRADE_PLAN.stopLoss}`, position: "right", fontSize: 11, fill: "#dc2626", fontWeight: 700 }}
              />
              <ReferenceLine
                y={TRADE_PLAN.takeProfit}
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{ value: `TP $${TRADE_PLAN.takeProfit}`, position: "right", fontSize: 11, fill: "#059669", fontWeight: 700 }}
              />

              {/* LIVE price reference line (thick sky) */}
              <ReferenceLine
                y={livePrice}
                stroke="#0ea5e9"
                strokeWidth={3}
                label={{
                  value: `LIVE $${livePrice.toFixed(2)}`,
                  position: "insideTopLeft",
                  fontSize: 12,
                  fill: "#0ea5e9",
                  fontWeight: 800,
                }}
              />

              {/* Range boundaries */}
              <ReferenceLine
                y={CURRENT_MARKET.rangeHigh_5wk}
                stroke="#7c3aed"
                strokeDasharray="2 2"
                label={{ value: `Range high $${CURRENT_MARKET.rangeHigh_5wk}`, position: "insideTopLeft", fontSize: 10, fill: "#7c3aed" }}
              />
              <ReferenceLine
                y={CURRENT_MARKET.rangeLow_5wk}
                stroke="#7c3aed"
                strokeDasharray="2 2"
                label={{ value: `Range low $${CURRENT_MARKET.rangeLow_5wk}`, position: "insideBottomLeft", fontSize: 10, fill: "#7c3aed" }}
              />

              {/* Price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--foreground))" }}
                activeDot={{ r: 5 }}
                name="XAU/USD price"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
          <ZoneSummary type="supply" livePrice={livePrice} liveZones={state?.liveStructure?.zones ?? []} />
          <ZoneSummary type="demand" livePrice={livePrice} liveZones={state?.liveStructure?.zones ?? []} />
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="font-semibold mb-1 flex items-center gap-1.5">
              Trade Geometry
              {state && <span className="text-[9px] text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5"><Radio className="h-2.5 w-2.5" />LIVE</span>}
            </div>
            <div className="text-muted-foreground space-y-0.5">
              <div>Range height: <span className="font-mono">${(CURRENT_MARKET.rangeHigh_5wk - CURRENT_MARKET.rangeLow_5wk).toFixed(2)}</span></div>
              <div>Live price: <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">${livePrice.toFixed(2)}</span></div>
              <div>To entry: <span className="font-mono">${Math.abs(livePrice - TRADE_PLAN.entry).toFixed(2)}</span></div>
              <div>Measured move TP: <span className="font-mono">${TRADE_PLAN.takeProfit}</span></div>
              <div>Risk:Reward: <span className="font-mono">1:{TRADE_PLAN.rr}</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneSummary({ type, livePrice, liveZones = [] }: { type: "supply" | "demand"; livePrice: number; liveZones?: any[] }) {
  const staticZones = ZONES.filter((z) => z.type === type);
  const liveZ = liveZones.filter((z) => z.type === type);
  const allZones = [
    ...staticZones.map((z) => ({ ...z, isLive: false })),
    ...liveZ.map((z) => ({ ...z, isLive: true })),
  ];
  const color = type === "supply" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className={`font-semibold mb-1 capitalize ${color}`}>{type} Zones ({allZones.length}{liveZ.length > 0 && <span className="text-sky-600 dark:text-sky-400 ml-1">· {liveZ.length} live</span>})</div>
      <ul className="text-muted-foreground space-y-1">
        {allZones.map((z, i) => {
          const inside = livePrice >= z.bottom && livePrice <= z.top;
          const distance = Math.min(Math.abs(livePrice - z.bottom), Math.abs(livePrice - z.top));
          const isLive = z.isLive === true;
          return (
            <li key={`${z.id}-${i}`} className={`text-xs ${inside ? "text-sky-700 dark:text-sky-300 font-semibold" : ""} ${isLive ? "border-l-2 border-sky-400 pl-1.5" : ""}`}>
              <span className="font-mono">${z.bottom}–${z.top}</span>
              <span className="ml-1">({z.timeframe || "Live"}, {z.strength})</span>
              {isLive && <span className="ml-1 text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase bg-sky-100 dark:bg-sky-950/40 px-1 py-0.5 rounded">LIVE</span>}
              {inside && <span className="ml-1 text-[9px] uppercase">◀ LIVE HERE</span>}
              {!inside && <span className="ml-1 text-[10px] opacity-70">· ${distance.toFixed(0)} away</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
