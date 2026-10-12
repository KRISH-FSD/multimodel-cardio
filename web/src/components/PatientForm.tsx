import React, { useState } from 'react';
import { usePatientStore } from '../store/store';
import { apiClient } from '../api/client';
import {
  User,
  HeartPulse,
  Activity,
  Beaker,
  Scale,
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';

// ── Sample clinical profiles ──────────────────────────────────────────────────
const MOCK_POSITIVE = {
  Age: 61, Weight: 90, Length: 175, Sex: 1, BMI: 29.38,
  DM: 0, HTN: 1, 'Current Smoker': 1, 'EX-Smoker': 0, FH: 0,
  Obesity: 1, CRF: 0, CVA: 0, 'Airway disease': 0, 'Thyroid Disease': 0,
  CHF: 0, DLP: 1, BP: 123, PR: 94, Edema: 0,
  'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0,
  'Diastolic Murmur': 0, 'Typical Chest Pain': 1, Dyspnea: 0,
  'Function Class': 0, Atypical: 0, Nonanginal: 0, 'Exertional CP': 0,
  'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0,
  'T inversion': 0, LVH: 0, 'Poor R Progression': 0, BBB: 0,
  FBS: 94, CR: 0.8, TG: 180, LDL: 167, HDL: 38.0, BUN: 12,
  ESR: 9, HB: 15.2, K: 4.6, Na: 141, WBC: 6800, Lymph: 35,
  Neut: 58, PLT: 245, 'EF-TTE': 48, 'Region RWMA': 0, VHD: 'N',
};

const MOCK_NEGATIVE = {
  Age: 35, Weight: 65, Length: 170, Sex: 0, BMI: 22.49,
  DM: 0, HTN: 0, 'Current Smoker': 0, 'EX-Smoker': 0, FH: 0,
  Obesity: 0, CRF: 0, CVA: 0, 'Airway disease': 0, 'Thyroid Disease': 0,
  CHF: 0, DLP: 0, BP: 120, PR: 70, Edema: 0,
  'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0,
  'Diastolic Murmur': 0, 'Typical Chest Pain': 0, Dyspnea: 0,
  'Function Class': 0, Atypical: 0, Nonanginal: 0, 'Exertional CP': 0,
  'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0,
  'T inversion': 0, LVH: 0, 'Poor R Progression': 0, BBB: 0,
  FBS: 85, CR: 0.8, TG: 120, LDL: 90, HDL: 55.0, BUN: 12,
  ESR: 5, HB: 14.0, K: 4.2, Na: 138, WBC: 6000, Lymph: 30,
  Neut: 60, PLT: 200, 'EF-TTE': 60, 'Region RWMA': 0, VHD: 'N',
};

// ── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Demographics', icon: User },
  { id: 2, label: 'Vitals & Measurements', icon: HeartPulse },
  { id: 3, label: 'Lab & ECG Results', icon: Beaker },
  { id: 4, label: 'Medical History', icon: ClipboardList },
];

