export const pct = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
export const ratio = (value) => value.toFixed(2);
export const dollars = (value) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const COLORS = {
  ink: "#0b0b0b",
  ink2: "#52514e",
  muted: "#898781",
  rule: "#e1e0d9",
  cloud: "#c3c2b7",
  surface: "#fcfcfb",
};

export const SERIES_COLORS = {
  "Equal weight": "#2a78d6",
  "Min variance": "#eb6834",
  "Max Sharpe": "#1baf7a",
  "Max Sharpe (shrunk)": "#eda100",
};

export const stepFor = (range) =>
  range > 0.2 ? 0.05 : range > 0.08 ? 0.02 : range > 0.04 ? 0.01 : range > 0.02 ? 0.005 : 0.0025;

export function ticksWithin(lo, hi) {
  const step = stepFor(hi - lo);
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Number(v.toFixed(5)));
  return { ticks, digits: step < 0.01 ? 1 : 0 };
}

export function niceAxis(min, max) {
  const step = stepFor(max - min);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(4)));
  return { domain: [lo, hi], ticks };
}

export function dollarTicks(low, high) {
  const candidates = [2500, 5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000, 200000, 300000, 500000];
  return candidates.filter((v) => v >= low && v <= high);
}
