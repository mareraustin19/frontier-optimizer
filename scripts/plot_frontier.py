import numpy as np
import pandas as pd

from frontier.data import fetch_prices, to_returns, fetch_risk_free
from frontier.estimators import sample_estimates
from frontier.optimize import efficient_frontier, min_variance, max_sharpe
from frontier.plots import plot_frontier

TICKERS = ["SPY", "QQQ", "TLT", "GLD", "VNQ", "EFA"]

returns = to_returns(fetch_prices(TICKERS, start="2015-01-01"))
rf = fetch_risk_free(returns.index).mean()
mu, cov = sample_estimates(returns)
frontier_df = efficient_frontier(mu, cov, rf=rf)
tangency = max_sharpe(mu, cov, rf=rf)

assets = pd.DataFrame({"vol (x)": np.sqrt(np.diag(cov)), "return (y)": mu}, index=mu.index)
assets["sharpe"] = (assets["return (y)"] - rf) / assets["vol (x)"]

plot_frontier(mu, cov, frontier_df, min_variance(cov), tangency, "results/frontier_rf.png", rf=rf)
print(f"Average risk-free rate: {rf:.2%}\n")
print("Individual ETFs:")
print(assets.sort_values("sharpe", ascending=False).round(3))
print("\nMax Sharpe weights:")
print(tangency.round(3))
