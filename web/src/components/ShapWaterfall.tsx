import { useState, useMemo } from 'react';
import { usePatientStore } from '../store/store';
import { Info } from 'lucide-react';

function getPatientFeatureValue(feature: string, patient: Record<string, any>): string | null {
  if (feature === 'Typical Chest Pain') {
    return patient['Typical Chest Pain'] === 1 ? 'Yes' : patient['Typical Chest Pain'] === 0 ? 'No' : null;
  }
  if (feature === 'Age') return patient.Age ? `${patient.Age}y` : null;
  if (feature === 'HTN') return patient.HTN === 1 ? 'Yes' : patient.HTN === 0 ? 'No' : null;
  if (feature === 'EF-TTE') return patient['EF-TTE'] ? `${patient['EF-TTE']}%` : null;
  if (feature === 'TG') return patient.TG ? `${patient.TG} mg` : null;
  if (feature === 'ESR') return patient.ESR ? `${patient.ESR} mm` : null;
  if (feature === 'BMI') return patient.BMI ? `${patient.BMI}` : null;
  if (feature === 'BP') return patient.BP ? `${patient.BP} mmHg` : null;
  if (feature === 'LDL') return patient.LDL ? `${patient.LDL} mg` : null;
  if (feature === 'HDL') return patient.HDL ? `${patient.HDL} mg` : null;
  if (feature === 'FBS') return patient.FBS ? `${patient.FBS} mg` : null;
  if (feature === 'CR') return patient.CR ? `${patient.CR} mg` : null;
  if (feature === 'Current Smoker') return patient['Current Smoker'] === 1 ? 'Yes' : patient['Current Smoker'] === 0 ? 'No' : null;
  if (feature === 'DM') return patient.DM === 1 ? 'Yes' : patient.DM === 0 ? 'No' : null;
  if (feature === 'Sex') return patient.Sex === 1 ? 'Male' : patient.Sex === 0 ? 'Female' : null;
  if (feature === 'Weight') return patient.Weight ? `${patient.Weight}kg` : null;
  if (feature === 'Length') return patient.Length ? `${patient.Length}cm` : null;
  if (feature === 'PR') return patient.PR ? `${patient.PR} bpm` : null;
  return null;
}

export function ShapWaterfall() {
  const { prediction, patient } = usePatientStore();
  const [filterMode, setFilterMode] = useState<'all' | 'positive' | 'negative'>('all');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const defaultFeatures = [
    { feature: 'Typical Chest Pain', shap: 0.42, group: 'Symptoms' },
    { feature: 'Age', shap: 0.28, group: 'Demographics' },
    { feature: 'HTN', shap: 0.24, group: 'History' },
    { feature: 'EF-TTE', shap: 0.21, group: 'Echo' },
    { feature: 'TG', shap: 0.18, group: 'Lipids' },
  ];

  const rawFeatures = useMemo(() => {
    return prediction?.explanations?.cad?.top
      ? [...prediction.explanations.cad.top]
          .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
          .slice(0, 7)
      : defaultFeatures;
  }, [prediction]);

  const filteredFeatures = useMemo(() => {
    return rawFeatures
      .filter((item) => {
        if (filterMode === 'positive') return item.shap > 0;
        if (filterMode === 'negative') return item.shap < 0;
        return true;
      })
      .slice(0, 5);
  }, [rawFeatures, filterMode]);

  // Determine scale maximum for proportional width
  const maxAbsVal = useMemo(() => {
    const maxVal = Math.max(0.35, ...filteredFeatures.map((f) => Math.abs(f.shap)));
    return maxVal;
  }, [filteredFeatures]);

  return (
    <div className="flex flex-col gap-2 select-none w-full">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800">Explainability (TreeSHAP)</span>
          <div className="relative group cursor-pointer">
            <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 transition-colors" />
            <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap z-50 pointer-events-none">
              <span>Shapley additive explanations showing</span>
              <span>feature contributions to CAD risk prediction.</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-[9px]">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('positive')}
            className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              filterMode === 'positive'
                ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Risk (+)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('negative')}
            className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
              filterMode === 'negative'
                ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Protect (-)
          </button>
        </div>
      </div>

      {/* Proportional Feature Rows */}
      <div className="flex flex-col gap-1.5">
        {filteredFeatures.map((item) => {
          const isPositive = item.shap >= 0;
          const absVal = Math.abs(item.shap);
          const isHovered = hoveredFeature === item.feature;
          const patientVal = getPatientFeatureValue(item.feature, patient);
          const barPct = Math.min(100, Math.max(8, (absVal / maxAbsVal) * 100));

          return (
            <div
              key={item.feature}
              onMouseEnter={() => setHoveredFeature(item.feature)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`flex items-center gap-2 text-[10px] py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-50 ring-1 ring-slate-200/60' : 'hover:bg-slate-50/50'
              }`}
            >
              {/* Feature Name & Value */}
              <div className="w-[125px] shrink-0 flex items-baseline justify-between gap-1 overflow-hidden pr-1">
                <span
                  className={`truncate font-medium ${
                    isHovered ? 'text-slate-900 font-bold' : 'text-slate-700'
                  }`}
                  title={item.feature}
                >
                  {item.feature}
                </span>
                {patientVal && (
                  <span className="text-[9px] text-slate-400 font-mono shrink-0 font-medium">
                    {patientVal}
                  </span>
                )}
              </div>

              {/* Full-Width Proportional Bar Area */}
              <div className="flex-1 flex items-center relative h-4 bg-slate-100/70 rounded-md overflow-hidden p-0.5 border border-slate-200/40">
                {/* Bar */}
                <div
                  className={`h-full rounded transition-all duration-300 flex items-center justify-end px-1.5 ${
                    isPositive
                      ? 'bg-gradient-to-r from-rose-400 to-rose-500 text-white'
                      : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white'
                  }`}
                  style={{ width: `${barPct}%` }}
                >
                  <span className="text-[8.5px] font-mono font-bold leading-none drop-shadow-xs">
                    {isPositive ? `+${item.shap.toFixed(2)}` : item.shap.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Scale and Legend (Snug, no empty gap) */}
      <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between text-[8px] font-mono text-slate-400">
        <span className="text-teal-700 font-sans font-semibold">◀ Protective Factor</span>
        <span className="text-slate-400 font-mono">Normalized TreeSHAP</span>
        <span className="text-rose-700 font-sans font-semibold">Risk Driver ▶</span>
      </div>
    </div>
  );
}
