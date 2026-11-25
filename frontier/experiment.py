import pandas as pd

from frontier.backtest import walk_forward
from frontier.data import fetch_prices, to_returns, fetch_risk_free
from frontier.metrics import summarize
from frontier.strategies import make_strategies


def run_scenario(tickers: list[str], start: str, strategy_names: list[str] | None = None):
    returns = to_returns(fetch_prices(tickers, start=start))
    rf = fetch_risk_free(returns.index)
    strategies = make_strategies(rf)
    if strategy_names:
        strategies = {name: strategies[name] for name in strategy_names}

    rows, daily = {}, {}
    for name, strategy in strategies.items():
        result = walk_forward(returns, strategy)
        stats = summarize(result["return"], rf=rf.loc[result.index].mean())
        stats["avg_turnover"] = result.attrs["avg_turnover"]
        rows[name] = stats
        daily[name] = result["return"]

    period = (result.index[0].date(), result.index[-1].date(), rf.loc[result.index].mean())
    return pd.DataFrame(rows).T, pd.DataFrame(daily), period
