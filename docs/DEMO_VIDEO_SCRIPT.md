# CardioVision 3D — Demonstration Video Storyboard & Recording Blueprint
**Track A: Cardiovascular Risk Visualization & Prediction (Multimodal AI Hackathon 2026)**  
**Target Video Duration:** 8 minutes 30 seconds (3–10 minute submission window)  
**Deliverable:** Deliverable 5 (Demonstration Video & Script)

---

## 🎬 Pre-Flight Recording Checklist

| Item | Recommended Setup | Verified |
| :--- | :--- | :---: |
| **Display & Resolution** | 1920×1080 (1080p) or 2560×1440 (1440p) at 60 fps, 100% OS scaling | [ ] |
| **Browser Environment** | Chrome or Edge in Clean Window (No bookmarks bar, DevTools closed) | [ ] |
| **Backend API** | `uvicorn api.app:app --port 8000` running in background terminal | [ ] |
| **Frontend Web** | `pnpm run dev` running on `http://localhost:5173` | [ ] |
| **Terminal Ready** | Split-pane terminal open to repo root for live `pytest` command | [ ] |
| **Theme & Canvas** | WebGL canvas hardware acceleration enabled; sound check complete | [ ] |

---

## ⏱️ Master Timeline & Scene Breakdown

```
0:00 ─── 1:00  Problem Statement, Clinical Context & Safety Disclaimer
1:00 ─── 2:00  ML Rigor & Leakage Firewall Proof (Live Pytest Execution)
2:00 ─── 4:00  End-to-End Workflow: Normal vs High-Risk Presets & Live Inference
4:00 ─── 6:00  3D Anatomical Heart: OrbitControls, Color-Coding & Vessel Sync
6:00 ─── 7:30  Model Evaluation / Insights: ROC Curves, Confusion Matrix & Brier Scores
7:30 ─── 8:30  Architecture, Docker Reproducibility & Clinical Conclusion
```

---

### Scene 1: Problem Statement, Clinical Context & Safety Disclaimer
- **Timestamp:** `0:00 – 1:00` (Duration: 60s)
- **Viewport / Screen Focus:** Web application hero view (`http://localhost:5173/`) showcasing the top header, the amber clinical safety disclaimer banner, and the 3D heart resting state.
- **Physical Actions & Clicks:**
  1. Start recording with full view of CardioVision 3D interface.
  2. Hover cursor smoothly over the **Persistent Clinical Safety Disclaimer Banner** below the header.
  3. Highlight the 3 major coronary artery territories indicated on screen: **LAD** (Left Anterior Descending), **LCX** (Left Circumflex), and **RCA** (Right Coronary Artery).
- **Visual Highlights On Screen:**
  - Amber safety banner: *"CLINICAL DECISION SUPPORT PROTOTYPE — FOR RESEARCH EVALUATION ONLY. Not cleared for primary diagnostic use."*
  - Clean Apple-inspired slate interface (`bg-[#f8fafc]`, crisp borders, pill tags).
  - Resting 3D heart with subtle natural idle pulsation and translucent vessels.
- **Key Talking Points & Cues (In Your Own Words):**
  - Clinical challenge: Coronary Artery Disease (CAD) remains the leading global cause of mortality; 50%+ stenosis in coronary vessels requires prompt detection.
  - Multi-target clinical reality: Clinicians do not just diagnose "CAD yes/no"; they need vessel-specific localization (LAD, LCX, RCA) to guide catheterization and stenting.
  - Ethical AI & Medical Safety: Point out the prominent disclaimer banner establishing CardioVision as an assistive triage aid, not an autonomous diagnostician.

---

### Scene 2: ML Rigor & Leakage Firewall Proof
- **Timestamp:** `1:00 – 2:00` (Duration: 60s)
- **Viewport / Screen Focus:** Split-screen or quick cut to Terminal running in repository root `d:\FREELANCE\HACKATHON\CARDIOC`.
- **Physical Actions & Clicks:**
  1. Switch to terminal window.
  2. Type and run the automated test suite live:
     ```powershell
     python -m pytest tests/test_leakage.py -v
     ```
  3. Watch all 31 leakage firewall test cases pass with green checkmarks.
  4. Briefly open `tests/test_leakage.py` or `src/pipeline.py` to highlight the `DataLeakageFirewall` class and the strictly dropped target columns.
- **Visual Highlights On Screen:**
  - 31 passing tests displaying `PASSED` in rapid sequence (0.3s execution).
  - Explicit proof that `Cath` (catheterization target), `CAD`, `LAD`, `LCX`, `RCA`, and post-test imaging markers are quarantined before feature transformation.
  - Train/test split stratified firewall: preprocessing pipelines (imputers, scalers) fitted exclusively on training folds.
