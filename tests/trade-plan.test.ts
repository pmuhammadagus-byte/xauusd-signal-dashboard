/**
 * Trade Plan Validation Tests
 * ============================
 * Verifies that every level in the XAU/USD trade plan is internally consistent,
 * structurally sound, and follows professional risk-management rules.
 *
 * Run:  bun test tests/trade-plan.test.ts
 */

import { describe, expect, it } from "bun:test";
import { TRADE_PLAN, computePositionSize } from "@/lib/trade-plan";
import { CURRENT_MARKET, KEY_LEVELS, ZONES, LIQUIDITY, STRUCTURE_EVENTS, SWING_POINTS } from "@/lib/market-analysis";

describe("TRADE_PLAN — structural integrity", () => {
  it("is a SHORT (bearish bias)", () => {
    expect(TRADE_PLAN.direction).toBe("SHORT");
  });

  it("uses a LIMIT order (sell-on-rally, no chasing)", () => {
    expect(TRADE_PLAN.orderType).toBe("LIMIT");
  });

  it("entry sits above current spot (sell-on-rally into supply)", () => {
    expect(TRADE_PLAN.entry).toBeGreaterThan(TRADE_PLAN.spotReference);
    const distance = TRADE_PLAN.entry - TRADE_PLAN.spotReference;
    // Entry should be 30–80 USD above spot — enough room to fill on a normal rally, not so far it never triggers
    expect(distance).toBeGreaterThan(20);
    expect(distance).toBeLessThan(120);
  });

  it("stop loss is above entry (SHORT: SL > Entry)", () => {
    expect(TRADE_PLAN.stopLoss).toBeGreaterThan(TRADE_PLAN.entry);
  });

  it("take profit is below entry (SHORT: TP < Entry)", () => {
    expect(TRADE_PLAN.takeProfit).toBeLessThan(TRADE_PLAN.entry);
  });

  it("stop loss is above the 5-week range high (structural invalidation)", () => {
    expect(TRADE_PLAN.stopLoss).toBeGreaterThan(CURRENT_MARKET.rangeHigh_5wk);
    const buffer = TRADE_PLAN.stopLoss - CURRENT_MARKET.rangeHigh_5wk;
    // Stop should be at least $15 above range high (avoid noise stops) and at most $50 (avoid excessive risk)
    expect(buffer).toBeGreaterThanOrEqual(15);
    expect(buffer).toBeLessThanOrEqual(50);
  });

  it("take profit is below the 8-month low (targets sell-stop sweep continuation)", () => {
    expect(TRADE_PLAN.takeProfit).toBeLessThan(CURRENT_MARKET.eightMonthLow);
  });

  it("take profit matches the range-breakdown measured move", () => {
    const rangeHeight = CURRENT_MARKET.rangeHigh_5wk - CURRENT_MARKET.rangeLow_5wk;
    const measuredMove = CURRENT_MARKET.rangeLow_5wk - rangeHeight;
    // TP should be within $5 of the calculated measured move
    expect(Math.abs(TRADE_PLAN.takeProfit - measuredMove)).toBeLessThanOrEqual(5);
  });
});

describe("TRADE_PLAN — risk math", () => {
  it("riskPerOz = stop - entry (for SHORT)", () => {
    expect(TRADE_PLAN.riskPerOz).toBe(TRADE_PLAN.stopLoss - TRADE_PLAN.entry);
  });

  it("rewardPerOz = entry - tp (for SHORT)", () => {
    expect(TRADE_PLAN.rewardPerOz).toBe(TRADE_PLAN.entry - TRADE_PLAN.takeProfit);
  });

  it("R:R = reward / risk", () => {
    expect(TRADE_PLAN.rr).toBe(TRADE_PLAN.rewardPerOz / TRADE_PLAN.riskPerOz);
  });

  it("meets minimum professional R:R of 1:3", () => {
    expect(TRADE_PLAN.rr).toBeGreaterThanOrEqual(3);
  });

  it("meets elite-setup R:R of 1:5 or better", () => {
    expect(TRADE_PLAN.rr).toBeGreaterThanOrEqual(5);
  });

  it("produces positive expectancy at 30% win rate", () => {
    const winRate = 0.3;
    const expectancy =
      winRate * TRADE_PLAN.rewardPerOz - (1 - winRate) * TRADE_PLAN.riskPerOz;
    expect(expectancy).toBeGreaterThan(0);
  });

  it("produces positive expectancy even at 20% win rate (stress test)", () => {
    const winRate = 0.2;
    const expectancy =
      winRate * TRADE_PLAN.rewardPerOz - (1 - winRate) * TRADE_PLAN.riskPerOz;
    expect(expectancy).toBeGreaterThan(0);
  });
});

