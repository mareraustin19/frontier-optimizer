from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request as HttpRequest
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from frontier.data import TRADING_DAYS, fetch_prices, fetch_risk_free, to_returns
from frontier.estimators import sample_estimates
from frontier.experiment import run_scenario
from frontier.optimize import efficient_frontier, max_sharpe, min_variance
from frontier.portfolio import portfolio_return, portfolio_vol

LOOKBACK_DAYS = 756
MIN_BACKTEST_DAYS = LOOKBACK_DAYS + 126

app = FastAPI(title="Frontier Optimizer API")


@app.exception_handler(ValueError)
async def value_error_handler(request: HttpRequest, error: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(error)})


class Request(BaseModel):
    tickers: list[str] = Field(min_length=2, max_length=12)
    start: str = "2015-01-01"

    @field_validator("tickers")
    @classmethod
    def clean_tickers(cls, tickers: list[str]) -> list[str]:
        cleaned = list(dict.fromkeys(t.strip().upper() for t in tickers if t.strip()))
        if len(cleaned) < 2:
            raise ValueError("Enter at least two different tickers.")
        return cleaned


class FrontierRequest(Request):
    max_weight: float = Field(1.0, gt=0, le=1)


def load_returns(tickers: list[str], start: str) -> pd.DataFrame:
    try:
        return to_returns(fetch_prices(tickers, start=start))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


def describe(weights: pd.Series, mu: pd.Series, cov: pd.DataFrame, rf: float) -> dict:
    ret, vol = portfolio_return(weights, mu), portfolio_vol(weights, cov)
    return {
        "return": ret,
        "vol": vol,
        "sharpe": (ret - rf) / vol,
        "weights": {ticker: round(float(w), 4) for ticker, w in weights.items()},
    }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/frontier")
def frontier(request: FrontierRequest) -> dict:
    if request.max_weight * len(request.tickers) < 1:
        raise HTTPException(
            status_code=400,
            detail=f"A {request.max_weight:.0%} cap across {len(request.tickers)} tickers can't add up to 100%. "
                   f"Raise the cap or add tickers.",
        )

    returns = load_returns(request.tickers, request.start)
    rf = float(fetch_risk_free(returns.index).mean())
    mu, cov = sample_estimates(returns)

    curve = efficient_frontier(mu, cov, n_points=60, max_weight=request.max_weight, rf=rf)
    min_var = min_variance(cov, request.max_weight)
    tangency = max_sharpe(mu, cov, rf=rf, max_weight=request.max_weight)

    rng = np.random.default_rng(0)
    random_w = rng.dirichlet(np.ones(len(mu)), 1500)
    random_points = [
        {"vol": float(np.sqrt(w @ cov.values @ w)), "return": float(w @ mu.values)} for w in random_w
    ]

    asset_vol = np.sqrt(np.diag(cov.values))
    return {
        "period": {"start": str(returns.index[0].date()), "end": str(returns.index[-1].date())},
        "risk_free": rf,
        "assets": [
            {"ticker": t, "vol": float(v), "return": float(r), "sharpe": float((r - rf) / v)}
            for t, v, r in zip(mu.index, asset_vol, mu.values)
        ],
        "frontier": [{"vol": float(v), "return": float(r)} for v, r in zip(curve["vol"], curve["return"])],
        "random": random_points,
        "min_variance": describe(min_var, mu, cov, rf),
        "max_sharpe": describe(tangency, mu, cov, rf),
        "correlation": returns.corr().round(2).to_dict(),
    }


@app.post("/api/backtest")
def backtest(request: Request) -> dict:
    returns = load_returns(request.tickers, request.start)
    if len(returns) < MIN_BACKTEST_DAYS:
        years = MIN_BACKTEST_DAYS / TRADING_DAYS
        raise HTTPException(
            status_code=400,
            detail=f"The backtest needs about {years:.1f} years of shared history. "
                   f"Pick an earlier start date or drop the newest ticker.",
        )

    strategies = ["Equal weight", "Min variance", "Max Sharpe", "Max Sharpe (shrunk)"]
    table, daily, (start, end, avg_rf) = run_scenario(request.tickers, request.start, strategies)

    wealth = 10_000 * (1 + daily).cumprod()
    weekly = wealth.groupby(wealth.index.to_period("W-FRI")).tail(1)
    growth = [
        {"date": str(date.date()), **{name: round(float(value), 2) for name, value in row.items()}}
        for date, row in weekly.iterrows()
    ]

    return {
        "period": {"start": str(start), "end": str(end)},
        "risk_free": float(avg_rf),
        "strategies": strategies,
        "stats": [
            {
                "strategy": name,
                "cagr": float(row["CAGR"]),
                "vol": float(row["vol"]),
                "sharpe": float(row["sharpe"]),
                "max_drawdown": float(row["max_drawdown"]),
                "turnover": float(row["avg_turnover"]),
                "final_value": float(wealth[name].iloc[-1]),
            }
            for name, row in table.iterrows()
        ],
        "growth": growth,
    }


# In production, serve the built React app from the same server as the API.
WEB_DIST = Path(__file__).resolve().parent.parent / "web" / "dist"
if WEB_DIST.exists():
    app.mount("/", StaticFiles(directory=WEB_DIST, html=True), name="web")
