// Line chart of total account equity over time (one point per update).
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EquityPoint } from "../types";
import { formatSignedUsd, formatTime, formatUsd } from "../lib/format";

type Props = {
  history: EquityPoint[];
  startingBalance: number;
  onReset: () => void;
};

export function EquityChart({ history, startingBalance, onReset }: Props) {
  const change = history.length > 1 ? history[history.length - 1].equity - history[0].equity : 0;

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Total account equity</h2>
          <p className="panel-note">
            One point per minute · {history.length} {history.length === 1 ? "point" : "points"}
            {history.length > 1 && ` · ${formatSignedUsd(change)} since first point`}
          </p>
        </div>
        <button className="button" onClick={onReset} disabled={history.length <= 1}>
          Reset history
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={history} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          {/* X axis: time. type="number" spaces points by their real time. */}
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(time) => formatTime(time, false)}
            stroke="var(--text-muted)"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          {/* Y axis: equity. "auto" lets Recharts pick round tick values around the data. */}
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) => formatUsd(value, 0)}
            stroke="var(--text-muted)"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={88}
          />
          {/* Dashed line at the starting balance (hidden if it's outside the visible range). */}
          <ReferenceLine
            y={startingBalance}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            ifOverflow="hidden"
            label={{ value: "Starting balance", position: "insideTopLeft", fill: "var(--text-muted)", fontSize: 11 }}
          />
          <Tooltip
            labelFormatter={(time) => formatTime(Number(time))}
            formatter={(value) => [formatUsd(Number(value)), "Equity"]}
            contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 8 }}
          />
          <Line
            dataKey="equity"
            type="monotone"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={history.length < 30} // show dots only while there are few points
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
