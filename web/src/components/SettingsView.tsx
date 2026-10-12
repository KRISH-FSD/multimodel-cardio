import { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Server,
  Stethoscope,
  Key,
  Globe,
  Copy,
  Check,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  supabaseUrl as activeUrl,
  supabaseAnonKey as activeKey,
  dataService,
  DEFAULT_PATIENTS,
  DEFAULT_NOTIFICATIONS,
} from '../lib/supabase';
import { usePatientStore } from '../store/store';

export function SettingsView() {
  const { currentDoctor, loadPatients, loadNotifications } = usePatientStore();
  const [url, setUrl] = useState(
    activeUrl || (typeof window !== 'undefined' ? localStorage.getItem('cardiovision_sb_url') || '' : '')
  );
  const [anonKey, setAnonKey] = useState(
    activeKey || (typeof window !== 'undefined' ? localStorage.getItem('cardiovision_sb_key') || '' : '')
  );

  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({
    tested: false,
  });
  const [testing, setTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const isConfigured = isSupabaseConfigured();

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestStatus({
        tested: true,
        success: false,
        message: 'Please provide both Supabase URL and Anon Key.',
      });
      return;
    }

    setTesting(true);
    setTestStatus({ tested: false });

    const res = await dataService.testConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestStatus({
      tested: true,
      success: res.success,
      message: res.message,
    });
  };

  const handleSaveCredentials = () => {
    localStorage.setItem('cardiovision_sb_url', url.trim());
    localStorage.setItem('cardiovision_sb_key', anonKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      window.location.reload();
    }, 800);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all patients and notifications to default demo data?')) {
      const docId = currentDoctor.id;
      localStorage.setItem(`cardiovision_patients_${docId}`, JSON.stringify(DEFAULT_PATIENTS));
      localStorage.setItem(`cardiovision_notifs_${docId}`, JSON.stringify(DEFAULT_NOTIFICATIONS));
      loadPatients();
      loadNotifications();
      alert('Demo data successfully restored.');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 overflow-y-auto bg-slate-50/60 rounded-2xl border border-slate-200/80 antialiased">
      {/* ── Header ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">System & Database Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Supabase cloud database credentials and clinical environment parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Local Storage Fallback Mode</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Card 1: Supabase Credentials ── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Supabase Cloud Database</h3>
              <p className="text-[11px] text-slate-400">
                Connect your PostgreSQL database for persistent doctor and patient records
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Public Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            {testStatus.tested && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Credentials saved! Reloading application...</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
              >
                {testing ? (
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Server className="w-3.5 h-3.5 text-teal-600" />
                )}
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCredentials}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs ml-auto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Credentials</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Card 2: Active Doctor & Environment ── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Current Physician Profile</h3>
              <p className="text-[11px] text-slate-400">Scoped clinical data & authorization credentials</p>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-slate-800">{currentDoctor.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-700">{currentDoctor.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialty:</span>
              <span className="font-medium text-slate-800">{currentDoctor.specialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Center:</span>
              <span className="font-medium text-slate-800">{currentDoctor.hospital}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-1.5">Database Initialization SQL</h4>
            <p className="text-[11px] text-slate-500 mb-2">
              A complete <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">supabase_schema.sql</code> file
              has been generated in your repository root with all tables, indexes, and RLS policies.
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  'Check supabase_schema.sql at the root of the project to run in Supabase SQL editor.'
                );
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied notice' : 'supabase_schema.sql ready'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-1.5">Reset Demo Data</h4>
            <p className="text-[11px] text-slate-500 mb-2">
              Restore default demo patients (PRN-1042, PRN-1043) and test alerts.
            </p>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 text-xs font-semibold cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
