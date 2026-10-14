import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
export interface Doctor {
  id: string;
  email: string;
  full_name: string;
  specialty: string;
  hospital: string;
  avatar_initials: string;
  created_at?: string;
}

export interface PatientRecord {
  id: string;
  doctor_id: string;
  prn: string;
  full_name: string;
  age: number;
  sex: number; // 0 = Female, 1 = Male
  contact?: string;
  notes?: string;
  clinical_data: Record<string, any>;
  latest_prediction?: any;
  status: 'pending' | 'analyzed' | 'critical' | 'stable';
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  doctor_id: string;
  patient_id?: string;
  patient_prn?: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  read: boolean;
  prediction_data?: any;
  created_at: string;
}

// Read environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check localStorage overrides if user entered keys in UI Settings
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('cardiovision_sb_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('cardiovision_sb_key') : null;

export const supabaseUrl = (storedUrl || envUrl || '').trim();
export const supabaseAnonKey = (storedKey || envAnonKey || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey.length > 20
  );
};

// Create Supabase Client instance (or null if unconfigured)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Initial Demo Doctors
export const DEMO_DOCTORS: Doctor[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'dr.krish@cardiovision.ai',
    full_name: 'Dr. Krish Siva',
    specialty: 'Interventional Cardiology',
    hospital: 'CardioVision Medical Center',
    avatar_initials: 'KS',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'dr.sarah@cardiovision.ai',
    full_name: 'Dr. Sarah Lin',
    specialty: 'Preventive Cardiology',
    hospital: 'Metropolitan Heart Hospital',
    avatar_initials: 'SL',
  },
];

