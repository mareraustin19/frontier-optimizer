export const GLOSSARY = {
  sharpe: {
    term: "Sharpe ratio",
    definition: "Return earned above the T-bill rate, divided by volatility.",
    meaning: "How much reward you got for each unit of risk. Higher is better. It's the fairest way to compare portfolios that take different amounts of risk.",
  },
  volatility: {
    term: "Volatility",
    definition: "How much returns swing around their average over a year (the standard deviation).",
    meaning: "About 2 years in 3 land within one volatility of the average. 20% means a typical year lands within 20 points either side.",
  },
  expectedReturn: {
    term: "Expected return",
    definition: "The average yearly return over the data period you picked.",
    meaning: "The optimizer treats this past average as its forecast for the future. That's its biggest weakness, since past returns are a noisy guide.",
  },
  cagr: {
    term: "Return per year (CAGR)",
    definition: "The steady yearly growth rate that turns $10,000 into the final value.",
    meaning: "What the strategy actually earned in the test, after trading costs.",
  },
  finalValue: {
    term: "$10k became",
    definition: "What $10,000 grew to by the end of the test, after trading costs.",
    meaning: "The simplest way to compare strategies, but it ignores how bumpy the ride was. Check volatility and worst drop too.",
  },
  frontier: {
    term: "Efficient frontier",
    definition: "The best return you can get at each level of risk by mixing your ETFs.",
    meaning: "Every portfolio below the curve is beaten by one on the curve with the same risk and more return.",
  },
  cml: {
    term: "Capital market line",
    definition: "A line starting at the T-bill rate that just touches the frontier.",
    meaning: "The touch point is the max Sharpe portfolio. Mixing that portfolio with T-bills lets you land anywhere on the line.",
  },
  random: {
    term: "Random portfolios",
    definition: "1,500 randomly mixed portfolios of your ETFs.",
    meaning: "Shows the full range of mixes you could hold. None of them get above the frontier.",
  },
  singleEtf: {
    term: "Single ETF",
    definition: "One ETF held on its own, with 100% of the money in it.",
    meaning: "Mixes that sit to the left of these dots are less risky than any single ETF. That's diversification.",
  },
  minVariance: {
    term: "Min variance",
    definition: "The mix with the smallest swings possible. It never looks at returns.",
    meaning: "The steadiest ride, but it will pile into a calm asset even if that asset earns almost nothing.",
  },
  maxSharpe: {
    term: "Max Sharpe",
    definition: "The mix with the most return per unit of risk, using past average returns as its forecast.",
    meaning: "The textbook answer. It trusts past returns too much, so it often makes big, concentrated bets that don't hold up.",
  },
  maxSharpeShrunk: {
    term: "Max Sharpe (shrunk)",
    definition: "Max Sharpe after pulling every ETF's expected return halfway toward the group average.",
    meaning: "The same idea with less confidence in its guesses. It makes smaller, steadier bets and scored best in testing.",
  },
  equalWeight: {
    term: "Equal weight",
    definition: "The same amount in every ETF, rebalanced back to equal each month.",
    meaning: "No forecasting at all. It's the benchmark every smarter strategy has to beat.",
  },
  riskFree: {
    term: "T-bill rate",
    definition: "The average yield on 13-week US Treasury bills over the period. It's what you could earn with no risk.",
    meaning: "Sharpe only counts return above this rate, and the capital market line starts here.",
  },
  maxWeight: {
    term: "Max weight per ETF",
    definition: "The largest share of the portfolio any single ETF can take.",
    meaning: "A lower cap forces the optimizer to spread money out instead of going all-in on one or two ETFs.",
  },
  weights: {
    term: "Portfolio weights",
    definition: "How each portfolio splits its money across your ETFs.",
    meaning: "Compare the two columns to see what the optimizer favours when it chases return versus when it only avoids risk.",
  },
  walkForward: {
    term: "Walk-forward backtest",
    definition: "A test where, each month, a strategy only sees the past 3 years, picks weights, and holds them for one month.",
    meaning: "It stops a strategy from looking good just because it studied the answers in advance.",
  },
  drawdown: {
    term: "Worst drop (max drawdown)",
    definition: "The biggest fall from a peak to a later low during the test.",
    meaning: "-30% means that at the worst point you'd have watched almost a third of your money disappear.",
  },
  turnover: {
    term: "Traded per month (turnover)",
    definition: "How much of the portfolio gets bought or sold at each monthly rebalance.",
    meaning: "Higher means more trading costs. Each trade in this test is charged 0.10%.",
  },
};
