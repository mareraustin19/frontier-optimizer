import { pct } from "../format.js";
import Term from "./Term.jsx";

const MIN_VAR_COLOR = "#eb6834";
const MAX_SHARPE_COLOR = "#1baf7a";

function Bar({ value, color }) {
  return (
    <div className="bar-cell">
      <div className="bar-track" aria-hidden="true">
        <div className="bar-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="num">{pct(value, 0)}</span>
    </div>
  );
}

export default function WeightsTable({ data }) {
  const tickers = Object.keys(data.max_sharpe.weights).sort(
    (a, b) => data.max_sharpe.weights[b] - data.max_sharpe.weights[a] || data.min_variance.weights[b] - data.min_variance.weights[a]
  );

  return (
    <div>
      <h3><Term id="weights">Portfolio weights</Term></h3>
      <table>
        <thead>
          <tr>
            <th scope="col">ETF</th>
            <th scope="col">
              <span className="swatch" style={{ background: MIN_VAR_COLOR }} />
              <Term id="minVariance">Min variance</Term>
            </th>
            <th scope="col">
              <span className="swatch" style={{ background: MAX_SHARPE_COLOR }} />
              <Term id="maxSharpe">Max Sharpe</Term>
            </th>
          </tr>
        </thead>
        <tbody>
          {tickers.map((ticker) => (
            <tr className="weight-row" key={ticker}>
              <td className="num">{ticker}</td>
              <td>
                <Bar value={data.min_variance.weights[ticker]} color={MIN_VAR_COLOR} />
              </td>
              <td>
                <Bar value={data.max_sharpe.weights[ticker]} color={MAX_SHARPE_COLOR} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Return / vol</td>
            <td className="num">
              {pct(data.min_variance.return)} / {pct(data.min_variance.vol)}
            </td>
            <td className="num">
              {pct(data.max_sharpe.return)} / {pct(data.max_sharpe.vol)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