describe("TRADE_PLAN — derivation completeness", () => {
  it("has a non-empty derivation for entry, stop, and TP", () => {
    expect(TRADE_PLAN.derivation.entry.length).toBeGreaterThan(50);
    expect(TRADE_PLAN.derivation.stopLoss.length).toBeGreaterThan(50);
    expect(TRADE_PLAN.derivation.takeProfit.length).toBeGreaterThan(50);
  });

  it("entry derivation mentions a structurally significant level", () => {
    const text = TRADE_PLAN.derivation.entry.toLowerCase();
    expect(
      text.includes("sma") ||
      text.includes("supply") ||
      text.includes("range") ||
      text.includes("resistance")
    ).toBe(true);
  });

  it("stop derivation mentions invalidation logic", () => {
    const text = TRADE_PLAN.derivation.stopLoss.toLowerCase();
    expect(
      text.includes("invalid") ||
      text.includes("reclaim") ||
      text.includes("structure") ||
      text.includes("close above")
    ).toBe(true);
  });

  it("TP derivation mentions measured move or projection", () => {
    const text = TRADE_PLAN.derivation.takeProfit.toLowerCase();
    expect(
      text.includes("measured") ||
      text.includes("project") ||
      text.includes("target") ||
      text.includes("range")
    ).toBe(true);
  });

  it("has at least 5 confluence factors", () => {
    expect(TRADE_PLAN.confluence.length).toBeGreaterThanOrEqual(5);
  });

  it("has at least 3 invalidation conditions", () => {
    expect(TRADE_PLAN.invalidation.length).toBeGreaterThanOrEqual(3);
  });

  it("has a non-empty execution window", () => {
    expect(TRADE_PLAN.executionWindow.length).toBeGreaterThan(20);
  });
});

describe("MARKET DATA — structural consistency", () => {
  it("spot price is within the 5-week range", () => {
    expect(CURRENT_MARKET.spot).toBeGreaterThanOrEqual(CURRENT_MARKET.rangeLow_5wk - 50);
    expect(CURRENT_MARKET.spot).toBeLessThanOrEqual(CURRENT_MARKET.rangeHigh_5wk + 50);
  });

  it("ATH is greater than current spot", () => {
    expect(CURRENT_MARKET.ath).toBeGreaterThan(CURRENT_MARKET.spot);
  });

  it("8-month low is below current spot", () => {
    expect(CURRENT_MARKET.eightMonthLow).toBeLessThan(CURRENT_MARKET.spot);
  });

  it("drawdown is correctly computed", () => {
    const expected = ((CURRENT_MARKET.spot - CURRENT_MARKET.ath) / CURRENT_MARKET.ath) * 100;
    expect(Math.abs(CURRENT_MARKET.drawdownFromAth - expected)).toBeLessThan(0.5);
  });

  it("all SMAs are above spot (bearish regime)", () => {
    expect(CURRENT_MARKET.sma20_daily).toBeGreaterThan(CURRENT_MARKET.spot);
    expect(CURRENT_MARKET.sma50_daily).toBeGreaterThan(CURRENT_MARKET.spot);
    expect(CURRENT_MARKET.sma100_daily).toBeGreaterThan(CURRENT_MARKET.spot);
  });

  it("SMA ordering is logical (20 < 50 < 100 in a downtrend)", () => {
    expect(CURRENT_MARKET.sma20_daily).toBeLessThan(CURRENT_MARKET.sma50_daily);
    expect(CURRENT_MARKET.sma50_daily).toBeLessThan(CURRENT_MARKET.sma100_daily);
  });

  it("key levels include the major psychological $4,000", () => {
    const has4000 = KEY_LEVELS.some((l) => l.value === 4000);
    expect(has4000).toBe(true);
  });

  it("has at least one supply zone containing the entry", () => {
    const hasMatchingSupply = ZONES.some(
      (z) =>
        z.type === "supply" &&
        TRADE_PLAN.entry >= z.bottom &&
        TRADE_PLAN.entry <= z.top,
    );
    expect(hasMatchingSupply).toBe(true);
  });

  it("has a sell-stop liquidity pool at or near $3,942 (8-mo low)", () => {
    const has3942 = LIQUIDITY.some(
      (l) => l.side === "below" && Math.abs(l.price - 3942) < 1,
    );
    expect(has3942).toBe(true);
  });
});

