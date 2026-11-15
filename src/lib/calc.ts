// All the portfolio maths.
import type { MarketData, Position, PositionRow, PortfolioSummary } from "../types";

// Display order for assets: hedge pairs from largest to smallest, then cash.
export const ASSET_ORDER = ["BTC", "ETH", "SOL", "HYPE", "USDT"];

// Funding is paid every 8 hours, so 3 times a day.
const FUNDING_PAYMENTS_PER_DAY = 3;

// Spot uses the last traded price, perps use the mark price, and USDT is always $1.
export function getCurrentPrice(position: Position, market: MarketData): number {
  if (position.asset === "USDT") return 1;
  if (position.instrument === "SPOT") return market.spotPrices[position.symbol];
  return market.perps[position.symbol].markPrice;
}

// LONG makes money when the price rises, SHORT makes money when it falls.
export function calculatePnl(side: Position["side"], quantity: number, entryPrice: number, currentPrice: number): number {
  if (side === "LONG") return (currentPrice - entryPrice) * quantity;
  return (entryPrice - currentPrice) * quantity;
}

// When the rate is positive, shorts receive (+) and longs pay (−).
export function calculateExpectedFunding(side: Position["side"], value: number, fundingRate: number): number {
  if (side === "SHORT") return value * fundingRate;
  return -value * fundingRate;
}

// Starting balance = everything we paid for at entry: USDT cash + spot legs.
// Perps are traded on margin (not bought outright), so they add nothing.
// For this portfolio: 50,000 + 87,500 + 49,500 + 26,500 + 21,534.48 = 235,034.48
export function calculateStartingBalance(positions: Position[]): number {
  let total = 0;
  for (const p of positions) {
    if (p.instrument === "SPOT") total += p.quantity * p.entry_price_usdt;
  }
  return total;
}

// Turn one position into a table row with its live numbers.
function buildRow(position: Position, market: MarketData): PositionRow {
  const currentPrice = getCurrentPrice(position, market);
  const value = position.quantity * currentPrice;
  const pnl = calculatePnl(position.side, position.quantity, position.entry_price_usdt, currentPrice);

  // Spot positions don't pay or receive funding.
  if (position.instrument === "SPOT") {
    return { ...position, currentPrice, value, pnl, fundingRate: null, nextFundingTime: null, expectedFunding: null };
  }

  const perp = market.perps[position.symbol];
  return {
    ...position,
    currentPrice,
    value,
    pnl,
    fundingRate: perp.fundingRate,
    nextFundingTime: perp.nextFundingTime,
    expectedFunding: calculateExpectedFunding(position.side, value, perp.fundingRate),
  };
}

// Sort rows by asset (ASSET_ORDER), with each asset's spot row before its perp row.
function compareRows(a: PositionRow, b: PositionRow): number {
  if (a.asset !== b.asset) return ASSET_ORDER.indexOf(a.asset) - ASSET_ORDER.indexOf(b.asset);
  return a.instrument === "SPOT" ? -1 : 1;
}

// Calculate everything the dashboard shows.
export function calculatePortfolio(positions: Position[], market: MarketData): PortfolioSummary {
  const rows = positions.map((p) => buildRow(p, market)).sort(compareRows);

  const startingBalance = calculateStartingBalance(positions);
  const totalPnl = sum(rows.map((r) => r.pnl));
  const equity = startingBalance + totalPnl; // Formula 4
  // Perp rows have funding values; spot rows have null, which we skip.
  const perpRows = rows.filter((r) => r.instrument === "PERP");

  // Formula 3: net delta = spot value - perp value.
  // USDT is cash (holding the quote currency isn't market exposure), so it's left out.
  const spotRows = rows.filter((r) => r.instrument === "SPOT" && r.asset !== "USDT");
  const netDelta = sum(spotRows.map((r) => r.value)) - sum(perpRows.map((r) => r.value));

  // Projected income: assume every payment today and this year matches the next one.
  const totalExpectedFunding = sum(perpRows.map((r) => r.expectedFunding!));
  const dailyIncome = totalExpectedFunding * FUNDING_PAYMENTS_PER_DAY;
  const yearlyIncome = dailyIncome * 365;

  return {
    rows,
    startingBalance,
    totalPnl,
    equity,
    totalExpectedFunding,
    nextFundingTime: Math.min(...perpRows.map((r) => r.nextFundingTime!)),
    netDelta,
    netDeltaPct: netDelta / equity,
    dailyIncome,
    yearlyIncome,
    incomeYield: yearlyIncome / equity, // formatPercent does the × 100 when displaying
  };
}

function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}
