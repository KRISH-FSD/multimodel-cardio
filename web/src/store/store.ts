import { create } from 'zustand'
import type { components } from '../api/schema'

type PatientData = components['schemas']['PatientInput']
type PredictionResponse = components['schemas']['PredictionResponse']

export type HeartModel = 'existing' | 'glb'

interface PatientState {
  patient: Partial<PatientData>
  prediction: PredictionResponse | null
  isLoading: boolean
  error: string | null
  selectedModel: HeartModel
  setPatientData: (data: Partial<PatientData>) => void
  setPrediction: (prediction: PredictionResponse | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedModel: (model: HeartModel) => void
  reset: () => void
}

export const usePatientStore = create<PatientState>((set) => ({
  patient: {},
  prediction: null,
  isLoading: false,
  error: null,
  selectedModel: 'existing',
  setPatientData: (data) => set((state) => ({ patient: { ...state.patient, ...data } })),
  setPrediction: (prediction) => set({ prediction, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  reset: () => set({ patient: {}, prediction: null, error: null, isLoading: false, selectedModel: 'existing' })
}))
