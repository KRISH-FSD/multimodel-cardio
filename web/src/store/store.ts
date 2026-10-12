import { create } from 'zustand';
import type { components } from '../api/schema';
import {
  type Doctor,
  type PatientRecord,
  type NotificationRecord,
  DEMO_DOCTORS,
  DEFAULT_PATIENTS,
  DEFAULT_NOTIFICATIONS,
  dataService,
} from '../lib/supabase';

export type PatientData = components['schemas']['PatientInput'];
export type PredictionResponse = components['schemas']['PredictionResponse'];

export type HeartModel = 'existing' | 'glb';
export type ArteryId = 'lad' | 'lcx' | 'rca';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  patientPrn?: string;
}

interface PatientState {
  // Doctor Auth state
  currentDoctor: Doctor;
  setCurrentDoctor: (doctor: Doctor) => void;
  switchDoctor: (doctorId: string) => void;

  // Enrolled Patients state
  patientsList: PatientRecord[];
  activePatient: PatientRecord | null;
  loadPatients: () => Promise<void>;
  selectPatient: (patientId: string) => void;
  createPatient: (data: {
    prn: string;
    full_name: string;
    age: number;
    sex: number;
    contact?: string;
    notes?: string;
    clinical_data?: Partial<PatientData>;
  }) => Promise<PatientRecord>;
  updateActivePatient: (data: Partial<PatientRecord>) => Promise<void>;
  deletePatient: (patientId: string) => Promise<void>;

  // Notifications state
  notifications: NotificationRecord[];
  unreadNotificationCount: number;
  activeToast: ToastItem | null;
  loadNotifications: () => Promise<void>;
  addNotification: (notif: {
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'success' | 'info';
    patientId?: string;
    patientPrn?: string;
    predictionData?: any;
  }) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: () => void;

  // Clinical & Visualization state
  patient: Partial<PatientData>;
  prediction: PredictionResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedModel: HeartModel;
  focusedVessel: ArteryId | null;
  activeResultTab: 'assessment' | 'guide';
  isFormCollapsed: boolean;