- **Key Talking Points & Cues (In Your Own Words):**
  - Why leakage matters in cardiology: Medical datasets frequently leak downstream cath-lab diagnoses or future outcomes into feature sets, producing artificially inflated metrics.
  - Automated CI Firewall: 31 unit tests assert zero leakage across categorical, numeric, and vessel-specific targets.
  - Zero-leakage guarantee: Test fold is unseen until final inference; no global fit calls across the whole dataset.

---

### Scene 3: End-to-End Patient Workflow (Normal vs High-Risk)
- **Timestamp:** `2:00 – 4:00` (Duration: 120s)
- **Viewport / Screen Focus:** Left Patient Input Form (`PatientForm.tsx`) and Right Risk Assessment Deck (`PredictionResults.tsx`).
- **Physical Actions & Clicks:**
  1. **Test Normal/Low-Risk Preset:**
     - Click **Select Patient Preset** dropdown.
     - Choose **Preset: Eleanor Vance (Normal / Low Risk)** — 48yo female, normal ECG, EF 60%, BP 120/80.
     - Point out form auto-population across Demographics, Symptoms, ECG/Echo, and Biomarkers.
     - Click **Run Assessment** button.
     - Observe real-time inference loader and instant result: Overall CAD Probability < 35% (Emerald Low-Risk pill).
  2. **Test High-Risk / Stenosis Preset:**
     - Click Patient Preset dropdown again.
     - Select **Preset: Farhad Rostami (High Risk — Multi-Vessel)** — 67yo male, typical chest pain, ST-elevation, EF 40%, severe dyslipidemia.
     - Click **Run Assessment**.
     - Observe live inference: Overall CAD jumps to 85%+ (Red Alert pill), LAD and LCX elevate above 50% threshold.
- **Visual Highlights On Screen:**
  - High-tech AI inference overlay with animated pulse rings and step-by-step pipeline status.
  - Instant transition of risk cards:
    - Overall CAD: Gauge switches from green to vivid crimson.
    - Vessel risk cards: LAD (78%), LCX (62%), RCA (34%) with distinct progress bars.
  - Risk classification badge updates dynamically with 95% confidence bounds.
- **Key Talking Points & Cues (In Your Own Words):**
  - Real-time sub-50ms REST API response (`/api/predict`) powered by FastAPI and calibrated ensemble models.
  - Multi-vessel risk stratification: Differentiating focal single-vessel disease from diffuse multi-vessel compromise.
  - Clinical feature sensitivity: Showing how typical chest pain, ST-segment depression, and low ejection fraction drive the probabilistic output.

---

### Scene 4: 3D Anatomical Heart Interaction & Synchronized TreeSHAP
- **Timestamp:** `4:00 – 6:00` (Duration: 120s)
- **Viewport / Screen Focus:** Center 3D Heart Canvas (`CommandDeck.tsx`) and bottom TreeSHAP waterfall panel (`ShapWaterfall.tsx`).
- **Physical Actions & Clicks:**
  1. **3D Orbit & Inspection:**
     - Click and drag across the 3D heart with `OrbitControls` to rotate 360 degrees.
     - Scroll mouse wheel to demonstrate smooth zoom-in on coronary sulci and ventricles.
     - Click **Auto-Rotate** toggle button on the bottom dock to show the autonomous inspection loop.
  2. **Dynamic Risk Color-Coding & Floating Legend:**
     - Highlight the floating bottom-right **Risk Legend Dock** (`<35% Normal (Emerald)`, `35–49% Elevated (Amber)`, `≥50% Stenosis (Red)`).
     - Point out how the 3D glowing particle flow (`ArteryAnimatedFlow`) and surface beacons automatically turned Red for high-risk vessels (LAD) and Emerald for normal vessels.
  3. **Vessel Territory Selection & TreeSHAP Synchronization:**
     - Click the **LAD** anatomical callout card or on-mesh pin.
     - Watch camera smoothly glide to focus on the Anterior Interventricular Groove.
     - Point camera to the **TreeSHAP Waterfall** below: observe how the explanation dynamically updates to explain **LAD Stenosis (Left Anterior Descending)** specifically.
     - Click **LCX**: camera shifts to Left Atrioventricular Groove; TreeSHAP switches to **LCX feature attributions** (e.g., Age, EF, Dyslipidemia).
     - Click **RCA**: camera shifts to Right Coronary Sulcus; TreeSHAP displays RCA-specific factors.
- **Visual Highlights On Screen:**
  - Anatomically mapped 3D spline trails with directional animated coronary flow particles.
  - SVG leader lines anchoring 2D tags directly to 3D mesh surface coordinates.
  - TreeSHAP bar chart animating with positive (crimson) and protective (teal) feature contributions with real clinical units (mg/dL, %, mmHg).
