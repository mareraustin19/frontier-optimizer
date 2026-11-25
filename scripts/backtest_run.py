from frontier.experiment import run_scenario

TICKERS = ["SPY", "QQQ", "TLT", "GLD", "VNQ", "EFA"]

table, daily, (start, end, avg_rf) = run_scenario(TICKERS, start="2010-01-01")

print(f"Backtest: {start} to {end}")
print(f"Average risk-free rate: {avg_rf:.2%}")
print(table.round(3))

daily.to_csv("results/daily_returns.csv")
print("Saved results/daily_returns.csv")
