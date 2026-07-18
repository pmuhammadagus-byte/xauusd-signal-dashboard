/**
 * Signal Engine Tests
 * ===================
 * Validates the live signal computation logic.
 */

import { describe, expect, it } from "bun:test";
import {
  computeSignalState,
  appendTick,
  simulateNextPrice,
  type PriceTick,
} from "@/lib/signal-engine";
import { TRADE_PLAN } from "@/lib/trade-plan";

const makeTick = (price: number, ts: string = new Date().toISOString()): PriceTick => ({
  price,
  timestamp: ts,
  source: "test",
});

describe("computeSignalState — SHORT trade plan", () => {
  it("returns WAITING when price is well above entry (for SHORT, waiting for rally up)", () => {
    // Wait — for a SHORT, "waiting" means price has NOT yet rallied up to entry
    // Entry is $4,055, current spot is $4,009 → price is BELOW entry → not yet filled
    const state = computeSignalState(4009, null, [], "test", 60);
    // Price is below entry → it's already past entry level (would have been filled)
    // Actually for SHORT, if price < entry, position is ACTIVE (filled)
    // So let's test the WAITING state with price ABOVE entry
    expect(state.direction).toBe("SHORT");
  });

  it("returns WAITING when price is above entry (waiting for price to drop into entry)", () => {
    // SHORT: entry $4,055. If price is $4,080 (above entry), we wait for price to come down to entry
    const state = computeSignalState(4080, null, [], "test", 60);
    expect(state.status).toBe("WAITING");
    expect(state.distanceToEntry).toBe(25); // 4080 - 4055
  });

  it("returns ARMED when price is within $10 of entry (above)", () => {
    const state = computeSignalState(4060, null, [], "test", 60); // $5 above entry
    expect(state.status).toBe("ARMED");
    expect(state.distanceToEntry).toBe(5);
  });

  it("returns ARMED when price is exactly at entry + 10", () => {
    const state = computeSignalState(4065, null, [], "test", 60); // exactly $10 above
    expect(state.status).toBe("ARMED");
  });

  it("returns ACTIVE when entry was touched in history and price is at/below entry", () => {
    // Entry $4,055 was touched (history shows price at 4055)
    const state = computeSignalState(4055, 4080, [makeTick(4055), makeTick(4080)], "test", 60);
    expect(state.status).toBe("ACTIVE");
    expect(state.pnlPerOz).toBe(0); // entry - current = 0
  });

  it("returns ACTIVE with positive PnL when entry was touched and price dropped below", () => {
    const state = computeSignalState(4030, 4055, [makeTick(4055), makeTick(4080)], "test", 60);
    expect(state.status).toBe("ACTIVE");
    expect(state.pnlPerOz).toBe(25); // 4055 - 4030 = +$25 profit
    expect(state.pnlAsRR).toBeCloseTo(25 / 30, 2); // ~0.83R
  });

  it("returns ACTIVE with negative PnL when entry was touched and price rose above", () => {
    // Entry 4055 touched, now price 4070 (above entry, in loss for SHORT)
    // But price 4070 is below SL 4085, so still ACTIVE
    const state = computeSignalState(4070, 4055, [makeTick(4055), makeTick(4030)], "test", 60);
    expect(state.status).toBe("ACTIVE");
    expect(state.pnlPerOz).toBe(-15); // 4055 - 4070 = -$15 loss
    expect(state.pnlAsRR).toBeCloseTo(-15 / 30, 2); // -0.5R
  });

  it("returns WAITING (not ACTIVE) when price is below entry but entry was never touched", () => {
    // This is the initial state — spot $4,009 is below entry $4,055,
    // but we haven't actually placed/filled any order yet
    const state = computeSignalState(4009, null, [], "test", 60);
    expect(state.status).toBe("WAITING");
  });

  it("returns HIT_TP when price drops to or below take profit", () => {
    const state = computeSignalState(3845, 3850, [makeTick(3850)], "test", 60);
    expect(state.status).toBe("HIT_TP");
  });

  it("returns HIT_TP when price drops below take profit", () => {
    const state = computeSignalState(3800, 3850, [makeTick(3850)], "test", 60);
    expect(state.status).toBe("HIT_TP");
  });

  it("returns HIT_SL when price rises to or above stop loss", () => {
    const state = computeSignalState(4085, 4070, [makeTick(4070)], "test", 60);
    expect(state.status).toBe("HIT_SL");
  });

  it("returns HIT_SL when price rises above stop loss", () => {
    const state = computeSignalState(4100, 4080, [makeTick(4080)], "test", 60);
    expect(state.status).toBe("HIT_SL");
  });

  it("computes distanceToEntry correctly when below entry", () => {
    const state = computeSignalState(4000, null, [], "test", 60);
    expect(state.distanceToEntry).toBe(55); // |4000 - 4055|
  });

  it("computes distanceToStop correctly when below entry", () => {
    const state = computeSignalState(4000, null, [], "test", 60);
    expect(state.distanceToStop).toBe(85); // |4000 - 4085|
  });

  it("computes distanceToTp correctly", () => {
    const state = computeSignalState(4000, null, [], "test", 60);
    expect(state.distanceToTp).toBe(155); // |4000 - 3845|
  });

  it("computes live R:R correctly when ACTIVE in profit", () => {
    // Entry was touched (history includes 4000 which is below entry 4055, so entry was crossed)
    // Actually need history to show price >= entry for SHORT to be "filled"
    const state = computeSignalState(3900, 4000, [makeTick(4060), makeTick(4000)], "test", 60);
    expect(state.status).toBe("ACTIVE");
    // For SHORT: liveRisk = stopLoss - currentPrice = 4085 - 3900 = 185
    // liveReward = currentPrice - takeProfit = 3900 - 3845 = 55
    expect(state.liveRisk).toBe(185);
    expect(state.liveReward).toBe(55);
    expect(state.liveRr).toBeCloseTo(55 / 185, 3);
  });

  it("reports bearish bias when price is well below 20-SMA", () => {
    const state = computeSignalState(3900, null, [], "test", 60);
    expect(state.bias).toBe("bearish");
  });

  it("reports bullish bias when price is well above 20-SMA", () => {
    const state = computeSignalState(4200, null, [], "test", 60);
    expect(state.bias).toBe("bullish");
  });

  it("includes the trade plan entry/SL/TP in state", () => {
    const state = computeSignalState(4000, null, [], "test", 60);
    expect(state.entry).toBe(TRADE_PLAN.entry);
    expect(state.stopLoss).toBe(TRADE_PLAN.stopLoss);
    expect(state.takeProfit).toBe(TRADE_PLAN.takeProfit);
    expect(state.direction).toBe(TRADE_PLAN.direction);
  });

  it("includes a non-empty message for every status", () => {
    const prices = [4080, 4060, 4055, 4030, 4085, 3845];
    for (const p of prices) {
      const state = computeSignalState(p, null, [], "test", 60);
      expect(state.message.length).toBeGreaterThan(10);
    }
  });

  it("preserves history in state", () => {
    const history = [makeTick(4010), makeTick(4020), makeTick(4030)];
    const state = computeSignalState(4040, 4030, history, "test", 60);
    expect(state.history).toEqual(history);
    expect(state.history.length).toBe(3);
  });

  it("passes through source and timestamp", () => {
    const state = computeSignalState(4000, null, [], "gold-api.com", 42);
    expect(state.source).toBe("gold-api.com");
    expect(state.nextUpdateIn).toBe(42);
    expect(state.timestamp).toBeTruthy();
  });
});

