// The four headline numbers at the top of the dashboard.
import type { PortfolioSummary } from "../types";
import { formatCountdown, formatPercent, formatSignedUsd, formatUsd, gainLossClass } from "../lib/format";

type Props = {
  summary: PortfolioSummary;
  now: number;
};

export function SummaryCards({ summary, now }: Props) {
  const equityChange = summary.equity - summary.startingBalance;

  return (
    <section className="cards">
      <div className="card">
        <h3>Total account equity</h3>
        <p className="card-value">{formatUsd(summary.equity)}</p>
        <p className="card-sub">
          <span className={gainLossClass(equityChange)}>
            {formatPercent(equityChange / summary.startingBalance, 3, true)}
          </span>{" "}
          vs starting {formatUsd(summary.startingBalance)}
        </p>
      </div>

      <div className="card">
        <h3>Total unrealised PnL</h3>
        <p className={`card-value ${gainLossClass(summary.totalPnl)}`}>{formatSignedUsd(summary.totalPnl)}</p>
        <p className="card-sub">Across all 8 spot and perp legs</p>
      </div>

      <div className="card">
        <h3>Expected next funding</h3>
        <p className={`card-value ${gainLossClass(summary.totalExpectedFunding)}`}>
          {formatSignedUsd(summary.totalExpectedFunding)}
        </p>
        <p className="card-sub">
          {summary.totalExpectedFunding >= 0 ? "Received" : "Paid"} in{" "}
          <span className="mono">{formatCountdown(summary.nextFundingTime - now)}</span>
        </p>
      </div>

      <div className="card">
        <h3>Net delta exposure</h3>
        <p className="card-value">{formatPercent(summary.netDeltaPct, 3, true)}</p>
        <p className="card-sub">{formatSignedUsd(summary.netDelta)} of equity, cash excluded</p>
      </div>
    </section>
  );
}
