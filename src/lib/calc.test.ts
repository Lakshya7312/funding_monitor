// Tests for the portfolio maths, using fixed prices so every expected value can be checked by hand.
// Run with: npm test
import { describe, expect, it } from "vitest";
import portfolio from "../data/portfolio.json";
import type { MarketData, Position } from "../types";
import { calculateExpectedFunding, calculatePnl, calculatePortfolio, calculateStartingBalance } from "./calc";

const positions = portfolio.positions as Position[];

const market: MarketData = {
  fetchedAt: 0,
  spotPrices: { BTCUSDT: 68000, ETHUSDT: 2000, SOLUSDT: 80, HYPEUSDT: 72 },
  perps: {
    BTCUSDT: { markPrice: 68100, fundingRate: 0.0001, nextFundingTime: 1000 },
    ETHUSDT: { markPrice: 2002, fundingRate: 0.00005, nextFundingTime: 1000 },
    SOLUSDT: { markPrice: 80, fundingRate: -0.0001, nextFundingTime: 1000 },
    HYPEUSDT: { markPrice: 72, fundingRate: 0, nextFundingTime: 1000 },
  },
};

describe("single-position formulas", () => {
  it("long PnL = (current − entry) × quantity", () => {
    expect(calculatePnl("LONG", 1.25, 70000, 68000)).toBe(-2500);
  });

  it("short PnL = (entry − current) × quantity", () => {
    expect(calculatePnl("SHORT", 1.25, 70000, 68000)).toBe(2500);
  });

  it("a short receives funding when the rate is positive and pays when negative", () => {
    expect(calculateExpectedFunding("SHORT", 100000, 0.0001)).toBeCloseTo(10);
    expect(calculateExpectedFunding("SHORT", 100000, -0.0001)).toBeCloseTo(-10);
  });

  it("a long pays funding when the rate is positive", () => {
    expect(calculateExpectedFunding("LONG", 100000, 0.0001)).toBeCloseTo(-10);
  });
});

describe("whole portfolio", () => {
  const summary = calculatePortfolio(positions, market);

  it("starting balance = USDT cash + spot legs at entry", () => {
    expect(calculateStartingBalance(positions)).toBeCloseTo(235034.48, 2);
  });

  it("total PnL adds up every leg", () => {
    // BTC: spot −2,500, perp +2,375   ETH: spot −4,500, perp +4,455
    // SOL and HYPE: spot and perp cancel exactly   USDT: 0
    expect(summary.totalPnl).toBeCloseTo(-170, 6);
    expect(summary.equity).toBeCloseTo(235034.48 - 170, 2);
  });

  it("expected funding adds up the perp legs only", () => {
    // BTC 85,125 × 0.0001 = 8.5125   ETH 45,045 × 0.00005 = 2.25225   SOL 21,200 × −0.0001 = −2.12
    expect(summary.totalExpectedFunding).toBeCloseTo(8.5125 + 2.25225 - 2.12, 6);
  });

  it("net delta = spot value − perp value, with USDT excluded", () => {
    // BTC: 85,000 − 85,125   ETH: 45,000 − 45,045   SOL and HYPE: spot and perp prices are equal, so 0
    expect(summary.netDelta).toBeCloseTo(-170, 6);
    expect(summary.netDeltaPct).toBeCloseTo(-170 / summary.equity, 10);
  });

  it("projected income: per day = next funding × 3, per year = per day × 365, yield = per year / equity", () => {
    const nextFunding = 8.5125 + 2.25225 - 2.12;
    expect(summary.dailyIncome).toBeCloseTo(nextFunding * 3, 6);
    expect(summary.yearlyIncome).toBeCloseTo(nextFunding * 3 * 365, 6);
    expect(summary.incomeYield).toBeCloseTo((nextFunding * 3 * 365) / summary.equity, 10);
  });

  it("rows are grouped by asset, spot before perp, USDT last", () => {
    expect(summary.rows.map((r) => `${r.asset}-${r.instrument}`)).toEqual([
      "BTC-SPOT", "BTC-PERP", "ETH-SPOT", "ETH-PERP", "SOL-SPOT", "SOL-PERP", "HYPE-SPOT", "HYPE-PERP", "USDT-SPOT",
    ]);
  });

  it("spot rows have no funding", () => {
    for (const row of summary.rows.filter((r) => r.instrument === "SPOT")) {
      expect(row.fundingRate).toBeNull();
      expect(row.expectedFunding).toBeNull();
    }
  });
});
