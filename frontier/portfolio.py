import numpy as np
import pandas as pd


def portfolio_return(weights: pd.Series, mu: pd.Series) -> float:
    return float(weights @ mu)


def portfolio_vol(weights: pd.Series, cov: pd.DataFrame) -> float:
    return float(np.sqrt(weights @ cov @ weights))