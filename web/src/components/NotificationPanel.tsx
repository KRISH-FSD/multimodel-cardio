import { useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { usePatientStore } from '../store/store';

// Helper to format relative time
function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recent';
  }
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatientTab?: () => void;
}

export function NotificationPanel({ isOpen, onClose, onSelectPatientTab }: NotificationPanelProps) {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    selectPatient,
  } = usePatientStore();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
    if (notif.patient_id) {
      selectPatient(notif.patient_id);
      if (onSelectPatientTab) {
        onSelectPatientTab();
      }
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-[360px] sm:w-[410px] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/70 text-[#0f766e] flex items-center justify-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">Clinical Alerts & Notifications</h3>
              {unreadNotificationCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">Real-time model inference & telemetry alerts</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Bar */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={() => markAllNotificationsRead()}
          disabled={unreadNotificationCount === 0}
          className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>

        <button
          type="button"
          onClick={() => clearNotifications()}
          disabled={notifications.length === 0}
          className="flex items-center gap-1.5 text-slate-400 hover:text-rose-600 font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear all</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No Notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              New predictions and patient alerts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isCritical = notif.type === 'critical';
            const isSuccess = notif.type === 'success';
            const isWarning = notif.type === 'warning';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 transition-colors cursor-pointer relative group flex gap-3 ${
                  notif.read ? 'bg-white hover:bg-slate-50/70' : 'bg-teal-50/30 hover:bg-teal-50/50'
                }`}
              >
                {/* Unread indicator dot */}
                {!notif.read && (
                  <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-teal-600" />
                )}

                {/* Status Icon */}
                <div className="shrink-0 mt-0.5">
                  {isCritical ? (
                    <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                  ) : isSuccess ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : isWarning ? (
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </span>
                      {notif.patient_prn && (
                        <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {notif.patient_prn}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.patient_id && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#0f766e] group-hover:underline">
                      <span>View patient assessment in 3D</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-teal-600" />
          <span>Synced with CardioVision Cloud CDSS Engine</span>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING TOAST NOTIFICATION COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function FloatingToastNotification({
  onViewPatient,
}: {
  onViewPatient?: () => void;
}) {
  const { activeToast, dismissToast, selectPatient, patientsList } = usePatientStore();

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const handleAction = () => {
    if (activeToast.patientPrn) {
      const match = patientsList.find((p) => p.prn === activeToast.patientPrn);
      if (match) {
        selectPatient(match.id);
      }
    }
    if (onViewPatient) {
      onViewPatient();
    }
    dismissToast();
  };

  const isCritical = activeToast.type === 'critical';
  const isSuccess = activeToast.type === 'success';

  return (
    <div className="fixed top-20 right-5 z-50 max-w-sm sm:max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-4 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {isCritical ? (
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm animate-bounce">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : isSuccess ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Info className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-900 truncate">{activeToast.title}</h4>
            <button
              type="button"
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{activeToast.message}</p>

          <div className="mt-2.5 flex items-center gap-2">
            {activeToast.patientPrn && (
              <button
                type="button"
                onClick={handleAction}
                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Inspect in 3D</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
            <button
              type="button"
              onClick={dismissToast}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
