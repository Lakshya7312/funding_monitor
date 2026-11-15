// Table of all 9 positions with their live numbers.
import type { PositionRow } from "../types";
import {
  ASSET_COLORS,
  formatCountdown,
  formatPercent,
  formatPrice,
  formatSignedUsd,
  formatUsd,
  gainLossClass,
} from "../lib/format";

type Props = {
  rows: PositionRow[];
  now: number;
};

export function PositionsTable({ rows, now }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Positions</h2>
        <p className="panel-note">
          Grouped by hedge pair, cash last. Spot priced at last trade, perps at mark price.
        </p>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Instrument</th>
              <th>Side</th>
              <th className="num">Quantity</th>
              <th className="num">Entry price</th>
              <th className="num">Current price</th>
              <th className="num">Position value</th>
              <th className="num">Unrealised PnL</th>
              <th className="num">Funding rate</th>
              <th className="num">Next funding</th>
              <th className="num">Expected funding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              // Draw a divider line above each new asset (BTC, ETH, ...).
              <tr key={r.symbol + r.instrument} className={i > 0 && rows[i - 1].asset !== r.asset ? "group-start" : ""}>
                <td>
                  <span className="swatch" style={{ background: ASSET_COLORS[r.asset] }} />
                  <strong>{r.symbol}</strong>
                </td>
                <td>
                  <span className="tag">{r.instrument}</span>
                </td>
                <td className="side">{r.side}</td>
                <td className="num">{r.quantity.toLocaleString("en-US")}</td>
                <td className="num">{formatPrice(r.entry_price_usdt)}</td>
                <td className="num">{formatPrice(r.currentPrice)}</td>
                <td className="num">{formatUsd(r.value)}</td>
                <td className={`num ${gainLossClass(r.pnl)}`}>{formatSignedUsd(r.pnl)}</td>

                {/* The last three columns only apply to perps; spot rows show a dash. */}
                <td className="num">{r.fundingRate === null ? "—" : formatPercent(r.fundingRate, 4, true)}</td>
                <td className="num">{r.nextFundingTime === null ? "—" : formatCountdown(r.nextFundingTime - now)}</td>
                <td className={`num ${gainLossClass(r.expectedFunding ?? 0)}`}>
                  {r.expectedFunding === null ? "—" : formatSignedUsd(r.expectedFunding)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
