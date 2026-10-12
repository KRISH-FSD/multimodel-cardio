import {
  ShieldCheck,
  Layers,
  TrendingUp,
} from 'lucide-react';

export function ModelInsightsView() {
  const modelMetrics = [
    {
      target: 'CAD (Global CAD Stenosis)',
      pipeline: 'Ensemble XGBoost + Calibrated Logistic',
      auc: '0.882',
      f1: '0.814',
      accuracy: '83.6%',
      territory: 'Global Myocardial Perfusion',
      color: 'rose',
    },
    {
      target: 'LAD (Left Anterior Descending)',
      pipeline: 'Gradient Boosted Decision Trees',
      auc: '0.841',
      f1: '0.782',
      accuracy: '81.2%',
      territory: 'Anterior Wall & Septum',
      color: 'teal',
    },
    {
      target: 'LCX (Left Circumflex)',
      pipeline: 'LightGBM Regressor / Classifier',
      auc: '0.815',
      f1: '0.749',
      accuracy: '79.5%',
      territory: 'Lateral & Posterior Wall',
      color: 'teal',
    },
    {
      target: 'RCA (Right Coronary Artery)',
      pipeline: 'Ensemble Random Forest + XGBoost',
      auc: '0.864',
      f1: '0.803',
      accuracy: '82.8%',
      territory: 'Inferior Wall & RV',
      color: 'blue',
    },
  ];

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 overflow-y-auto bg-slate-50/60 rounded-2xl border border-slate-200/80 antialiased">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Multimodal AI Architecture & Model Evaluation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validation benchmarks, SHAP explainability mechanics, and territorial risk pipelines
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Validated on 5-Fold Stratified CV</span>
        </div>
      </div>

      {/* 4 Pipeline Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {modelMetrics.map((m) => (
          <div
            key={m.target}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Objective
              </span>
              <h3 className="text-xs font-extrabold text-slate-900 mt-0.5">{m.target}</h3>
              <p className="text-[11px] text-teal-700 font-medium mt-0.5">{m.pipeline}</p>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
              <div>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">ROC-AUC</span>
                <p className="text-xs font-extrabold text-slate-900">{m.auc}</p>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">F1-Score</span>
                <p className="text-xs font-extrabold text-slate-900">{m.f1}</p>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">Accuracy</span>
                <p className="text-xs font-extrabold text-slate-900">{m.accuracy}</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>Territory: {m.territory}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Model Explanations & SHAP Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-900">TreeSHAP Interpretability Standard</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            CardioVision calculates exact Shapley additive explanations for every inference call via 
            <strong className="text-slate-900"> TreeSHAP</strong>. Rather than treating decisions as a black box, each feature 
            pushing risk higher (such as elevated LDL, typical chest pain, or low ejection fraction) or lowering risk 
            is quantified and mapped directly onto the 3D coronary anatomy.
          </p>
          <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100 text-xs text-teal-900 space-y-1">
            <p className="font-bold">Key Model Properties:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-teal-800">
              <li>Deterministic background reference distribution (n=50 stratified centroids)</li>
              <li>Additivity guaranteed: sum of SHAP values + base value = model log-odds</li>
              <li>Per-vessel localized sensitivity for targeted angiography referral</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-900">Multimodal Input Taxonomy (55 Parameters)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Clinical inputs are grouped into four standardized clinical domains:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-800 block">1. Demographics</span>
              <span className="text-[11px] text-slate-500">Age, Sex, Weight, Height, BMI</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-800 block">2. Vitals & Symptoms</span>
              <span className="text-[11px] text-slate-500">Blood Pressure, Pulse, Murmurs, Chest Pain</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-800 block">3. Laboratory & ECG</span>
              <span className="text-[11px] text-slate-500">Lipid profile, Creatinine, ST/T changes</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-800 block">4. Medical History</span>
              <span className="text-[11px] text-slate-500">Hypertension, Diabetes, Smoking, Family History</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
