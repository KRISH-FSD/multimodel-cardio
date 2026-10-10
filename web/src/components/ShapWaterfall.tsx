import React, { Suspense } from 'react';
import { usePatientStore } from '../store/store';

const Plot = React.lazy(() => import('react-plotly.js'));

export function ShapWaterfall() {
  const { prediction } = usePatientStore();

  if (!prediction || !prediction.explanations || !prediction.explanations.cad || !prediction.explanations.cad.top) {
    return null;
  }

  // Sort importances by absolute value to get top 10
  const importances = [...prediction.explanations.cad.top]
    .sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap))
    .slice(0, 10)
    .reverse(); // Reverse for horizontal bar chart so biggest is on top

  const y = importances.map((item) => item.feature);
  const x = importances.map((item) => item.shap);
  
  // Colors: Red for positive (pushes towards CAD), Blue for negative (pushes towards Normal)
  const markerColors = x.map((val) => val > 0 ? '#f43f5e' : '#38bdf8'); // rose-500 and sky-400

  return (
    <div className="p-5 flex flex-col h-full">
      <h3 className="text-xs uppercase font-mono text-muted-foreground mb-4">Explainability (SHAP)</h3>
      <div className="flex-1 w-full min-h-[300px]">
        <Suspense fallback={<div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading Plotly...</div>}>
          <Plot
            data={[
              {
                type: 'bar',
                x: x,
                y: y,
                orientation: 'h',
                marker: { color: markerColors, line: { width: 0 } },
              }
            ]}
            layout={{
              autosize: true,
              margin: { l: 100, r: 20, t: 20, b: 40 },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: '#94a3b8', family: '"JetBrains Mono", monospace', size: 10 },
              xaxis: { 
                title: 'SHAP Value (Impact on Model Output)',
                gridcolor: 'rgba(148, 163, 184, 0.1)',
                zerolinecolor: 'rgba(148, 163, 184, 0.3)',
              },
              yaxis: { 
                gridcolor: 'transparent',
              },
              showlegend: false,
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </div>
    </div>
  );
}
