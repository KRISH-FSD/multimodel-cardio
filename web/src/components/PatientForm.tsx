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
  Flame,
  CheckCircle2,
  Stethoscope,
  TestTube,
  ClipboardList,
  Sparkles,
  RotateCcw,
  LayoutGrid,
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

type ParamTab = 'vitals' | 'labs' | 'history' | 'compact';

export function PatientForm() {
  const { patient, setPatientData, setPrediction, setLoading, setError, isLoading, reset } = usePatientStore();
  const [activeProfile, setActiveProfile] = useState<'high' | 'normal' | null>('high');
  const [activeTab, setActiveTab] = useState<ParamTab>('vitals');
  const [showImputeTooltip, setShowImputeTooltip] = useState(false);

  const handleSelectProfile = (type: 'high' | 'normal') => {
    setActiveProfile(type);
    if (type === 'high') {
      setPatientData(MOCK_POSITIVE);
    } else {
      setPatientData(MOCK_NEGATIVE);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setActiveProfile(null);
    let numValue = value === '' ? undefined : Number(value);
    if (numValue !== undefined && ['Sex', 'St Depression', 'T inversion', 'Typical Chest Pain', 'HTN', 'Current Smoker', 'DM', 'FH'].includes(field)) {
      numValue = Math.min(1, Math.max(0, Math.round(numValue)));
    }
    setPatientData({ [field]: numValue });
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

  // Helper chips for clinical values
  const getBpBadge = (bp?: number | null) => {
    if (!bp) return null;
    if (bp >= 130) return <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">Stage 1+</span>;
    if (bp >= 120) return <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">Elevated</span>;
    return <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">Normal</span>;
  };

  const getLdlBadge = (ldl?: number | null) => {
    if (!ldl) return null;
    if (ldl >= 160) return <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">High Risk</span>;
    if (ldl >= 100) return <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">Borderline</span>;
    return <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">Optimal</span>;
  };

  const getBmiBadge = (bmi?: number | null) => {
    if (!bmi) return null;
    if (bmi >= 30) return <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">Obese</span>;
    if (bmi >= 25) return <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">Overweight</span>;
    return <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">Normal</span>;
  };

  return (
    <div className="flex flex-col h-full justify-between gap-2.5 select-none text-slate-800">
      {/* ── 1. Compact Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/80">
            <User className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-900 leading-tight">Patient Parameters</h2>
              <span className="text-[9px] font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200/60 font-mono">
                PRN-1042
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Clinical markers for multi-vessel CAD AI</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            reset();
            setActiveProfile(null);
          }}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Reset Parameters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── 2. Quick Load Profiles (Segmented Switcher) ── */}
      <div className="bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/70 grid grid-cols-2 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectProfile('high')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
            activeProfile === 'high'
              ? 'bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>High Risk Preset</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectProfile('normal')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
            activeProfile === 'normal'
              ? 'bg-[#0f766e] text-white border border-[#0f766e] shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Normal Baseline</span>
        </button>
      </div>

      {/* ── 3. Categorized Parameter Sub-Tabs (Scroll-Free Architecture) ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === 'vitals'
                ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <Stethoscope className="w-3 h-3 text-teal-600" />
            <span>Vitals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('labs')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === 'labs'
                ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <TestTube className="w-3 h-3 text-teal-600" />
            <span>Labs & ECG</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <ClipboardList className="w-3 h-3 text-teal-600" />
            <span>History</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('compact')}
          className={`p-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'compact'
              ? 'bg-slate-800 text-white shadow-2xs'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="All Parameters (High-Density View)"
        >
          <LayoutGrid className="w-3 h-3" />
          <span className="text-[9px]">All</span>
        </button>
      </div>

      {/* ── 4. Main Tab Body (Strictly Sized, ZERO Scrolling) ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-start">
        {/* TAB 1: VITALS & DEMOGRAPHICS */}
        {activeTab === 'vitals' && (
          <div className="space-y-2 animate-in fade-in-50 duration-150">
            {/* Age & Sex Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-2.5 h-2.5 text-slate-400" /> Age
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Years</span>
                </div>
                <input
                  type="number"
                  value={patient.Age ?? ''}
                  onChange={(e) => handleInputChange('Age', e.target.value)}
                  placeholder="61"
                  className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span>Sex</span>
                  <span className="text-[9px] text-slate-400 font-mono">0=F, 1=M</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleInputChange('Sex', 1)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      (patient.Sex ?? 1) === 1
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('Sex', 0)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      patient.Sex === 0
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* BMI & BP Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Scale className="w-2.5 h-2.5 text-teal-600" /> BMI
                  </span>
                  {getBmiBadge(patient.BMI)}
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={patient.BMI ?? ''}
                  onChange={(e) => handleInputChange('BMI', e.target.value)}
                  placeholder="29.38"
                  className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <HeartPulse className="w-2.5 h-2.5 text-rose-500" /> BP
                  </span>
                  {getBpBadge(patient.BP)}
                </div>
                <input
                  type="number"
                  value={patient.BP ?? ''}
                  onChange={(e) => handleInputChange('BP', e.target.value)}
                  placeholder="123"
                  className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold outline-none transition-all"
                />
              </div>
            </div>

            {/* Pulse Rate & Smoker Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-rose-500" /> Pulse (bpm)
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">60-100</span>
                </div>
                <input
                  type="number"
                  value={patient.PR ?? ''}
                  onChange={(e) => handleInputChange('PR', e.target.value)}
                  placeholder="94"
                  className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span>Current Smoker</span>
                  <span className="text-[9px] text-slate-400 font-mono">0 / 1</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleInputChange('Current Smoker', 0)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      (patient['Current Smoker'] ?? 0) === 0
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('Current Smoker', 1)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      patient['Current Smoker'] === 1
                        ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LABS & ECG */}
        {activeTab === 'labs' && (
          <div className="space-y-2 animate-in fade-in-50 duration-150">
            {/* LDL & Fasting Sugar Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Beaker className="w-2.5 h-2.5 text-rose-500" /> LDL Chol.
                  </span>
                  {getLdlBadge(patient.LDL)}
                </div>
                <input
                  type="number"
                  value={patient.LDL ?? ''}
                  onChange={(e) => handleInputChange('LDL', e.target.value)}
                  placeholder="167"
                  className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Beaker className="w-2.5 h-2.5 text-teal-600" /> Sugar (FBS)
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">mg/dL</span>
                </div>
                <input
                  type="number"
                  value={patient.FBS ?? ''}
                  onChange={(e) => handleInputChange('FBS', e.target.value)}
                  placeholder="94"
                  className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold outline-none transition-all"
                />
              </div>
            </div>

            {/* ST Depression & T Inversion Binary Switches */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-teal-600" /> ST Dep.
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">ECG</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleInputChange('St Depression', 0)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      (patient['St Depression'] ?? 0) === 0
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    0 (No)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('St Depression', 1)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      patient['St Depression'] === 1
                        ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    1 (Yes)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-500" /> T Inversion
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">ECG</span>
                </div>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleInputChange('T inversion', 0)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      (patient['T inversion'] ?? 0) === 0
                        ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    0 (No)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('T inversion', 1)}
                    className={`py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      patient['T inversion'] === 1
                        ? 'bg-rose-50 text-rose-700 shadow-2xs border border-rose-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    1 (Yes)
                  </button>
                </div>
              </div>
            </div>

            {/* Ejection Fraction (EF-TTE) */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <HeartPulse className="w-2.5 h-2.5 text-rose-500" /> EF-TTE (Ejection Fraction %)
                </span>
                <span className="text-[9px] text-slate-500 font-mono">Normal ≥50%</span>
              </div>
              <input
                type="number"
                value={patient['EF-TTE'] ?? ''}
                onChange={(e) => handleInputChange('EF-TTE', e.target.value)}
                placeholder="48"
                className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* TAB 3: CLINICAL HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-1.5 animate-in fade-in-50 duration-150">
            {/* Typical Chest Pain */}
            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[10px]">
                <div className="font-semibold text-slate-800">Typical Chest Pain</div>
                <div className="text-slate-400 text-[9px]">Substernal chest tightness on exertion</div>
              </div>
              <div className="grid grid-cols-2 gap-1 w-28 bg-slate-200/60 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleInputChange('Typical Chest Pain', 0)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    (patient['Typical Chest Pain'] ?? 0) === 0
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('Typical Chest Pain', 1)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    patient['Typical Chest Pain'] === 1
                      ? 'bg-rose-500 text-white shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {/* Hypertension */}
            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[10px]">
                <div className="font-semibold text-slate-800">Hypertension (HTN)</div>
                <div className="text-slate-400 text-[9px]">Documented chronic elevated BP</div>
              </div>
              <div className="grid grid-cols-2 gap-1 w-28 bg-slate-200/60 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleInputChange('HTN', 0)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    (patient.HTN ?? 0) === 0 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('HTN', 1)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    patient.HTN === 1 ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {/* Diabetes Mellitus */}
            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[10px]">
                <div className="font-semibold text-slate-800">Diabetes (DM)</div>
                <div className="text-slate-400 text-[9px]">Diagnosed Type 1 or Type 2 DM</div>
              </div>
              <div className="grid grid-cols-2 gap-1 w-28 bg-slate-200/60 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleInputChange('DM', 0)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    (patient.DM ?? 0) === 0 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('DM', 1)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    patient.DM === 1 ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {/* Family History */}
            <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-[10px]">
                <div className="font-semibold text-slate-800">Family History (FH)</div>
                <div className="text-slate-400 text-[9px]">Premature coronary disease in 1st degree</div>
              </div>
              <div className="grid grid-cols-2 gap-1 w-28 bg-slate-200/60 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleInputChange('FH', 0)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    (patient.FH ?? 0) === 0 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('FH', 1)}
                  className={`py-0.5 text-[9px] font-semibold rounded transition-all cursor-pointer ${
                    patient.FH === 1 ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPACT ALL-IN-ONE (Zero Scrolling Medical Cockpit) */}
        {activeTab === 'compact' && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 animate-in fade-in-50 duration-150 text-[10px]">
            {/* Age */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">Age</span>
              <input
                type="number"
                value={patient.Age ?? ''}
                onChange={(e) => handleInputChange('Age', e.target.value)}
                placeholder="61"
                className="w-12 text-right bg-white px-1 py-0.5 rounded border border-slate-200 font-mono font-bold text-xs outline-none"
              />
            </div>

            {/* Sex */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">Sex</span>
              <select
                value={patient.Sex ?? 1}
                onChange={(e) => handleInputChange('Sex', e.target.value)}
                className="bg-white px-1 py-0.5 rounded border border-slate-200 font-medium text-[10px] outline-none"
              >
                <option value={1}>Male (1)</option>
                <option value={0}>Female (0)</option>
              </select>
            </div>

            {/* BMI */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">BMI</span>
              <input
                type="number"
                step="0.1"
                value={patient.BMI ?? ''}
                onChange={(e) => handleInputChange('BMI', e.target.value)}
                placeholder="29.4"
                className="w-14 text-right bg-white px-1 py-0.5 rounded border border-slate-200 font-mono font-bold text-xs outline-none"
              />
            </div>

            {/* BP */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">BP</span>
              <input
                type="number"
                value={patient.BP ?? ''}
                onChange={(e) => handleInputChange('BP', e.target.value)}
                placeholder="123"
                className="w-12 text-right bg-white px-1 py-0.5 rounded border border-slate-200 font-mono font-bold text-xs outline-none"
              />
            </div>

            {/* Pulse */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">Pulse</span>
              <input
                type="number"
                value={patient.PR ?? ''}
                onChange={(e) => handleInputChange('PR', e.target.value)}
                placeholder="94"
                className="w-12 text-right bg-white px-1 py-0.5 rounded border border-slate-200 font-mono font-bold text-xs outline-none"
              />
            </div>

            {/* LDL */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">LDL</span>
              <input
                type="number"
                value={patient.LDL ?? ''}
                onChange={(e) => handleInputChange('LDL', e.target.value)}
                placeholder="167"
                className="w-12 text-right bg-white px-1 py-0.5 rounded border border-slate-200 font-mono font-bold text-xs outline-none"
              />
            </div>

            {/* FBS */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">FBS</span>
              <input
                type="number"
                value={patient.FBS ?? ''}
                onChange={(e) => handleInputChange('FBS', e.target.value)}
                placeholder="94"
                className="w-12 text-right bg-white px-1 py-0.5 rounded border border-slate-200 font-mono font-bold text-xs outline-none"
              />
            </div>

            {/* Chest Pain */}
            <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
              <span className="text-slate-600 font-medium">Angina</span>
              <select
                value={patient['Typical Chest Pain'] ?? 1}
                onChange={(e) => handleInputChange('Typical Chest Pain', e.target.value)}
                className="bg-white px-1 py-0.5 rounded border border-slate-200 font-medium text-[10px] outline-none"
              >
                <option value={1}>Yes (1)</option>
                <option value={0}>No (0)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Auto-Imputed Status Bar & Popover ── */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowImputeTooltip(!showImputeTooltip)}
          className="w-full py-1 px-2.5 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100/70 text-slate-500 hover:text-slate-700 text-[10px] flex items-center justify-between transition-all cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3 h-3 text-teal-600" />
            <span>Auto-Imputed Biomarkers (40+ features)</span>
          </span>
          <span className="text-[9px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/80 font-mono">
            Active
          </span>
        </button>

        {showImputeTooltip && (
          <div className="absolute bottom-full left-0 right-0 mb-1.5 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-[10px] leading-relaxed z-50">
            <div className="font-semibold text-teal-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Population Baseline Imputation
            </div>
            <p className="text-slate-300">
              Secondary clinical variables (Creatinine 0.8, TG 150, HDL 45, Hemoglobin 14.5, RWMA, ESR, WBC) are dynamically filled with verified population medians.
            </p>
          </div>
        )}
      </div>

      {/* ── 6. Primary Action Button ── */}
      <div className="shrink-0 pt-0.5">
        <button
          type="button"
          onClick={handlePredict}
          disabled={isLoading || Object.keys(patient).length === 0}
          className="w-full bg-gradient-to-r from-[#0f766e] via-[#0d9488] to-[#0891b2] hover:from-[#115e59] hover:to-[#0e7490] text-white font-semibold py-2.5 px-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Evaluating Coronary Risk...</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 text-white" />
              <span>Run CardioVision Analysis</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/80" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
