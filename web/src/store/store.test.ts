import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientStore } from './store';

describe('usePatientStore', () => {
  beforeEach(() => {
    usePatientStore.getState().reset();
  });

  it('should initialize with empty patient data and no prediction', () => {
    const state = usePatientStore.getState();
    expect(state.patient).toEqual({});
    expect(state.prediction).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.selectedModel).toBe('glb');
  });

  it('should set patient data correctly', () => {
    usePatientStore.getState().setPatientData({ Age: 55, Sex: 1 });
    const state = usePatientStore.getState();
    expect(state.patient.Age).toBe(55);
    expect(state.patient.Sex).toBe(1);
  });

  it('should update loading and error states', () => {
    usePatientStore.getState().setLoading(true);
    expect(usePatientStore.getState().isLoading).toBe(true);

    usePatientStore.getState().setError('Network Error');
    const state = usePatientStore.getState();
    expect(state.error).toBe('Network Error');
    expect(state.isLoading).toBe(false); // Should reset loading when error is set
  });

  it('should toggle selected model without affecting other state', () => {
    // Set some patient data and prediction first
    usePatientStore.getState().setPatientData({ Age: 55, Sex: 1 });

    // Switch model to existing
    usePatientStore.getState().setSelectedModel('existing');
    let state = usePatientStore.getState();
    expect(state.selectedModel).toBe('existing');
    expect(state.patient.Age).toBe(55); // Patient data preserved
    expect(state.patient.Sex).toBe(1);

    // Switch back to glb
    usePatientStore.getState().setSelectedModel('glb');
    state = usePatientStore.getState();
    expect(state.selectedModel).toBe('glb');
    expect(state.patient.Age).toBe(55); // Still preserved
  });

  it('should reset selectedModel on full reset', () => {
    usePatientStore.getState().setSelectedModel('existing');
    usePatientStore.getState().reset();
    expect(usePatientStore.getState().selectedModel).toBe('glb');
  });
});
