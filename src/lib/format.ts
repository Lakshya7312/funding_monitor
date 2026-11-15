// Helpers for displaying numbers, times and colours.

// Each asset keeps the same colour in every chart and table.
// The colours are CSS variables defined in index.css (so they change with light/dark mode).
export const ASSET_COLORS: Record<string, string> = {
  BTC: "var(--series-1)",
  ETH: "var(--series-2)",
  SOL: "var(--series-3)",
  HYPE: "var(--series-4)",
  USDT: "var(--series-5)",
};

// 1234.5 -> "$1,234.50"
export function formatUsd(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// 12.3 -> "+$12.30", -12.3 -> "−$12.30". The sign shows gain/loss without relying on colour.
export function formatSignedUsd(value: number): string {
  if (Math.abs(value) < 0.005) return "$0.00"; // rounds to zero
  return (value > 0 ? "+" : "−") + formatUsd(Math.abs(value));
}

// Prices: cheaper assets get more decimals so small moves are visible.
export function formatPrice(price: number): string {
  return formatUsd(price, price >= 1000 ? 2 : 3);
}

// 0.0123 -> "1.23%". With showPlus, positive values get a "+" sign.
export function formatPercent(ratio: number, decimals = 2, showPlus = false): string {
  const text = Math.abs(ratio * 100).toFixed(decimals) + "%";
  if (Number(text.slice(0, -1)) === 0) return text; // no sign on zero
  if (ratio < 0) return "−" + text;
  return showPlus ? "+" + text : text;
}

// Milliseconds -> "HH:MM:SS" (never negative).
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

// Unix ms -> "14:05:00" (or "14:05" without seconds).
export function formatTime(time: number, withSeconds = true): string {
  return new Date(time).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  });
}

// CSS class that colours a value green (gain) or red (loss).
export function gainLossClass(value: number): string {
  if (value > 0.000001) return "gain";
  if (value < -0.000001) return "loss";
  return "";
}
