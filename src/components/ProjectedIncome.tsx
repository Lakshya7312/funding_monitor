// Extra feature: "Projected income".
import type { PortfolioSummary } from "../types";
import { formatPercent, formatSignedUsd, gainLossClass } from "../lib/format";

type Props = {
  summary: PortfolioSummary;
};

export function ProjectedIncome({ summary }: Props) {
  return (
    <section className="card">
      <h3>Projected funding income</h3>
      <p className="card-sub">If every payment matches the next one: 3 payments a day, every 8 hours.</p>

      <div className="income-stats">
        <div>
          <p className={`card-value ${gainLossClass(summary.dailyIncome)}`}>{formatSignedUsd(summary.dailyIncome)}</p>
          <p className="card-sub">Per day (next funding × 3)</p>
        </div>
        <div>
          <p className={`card-value ${gainLossClass(summary.yearlyIncome)}`}>{formatSignedUsd(summary.yearlyIncome)}</p>
          <p className="card-sub">Per year (per day × 365)</p>
        </div>
        <div>
          <p className={`card-value ${gainLossClass(summary.incomeYield)}`}>
            {formatPercent(summary.incomeYield, 2, true)}
          </p>
          <p className="card-sub">Yield (per year ÷ equity)</p>
        </div>
      </div>
    </section>
  );
}
