from frontier.data import fetch_prices, to_returns, annualized_stats

TICKERS = ["SPY", "QQQ", "TLT", "GLD", "VNQ", "EFA"]

prices = fetch_prices(TICKERS, start="2012-01-01")
returns = to_returns(prices)
print(annualized_stats(returns).round(3))
print(returns.corr().round(2))
import pandas as pd
from frontier.estimators import sample_estimates
from frontier.portfolio import portfolio_return, portfolio_vol

mu, cov = sample_estimates(returns)
portfolios = {
    "60/40 SPY/TLT": pd.Series({"SPY": 0.6, "TLT": 0.4}).reindex(TICKERS, fill_value=0.0),
    "Equal weight": pd.Series(1 / len(TICKERS), index=TICKERS),
}
for name, w in portfolios.items():
    print(f"{name}: return {portfolio_return(w, mu):.3f}, vol {portfolio_vol(w, cov):.3f}")
    from frontier.optimize import min_variance, efficient_frontier

frontier_df = efficient_frontier(mu, cov)
best = frontier_df.loc[frontier_df["sharpe"].idxmax()]
print("\nMin variance weights:")
print(min_variance(cov).round(3))
print("\nMax Sharpe portfolio:")
print(best.round(3))