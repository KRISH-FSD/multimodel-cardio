import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { usePatientStore } from '../store/store';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated?: () => void;
}

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
      await createPatient({
        prn: prn.trim().toUpperCase(),
        full_name: fullName.trim(),
        age,
        sex,
        contact: contact.trim(),
        clinical_data: { Age: age, Sex: sex },
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
