import pandas as pd

from frontier.plots import plot_growth

SHOW = ["Equal weight", "Min variance", "Max Sharpe", "Max Sharpe (shrunk)"]

daily = pd.read_csv("results/daily_returns.csv", index_col=0, parse_dates=True)
plot_growth(daily[SHOW], "results/growth.png")
print("Saved results/growth.png")
