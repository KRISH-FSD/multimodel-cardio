import { usePatientStore } from '../store/store';
import { ShapWaterfall } from './ShapWaterfall';
import {
  BarChart3,
  Info,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Heart,
  GitBranch,
  ShieldAlert,
} from 'lucide-react';

export function PredictionResults() {
  const { prediction, error, isLoading } = usePatientStore();

  // Baseline mock values if analysis hasn't been triggered yet, matching reference image
  const cadProb = prediction?.predictions?.cad?.probability ?? 0.569;
  const cadLabel = prediction?.predictions?.cad?.label ?? 1;

  const ladProb = prediction?.predictions?.lad?.probability ?? 0.378;
  const lcxProb = prediction?.predictions?.lcx?.probability ?? 0.186;
  const rcaProb = prediction?.predictions?.rca?.probability ?? 0.353;

  const getRiskTier = (prob: number) => {
    if (prob >= 0.5) return { label: 'High Risk', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (prob >= 0.35) return { label: 'Moderate-High', badge: 'bg-rose-50/80 text-rose-600 border-rose-200/80' };
    if (prob >= 0.25) return { label: 'Moderate', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { label: 'Low-Moderate', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const ladTier = getRiskTier(ladProb);
  const lcxTier = getRiskTier(lcxProb);
  const rcaTier = getRiskTier(rcaProb);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">Analysis Results</h2>
            <p className="text-xs text-slate-500">AI-powered cardiovascular risk assessment</p>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
          Jan 14, 2026 11:57 AM
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2 shadow-xs">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-rose-800">Analysis Message</span>
            <span className="text-rose-600 leading-relaxed">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </span>
          </div>
        </div>
      )}

      {/* Loading State Banner */}
      {isLoading && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 rounded-xl text-xs flex items-center gap-3 animate-pulse">
          <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Evaluating coronary branches and SHAP attribution...</span>
        </div>
      )}

      {/* ── Overall CAD Risk Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>Overall CAD Risk</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Giant Percentage */}
          <div className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
            {(cadProb * 100).toFixed(1)}%
          </div>

          {/* Status Badge */}
          {cadLabel === 1 || cadProb >= 0.5 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>High Risk Detected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Low Risk (Normal)</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              cadLabel === 1 || cadProb >= 0.5
                ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                : 'bg-gradient-to-r from-emerald-400 to-teal-500'
            }`}
            style={{ width: `${Math.min(100, cadProb * 100)}%` }}
          />
        </div>
      </div>

      {/* ── Vessel Risk Cards (Row of 3) ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
          <span>Vessel Risk Breakdown</span>
          <span className="text-[9px] text-slate-400 font-sans font-medium bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/60">
            CAD Risk Probability • Not Stenosis %
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {/* LAD Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-xs font-bold text-slate-800">LAD</span>
            </div>

            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-lg font-bold text-slate-900">
                {(ladProb * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 font-sans font-semibold uppercase">
                Risk Prob.
              </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-700"
                style={{ width: `${ladProb * 100}%` }}
              />
            </div>

            <div
              className={`text-[9px] font-medium text-center py-0.5 rounded-md border ${ladTier.badge}`}
            >
              {ladTier.label}
            </div>
          </div>

          {/* LCX Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-bold text-slate-800">LCX</span>
            </div>

            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-lg font-bold text-slate-900">
                {(lcxProb * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 font-sans font-semibold uppercase">
                Risk Prob.
              </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-700"
                style={{ width: `${lcxProb * 100}%` }}
              />
            </div>

            <div
              className={`text-[9px] font-medium text-center py-0.5 rounded-md border ${lcxTier.badge}`}
            >
              {lcxTier.label}
            </div>
          </div>

          {/* RCA Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">RCA</span>
            </div>

            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-lg font-bold text-slate-900">
                {(rcaProb * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 font-sans font-semibold uppercase">
                Risk Prob.
              </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-700"
                style={{ width: `${rcaProb * 100}%` }}
              />
            </div>

            <div
              className={`text-[9px] font-medium text-center py-0.5 rounded-md border ${rcaTier.badge}`}
            >
              {rcaTier.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Explainability (SHAP) Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex-1 flex flex-col">
        <ShapWaterfall />
      </div>
    </div>
  );
}
