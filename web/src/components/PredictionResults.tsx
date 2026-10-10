import { usePatientStore } from '../store/store';
import { AlertCircle, CheckCircle2, Activity } from 'lucide-react';

export function PredictionResults() {
  const { prediction, error, isLoading } = usePatientStore();

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded text-sm">
        <AlertCircle className="w-4 h-4 mb-2 inline-block mr-2" />
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 opacity-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-mono text-xs uppercase tracking-widest animate-pulse">Running Scan...</div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const renderVessel = (name: string, data: any) => {
    const isStenosis = data.label === 1;
    const prob = (data.probability * 100).toFixed(1);
    
    return (
      <div key={name} className="flex flex-col glass-panel p-3.5 relative overflow-hidden group">
        <div className="flex justify-between items-center mb-3 relative z-10">
          <span className="font-mono text-xs font-bold text-white/90">{name}</span>
          {isStenosis ? (
            <span className="text-[9px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Stenosis</span>
          ) : (
            <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Clear</span>
          )}
        </div>
        <div className="flex items-end gap-1.5 relative z-10">
          <span className={`text-2xl font-bold font-mono ${isStenosis ? 'text-glow-high' : 'text-glow'}`}>{prob}%</span>
          <span className="text-[10px] text-white/50 uppercase mb-1 font-mono">Risk</span>
        </div>
        
        {/* Probability bar background */}
        <div 
          className={`absolute bottom-0 left-0 h-1.5 transition-all duration-1000 ease-out ${isStenosis ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-sky-600 to-sky-400'}`}
          style={{ width: `${prob}%`, opacity: 0.9 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-panel p-5 relative overflow-hidden shadow-lg border border-white/10 group">
        <h3 className="text-xs uppercase font-mono text-muted-foreground mb-1 flex items-center justify-between">
          <span>Overall CAD Risk</span>
          <Activity className="w-3.5 h-3.5 text-primary opacity-50" />
        </h3>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-bold font-mono text-glow">{((prediction.predictions.cad?.probability ?? 0) * 100).toFixed(1)}%</span>
        </div>
        
        {prediction.predictions.cad?.label === 1 ? (
          <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
            <AlertCircle className="w-4 h-4" /> HIGH RISK DETECTED
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" /> LOW RISK (NORMAL)
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {renderVessel('LAD', prediction.predictions.lad)}
        {renderVessel('LCX', prediction.predictions.lcx)}
        {renderVessel('RCA', prediction.predictions.rca)}
      </div>
    </div>
  );
}
