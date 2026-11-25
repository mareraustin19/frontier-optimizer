import pandas as pd
from sklearn.covariance import LedoitWolf

from frontier.data import TRADING_DAYS


def sample_estimates(returns: pd.DataFrame) -> tuple[pd.Series, pd.DataFrame]:
    mu = returns.mean() * TRADING_DAYS
    cov = returns.cov() * TRADING_DAYS
    return mu, cov


def ledoit_wolf_cov(returns: pd.DataFrame) -> pd.DataFrame:
    shrunk = LedoitWolf().fit(returns.values).covariance_ * TRADING_DAYS
    return pd.DataFrame(shrunk, index=returns.columns, columns=returns.columns)


def shrunk_mean(returns: pd.DataFrame, intensity: float = 0.5) -> pd.Series:
    mu = returns.mean() * TRADING_DAYS
    return (1 - intensity) * mu + intensity * mu.mean()