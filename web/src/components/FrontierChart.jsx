import { useRef, useState } from "react";
import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS, niceAxis, pct, ratio, ticksWithin } from "../format.js";
import Term from "./Term.jsx";

const MIN_VAR_COLOR = "#eb6834";
const MAX_SHARPE_COLOR = "#1baf7a";
const FRONTIER_COLOR = "#2a78d6";
const MIN_DRAG_PX = 12;

function PointTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  if (!point.label) return null;
  return (
    <div className="tooltip">
      <strong>{point.label}</strong>
      <div className="row">
        <span>Return</span>
        <span className="num">{pct(point.return)}</span>
      </div>
      <div className="row">
        <span>Volatility</span>
        <span className="num">{pct(point.vol)}</span>
      </div>
      {point.sharpe !== undefined && (
        <div className="row">
          <span>Sharpe</span>
          <span className="num">{ratio(point.sharpe)}</span>
        </div>
      )}
    </div>
  );
}

const hiddenShape = () => null;

function scaleView(view, full, factor) {
  const [x0, x1] = view.x;
  const [y0, y1] = view.y;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const halfX = ((x1 - x0) * factor) / 2;
  const halfY = ((y1 - y0) * factor) / 2;
  if (halfX * 2 >= full.x[1] - full.x[0] && halfY * 2 >= full.y[1] - full.y[0]) return null;
  return {
    x: [Math.max(full.x[0], cx - halfX), Math.min(full.x[1], cx + halfX)],
    y: [Math.max(full.y[0], cy - halfY), Math.min(full.y[1], cy + halfY)],
  };
}

