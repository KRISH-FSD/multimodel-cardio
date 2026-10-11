import { useState } from 'react';
import { usePatientStore } from '../store/store';
import { Info } from 'lucide-react';

export function ShapWaterfall() {
  const { prediction } = usePatientStore();
  const [filterMode, setFilterMode] = useState<'all' | 'positive' | 'negative'>('all');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // If no prediction yet, show clean placeholder mockup matching reference
  const defaultFeatures = [
    { feature: 'Typical Chest Pain', shap: 0.42, group: 'Symptoms' },
    { feature: 'Age', shap: 0.28, group: 'Demographics' },
    { feature: 'HTN', shap: 0.24, group: 'History' },
    { feature: 'EF-TTE', shap: 0.21, group: 'Echo' },
    { feature: 'TG', shap: 0.18, group: 'Lipids' },
    { feature: 'ESR', shap: -0.12, group: 'Labs' },
  ];

  const rawFeatures = prediction?.explanations?.cad?.top
    ? [...prediction.explanations.cad.top]
        .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
        .slice(0, 7)
    : defaultFeatures;

  const filteredFeatures = rawFeatures.filter((item) => {
    if (filterMode === 'positive') return item.shap > 0;
    if (filterMode === 'negative') return item.shap < 0;
    return true;
  }).slice(0, 5);

  const maxVal = 0.55;

  return (
    <div className="flex flex-col gap-1.5 h-full justify-between select-none">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800">Explainability (SHAP)</span>
          <div className="relative group cursor-pointer">
            <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 transition-colors" />
            <div className="absolute left-0 bottom-full mb-1 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap z-50 pointer-events-none">
              <span>Shapley additive explanations showing</span>
              <span>feature impact on CAD model predictions.</span>
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
                ? 'bg-white text-slate-800 shadow-2xs'
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
                ? 'bg-rose-50 text-rose-700 shadow-2xs'
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
                ? 'bg-blue-50 text-blue-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Protect (-)
          </button>
        </div>
      </div>

      {/* Interactive Bar Chart */}
      <div className="flex flex-col gap-1">
        {filteredFeatures.map((item) => {
          const isPositive = item.shap >= 0;
          const absVal = Math.abs(item.shap);
          const isHovered = hoveredFeature === item.feature;

          return (
            <div
              key={item.feature}
              onMouseEnter={() => setHoveredFeature(item.feature)}
              onMouseLeave={() => setHoveredFeature(null)}
              className={`grid grid-cols-12 items-center text-[10px] py-0.5 px-1 rounded transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-50' : ''
              }`}
            >
              {/* Feature Name */}
              <div
                className={`col-span-5 text-right pr-2.5 font-medium truncate ${
                  isHovered ? 'text-slate-900 font-bold' : 'text-slate-600'
                }`}
                title={item.feature}
              >
                {item.feature}
              </div>

              {/* Bar Area (7 cols) */}
              <div className="col-span-7 flex items-center relative h-4">
                {/* Center Zero Line */}
                <div className="absolute left-[24%] top-0 bottom-0 w-px bg-slate-200 z-0" />

                {isPositive ? (
                  /* Positive Bar */
                  <div className="absolute left-[24%] flex items-center gap-1 z-10">
                    <div
                      className={`h-3 rounded-r transition-all duration-300 ${
                        isHovered
                          ? 'bg-rose-500 shadow-xs'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(95, (absVal / maxVal) * 90)}px` }}
                    />
                    <span className="text-[9px] font-mono font-bold text-slate-700">
                      +{item.shap.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  /* Negative Bar */
                  <div className="absolute right-[76%] flex items-center flex-row-reverse gap-1 z-10">
                    <div
                      className={`h-3 rounded-l transition-all duration-300 ${
                        isHovered
                          ? 'bg-blue-600 shadow-xs'
                          : 'bg-blue-400'
                      }`}
                      style={{ width: `${Math.min(95, (absVal / maxVal) * 90)}px` }}
                    />
                    <span className="text-[9px] font-mono font-bold text-slate-700">
                      {item.shap.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Scale and Legend */}
      <div className="border-t border-slate-100 pt-1 flex items-center justify-between text-[8px] font-mono text-slate-400">
        <span className="text-blue-600 font-sans font-semibold">◀ Protective</span>
        <div className="flex gap-4">
          <span>-0.2</span>
          <span>0.0</span>
          <span>+0.2</span>
          <span>+0.4</span>
        </div>
        <span className="text-rose-600 font-sans font-semibold">Risk Driver ▶</span>
      </div>
    </div>
  );
}
