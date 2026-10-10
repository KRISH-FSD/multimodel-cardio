import { BrainCircuit, Activity, HeartPulse } from 'lucide-react';
import { PatientForm } from './components/PatientForm';
import { PredictionResults } from './components/PredictionResults';
import { ShapWaterfall } from './components/ShapWaterfall';
import { CommandDeck } from './components/CommandDeck';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans p-4 gap-4">
      {/* Top Bar */}
      <header className="h-16 glass-panel flex items-center px-6 shrink-0 z-50 rounded-2xl relative shadow-lg">
        <div className="flex items-center gap-3 text-primary text-glow">
          <HeartPulse className="w-6 h-6 animate-pulse" />
          <h1 className="font-mono text-base tracking-widest uppercase font-bold">CardioVision 3D <span className="text-muted-foreground font-normal">| Console</span></h1>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Sidebar: Form */}
        <aside className="w-[360px] glass-panel flex flex-col overflow-y-auto shrink-0 relative z-40">
          <div className="p-5 border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl">
            <h2 className="text-sm uppercase font-mono tracking-widest text-primary text-glow flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Patient Parameters
            </h2>
          </div>
          <div className="p-2">
            <PatientForm />
          </div>
        </aside>

        {/* Center: 3D View */}
        <main className="flex-1 flex flex-col relative min-w-0 glass-panel overflow-hidden">
          <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md border border-white/10 p-2.5 rounded-lg text-xs font-mono uppercase tracking-widest text-primary text-glow">
            Coronary Topography
          </div>
          <div className="flex-1 bg-transparent flex items-center justify-center relative">
            <CommandDeck />
          </div>
        </main>

        {/* Right Sidebar: Prediction & Explainability */}
        <aside className="w-[380px] glass-panel flex flex-col overflow-y-auto shrink-0 relative z-40">
          <div className="p-5 border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl">
            <h2 className="text-sm uppercase font-mono tracking-widest text-primary text-glow flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              Analysis Engine
            </h2>
          </div>
          <div className="flex flex-col h-full overflow-y-auto">
            <PredictionResults />
            <div className="flex-1 border-t border-white/5 mt-4">
              <ShapWaterfall />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
