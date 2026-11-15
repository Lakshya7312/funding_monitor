// One position from portfolio.json.
export type Position = {
  asset: string; // e.g. "BTC"
  symbol: string; // e.g. "BTCUSDT"
  instrument: "SPOT" | "PERP";
  side: "LONG" | "SHORT";
  quantity: number;
  entry_price_usdt: number;
};

// Live data for one perpetual contract, from Bybit.
export type PerpData = {
  markPrice: number;
  fundingRate: number; // per funding period, as a decimal (0.0001 = 0.01%)
  nextFundingTime: number; // Unix time in milliseconds
};

// Everything we fetch from Bybit in one update.
export type MarketData = {
  spotPrices: Record<string, number>; // symbol -> last traded spot price
  perps: Record<string, PerpData>; // symbol -> perp data
  fetchedAt: number; // when we fetched it (Unix ms)
};

// One row of the positions table: the position plus its live numbers.
export type PositionRow = Position & {
  currentPrice: number;
  value: number; // notional value
  pnl: number; // unrealised PnL
  fundingRate: number | null; // null for spot (spot has no funding)
  nextFundingTime: number | null;
  expectedFunding: number | null;
};

// Everything the dashboard displays, calculated from the portfolio + market data.
export type PortfolioSummary = {
  rows: PositionRow[];
  startingBalance: number;
  totalPnl: number;
  equity: number;
  totalExpectedFunding: number;
  nextFundingTime: number;
  netDelta: number; // spot value - perp value, cash excluded
  netDeltaPct: number; // netDelta / equity
  dailyIncome: number; // projected funding income per day
  yearlyIncome: number; // projected funding income per year
  incomeYield: number; // yearlyIncome / equity, as a decimal (0.05 = 5%)
};

// One point on the equity chart.
export type EquityPoint = {
  time: number; // Unix ms
  equity: number;
};
