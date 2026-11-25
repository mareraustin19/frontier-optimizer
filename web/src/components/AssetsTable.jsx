import { pct, ratio } from "../format.js";
import Term from "./Term.jsx";

export default function AssetsTable({ data }) {
  const assets = [...data.assets].sort((a, b) => b.sharpe - a.sharpe);
  return (
    <div>
      <h3><Term id="singleEtf">Each ETF on its own</Term></h3>
      <table>
        <thead>
          <tr>
            <th scope="col">ETF</th>
            <th scope="col"><Term id="expectedReturn">Return</Term></th>
            <th scope="col"><Term id="volatility">Volatility</Term></th>
            <th scope="col"><Term id="sharpe">Sharpe</Term></th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.ticker}>
              <td className="num">{asset.ticker}</td>
              <td className="num">{pct(asset.return)}</td>
              <td className="num">{pct(asset.vol)}</td>
              <td className="num">{ratio(asset.sharpe)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
