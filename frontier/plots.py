import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import pandas as pd

COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"]
SURFACE, INK, MUTED, GRID = "#fcfcfb", "#0b0b0b", "#898781", "#e1e0d9"


def _style(ax):
    ax.set_facecolor(SURFACE)
    ax.grid(axis="y", color=GRID, linewidth=0.8)
    ax.tick_params(colors=MUTED, labelsize=9)
    for side in ["top", "right", "left"]:
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color("#c3c2b7")


def plot_growth(daily_returns: pd.DataFrame, path: str, start_value: float = 10_000) -> None:
    wealth = start_value * (1 + daily_returns).cumprod()
    drawdown = wealth / wealth.cummax() - 1

    fig, (top, bottom) = plt.subplots(2, 1, figsize=(11, 7.5), sharex=True,
                                      gridspec_kw={"height_ratios": [2.2, 1]}, facecolor=SURFACE)
    for color, name in zip(COLORS, daily_returns.columns):
        top.plot(wealth.index, wealth[name], color=color, linewidth=2, label=name)
        bottom.plot(drawdown.index, drawdown[name], color=color, linewidth=1.5)

    ends = wealth.iloc[-1].sort_values()
    label_y, previous = {}, None
    for name, value in ends.items():
        y = value if previous is None else max(value, previous * 1.06)
        label_y[name], previous = y, y
    for name, value in ends.items():
        top.annotate(f"{name}  ${value:,.0f}", xy=(wealth.index[-1], label_y[name]), xytext=(6, 0),
                     textcoords="offset points", va="center", fontsize=9, color=INK)

    top.set_yscale("log")
    top.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: f"${v:,.0f}"))
    top.yaxis.set_minor_locator(mticker.NullLocator())
    top.set_yticks([10_000, 15_000, 20_000, 30_000, 40_000])
    top.set_title(f"Growth of ${start_value:,.0f} (log scale)", loc="left", fontsize=12, color=INK)
    top.legend(frameon=False, fontsize=9, loc="upper left", labelcolor=INK)

    bottom.yaxis.set_major_formatter(mticker.PercentFormatter(1.0, decimals=0))
    bottom.set_title("Drawdown from previous peak", loc="left", fontsize=12, color=INK)

    for ax in (top, bottom):
        _style(ax)
    fig.tight_layout()
    fig.subplots_adjust(right=0.80)
    fig.savefig(path, dpi=150, facecolor=SURFACE)
    plt.close(fig)


def plot_frontier(mu: pd.Series, cov: pd.DataFrame, frontier: pd.DataFrame,
                  min_var: pd.Series, tangency: pd.Series, path: str,
                  rf: float = 0.0, n_random: int = 5_000) -> None:
    rng = np.random.default_rng(0)
    random_w = rng.dirichlet(np.ones(len(mu)), n_random)
    random_ret = random_w @ mu.values
    random_vol = np.sqrt(np.einsum("ij,jk,ik->i", random_w, cov.values, random_w))

    asset_vol = np.sqrt(np.diag(cov.values))
    mv_ret, mv_vol = float(min_var @ mu), float(np.sqrt(min_var @ cov @ min_var))
    tg_ret, tg_vol = float(tangency @ mu), float(np.sqrt(tangency @ cov @ tangency))

    fig, ax = plt.subplots(figsize=(10, 6.5), facecolor=SURFACE)
    ax.scatter(random_vol, random_ret, s=4, color="#c3c2b7", alpha=0.5, linewidths=0,
               label="Random portfolios")
    ax.plot(frontier["vol"], frontier["return"], color=COLORS[0], linewidth=2.5,
            label="Efficient frontier")
    ax.plot([0, tg_vol * 1.35], [rf, rf + (tg_ret - rf) * 1.35], color=MUTED,
            linewidth=1.2, linestyle="--", label="Capital market line")

    ax.scatter(asset_vol, mu.values, s=40, color=INK, zorder=3)
    for name, x, y in zip(mu.index, asset_vol, mu.values):
        ax.annotate(name, (x, y), xytext=(7, -3), textcoords="offset points", fontsize=9, color=INK)

    for (x, y, color, text) in [(mv_vol, mv_ret, COLORS[1], "Min variance"),
                                (tg_vol, tg_ret, COLORS[2], "Max Sharpe")]:
        ax.scatter([x], [y], s=110, color=color, edgecolors=SURFACE, linewidths=2, zorder=4)
        ax.annotate(f"{text}\n{y:.1%} return, {x:.1%} vol", (x, y), xytext=(-12, 10),
                    textcoords="offset points", ha="right", fontsize=9, color=INK)

    ax.set_xlim(0, asset_vol.max() * 1.12)
    ax.set_ylim(min(0, mu.min()) - 0.01, mu.max() * 1.12)
    ax.xaxis.set_major_formatter(mticker.PercentFormatter(1.0, decimals=0))
    ax.yaxis.set_major_formatter(mticker.PercentFormatter(1.0, decimals=0))
    ax.yaxis.set_major_locator(mticker.MultipleLocator(0.05))
    ax.set_xlabel("Volatility (annualized)", color=MUTED, fontsize=10)
    ax.set_ylabel("Expected return (annualized)", color=MUTED, fontsize=10)
    ax.set_title("Efficient frontier", loc="left", fontsize=12, color=INK)
    ax.legend(frameon=False, fontsize=9, loc="upper left", labelcolor=INK, markerscale=3)
    _style(ax)
    ax.grid(axis="x", color=GRID, linewidth=0.8)
    fig.tight_layout()
    fig.savefig(path, dpi=150, facecolor=SURFACE)
    plt.close(fig)
