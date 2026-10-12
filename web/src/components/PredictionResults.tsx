import React from 'react';
import { usePatientStore } from '../store/store';
import type { ArteryId } from '../store/store';
import { ShapWaterfall } from './ShapWaterfall';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Heart,
  ShieldAlert,
  Stethoscope,
  Eye,
} from 'lucide-react';

export function PredictionResults() {
  const {
    prediction,
    error,
    isLoading,
    focusedVessel,
    setFocusedVessel,
  } = usePatientStore();

  // Calculated values derived directly from model predictions
  const cadProb = prediction?.predictions?.cad?.probability ?? 0;
  const cadLabel = prediction?.predictions?.cad?.label ?? (cadProb >= 0.5 ? 1 : 0);

  const ladProb = prediction?.predictions?.lad?.probability ?? 0;
  const lcxProb = prediction?.predictions?.lcx?.probability ?? 0;
  const rcaProb = prediction?.predictions?.rca?.probability ?? 0;

  const isHighRisk = cadLabel === 1 || cadProb >= 0.5;

  const getRiskTier = (prob: number) => {
    if (prob >= 0.5) return { label: 'High Risk', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (prob >= 0.35) return { label: 'Moderate-High', badge: 'bg-rose-50/80 text-rose-600 border-rose-200/80' };
    if (prob >= 0.25) return { label: 'Moderate', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { label: 'Low-Moderate', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const ladTier = getRiskTier(ladProb);
  const lcxTier = getRiskTier(lcxProb);
  const rcaTier = getRiskTier(rcaProb);

  const handleVesselClick = (vessel: ArteryId) => {
    if (focusedVessel === vessel) {
      setFocusedVessel(null);
    } else {
      setFocusedVessel(vessel);
    }
  };

  // Determine highest risk vessel for clinical summary
  const highestVessel = React.useMemo(() => {
    const vessels = [
      { name: 'LAD (Anterior)', prob: ladProb },
      { name: 'RCA (Inferior)', prob: rcaProb },
      { name: 'LCX (Lateral)', prob: lcxProb },
    ];
    vessels.sort((a, b) => b.prob - a.prob);
    return vessels[0];
  }, [ladProb, rcaProb, lcxProb]);

  return (
    <div className="flex flex-col h-full justify-start gap-2.5 select-none text-slate-800 relative">
      {/* ── 1. Clean Header (No Collliding Badges or Duplicate Tabs) ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center shrink-0 border border-teal-200/80">
            <BarChart3 className="w-3.5 h-3.5 text-[#0f766e]" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">Cardiovascular Risk Analysis</h2>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Multimodal AI Ensemble Output</p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border font-mono ${
            prediction
              ? 'bg-teal-50 text-teal-800 border-teal-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {prediction ? 'AI Evaluated' : 'Standby'}
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-xl text-[10px] flex items-center gap-2 shadow-2xs shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
        </div>
      )}

      {/* ── Frosted Glassmorphism AI Ensemble Computing Overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 z-40 backdrop-blur-md bg-white/85 rounded-2xl p-5 flex flex-col items-center justify-center gap-3.5 text-center animate-in fade-in duration-200 select-none shadow-sm">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl bg-teal-500/10 border-2 border-teal-500/40 animate-spin"
              style={{ animationDuration: '3s' }}
            />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0f766e] to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-mono tracking-wider uppercase">
              AI Ensemble Computing
            </span>
            <h3 className="text-xs font-bold text-slate-900 mt-1">Evaluating CAD Models</h3>
            <p className="text-[10px] text-slate-500 max-w-[220px] leading-tight">
              Processing gradient-boosted trees & calculating TreeSHAP values...
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-[#0f766e] rounded-full animate-pulse w-full" />
          </div>

          <div className="space-y-1 text-[9px] text-slate-400 font-mono">
            <div>• Multi-Model XGBoost / CatBoost</div>
            <div>• Coronary Branch Calibration</div>
            <div>• SHAP Feature Attribution</div>
          </div>
        </div>
      )}

      {/* ── 2. Main Content: Empty State vs Analytical Report ── */}
      {!prediction ? (
        /* ══════════ EMPTY STATE: AWAITING CLINICAL INPUT ══════════ */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center p-4 bg-slate-50/70 border border-dashed border-slate-200/90 rounded-2xl gap-3 animate-in fade-in-50 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#0f766e] shadow-2xs">
            <Stethoscope className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900">Awaiting Clinical Evaluation</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed max-w-[240px]">
              Enter patient clinical parameters on the left and click{' '}
              <span className="font-bold text-[#0f766e]">Run Cardiovascular Analysis</span> to generate
              multi-branch CAD risk predictions and SHAP explainability.
            </p>
          </div>

          {/* Structured Output Pipeline Preview */}
          <div className="w-full bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs flex flex-col gap-2 text-left mt-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Predicted Outputs:
            </span>
            <div className="space-y-1.5 text-[10px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>Overall CAD Risk Score (AI Ensemble)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>LAD, LCX & RCA Branch Stenosis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>SHAP Feature Attribution Waterfall</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>Clinical Decision Support Metrics</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 font-medium">
            Tip: Use "High Risk Sample" or "Normal Sample" to test instantly
          </div>
        </div>
      ) : (
        /* ══════════ UNIFIED ANALYTICAL REPORT ══════════ */
        <div className="flex flex-col gap-2.5 animate-in fade-in-50 duration-150">
          {/* ── Card 1: Overall CAD Risk Score (Redesigned & Clean) ── */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Overall CAD Risk Score</span>
              {isHighRisk ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>High Risk Detected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Normal / Low Risk</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {(cadProb * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] font-semibold text-slate-500">
                {isHighRisk ? 'Severe Ischemia Likely' : 'Low Ischemia Likelihood'}
              </span>
            </div>

            {/* Continuous Gradient Progress Gauge */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                  style={{ width: `${Math.min(100, Math.max(4, cadProb * 100))}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-400 px-0.5">
                <span>Low (&lt;35%)</span>
                <span>Moderate (35-49%)</span>
                <span>High (≥50%)</span>
              </div>
            </div>
          </div>

          {/* ── Card 2: 3D-Linked Coronary Vessel Breakdown ── */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] px-0.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500" /> Coronary Branch Breakdown
              </span>
              <span className="text-[9px] text-slate-400 font-mono">3D Synchronized</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {/* LAD Card */}
              <button
                type="button"
                onClick={() => handleVesselClick('lad')}
                className={`bg-white rounded-xl p-2 shadow-2xs flex flex-col gap-1 text-left transition-all cursor-pointer border ${
                  focusedVessel === 'lad'
                    ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/30 shadow-xs'
                    : 'border-slate-200/80 hover:border-rose-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600">LAD</span>
                  {focusedVessel === 'lad' && (
                    <Eye className="w-2.5 h-2.5 text-rose-600 animate-pulse" />
                  )}
                </div>

                <div className="font-mono text-sm font-extrabold text-slate-900">
                  {(ladProb * 100).toFixed(1)}%
                </div>

                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${ladProb * 100}%` }}
                  />
                </div>

                <div className={`text-[8px] font-semibold text-center py-0.2 rounded border ${ladTier.badge}`}>
                  {ladTier.label}
                </div>
              </button>

              {/* LCX Card */}
              <button
                type="button"
                onClick={() => handleVesselClick('lcx')}
                className={`bg-white rounded-xl p-2 shadow-2xs flex flex-col gap-1 text-left transition-all cursor-pointer border ${
                  focusedVessel === 'lcx'
                    ? 'ring-2 ring-teal-500 border-teal-400 bg-teal-50/30 shadow-xs'
                    : 'border-slate-200/80 hover:border-teal-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f766e]">LCX</span>
                  {focusedVessel === 'lcx' && (
                    <Eye className="w-2.5 h-2.5 text-[#0f766e] animate-pulse" />
                  )}
                </div>

                <div className="font-mono text-sm font-extrabold text-slate-900">
                  {(lcxProb * 100).toFixed(1)}%
                </div>

                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0f766e] rounded-full transition-all duration-500"
                    style={{ width: `${lcxProb * 100}%` }}
                  />
                </div>

                <div className={`text-[8px] font-semibold text-center py-0.2 rounded border ${lcxTier.badge}`}>
                  {lcxTier.label}
                </div>
              </button>

              {/* RCA Card */}
              <button
                type="button"
                onClick={() => handleVesselClick('rca')}
                className={`bg-white rounded-xl p-2 shadow-2xs flex flex-col gap-1 text-left transition-all cursor-pointer border ${
                  focusedVessel === 'rca'
                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30 shadow-xs'
                    : 'border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">RCA</span>
                  {focusedVessel === 'rca' && (
                    <Eye className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
                  )}
                </div>

                <div className="font-mono text-sm font-extrabold text-slate-900">
                  {(rcaProb * 100).toFixed(1)}%
                </div>

                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${rcaProb * 100}%` }}
                  />
                </div>

                <div className={`text-[8px] font-semibold text-center py-0.2 rounded border ${rcaTier.badge}`}>
                  {rcaTier.label}
                </div>
              </button>
            </div>
          </div>

          {/* ── Card 3: Clinical Decision Indicators Bar ── */}
          <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 p-2 grid grid-cols-3 gap-2 text-[10px]">
            <div className="flex flex-col">
              <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider">
                Primary Territory
              </span>
              <span className="font-bold text-slate-800 truncate">{highestVessel.name}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider">
                Stenosis Suspect
              </span>
              <span className={`font-bold truncate ${isHighRisk ? 'text-rose-600' : 'text-emerald-700'}`}>
                {isHighRisk ? 'Significant' : 'Non-Obstructive'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-wider">
                ACC/AHA Action
              </span>
              <span className="font-bold text-teal-800 truncate">
                {isHighRisk ? 'CCTA / Angio' : 'Routine Care'}
              </span>
            </div>
          </div>

          {/* ── Card 4: Explainability (TreeSHAP Waterfall) ── */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs">
            <ShapWaterfall />
          </div>
        </div>
      )}
    </div>
  );
}
