import { useMemo } from 'react';
import { usePatientStore } from '../store/store';
import type { ArteryId } from '../store/store';

function formatClinicalFeatureValue(
  feature: string,
  patient: Record<string, any>,
  itemVal?: number
): string | null {
  // Try raw patient lookup first, then fallback to itemVal from API
  let rawVal = patient[feature];
  if (rawVal === undefined) {
    // Check aliases
    const aliasMap: Record<string, string> = {
      'Typical Chest Pain': 'Typical_Chest_Pain',
      'St Elevation': 'St_Elevation',
      'St Depression': 'St_Depression',
      'T inversion': 'Tinversion',
      'Tinversion': 'T_inversion',
      'Poor R Progression': 'Poor_R_Progression',
      'Current Smoker': 'Current_Smoker',
      'EX-Smoker': 'EX_Smoker',
      'Airway disease': 'Airway_disease',
      'Thyroid Disease': 'Thyroid_Disease',
      'Q Wave': 'Q_Wave',
      'EF-TTE': 'EF_TTE',
      'Region RWMA': 'Region_RWMA',
    };
    const mapped = aliasMap[feature];
    if (mapped) rawVal = patient[mapped];
  }

  if (rawVal === undefined && itemVal !== undefined) {
    rawVal = itemVal;
  }

  if (rawVal === undefined || rawVal === null) return null;

  // Binary flags
  const binaryFeatures = [
    'Typical Chest Pain',
    'HTN',
    'DM',
    'Current Smoker',
    'EX-Smoker',
    'FH',
    'Obesity',
    'CRF',
    'CVA',
    'Airway disease',
    'Thyroid Disease',
    'CHF',
    'DLP',
    'Edema',
    'Weak Peripheral Pulse',
    'Lung rales',
    'Systolic Murmur',
    'Diastolic Murmur',
    'Dyspnea',
    'Atypical',
    'Nonanginal',
    'Exertional CP',
    'LowTH Ang',
    'Q Wave',
    'St Elevation',
    'St Depression',
    'T inversion',
    'Tinversion',
    'LVH',
    'Poor R Progression',
  ];

  if (binaryFeatures.includes(feature) || rawVal === 0 || rawVal === 1) {
    if (rawVal === 1 || rawVal === '1' || rawVal === 'Yes') return 'Yes';
    if (rawVal === 0 || rawVal === '0' || rawVal === 'No') return 'No';
  }

  // Units
  if (feature === 'Age') return `${rawVal} yrs`;
  if (feature === 'BP') return `${rawVal} mmHg`;
  if (feature === 'PR') return `${rawVal} bpm`;
  if (feature === 'EF-TTE' || feature === 'EF_TTE') return `${rawVal}%`;
  if (['TG', 'LDL', 'HDL', 'FBS', 'CR', 'BUN'].includes(feature)) return `${rawVal} mg/dL`;
  if (feature === 'HB') return `${rawVal} g/dL`;
  if (feature === 'ESR') return `${rawVal} mm/hr`;
  if (['K', 'Na'].includes(feature)) return `${rawVal} mEq/L`;
  if (feature === 'WBC') return `${rawVal} /µL`;
  if (feature === 'BMI') return `${rawVal} kg/m²`;
  if (feature === 'Weight') return `${rawVal} kg`;
  if (feature === 'Length') return `${rawVal} cm`;
  if (feature === 'Region RWMA') return `${rawVal} regions`;

  return typeof rawVal === 'number' ? `${rawVal}` : String(rawVal);
}

