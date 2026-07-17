"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_MARKET, KEY_LEVELS } from "@/lib/market-analysis";
import { TRADE_PLAN } from "@/lib/trade-plan";
import { Globe, Database, AlertTriangle, BookOpen } from "lucide-react";

export function MarketOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-sky-500" />
          Live Market State — {CURRENT_MARKET.symbol}
        </CardTitle>
        <CardDescription>
          Reference data as of {CURRENT_MARKET.asOf}. Spot price is the {CURRENT_MARKET.sources[0]} / {CURRENT_MARKET.sources[1]} consensus.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Spot" value={`$${CURRENT_MARKET.spot.toLocaleString()}`} sub={`${CURRENT_MARKET.changePct > 0 ? "+" : ""}${CURRENT_MARKET.changePct}% today`} />
          <Metric label="Day Range" value={`$${CURRENT_MARKET.dayLow} – $${CURRENT_MARKET.dayHigh}`} sub={`Prev close $${CURRENT_MARKET.prevClose}`} />
          <Metric label="All-Time High" value={`$${CURRENT_MARKET.ath.toLocaleString()}`} sub={CURRENT_MARKET.athDate} />
          <Metric label="Drawdown from ATH" value={`${CURRENT_MARKET.drawdownFromAth.toFixed(2)}%`} sub={`8-mo low $${CURRENT_MARKET.eightMonthLow}`} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card className="bg-muted/30">
            <CardContent className="p-3 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consolidation Range (5 weeks)</div>
              <div className="text-sm font-mono">
                <span className="text-rose-600 dark:text-rose-400">${CURRENT_MARKET.rangeHigh_5wk}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="text-emerald-600 dark:text-emerald-400">${CURRENT_MARKET.rangeLow_5wk}</span>
              </div>
              <div className="text-xs text-muted-foreground">Height: ${(CURRENT_MARKET.rangeHigh_5wk - CURRENT_MARKET.rangeLow_5wk).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3 space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Moving Averages</div>
              <div className="text-xs space-y-0.5 font-mono">
                <div className="flex justify-between"><span>20-SMA (daily)</span><span className="text-rose-600 dark:text-rose-400">${CURRENT_MARKET.sma20_daily}</span></div>
                <div className="flex justify-between"><span>50-SMA (daily)</span><span className="text-rose-600 dark:text-rose-400">${CURRENT_MARKET.sma50_daily}</span></div>
                <div className="flex justify-between"><span>100-SMA (daily)</span><span className="text-rose-600 dark:text-rose-400">${CURRENT_MARKET.sma100_daily}</span></div>
              </div>
              <div className="text-xs text-muted-foreground">All SMAs above spot → bearish regime</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Key Levels Ladder</span>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <div className="flex flex-col">
              {KEY_LEVELS.slice(0, 5).map((l, i) => (
                <LevelRow key={i} label={l.label} value={l.value} type={l.type} note={l.note} side="resistance" />
              ))}
              <div className="bg-sky-100 dark:bg-sky-950/40 border-y-2 border-sky-400 px-3 py-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-300 font-semibold">Current Spot — ${CURRENT_MARKET.spot}</div>
              </div>
              {KEY_LEVELS.slice(5).map((l, i) => (
                <LevelRow key={i} label={l.label} value={l.value} type={l.type} note={l.note} side="support" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-700 dark:text-amber-300">Macro Context:</strong>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                <li>• Gold in macro bearish correction off January 2026 ATH ($5,602)</li>
                <li>• Down -28.6% from ATH; 5 weeks consolidating at pivotal support</li>
                <li>• First daily close below $4,000 since October 2025 (2026-07-16)</li>
                <li>• Drivers: DXY strength, hawkish FOMC minutes (~60% Sept hike odds), US-Iran geopolitical tension</li>
                <li>• Long-term JPMorgan target $6,000 — paused until weekly bullish CHoCH above $4,200</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Sources:</span>
          {CURRENT_MARKET.sources.map((s) => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-muted/60 font-medium">{s}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-bold tabular-nums mt-0.5">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function LevelRow({ label, value, type, note, side }: { label: string; value: number; type: string; note: string; side: "support" | "resistance" }) {
  const toneClass =
    side === "resistance" ? "bg-rose-50/50 dark:bg-rose-950/10" : "bg-emerald-50/50 dark:bg-emerald-950/10";
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 text-xs ${toneClass}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono font-semibold tabular-nums">${value.toLocaleString()}</span>
        <span className="text-muted-foreground truncate">{label}</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:inline">{type}</span>
    </div>
  );
}
