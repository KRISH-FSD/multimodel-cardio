import { create } from 'zustand'
import type { components } from '../api/schema'

type PatientData = components['schemas']['PatientInput']
type PredictionResponse = components['schemas']['PredictionResponse']

export type HeartModel = 'existing' | 'glb'
export type ArteryId = 'lad' | 'lcx' | 'rca'

interface PatientState {
  patient: Partial<PatientData>
  prediction: PredictionResponse | null
  isLoading: boolean
  error: string | null
  selectedModel: HeartModel
  focusedVessel: ArteryId | null
  activeResultTab: 'assessment' | 'guide'
  isFormCollapsed: boolean
  setPatientData: (data: Partial<PatientData>) => void
  setPrediction: (prediction: PredictionResponse | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedModel: (model: HeartModel) => void
  setFocusedVessel: (vessel: ArteryId | null) => void
  setActiveResultTab: (tab: 'assessment' | 'guide') => void
  setIsFormCollapsed: (collapsed: boolean) => void
  toggleFormCollapsed: () => void
  reset: () => void
}

export const usePatientStore = create<PatientState>((set) => ({
  patient: {},
  prediction: null,
  isLoading: false,
  error: null,
  selectedModel: 'glb',
  focusedVessel: null,
  activeResultTab: 'assessment',
  isFormCollapsed: false,
  setPatientData: (data) => set((state) => ({ patient: { ...state.patient, ...data } })),
  setPrediction: (prediction) => set({ prediction, error: null }),
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
}))

