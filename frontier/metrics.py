import pandas as pd

from frontier.data import TRADING_DAYS


def summarize(daily_returns: pd.Series, rf: float = 0.0) -> dict:
    wealth = (1 + daily_returns).cumprod()
    years = len(daily_returns) / TRADING_DAYS
    cagr = wealth.iloc[-1] ** (1 / years) - 1
    vol = daily_returns.std() * TRADING_DAYS ** 0.5
    drawdown = wealth / wealth.cummax() - 1
    return {
        "CAGR": cagr,
        "vol": vol,
        "sharpe": (cagr - rf) / vol,
        "max_drawdown": drawdown.min(),
    }