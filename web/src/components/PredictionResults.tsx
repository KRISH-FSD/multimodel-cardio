import React from 'react';
import { usePatientStore } from '../store/store';
import type { ArteryId } from '../store/store';
import { ShapWaterfall } from './ShapWaterfall';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export function PredictionResults() {
  const {
    prediction,
    error,
    isLoading,
    focusedVessel,
    setFocusedVessel,
  } = usePatientStore();

  const cadProb = prediction?.predictions?.cad?.probability ?? 0;
  const ladProb = prediction?.predictions?.lad?.probability ?? 0;
  const lcxProb = prediction?.predictions?.lcx?.probability ?? 0;
  const rcaProb = prediction?.predictions?.rca?.probability ?? 0;

  const isHighRisk = cadProb >= 0.5;

  const handleVesselClick = (vessel: ArteryId) => {
    if (focusedVessel === vessel) {
      setFocusedVessel(null);
    } else {
      setFocusedVessel(vessel);
    }
  };

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
    <div className="flex flex-col h-full justify-between gap-2 select-none text-slate-800 relative overflow-hidden">
      {/* ── 1. Compact Header ── */}
      <div className="flex items-center justify-between shrink-0 h-7">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/80">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-none">Risk Assessment</h2>
            <p className="text-[9.5px] text-slate-400 leading-none mt-0.5">Multimodal Model Output</p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
            prediction
              ? 'bg-teal-50 text-teal-800 border-teal-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {prediction ? 'Evaluated' : 'Standby'}
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
        </div>
      )}

      {/* ── High-Tech Clinical Inference Loading Overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 z-40 backdrop-blur-md bg-white/95 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in duration-200 select-none border border-teal-200/60 shadow-xl">
          {/* Animated Spinner with pulse rings */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-ping" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-[#0f766e] flex items-center justify-center text-white shadow-md shadow-teal-700/20">
              <Activity className="w-5 h-5 animate-spin" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80 uppercase tracking-wider">
              AI Inference Active
            </span>
            <h3 className="text-xs font-extrabold text-slate-900 mt-1">Synthesizing Multimodal Model</h3>
            <p className="text-[10px] text-slate-500 max-w-[210px] leading-tight mx-auto">
              Computing gradient-boosted ensemble & TreeSHAP explainability pipeline...
            </p>
          </div>

          {/* Stepped progress indicators */}
          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col gap-1.5 text-left text-[9.5px]">
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                16+ Clinical Biomarkers Ingested
              </span>
              <span className="text-emerald-600 font-bold">✓</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Coronary Perfusion Models (LAD/LCX/RCA)
              </span>
              <span className="text-teal-600 font-mono animate-pulse">Running</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                Unified TreeSHAP Feature Attributions
              </span>
              <span className="text-slate-400 font-mono">Syncing</span>
            </div>
          </div>

          {/* Shimmering Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 via-rose-500 to-[#0f766e] rounded-full animate-pulse w-full" />
          </div>
        </div>
      )}

      {/* ── Report Cards (Zero scrollbar, vertically balanced, displays 0.0% when unanalyzed) ── */}
      <div className="flex-1 flex flex-col justify-between min-h-0 gap-2">
        {/* Card 1: Hero CAD Risk Score */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
              Overall CAD Risk
            </span>
            {prediction ? (
              isHighRisk ? (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                  <span>High Risk (≥50%)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                  <span>Low Risk (&lt;35%)</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                <span>Awaiting Analysis</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {prediction ? `${(cadProb * 100).toFixed(1)}%` : '0.0%'}
            </div>
            <span
              className={`text-[11px] font-semibold ${
                prediction
                  ? isHighRisk
                    ? 'text-rose-600'
                    : 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              {prediction
                ? isHighRisk
                  ? 'Significant Stenosis Likely'
                  : 'Non-Obstructive Perfusion'
                : 'Awaiting Model Execution'}
            </span>
          </div>

          {/* Progress Meter */}
          <div className="space-y-0.5">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  prediction
                    ? isHighRisk
                      ? 'bg-rose-500'
                      : cadProb >= 0.35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                    : 'bg-slate-300'
                }`}
                style={{
                  width: prediction
                    ? `${Math.min(100, Math.max(5, cadProb * 100))}%`
                    : '0%',
                }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 font-mono">
              <span>Normal (&lt;35%)</span>
              <span>Elevated (35-49%)</span>
              <span>Critical (≥50%)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Coronary Branch Breakdown */}
        <div className="space-y-1 shrink-0">
          <div className="flex items-center justify-between text-[10px] px-0.5">
            <span className="font-bold text-slate-700">Coronary Vessel Territories</span>
            <span className="text-[9px] text-slate-400">Click to focus 3D</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* LAD */}
            <button
              type="button"
              onClick={() => handleVesselClick('lad')}
              className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                focusedVessel === 'lad'
                  ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                  : 'border-slate-200/90 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-600">LAD</span>
                <span className="text-[8.5px] text-slate-400">Anterior</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {prediction ? `${(ladProb * 100).toFixed(1)}%` : '0.0%'}
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1 mb-0.5">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: prediction ? `${ladProb * 100}%` : '0%' }}
                />
              </div>
              <span
                className={`text-[8px] font-semibold block ${
                  prediction
                    ? ladProb >= 0.5
                      ? 'text-rose-600 font-bold'
                      : 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {prediction
                  ? ladProb >= 0.5
                    ? 'High Risk'
                    : ladProb >= 0.35
                    ? 'Moderate'
                    : 'Normal'
                  : 'Standby'}
              </span>
            </button>

            {/* LCX */}
            <button
              type="button"
              onClick={() => handleVesselClick('lcx')}
              className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                focusedVessel === 'lcx'
                  ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                  : 'border-slate-200/90 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-700">LCX</span>
                <span className="text-[8.5px] text-slate-400">Lateral</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {prediction ? `${(lcxProb * 100).toFixed(1)}%` : '0.0%'}
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1 mb-0.5">
                <div
                  className="h-full bg-teal-600 rounded-full"
                  style={{ width: prediction ? `${lcxProb * 100}%` : '0%' }}
                />
              </div>
              <span
                className={`text-[8px] font-semibold block ${
                  prediction
                    ? lcxProb >= 0.5
                      ? 'text-rose-600 font-bold'
                      : 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {prediction
                  ? lcxProb >= 0.5
                    ? 'High Risk'
                    : lcxProb >= 0.35
                    ? 'Moderate'
                    : 'Normal'
                  : 'Standby'}
              </span>
            </button>

            {/* RCA */}
            <button
              type="button"
              onClick={() => handleVesselClick('rca')}
              className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                focusedVessel === 'rca'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200/90 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600">RCA</span>
                <span className="text-[8.5px] text-slate-400">Inferior</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {prediction ? `${(rcaProb * 100).toFixed(1)}%` : '0.0%'}
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1 mb-0.5">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: prediction ? `${rcaProb * 100}%` : '0%' }}
                />
              </div>
              <span
                className={`text-[8px] font-semibold block ${
                  prediction
                    ? rcaProb >= 0.5
                      ? 'text-rose-600 font-bold'
                      : 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {prediction
                  ? rcaProb >= 0.5
                    ? 'High Risk'
                    : rcaProb >= 0.35
                    ? 'Moderate'
                    : 'Normal'
                  : 'Standby'}
              </span>
            </button>
          </div>
        </div>

        {/* Card 3: Clinical Recommendation Box */}
        <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 p-2 space-y-0.5 shrink-0">
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">
              Primary Territory:
            </span>
            <span className="font-bold text-slate-800">
              {prediction ? highestVessel.name : 'None (Pending Analysis)'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">
              Referral:
            </span>
            <span
              className={`font-bold ${
                prediction
                  ? isHighRisk
                    ? 'text-rose-600'
                    : 'text-teal-800'
                  : 'text-slate-500'
              }`}
            >
              {prediction
                ? isHighRisk
                  ? 'Diagnostic CCTA / Angiography'
                  : 'Routine Clinical Follow-Up'
                : 'Pending Cardiovascular Analysis'}
            </span>
          </div>
        </div>

        {/* Card 4: Bipolar Divergent TreeSHAP Graph (Negative & Positive together) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-2xs shrink-0">
          <ShapWaterfall />
        </div>
      </div>
    </div>
  );
}
