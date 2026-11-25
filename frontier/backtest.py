from typing import Callable

import pandas as pd

Strategy = Callable[[pd.DataFrame], pd.Series]


def walk_forward(returns: pd.DataFrame, strategy: Strategy, lookback: int = 756,
                 cost_bps: float = 10.0) -> pd.DataFrame:
    month_ends = returns.groupby(returns.index.to_period("M")).tail(1).index
    rebalance_dates = [d for d in month_ends if returns.index.get_loc(d) >= lookback]

    daily, turnovers = [], []
    held = pd.Series(0.0, index=returns.columns)

    for start, end in zip(rebalance_dates[:-1], rebalance_dates[1:]):
        window = returns.loc[:start].iloc[-lookback:]
        target = strategy(window).reindex(returns.columns, fill_value=0.0)
        turnover = float((target - held).abs().sum())
        turnovers.append(turnover)

        period = returns.loc[start:end].iloc[1:]
        growth = (1 + period).cumprod()
        value = growth @ target
        period_returns = value.pct_change()
        period_returns.iloc[0] = value.iloc[0] - 1
        period_returns.iloc[0] -= turnover * cost_bps / 10_000
        daily.append(period_returns)

        end_values = growth.iloc[-1] * target
        held = end_values / end_values.sum()

    result = pd.concat(daily).to_frame("return")
    result.attrs["avg_turnover"] = sum(turnovers) / len(turnovers)
    return result