export default function FrontierChart({ data, height = 440, onExpand }) {
  const boxRef = useRef(null);
  const [view, setView] = useState(null);
  const [drag, setDrag] = useState(null);

  const rf = data.risk_free;
  const tangent = data.max_sharpe;
  const maxVol = Math.max(...data.assets.map((a) => a.vol), ...data.random.map((p) => p.vol)) * 1.1;
  const slope = (tangent.return - rf) / tangent.vol;
  const cml = [
    { vol: 0, return: rf },
    { vol: tangent.vol * 1.3, return: rf + slope * tangent.vol * 1.3 },
  ];

  const assets = data.assets.map((a) => ({ ...a, label: a.ticker }));
  const special = [
    { ...data.min_variance, label: "Min variance", color: MIN_VAR_COLOR, labelAt: "bottom" },
    { ...data.max_sharpe, label: "Max Sharpe", color: MAX_SHARPE_COLOR, labelAt: "left" },
  ];

  const yValues = [...data.assets.map((a) => a.return), ...data.random.map((p) => p.return), rf];
  const fullY = niceAxis(Math.min(0, ...yValues), Math.max(...yValues) * 1.05);
  const fullX = niceAxis(0, maxVol);
  const full = { x: fullX.domain, y: fullY.domain };
  const current = view ?? full;
  const xTicks = view ? ticksWithin(...view.x) : { ticks: fullX.ticks, digits: 0 };
  const yTicks = view ? ticksWithin(...view.y) : { ticks: fullY.ticks, digits: 0 };

  const plotArea = () => {
    const grid = boxRef.current?.querySelector(".recharts-cartesian-grid");
    if (!grid) return null;
    const box = boxRef.current.getBoundingClientRect();
    const plot = grid.getBoundingClientRect();
    return { left: plot.left - box.left, top: plot.top - box.top, width: plot.width, height: plot.height };
  };

  const localPoint = (event) => {
    const box = boxRef.current.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    const area = plotArea();
    const point = localPoint(event);
    if (!area || point.x < area.left || point.x > area.left + area.width || point.y < area.top || point.y > area.top + area.height) return;
    setDrag({ start: point, end: point, area });
  };

  const onPointerMove = (event) => {
    if (!drag) return;
    const point = localPoint(event);
    const { area } = drag;
    setDrag({
      ...drag,
      end: {
        x: Math.min(Math.max(point.x, area.left), area.left + area.width),
        y: Math.min(Math.max(point.y, area.top), area.top + area.height),
      },
    });
  };

  const onPointerUp = () => {
    if (!drag) return;
    const { start, end, area } = drag;
    setDrag(null);
    if (Math.abs(end.x - start.x) < MIN_DRAG_PX || Math.abs(end.y - start.y) < MIN_DRAG_PX) return;
    const toX = (px) => current.x[0] + ((px - area.left) / area.width) * (current.x[1] - current.x[0]);
    const toY = (py) => current.y[1] - ((py - area.top) / area.height) * (current.y[1] - current.y[0]);
    setView({
      x: [toX(Math.min(start.x, end.x)), toX(Math.max(start.x, end.x))],
      y: [toY(Math.max(start.y, end.y)), toY(Math.min(start.y, end.y))],
    });
  };

  const selection = drag && {
    left: Math.min(drag.start.x, drag.end.x),
    top: Math.min(drag.start.y, drag.end.y),
    width: Math.abs(drag.end.x - drag.start.x),
    height: Math.abs(drag.end.y - drag.start.y),
  };

  return (
    <>
      <div className="chart-toolbar">
        <p className="hint">Drag across the chart to zoom into an area.</p>
        <div className="toolbar-buttons">
          <button type="button" className="btn-small" onClick={() => setView(scaleView(current, full, 0.5))}>
            Zoom in
          </button>
          <button type="button" className="btn-small" onClick={() => setView(view && scaleView(view, full, 2))} disabled={!view}>
            Zoom out
          </button>
          <button type="button" className="btn-small" onClick={() => setView(null)} disabled={!view}>
            Reset
          </button>
          {onExpand && (
            <button type="button" className="btn-small" onClick={onExpand}>
              Expand
            </button>
          )}
        </div>
      </div>

      <div
        ref={boxRef}
        className="chart-box zoomable"
        style={{ height }}
        role="img"
        aria-label="Efficient frontier chart: volatility on the x-axis, expected return on the y-axis"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 32, bottom: 32, left: 8 }}>
            <CartesianGrid stroke={COLORS.rule} />
            <XAxis
              type="number"
              dataKey="vol"
              domain={current.x}
              ticks={xTicks.ticks}
              allowDataOverflow
              tickFormatter={(v) => pct(v, xTicks.digits)}
              tick={{ fill: COLORS.ink2, fontSize: 12 }}
              stroke={COLORS.cloud}
              label={{ value: "Volatility (annualized)", position: "bottom", offset: 12, fill: COLORS.ink2, fontSize: 13 }}
            />
            <YAxis
              type="number"
              dataKey="return"
              domain={current.y}
              ticks={yTicks.ticks}
              allowDataOverflow
              tickFormatter={(v) => pct(v, yTicks.digits)}
              tick={{ fill: COLORS.ink2, fontSize: 12 }}
              stroke={COLORS.cloud}
              width={56}
              label={{ value: "Expected return", angle: -90, position: "insideLeft", offset: 4, fill: COLORS.ink2, fontSize: 13, dy: 50 }}
            />
            <Tooltip content={<PointTooltip />} cursor={false} isAnimationActive={false} />

            <Scatter name="Random portfolios" data={data.random} fill={COLORS.cloud} fillOpacity={0.45} r={2} isAnimationActive={false} shape="circle" legendType="none" />
            <Scatter
              name="Capital market line"
              data={cml}
              line={{ stroke: COLORS.muted, strokeWidth: 1.5, strokeDasharray: "6 4" }}
              shape={hiddenShape}
              isAnimationActive={false}
            />
            <Scatter
              name="Efficient frontier"
              data={data.frontier}
              line={{ stroke: FRONTIER_COLOR, strokeWidth: 2.5 }}
              lineType="joint"
              shape={hiddenShape}
              isAnimationActive={false}
            />
            <Scatter name="ETFs" data={assets} fill={COLORS.ink} isAnimationActive={false}>
              <LabelList dataKey="ticker" position="right" offset={8} fill={COLORS.ink} fontSize={12} fontFamily="IBM Plex Mono" />
            </Scatter>
            {special.map((point) => (
              <Scatter
                key={point.label}
                name={point.label}
                data={[point]}
                fill={point.color}
                shape={(props) => <circle cx={props.cx} cy={props.cy} r={8} fill={point.color} stroke={COLORS.surface} strokeWidth={2} />}
                isAnimationActive={false}
              >
                <LabelList dataKey="label" position={point.labelAt} offset={14} fill={COLORS.ink} fontSize={13} fontWeight={600} />
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        {selection && <div className="zoom-selection" style={selection} />}
      </div>

      <ul className="legend">
        <li><span className="legend-line" style={{ background: FRONTIER_COLOR }} /><Term id="frontier">Efficient frontier</Term></li>
        <li><span className="legend-line dashed" /><Term id="cml">Capital market line</Term> (starts at the T-bill rate)</li>
        <li><span className="legend-dot" style={{ background: COLORS.cloud }} /><Term id="random">1,500 random portfolios</Term></li>
        <li><span className="legend-dot" style={{ background: COLORS.ink }} /><Term id="singleEtf">Single ETF</Term></li>
      </ul>
    </>
  );
}
