import pandas as pd

from frontier.estimators import sample_estimates, ledoit_wolf_cov, shrunk_mean
from frontier.optimize import min_variance, max_sharpe


def make_strategies(rf: pd.Series) -> dict:
    def rf_at(window):
        return rf.loc[window.index[-1]]

    return {
        "Equal weight": lambda w: pd.Series(1 / w.shape[1], index=w.columns),
        "Min variance": lambda w: min_variance(sample_estimates(w)[1]),
        "Min variance (LW)": lambda w: min_variance(ledoit_wolf_cov(w)),
        "Max Sharpe": lambda w: max_sharpe(*sample_estimates(w), rf=rf_at(w)),
        "Max Sharpe (shrunk)": lambda w: max_sharpe(shrunk_mean(w), ledoit_wolf_cov(w), rf=rf_at(w)),
        "Max Sharpe (shrunk, 35% cap)": lambda w: max_sharpe(shrunk_mean(w), ledoit_wolf_cov(w), rf=rf_at(w), max_weight=0.35),
    }
