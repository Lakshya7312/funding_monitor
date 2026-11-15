// Fetches live prices and funding rates from Bybit's public API (no API key needed).
import type { MarketData, PerpData } from "../types";

const TICKERS_URL = "https://api.bybit.com/v5/market/tickers";

// The fields we use from Bybit's response. Bybit sends every number as a string.
type BybitTicker = {
  symbol: string;
  lastPrice: string;
  markPrice: string;
  fundingRate: string;
  nextFundingTime: string;
};

// Get every ticker in one category: "spot" or "linear" (linear = perpetuals).
async function getTickers(category: "spot" | "linear"): Promise<BybitTicker[]> {
  const response = await fetch(`${TICKERS_URL}?category=${category}`);
  if (!response.ok) throw new Error(`Bybit returned HTTP ${response.status}`);

  const json = await response.json();
  if (json.retCode !== 0) throw new Error(`Bybit error: ${json.retMsg}`);

  return json.result.list;
}

// Fetch spot and perp data for the given symbols (e.g. ["BTCUSDT", "ETHUSDT"]).
export async function fetchMarketData(symbols: string[]): Promise<MarketData> {
  // Send both requests at the same time and wait for both to finish.
  const [spotTickers, perpTickers] = await Promise.all([getTickers("spot"), getTickers("linear")]);

  const spotPrices: Record<string, number> = {};
  const perps: Record<string, PerpData> = {};

  for (const symbol of symbols) {
    const spot = spotTickers.find((t) => t.symbol === symbol);
    const perp = perpTickers.find((t) => t.symbol === symbol);
    if (!spot || !perp) throw new Error(`No Bybit data for ${symbol}`);

    spotPrices[symbol] = Number(spot.lastPrice);
    perps[symbol] = {
      markPrice: Number(perp.markPrice),
      fundingRate: Number(perp.fundingRate),
      nextFundingTime: Number(perp.nextFundingTime),
    };
  }

  return { spotPrices, perps, fetchedAt: Date.now() };
}
