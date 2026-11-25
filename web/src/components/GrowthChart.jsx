import { useState } from "react";
import { Brush, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS, SERIES_COLORS, dollarTicks, dollars } from "../format.js";

function GrowthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="tooltip">
      <strong>{label}</strong>
      {rows.map((row) => (
        <div className="row" key={row.dataKey}>
          <span>
            <span className="swatch" style={{ background: row.color }} />
            {row.dataKey}
          </span>
          <span className="num">{dollars(row.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function GrowthChart({ data, height = 380, onExpand, zoomable = false }) {
  const [range, setRange] = useState({ startIndex: 0, endIndex: data.growth.length - 1 });
  const visible = zoomable ? data.growth.slice(range.startIndex, range.endIndex + 1) : data.growth;

  const values = visible.flatMap((row) => data.strategies.map((s) => row[s]));
  const low = Math.min(...values) * 0.97;
  const high = Math.max(...values) * 1.03;
  const yTicks = dollarTicks(low, high);
  const multiYear = visible[0].date.slice(0, 4) !== visible[visible.length - 1].date.slice(0, 4);
  const xTicks = multiYear
    ? data.growth
        .filter((row, i, rows) => i > 0 && row.date.slice(0, 4) !== rows[i - 1].date.slice(0, 4))
        .map((row) => row.date)
    : undefined;

  return (
    <>
      <div className="chart-toolbar">
        <p className="hint">
          {zoomable ? "Drag the handles under the chart to zoom into a date range." : "Hover to see each strategy's value on that date."}
        </p>
        <div className="toolbar-buttons">
          {zoomable && (
            <button
              type="button"
              className="btn-small"
              onClick={() => setRange({ startIndex: 0, endIndex: data.growth.length - 1 })}
              disabled={range.startIndex === 0 && range.endIndex === data.growth.length - 1}
            >
              Reset
            </button>
          )}
          {onExpand && (
            <button type="button" className="btn-small" onClick={onExpand}>
              Expand
            </button>
          )}
        </div>
      </div>
      <div className="chart-box" style={{ height }} role="img" aria-label="Growth of $10,000 for each strategy over the backtest">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.growth} margin={{ top: 8, right: zoomable ? 64 : 24, bottom: 8, left: 8 }}>
            <CartesianGrid stroke={COLORS.rule} vertical={false} />
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={(d) => (multiYear ? d.slice(0, 4) : d.slice(0, 7))}
              minTickGap={24}
              tick={{ fill: COLORS.ink2, fontSize: 12 }}
              stroke={COLORS.cloud}
            />
            <YAxis
              scale="log"
              domain={[low, high]}
              ticks={yTicks.length >= 2 ? yTicks : undefined}
              tickFormatter={(v) => `$${v % 1000 === 0 ? v / 1000 : (v / 1000).toFixed(1)}k`}
              tick={{ fill: COLORS.ink2, fontSize: 12 }}
              stroke={COLORS.cloud}
              width={56}
              allowDataOverflow
            />
            <Tooltip content={<GrowthTooltip />} isAnimationActive={false} />
            <Legend
              verticalAlign="top"
              iconType="plainline"
              wrapperStyle={{ fontSize: 13, paddingBottom: 8 }}
              formatter={(value) => <span style={{ color: COLORS.ink2 }}>{value}</span>}
            />
            {data.strategies.map((strategy) => (
              <Line
                key={strategy}
                type="monotone"
                dataKey={strategy}
                stroke={SERIES_COLORS[strategy]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.surface }}
                isAnimationActive={false}
              />
            ))}
            {zoomable && (
              <Brush
                dataKey="date"
                height={32}
                stroke={COLORS.ink2}
                fill={COLORS.surface}
                travellerWidth={10}
                startIndex={range.startIndex}
                endIndex={range.endIndex}
                tickFormatter={(d) => d.slice(0, 7)}
                onChange={({ startIndex, endIndex }) => setRange({ startIndex, endIndex })}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