// Initial Seed Patients for local fallback
export const DEFAULT_PATIENTS: PatientRecord[] = [
  {
    id: '10420000-0000-0000-0000-000000001042',
    doctor_id: '00000000-0000-0000-0000-000000000001',
    prn: 'PRN-1042',
    full_name: 'Eleanor Vance',
    age: 61,
    sex: 1,
    contact: '+1 (555) 234-5678',
    notes: 'Exertional angina, hypertension history, elevated LDL. Suspected LAD stenosis.',
    clinical_data: {
      Age: 61, Weight: 90, Length: 175, Sex: 1, BMI: 29.38,
      DM: 0, HTN: 1, 'Current Smoker': 1, 'EX-Smoker': 0, FH: 0,
      Obesity: 1, CRF: 0, CVA: 0, 'Airway disease': 0, 'Thyroid Disease': 0,
      CHF: 0, DLP: 1, BP: 123, PR: 94, Edema: 0,
      'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0,
      'Diastolic Murmur': 0, 'Typical Chest Pain': 1, Dyspnea: 0,
      'Function Class': 0, Atypical: 0, Nonanginal: 0, 'Exertional CP': 0,
      'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0,
      'T inversion': 0, LVH: 0, 'Poor R Progression': 0, BBB: 0,
      FBS: 94, CR: 0.8, TG: 180, LDL: 167, HDL: 38.0, BUN: 12,
      ESR: 9, HB: 15.2, K: 4.6, Na: 141, WBC: 6800, Lymph: 35,
      Neut: 58, PLT: 245, 'EF-TTE': 48, 'Region RWMA': 0, VHD: 'N',
    },
    latest_prediction: null,
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: '10430000-0000-0000-0000-000000001043',
    doctor_id: '00000000-0000-0000-0000-000000000001',
    prn: 'PRN-1043',
    full_name: 'Marcus Reynolds',
    age: 48,
    sex: 1,
    contact: '+1 (555) 345-6789',
    notes: 'Routine cardiovascular health check. Normal ECG, mild fatigue.',
    clinical_data: {
      Age: 48, Weight: 76, Length: 174, Sex: 1, BMI: 25.1,
      DM: 0, HTN: 0, 'Current Smoker': 0, 'EX-Smoker': 0, FH: 0,
      Obesity: 0, CRF: 0, CVA: 0, 'Airway disease': 0, 'Thyroid Disease': 0,
      CHF: 0, DLP: 0, BP: 122, PR: 70, Edema: 0,
      'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0,
      'Diastolic Murmur': 0, 'Typical Chest Pain': 0, Dyspnea: 0,
      'Function Class': 0, Atypical: 0, Nonanginal: 0, 'Exertional CP': 0,
      'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0,
      'T inversion': 0, LVH: 0, 'Poor R Progression': 0, BBB: 0,
      FBS: 88, CR: 0.85, TG: 130, LDL: 95, HDL: 52.0, BUN: 13,
      ESR: 6, HB: 14.8, K: 4.3, Na: 139, WBC: 6200, Lymph: 32,
      Neut: 59, PLT: 220, 'EF-TTE': 62, 'Region RWMA': 0, VHD: 'N',
    },
    latest_prediction: null,
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

// Initial Seed Notifications for local fallback
export const DEFAULT_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: 'notif-1',
    doctor_id: '00000000-0000-0000-0000-000000000001',
    title: 'System Ready',
    message: 'CardioVision AI model initialized. Enter patient clinical data and click Run Cardiovascular Analysis.',
    type: 'info',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA SERVICE (HYBRID SUPABASE + LOCAL STORAGE)
// ─────────────────────────────────────────────────────────────────────────────

export const dataService = {
  // ── Patients ──
  async getPatients(doctorId: string): Promise<PatientRecord[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as PatientRecord[];
        }
      } catch (err) {
        console.warn('Supabase fetch patients failed, falling back to local:', err);
      }
    }

    // Local fallback with migration guard to clear old pre-populated test cache
    const key = `cardiovision_patients_${doctorId}`;
    const vKey = 'cardiovision_patients_init_v5';
    if (typeof window !== 'undefined' && !localStorage.getItem(vKey)) {
      localStorage.removeItem(key);
      localStorage.setItem(vKey, 'true');
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore parse error
      }
    }

    // Default seed
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(DEFAULT_PATIENTS));
    }
    return DEFAULT_PATIENTS;
  },

  async savePatient(patient: PatientRecord): Promise<PatientRecord> {
    // Save to local storage first
    const key = `cardiovision_patients_${patient.doctor_id}`;
    let list: PatientRecord[] = [];
    try {
      list = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      list = [];
    }

    const index = list.findIndex((p) => p.id === patient.id || p.prn === patient.prn);
    if (index >= 0) {
      list[index] = { ...list[index], ...patient, updated_at: new Date().toISOString() };
    } else {
      list.unshift(patient);
    }
    localStorage.setItem(key, JSON.stringify(list));

    // Save to Supabase if available
    if (supabase) {
      try {
        await supabase.from('patients').upsert({
          id: patient.id,
          doctor_id: patient.doctor_id,
          prn: patient.prn,
          full_name: patient.full_name,
          age: patient.age,
          sex: patient.sex,
          contact: patient.contact || '',
          notes: patient.notes || '',
          clinical_data: patient.clinical_data || {},
          latest_prediction: patient.latest_prediction || null,
          status: patient.status || 'pending',
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase save patient error:', err);
      }
    }

    return patient;
  },

  async deletePatient(patientId: string, doctorId: string): Promise<boolean> {
    const key = `cardiovision_patients_${doctorId}`;
    try {
      const list: PatientRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = list.filter((p) => p.id !== patientId);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch {
      // ignore
    }

    if (supabase) {
      try {
        await supabase.from('patients').delete().eq('id', patientId);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }
    return true;
  },

  // ── Notifications ──
  async getNotifications(doctorId: string): Promise<NotificationRecord[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('doctor_id', doctorId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          return data as NotificationRecord[];
        }
      } catch (err) {
        console.warn('Supabase fetch notifications failed, falling back:', err);
      }
    }

    const key = `cardiovision_notifs_${doctorId}`;
    const vKey = 'cardiovision_notifs_init_v5';
    if (typeof window !== 'undefined' && !localStorage.getItem(vKey)) {
      localStorage.removeItem(key);
      localStorage.setItem(vKey, 'true');
    }
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
    return DEFAULT_NOTIFICATIONS;
  },

  async addNotification(notif: NotificationRecord): Promise<NotificationRecord> {
    const key = `cardiovision_notifs_${notif.doctor_id}`;
    let list: NotificationRecord[] = [];
    try {
      list = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      list = [];
    }

    list.unshift(notif);
    localStorage.setItem(key, JSON.stringify(list));

    if (supabase) {
      try {
        await supabase.from('notifications').insert({
          id: notif.id,
          doctor_id: notif.doctor_id,
          patient_id: notif.patient_id || null,
          patient_prn: notif.patient_prn || null,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: notif.read,
          prediction_data: notif.prediction_data || null,
          created_at: notif.created_at,
        });
      } catch (err) {
        console.warn('Supabase insert notification error:', err);
      }
    }

    return notif;
  },

  async markNotificationRead(id: string, doctorId: string): Promise<void> {
    const key = `cardiovision_notifs_${doctorId}`;
    try {
      const list: NotificationRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (supabase) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update notification error:', err);
      }
    }
  },

  async markAllNotificationsRead(doctorId: string): Promise<void> {
    const key = `cardiovision_notifs_${doctorId}`;
    try {
      const list: NotificationRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = list.map((n) => ({ ...n, read: true }));
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (supabase) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('doctor_id', doctorId);
      } catch (err) {
        console.warn('Supabase mark all read error:', err);
      }
    }
  },

  async clearNotifications(doctorId: string): Promise<void> {
    const key = `cardiovision_notifs_${doctorId}`;
    localStorage.setItem(key, JSON.stringify([]));

    if (supabase) {
      try {
        await supabase.from('notifications').delete().eq('doctor_id', doctorId);
      } catch (err) {
        console.warn('Supabase clear notifications error:', err);
      }
    }
  },

  // ── Connection Test ──
  async testConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
    try {
      const testClient = createClient(url, key);
      const { error } = await testClient.from('doctors').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Successfully connected to Supabase database!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  },
};
