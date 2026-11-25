async function post(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail) ? detail[0]?.msg : detail;
    throw new Error(message || `Request failed (${response.status}). Is the API running on port 8000?`);
  }
  return data;
}

export const getFrontier = (body) => post("/api/frontier", body);
export const getBacktest = (body) => post("/api/backtest", body);
