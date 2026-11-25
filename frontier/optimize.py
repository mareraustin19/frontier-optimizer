import cvxpy as cp
import numpy as np
import pandas as pd

from frontier.portfolio import portfolio_return, portfolio_vol


def _base_constraints(w: cp.Variable, max_weight: float) -> list:
    return [cp.sum(w) == 1, w >= 0, w <= max_weight]


def _to_series(w: cp.Variable, index: pd.Index) -> pd.Series:
    weights = np.clip(w.value, 0, None)
    return pd.Series(weights / weights.sum(), index=index)


def min_variance(cov: pd.DataFrame, max_weight: float = 1.0) -> pd.Series:
    w = cp.Variable(len(cov))
    risk = cp.quad_form(w, cp.psd_wrap(cov.values))
    cp.Problem(cp.Minimize(risk), _base_constraints(w, max_weight)).solve()
    return _to_series(w, cov.index)


def max_return(mu: pd.Series, max_weight: float = 1.0) -> pd.Series:
    w = cp.Variable(len(mu))
    cp.Problem(cp.Maximize(mu.values @ w), _base_constraints(w, max_weight)).solve()
    return _to_series(w, mu.index)


def min_variance_for_target(mu: pd.Series, cov: pd.DataFrame, target: float, max_weight: float = 1.0) -> pd.Series:
    w = cp.Variable(len(mu))
    risk = cp.quad_form(w, cp.psd_wrap(cov.values))
    constraints = _base_constraints(w, max_weight) + [mu.values @ w == target]
    cp.Problem(cp.Minimize(risk), constraints).solve()
    return _to_series(w, mu.index)


def efficient_frontier(mu: pd.Series, cov: pd.DataFrame, n_points: int = 100,
                       max_weight: float = 1.0, rf: float = 0.0) -> pd.DataFrame:
    low = portfolio_return(min_variance(cov, max_weight), mu)
    high = portfolio_return(max_return(mu, max_weight), mu)
    rows = []
    for target in np.linspace(low, high, n_points):
        w = min_variance_for_target(mu, cov, target, max_weight)
        ret, vol = portfolio_return(w, mu), portfolio_vol(w, cov)
        rows.append({"return": ret, "vol": vol, "sharpe": (ret - rf) / vol, **w.to_dict()})
    return pd.DataFrame(rows)


def max_sharpe(mu: pd.Series, cov: pd.DataFrame, rf: float = 0.0, max_weight: float = 1.0) -> pd.Series:
    excess = mu.values - rf
    if (excess <= 0).all():
        return min_variance(cov, max_weight)
    y = cp.Variable(len(mu))
    risk = cp.quad_form(y, cp.psd_wrap(cov.values))
    constraints = [excess @ y == 1, y >= 0, y <= max_weight * cp.sum(y)]
    cp.Problem(cp.Minimize(risk), constraints).solve(solver=cp.CLARABEL)
    return _to_series(y, mu.index)