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
import { ZONES, CURRENT_MARKET } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supply & Demand Zones — Entry / Stop / TP Map</CardTitle>
        <CardDescription>
          5-week consolidation range with supply zones (red) and demand zones (green) overlaid.
          The limit entry sits inside the fresh-tested-once supply at $4,055–$4,060, with stop
          above range high and TP at the range-breakdown measured-move target.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[460px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={PRICE_SERIES} margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
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
          <ZoneSummary type="supply" />
          <ZoneSummary type="demand" />
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="font-semibold mb-1">Trade Geometry</div>
            <div className="text-muted-foreground space-y-0.5">
              <div>Range height: <span className="font-mono">${(CURRENT_MARKET.rangeHigh_5wk - CURRENT_MARKET.rangeLow_5wk).toFixed(2)}</span></div>
              <div>Measured move: <span className="font-mono">${TRADE_PLAN.takeProfit}</span></div>
              <div>Risk:Reward: <span className="font-mono">1:{TRADE_PLAN.rr}</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneSummary({ type }: { type: "supply" | "demand" }) {
  const zones = ZONES.filter((z) => z.type === type);
  const color = type === "supply" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className={`font-semibold mb-1 capitalize ${color}`}>{type} Zones ({zones.length})</div>
      <ul className="text-muted-foreground space-y-1">
        {zones.map((z) => (
          <li key={z.id} className="text-xs">
            <span className="font-mono">${z.bottom}–${z.top}</span>
            <span className="ml-1">({z.timeframe}, {z.strength})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
