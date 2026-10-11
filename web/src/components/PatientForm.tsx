import { useState } from 'react';
import { usePatientStore } from '../store/store';
import { apiClient } from '../api/client';
import {
  User,
  HeartPulse,
  Activity,
  Beaker,
  Scale,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from 'lucide-react';

const MOCK_POSITIVE = {
  Age: 61,
  Weight: 90,
  Length: 175,
  Sex: 1,
  BMI: 29.38,
  DM: 0,
  HTN: 1,
  'Current Smoker': 1,
  'EX-Smoker': 0,
  FH: 0,
  Obesity: 1,
  CRF: 0,
  CVA: 0,
  'Airway disease': 0,
  'Thyroid Disease': 0,
  CHF: 0,
  DLP: 1,
  BP: 123,
  PR: 94,
  Edema: 0,
  'Weak Peripheral Pulse': 0,
  'Lung rales': 0,
  'Systolic Murmur': 0,
  'Diastolic Murmur': 0,
  'Typical Chest Pain': 1,
  Dyspnea: 0,
  'Function Class': 0,
  Atypical: 0,
  Nonanginal: 0,
  'Exertional CP': 0,
  'LowTH Ang': 0,
  'Q Wave': 0,
  'St Elevation': 0,
  'St Depression': 0,
  'T inversion': 0,
  LVH: 0,
  'Poor R Progression': 0,
  BBB: 0,
  FBS: 94,
  CR: 0.8,
  TG: 180,
  LDL: 167,
  HDL: 38.0,
  BUN: 12,
  ESR: 9,
  HB: 15.2,
  K: 4.6,
  Na: 141,
  WBC: 6800,
  Lymph: 35,
  Neut: 58,
  PLT: 245,
  'EF-TTE': 48,
  'Region RWMA': 0,
  VHD: 'N',
};

const MOCK_NEGATIVE = {
  Age: 35,
  Weight: 65,
  Length: 170,
  Sex: 0,
  BMI: 22.49,
  DM: 0,
  HTN: 0,
  'Current Smoker': 0,
  'EX-Smoker': 0,
  FH: 0,
  Obesity: 0,
  CRF: 0,
  CVA: 0,
  'Airway disease': 0,
  'Thyroid Disease': 0,
  CHF: 0,
  DLP: 0,
  BP: 120,
  PR: 70,
  Edema: 0,
  'Weak Peripheral Pulse': 0,
  'Lung rales': 0,
  'Systolic Murmur': 0,
  'Diastolic Murmur': 0,
  'Typical Chest Pain': 0,
  Dyspnea: 0,
  'Function Class': 0,
  Atypical: 0,
  Nonanginal: 0,
  'Exertional CP': 0,
  'LowTH Ang': 0,
  'Q Wave': 0,
  'St Elevation': 0,
  'St Depression': 0,
  'T inversion': 0,
  LVH: 0,
  'Poor R Progression': 0,
  BBB: 0,
  FBS: 85,
  CR: 0.8,
  TG: 120,
  LDL: 90,
  HDL: 55.0,
  BUN: 12,
  ESR: 5,
  HB: 14.0,
  K: 4.2,
  Na: 138,
  WBC: 6000,
  Lymph: 30,
  Neut: 60,
  PLT: 200,
  'EF-TTE': 60,
  'Region RWMA': 0,
  VHD: 'N',
};

export function PatientForm() {
  const { patient, setPatientData, setPrediction, setLoading, setError, isLoading } = usePatientStore();
  const [activeProfile, setActiveProfile] = useState<'high' | 'normal' | null>('high');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSelectProfile = (type: 'high' | 'normal') => {
    setActiveProfile(type);
    if (type === 'high') {
      setPatientData(MOCK_POSITIVE);
    } else {
      setPatientData(MOCK_NEGATIVE);
    }
  };

  const handlePredict = async () => {
    if (Object.keys(patient).length === 0) {
      setError('Please enter patient clinical data or select a profile.');
      return;
    }

    setLoading(true);
    setError(null);

    const baselineDefaults = {
      Age: 55,
      Sex: 1,
      BMI: 26.5,
      BP: 120,
      PR: 75,
      FBS: 95,
      CR: 0.8,
      TG: 150,
      LDL: 110,
      HDL: 45,
      HB: 14.5,
      K: 4.4,
      Na: 140,
      WBC: 6500,
      'EF-TTE': 55,
      'St Depression': 0,
      'T inversion': 0,
    };

    const payload = {
      ...baselineDefaults,
      ...patient,
    };

    try {
      const { data, error } = await apiClient.POST('/api/predict', {
        body: payload as any,
      });

      if (error) {
        let msg = 'Validation Error';
        if (typeof error === 'string') {
          msg = error;
        } else if ((error as any).detail) {
          const detail = (error as any).detail;
          msg = Array.isArray(detail)
            ? detail.map((d: any) => `${d.loc ? d.loc[d.loc.length - 1] : 'Field'}: ${d.msg}`).join('; ')
            : String(detail);
        } else {
          msg = JSON.stringify(error);
        }
        setError(msg);
      } else if (data) {
        setPrediction(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Analysis Engine');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setActiveProfile(null);
    let numValue = value === '' ? undefined : Number(value);
    if (numValue !== undefined && ['Sex', 'St Depression', 'T inversion'].includes(field)) {
      numValue = Math.min(1, Math.max(0, Math.round(numValue)));
    }
    setPatientData({ [field]: numValue });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Card Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
          <User className="w-5 h-5 text-teal-700" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 leading-tight">Patient Parameters</h2>
          <p className="text-xs text-slate-500">Enter clinical details to analyze CAD risk.</p>
        </div>
      </div>

      {/* Quick Load Profile Section */}
      <div className="flex flex-col gap-1.5 pt-1">
        <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3 h-3 text-slate-400" />
          Quick Load Profile
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSelectProfile('high')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${
              activeProfile === 'high'
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>High Risk</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectProfile('normal')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer border ${
              activeProfile === 'normal'
                ? 'bg-[#0f766e] border-[#0f766e] text-white shadow-sm'
                : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Normal</span>
          </button>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-700">Demographics</span>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Age */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Age (Years)
            </label>
            <input
              type="number"
              value={patient.Age ?? ''}
              onChange={(e) => handleInputChange('Age', e.target.value)}
              placeholder="61"
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none"
            />
          </div>

          {/* Sex */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Sex (0=F, 1=M)
            </label>
            <select
              value={patient.Sex ?? 1}
              onChange={(e) => handleInputChange('Sex', e.target.value)}
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none cursor-pointer"
            >
              <option value={1}>1 (Male)</option>
              <option value={0}>0 (Female)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinical Inputs Section */}
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-700">Clinical Inputs</span>
        <div className="grid grid-cols-2 gap-2.5">
          {/* BMI */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <Scale className="w-3 h-3 text-teal-600" />
              BMI (kg/m²)
            </label>
            <input
              type="number"
              step="0.01"
              value={patient.BMI ?? ''}
              onChange={(e) => handleInputChange('BMI', e.target.value)}
              placeholder="29.38"
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none"
            />
          </div>

          {/* Blood Pressure */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <HeartPulse className="w-3 h-3 text-rose-500" />
              Blood Pressure (mmHg)
            </label>
            <input
              type="number"
              value={patient.BP ?? ''}
              onChange={(e) => handleInputChange('BP', e.target.value)}
              placeholder="123"
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none"
            />
          </div>

          {/* Pulse Rate */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-500" />
              Pulse Rate (bpm)
            </label>
            <input
              type="number"
              value={patient.PR ?? ''}
              onChange={(e) => handleInputChange('PR', e.target.value)}
              placeholder="94"
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none"
            />
          </div>

          {/* LDL Chol */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <Beaker className="w-3 h-3 text-rose-500" />
              LDL Chol. (mg/dL)
            </label>
            <input
              type="number"
              value={patient.LDL ?? ''}
              onChange={(e) => handleInputChange('LDL', e.target.value)}
              placeholder="167"
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none"
            />
          </div>

          {/* Fasting Sugar */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <Beaker className="w-3 h-3 text-teal-600" />
              Fasting Sugar (mg/dL)
            </label>
            <input
              type="number"
              value={patient.FBS ?? ''}
              onChange={(e) => handleInputChange('FBS', e.target.value)}
              placeholder="94"
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none"
            />
          </div>

          {/* ST Depression */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <Activity className="w-3 h-3 text-teal-600" />
              ST Dep. (0/1)
            </label>
            <select
              value={patient['St Depression'] ?? 0}
              onChange={(e) => handleInputChange('St Depression', e.target.value)}
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none cursor-pointer"
            >
              <option value={0}>0 (No)</option>
              <option value={1}>1 (Yes)</option>
            </select>
          </div>

          {/* T Inversion */}
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] text-slate-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              T Inversion (0/1)
            </label>
            <select
              value={patient['T inversion'] ?? 0}
              onChange={(e) => handleInputChange('T inversion', e.target.value)}
              className="bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/80 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium transition-all outline-none cursor-pointer"
            >
              <option value={0}>0 (No)</option>
              <option value={1}>1 (Yes)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Accordion Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 px-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/60 text-slate-500 hover:text-slate-700 text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">✕</span> Advanced Inputs (Auto-computed)
          </span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 space-y-1.5">
            <p className="font-medium text-slate-700">Auto-Imputed Biomarkers & ECG:</p>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Creatinine (0.8 mg/dL), Triglycerides (150 mg/dL), HDL (45 mg/dL), Ejection Fraction (55%), Hemoglobin (14.5 g/dL), Electrolytes & RWMA are automatically imputed using population baselines.
            </p>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="mt-auto pt-2">
        <button
          type="button"
          onClick={handlePredict}
          disabled={isLoading || Object.keys(patient).length === 0}
          className="w-full bg-gradient-to-r from-[#0f766e] to-[#0891b2] hover:from-[#115e59] hover:to-[#0e7490] text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Patient Data...</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              <span>Run CardioVision Analysis</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
