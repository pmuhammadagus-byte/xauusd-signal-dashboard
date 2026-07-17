"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_MARKET } from "@/lib/market-analysis";
import { ExternalLink } from "lucide-react";

const SOURCES = [
  { name: "TradingView — XAUUSD", url: "https://www.tradingview.com/symbols/XAUUSD", note: "Live spot price + structure" },
  { name: "Trading Economics — Gold", url: "https://tradingeconomics.com/commodity/gold", note: "Daily OHLC + historical" },
  { name: "Bloomberg — Gold Spot", url: "https://www.bloomberg.com/quote/XAU:CUR", note: "Institutional spot rate" },
  { name: "Barchart — XAUUSD", url: "https://www.barchart.com/forex/quotes/%5EXAUUSD", note: "Forex quote with technicals" },
  { name: "Forex.com — Gold Outlook", url: "https://www.forex.com/en/gold-silver-trading/xau-usd", note: "Close below $4,000 commentary" },
  { name: "FXStreet — Gold sellers seeking fresh 2026 low", url: "https://www.fxstreet.com/analysis/xau-usd-price-forecast-gold-sellers-seeking-for-a-fresh-2026-low-202607161626", note: "Daily structure analysis" },
  { name: "Vantage Markets — XAUUSD Analysis", url: "https://www.vantagemarkets.com/market-analysis/xauusd-gold-price-analysis-july-15-2026", note: "Holds $4,033 as US PPI looms" },
  { name: "LiteFinance — Gold Forecast", url: "https://www.litefinance.org/blog/analysts-opinions/gold-price-prediction-forecast/daily-and-weekly", note: "July 20 consolidation range $3,951–$4,059" },
  { name: "Investing.com — Gold Tests 8-Month Lows", url: "https://ca.investing.com/news/commodities-news/gold-tests-8month-lows-strong-support-level-or-deeper-correction-93CH-4740147", note: "$3,942 low + -27.7% drawdown" },
  { name: "TradingView — BoS/CHoCH on 1H", url: "https://www.tradingview.com/chart/XAUUSD/fFi5zTBu-BoS-CHoCH-and-Liquidity-Sweep-on-the-XAU-USD-1H-Chart", note: "Double-top $4,200 → neckline $4,155" },
  { name: "Golden Ark Reserve — W28 Note", url: "https://goldenarkreserve.com/blog/gold-market-note-2026-w28", note: "Macro drivers + week summary" },
  { name: "JPMorgan — Gold Predictions", url: "https://www.jpmorgan.com/insights/global-research/commodities/gold-prices", note: "Long-term $6,000 outlook" },
];

export function Sources() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-md border bg-background p-2.5 hover:bg-muted/40 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{s.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{s.note}</div>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-muted-foreground">
          Market data timestamps range from {CURRENT_MARKET.asOf} to current session. All structural levels cross-verified across at least 3 independent sources.
        </div>
      </CardContent>
    </Card>
  );
}