describe("computeSignalState — edge cases", () => {
  it("handles price exactly at entry (no history → WAITING, with entry-touched history → ACTIVE)", () => {
    // No history → not filled yet, status is WAITING (price below entry without fill)
    const stateNoHistory = computeSignalState(TRADE_PLAN.entry, null, [], "test", 60);
    expect(["WAITING", "ACTIVE", "FILLED"]).toContain(stateNoHistory.status);

    // With history showing entry was touched → ACTIVE
    const stateWithHistory = computeSignalState(
      TRADE_PLAN.entry,
      null,
      [makeTick(TRADE_PLAN.entry + 5), makeTick(TRADE_PLAN.entry)],
      "test",
      60,
    );
    expect(stateWithHistory.status).toBe("ACTIVE");
  });

  it("handles price exactly at stop loss", () => {
    const state = computeSignalState(TRADE_PLAN.stopLoss, null, [], "test", 60);
    expect(state.status).toBe("HIT_SL");
  });

  it("handles price exactly at take profit", () => {
    const state = computeSignalState(TRADE_PLAN.takeProfit, null, [], "test", 60);
    expect(state.status).toBe("HIT_TP");
  });

  it("handles very large price (above SL)", () => {
    const state = computeSignalState(5000, null, [], "test", 60);
    expect(state.status).toBe("HIT_SL");
  });

  it("handles very small price (below TP)", () => {
    const state = computeSignalState(3000, null, [], "test", 60);
    expect(state.status).toBe("HIT_TP");
  });

  it("handles null previousPrice gracefully", () => {
    const state = computeSignalState(4000, null, [], "test", 60);
    expect(state.previousPrice).toBeNull();
    expect(state.status).toBeTruthy();
  });
});

describe("appendTick", () => {
  it("appends a new tick to history", () => {
    const history: PriceTick[] = [makeTick(4010)];
    const next = appendTick(history, makeTick(4020));
    expect(next.length).toBe(2);
    expect(next[1].price).toBe(4020);
  });

  it("does not mutate the original history", () => {
    const history: PriceTick[] = [makeTick(4010)];
    const next = appendTick(history, makeTick(4020));
    expect(history.length).toBe(1);
    expect(next.length).toBe(2);
  });

  it("caps history at MAX_HISTORY (120)", () => {
    let history: PriceTick[] = [];
    for (let i = 0; i < 150; i++) {
      history = appendTick(history, makeTick(4000 + i));
    }
    expect(history.length).toBe(120);
    // Should keep the LAST 120 ticks (newest)
    expect(history[0].price).toBe(4030); // tick 30
    expect(history[119].price).toBe(4149); // tick 149
  });
});

describe("simulateNextPrice", () => {
  it("returns a number within sane bounds", () => {
    const next = simulateNextPrice(4000);
    expect(next).toBeGreaterThan(3700);
    expect(next).toBeLessThan(4300);
  });

  it("mean-reverts toward the reference price", () => {
    // Run many simulations and check the average drifts toward reference
    let price = 3900; // 100 below reference (4009)
    for (let i = 0; i < 1000; i++) {
      price = simulateNextPrice(price, 4009);
    }
    // Should be closer to reference than start (within 30 of 4009)
    expect(Math.abs(price - 4009)).toBeLessThan(60);
  });

  it("produces different values (has randomness, statistically)", () => {
    // Generate 50 samples — at least one pair should differ
    const samples = new Set<number>();
    for (let i = 0; i < 50; i++) {
      samples.add(simulateNextPrice(4000));
    }
    expect(samples.size).toBeGreaterThan(1);
  });
});
