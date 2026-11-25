import pandas as pd
import yfinance as yf

TRADING_DAYS = 252


def fetch_prices(tickers: list[str], start: str, end: str | None = None) -> pd.DataFrame:
    raw = yf.download(tickers, start=start, end=end, auto_adjust=True, progress=False)
    prices = raw["Close"]
    if isinstance(prices, pd.Series):
        prices = prices.to_frame(tickers[0])
    prices = prices[tickers].dropna(how="all")
    first_dates = prices.apply(lambda s: s.first_valid_index())
    latest = first_dates.max()
    if latest > prices.index[0]:
        print(f"Note: {first_dates.idxmax()} starts {latest.date()}; trimming all assets to that date.")
    return prices.loc[latest:].dropna()


def to_returns(prices: pd.DataFrame) -> pd.DataFrame:
    return prices.pct_change().dropna()


def annualized_stats(returns: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame({
        "ann_return": returns.mean() * TRADING_DAYS,
        "ann_vol": returns.std() * TRADING_DAYS ** 0.5,
    })

def fetch_risk_free(index: pd.DatetimeIndex) -> pd.Series:
    raw = yf.download("^IRX", start=index[0], auto_adjust=True, progress=False)["Close"]
    rate = raw.squeeze() / 100
    return rate.reindex(index).ffill().bfill()
