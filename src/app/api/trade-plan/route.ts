import { NextResponse } from "next/server";
import { TRADE_PLAN } from "@/lib/trade-plan";
import {
  CURRENT_MARKET,
  KEY_LEVELS,
  SWING_POINTS,
  ZONES,
  LIQUIDITY,
  STRUCTURE_EVENTS,
  CANDLESTICKS,
  CHART_PATTERNS,
  TOPDOWN,
} from "@/lib/market-analysis";
import { METHODOLOGY } from "@/lib/methodology";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    tradePlan: TRADE_PLAN,
    market: CURRENT_MARKET,
    levels: KEY_LEVELS,
    swings: SWING_POINTS,
    zones: ZONES,
    liquidity: LIQUIDITY,
    events: STRUCTURE_EVENTS,
    candles: CANDLESTICKS,
    patterns: CHART_PATTERNS,
    topdown: TOPDOWN,
    methodology: METHODOLOGY,
  });
}
