import { useState, useEffect } from 'react';
import {
  Heart,
  Folder,
  Compass,
  Settings,
  Bell,
  User,
  UserPlus,
  Bookmark,
  Save,
  MoreHorizontal,
  ChevronDown,
  Activity,
} from 'lucide-react';
import { PatientForm } from './components/PatientForm';
import { PredictionResults } from './components/PredictionResults';
import { CommandDeck } from './components/CommandDeck';
import { usePatientStore } from './store/store';

function App() {
  const { patient, reset, setSelectedModel } = usePatientStore();
  const [activeTab, setActiveTab] = useState<'analysis' | 'records' | 'insights' | 'settings'>('analysis');

  // Default to Anatomical Model ('glb') on app load to match reference design
  useEffect(() => {
    setSelectedModel('glb');
  }, [setSelectedModel]);

  // Dynamic patient demographics display
  const patientAge = patient.Age ?? 61;
  const patientSex = patient.Sex === 0 ? 'Female' : 'Male';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#f8fafc] text-slate-900 flex flex-col font-sans p-3 sm:p-4 gap-3 antialiased">
      {/* ── 1. Top Navigation Bar (Header) ── */}
      <header className="h-16 bg-white border border-slate-200/80 rounded-2xl px-5 flex items-center justify-between shrink-0 shadow-xs">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-xs">
            <Heart className="w-5 h-5 fill-white/20 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-900 leading-tight">
              CARDIOVISION
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Cardiovascular Risk Visualization & Prediction
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analysis'
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <span>Patient Records</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Model Insights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Status & Profile Controls */}
        <div className="flex items-center gap-3">
          {/* Model Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Model Ready</span>
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/70 bg-white"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              1
            </span>
          </button>

          {/* Doctor Profile Avatar */}
          <div className="flex items-center gap-2 pl-1 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
              KS
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-800">Dr. Krish Siva</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* ── 2. Patient Context Sub-Header Bar ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Left: Patient Details Banner */}
        <div className="flex items-center gap-3 text-xs">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <User className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900">Patient: PRN-1042</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">{patientSex}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">{patientAge} Years</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Analysis: CAD Risk (Overall + Vessel)</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Patient</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <Bookmark className="w-3.5 h-3.5 text-teal-600" />
            <span>Load Profile</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Results</span>
          </button>

          <button
            type="button"
            className="p-1.5 rounded-xl border border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── 3. Main Dashboard 3-Column Layout ── */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Left Column: Patient Parameters (3 cols) */}
        <aside className="col-span-12 lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col overflow-y-auto">
          <PatientForm />
        </aside>

        {/* Center Column: 3D Heart Visualization (6 cols) */}
        <main className="col-span-12 lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs relative overflow-hidden flex flex-col min-h-[520px]">
          <CommandDeck />
        </main>

        {/* Right Column: Analysis Results & SHAP (3 cols) */}
        <aside className="col-span-12 lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col overflow-y-auto">
          <PredictionResults />
        </aside>
      </div>
    </div>
  );
}

export default App;