- **Key Talking Points & Cues (In Your Own Words):**
  - Spatial-clinical coherence: Connecting abstract ML probabilities directly to patient anatomy.
  - Vessel-specific TreeSHAP: Why global explanations fail—LAD ischemia is often driven by regional wall motion and exertion, whereas RCA disease may correlate with distinct metabolic markers.
  - Ergonomic 3D controls: Smooth damping, responsive mobile/desktop touch, anatomical grounding.

---

### Scene 5: Model Evaluation & Insights Dashboard
- **Timestamp:** `6:00 – 7:30` (Duration: 90s)
- **Viewport / Screen Focus:** Switch to top navigation tab: **Model Insights** (`ModelInsightsView.tsx`).
- **Physical Actions & Clicks:**
  1. Click **Model Insights** tab in the main header.
  2. Point cursor to the 4 Top Summary KPI Cards:
     - CAD Classifier: **0.922 ROC-AUC**
     - LAD Model: **0.852 ROC-AUC**
     - LCX Model: **0.784 ROC-AUC**
     - RCA Model: **0.838 ROC-AUC**
  3. Click through the Vessel Selector Tabs (`CAD (Overall)`, `LAD`, `LCX`, `RCA`).
  4. Inspect the interactive **2×2 Confusion Matrix**:
     - Hover over True Positives, False Positives, True Negatives, False Negatives.
     - Note sensitivity/specificity balance calibrated to minimize missed ischemic events.
  5. Scroll down to show **Brier Calibration Score** (0.098) and **Leakage Firewall Status Badge** (Verified 0 Target Leakage).
- **Visual Highlights On Screen:**
  - Live SVG ROC curve with diagonal no-discrimination reference line and marked operating threshold (0.50).
  - Clean Apple-style data cards with subtle borders, muted grid lines, and high-contrast typography.
  - 5-Fold Stratified Cross-Validation metric cards demonstrating cross-validation stability.
- **Key Talking Points & Cues (In Your Own Words):**
  - Rigorous test set validation: Metrics evaluated on held-out 20% test fold ($N=61$) never touched during hyperparameter tuning.
  - Probability calibration: Emphasize Brier score and isotonic/sigmoid calibration—critical for clinical decision support so a 70% risk actually means 7 out of 10 similar patients have stenosis.
  - Transparent benchmark reporting: Showing honest vessel-level differences (LAD/RCA performance vs challenging LCX anatomy).

---

### Scene 6: System Architecture, Docker Reproducibility & Clinical Conclusion
- **Timestamp:** `7:30 – 8:30` (Duration: 60s)
- **Viewport / Screen Focus:** Split-screen showing Docker/Makefile architecture diagram or terminal, then final return to CardioVision 3D heart canvas.
- **Physical Actions & Clicks:**
  1. Switch terminal to show root repo structure:
     - `Dockerfile` (Multi-stage build)
     - `Makefile` (`make train`, `make test`, `make api`, `make web`)
     - `artifacts/v1/` trained models and SHAP explainers.
  2. Return to the CardioVision 3D browser view with patient Eleanor Vance or Farhad Rostami.
  3. Leave the viewer on the elegant 3D heart with the safety banner in view for the closing frame.
- **Visual Highlights On Screen:**
  - Clean project architecture: decoupling between FastAPI Python backend and React 19 Three.js frontend.
  - Reproducible 1-command Docker deployment:
    ```bash
    docker build -t cardiovision-3d .
    docker run -p 8000:8000 cardiovision-3d
    ```
- **Key Talking Points & Cues (In Your Own Words):**
  - Production readiness: Multi-stage Docker container serves compiled Vite static assets directly through FastAPI with CORS and Swagger docs (`/docs`).
  - Hackathon deliverables complete: 4 validated models, 3D interactive heart, synchronized TreeSHAP, full test coverage, and leakage firewall.
  - Closing takeaway: CardioVision 3D transforms opaque cardiovascular predictive algorithms into intuitive, spatially anchored, explainable clinical intelligence.

---

## 📋 Quick Director's Cue Sheet (Printable Summary)

| Timestamp | View / Scene | Key Action | Primary Visual to Highlight |
| :--- | :--- | :--- | :--- |
| **0:00 – 1:00** | Landing Header & Canvas | Hover disclaimer, introduce CAD | Amber Safety Banner & 3 Arteries |
| **1:00 – 2:00** | Terminal | Run `python -m pytest tests/` | 31 Passed tests, Leakage Firewall |
| **2:00 – 4:00** | Patient Deck | Load Eleanor Vance then Farhad Rostami | Live Inference, Normal vs High-Risk |
| **4:00 – 6:00** | 3D Heart & SHAP | Orbit canvas, click LAD/LCX/RCA | Glowing Artery Flow + Synced TreeSHAP |
| **6:00 – 7:30** | Model Insights Tab | Click ROC tabs, inspect confusion matrix | 0.922 AUC, Brier Score, CV table |
| **7:30 – 8:30** | Architecture & Wrap | Show Docker / Makefile, final 3D view | Multi-stage Docker, Closing Vision |
