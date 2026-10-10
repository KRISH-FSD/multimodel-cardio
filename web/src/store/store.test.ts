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
});