export function ShapWaterfall() {
  const { prediction, patient, focusedVessel, setFocusedVessel } = usePatientStore();

  const activeTarget: 'cad' | 'lad' | 'lcx' | 'rca' =
    focusedVessel && ['lad', 'lcx', 'rca'].includes(focusedVessel)
      ? (focusedVessel as ArteryId)
      : 'cad';

  const targetLabel =
    activeTarget === 'lad'
      ? 'LAD (Anterior) Attributions'
      : activeTarget === 'lcx'
      ? 'LCX (Lateral) Attributions'
      : activeTarget === 'rca'
      ? 'RCA (Inferior) Attributions'
      : 'CAD Global Attributions';

  // Extract real SHAP features for the active target
  const { displayFeatures, maxVal } = useMemo(() => {
    const raw = prediction?.explanations?.[activeTarget]?.top || [];

    if (raw.length === 0) {
      return { displayFeatures: [], maxVal: 0.15 };
    }

    const pos = raw.filter((f) => f.shap > 0).sort((a, b) => b.shap - a.shap);
    const neg = raw.filter((f) => f.shap < 0).sort((a, b) => a.shap - b.shap);

    let selected: typeof raw = [];
    if (pos.length > 0 && neg.length > 0) {
      selected = [...pos.slice(0, 3), ...neg.slice(0, 2)];
    } else {
      // Sort by absolute magnitude if only one polarity is present
      selected = [...raw].sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap)).slice(0, 5);
    }

    const max = Math.max(0.12, ...selected.map((f) => Math.abs(f.shap)));
    return { displayFeatures: selected, maxVal: max };
  }, [prediction, activeTarget]);

  if (!prediction) {
    return (
      <div className="flex flex-col gap-1.5 select-none w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[11px] font-bold text-slate-900 leading-tight">
              TreeSHAP Feature Attributions
            </h4>
            <p className="text-[9px] text-slate-400">Additive feature importance per territory</p>
          </div>
          <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            Standby
          </span>
        </div>

        {/* Standby Placeholder */}
        <div className="py-4 px-2 rounded-lg bg-slate-50/80 border border-dashed border-slate-200/90 text-center flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] text-slate-600 font-semibold">TreeSHAP Explainability Awaiting Inference</p>
          <p className="text-[9px] text-slate-400 leading-tight">
            Run cardiovascular analysis to generate patient-specific risk factor attributions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 select-none w-full animate-in fade-in duration-300">
      {/* Header with Territory Pill Navigation */}
      <div className="flex items-center justify-between gap-1">
        <div className="min-w-0">
          <h4 className="text-[11px] font-bold text-slate-900 leading-tight truncate">
            {targetLabel}
          </h4>
          <p className="text-[8.5px] text-slate-400">
            {activeTarget === 'cad'
              ? 'Global CAD risk drivers'
              : `${activeTarget.toUpperCase()} territory model drivers`}
          </p>
        </div>

        {/* Interactive Territory Quick Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 shrink-0">
          <button
            type="button"
            onClick={() => setFocusedVessel(null)}
            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all cursor-pointer ${
              activeTarget === 'cad'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            CAD
          </button>
          <button
            type="button"
            onClick={() => setFocusedVessel('lad')}
            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all cursor-pointer ${
              activeTarget === 'lad'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            LAD
          </button>
          <button
            type="button"
            onClick={() => setFocusedVessel('lcx')}
            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all cursor-pointer ${
              activeTarget === 'lcx'
                ? 'bg-white text-teal-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            LCX
          </button>
          <button
            type="button"
            onClick={() => setFocusedVessel('rca')}
            className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition-all cursor-pointer ${
              activeTarget === 'rca'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            RCA
          </button>
        </div>
      </div>

      {/* Diverging Bar Chart */}
      <div className="space-y-1.5 pt-0.5">
        {displayFeatures.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-2">
            No significant attributions for this territory.
          </p>
        ) : (
          displayFeatures.map((item) => {
            const isPos = item.shap >= 0;
            const absVal = Math.abs(item.shap);
            const patientVal = formatClinicalFeatureValue(item.feature, patient, item.value);
            const barPct = Math.min(50, (absVal / maxVal) * 50);

            return (
              <div key={item.feature} className="flex items-center gap-2 text-[10px]">
                {/* Feature Name & Actual Measured Value */}
                <div className="w-[105px] shrink-0 truncate">
                  <span className="font-semibold text-slate-800 truncate block">
                    {item.feature}
                  </span>
                  {patientVal && (
                    <span className="text-[8.5px] text-slate-400 font-mono block leading-none">
                      Value: {patientVal}
                    </span>
                  )}
                </div>

                {/* Bipolar Diverging Bar Container with Center Axis */}
                <div className="flex-1 relative h-3 bg-slate-100/90 rounded-md overflow-hidden flex items-center">
                  {/* Center 0 Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300 z-10" />

                  {/* Left (Protective / Negative) Bar */}
                  {!isPos && (
                    <div
                      className="absolute right-1/2 top-0.5 bottom-0.5 rounded-l bg-teal-600 transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  )}

                  {/* Right (Risk / Positive) Bar */}
                  {isPos && (
                    <div
                      className="absolute left-1/2 top-0.5 bottom-0.5 rounded-r bg-rose-500 transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>

                {/* Numeric Attribution Value */}
                <div className="w-10 text-right font-mono text-[10px] font-bold shrink-0">
                  <span className={isPos ? 'text-rose-600' : 'text-teal-700'}>
                    {isPos ? `+${item.shap.toFixed(2)}` : item.shap.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Divergence Legend Bar */}
      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] font-mono text-slate-400">
        <span className="text-teal-700 font-semibold">◀ Lowers Stenosis Risk</span>
        <span className="text-slate-300 font-bold">| 0.0 |</span>
        <span className="text-rose-600 font-semibold">Elevates Risk ▶</span>
      </div>
    </div>
  );
}
