import { usePatientStore } from '../store/store';
import { Info, ChevronDown } from 'lucide-react';

export function ShapWaterfall() {
  const { prediction } = usePatientStore();

  // If no prediction yet, show clean placeholder mockup or default explainability
  const defaultFeatures = [
    { feature: 'Typical Chest Pain', shap: 0.42 },
    { feature: 'Age', shap: 0.28 },
    { feature: 'HTN', shap: 0.24 },
    { feature: 'EF-TTE', shap: 0.21 },
    { feature: 'TG', shap: 0.18 },
    { feature: 'ESR', shap: -0.12 },
  ];

  const features = prediction?.explanations?.cad?.top
    ? [...prediction.explanations.cad.top]
        .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
        .slice(0, 6)
    : defaultFeatures;

  // Max absolute value for scaling the bar widths
  const maxVal = 0.6;

  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800">Explainability (SHAP)</span>
          <div className="relative group cursor-pointer">
            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap z-50 pointer-events-none">
              <span>Shapley additive explanations showing</span>
              <span>feature impact on CAD model predictions.</span>
            </div>
          </div>
        </div>

        {/* Dropdown filter */}
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
          <span>Top Features</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {/* Clean Apple-style Horizontal Bar Chart */}
      <div className="flex flex-col gap-2 pt-1">
        {features.map((item) => {
          const isPositive = item.shap >= 0;
          const absVal = Math.abs(item.shap);

          return (
            <div key={item.feature} className="grid grid-cols-12 items-center text-[11px]">
              {/* Feature Name */}
              <div className="col-span-4 text-right pr-3 font-medium text-slate-600 truncate">
                {item.feature}
              </div>

              {/* Bar Area (8 cols) */}
              <div className="col-span-8 flex items-center relative h-5">
                {/* Center Zero Line */}
                <div className="absolute left-[25%] top-0 bottom-0 w-px bg-slate-200 z-0" />

                {isPositive ? (
                  /* Positive Bar: Starts at 25% and expands right */
                  <div className="absolute left-[25%] flex items-center gap-1.5 z-10">
                    <div
                      className="h-3.5 rounded-r-md bg-gradient-to-r from-rose-400 to-rose-400 transition-all duration-700"
                      style={{ width: `${(absVal / maxVal) * 140}px` }}
                    />
                    <span className="text-[10px] font-mono font-medium text-slate-600">
                      {item.shap > 0 ? `${item.shap.toFixed(2)}` : '0.00'}
                    </span>
                  </div>
                ) : (
                  /* Negative Bar: Expands to the left from 25% */
                  <div className="absolute right-[75%] flex items-center flex-row-reverse gap-1.5 z-10">
                    <div
                      className="h-3.5 rounded-l-md bg-gradient-to-l from-blue-400 to-blue-500 transition-all duration-700"
                      style={{ width: `${(absVal / maxVal) * 140}px` }}
                    />
                    <span className="text-[10px] font-mono font-medium text-slate-600">
                      {item.shap.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* X-Axis Scale & Subtitle */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
          <div className="grid grid-cols-12 text-[9px] font-mono text-slate-400">
            <div className="col-span-4" />
            <div className="col-span-8 flex justify-between pr-4">
              <span>-0.2</span>
              <span>0.0</span>
              <span>0.2</span>
              <span>0.4</span>
              <span>0.6</span>
            </div>
          </div>
          <div className="text-center text-[10px] text-slate-400 font-medium">
            SHAP Impact on CAD Risk (Higher = More Risk)
          </div>
        </div>
      </div>
    </div>
  );
}
