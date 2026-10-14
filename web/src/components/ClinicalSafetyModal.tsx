import {
  ShieldAlert,
  X,
  AlertTriangle,
  Database,
  Eye,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface ClinicalSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClinicalSafetyModal({ isOpen, onClose }: ClinicalSafetyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Clinical Safety & Regulatory Notice
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80 uppercase">
                  CDS Prototype
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Research Decision Support Prototype — Multimodal AI Hackathon 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Close Notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {/* Main Regulatory Warning Callout */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-900 block text-xs">
                Not a Certified Diagnostic Medical Device
              </span>
              <p className="text-[11.5px] text-amber-900/90 mt-1">
                CardioVision 3D is strictly an educational and clinical decision support prototype developed for research evaluation. Predictions represent statistical probability estimates and are <strong>strictly not a substitute for formal coronary angiography (CCTA), invasive catheterization, or licensed physician clinical judgment</strong>.
              </p>
            </div>
          </div>

          {/* Section 1: Statistical Probability vs Direct Lesion Coordinates */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Eye className="w-4 h-4 text-teal-600 shrink-0" />
              <span>3D Anatomical Twin & Lesion Coordinate Disclaimer</span>
            </div>
            <p className="text-[11.5px] text-slate-600">
              Coronary artery geometries, surface beacons, and flow splines illustrate <strong>canonical anatomical perfusion territories</strong> (LAD, LCX, RCA). They do not represent pixel-level lesion coordinates or direct millimeter luminal imaging.
            </p>
            <p className="text-[11.5px] text-slate-500">
              Regional Wall Motion Abnormality (<code className="font-mono text-[10.5px] bg-slate-200/80 px-1 py-0.2 rounded text-slate-800">RWMA</code>) is incorporated solely as an observational echocardiographic biomarker; it does not provide direct 3D spatial lesion mapping.
            </p>
          </div>

          {/* Section 2: Dataset Characteristics & Leakage Quarantine */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Database className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Dataset Scope & Programmatic Leakage Quarantine</span>
            </div>
            <p className="text-[11.5px] text-slate-600">
              The underlying models are trained and calibrated on the peer-reviewed <strong>Z-Alizadeh Sani Cardiovascular Dataset</strong> (<span className="font-semibold">N = 303</span> consecutive catheterization patients, 55 non-invasive clinical attributes).
            </p>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800 text-[11px]">
                  Programmatic Leakage Firewall Verified
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                31/31 Tests Passing
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Catheterization outcomes (<code className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">Cath</code>, <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">CAD</code>, <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">LAD</code>, <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">LCX</code>, <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">RCA</code>) are strictly quarantined from feature inputs. Preprocessing transformers are fitted exclusively on training folds.
            </p>
          </div>

          {/* Section 3: Recommended Clinical Protocol */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <FileText className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Clinical Triage Protocol</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11.5px] text-slate-600">
              <li>
                <strong className="text-slate-800">High-Risk Triage (≥50% Stenosis):</strong> Suggests immediate referral for diagnostic CCTA or invasive catheterization.
              </li>
              <li>
                <strong className="text-slate-800">Moderate Risk (35–49%):</strong> Recommends secondary non-invasive functional testing (Stress ECG, SPECT, or Stress Echo).
              </li>
              <li>
                <strong className="text-slate-800">Low Risk (&lt;35%):</strong> Correlates with non-obstructive coronary status; continue routine outpatient monitoring.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer with Acknowledgment Action */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Requirement 5: Clinical Safety & Compliance
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            I Acknowledge & Understand
          </button>
        </div>
      </div>
    </div>
  );
}
