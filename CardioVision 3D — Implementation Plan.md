# CardioVision 3D — Implementation Plan

Track A · Cardiovascular Risk Visualization & Prediction · Oct 10, 2026 · @Abinaya

## 1. Mission and guardrails

Ship one reproducible loop: clinical input, four leakage-safe classifiers, SHAP explanations, and a 3D coronary tree that only renders what the backend returned, wrapped in a UI built like a cath-lab instrument rather than a template dashboard.

- **Four binary tasks, four separate pipelines:** overall CAD, LAD, LCX, RCA. No shared model, no cross-vessel inputs.
- **Forbidden inputs:** `LAD`, `LCX`, `RCA`, `Cath` never enter any feature matrix. A gating pytest enforces it; convention does not count.
- **The 3D scene is a pure renderer.** It takes the API response and never computes or invents risk.
- **Every number on screen is real API output or tagged MOCK.** No hardcoded predictions in the final demo.
- **Vessel color is never alone.** Each highlight carries its numeric score and the label "model estimate", never "blockage found". RWMA and other features are never mapped to lesion coordinates.
- **Disclaimer in three places:** a persistent top strip, a first-load acknowledgment, and the exported report footer.
- **Effort follows the judging weights:** Predictive 30%, 3D 25%, Interpretability 20%, Integration 15%, Technical 10%.

## 2. Tech stack

One repo, one container, no database: React + R3F on the front, FastAPI + scikit-learn on the back, and a typed contract generated from the API so the two sides cannot drift.

| Layer | Pick | Why this one |
| --- | --- | --- |
| Tooling | uv (Python), pnpm + Vite, Biome, ruff | Fast installs, one linter per language, minimal config |
| UI framework | React + TypeScript | Required by the brief; R3F lives here |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) | Accessible primitives we own and restyle fully, so it won't look like a stock kit |
| State and data | Zustand + TanStack Query | Zustand holds selected vessel, layer, camera mode; Query owns the predict call and its states |
| Forms | React Hook Form + Zod | Zod schema built from the backend `/api/schema`, so validation rules have one source |
| 3D | React Three Fiber + Drei | `useGLTF`, `CameraControls` (fly-to), `Html` labels, `Bvh` for fast picking |
| Motion | Motion (framer-motion) | Panel transitions, number tweening; the 3D pulse runs in the R3F frame loop |
| Charts | Plotly (lazy-loaded basic bundle) | Waterfall, ROC, confusion matrix; named in the brief, split from the main bundle |
| API | FastAPI + Pydantic v2 + Uvicorn | Schema validation, OpenAPI for free |
| Contract | openapi-typescript | TS types generated from FastAPI's OpenAPI, run in CI |
| ML | scikit-learn, pandas, NumPy, joblib | Full pipeline objects serialize as one artifact |
| Explainability | SHAP | `TreeExplainer` for forest/boosting, `LinearExplainer` for logistic, model-agnostic fallback |
| 3D asset pipeline | Blender + gltf-transform | Decimate, name nodes, meshopt-compress to a GLB under about 3 MB |
| Tests | pytest, Vitest + Testing Library, Playwright | Unit, component, and one scripted end-to-end run |
| Deploy | One multi-stage Dockerfile | FastAPI serves the built frontend; runs on any container host |

