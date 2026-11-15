# Funding Arbitrage Monitor

A real-time dashboard for a delta-neutral funding-rate arbitrage portfolio: 4 long spot positions hedged by 4 short perpetuals, plus USDT cash. It uses live prices and funding rates from Bybit's public API.

## Setup

Requires **Node.js 20+**.

To run:

```bash
npm install
npm run dev        # open http://localhost:5173
```

Other scripts:

```bash
npm test           # unit tests for all portfolio calculations
npm run build      # type-check + production build (output in dist/)
npm run lint
```

## Features

| Brief section | Where |
|---|---|
| A. Summary cards: equity, unrealised PnL, expected next funding, net delta % of equity | Top row |
| B. Spot and perp exposure pies + positions table with live prices, PnL, funding rate, HH:MM:SS countdown, expected funding | Middle |
| C. Live equity chart, one point per minute | Left of the pies |
| D. **Extra feature: projected income** | Below the summary cards |

**Live updates.** Market data is fetched when the page loads, then every 60 seconds. The **Update now** button fetches immediately and restarts the 60-second countdown from the click. Each fetch recalculates every metric and adds one point to the equity chart. Funding countdowns tick every second on a separate timer, without extra API calls. If a fetch fails, the dashboard keeps the last good data and shows a warning instead of going blank.

**Equity history** is saved in `localStorage`, so a page refresh doesn't wipe the chart. It keeps up to 24h of points, and "Reset history" clears it.

### Extra feature: projected income

The whole strategy exists to collect funding payments, so this card shows how much money it's actually making if current rates hold:

- **Per day** = total expected next funding × 3 (funding is paid every 8 hours)
- **Per year** = per day × 365
- **Yield** = per year / total equity × 100

It's a projection: real funding rates change every 8 hours, so the numbers move with them.

## Calculations

All maths lives in [`src/lib/calc.ts`](src/lib/calc.ts) as functions, tested in [`src/lib/calc.test.ts`](src/lib/calc.test.ts).

## Project structure

```
src/
  main.tsx                   starts React and renders <App />
  App.tsx                    all app state: market data, update timer, equity history
  types.ts                   the shapes of the data (Position, MarketData PortfolioSummary...)
  data/portfolio.json        the starting portfolio data
  lib/
    bybit.ts                 fetchMarketData(): calls the 2 Bybit endpoints
    calc.ts                  calculatePortfolio(): every formula for calculations
    calc.test.ts             tests for the formulas
    format.ts                number/time formatting and asset colours
  components/                display only: each takes numbers and draws one part of the page
    Header.tsx               title, updates, countdown
    SummaryCards.tsx         the 4 headline cards
    ProjectedIncome.tsx      extra feature: funding income per day, per year, and yield
    EquityChart.tsx          equity line chart
    ExposurePies.tsx         spot and perp pie charts
    PositionsTable.tsx       the positions table
  index.css                  styling, with light and dark colours
```

## How the code works

The data flows one way, in three steps:

1. **Fetch** (`lib/bybit.ts`). `fetchMarketData()` calls Bybit's spot and perpetual endpoints at the same time and returns the prices and funding data for our 4 symbols.
2. **Calculate** (`lib/calc.ts`). `calculatePortfolio(positions, marketData)` applies the math to every position. It returns one object (`PortfolioSummary`) holding every number the page shows.
3. **Display** (`components/`). `App.tsx` passes that summary to the components, and each component draws its part of the page.

`App.tsx` holds the state and the timers:

- `market`: the latest Bybit data. When it changes, React re-renders the page with fresh numbers.
- `nextUpdateAt`: when to fetch next. An effect sets a timer for that moment. Each fetch sets `nextUpdateAt` to 60 seconds later, which starts the next timer. **Update now** sets `nextUpdateAt` to the current time, so the fetch happens immediately and the countdown restarts.
- `now`: updated every second, so the countdowns move.
- `history`: the equity chart's points. One is added per fetch, and the list is saved to `localStorage`.

## Tech stack

React 19 + TypeScript, built with Vite. Recharts for the charts, Vitest for the tests. Plain CSS with light and dark themes that follow your OS setting.
