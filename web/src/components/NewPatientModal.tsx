import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Flame,
  CheckCircle2,
  FileText,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { usePatientStore } from '../store/store';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated?: () => void;
}

// Sample starting profiles to quickly prefill
const HIGH_RISK_PRESET = {
  Age: 62, Weight: 88, Length: 174, Sex: 1, BMI: 29.07,
  DM: 0, HTN: 1, 'Current Smoker': 1, 'EX-Smoker': 0, FH: 1,
  Obesity: 1, CRF: 0, CVA: 0, 'Airway disease': 0, 'Thyroid Disease': 0,
  CHF: 0, DLP: 1, BP: 135, PR: 88, Edema: 0,
  'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0,
  'Diastolic Murmur': 0, 'Typical Chest Pain': 1, Dyspnea: 0,
  'Function Class': 0, Atypical: 0, Nonanginal: 0, 'Exertional CP': 0,
  'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0,
  'T inversion': 0, LVH: 0, 'Poor R Progression': 0, BBB: 0,
  FBS: 98, CR: 0.9, TG: 185, LDL: 162, HDL: 36.0, BUN: 14,
  ESR: 10, HB: 15.0, K: 4.5, Na: 140, WBC: 7200, Lymph: 34,
  Neut: 60, PLT: 250, 'EF-TTE': 45, 'Region RWMA': 0, VHD: 'N',
};

const NORMAL_RISK_PRESET = {
  Age: 38, Weight: 68, Length: 172, Sex: 0, BMI: 23.0,
  DM: 0, HTN: 0, 'Current Smoker': 0, 'EX-Smoker': 0, FH: 0,
  Obesity: 0, CRF: 0, CVA: 0, 'Airway disease': 0, 'Thyroid Disease': 0,
  CHF: 0, DLP: 0, BP: 118, PR: 68, Edema: 0,
  'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0,
  'Diastolic Murmur': 0, 'Typical Chest Pain': 0, Dyspnea: 0,
  'Function Class': 0, Atypical: 0, Nonanginal: 0, 'Exertional CP': 0,
  'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0,
  'T inversion': 0, LVH: 0, 'Poor R Progression': 0, BBB: 0,
  FBS: 82, CR: 0.75, TG: 110, LDL: 85, HDL: 58.0, BUN: 11,
  ESR: 4, HB: 13.8, K: 4.1, Na: 139, WBC: 5800, Lymph: 32,
  Neut: 58, PLT: 210, 'EF-TTE': 65, 'Region RWMA': 0, VHD: 'N',
};

export function NewPatientModal({ isOpen, onClose, onPatientCreated }: NewPatientModalProps) {
  const { patientsList, createPatient } = usePatientStore();

  // Generate next PRN suggestion
  const nextPrnNumber = React.useMemo(() => {
    const prnNumbers = patientsList
      .map((p) => {
        const match = p.prn.match(/PRN-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = prnNumbers.length > 0 ? Math.max(...prnNumbers) : 1043;
    return `PRN-${max + 1}`;
  }, [patientsList]);

  const [prn, setPrn] = useState(nextPrnNumber);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(55);
  const [sex, setSex] = useState<number>(1);
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [preset, setPreset] = useState<'blank' | 'high' | 'normal'>('blank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update suggested PRN when opened
  React.useEffect(() => {
    if (isOpen) {
      setPrn(nextPrnNumber);
      setError(null);
    }
  }, [isOpen, nextPrnNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please provide patient name.');
      return;
    }
    if (!prn.trim()) {
      setError('Please provide a Patient ID / PRN.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let clinicalData: any = { Age: age, Sex: sex };
      if (preset === 'high') {
        clinicalData = { ...HIGH_RISK_PRESET, Age: age, Sex: sex };
      } else if (preset === 'normal') {
        clinicalData = { ...NORMAL_RISK_PRESET, Age: age, Sex: sex };
      }

      await createPatient({
        prn: prn.trim().toUpperCase(),
        full_name: fullName.trim(),
        age,
        sex,
        contact: contact.trim(),
        notes: notes.trim(),
        clinical_data: clinicalData,
      });

      if (onPatientCreated) {
        onPatientCreated();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create patient record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">New Patient Intake</h3>
              <p className="text-[11px] text-teal-100">
                Enroll patient into clinical CAD risk assessment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: PRN & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                PRN / MRN ID
              </label>
              <input
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                placeholder="PRN-1044"
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Patient Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Lucas Bennett"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </div>
          </div>

          {/* Row 2: Age, Biological Sex, Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min="18"
                max="100"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Biological Sex
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSex(1)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sex === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setSex(0)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sex === 0 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Phone / Contact
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Preset baseline starter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Initial Clinical Baseline
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset('blank')}
                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                  preset === 'blank'
                    ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Blank</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Manual parameter input</p>
              </button>

              <button
                type="button"
                onClick={() => setPreset('high')}
                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                  preset === 'high'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>High Risk</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Pre-fill HTN & Angina</p>
              </button>

              <button
                type="button"
                onClick={() => setPreset('normal')}
                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                  preset === 'normal'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Control</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Normal baseline vitals</p>
              </button>
            </div>
          </div>

          {/* Clinical Notes / Chief Complaint */}
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Chief Complaint & Clinical Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Patient presents with acute substernal chest pressure radiating to left arm..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Patient & Begin Intake</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