export function PatientForm() {
  const {
    patient,
    setPatientData,
    setPrediction,
    setLoading,
    setError,
    isLoading,
    reset,
    toggleFormCollapsed,
    activePatient,
    addNotification,
  } = usePatientStore();

  const [activeProfile, setActiveProfile] = useState<'high' | 'normal' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const totalSteps = STEPS.length;
  const allStepsCompleted = completedSteps.size >= totalSteps;

  // ── Auto-calculate BMI when Weight and Length are present ───────────────────
  const autoBmi = React.useMemo(() => {
    if (patient.Weight && patient.Length && patient.Length > 50) {
      const heightM = patient.Length / 100;
      return Number((patient.Weight / (heightM * heightM)).toFixed(1));
    }
    return patient.BMI ?? null;
  }, [patient.Weight, patient.Length, patient.BMI]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectProfile = (type: 'high' | 'normal') => {
    setActiveProfile(type);
    setPatientData(type === 'high' ? MOCK_POSITIVE : MOCK_NEGATIVE);
    setCompletedSteps(new Set([1, 2, 3, 4]));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setActiveProfile(null);
    const numValue = value === '' ? undefined : Number(value);
    setPatientData({ [field]: numValue });
  };

  const handleBinaryChange = (field: string, value: number) => {
    setActiveProfile(null);
    setPatientData({ [field]: value });
  };

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handlePredict = async () => {
    if (Object.keys(patient).length === 0) {
      setError('Please fill in patient clinical data before running analysis.');
      return;
    }
    setLoading(true);
    setError(null);

    const baselineDefaults = {
      Age: 55, Sex: 1, BMI: autoBmi ?? 26.5, BP: 120, PR: 75,
      FBS: 95, CR: 0.8, TG: 150, LDL: 110, HDL: 45,
      HB: 14.5, K: 4.4, Na: 140, WBC: 6500, 'EF-TTE': 55,
      'St Depression': 0, 'T inversion': 0,
    };
    const payload = { ...baselineDefaults, ...patient };
    if (!payload.BMI && autoBmi) {
      payload.BMI = autoBmi;
    }

    try {
      const startTime = Date.now();
      const { data, error } = await apiClient.POST('/api/predict', { body: payload as any });

      // Ensure smooth telemetry loading display for at least 850ms so user can experience the animation
      const elapsed = Date.now() - startTime;
      if (elapsed < 850) {
        await new Promise((r) => setTimeout(r, 850 - elapsed));
      }

      if (error) {
        let msg = 'Validation Error';
        if (typeof error === 'string') msg = error;
        else if ((error as any).detail) {
          const detail = (error as any).detail;
          msg = Array.isArray(detail)
            ? detail.map((d: any) => `${d.loc ? d.loc[d.loc.length - 1] : 'Field'}: ${d.msg}`).join('; ')
            : String(detail);
        } else msg = JSON.stringify(error);
        setError(msg);
      } else if (data) {
        setPrediction(data);

        // Compute primary metrics for dynamic notification
        const cadProb = data.predictions?.cad?.probability ?? 0;
        const ladProb = data.predictions?.lad?.probability ?? 0;
        const lcxProb = data.predictions?.lcx?.probability ?? 0;
        const rcaProb = data.predictions?.rca?.probability ?? 0;

        let topVessel = 'LAD (Anterior)';
        if (rcaProb >= ladProb && rcaProb >= lcxProb) topVessel = 'RCA (Inferior)';
        else if (lcxProb >= ladProb) topVessel = 'LCX (Lateral)';

        const isHighRisk = cadProb >= 0.5;
        const patientPrn = activePatient?.prn || 'Patient';

        await addNotification({
          title: isHighRisk
            ? `High Risk CAD Alert: ${patientPrn}`
            : `CAD Assessment Complete: ${patientPrn}`,
          message: isHighRisk
            ? `CAD probability evaluated at ${(cadProb * 100).toFixed(1)}%. Suspected ${topVessel} territory stenosis (${(Math.max(ladProb, lcxProb, rcaProb) * 100).toFixed(1)}%). Immediate angiography recommended.`
            : `CAD probability evaluated at ${(cadProb * 100).toFixed(1)}% (Low-Moderate risk). Perfusion territory normal. Routine clinical monitoring recommended.`,
          type: isHighRisk ? 'critical' : 'success',
          patientId: activePatient?.id,
          patientPrn,
          predictionData: data,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Analysis Engine');
    } finally {
      setLoading(false);
    }
  };

  // ── Badges ─────────────────────────────────────────────────────────────────
  const getBpBadge = (bp?: number | null) => {
    if (!bp) return null;
    if (bp >= 130) return <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded">Stage 1+</span>;
    if (bp >= 120) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded">Elevated</span>;
    return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">Normal</span>;
  };

  const getBmiBadge = (bmiVal?: number | null) => {
    if (!bmiVal) return null;
    if (bmiVal >= 30) return <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded">Obese</span>;
    if (bmiVal >= 25) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded">Overweight</span>;
    return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">Normal</span>;
  };

  const getLdlBadge = (ldl?: number | null) => {
    if (!ldl) return null;
    if (ldl >= 160) return <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded">High</span>;
    if (ldl >= 100) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded">Borderline</span>;
    return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">Optimal</span>;
  };

  return (
    <div className="flex flex-col select-none text-slate-800 space-y-3">

      {/* ── Top Header with Reset & Collapse Buttons ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-200/70 text-[#0f766e]">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 leading-tight">Patient Clinical Data</h2>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Step-by-step risk parameter entry</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                reset();
                setActiveProfile(null);
                setCurrentStep(1);
                setCompletedSteps(new Set());
              }}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset form"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleFormCollapsed}
              className="p-1 text-slate-400 hover:text-[#0f766e] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
              title="Collapse panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Quick Profiles Bar ── */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 mb-2.5">
          <button
            type="button"
            onClick={() => handleSelectProfile('high')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeProfile === 'high'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
            }`}
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>High Risk Sample</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectProfile('normal')}
            className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeProfile === 'normal'
                ? 'bg-[#0f766e] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-teal-400" />
            <span>Normal Sample</span>
          </button>
        </div>

        {/* ── Step Progress Indicator ── */}
        <div className="flex flex-col items-center gap-1.5 mb-2">
          {/* Dot row with connecting lines */}
          <div className="flex items-center w-full px-4">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isDone = completedSteps.has(step.id);
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    title={step.label}
                    className="cursor-pointer group flex items-center justify-center focus:outline-none"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                        isActive
                          ? 'bg-[#0f766e] border-[#0f766e] text-white ring-2 ring-[#0f766e]/20 shadow-xs'
                          : isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-slate-300 text-slate-400 group-hover:border-[#0f766e]/50'
                      }`}
                    >
                      <span>{step.id}</span>
                    </div>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${
                        completedSteps.has(step.id) ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Current Step Name Centered (Directly above inputs, no gap) */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              {STEPS[currentStep - 1].label}
            </span>
            <span className="text-[10px] font-semibold text-[#0f766e] bg-teal-50 border border-teal-200/60 px-1.5 py-0.2 rounded-full font-mono">
              {currentStep}/{totalSteps}
            </span>
          </div>
        </div>
      </div>

      {/* ── Active Step Inputs (Directly below title, without empty gap) ── */}
      <div>

        {/* ── STEP 1: Demographics ── */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Age */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Patient Age</span>
                  <span className="text-[10px] text-slate-400 font-mono">yrs</span>
                </label>
                <input
                  type="number"
                  value={patient.Age ?? ''}
                  onChange={(e) => handleInputChange('Age', e.target.value)}
                  placeholder="e.g. 55"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Biological Sex (NO tick icon) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biological Sex
                </label>
                <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 h-9">
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('Sex', 1)}
                    className={`flex items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      patient.Sex === 1
                        ? 'bg-[#0f766e] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('Sex', 0)}
                    className={`flex items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      patient.Sex === 0
                        ? 'bg-[#0f766e] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Weight and Height */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Weight</span>
                  <span className="text-[10px] text-slate-400 font-mono">kg</span>
                </label>
                <input
                  type="number"
                  value={patient.Weight ?? ''}
                  onChange={(e) => handleInputChange('Weight', e.target.value)}
                  placeholder="e.g. 75"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Height</span>
                  <span className="text-[10px] text-slate-400 font-mono">cm</span>
                </label>
                <input
                  type="number"
                  value={patient.Length ?? ''}
                  onChange={(e) => handleInputChange('Length', e.target.value)}
                  placeholder="e.g. 170"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Calculated BMI */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-xs font-medium text-slate-600">Calculated BMI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {autoBmi ? `${autoBmi} kg/m²` : '—'}
                </span>
                {getBmiBadge(autoBmi)}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Vitals & Measurements ── */}
        {currentStep === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Blood Pressure */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Systolic BP</span>
                  {getBpBadge(patient.BP)}
                </div>
                <input
                  type="number"
                  value={patient.BP ?? ''}
                  onChange={(e) => handleInputChange('BP', e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Target: &lt;120 mmHg</span>
              </div>

              {/* Heart Rate */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Heart Rate</span>
                  <span className="text-[10px] text-slate-400 font-mono">bpm</span>
                </div>
                <input
                  type="number"
                  value={patient.PR ?? ''}
                  onChange={(e) => handleInputChange('PR', e.target.value)}
                  placeholder="e.g. 72"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Normal: 60–100 bpm</span>
              </div>
            </div>

            {/* BMI & Smoking Status (NO tick icon) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>BMI Index</span>
                  {getBmiBadge(patient.BMI ?? autoBmi)}
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={patient.BMI ?? autoBmi ?? ''}
                  onChange={(e) => handleInputChange('BMI', e.target.value)}
                  placeholder="e.g. 26.5"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tobacco Smoker
                </label>
                <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 h-9">
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('Current Smoker', 0)}
                    className={`flex items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      (patient['Current Smoker'] ?? 0) === 0
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('Current Smoker', 1)}
                    className={`flex items-center justify-center rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      patient['Current Smoker'] === 1
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Lab & ECG Results ── */}
        {currentStep === 3 && (
          <div className="space-y-2.5">
            {/* 3 Numeric Fields: LDL, FBS, Echo EF */}
            <div className="grid grid-cols-3 gap-2">
              {/* LDL */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>LDL</span>
                  {getLdlBadge(patient.LDL)}
                </div>
                <input
                  type="number"
                  value={patient.LDL ?? ''}
                  onChange={(e) => handleInputChange('LDL', e.target.value)}
                  placeholder="110"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">mg/dL</span>
              </div>

              {/* FBS */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>FBS</span>
                  <span className="text-[10px] text-slate-400 font-mono">&lt;100</span>
                </div>
                <input
                  type="number"
                  value={patient.FBS ?? ''}
                  onChange={(e) => handleInputChange('FBS', e.target.value)}
                  placeholder="95"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">mg/dL</span>
              </div>

              {/* Echo EF */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>Echo EF</span>
                  <span className="text-[10px] text-slate-400 font-mono">&ge;50%</span>
                </div>
                <input
                  type="number"
                  value={patient['EF-TTE'] ?? ''}
                  onChange={(e) => handleInputChange('EF-TTE', e.target.value)}
                  placeholder="55"
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">%</span>
              </div>
            </div>

            {/* 2 ECG Findings (NO tick icon) */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {/* ST Depression */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-2">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  ST Depression (ECG)
                </span>
                <div className="grid grid-cols-2 bg-slate-200/70 p-0.5 rounded-md h-7">
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('St Depression', 0)}
                    className={`flex items-center justify-center rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      (patient['St Depression'] ?? 0) === 0
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('St Depression', 1)}
                    className={`flex items-center justify-center rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      patient['St Depression'] === 1
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Present
                  </button>
                </div>
              </div>

              {/* T-Wave Inversion */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-2">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  T-Wave Inversion (ECG)
                </span>
                <div className="grid grid-cols-2 bg-slate-200/70 p-0.5 rounded-md h-7">
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('T inversion', 0)}
                    className={`flex items-center justify-center rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      (patient['T inversion'] ?? 0) === 0
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBinaryChange('T inversion', 1)}
                    className={`flex items-center justify-center rounded text-[11px] font-semibold transition-all cursor-pointer ${
                      patient['T inversion'] === 1
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Present
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Medical History (NO tick icon) ── */}
        {currentStep === 4 && (
          <div className="space-y-2">
            {[
              {
                field: 'Typical Chest Pain',
                label: 'Anginal Chest Pain',
                desc: 'Substernal exertional pain',
              },
              {
                field: 'HTN',
                label: 'Chronic Hypertension',
                desc: 'History of high BP',
              },
              {
                field: 'DM',
                label: 'Diabetes Mellitus',
                desc: 'Diagnosed T1/T2 diabetes',
              },
              {
                field: 'FH',
                label: 'Family CAD History',
                desc: 'CAD in 1st degree relative',
              },
            ].map(({ field, label, desc }) => {
              const val = (patient as any)[field] ?? 0;
              return (
                <div
                  key={field}
                  className="flex items-center justify-between bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="block text-xs font-semibold text-slate-800 leading-tight truncate">
                      {label}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-none">
                      {desc}
                    </span>
                  </div>

                  {/* Clean No / Yes Pill (NO tick icon) */}
                  <div className="grid grid-cols-2 bg-slate-200/80 p-0.5 rounded-md shrink-0 w-24 h-7">
                    <button
                      type="button"
                      onClick={() => handleBinaryChange(field, 0)}
                      className={`flex items-center justify-center rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        val === 0
                          ? 'bg-slate-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBinaryChange(field, 1)}
                      className={`flex items-center justify-center rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        val === 1
                          ? 'bg-rose-500 text-white font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Bottom Section: Actions directly underneath input features ── */}
      <div className="space-y-2 pt-1">
        {/* Navigation (Back / Next Step) directly under inputs */}
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#0f766e] hover:bg-[#115e59] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCompletedSteps((prev) => new Set([...prev, currentStep]))}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                completedSteps.has(totalSteps)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0f766e] hover:bg-[#115e59] text-white'
              }`}
            >
              <span>{completedSteps.has(totalSteps) ? 'All Steps Verified ✓' : 'Verify & Complete'}</span>
            </button>
          )}
        </div>

        {/* Run Analysis CTA */}
        <div>
          {!allStepsCompleted && (
            <p className="text-center text-[10px] text-slate-400 mb-1 leading-none">
              Complete all {totalSteps} steps to run model
            </p>
          )}
          <button
            type="button"
            onClick={handlePredict}
            disabled={isLoading || !allStepsCompleted}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              allStepsCompleted
                ? 'bg-gradient-to-r from-[#0f766e] via-[#0d9488] to-[#0891b2] hover:from-[#115e59] hover:to-[#0e7490] text-white shadow-xs cursor-pointer active:scale-[0.99]'
                : 'bg-slate-100 text-slate-400 border border-slate-200/90 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Analyzing Risk…</span>
              </>
            ) : (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span>Run Cardiovascular Analysis</span>
                {allStepsCompleted && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
