import { useState, useEffect } from 'react';
import {
  Heart,
  Folder,
  Compass,
  Settings,
  Bell,
  User,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { PatientForm } from './components/PatientForm';
import { PredictionResults } from './components/PredictionResults';
import { CommandDeck } from './components/CommandDeck';
import { usePatientStore } from './store/store';

function App() {
  const { patient, reset, setSelectedModel, isFormCollapsed, toggleFormCollapsed } =
    usePatientStore();
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

      {/* ── 2. Main Dashboard 3-Column Layout ── */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Left Column: Patient Clinical Data (Collapsible) */}
        {isFormCollapsed ? (
          <aside className="w-12 bg-white border border-slate-200/80 rounded-2xl py-3 px-1.5 shadow-xs flex flex-col items-center justify-between shrink-0 transition-all duration-200">
            <button
              type="button"
              onClick={toggleFormCollapsed}
              className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 text-[#0f766e] flex items-center justify-center hover:bg-teal-100 transition-all cursor-pointer shadow-2xs"
              title="Expand Patient Clinical Data"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center justify-center py-4">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase rotate-180 [writing-mode:vertical-rl] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 rotate-90 text-[#0f766e]" />
                Patient Data
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#0f766e]/40" />
          </aside>
        ) : (
          <aside className="w-full lg:w-[325px] xl:w-[350px] bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col min-h-0 lg:overflow-hidden overflow-y-auto shrink-0 transition-all duration-200">
            <PatientForm />
          </aside>
        )}

        {/* Center Column: Patient Header + 3D Heart Visualization (6 cols / flex-1) */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Patient Details Header Bar (Spanning ONLY above 3D section) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-[#0f766e]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span className="font-bold text-slate-900">Patient: PRN-1042</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">{patientSex}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">{patientAge} Years</span>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#0f766e]" />
              <span>New Patient</span>
            </button>
          </div>

          {/* 3D Heart Model Canvas */}
          <main className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-xs relative overflow-hidden flex flex-col min-h-0">
            <CommandDeck />
          </main>
        </div>

        {/* Right Column: Analysis Results & SHAP */}
        <aside className="w-full lg:w-[325px] xl:w-[350px] bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col min-h-0 lg:overflow-hidden overflow-y-auto shrink-0">
          <PredictionResults />
        </aside>
      </div>
    </div>
  );
}

export default App;
