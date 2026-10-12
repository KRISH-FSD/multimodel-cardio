import { useState, useEffect, useRef } from 'react';
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
import { NotificationPanel, FloatingToastNotification } from './components/NotificationPanel';
import { AuthModal, DoctorProfileMenu } from './components/AuthModal';
import { NewPatientModal } from './components/NewPatientModal';
import { PatientRecordsView } from './components/PatientRecordsView';
import { ModelInsightsView } from './components/ModelInsightsView';
import { SettingsView } from './components/SettingsView';
import { usePatientStore } from './store/store';

function App() {
  const {
    patient,
    activePatient,
    patientsList,
    selectPatient,
    setSelectedModel,
    isFormCollapsed,
    toggleFormCollapsed,
    isLoading,
    unreadNotificationCount,
    loadPatients,
    loadNotifications,
  } = usePatientStore();

  const [activeTab, setActiveTab] = useState<'analysis' | 'records' | 'insights' | 'settings'>('analysis');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const patientDropdownRef = useRef<HTMLDivElement>(null);

  // Load initial patients & notifications on mount
  useEffect(() => {
    loadPatients();
    loadNotifications();
  }, [loadPatients, loadNotifications]);

  // Default to Anatomical Model ('glb') on app load to match reference design
  useEffect(() => {
    setSelectedModel('glb');
  }, [setSelectedModel]);

  // Close patient dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        patientDropdownRef.current &&
        !patientDropdownRef.current.contains(e.target as Node)
      ) {
        setIsPatientDropdownOpen(false);
      }
    }
    if (isPatientDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPatientDropdownOpen]);

  // Dynamic patient demographics display
  const patientAge = activePatient?.age ?? patient.Age ?? 61;
  const patientSex =
    (activePatient?.sex ?? patient.Sex ?? 1) === 0 ? 'Female' : 'Male';
  const patientPrn = activePatient?.prn ?? 'PRN-1042';
  const patientName = activePatient?.full_name ?? 'Eleanor Vance';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#f8fafc] text-slate-900 flex flex-col font-sans p-3 sm:p-4 gap-3 antialiased">
      {/* ── 1. Top Navigation Bar (Header) ── */}
      <header className="h-16 bg-white border border-slate-200/80 rounded-2xl px-5 flex items-center justify-between shrink-0 shadow-xs relative">
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab('analysis')}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <span>Patient Records</span>
            {patientsList.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
                {patientsList.length}
              </span>
            )}
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

        {/* Right Status, Notifications & Profile Controls */}
        <div className="flex items-center gap-3">
          {/* Model Status Badge (Dynamic Loading Indicator) */}
          {isLoading ? (
            <div className="hidden sm:flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Patient Data...</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Model Ready</span>
            </div>
          )}

          {/* Dynamic Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2 rounded-xl transition-all cursor-pointer border ${
                unreadNotificationCount > 0
                  ? 'border-teal-300 text-teal-800 bg-teal-50/70 hover:bg-teal-100'
                  : 'border-slate-200/70 text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-white'
              }`}
              title="Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Floating Dropdown Panel */}
            <NotificationPanel
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onSelectPatientTab={() => setActiveTab('analysis')}
            />
          </div>

          {/* Doctor Profile Dropdown & Switcher */}
          <DoctorProfileMenu onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        </div>
      </header>

      {/* ── 2. Tab Views Switcher ── */}
      {activeTab === 'records' && (
        <PatientRecordsView
          onOpenNewPatientModal={() => setIsNewPatientModalOpen(true)}
          onOpenAnalysisTab={() => setActiveTab('analysis')}
        />
      )}

      {activeTab === 'insights' && <ModelInsightsView />}

      {activeTab === 'settings' && <SettingsView />}

      {activeTab === 'analysis' && (
        <div className="flex-1 flex gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Patient Clinical Data (Smooth Sliding Drawer) */}
          <aside
            className={`bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col min-h-0 shrink-0 overflow-hidden relative transition-all duration-300 ease-in-out ${
              isFormCollapsed
                ? 'w-12 py-3 px-1.5 items-center justify-between'
                : 'w-full lg:w-[335px] xl:w-[360px] p-3.5'
            }`}
          >
            {/* Expanded State: Patient Form */}
            <div
              className={`w-[307px] xl:w-[332px] transition-all duration-300 ease-in-out ${
                isFormCollapsed
                  ? '-translate-x-full opacity-0 pointer-events-none'
                  : 'translate-x-0 opacity-100'
              }`}
            >
              <PatientForm />
            </div>

            {/* Collapsed State: Slim Bar */}
            <div
              className={`absolute inset-0 py-3 px-1.5 flex flex-col items-center justify-between transition-all duration-300 ease-in-out ${
                isFormCollapsed
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <button
                type="button"
                onClick={toggleFormCollapsed}
                className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 text-[#0f766e] flex items-center justify-center hover:bg-teal-100 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
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
            </div>
          </aside>

          {/* Center Column: Patient Header + 3D Heart Visualization */}
          <div className="flex-1 flex flex-col gap-3 min-h-0 transition-all duration-300 ease-in-out">
            {/* Dynamic Patient Selector Header Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-2 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-3 text-xs">
                {/* Patient Quick Selector Dropdown */}
                <div ref={patientDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold cursor-pointer transition-colors"
                  >
                    <div className="w-5 h-5 rounded-md bg-teal-50 text-[#0f766e] flex items-center justify-center">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="font-bold">{patientPrn}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700 truncate max-w-[140px]">{patientName}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                  </button>

                  {/* Dropdown Menu of enrolled patients */}
                  {isPatientDropdownOpen && (
                    <div className="absolute left-0 top-9 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Enrolled Patients ({patientsList.length})
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {patientsList.map((p) => {
                          const isSel = p.id === activePatient?.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                selectPatient(p.id);
                                setIsPatientDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between cursor-pointer transition-colors ${
                                isSel ? 'bg-teal-50/70 text-teal-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="truncate">
                                <p className="text-xs truncate">{p.full_name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{p.prn}</p>
                              </div>
                              {p.status === 'critical' ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                                  High Risk
                                </span>
                              ) : p.status === 'analyzed' ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
                                  Evaluated
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-2 text-slate-500 font-medium">
                  <span className="text-slate-300">|</span>
                  <span>{patientSex}</span>
                  <span className="text-slate-300">|</span>
                  <span>{patientAge} Years</span>
                  {activePatient?.status === 'critical' && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Critical Case
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* New Patient Button */}
              <button
                type="button"
                onClick={() => setIsNewPatientModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-all cursor-pointer shadow-2xs"
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
      )}

      {/* ── 3. Modals & Floating Overlays ── */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onPatientCreated={() => setActiveTab('analysis')}
      />
      <FloatingToastNotification onViewPatient={() => setActiveTab('analysis')} />
    </div>
  );
}

export default App;
