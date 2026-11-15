// The main component.
import { useEffect, useState } from "react";
import portfolio from "./data/portfolio.json";
import type { EquityPoint, MarketData, Position } from "./types";
import { fetchMarketData } from "./lib/bybit";
import { calculatePortfolio } from "./lib/calc";
import { Header } from "./components/Header";
import { SummaryCards } from "./components/SummaryCards";
import { ProjectedIncome } from "./components/ProjectedIncome";
import { EquityChart } from "./components/EquityChart";
import { ExposurePies } from "./components/ExposurePies";
import { PositionsTable } from "./components/PositionsTable";

const positions = portfolio.positions as Position[];

// The symbols we need prices for: every non-cash asset, e.g. ["BTCUSDT", "ETHUSDT", ...].
const symbols = [...new Set(positions.filter((p) => p.asset !== "USDT").map((p) => p.symbol))];

const UPDATE_EVERY_MS = 60_000; // 1 minute
const HISTORY_KEY = "equity-history"; // where the chart's points are saved in the browser
const MAX_HISTORY_POINTS = 1440; // 24 hours of 1-minute points

// Load saved chart points, so refreshing the page doesn't wipe the chart.
function loadHistory(): EquityPoint[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function App() {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [nextUpdateAt, setNextUpdateAt] = useState(() => Date.now());
  const [history, setHistory] = useState<EquityPoint[]>(loadHistory);
  const [now, setNow] = useState(() => Date.now());

  // Fetch new data whenever nextUpdateAt is reached.
  // After each fetch we set nextUpdateAt to 1 minute later, which runs this effect again.
  // The "Update now" button sets nextUpdateAt to now, which fetches immediately
  // and restarts the 1-minute countdown.
  useEffect(() => {
    async function update() {
      setIsUpdating(true);
      try {
        const data = await fetchMarketData(symbols);
        const { equity } = calculatePortfolio(positions, data);
        setMarket(data);
        setError(null);
        setHistory((old) => [...old, { time: data.fetchedAt, equity }].slice(-MAX_HISTORY_POINTS));
      } catch (err) {
        // Keep showing the last good data and display the error.
        setError(err instanceof Error ? err.message : String(err));
      }
      setIsUpdating(false);
      setNextUpdateAt(Date.now() + UPDATE_EVERY_MS);
    }

    const timer = setTimeout(update, nextUpdateAt - Date.now());
    return () => clearTimeout(timer); // cancel the old timer if nextUpdateAt changes
  }, [nextUpdateAt]);

  // Tick every second so the countdowns move.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Save the chart history whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Storage can be unavailable (e.g. private browsing). The chart still works, it just won't be saved.
    }
  }, [history]);

  const header = (
    <Header
      lastUpdated={market?.fetchedAt}
      nextUpdateAt={nextUpdateAt}
      isUpdating={isUpdating}
      error={error}
      now={now}
      onUpdateNow={() => setNextUpdateAt(Date.now())}
    />
  );

  // Before the first successful fetch there's nothing to calculate yet.
  if (!market) {
    return (
      <div className="app">
        {header}
        <div className="empty-state">{error ? `Could not load market data: ${error}` : "Loading live market data…"}</div>
      </div>
    );
  }

  // Recalculate every number from the portfolio + latest market data.
  const summary = calculatePortfolio(positions, market);

  return (
    <div className="app">
      {header}
      <main>
        <SummaryCards summary={summary} now={now} />
        <ProjectedIncome summary={summary} />
        <div className="grid-2">
          <EquityChart
            history={history}
            startingBalance={summary.startingBalance}
            onReset={() => setHistory((old) => old.slice(-1))}
          />
          <ExposurePies rows={summary.rows} />
        </div>
        <PositionsTable rows={summary.rows} now={now} />
        <footer className="footnote muted">
          Starting balance = USDT cash + spot legs at entry cost (perps are traded on margin, so they add no cost).
          Equity = starting balance + total unrealised PnL. Expected funding is shown from the position's side: +
          received, − paid.
        </footer>
      </main>
    </div>
  );
}
