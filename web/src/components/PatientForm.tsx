import { useState } from 'react';
import { usePatientStore } from '../store/store';
import { apiClient } from '../api/client';
import { Activity, Beaker, HeartPulse, User, Settings2, ChevronDown, ChevronUp } from 'lucide-react';

const MOCK_POSITIVE = {
  Age: 53, 'Weight': 90, 'Length': 175, 'Sex': 1, 'BMI': 29.38, 'DM': 0, 'HTN': 1, 'Current Smoker': 1, 'EX-Smoker': 0, 'FH': 0, 'Obesity': 1, 'CRF': 0, 'CVA': 0, 'Airway disease': 0, 'Thyroid Disease': 0, 'CHF': 0, 'DLP': 1, 'BP': 110, 'PR': 80, 'Edema': 0, 'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0, 'Diastolic Murmur': 0, 'Typical Chest Pain': 0, 'Dyspnea': 0, 'Function Class': 0, 'Atypical': 0, 'Nonanginal': 0, 'Exertional CP': 0, 'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 1, 'T inversion': 1, 'LVH': 0, 'Poor R Progression': 0, 'BBB': 0, 'FBS': 90, 'CR': 0.7, 'TG': 250, 'LDL': 155, 'HDL': 30.0, 'BUN': 8, 'ESR': 7, 'HB': 15.6, 'K': 4.7, 'Na': 141, 'WBC': 5700, 'Lymph': 39, 'Neut': 52, 'PLT': 261, 'EF-TTE': 50, 'Region RWMA': 0, 'VHD': "N"
};

const MOCK_NEGATIVE = {
  Age: 35, 'Weight': 65, 'Length': 170, 'Sex': 0, 'BMI': 22.49, 'DM': 0, 'HTN': 0, 'Current Smoker': 0, 'EX-Smoker': 0, 'FH': 0, 'Obesity': 0, 'CRF': 0, 'CVA': 0, 'Airway disease': 0, 'Thyroid Disease': 0, 'CHF': 0, 'DLP': 0, 'BP': 120, 'PR': 70, 'Edema': 0, 'Weak Peripheral Pulse': 0, 'Lung rales': 0, 'Systolic Murmur': 0, 'Diastolic Murmur': 0, 'Typical Chest Pain': 0, 'Dyspnea': 0, 'Function Class': 0, 'Atypical': 0, 'Nonanginal': 0, 'Exertional CP': 0, 'LowTH Ang': 0, 'Q Wave': 0, 'St Elevation': 0, 'St Depression': 0, 'T inversion': 0, 'LVH': 0, 'Poor R Progression': 0, 'BBB': 0, 'FBS': 85, 'CR': 0.8, 'TG': 120, 'LDL': 90, 'HDL': 55.0, 'BUN': 12, 'ESR': 5, 'HB': 14.0, 'K': 4.2, 'Na': 138, 'WBC': 6000, 'Lymph': 30, 'Neut': 60, 'PLT': 200, 'EF-TTE': 60, 'Region RWMA': 0, 'VHD': "N"
};

const KEY_FIELDS = [
  { id: 'Age', label: 'Age (yrs)', type: 'number', icon: <User className="w-3 h-3 text-sky-400" /> },
  { id: 'Sex', label: 'Sex (0=F, 1=M)', type: 'number', icon: <User className="w-3 h-3 text-sky-400" /> },
  { id: 'BMI', label: 'BMI', type: 'number', icon: <User className="w-3 h-3 text-sky-400" /> },
  { id: 'BP', label: 'Blood Pressure', type: 'number', icon: <HeartPulse className="w-3 h-3 text-rose-400" /> },
  { id: 'PR', label: 'Pulse Rate', type: 'number', icon: <HeartPulse className="w-3 h-3 text-rose-400" /> },
  { id: 'LDL', label: 'LDL Chol', type: 'number', icon: <Beaker className="w-3 h-3 text-emerald-400" /> },
  { id: 'FBS', label: 'Fasting Sugar', type: 'number', icon: <Beaker className="w-3 h-3 text-emerald-400" /> },
  { id: 'St Depression', label: 'ST Dep. (0/1)', type: 'number', icon: <Activity className="w-3 h-3 text-amber-400" /> },
  { id: 'T inversion', label: 'T Inversion (0/1)', type: 'number', icon: <Activity className="w-3 h-3 text-amber-400" /> },
];

