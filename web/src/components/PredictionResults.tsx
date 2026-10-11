import { useState } from 'react';
import { usePatientStore } from '../store/store';
import type { ArteryId } from '../store/store';
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
  Compass,
  ArrowRight,
  ClipboardCopy,
  Printer,
  FileCheck,
  Stethoscope,
  Pill,
  Target,
  AlertCircle,
  Eye,
} from 'lucide-react';

export function PredictionResults() {
  const {
    prediction,
    error,
    isLoading,
    focusedVessel,
    setFocusedVessel,
    activeResultTab,
    setActiveResultTab,
    patient,
  } = usePatientStore();

  const [copiedNote, setCopiedNote] = useState(false);

  // Baseline values if analysis hasn't been triggered yet, matching reference design
  const cadProb = prediction?.predictions?.cad?.probability ?? 0.569;
  const cadLabel = prediction?.predictions?.cad?.label ?? 1;

  const ladProb = prediction?.predictions?.lad?.probability ?? 0.378;
  const lcxProb = prediction?.predictions?.lcx?.probability ?? 0.186;
  const rcaProb = prediction?.predictions?.rca?.probability ?? 0.353;

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

  const handleCopySummary = () => {
    const noteText = `CARDIOVISION CLINICAL DECISION SUMMARY
Patient: PRN-1042 (Age: ${patient.Age ?? 61}, Sex: ${patient.Sex === 0 ? 'F' : 'M'})
Date: ${new Date().toLocaleDateString()}
------------------------------------------------
OVERALL CAD RISK: ${(cadProb * 100).toFixed(1)}% (${isHighRisk ? 'HIGH RISK' : 'LOW RISK'})
- LAD Territory: ${(ladProb * 100).toFixed(1)}% (${ladTier.label})
- LCX Territory: ${(lcxProb * 100).toFixed(1)}% (${lcxTier.label})
- RCA Territory: ${(rcaProb * 100).toFixed(1)}% (${rcaTier.label})

CLINICAL RECOMMENDATIONS (ACC/AHA 2024 Criteria):
1. Diagnostic Imaging: CCTA / Invasive Coronary Angiogram recommended for anterior (LAD) and inferior (RCA) ischemia.
2. Pharmacotherapy: Initiate High-Intensity Statin (Atorvastatin 40-80mg QD) + Enteric Aspirin 81mg QD.
3. Targets: LDL Goal < 55 mg/dL (Current: ${patient.LDL ?? 167} mg/dL), BP Target < 130/80 mmHg.
4. Referral: Cardiology consultation within 7-14 days.`;

    navigator.clipboard.writeText(noteText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full justify-between gap-2 select-none text-slate-800">
      {/* ── 1. Header with Mode Switcher ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/80">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-900 leading-tight">Analysis Results</h2>
              <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200/60 font-mono">
                AI Engine
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Multimodal risk & decision guide</p>
          </div>
        </div>

        {/* View Switcher: Assessment vs Clinical Guide */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveResultTab('assessment')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
              activeResultTab === 'assessment'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-3 h-3 text-blue-600" />
            <span>Risk View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveResultTab('guide')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer relative ${
              activeResultTab === 'guide'
                ? 'bg-[#0f766e] text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-3 h-3 text-teal-300" />
            <span>Care Guide</span>
            {isHighRisk && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1.5 rounded-xl text-[10px] flex items-center gap-2 shadow-2xs shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
        </div>
      )}

      {/* Loading Banner */}
      {isLoading && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-1.5 rounded-xl text-[10px] flex items-center gap-2 animate-pulse shrink-0">
          <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Evaluating multi-branch coronary risk & SHAP...</span>
        </div>
      )}

      {/* ── 2. Tab Content ── */}
      {activeResultTab === 'assessment' ? (
        /* ══════════ TAB A: RISK ASSESSMENT VIEW ══════════ */
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-2 animate-in fade-in-50 duration-150">
          {/* Card A1: Overall CAD Risk */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <span>Overall CAD Risk Score</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>

              {/* Status Badge */}
              {isHighRisk ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>High Risk Detected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Normal / Low Risk</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {(cadProb * 100).toFixed(1)}%
              </div>

              {/* Quick shortcut to Clinical Guide */}
              <button
                type="button"
                onClick={() => setActiveResultTab('guide')}
                className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50/80 hover:bg-teal-100/80 px-2 py-1 rounded-lg border border-teal-200/70 transition-all cursor-pointer"
              >
                <span>Clinical Guide</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Progress Bar with Tier Indicators */}
            <div className="space-y-0.5">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    isHighRisk
                      ? 'bg-gradient-to-r from-rose-400 to-rose-500'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, cadProb * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-400 px-0.5">
                <span>0% (Low)</span>
                <span>35% (Mod)</span>
                <span>50% (High)</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Card A2: 3D-Linked Vessel Breakdown */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-0.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500" /> Vessel Breakdown
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Click card to highlight in 3D</span>
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
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" />
                    <span className="text-xs font-bold text-slate-900">LAD</span>
                  </div>
                  {focusedVessel === 'lad' && (
                    <Eye className="w-2.5 h-2.5 text-rose-600 animate-pulse" />
                  )}
                </div>

                <div className="flex items-baseline gap-0.5 font-mono">
                  <span className="text-sm font-extrabold text-slate-900">
                    {(ladProb * 100).toFixed(1)}%
                  </span>
                  <span className="text-[8px] text-slate-400 font-sans font-medium uppercase">
                    Risk
                  </span>
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
                  <div className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-teal-600" />
                    <span className="text-xs font-bold text-slate-900">LCX</span>
                  </div>
                  {focusedVessel === 'lcx' && (
                    <Eye className="w-2.5 h-2.5 text-teal-600 animate-pulse" />
                  )}
                </div>

                <div className="flex items-baseline gap-0.5 font-mono">
                  <span className="text-sm font-extrabold text-slate-900">
                    {(lcxProb * 100).toFixed(1)}%
                  </span>
                  <span className="text-[8px] text-slate-400 font-sans font-medium uppercase">
                    Risk
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all duration-500"
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
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">RCA</span>
                  </div>
                  {focusedVessel === 'rca' && (
                    <Eye className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
                  )}
                </div>

                <div className="flex items-baseline gap-0.5 font-mono">
                  <span className="text-sm font-extrabold text-slate-900">
                    {(rcaProb * 100).toFixed(1)}%
                  </span>
                  <span className="text-[8px] text-slate-400 font-sans font-semibold uppercase">
                    Risk
                  </span>
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

          {/* Card A3: Explainability (SHAP Waterfall) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 shadow-2xs flex-1 flex flex-col min-h-[140px]">
            <ShapWaterfall />
          </div>
        </div>
      ) : (
        /* ══════════ TAB B: CLINICAL ACTION GUIDE (CDS PROTOCOL) ══════════ */
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5 animate-in fade-in-50 duration-150 text-[10px]">
          {/* Guide Header Banner */}
          <div className="bg-teal-50/90 border border-teal-200/90 rounded-xl p-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <div>
                <div className="font-bold text-teal-900 leading-tight">ACC/AHA Clinical Action Guide</div>
                <div className="text-[9px] text-teal-700">Patient-specific risk mitigation pathway</div>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded font-mono">
              PRIORITY
            </span>
          </div>

          {/* 4 Categorized Action Recommendations */}
          <div className="space-y-1.5 flex-1 min-h-0 flex flex-col justify-around">
            {/* 1. Diagnostic Imaging */}
            <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 mt-0.5">
                <Heart className="w-3 h-3 text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 leading-tight">Coronary CTA or Angiography</div>
                <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                  High LAD ({(ladProb * 100).toFixed(1)}%) & RCA ({(rcaProb * 100).toFixed(1)}%) suspicion. CCTA with FFR-CT recommended within 14 days.
                </div>
              </div>
            </div>

            {/* 2. Pharmacotherapy */}
            <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200 mt-0.5">
                <Pill className="w-3 h-3 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 leading-tight">High-Intensity Statin + Antiplatelet</div>
                <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                  Atorvastatin 40-80mg QD (Current LDL: {patient.LDL ?? 167} mg/dL) + Aspirin 81mg enteric daily.
                </div>
              </div>
            </div>

            {/* 3. Biomarker Targets */}
            <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200 mt-0.5">
                <Target className="w-3 h-3 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 leading-tight">Target Goals (LDL &lt; 55 mg/dL)</div>
                <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                  Require &gt;50% LDL reduction. Maintain BP &lt; 130/80 mmHg (Current: {patient.BP ?? 123} mmHg).
                </div>
              </div>
            </div>

            {/* 4. Urgent Red Flags */}
            <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 mt-0.5">
                <AlertCircle className="w-3 h-3 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 leading-tight">ACS Red Flags & ER Counseling</div>
                <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                  Educate patient on nitroglycerin 0.4mg PRN. Advise immediate 911 activation if chest pain &gt; 5 min.
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-semibold transition-all cursor-pointer shadow-2xs"
            >
              {copiedNote ? (
                <>
                  <FileCheck className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied Note!</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-3 h-3 text-slate-500" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3 h-3 text-white/80" />
              <span>Print Referral</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
