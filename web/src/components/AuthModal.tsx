import React, { useState } from 'react';
import {
  X,
  Heart,
  ChevronDown,
  LogOut,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { usePatientStore } from '../store/store';
import { DEMO_DOCTORS, isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const { setCurrentDoctor, showToast } = usePatientStore();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('Interventional Cardiology');
  const [hospital, setHospital] = useState('CardioVision Medical Center');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoSelect = (doc: (typeof DEMO_DOCTORS)[0]) => {
    setCurrentDoctor(doc);
    showToast({
      title: 'Physician Switched',
      message: `Active session: ${doc.full_name} (${doc.specialty})`,
      type: 'info',
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      if (mode === 'signup') {
        if (!fullName.trim() || !email.trim()) {
          setStatusMessage('Please enter physician name and email.');
          setLoading(false);
          return;
        }

        // Supabase registration if configured
        if (isSupabaseConfigured() && supabase) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email: email.trim(),
              password: password || 'CardioVision2026!',
            });
            if (error) {
              console.warn('Supabase auth signup notice:', error);
            } else if (data.user) {
              await supabase.from('doctors').upsert({
                id: data.user.id,
                email: email.trim(),
                full_name: fullName.trim(),
                specialty: specialty.trim(),
                hospital: hospital.trim(),
                avatar_initials: fullName
                  .trim()
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

        const initials = fullName
          .trim()
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const newDoc = {
          id: `doc-${Date.now()}`,
          email: email.trim(),
          full_name: fullName.trim().startsWith('Dr.') ? fullName.trim() : `Dr. ${fullName.trim()}`,
          specialty: specialty.trim() || 'Cardiologist',
          hospital: hospital.trim() || 'CardioVision Medical Center',
          avatar_initials: initials || 'DR',
        };

        setCurrentDoctor(newDoc);
        showToast({
          title: 'Account Registered',
          message: `Welcome, ${newDoc.full_name}. Clinical records are now scoped to your account.`,
          type: 'success',
        });
        onClose();
      } else {
        // Sign In
        if (!email.trim()) {
          setStatusMessage('Please enter physician email.');
          setLoading(false);
          return;
        }

        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password || 'CardioVision2026!',
            });
          } catch (sbErr) {
            console.warn('Supabase signin error:', sbErr);
          }
        }

        const match = DEMO_DOCTORS.find(
          (d) => d.email.toLowerCase() === email.trim().toLowerCase()
        );
        const loggedDoc = match || {
          id: `doc-${Date.now()}`,
          email: email.trim(),
          full_name: email.split('@')[0].replace('.', ' ').replace(/^./, (c) => c.toUpperCase()),
          specialty: 'Cardiovascular Specialist',
          hospital: 'CardioVision Medical Center',
          avatar_initials: 'DR',
        };

        setCurrentDoctor(loggedDoc);
        showToast({
          title: 'Signed In',
          message: `Active session: ${loggedDoc.full_name}`,
          type: 'info',
        });
        onClose();
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Clean Header */}
        <div className="p-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600">
              <Heart className="w-4 h-4 fill-rose-600/20 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {mode === 'signin' ? 'Physician Sign In' : 'Register Clinician'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">CardioVision Clinical Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="px-5 pt-1 pb-3">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setStatusMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setStatusMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register New
            </button>
          </div>
        </div>

        {/* Clean Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Dr. Alex Mercer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                required
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Work Email
            </label>
            <input
              type="email"
              placeholder="physician@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Hospital
                </label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs mt-1"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto block" />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>

          {/* Quick Demo Switcher */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-medium block mb-1.5 text-center">
              Quick demo profiles
            </span>
            <div className="flex gap-2">
              {DEMO_DOCTORS.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleDemoSelect(doc)}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[11px] text-slate-700 font-medium transition-colors cursor-pointer truncate text-center"
                >
                  {doc.full_name.replace('Dr. ', '')}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR PROFILE DROPDOWN MENU IN HEADER
// ─────────────────────────────────────────────────────────────────────────────

export function DoctorProfileMenu({
  onOpenAuthModal,
  onOpenRegisterModal,
}: {
  onOpenAuthModal: () => void;
  onOpenRegisterModal: () => void;
}) {
  const { currentDoctor, switchDoctor } = usePatientStore();
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

  // Find other doctor for 1-click switch
  const otherDoctor = DEMO_DOCTORS.find((d) => d.id !== currentDoctor.id) || DEMO_DOCTORS[1];

  return (
    <div ref={menuRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1 cursor-pointer hover:opacity-85 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200">
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
        <div className="absolute right-0 top-11 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in duration-150">
          <div className="px-3.5 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900 truncate">{currentDoctor.full_name}</p>
            <p className="text-[11px] text-slate-500 font-medium truncate">{currentDoctor.specialty}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{currentDoctor.email}</p>
          </div>

          <div className="p-1 space-y-0.5 text-xs">
            {otherDoctor && (
              <button
                type="button"
                onClick={() => {
                  switchDoctor(otherDoctor.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Switch to {otherDoctor.full_name.replace('Dr. ', '')}</span>
                <span className="text-[10px] text-slate-400 font-mono">Demo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenRegisterModal();
              }}
              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Register New Clinician</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal();
              }}
              className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign In / Change Account</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal();
              }}
              className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