export function PatientForm() {
  const { patient, setPatientData, setPrediction, setLoading, setError, isLoading } = usePatientStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePredict = async () => {
    if (Object.keys(patient).length === 0) {
      setError("Please enter patient clinical data or select a profile.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Provide dataset baseline defaults for any unpopulated fields to ensure robust prediction
    const baselineDefaults = {
      Age: 55,
      Sex: 1,
      BMI: 26.5,
      BP: 120,
      PR: 75,
      FBS: 95,
      CR: 0.8,
      TG: 150,
      LDL: 110,
      HDL: 45,
      HB: 14.5,
      K: 4.4,
      Na: 140,
      WBC: 6500,
      'EF-TTE': 55,
      'St Depression': 0,
      'T inversion': 0,
    };

    const payload = {
      ...baselineDefaults,
      ...patient,
    };
    
    try {
      const { data, error } = await apiClient.POST("/api/predict", {
        body: payload as any
      });
      
      if (error) {
        let msg = "Validation Error";
        if (typeof error === 'string') {
          msg = error;
        } else if ((error as any).detail) {
          const detail = (error as any).detail;
          msg = Array.isArray(detail)
            ? detail.map((d: any) => `${d.loc ? d.loc[d.loc.length - 1] : 'Field'}: ${d.msg}`).join('; ')
            : String(detail);
        } else {
          msg = JSON.stringify(error);
        }
        setError(msg);
      } else if (data) {
        setPrediction(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to Analysis Engine");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let numValue = value === '' ? undefined : Number(value);
    // Clamp binary fields to 0 or 1
    if (numValue !== undefined && ['Sex', 'St Depression', 'T inversion'].includes(field)) {
      numValue = Math.min(1, Math.max(0, Math.round(numValue)));
    }
    setPatientData({ [field]: numValue });
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Quick Actions */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] uppercase font-mono text-muted-foreground mb-1 flex items-center gap-1">
          <Settings2 className="w-3 h-3" /> Quick Load Profiles
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setPatientData(MOCK_POSITIVE)}
            className="glass-panel hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 text-foreground px-2 py-2 rounded-lg text-[10px] uppercase tracking-wider font-mono transition-all text-center"
          >
            High Risk
          </button>
          <button 
            onClick={() => setPatientData(MOCK_NEGATIVE)}
            className="glass-panel hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-foreground px-2 py-2 rounded-lg text-[10px] uppercase tracking-wider font-mono transition-all text-center"
          >
            Normal
          </button>
        </div>
      </div>

      {/* Interactive Form */}
      <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-white/5 p-3 border-b border-white/5 flex justify-between items-center">
          <span className="text-[11px] uppercase font-mono tracking-widest text-white/80">Manual Inputs</span>
          <span className="text-[9px] uppercase font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
            {Object.keys(patient).length} features set
          </span>
        </div>
        
        <div className="p-3 grid grid-cols-2 gap-3">
          {KEY_FIELDS.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono text-white/70 flex items-center gap-1.5">
                {field.icon}
                {field.label}
              </label>
              <input
                type={field.type}
                value={patient[field.id as keyof typeof patient] ?? ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder="Auto"
                className="bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
          ))}
        </div>

        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-2 text-[10px] uppercase font-mono text-white/40 hover:text-white/80 hover:bg-white/5 transition-all flex items-center justify-center gap-1 border-t border-white/5"
        >
          {showAdvanced ? <><ChevronUp className="w-3 h-3" /> Hide Details</> : <><ChevronDown className="w-3 h-3" /> Advanced: Missing fields are auto-imputed</>}
        </button>
        
        {showAdvanced && (
          <div className="p-3 bg-black/40 border-t border-white/5 text-[10px] text-white/50 font-mono leading-relaxed">
            CardioVision supports 54 features. Any unpopulated fields (e.g. Weight, HTN, ECG details) will be automatically imputed by the backend engine using dataset medians.
          </div>
        )}
      </div>

      <button 
        onClick={handlePredict}
        disabled={isLoading || Object.keys(patient).length === 0}
        className="w-full bg-primary/90 hover:bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] font-bold px-4 py-3.5 rounded-xl uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Analyzing...
          </span>
        ) : 'Run CardioVision Analysis'}
      </button>
    </div>
  );
}
