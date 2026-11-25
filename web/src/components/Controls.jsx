import { useState } from "react";
import Term from "./Term.jsx";

export default function Controls({ settings, onChange, onBuild, loading, error }) {
  const [draft, setDraft] = useState("");
  const { tickers, start, maxWeight } = settings;

  const addTickers = () => {
    const incoming = draft
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    const next = [...new Set([...tickers, ...incoming])].slice(0, 12);
    onChange({ ...settings, tickers: next });
    setDraft("");
  };

  const removeTicker = (ticker) =>
    onChange({ ...settings, tickers: tickers.filter((t) => t !== ticker) });

  const capTooLow = maxWeight * tickers.length < 1;

  return (
    <form
      className="controls"
      onSubmit={(event) => {
        event.preventDefault();
        onBuild();
      }}
    >
      <div className="field">
        <span className="label" id="tickers-label">
          ETFs ({tickers.length} of 12)
        </span>
        <div className="chips" aria-labelledby="tickers-label">
          {tickers.map((ticker) => (
            <span className="chip" key={ticker}>
              {ticker}
              <button type="button" aria-label={`Remove ${ticker}`} onClick={() => removeTicker(ticker)}>
                ×
              </button>
            </span>
          ))}
        </div>
        <label htmlFor="ticker-input" className="hint">
          Add a ticker (Yahoo Finance symbol)
        </label>
        <div className="add-row">
          <input
            id="ticker-input"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (draft.trim()) addTickers();
              }
            }}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addTickers}
            disabled={!draft.trim() || tickers.length >= 12}
          >
            Add
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="start-date">Data starts</label>
        <input
          id="start-date"
          type="date"
          value={start}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) => onChange({ ...settings, start: event.target.value })}
        />
        <p className="hint">The frontier uses every day from here to today.</p>
      </div>

      <div className="field">
        <label htmlFor="max-weight">
          <Term id="maxWeight">Max weight per ETF</Term>: <span className="num">{Math.round(maxWeight * 100)}%</span>
        </label>
        <input
          id="max-weight"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={maxWeight}
          onChange={(event) => onChange({ ...settings, maxWeight: Number(event.target.value) })}
        />
        {capTooLow && (
          <p className="hint">
            With {tickers.length} ETFs the cap needs to be at least {Math.ceil(100 / tickers.length)}%.
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading || tickers.length < 2 || capTooLow}>
        {loading ? "Building…" : "Build frontier"}
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
