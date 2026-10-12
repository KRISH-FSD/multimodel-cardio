import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Mail,
  Lock,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { usePatientStore } from '../store/store';
import { DEMO_DOCTORS, isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { currentDoctor, setCurrentDoctor } = usePatientStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('Cardiologist');
  const [hospital, setHospital] = useState('CardioVision Medical Center');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoSelect = (doc: (typeof DEMO_DOCTORS)[0]) => {
    setCurrentDoctor(doc);
    setStatusMessage(`Switched to ${doc.full_name}`);
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      if (mode === 'signup') {
        if (!fullName || !email) {
          setStatusMessage('Please enter full name and email.');
          setLoading(false);
          return;
        }

        // If Supabase is connected, attempt Supabase Auth sign up
        if (isSupabaseConfigured() && supabase) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password: password || 'CardioVision2026!',
            });
            if (error) {
              console.warn('Supabase auth signup warning:', error);
            } else if (data.user) {
              // Also insert doctor profile row
              await supabase.from('doctors').upsert({
                id: data.user.id,
                email,
                full_name: fullName,
                specialty,
                hospital,
                avatar_initials: fullName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2),
              });
            }
          } catch (sbErr) {
            console.warn('Supabase signup fallback:', sbErr);
          }
        }

        // Set local doctor
        const initials = fullName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const newDoc = {
          id: `doc-${Date.now()}`,
          email,
          full_name: fullName.startsWith('Dr.') ? fullName : `Dr. ${fullName}`,
          specialty,
          hospital,
          avatar_initials: initials || 'DR',
        };

        setCurrentDoctor(newDoc);
        setStatusMessage('Doctor account registered successfully!');
        setTimeout(() => onClose(), 600);
      } else {
        // Sign In
        if (!email) {
          setStatusMessage('Please enter doctor email.');
          setLoading(false);
          return;
        }

        // Try Supabase auth if connected
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.auth.signInWithPassword({
              email,
              password: password || 'CardioVision2026!',
            });
          } catch (sbErr) {
            console.warn('Supabase signin error:', sbErr);
          }
        }

        const match = DEMO_DOCTORS.find((d) => d.email.toLowerCase() === email.toLowerCase());
        const loggedDoc = match || {
          id: `doc-${Date.now()}`,
          email,
          full_name: email.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
          specialty: 'Cardiovascular Specialist',
          hospital: 'CardioVision Network Hospital',
          avatar_initials: 'CD',
        };

        setCurrentDoctor(loggedDoc);
        setStatusMessage('Signed in successfully!');
        setTimeout(() => onClose(), 600);
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Stethoscope className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Physician Authentication</h3>
              <p className="text-[11px] text-teal-100">
                {isSupabaseConfigured() ? 'Connected to Supabase DB' : 'CardioVision Local / Demo Mode'}
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Quick Demo Switcher */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Quick Physician Select (Demo/Hackathon)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_DOCTORS.map((doc) => {
                const isActive = currentDoctor.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleDemoSelect(doc)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isActive
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/30'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {doc.avatar_initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate leading-tight">{doc.full_name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{doc.specialty}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] text-slate-400 font-semibold uppercase">
              Or Sign In / Register
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Doctor Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register New Doctor
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Physician Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Dr. Alex Mercer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Hospital / Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="physician@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Hospital Center
                  </label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{mode === 'signin' ? 'Sign In as Physician' : 'Complete Registration'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR PROFILE DROPDOWN MENU IN HEADER
// ─────────────────────────────────────────────────────────────────────────────

export function DoctorProfileMenu({ onOpenAuthModal }: { onOpenAuthModal: () => void }) {
  const { currentDoctor } = usePatientStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1 cursor-pointer hover:opacity-85 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200">
          {currentDoctor.avatar_initials || 'KS'}
        </div>
        <div className="hidden lg:flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
            {currentDoctor.full_name}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-11 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in duration-150">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900 truncate">{currentDoctor.full_name}</p>
            <p className="text-[11px] text-teal-700 font-medium truncate">{currentDoctor.specialty}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentDoctor.hospital}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{currentDoctor.email}</p>
          </div>

          <div className="p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal();
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Switch Doctor / Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal();
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out / Change Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