  setPatientData: (data: Partial<PatientData>) => void;
  setPrediction: (prediction: PredictionResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedModel: (model: HeartModel) => void;
  setFocusedVessel: (vessel: ArteryId | null) => void;
  setActiveResultTab: (tab: 'assessment' | 'guide') => void;
  setIsFormCollapsed: (collapsed: boolean) => void;
  toggleFormCollapsed: () => void;
  reset: () => void;
}

const initialDoctor = DEMO_DOCTORS[0];
const initialPatients = DEFAULT_PATIENTS;
const initialActivePatient = DEFAULT_PATIENTS[0] || null;
const initialNotifs = DEFAULT_NOTIFICATIONS;

export const usePatientStore = create<PatientState>((set, get) => ({
  // Doctor Auth state
  currentDoctor: initialDoctor,
  setCurrentDoctor: (currentDoctor) => {
    set({ currentDoctor });
    get().loadPatients();
    get().loadNotifications();
  },
  switchDoctor: (doctorId) => {
    const found = DEMO_DOCTORS.find((d) => d.id === doctorId) || DEMO_DOCTORS[0];
    set({ currentDoctor: found });
    get().loadPatients();
    get().loadNotifications();
  },

  // Patients state
  patientsList: initialPatients,
  activePatient: initialActivePatient,

  loadPatients: async () => {
    const docId = get().currentDoctor.id;
    const list = await dataService.getPatients(docId);
    set({
      patientsList: list,
      activePatient: list[0] || null,
      patient: (list[0]?.clinical_data as Partial<PatientData>) || {},
      prediction: (list[0]?.latest_prediction as PredictionResponse) || null,
    });
  },

  selectPatient: (patientId) => {
    const found = get().patientsList.find((p) => p.id === patientId);
    if (found) {
      set({
        activePatient: found,
        patient: (found.clinical_data as Partial<PatientData>) || {},
        prediction: (found.latest_prediction as PredictionResponse) || null,
        error: null,
      });
    }
  },

  createPatient: async (data) => {
    const doctorId = get().currentDoctor.id;
    const newRecord: PatientRecord = {
      id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      doctor_id: doctorId,
      prn: data.prn.trim(),
      full_name: data.full_name.trim(),
      age: data.age,
      sex: data.sex,
      contact: data.contact || '',
      notes: data.notes || '',
      clinical_data: data.clinical_data || { Age: data.age, Sex: data.sex },
      latest_prediction: null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await dataService.savePatient(newRecord);
    const updatedList = [saved, ...get().patientsList.filter((p) => p.id !== saved.id)];

    set({
      patientsList: updatedList,
      activePatient: saved,
      patient: saved.clinical_data as Partial<PatientData>,
      prediction: null,
      error: null,
    });

    // Automatically trigger notification for new patient creation
    await get().addNotification({
      title: `New Patient Enrolled: ${saved.prn}`,
      message: `${saved.full_name} (${saved.sex === 1 ? 'Male' : 'Female'}, ${saved.age} yrs) added to clinical registry.`,
      type: 'info',
      patientId: saved.id,
      patientPrn: saved.prn,
    });

    return saved;
  },

  updateActivePatient: async (data) => {
    const current = get().activePatient;
    if (!current) return;

    const updated: PatientRecord = {
      ...current,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await dataService.savePatient(updated);
    const list = get().patientsList.map((p) => (p.id === updated.id ? updated : p));
    set({ activePatient: updated, patientsList: list });
  },

  deletePatient: async (patientId) => {
    const doctorId = get().currentDoctor.id;
    await dataService.deletePatient(patientId, doctorId);
    const updatedList = get().patientsList.filter((p) => p.id !== patientId);
    const nextActive = updatedList[0] || null;

    set({
      patientsList: updatedList,
      activePatient: nextActive,
      patient: (nextActive?.clinical_data as Partial<PatientData>) || {},
      prediction: (nextActive?.latest_prediction as PredictionResponse) || null,
    });
  },

  // Notifications state
  notifications: initialNotifs,
  unreadNotificationCount: initialNotifs.filter((n) => !n.read).length,
  activeToast: null,

  loadNotifications: async () => {
    const docId = get().currentDoctor.id;
    const list = await dataService.getNotifications(docId);
    const unread = list.filter((n) => !n.read).length;
    set({ notifications: list, unreadNotificationCount: unread });
  },

  addNotification: async (notif) => {
    const doctorId = get().currentDoctor.id;
    const record: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      doctor_id: doctorId,
      patient_id: notif.patientId,
      patient_prn: notif.patientPrn,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: false,
      prediction_data: notif.predictionData,
      created_at: new Date().toISOString(),
    };

    await dataService.addNotification(record);
    const updatedList = [record, ...get().notifications];
    set({
      notifications: updatedList,
      unreadNotificationCount: updatedList.filter((n) => !n.read).length,
    });

    // Also trigger floating UI toast
    get().showToast({
      title: notif.title,
      message: notif.message,
      type: notif.type,
      patientPrn: notif.patientPrn,
    });
  },

  markNotificationRead: async (id) => {
    const docId = get().currentDoctor.id;
    await dataService.markNotificationRead(id, docId);
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({
      notifications: updated,
      unreadNotificationCount: updated.filter((n) => !n.read).length,
    });
  },

  markAllNotificationsRead: async () => {
    const docId = get().currentDoctor.id;
    await dataService.markAllNotificationsRead(docId);
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({
      notifications: updated,
      unreadNotificationCount: 0,
    });
  },

  clearNotifications: async () => {
    const docId = get().currentDoctor.id;
    await dataService.clearNotifications(docId);
    set({
      notifications: [],
      unreadNotificationCount: 0,
    });
  },

  showToast: (toast) => {
    const toastItem: ToastItem = {
      id: `toast-${Date.now()}`,
      ...toast,
    };
    set({ activeToast: toastItem });
  },

  dismissToast: () => set({ activeToast: null }),

  // Clinical & Visualization state
  patient: (initialActivePatient?.clinical_data as Partial<PatientData>) || {},
  prediction: (initialActivePatient?.latest_prediction as PredictionResponse) || null,
  isLoading: false,
  error: null,
  selectedModel: 'glb',
  focusedVessel: null,
  activeResultTab: 'assessment',
  isFormCollapsed: false,

  setPatientData: (data) => {
    set((state) => {
      const updatedPatient = { ...state.patient, ...data };
      // Also sync to active patient if present
      if (state.activePatient) {
        state.activePatient.clinical_data = updatedPatient;
      }
      return { patient: updatedPatient };
    });
  },

  setPrediction: (prediction) => {
    set((state) => {
      // Sync prediction to active patient
      if (state.activePatient && prediction) {
        const cadProb = prediction.predictions?.cad?.probability ?? 0;
        const status = cadProb >= 0.5 ? 'critical' : 'analyzed';
        state.activePatient.latest_prediction = prediction;
        state.activePatient.status = status;
        dataService.savePatient(state.activePatient);
      }
      return { prediction, error: null };
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setFocusedVessel: (focusedVessel) => set({ focusedVessel }),
  setActiveResultTab: (activeResultTab) => set({ activeResultTab }),
  setIsFormCollapsed: (isFormCollapsed) => set({ isFormCollapsed }),
  toggleFormCollapsed: () => set((state) => ({ isFormCollapsed: !state.isFormCollapsed })),

  reset: () =>
    set({
      patient: {},
      prediction: null,
      error: null,
      isLoading: false,
      selectedModel: 'glb',
      focusedVessel: null,
      activeResultTab: 'assessment',
    }),
}));
