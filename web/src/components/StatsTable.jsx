import { SERIES_COLORS, dollars, pct, ratio } from "../format.js";
import Term from "./Term.jsx";

const STRATEGY_TERMS = {
  "Equal weight": "equalWeight",
  "Min variance": "minVariance",
  "Max Sharpe": "maxSharpe",
  "Max Sharpe (shrunk)": "maxSharpeShrunk",
};

export default function StatsTable({ data }) {
  const best = Math.max(...data.stats.map((s) => s.sharpe));
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Strategy</th>
            <th scope="col"><Term id="finalValue">$10k became</Term></th>
            <th scope="col"><Term id="cagr">Return / yr</Term></th>
            <th scope="col"><Term id="volatility">Volatility</Term></th>
            <th scope="col"><Term id="sharpe">Sharpe</Term></th>
            <th scope="col"><Term id="drawdown">Worst drop</Term></th>
            <th scope="col"><Term id="turnover">Traded / month</Term></th>
          </tr>
        </thead>
        <tbody>
          {data.stats.map((row) => (
            <tr key={row.strategy}>
              <td>
                <span className="swatch" style={{ background: SERIES_COLORS[row.strategy] }} />
                <Term id={STRATEGY_TERMS[row.strategy]}>{row.strategy}</Term>
                {row.sharpe === best && <span className="tag">Best Sharpe</span>}
              </td>
              <td className="num">{dollars(row.final_value)}</td>
              <td className="num">{pct(row.cagr)}</td>
              <td className="num">{pct(row.vol)}</td>
              <td className="num">{ratio(row.sharpe)}</td>
              <td className="num">{pct(row.max_drawdown)}</td>
              <td className="num">{pct(row.turnover, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
