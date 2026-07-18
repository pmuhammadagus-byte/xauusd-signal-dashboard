/**
 * Trade Plan Validity Tests
 * =========================
 * Validates the auto-expiry and validity detection logic.
 */

import { describe, expect, it } from "bun:test";
import { computePlanValidity, DATA_FRESHNESS, TRADE_PLAN } from "@/lib/trade-plan";

describe("computePlanValidity — status detection", () => {
  it("returns HIT_TP when signal status is HIT_TP", () => {
    const v = computePlanValidity(3845, "HIT_TP");
    expect(v.status).toBe("HIT_TP");
    expect(v.isActionable).toBe(false);
    expect(v.message).toContain("TAKE PROFIT");
  });

  it("returns HIT_SL when signal status is HIT_SL", () => {
    const v = computePlanValidity(4085, "HIT_SL");
    expect(v.status).toBe("HIT_SL");
    expect(v.isActionable).toBe(false);
    expect(v.message).toContain("STOP LOSS");
  });

  it("returns INVALIDATED when live price is significantly above stop loss", () => {
    // For SHORT, stop loss is $4,085. Price > $4,095 = invalidated.
    const v = computePlanValidity(4100, "WAITING");
    expect(v.status).toBe("INVALIDATED");
    expect(v.isActionable).toBe(false);
    expect(v.nextAction).toContain("dead");
  });

  it("returns ACTIVE when live price is below stop loss and signal is WAITING/ACTIVE", () => {
    const v = computePlanValidity(4009, "WAITING");
    expect(v.status).toBe("ACTIVE");
    expect(v.isActionable).toBe(true);
    expect(v.message).toContain("ACTIVE");
  });

  it("returns ACTIVE when live price is at entry (within valid range)", () => {
    const v = computePlanValidity(TRADE_PLAN.entry, "ACTIVE");
    expect(v.status).toBe("ACTIVE");
    expect(v.isActionable).toBe(true);
  });

  it("returns ACTIVE when live price is at take profit level but signal not HIT_TP yet", () => {
    // Edge case: price at TP but signal engine hasn't confirmed yet
    const v = computePlanValidity(TRADE_PLAN.takeProfit, "WAITING");
    // Price at TP ($3,845) is below stop loss ($4,085), so not INVALIDATED
    // Signal is WAITING, not HIT_TP, so should be ACTIVE
    expect(v.status).toBe("ACTIVE");
    expect(v.isActionable).toBe(true);
  });
});

describe("computePlanValidity — age tracking", () => {
  it("reports ageInDays based on generatedAt timestamp", () => {
    const v = computePlanValidity(4000, "WAITING");
    expect(v.ageInDays).toBeGreaterThanOrEqual(0);
    expect(typeof v.ageInDays).toBe("number");
  });

  it("reports maxAgeInDays as 30", () => {
    const v = computePlanValidity(4000, "WAITING");
    expect(v.maxAgeInDays).toBe(30);
  });

  it("provides an expiresAt timestamp", () => {
    const v = computePlanValidity(4000, "WAITING");
    expect(v.expiresAt).toBeTruthy();
    const expires = new Date(v.expiresAt);
    expect(expires.getTime()).toBeGreaterThan(new Date(TRADE_PLAN.generatedAt).getTime());
  });

  it("days-left countdown in ACTIVE message is positive", () => {
    const v = computePlanValidity(4000, "WAITING");
    if (v.status === "ACTIVE") {
      expect(v.message).toMatch(/\d+ day/);
    }
  });
});

describe("computePlanValidity — next action guidance", () => {
  it("provides next action for HIT_TP", () => {
    const v = computePlanValidity(3845, "HIT_TP");
    expect(v.nextAction.length).toBeGreaterThan(20);
    expect(v.nextAction.toLowerCase()).toContain("profit");
  });

  it("provides next action for HIT_SL", () => {
    const v = computePlanValidity(4085, "HIT_SL");
    expect(v.nextAction.length).toBeGreaterThan(20);
    expect(v.nextAction.toLowerCase()).toContain("loss");
  });

  it("provides next action for INVALIDATED", () => {
    const v = computePlanValidity(4100, "WAITING");
    expect(v.nextAction.length).toBeGreaterThan(20);
  });

  it("provides next action for ACTIVE (place limit order)", () => {
    const v = computePlanValidity(4000, "WAITING");
    expect(v.nextAction.length).toBeGreaterThan(20);
    expect(v.nextAction.toLowerCase()).toContain("limit");
  });
});

describe("computePlanValidity — null handling", () => {
  it("handles null live price gracefully (uses signal status only)", () => {
    const v = computePlanValidity(null, "WAITING");
    // Without live price, can't detect INVALIDATED, so should be ACTIVE
    expect(v.status).toBe("ACTIVE");
  });

  it("handles null signal status gracefully", () => {
    const v = computePlanValidity(4000, null);
    expect(v.status).toBe("ACTIVE");
  });

  it("handles both null gracefully", () => {
    const v = computePlanValidity(null, null);
    expect(v.status).toBe("ACTIVE");
  });
});

describe("DATA_FRESHNESS — categorization", () => {
  it("has 4 freshness types", () => {
    expect(Object.keys(DATA_FRESHNESS)).toHaveLength(4);
    expect(DATA_FRESHNESS.timeless).toBeDefined();
    expect(DATA_FRESHNESS.structural).toBeDefined();
    expect(DATA_FRESHNESS["time-sensitive"]).toBeDefined();
    expect(DATA_FRESHNESS.live).toBeDefined();
  });

  it("each type has label, description, and color", () => {
    for (const key of Object.keys(DATA_FRESHNESS) as Array<keyof typeof DATA_FRESHNESS>) {
      const info = DATA_FRESHNESS[key];
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.description.length).toBeGreaterThan(10);
      expect(info.color.length).toBeGreaterThan(10);
      expect(info.type).toBe(key);
    }
  });

  it("timeless type has violet color (long-lived concept)", () => {
    expect(DATA_FRESHNESS.timeless.color).toContain("violet");
  });

  it("live type has emerald color (active feed)", () => {
    expect(DATA_FRESHNESS.live.color).toContain("emerald");
  });

  it("time-sensitive type has rose color (warning)", () => {
    expect(DATA_FRESHNESS["time-sensitive"].color).toContain("rose");
  });

  it("structural type has amber color (caution)", () => {
    expect(DATA_FRESHNESS.structural.color).toContain("amber");
  });
});
