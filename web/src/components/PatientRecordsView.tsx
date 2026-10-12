import React, { useState } from 'react';
import {
  Folder,
  Search,
  UserPlus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { usePatientStore } from '../store/store';
import type { PatientRecord } from '../lib/supabase';

interface PatientRecordsViewProps {
  onOpenNewPatientModal: () => void;
  onOpenAnalysisTab: () => void;
}

export function PatientRecordsView({
  onOpenNewPatientModal,
  onOpenAnalysisTab,
}: PatientRecordsViewProps) {
  const { patientsList, selectPatient, deletePatient, activePatient } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'analyzed' | 'pending'>('all');

  // Filtered patients
  const filteredPatients = patientsList.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prn.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'critical') return p.status === 'critical';
    if (filterStatus === 'analyzed') return p.status === 'analyzed' || p.status === 'stable';
    if (filterStatus === 'pending') return p.status === 'pending';
    return true;
  });

  // Aggregate statistics
  const totalCount = patientsList.length;
  const criticalCount = patientsList.filter((p) => p.status === 'critical').length;
  const analyzedCount = patientsList.filter(
    (p) => p.status === 'analyzed' || p.status === 'stable' || p.status === 'critical'
  ).length;
  const pendingCount = patientsList.filter((p) => p.status === 'pending').length;

  const handleOpenPatient = (p: PatientRecord) => {
    selectPatient(p.id);
    onOpenAnalysisTab();
  };

  const handleDelete = async (e: React.MouseEvent, p: PatientRecord) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove patient ${p.prn} (${p.full_name})?`)) {
      await deletePatient(p.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 overflow-y-auto bg-slate-50/60 rounded-2xl border border-slate-200/80 antialiased">
      {/* ── Top Metric Banners ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Enrolled Patients
            </p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Folder className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              High Risk / Critical
            </p>
            <p className="text-xl font-extrabold text-rose-600 mt-0.5">{criticalCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              AI Evaluated
            </p>
            <p className="text-xl font-extrabold text-teal-800 mt-0.5">{analyzedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Intake
            </p>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Control Bar ── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, PRN, or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filterStatus === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            High Risk ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('analyzed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filterStatus === 'analyzed'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Evaluated ({analyzedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending ({pendingCount})
          </button>

          <button
            type="button"
            onClick={onOpenNewPatientModal}
            className="ml-auto sm:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Patient</span>
          </button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-3 px-4">Patient ID / PRN</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">CAD Probability</th>
                <th className="py-3 px-4">Primary Stenosis</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Clinical Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Folder className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-xs text-slate-600">No patient records found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting search or enroll a new patient.</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const isCurrentActive = activePatient?.id === p.id;
                  const cadProb = p.latest_prediction?.predictions?.cad?.probability;
                  const ladProb = p.latest_prediction?.predictions?.lad?.probability ?? 0;
                  const lcxProb = p.latest_prediction?.predictions?.lcx?.probability ?? 0;
                  const rcaProb = p.latest_prediction?.predictions?.rca?.probability ?? 0;

                  // Find highest vessel
                  let topVessel = 'None';
                  if (p.latest_prediction) {
                    if (ladProb >= lcxProb && ladProb >= rcaProb) topVessel = 'LAD (Anterior)';
                    else if (rcaProb >= lcxProb) topVessel = 'RCA (Inferior)';
                    else topVessel = 'LCX (Lateral)';
                  }

                  const isHigh = cadProb !== undefined && cadProb >= 0.5;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenPatient(p)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isCurrentActive ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      {/* PRN & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {p.prn}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800 mt-1">{p.full_name}</p>
                      </td>

                      {/* Demographics */}
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-medium">
                          {p.sex === 1 ? 'Male' : 'Female'}, {p.age} yrs
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.contact || 'No phone'}</p>
                      </td>

                      {/* CAD Probability */}
                      <td className="py-3 px-4">
                        {cadProb !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-extrabold text-sm ${
                                isHigh ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {(cadProb * 100).toFixed(1)}%
                            </span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHigh ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${cadProb * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Primary Vessel */}
                      <td className="py-3 px-4">
                        {p.latest_prediction ? (
                          <span className="font-semibold text-slate-700">{topVessel}</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Awaiting analysis</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {p.status === 'critical' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Critical High Risk</span>
                          </span>
                        ) : p.status === 'stable' || p.status === 'analyzed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Normal / Low Risk</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Intake</span>
                          </span>
                        )}
                      </td>

                      {/* Clinical Notes */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-[11px] text-slate-500 truncate">
                          {p.notes || 'No notes entered'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPatient(p)}
                            className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="Inspect in 3D Heart Workspace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
