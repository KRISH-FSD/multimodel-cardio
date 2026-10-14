import { useEffect, useRef } from 'react';
import {
  X,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { usePatientStore } from '../store/store';

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
      className="absolute right-0 top-11 w-[340px] sm:w-[380px] bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
    >
      {/* Clean Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">Notifications</span>
          {unreadNotificationCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {unreadNotificationCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              className="text-[11px] text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No Notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Completed patient analyses will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isCritical = notif.type === 'critical';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                  notif.read ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 hover:bg-slate-100/70'
                }`}
              >
                {/* Dot indicator */}
                <div className="mt-1 shrink-0">
                  <span
                    className={`block w-2 h-2 rounded-full ${
                      isCritical
                        ? 'bg-rose-500'
                        : notif.type === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                  />
                </div>

                {/* Structured text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {notif.patient_prn && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {notif.patient_prn}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {notif.message}
                  </p>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
              </div>
            );
          })
        )}
      </div>

      {/* Clean Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Click any alert to inspect patient in 3D</span>
          <button
            type="button"
            onClick={() => clearNotifications()}
            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
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
    }, 5000);
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

  return (
    <div className="fixed top-20 right-5 z-50 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 animate-in slide-in-from-top-3 fade-in duration-200">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          <span
            className={`block w-2.5 h-2.5 rounded-full ${
              isCritical ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {activeToast.title}
            </h4>
            <button
              type="button"
              onClick={dismissToast}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
            {activeToast.message}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAction}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold transition-colors cursor-pointer"
            >
              Inspect Patient in 3D
            </button>
            <button
              type="button"
              onClick={dismissToast}
              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