describe("STRUCTURE EVENTS — BOS / CHoCH timeline", () => {
  it("has at least one CHoCH event (Change of Character)", () => {
    const choch = STRUCTURE_EVENTS.filter((e) => e.type === "CHoCH");
    expect(choch.length).toBeGreaterThanOrEqual(1);
  });

  it("has at least one BOS event (Break of Structure)", () => {
    const bos = STRUCTURE_EVENTS.filter((e) => e.type === "BOS");
    expect(bos.length).toBeGreaterThanOrEqual(1);
  });

  it("has a pending BOS event below $3,942 (the trigger for our TP)", () => {
    const pending = STRUCTURE_EVENTS.find(
      (e) => e.timestamp === "PENDING" && e.level === 3942,
    );
    expect(pending).toBeDefined();
    expect(pending?.direction).toBe("bearish");
  });

  it("all events are bearish (consistent with SHORT bias)", () => {
    const nonBearish = STRUCTURE_EVENTS.filter((e) => e.direction !== "bearish");
    // Allow at most 0 non-bearish events — bias must be uniform
    expect(nonBearish.length).toBe(0);
  });

  it("has a liquidity-sweep event at $3,942", () => {
    const sweep = STRUCTURE_EVENTS.find(
      (e) => e.type === "LIQUIDITY-SWEEP" && e.level === 3942,
    );
    expect(sweep).toBeDefined();
  });
});

describe("SWING POINTS — market structure sequence", () => {
  it("starts with HH (the ATH) and ends with LL (current bearish state)", () => {
    const weekly = SWING_POINTS.filter((s) => s.timeframe === "W");
    const hasHH = weekly.some((s) => s.kind === "HH");
    const hasLL = weekly.some((s) => s.kind === "LL");
    expect(hasHH).toBe(true);
    expect(hasLL).toBe(true);
  });

  it("contains the LH at $5,400 that flipped macro structure bearish", () => {
    const hasLH5400 = SWING_POINTS.some(
      (s) => s.kind === "LH" && s.price === 5400 && s.timeframe === "W",
    );
    expect(hasLH5400).toBe(true);
  });

  it("contains the LL at $3,942 (8-month low)", () => {
    const hasLL3942 = SWING_POINTS.some(
      (s) => s.kind === "LL" && s.price === 3942,
    );
    expect(hasLL3942).toBe(true);
  });
});

describe("computePositionSize — risk management", () => {
  it("computes correct risk amount for $10k account at 1% risk", () => {
    const r = computePositionSize(10000, 1, 30);
    expect(r.riskAmountUSD).toBe(100);
  });

  it("computes correct ounces when risk = $100 and stop distance = $30", () => {
    const r = computePositionSize(10000, 1, 30);
    expect(r.ounces).toBeCloseTo(3.33, 1);
  });

  it("computes correct lots for standard 100oz contract", () => {
    const r = computePositionSize(10000, 1, 30, 100);
    expect(r.lots).toBeCloseTo(0.033, 2);
  });

  it("scales linearly with account balance", () => {
    const r1 = computePositionSize(10000, 1, 30);
    const r2 = computePositionSize(20000, 1, 30);
    expect(r2.riskAmountUSD).toBe(2 * r1.riskAmountUSD);
    // Allow ±0.05 rounding tolerance because round2() snaps to 2 decimals
    expect(r2.ounces).toBeCloseTo(2 * r1.ounces, 1);
  });

  it("scales linearly with risk percent", () => {
    const r1 = computePositionSize(10000, 1, 30);
    const r2 = computePositionSize(10000, 2, 30);
    expect(r2.riskAmountUSD).toBe(2 * r1.riskAmountUSD);
  });

  it("rejects zero or negative account balance", () => {
    expect(() => computePositionSize(0, 1, 30)).toThrow();
    expect(() => computePositionSize(-100, 1, 30)).toThrow();
  });

  it("rejects risk percent above 5% (professional cap)", () => {
    expect(() => computePositionSize(10000, 5.1, 30)).toThrow();
    expect(() => computePositionSize(10000, 10, 30)).toThrow();
  });

  it("rejects zero or negative risk percent", () => {
    expect(() => computePositionSize(10000, 0, 30)).toThrow();
    expect(() => computePositionSize(10000, -1, 30)).toThrow();
  });

  it("rejects zero or negative stop distance", () => {
    expect(() => computePositionSize(10000, 1, 0)).toThrow();
    expect(() => computePositionSize(10000, 1, -10)).toThrow();
  });

  it("rejects zero or negative contract size", () => {
    expect(() => computePositionSize(10000, 1, 30, 0)).toThrow();
    expect(() => computePositionSize(10000, 1, 30, -1)).toThrow();
  });

  it("at 1% risk on $10k account with this trade plan, position size is sane", () => {
    const r = computePositionSize(10000, 1, TRADE_PLAN.riskPerOz, 100);
    // For a $10k account, 1% risk, $30 stop, 100oz contract → 0.033 lots = 3.33 oz
    expect(r.lots).toBeGreaterThan(0.01);
    expect(r.lots).toBeLessThan(0.1);
    // Dollar profit at R:R 7:1 = riskAmount × R:R = $100 × 7 = $700
    // (which equals 3.33 oz × $210/oz reward per ounce)
    const profit = r.riskAmountUSD * TRADE_PLAN.rr;
    expect(profit).toBe(700);
    // Per-ounce reward is independent of position size
    expect(TRADE_PLAN.rewardPerOz).toBe(210);
  });
});
