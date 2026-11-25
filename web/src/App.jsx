import { useEffect, useState } from "react";
import { getBacktest, getFrontier } from "./api.js";
import { pct } from "./format.js";
import Controls from "./components/Controls.jsx";
import FrontierChart from "./components/FrontierChart.jsx";
import WeightsTable from "./components/WeightsTable.jsx";
import AssetsTable from "./components/AssetsTable.jsx";
import GrowthChart from "./components/GrowthChart.jsx";
import StatsTable from "./components/StatsTable.jsx";
import ChartModal from "./components/ChartModal.jsx";
import Term from "./components/Term.jsx";

const DEFAULTS = {
  tickers: ["SPY", "QQQ", "TLT", "GLD", "VNQ", "EFA"],
  start: "2015-01-01",
  maxWeight: 1,
};

const sameInputs = (a, b) => a && JSON.stringify(a) === JSON.stringify(b);

export default function App() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [expanded, setExpanded] = useState(null);

  const [frontier, setFrontier] = useState(null);
  const [frontierFor, setFrontierFor] = useState(null);
  const [frontierLoading, setFrontierLoading] = useState(false);
  const [frontierError, setFrontierError] = useState("");

  const [backtest, setBacktest] = useState(null);
  const [backtestFor, setBacktestFor] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestError, setBacktestError] = useState("");

  const buildFrontier = async (inputs = settings) => {
    setFrontierLoading(true);
    setFrontierError("");
    try {
      const data = await getFrontier({ tickers: inputs.tickers, start: inputs.start, max_weight: inputs.maxWeight });
      setFrontier(data);
      setFrontierFor(inputs);
    } catch (error) {
      setFrontierError(error.message);
    } finally {
      setFrontierLoading(false);
    }
  };

  const runBacktest = async () => {
    const inputs = { tickers: settings.tickers, start: settings.start };
    setBacktestLoading(true);
    setBacktestError("");
    try {
      setBacktest(await getBacktest(inputs));
      setBacktestFor(inputs);
    } catch (error) {
      setBacktestError(error.message);
    } finally {
      setBacktestLoading(false);
    }
  };

  useEffect(() => {
    buildFrontier(DEFAULTS);
  }, []);

  const frontierStale = frontier && !sameInputs(frontierFor, settings);
  const backtestStale = backtest && !sameInputs(backtestFor, { tickers: settings.tickers, start: settings.start });

  return (
    <>
      <header className="app-header">
        <h1>Frontier Optimizer</h1>
        <p>Pick ETFs, see the efficient frontier, then test the strategies month by month.</p>
      </header>

      <div className="layout">
        <Controls
          settings={settings}
          onChange={setSettings}
          onBuild={() => buildFrontier()}
          loading={frontierLoading}
          error={frontierError}
        />

        <main className="workspace">
          <section className="panel" aria-labelledby="frontier-title">
            <div className="panel-head">
              <h2 id="frontier-title"><Term id="frontier">Efficient frontier</Term></h2>
              {frontier && (
                <p>
                  {frontier.period.start} to {frontier.period.end} · <Term id="riskFree">T-bill rate</Term> {pct(frontier.risk_free)}
                  {frontierStale && " · Settings changed, rebuild to update"}
                </p>
              )}
            </div>
            {!frontier ? (
              <div className="chart-box">
                {frontierLoading ? <div className="skeleton" /> : <div className="empty"><p>{frontierError || "Build a frontier to see it here."}</p></div>}
              </div>
            ) : (
              <div className="frontier-grid">
                <div>
                  <FrontierChart data={frontier} onExpand={() => setExpanded("frontier")} />
                </div>
                <div className="side">
                  <WeightsTable data={frontier} />
                  <AssetsTable data={frontier} />
                </div>
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="backtest-title">
            <div className="panel-head">
              <h2 id="backtest-title"><Term id="walkForward">Walk-forward backtest</Term></h2>
              <p>
                {backtest
                  ? `${backtest.period.start} to ${backtest.period.end} · each month uses only the prior 3 years${backtestStale ? " · Settings changed, run again to update" : ""}`
                  : "Each month, every strategy sees only the prior 3 years, picks weights, and holds them for a month."}
              </p>
            </div>

            {backtest ? (
              <>
                <GrowthChart data={backtest} onExpand={() => setExpanded("growth")} />
                <StatsTable data={backtest} />
              </>
            ) : (
              <div className="chart-box short">
                {backtestLoading ? (
                  <div className="skeleton" />
                ) : (
                  <div className="empty">
                    <div>
                      <p>Runs four strategies on your ETFs. Takes 10 to 30 seconds.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="panel-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={runBacktest}
                disabled={backtestLoading || settings.tickers.length < 2}
              >
                {backtestLoading ? "Running backtest…" : backtest ? "Run backtest again" : "Run backtest"}
              </button>
              {backtestError && (
                <p className="error" role="alert">
                  {backtestError}
                </p>
              )}
            </div>
          </section>
        </main>
      </div>

      {expanded === "frontier" && frontier && (
        <ChartModal
          title="Efficient frontier"
          subtitle={`${frontier.period.start} to ${frontier.period.end} · T-bill rate ${pct(frontier.risk_free)}`}
          onClose={() => setExpanded(null)}
        >
          <FrontierChart data={frontier} height="calc(100% - 96px)" />
        </ChartModal>
      )}
      {expanded === "growth" && backtest && (
        <ChartModal
          title="Growth of $10,000"
          subtitle={`${backtest.period.start} to ${backtest.period.end} · walk-forward backtest`}
          onClose={() => setExpanded(null)}
        >
          <GrowthChart data={backtest} height="calc(100% - 56px)" zoomable />
        </ChartModal>
      )}
    </>
  );
}
