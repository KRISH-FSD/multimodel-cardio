# Dataset Documentation: Z-Alizadeh Sani Cardiovascular Dataset

## 1. Overview and Source Attribution
- **Dataset Title:** Extension of Z-Alizadeh Sani Dataset
- **Repository:** UCI Machine Learning Repository (Dataset ID: 411) / Kaggle Mirror
- **Original Authors:** Zahra Alizadeh Sani, et al., Tehran Heart Center
- **Records:** 303 patient records
- **Features:** 55 clinical, demographic, laboratory, ECG, and echocardiographic attributes
- **Target Variables:** 4 binary classification targets:
  - `Cath` (Overall CAD status: `Cad` = stenosis $\ge 50\%$ in at least one major vessel, `Normal` = $< 50\%$)
  - `LAD` (Left Anterior Descending stenosis $\ge 50\%$: `Stenotic` vs `Normal`)
  - `LCX` (Left Circumflex stenosis $\ge 50\%$: `Stenotic` vs `Normal`)
  - `RCA` (Right Coronary Artery stenosis $\ge 50\%$: `Stenotic` vs `Normal`)

---

## 2. Leakage Firewall Architecture
To prevent target leakage and artificial metric inflation, the following columns are strictly excluded from all training feature matrices ($X$):
- `LAD`, `LCX`, `RCA`, `Cath`
- Any ground-truth vessel or catheterization finding

Automated CI gate verification is maintained in `tests/test_leakage.py` (31 automated unit tests).

---

## 3. Feature Taxonomy (55 Ingested Features)

### 3.1 Demographics & Anthropometrics (5 features)
- `Age` (Years, range: 30–86)
- `Sex` (Binary: 0 = Female, 1 = Male)
- `Weight` (kg, range: 48–120)
- `Length` (Height in cm, range: 140–188)
- `BMI` (kg/m², calculated or auto-derived: $\text{Weight} / (\text{Length}/100)^2$)

### 3.2 Vitals & Physical Examination (12 features)
- `BP` (Systolic blood pressure, mmHg: 90–190)
- `PR` (Pulse rate, bpm: 50–110)
- `Edema` (Peripheral edema: 0 = No, 1 = Yes)
- `Weak Peripheral Pulse` (0/1)
- `Lung rales` (0/1)
- `Systolic Murmur` (0/1)
- `Diastolic Murmur` (0/1)
- `Typical Chest Pain` (0/1)
- `Dyspnea` (0/1)
- `Function Class` (NYHA functional class: 0–3)
- `Atypical` (0/1)
- `Nonanginal` (0/1)

### 3.3 Medical History & Risk Factors (12 features)
- `DM` (Diabetes Mellitus: 0/1)
- `HTN` (Hypertension: 0/1)
- `Current Smoker` (0/1)
- `EX-Smoker` (0/1)
- `FH` (Family History of premature CAD: 0/1)
- `Obesity` (BMI $\ge 30$: 0/1)
- `CRF` (Chronic Renal Failure: 0/1)
- `CVA` (Cerebrovascular Accident / Stroke: 0/1)
- `Airway disease` (COPD / Asthma: 0/1)
- `Thyroid Disease` (0/1)
- `CHF` (Congestive Heart Failure: 0/1)
- `DLP` (Dyslipidemia: 0/1)

### 3.4 Laboratory Biomarkers (14 features)
- `FBS` (Fasting Blood Sugar, mg/dL: 62–400)
- `CR` (Serum Creatinine, mg/dL: 0.5–2.2)
- `TG` (Triglycerides, mg/dL: 47–1050)
- `LDL` (Low-Density Lipoprotein, mg/dL: 26–232)
- `HDL` (High-Density Lipoprotein, mg/dL: 19–111)
- `BUN` (Blood Urea Nitrogen, mg/dL: 6–52)
- `ESR` (Erythrocyte Sedimentation Rate, mm/hr: 1–90)
- `HB` (Hemoglobin, g/dL: 8.9–17.6)
- `K` (Serum Potassium, mEq/L: 3.0–5.7)
- `Na` (Serum Sodium, mEq/L: 128–156)
- `WBC` (White Blood Cell Count, /µL: 3700–18000)
- `Lymph` (Lymphocyte percentage, %: 7–60)
- `Neut` (Neutrophil percentage, %: 32–89)
- `PLT` (Platelet count, $\times 10^3$/µL: 25–742)

### 3.5 ECG & Echocardiographic Markers (12 features)
- `Q Wave` (Pathological Q waves: 0/1)
- `St Elevation` (ST-segment elevation: 0/1)
- `St Depression` (ST-segment depression: 0/1)
- `Tinversion` (T-wave inversion: 0/1)
- `LVH` (Left Ventricular Hypertrophy: 0/1)
- `Poor R Progression` (0/1)
- `BBB` (Bundle Branch Block: 0 = None, 1 = LBBB, 2 = RBBB)
- `EF-TTE` (Ejection Fraction by Transthoracic Echo, %: 15–60)
- `Region RWMA` (Regional Wall Motion Abnormality region count: 0–4)
- `VHD` (Valvular Heart Disease: N = Normal, mild, moderate, severe)
- `Exertional CP` (0/1)
- `LowTH Ang` (0/1)

---

## 4. Clinical Caveat Regarding RWMA
As noted in the medical primer: Regional Wall Motion Abnormality (`Region RWMA`) indicates functional echocardiographic wall motion dysfunction. It serves as an informative clinical biomarker input for ML risk estimation, but **does not provide direct pixel-level or 3D anatomical lesion coordinates**.
