// Two pie charts: how the spot value and the perp value are split across assets.
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { PositionRow } from "../types";
import { ASSET_COLORS, formatPercent, formatUsd } from "../lib/format";

type Props = {
  rows: PositionRow[];
};

export function ExposurePies({ rows }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Notional exposure</h2>
        <p className="panel-note">Spot longs (incl. USDT cash) vs perp shorts</p>
      </div>
      <div className="donuts">
        <Donut title="Spot (long)" rows={rows.filter((r) => r.instrument === "SPOT")} />
        <Donut title="Perpetual (short)" rows={rows.filter((r) => r.instrument === "PERP")} />
      </div>
    </section>
  );
}

// One donut. Hovering a slice (or its legend row) shows that asset's details
function Donut({ title, rows }: { title: string; rows: PositionRow[] }) {
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const hovered = rows.find((r) => r.asset === hoveredAsset);

  return (
    <figure className="donut">
      <figcaption>{title}</figcaption>

      <div className="donut-chart">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="asset"
              innerRadius="62%"
              outerRadius="92%"
              startAngle={90} // start at 12 o'clock...
              endAngle={-270} // ...and go clockwise
              stroke="var(--surface-1)" // thin gap between slices
              strokeWidth={2}
              isAnimationActive={false}
              onMouseEnter={(_, index) => setHoveredAsset(rows[index].asset)}
              onMouseLeave={() => setHoveredAsset(null)}
            >
              {rows.map((r) => (
                <Cell
                  key={r.asset}
                  fill={ASSET_COLORS[r.asset]}
                  // Fade the other slices while one is hovered.
                  fillOpacity={hoveredAsset && hoveredAsset !== r.asset ? 0.35 : 1}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Text in the middle of the donut */}
        <div className="donut-center">
          {hovered ? (
            <>
              <span className="donut-center-label">
                <span className="swatch" style={{ background: ASSET_COLORS[hovered.asset] }} />
                {hovered.asset}
              </span>
              <strong>{formatUsd(hovered.value, 0)}</strong>
              <span className="muted">{formatPercent(hovered.value / total, 1)}</span>
            </>
          ) : (
            <>
              <span className="muted">Total</span>
              <strong>{formatUsd(total, 0)}</strong>
            </>
          )}
        </div>
      </div>

      <ul className="legend">
        {rows.map((r) => (
          <li
            key={r.asset}
            className={r.asset === hoveredAsset ? "active" : ""}
            onMouseEnter={() => setHoveredAsset(r.asset)}
            onMouseLeave={() => setHoveredAsset(null)}
          >
            <span className="swatch" style={{ background: ASSET_COLORS[r.asset] }} />
            <span>{r.asset}</span>
            <span className="legend-value">{formatPercent(r.value / total, 1)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
