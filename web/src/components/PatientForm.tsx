import { usePatientStore } from '../store/store';
import { apiClient } from '../api/client';
import { Activity, Beaker, HeartPulse, User } from 'lucide-react';

const MOCK_POSITIVE = {
  Age: 53, 'Weight': 90, 'Length': 175, 'Sex': 1, 'BMI': 29.38, 'DM': 0, 'HTN': 1, 'Current Smoker': 1, 'EX-Smoker': 0, 'FH': 0, 'Obesity': 1, 'CRF': 0, 'CVA': 0, 'Airway disease': 0, 'Thyroid Disease': 0, 'CHF': 0, 'DLP': 1, 'BP': 110, 'PR': 80, 'Edema': 0, 'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0, 'Diastolic Murmur': 0, 'Typical Chest Pain': 0, 'Dyspnea': 0, 'Function Class': 0, 'Atypical': 0, 'Nonanginal': 0, 'Exertional CP': 0, 'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 1, 'T inversion': 1, 'LVH': 0, 'Poor R Progression': 0, 'BBB': 0, 'FBS': 90, 'CR': 0.7, 'TG': 250, 'LDL': 155, 'HDL': 30.0, 'BUN': 8, 'ESR': 7, 'HB': 15.6, 'K': 4.7, 'Na': 141, 'WBC': 5700, 'Lymph': 39, 'Neut': 52, 'PLT': 261, 'EF-TTE': 50, 'Region RWMA': 0, 'VHD': "N"
};

const MOCK_NEGATIVE = {
  Age: 35, 'Weight': 65, 'Length': 170, 'Sex': 0, 'BMI': 22.49, 'DM': 0, 'HTN': 0, 'Current Smoker': 0, 'EX-Smoker': 0, 'FH': 0, 'Obesity': 0, 'CRF': 0, 'CVA': 0, 'Airway disease': 0, 'Thyroid Disease': 0, 'CHF': 0, 'DLP': 0, 'BP': 120, 'PR': 70, 'Edema': 0, 'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0, 'Diastolic Murmur': 0, 'Typical Chest Pain': 0, 'Dyspnea': 0, 'Function Class': 0, 'Atypical': 0, 'Nonanginal': 0, 'Exertional CP': 0, 'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0, 'T inversion': 0, 'LVH': 0, 'Poor R Progression': 0, 'BBB': 0, 'FBS': 85, 'CR': 0.8, 'TG': 120, 'LDL': 90, 'HDL': 55.0, 'BUN': 12, 'ESR': 5, 'HB': 14.0, 'K': 4.2, 'Na': 138, 'WBC': 6000, 'Lymph': 30, 'Neut': 60, 'PLT': 200, 'EF-TTE': 60, 'Region RWMA': 0, 'VHD': "N"
};

export function PatientForm() {
  const { patient, setPatientData, setPrediction, setLoading, setError, isLoading } = usePatientStore();

  const handlePredict = async () => {
    if (Object.keys(patient).length < 54) {
      setError("Please load a complete patient profile first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await apiClient.POST("/api/predict", {
        body: patient as any
      });
      
      if (error) {
        setError(String(error));
      } else if (data) {
        setPrediction(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to Analysis Engine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setPatientData(MOCK_POSITIVE)}
          className="glass-panel hover:bg-white/5 border border-white/10 text-foreground px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-mono transition-all shadow-sm hover:shadow-md"
        >
          Load Profile: High Risk (CAD)
        </button>
        <button 
          onClick={() => setPatientData(MOCK_NEGATIVE)}
          className="glass-panel hover:bg-white/5 border border-white/10 text-foreground px-4 py-3 rounded-xl text-xs uppercase tracking-wider font-mono transition-all shadow-sm hover:shadow-md"
        >
          Load Profile: Low Risk (Normal)
        </button>
      </div>

      {/* Basic Info Summary */}
      {patient.Age ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-3.5 border border-white/10">
              <div className="text-[10px] uppercase font-mono text-sky-400 flex items-center gap-1.5 mb-2"><User className="w-3.5 h-3.5" /> Demographics</div>
              <div className="text-sm font-medium">{patient.Age} yrs, {patient.Sex === 1 ? 'Male' : 'Female'}</div>
              <div className="text-xs text-muted-foreground mt-1">BMI: {patient.BMI?.toFixed(1)} ({patient.Obesity === 1 ? 'Obese' : 'Normal'})</div>
            </div>
            <div className="glass-panel p-3.5 border border-white/10">
              <div className="text-[10px] uppercase font-mono text-rose-400 flex items-center gap-1.5 mb-2"><HeartPulse className="w-3.5 h-3.5" /> Vitals</div>
              <div className="text-sm font-medium">BP: {patient.BP} mmHg</div>
              <div className="text-xs text-muted-foreground mt-1">PR: {patient.PR} bpm</div>
            </div>
            <div className="glass-panel p-3.5 border border-white/10">
              <div className="text-[10px] uppercase font-mono text-amber-400 flex items-center gap-1.5 mb-2"><Activity className="w-3.5 h-3.5" /> ECG Highlights</div>
              <div className="text-sm font-medium">ST Dep: {patient['St Depression'] === 1 ? 'Yes' : 'No'}</div>
              <div className="text-xs text-muted-foreground mt-1">T-Inv: {patient['T inversion'] === 1 ? 'Yes' : 'No'}</div>
            </div>
            <div className="glass-panel p-3.5 border border-white/10">
              <div className="text-[10px] uppercase font-mono text-emerald-400 flex items-center gap-1.5 mb-2"><Beaker className="w-3.5 h-3.5" /> Labs</div>
              <div className="text-sm font-medium">LDL: {patient.LDL} mg/dL</div>
              <div className="text-xs text-muted-foreground mt-1">FBS: {patient.FBS} mg/dL</div>
            </div>
          </div>
          
          <div className="text-[10px] text-muted-foreground text-center font-mono py-2">
            + {Object.keys(patient).length - 8} additional parameters loaded
          </div>

          <button 
            onClick={handlePredict}
            disabled={isLoading}
            className="w-full bg-primary/90 hover:bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] font-semibold px-4 py-4 rounded-xl uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? 'Processing Scan...' : 'Run CardioVision Analysis'}
          </button>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center p-8 border border-dashed border-white/20 rounded-xl glass-panel">
          Select a patient profile to begin scanning.
        </div>
      )}
    </div>
  );
}