**Deliberately skipped:** PostgreSQL (no stored patients), Redux, Next.js (no SSR need), VTK.js (no volumetric data), bloom and heavy post-processing (no-GPU target), XGBoost and LightGBM (scikit-learn's gradient boosting covers the candidate list with one fewer dependency).

## 3. Architecture and repo layout

Three zones talk through one JSON contract: the browser holds no model, and the API holds no UI state.

&#91;embedded content: system architecture · 3 zones, 1 JSON contract\]

The form posts to `/api/predict`. The API validates against `schema.json`, runs the four saved pipelines plus SHAP, and returns one response that fills the store. The stage and Inspector read only that store. Adding a feature, a model or a vessel means editing `schema.json`, one row in `vessels.ts`, and re-running `make train`; no redesign.

```text
cardiovision/
├─ ml/          audit, features, train, evaluate, explain
├─ api/         FastAPI app, Pydantic models, tests
├─ web/         React app, R3F scene, Plotly charts
├─ artifacts/   v1/{cad,lad,lcx,rca}/ model + metadata, reports/, split.json
├─ data/        download script, schema.json
├─ tests/       leakage gate, end-to-end
├─ docs/        PLAN.md, DATASET.md, ASSETS.md, technical document
├─ Dockerfile
└─ Makefile     train, api, web, test, build
```

## 4. ML pipeline

Audit the schema first, build four independent pipelines behind a leakage firewall, pick models by repeated cross-validation, and touch the held-out test set exactly once. `make train` must regenerate every number the app shows.

1. **Schema audit** (`scripts/audit_dataset.py`). Download from the UCI page, store the SHA-256, row count, dtypes, missing counts, category values and class counts in `data/schema.json`. Confirm which column holds the overall CAD label (likely `Cath`) and how LAD, LCX and RCA are encoded. Do not trust a Kaggle mirror to match.
2. **Leakage firewall.** `FORBIDDEN = {LAD, LCX, RCA, Cath}` plus the CAD label column if it differs. `build_xy(df, target)` returns `y` separately and `X` from an allowlist in `schema.json`, then asserts the intersection with `FORBIDDEN` is empty. Also flag any single feature with ROC-AUC above 0.95 or correlation above 0.95 with a target for manual review, and check exact-duplicate rows (there are no patient IDs, so patient-level overlap cannot be verified; say so in the docs).
3. **One shared split.** Stratified 80/20 train/test with a fixed seed, stratified on CAD plus vessel pattern where counts allow and on CAD alone where they do not. Save indices to `artifacts/split.json`. Test data is locked until the final report.
4. **Preprocessing** inside the pipeline: numeric gets median impute and scaling (scaling only for logistic regression and SVC); binary and categorical get most-frequent impute and one-hot with `handle_unknown="ignore"`; column order comes from the schema.
5. **Candidates:** a dummy baseline, logistic regression (L2, balanced weights), random forest, SVC, gradient boosting. Small grids, tuned with repeated stratified 5-fold CV on train only. Primary selection metric is ROC-AUC, with PR-AUC and F1 as tie-breakers because vessel labels may be imbalanced.
6. **Honest estimate:** nested CV for the model comparison (mean and SD), then refit the winner on all of train and score the test set once. Add bootstrap 95% intervals and state that they are wide at roughly 60 test rows.
7. **Calibration:** wrap the winner in `CalibratedClassifierCV` (sigmoid by default) fitted on train only. Report Brier score and a reliability curve. The UI says "calibrated model probability", never "clinical risk".
8. **Threshold:** 0.5 unless a different value is chosen from cross-validated train predictions. Store it in metadata and return it from the API.
9. **SHAP per model.** Background set is a k-means summary (50 points or fewer) of transformed train data. Map one-hot columns back to the source feature, and group by Demographics, Vitals, Labs, ECG and Echo. Responses key each explanation by model (`cad`, `lad`, `lcx`, `rca`). Save global mean |SHAP| at train time for the evaluation page.
10. **Artifacts:** `artifacts/v1/{cad,lad,lcx,rca}/model.joblib` and `metadata.json` (dataset hash, seed, library versions, params, CV and test metrics, threshold, feature list, git SHA), plus `reports/*.json` for confusion matrices, ROC curves and class distributions. The frontend reads these JSON files; it never recomputes metrics.

## 5. API contract

Four endpoints, one prediction response that carries everything the dashboard and the 3D scene need, so the frontend never calls the model twice for the same patient.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Models loaded, artifact version, dataset hash |
| `GET /api/schema` | Feature list with type, unit, allowed range or categories, group, required flag. Drives the form and the Zod rules |
| `POST /api/predict` | Validated patient in, four predictions plus explanations out |
| `GET /api/metrics` | Contents of `reports/*.json` for the evaluation page |

Missing-value policy: core fields are required and rejected with a field-level 422 if absent. Optional fields may be left blank; the backend imputes with the training median or mode and lists them in `imputed_features`, which the UI shows next to the result. Nothing is imputed silently.

```json
{
  "model_version": "v1",
  "imputed_features": ["Lymph"],
  "predictions": {
    "cad": { "label": 1, "probability": 0.0, "threshold": 0.5, "calibrated": true },
    "lad": { "label": 0, "probability": 0.0, "threshold": 0.5, "calibrated": true },
    "lcx": { "label": 0, "probability": 0.0, "threshold": 0.5, "calibrated": true },
    "rca": { "label": 0, "probability": 0.0, "threshold": 0.5, "calibrated": true }
  },
  "explanations": {
    "lad": {
      "base_value": 0.0,
      "top": [{ "feature": "Age", "value": 0, "shap": 0.0, "group": "Demographics" }],
      "by_group": { "Labs": 0.0, "ECG": 0.0 }
    }
  },
  "disclaimer": "Educational demonstration. Not a diagnostic device."
}
```

The zeros above are schema placeholders, not results; real values exist only after `make train`. Pydantic models define this shape, and `openapi-typescript` turns them into the frontend types in CI, so a changed field breaks the build instead of the demo.

## 6. 3D viewer

Use a GLB heart with three named, separately pickable artery meshes. If no licensed model gives clean separate arteries, build the three vessels as spline tubes on the heart surface and label them schematic. Either way, vessel identity comes from one lookup table, so a click can never show the wrong vessel.

**Asset sourcing and licence**

- Candidates: BodyParts3D and NIH 3D heart models. Check each model's own licence, attribution and redistribution terms before committing it. Record source URL, licence, author, edits and date in `ASSETS.md`.
- Pipeline: import into Blender, merge the body into `Heart_Body`, name the arteries `LAD`, `LCX`, `RCA`, decimate, apply transforms, export GLB, then run `gltf-transform optimize` (meshopt, texture resize). Targets: under 3 MB and roughly 150k triangles.
- Mapping: one `vessels.ts` table of `{ id, meshNode, fullName, territory }`. A unit test fails if the GLB lacks any of the three node names or contains duplicates.
- Fallback A: `TubeGeometry` along `CatmullRomCurve3` paths, captioned "Schematic vessel paths, not patient anatomy".
- Fallback B: if WebGL is unavailable or the GLB fails to load, an error boundary swaps in a 2D SVG coronary schematic with the same vessel buttons, score cards and a visible explanation.

**Interactions**

| Action | Behavior |
| --- | --- |
| Rotate, zoom, pan | Drei `CameraControls` with damping and distance limits; touch supported |
| Reset | Button and `R` key; animated return to the default pose |
| Select vessel | Click the mesh, click its card, or press `1` `2` `3`; writes `selectedVessel` to the store, camera flies to frame it, other vessels dim to about 25% opacity, selected vessel gets an outline and slow pulse |
| Hover | Pointer cursor and a tooltip with that vessel's live score |
| Layer switch | Probability (continuous ramp), Predicted class (binary at the stored threshold), Anatomy only |
| Keyboard path | The vessel list is a real radio group, so selection works without the canvas |

**Color encoding**

- Colorblind-safe sequential ramp from deep teal through amber to magenta, applied as a material uniform and lerped over about 600 ms when new results arrive.
- Legend is a gradient bar with ticks at 0, 0.25, 0.5, 0.75, 1 and a notch at the model threshold.
- Each vessel carries a permanent numeric tag (`LAD 0.73`) and a dashed ring labeled MODEL ESTIMATE, so prediction and anatomy never look like the same thing.
- No vessel is ever deformed or narrowed in the mesh. Geometry change would imply lesion location and severity, which the data cannot support.

**Performance**

- `frameloop="demand"` with `invalidate()` on interaction and animation, device pixel ratio clamped to 1.5, `Bvh` for picking, meshopt decoder, `useGLTF.preload`.
- No shadows, bloom or SSAO. Drei `PerformanceMonitor` lowers pixel ratio if the frame rate drops.
- Target 30 fps or better on an integrated GPU; measure it in Phase 5 and write the result down.

## 7. Interactive design direction

Concept: **Cath-Lab Command Deck**. Treat it as a clinical instrument, not a SaaS dashboard. The heart is a full-bleed stage and every panel is a thin glass HUD layered over it.

**Layout**

| Zone | Contents |
| --- | --- |
| Safety strip (top, always visible) | Educational-use disclaimer, model version, route tabs: Console, Evaluation, Report |
| Stage (full-bleed) | Near-black canvas, soft vignette, faint ECG-grid floor, heart centered slightly left, legend docked bottom-left |
| Intake rail (left, collapsible) | Stepper over five groups: Demographics, Vitals, Labs, ECG, Echo. A completion ring per group. Compact numeric steppers with a ghost band showing the training-data range |
| Vessel Inspector (right) | Follows the selected vessel: score dial, predicted class, threshold, SHAP waterfall, table of input value against contribution, plain-language limits note |
| Evidence strip (bottom) | Overall CAD readout plus three vessel chips that also select vessels |

**Signature interactions**

1. **Inference sequence.** On Run, a scan line sweeps the heart while the arteries resolve from neutral grey to their score color and the numbers count up. About 1.2 s, skippable, disabled under `prefers-reduced-motion`.
2. **Fly-to focus.** Selecting a vessel moves the camera to frame it and dims the rest.
3. **What-if scrubber.** With a vessel selected, drag a numeric feature; a debounced re-predict (about 250 ms) updates color and score live. A ghost marker keeps the original value, and the panel says "model sensitivity, not clinical advice".
4. **Linked highlighting.** Hover a SHAP bar and the matching intake field lights up, and the reverse.
5. **Command palette** (`Ctrl/Cmd+K`). Select vessel, load a sample record, reset camera, open Evaluation.
6. **Sample records.** Pre-load real test-split rows. A separate, solid-outline badge can reveal the dataset's recorded label, kept visually distinct from the dashed MODEL ESTIMATE ring.
7. **Stretch: compare mode.** Freeze result A, run B, show per-vessel deltas on the heart.

**Visual language**

- **Color rule:** the interface chrome is monochrome with one pale-violet focus color. The blue-to-amber-to-magenta ramp is reserved for probability, so color always means one thing.
- **Tokens:** ink `#0A0E13`, surface `#11171E`, hairline `#223040`, text `#E6EDF3`, muted `#8B98A8`, focus `#9AA7FF`; ramp `#1F6F8B`, `#F2C14E`, `#D6336C`.
- **Type:** Geist Sans for interface text, JetBrains Mono with tabular figures for every number and unit.
- **Shape:** 2 px radii, hairline borders, instrument-style tick marks. No drop-shadow cards, gradient blobs or emoji.
- **Motion:** 200 to 300 ms springs for panels; data animates only when it carries meaning.
- **Accessibility:** dark theme only, text at WCAG AA contrast or better, visible focus rings, vessel list works as a keyboard radio group.
- **Responsive:** three zones on desktop; drawers on tablet; on phones the stage sits on top with the Inspector as a bottom sheet.

## 8. Build phases and gates

Five phases and four gates: ML and 3D start together on mocks, so neither waits for the other.

&#91;embedded content: build roadmap · 5 phases, 4 gates\]

A gate is a hard stop; nothing in the next phase starts until its criteria hold. Dates are left open because the submission deadline is not fixed. Set them backward from it, using this split of the time you have: Foundations 10%, Parallel build 35%, Integrate 15%, Harden 25%, Ship 15%.

## 9. Testing and Definition of Done

Four test levels, with the leakage test as a hard gate in CI: if it fails, nothing merges.

| Level | Tool | What it proves |
| --- | --- | --- |
| Data and model | pytest | `FORBIDDEN` is absent from all four feature matrices; column order is stable; `make train` reproduces the stored metrics for the fixed seed; each model is compared to the dummy baseline; Brier score is recorded |
| Backend | pytest + FastAPI TestClient | Missing or malformed input returns 422 with field errors; each target returns the expected type; a missing or corrupt artifact returns 503 with a readable message; `imputed_features` is filled correctly |
| Frontend and 3D | Vitest + Testing Library, R3F test renderer | Node-to-vessel table is correct; selecting each artery shows the matching Inspector; a new response updates colors; WebGL-off fallback renders; keyboard selection works |
| End to end | Playwright | Fixed sample record in, four cards out; select LAD and check its panel equals the API value; open Evaluation; export the report. Observed outputs are recorded in `tests/fixtures/` |

The test split is never used to tune anything after its results are reported.

**Definition of done**

- [ ] All four pipelines train and serve; leakage test passes
- [ ] Evaluation numbers reproduce from one command
- [ ] Predict endpoint validates input and returns the documented shape
- [ ] Viewer loads, rotates, zooms, resets, and selects each artery
- [ ] Selected artery always shows its own model's prediction
- [ ] SHAP explanations per model, labeled with the model they describe
- [ ] Disclaimer visible on every screen and in the report
- [ ] Invalid input and failure states handled with visible messages
- [ ] README lets a fresh machine run the project
- [ ] Dataset and mesh attributions and licences included
- [ ] Six-page technical document and 3 to 10 minute video finished

## 10. Antigravity prompt pack

Export this doc to Markdown and save it as `PLAN.md` in the repo root, paste the global rules into the workspace rules area your Antigravity version provides, then start five agents in parallel. The prompts below refer to sections of `PLAN.md` by number.

**Start order:** the ML agent and the 3D agent start together. The API agent starts as soon as `data/schema.json` exists (a mock schema is fine). The UI agent starts against mocked responses tagged MOCK. The QA and docs agent writes tests from day one and finishes last.

**Global rules (paste once)**

```text
PROJECT: CardioVision 3D, hackathon Track A. Educational demo, not a diagnostic device.

HARD RULES
1. Never use LAD, LCX, RCA or Cath as model inputs. Labels live in y only. Keep tests/test_leakage.py passing.
2. Never invent metrics, probabilities or patient data. Numbers come from `make train` artifacts or are tagged MOCK.
3. The 3D scene only renders values from the /api/predict response. No risk math in the frontend.
4. Never imply a confirmed lesion. Say "model estimate". Never map RWMA or any feature to 3D coordinates.
5. Check the licence before adding any dataset or mesh; log it in DATASET.md or ASSETS.md.
6. Pin seeds, log library versions, keep the test split untouched until final evaluation.

STACK: React + TypeScript + Vite, Tailwind v4, shadcn/ui, Zustand, TanStack Query, React Hook Form + Zod, React Three Fiber + Drei, Plotly (lazy). FastAPI, Pydantic v2, scikit-learn, SHAP, joblib. uv, pnpm, Biome, ruff.
REPO: /ml /api /web /artifacts /docs /tests Makefile
After each task: run the tests, summarize changes in 5 lines, list open risks.
```

**Agent 1: ML pipeline**

```text
Build /ml following section 4 of PLAN.md. Order: audit_dataset.py -> data/schema.json; build_xy with the FORBIDDEN firewall and tests; one shared stratified split saved to artifacts/split.json; four pipelines (cad, lad, lcx, rca); candidates dummy, logistic regression, random forest, SVC, gradient boosting; tune with repeated stratified CV on train only; nested CV for comparison; calibrate the winner on train only; evaluate the test set once with bootstrap intervals; SHAP per model with feature grouping; write artifacts/v1/* and reports/*.json; expose everything through `make train`. Stop and report if any target is not binary or any column's meaning is ambiguous. Do not read test metrics before the final step.
```

**Agent 2: API**

```text
Build /api following section 5. FastAPI with a lifespan that loads artifacts; GET /api/health, /api/schema, /api/metrics; POST /api/predict returning the documented shape. Generate request validation from data/schema.json. Required fields are rejected with field-level 422 errors; optional fields are imputed and listed in imputed_features. Return 503 with a readable message if an artifact is missing or corrupt. Serve /web/dist in production. Add pytest tests for valid, missing, malformed and out-of-range input.
```

**Agent 3: 3D viewer**

```text
Build /web/src/three following section 6. Start with the spline-tube vessels so work is never blocked on the mesh, behind the same vessels.ts table the GLB will use. Implement CameraControls rotate/zoom/reset, click and keyboard selection, fly-to with dimming, three layers (probability, predicted class, anatomy only), numeric vessel tags, legend with threshold notch, error-boundary fallback to an SVG schematic, frameloop="demand", DPR clamp, Bvh. Colors come only from the Zustand store, which is filled only from the API response. Write tests for node-to-vessel mapping and selection.
```

**Agent 4: Console UI**

```text
Build the console in /web following section 7. Layout zones, intake rail generated from /api/schema with React Hook Form and Zod, Vessel Inspector with a lazy-loaded Plotly SHAP waterfall, input-versus-contribution table, linked hover highlighting, what-if scrubber with debounced re-predict, command palette, Evaluation route reading /api/metrics, printable Report route, safety strip on every route. Use MSW mocks tagged MOCK until the real API is ready. Respect prefers-reduced-motion. No default shadcn look: apply the tokens, typography and shape rules from section 7.
```

**Agent 5: QA, docs, packaging**

```text
Own tests, packaging and writing. Maintain tests/test_leakage.py as a CI gate. Write the Playwright end-to-end run from section 9. Write README (setup, run, test), DATASET.md, ASSETS.md, API docs, the Dockerfile (multi-stage, FastAPI serves the built web app), the six-page technical document outline, and the demo-video shot list. Flag any place where the UI or docs overstate what the data supports.
```

## 11. Risks, fallbacks and demo run-of-show

The biggest risks are a missing clean mesh, small-data instability and overclaiming. Each has a planned fallback, and none of the fallbacks hides a weakness from the user.

| Risk | Fallback |
| --- | --- |
| No licensed mesh with separate arteries | Spline-tube vessels captioned "schematic" (section 6, Fallback A) |
| Dataset schema or target encoding differs from assumptions | The audit script stops and reports; no training until `schema.json` is confirmed |
| Small sample makes metrics unstable | Repeated and nested CV, bootstrap intervals, plain statement of the limits on the Evaluation page |
| A vessel model is weak or imbalanced (LCX especially may be) | Report recall and PR-AUC as they are; show a low-confidence note in the Inspector; never hide it |
| SHAP unsupported or slow for the winning model | Use `TreeExplainer` or `LinearExplainer`; otherwise model-agnostic with a small background set; cache global importances |
| Slow integrated GPU | On-demand frame loop, pixel-ratio clamp, 2D SVG fallback |
| Untrusted model files | Load `joblib` artifacts only from the repo's own `artifacts/` directory, built by `make train` |
| UI or docs overstate the data | QA agent scans copy for banned claims: "diagnoses", "detects blockage", "confirmed", "validated" |

**Demo video run-of-show (about 7 minutes)**

1. Problem and disclaimer, 30 s
2. Leakage firewall and the failing-on-purpose test, 45 s
3. Intake and the inference sequence, 60 s
4. Overall CAD and the three vessels: rotate, zoom, select, 90 s
5. SHAP waterfall, linked highlighting and the what-if scrubber, 75 s
6. Evaluation page: metrics, intervals, confusion matrices, limits, 75 s
7. Architecture and limitations, 60 s
