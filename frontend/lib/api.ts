export type Mode = "demo" | "live" | "model";

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionResult {
  mode: Mode;
  timestamp: string;
  instrument: string;
  timeframe: string;
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  models: Record<string, {
    prediction: string;
    probability: number;
    confidence: number;
    metadata?: Record<string, unknown>;
    weights?: Record<string, number>;
  }>;
  model_disagreement: number;
  risk: {
    score: number;
    volatility: number;
    prediction_uncertainty: number;
    model_disagreement: number;
    description: string;
  };
  features: Record<string, number>;
  indicators: Record<string, number>;
  shap: Array<{
    feature: string;
    value: number;
    shap_value: number;
    direction: string;
    importance: number;
  }>;
}

export interface HealthResult {
  status: string;
  service: string;
  version: string;
  mode: Mode;
  model_artifacts_loaded: boolean;
  xgboost_package: boolean;
  yahoo_data_package: boolean;
  database: boolean;
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthResult>("/health"),
  models: () => request<any>("/models"),
  quantum: () => request<any>("/quantum"),
  market: (instrument = "GC=F", timeframe = "1d", limit = 120) =>
    request<{ mode: Mode; instrument: string; timeframe: string; data: Candle[] }>(`/market?instrument=${encodeURIComponent(instrument)}&timeframe=${encodeURIComponent(timeframe)}&limit=${limit}`),
  indicators: (instrument = "GC=F", timeframe = "1d") =>
    request<any>(`/indicators?instrument=${encodeURIComponent(instrument)}&timeframe=${encodeURIComponent(timeframe)}`),
  performance: () => request<any>("/performance"),
  predict: (payload: { instrument: string; timeframe: string; timestamp?: string; features?: Record<string, number> }) =>
    request<PredictionResult>("/predict", { method: "POST", body: JSON.stringify(payload) }),
  explain: (payload: { instrument: string; timeframe: string; features?: Record<string, number> }) =>
    request<any>("/explain", { method: "POST", body: JSON.stringify(payload) }),
  backtest: (payload: Record<string, unknown>) => request<any>("/backtest", { method: "POST", body: JSON.stringify(payload) }),
};

export function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function number(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}
