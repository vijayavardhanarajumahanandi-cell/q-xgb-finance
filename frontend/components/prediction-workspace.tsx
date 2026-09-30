"use client";

import { useEffect, useState } from "react";
import { api, type PredictionResult } from "@/lib/api";
import { demoPrediction } from "@/lib/demo";
import { Button, Card, DemoBadge, ErrorState, Field, PageHeader, Progress, SectionTitle, SelectField } from "@/components/ui";
import { ModelProbabilityBars, ProbabilityChart, ShapChart } from "@/components/charts";
import { Loader2, Play, Save } from "lucide-react";
import { readLocal, writeLocal } from "@/lib/storage";
import type { HistoryItem } from "@/types";

export function PredictionWorkspace({ detailId }: { detailId?: string }) {
  const [instrument, setInstrument] = useState("GC=F");
  const [timeframe, setTimeframe] = useState("1d");
  const [timestamp, setTimestamp] = useState("");
  const [prediction, setPrediction] = useState<PredictionResult | null>(detailId ? demoPrediction : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (detailId) {
      const history = readLocal<HistoryItem[]>("predictions", []);
      const match = history.find((x) => x.id === detailId);
      if (match) setPrediction({ ...demoPrediction, timestamp: match.createdAt, prediction: match.prediction, confidence: match.confidence, instrument: match.instrument, timeframe: match.timeframe, mode: "demo" });
    }
  }, [detailId]);

  async function run() {
    setLoading(true); setError(""); setSaved(false);
    try { setPrediction(await api.predict({ instrument, timeframe, timestamp: timestamp || undefined })); }
    catch (e) { setPrediction(demoPrediction); setError(e instanceof Error ? e.message : "Prediction API unavailable; demo data displayed."); }
    finally { setLoading(false); }
  }

  function saveHistory() {
    if (!prediction) return;
    const rows = readLocal<HistoryItem[]>("predictions", []);
    const item: HistoryItem = { id: `${Date.now()}`, createdAt: prediction.timestamp, prediction: prediction.prediction, confidence: prediction.confidence, instrument: prediction.instrument, timeframe: prediction.timeframe, xgb: prediction.models.xgboost?.probability ?? 0, vqc: prediction.models.vqc?.probability ?? 0, hybrid: prediction.models.hybrid?.probability ?? 0, topDriver: prediction.shap[0]?.feature ?? "—", mode: prediction.mode };
    writeLocal("predictions", [item, ...rows].slice(0, 200));
    setSaved(true);
  }

  return <div className="space-y-6">
    <PageHeader eyebrow="Market intelligence" title={detailId ? "Prediction Detail" : "Prediction Workspace"} description="Select an instrument and timeframe, run the backend inference pipeline, then inspect probabilities, explanations, and model disagreement." action={<DemoBadge text="No database · browser-local history"/>}/>
    {error && <ErrorState message={`${error}. The UI falls back to clearly labeled Demo Mode when the backend cannot be reached.`} />}

    <Card className="p-5">
      <div className="grid gap-4 md:grid-cols-4">
        <SelectField label="Instrument" value={instrument} onChange={setInstrument} options={["GC=F", "XAUUSD"]}/>
        <SelectField label="Timeframe" value={timeframe} onChange={setTimeframe} options={["1d", "1h", "15m"]}/>
        <Field label="Selected bar / timestamp" value={timestamp} onChange={setTimestamp} type="datetime-local"/>
        <div className="flex items-end"><Button onClick={run} disabled={loading}>{loading ? <><Loader2 size={16} className="animate-spin"/>Running</> : <><Play size={16}/>Run Prediction</>}</Button></div>
      </div>
    </Card>

    {prediction && <>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-6"><div className="flex items-start justify-between"><div><DemoBadge text={prediction.mode === "demo" ? "Demo output" : "Model output"}/><div className="mt-4 text-xs uppercase tracking-[.2em] text-slate-600">Final prediction</div><div className="mt-2 text-4xl font-semibold">{prediction.prediction}</div><p className="mt-2 text-sm text-slate-500">Confidence {Math.round(prediction.confidence*100)}%</p></div><button onClick={saveHistory} className="rounded-lg border border-[#252b36] bg-[#0e1117] p-2 text-slate-400 hover:text-white" title="Save to browser history">{saved ? <Save size={17} className="text-emerald-400"/> : <Save size={17}/>}</button></div><div className="mt-7"><ProbabilityChart up={prediction.probabilities.up ?? 0} down={prediction.probabilities.down ?? 0}/></div></Card>
        <Card className="p-6"><SectionTitle title="Risk context" subtitle="Composite uncertainty indicator."/><div className="text-5xl font-semibold mono">{prediction.risk.score}<span className="text-lg text-slate-600">/100</span></div><div className="mt-5 space-y-4"><RiskBar label="Volatility" value={prediction.risk.volatility}/><RiskBar label="Prediction uncertainty" value={prediction.risk.prediction_uncertainty}/><RiskBar label="Model disagreement" value={prediction.risk.model_disagreement}/></div></Card>
      </div>

      <Card className="p-5"><SectionTitle title="Three-model comparison" subtitle="The hybrid output combines the probability streams; no automatic model ranking is performed."/><ModelProbabilityBars models={Object.entries(prediction.models).map(([name, model]) => ({ name: name.toUpperCase(), probability: model.probability }))}/></Card>
      <Card className="p-5"><SectionTitle title="SHAP / feature contribution" subtitle="Contribution to model output, not causality."/><ShapChart rows={prediction.shap}/></Card>
    </>}

    {!prediction && <Card className="p-10 text-center"><div className="text-sm font-semibold">Ready to run</div><p className="mt-2 text-xs text-slate-500">Choose an instrument and timeframe, then execute the prediction pipeline.</p></Card>}
  </div>;
}

function RiskBar({ label, value }: { label: string; value: number }) { return <div><div className="mb-1 flex justify-between text-[11px] text-slate-500"><span>{label}</span><span className="mono">{value.toFixed(1)}</span></div><Progress value={value} tone="cyan"/></div>; }
