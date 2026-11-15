// Title bar: last update time, countdown to the next update, errors, and the "Update now" button.
import { formatCountdown, formatTime } from "../lib/format";

type Props = {
  lastUpdated: number | undefined;
  nextUpdateAt: number;
  isUpdating: boolean;
  error: string | null;
  now: number;
  onUpdateNow: () => void;
};

export function Header({ lastUpdated, nextUpdateAt, isUpdating, error, now, onUpdateNow }: Props) {
  return (
    <header className="topbar">
      <h1>Delta-Neutral Funding Arbitrage Monitor</h1>

      <div className="status">
        <span className="muted">
          {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Waiting for first update"}
          {" · next in "}
          {/* slice(3) turns "00:00:42" into "00:42" */}
          <span className="mono">{formatCountdown(nextUpdateAt - now).slice(3)}</span>
        </span>

        {error && <span className="status-error">Update failed, showing last data ({error})</span>}

        <button className="button button-refresh" onClick={onUpdateNow} disabled={isUpdating}>
          <span className={isUpdating ? "spinning" : ""}>↻</span>
          {isUpdating ? "Updating…" : "Update now"}
        </button>
      </div>
    </header>
  );
}
