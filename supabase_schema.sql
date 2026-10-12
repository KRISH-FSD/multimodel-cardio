-- =========================================================================
-- CARDIOVISION 3D - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- =========================================================================

-- 1. Enable UUID Extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DOCTORS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    specialty TEXT DEFAULT 'Cardiology',
    hospital TEXT DEFAULT 'CardioVision Medical Center',
    avatar_initials TEXT DEFAULT 'DR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id TEXT NOT NULL,
    prn TEXT NOT NULL,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    sex INTEGER NOT NULL, -- 0 = Female, 1 = Male
    contact TEXT,
    notes TEXT,
    clinical_data JSONB DEFAULT '{}'::jsonb,
    latest_prediction JSONB,
    status TEXT DEFAULT 'pending', -- 'pending' | 'analyzed' | 'critical' | 'stable'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster querying by doctor and PRN
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON public.patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_prn ON public.patients(prn);

-- 4. PREDICTIONS AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    cad_probability REAL NOT NULL,
    lad_probability REAL NOT NULL,
    lcx_probability REAL NOT NULL,
    rca_probability REAL NOT NULL,
    suspected_vessel TEXT,
    clinical_payload JSONB NOT NULL,
    model_response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_predictions_patient_id ON public.predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_predictions_doctor_id ON public.predictions(doctor_id);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id TEXT NOT NULL,
    patient_id TEXT,
    patient_prn TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'critical' | 'warning' | 'success' | 'info'
    read BOOLEAN DEFAULT false NOT NULL,
    prediction_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON public.notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- 6. SEED INITIAL DEMO DOCTOR & PATIENTS (FOR TESTING)
INSERT INTO public.doctors (id, email, full_name, specialty, hospital, avatar_initials)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'dr.krish@cardiovision.ai', 'Dr. Krish Siva', 'Interventional Cardiology', 'CardioVision Medical Center', 'KS'),
    ('00000000-0000-0000-0000-000000000002', 'dr.sarah@cardiovision.ai', 'Dr. Sarah Lin', 'Preventive Cardiology', 'Metropolitan Heart Hospital', 'SL')
ON CONFLICT (email) DO NOTHING;

-- Seed Sample Patient PRN-1042
INSERT INTO public.patients (
    id,
    doctor_id,
    prn,
    full_name,
    age,
    sex,
    contact,
    notes,
    clinical_data,
    latest_prediction,
    status
)
VALUES (
    '10420000-0000-0000-0000-000000001042',
    '00000000-0000-0000-0000-000000000001',
    'PRN-1042',
    'Eleanor Vance',
    61,
    1,
    '+1 (555) 234-5678',
    'Chief complaint: Exertional angina, hypertension history, elevated LDL.',
    '{"Age": 61, "Sex": 1, "Weight": 90, "Length": 175, "BMI": 29.38, "BP": 123, "PR": 94, "HTN": 1, "Current Smoker": 1, "DLP": 1, "Typical Chest Pain": 1, "FBS": 94, "CR": 0.8, "TG": 180, "LDL": 167, "HDL": 38.0, "EF-TTE": 48}'::jsonb,
    '{"predictions": {"cad": {"probability": 0.842, "label": 1}, "lad": {"probability": 0.784, "label": 1}, "lcx": {"probability": 0.381, "label": 0}, "rca": {"probability": 0.463, "label": 0}}}'::jsonb,
    'critical'
)
ON CONFLICT DO NOTHING;

-- Seed Sample Patient PRN-1043
INSERT INTO public.patients (
    id,
    doctor_id,
    prn,
    full_name,
    age,
    sex,
    contact,
    notes,
    clinical_data,
    latest_prediction,
    status
)
VALUES (
    '10430000-0000-0000-0000-000000001043',
    '00000000-0000-0000-0000-000000000001',
    'PRN-1043',
    'Marcus Reynolds',
    48,
    1,
    '+1 (555) 345-6789',
    'Routine pre-op cardiovascular screening. Mild borderline BP.',
    '{"Age": 48, "Sex": 1, "Weight": 78, "Length": 176, "BMI": 25.18, "BP": 128, "PR": 72, "HTN": 0, "Current Smoker": 0, "DLP": 0, "Typical Chest Pain": 0, "FBS": 88, "CR": 0.9, "TG": 135, "LDL": 105, "HDL": 49.0, "EF-TTE": 58}'::jsonb,
    '{"predictions": {"cad": {"probability": 0.185, "label": 0}, "lad": {"probability": 0.142, "label": 0}, "lcx": {"probability": 0.118, "label": 0}, "rca": {"probability": 0.165, "label": 0}}}'::jsonb,
    'stable'
)
ON CONFLICT DO NOTHING;

-- Seed Sample Initial Notification
INSERT INTO public.notifications (
    doctor_id,
    patient_id,
    patient_prn,
    title,
    message,
    type,
    read
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '10420000-0000-0000-0000-000000001042',
    'PRN-1042',
    'High Risk CAD Alert',
    'Patient PRN-1042 CAD risk evaluated at 84.2%. LAD artery flagged at 78.4% stenosis risk.',
    'critical',
    false
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (ENABLE OR DISABLE AS NEEDED)
-- =========================================================================
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read and write for rapid hackathon testing
CREATE POLICY "Allow public read/write on doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on predictions" ON public.predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
