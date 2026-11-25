import pandas as pd

from frontier.experiment import run_scenario

BASE = ["SPY", "QQQ", "TLT", "GLD", "VNQ", "EFA"]
STRATEGIES = ["Equal weight", "Min variance", "Max Sharpe", "Max Sharpe (shrunk)"]

SCENARIOS = {
    "Base, 2013-now": {"tickers": BASE, "start": "2010-01-01"},
    "Base, 2008-now": {"tickers": BASE, "start": "2005-01-01"},
    "Base + XLE, 2013-now": {"tickers": BASE + ["XLE"], "start": "2010-01-01"},
    "Base + LQD, 2013-now": {"tickers": BASE + ["LQD"], "start": "2010-01-01"},
}

sharpe, drawdown = {}, {}
for name, config in SCENARIOS.items():
    table, _, (start, end, avg_rf) = run_scenario(config["tickers"], config["start"], STRATEGIES)
    print(f"\n{name}  ({start} to {end}, avg risk-free {avg_rf:.2%})")
    print(table.round(3))
    sharpe[name], drawdown[name] = table["sharpe"], table["max_drawdown"]

print("\nSharpe ratio by scenario:")
print(pd.DataFrame(sharpe).round(3))
print("\nMax drawdown by scenario:")
print(pd.DataFrame(drawdown).round(3))
