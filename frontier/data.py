from datetime import date

import pandas as pd
import yfinance as yf

TRADING_DAYS = 252


_PRICE_CACHE: dict[tuple, pd.DataFrame] = {}


def download_close(tickers: list[str], start, end=None) -> pd.DataFrame:
    """Download closing prices, reusing any successful download from earlier today."""
    key = (tuple(tickers), str(start)[:10], end, date.today())
    if key not in _PRICE_CACHE:
        raw = yf.download(list(tickers), start=key[1], end=end, auto_adjust=True, progress=False)
        if raw.empty:
            return pd.DataFrame(columns=list(tickers), dtype=float)
        close = raw["Close"]
        close = close.to_frame(tickers[0]) if isinstance(close, pd.Series) else close
        if close.empty or close.isna().all().any():
            return close  # don't cache failed or partial downloads
        _PRICE_CACHE[key] = close
    return _PRICE_CACHE[key].copy()


def fetch_prices(tickers: list[str], start: str, end: str | None = None) -> pd.DataFrame:
    prices = download_close(tickers, start, end)
    missing = [t for t in tickers if t not in prices.columns or prices[t].isna().all()]
    if missing:
        raise ValueError(f"No price data found for: {', '.join(missing)}")
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
    rate = download_close(["^IRX"], index[0])["^IRX"].dropna() / 100
    if rate.empty:
        raise ValueError("Couldn't load T-bill rates from Yahoo Finance. Try again in a minute.")
    return rate.reindex(index).ffill().bfill()
