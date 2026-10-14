# 3D Anatomical Assets & Licensing Documentation

## 1. Overview
CardioVision 3D utilizes two open-source, highly detailed 3D heart anatomical meshes formatted as compressed `.glb` binaries to balance clinical accuracy and 60 FPS in-browser WebGL rendering on consumer integrated GPUs.

---

## 2. Asset Manifest

### Model A: Full Anatomical Heart (`anatomical_heart_-_codominance.glb`)
- **Source:** Sketchfab / Creative Commons Attribution (CC BY 4.0)
- **Author/Licensor:** Creative Commons open-source anatomical collection
- **Geometry:** High-fidelity cardiac anatomy including:
  - Atria and Ventricles (`Hart_basis`)
  - Aorta and Aortic Root (`Aorta`)
  - Pulmonary Trunk and Arteries (`Pulmonary_trunk`)
  - Coronary Arteries (`Arteries2`)
  - Cardiac Veins (`Veins`)
- **Optimization Pipeline:**
  - Geometry recentered at origin $(0, 0, 0)$ with mathematical offset `[-0.3928, 0.7500, -0.2112]`
  - Vertex cache optimization and Meshopt compression for fast mobile/desktop WebGL loading
  - Physically Based Rendering (PBR) `MeshPhysicalMaterial` with clearcoat, roughness, and dynamic emissive highlighting

### Model B: Segmented Coronary Artery Tree (`heart0088_coronary_arteries.glb`)
- **Source:** BodyParts3D (Database Center for Life Science, Japan) / NIH 3D Print Exchange
- **Licence:** Creative Commons Attribution-ShareAlike 2.1 Japan (CC BY-SA 2.1 JP)
- **Geometry:** Isolated, segmented coronary arterial vascular tree providing an unobstructed view of major branches without ventricular occlusion:
  - **LAD (Left Anterior Descending):** Anterior Interventricular Groove
  - **LCX (Left Circumflex):** Left Atrioventricular Groove / Sulcus
  - **RCA (Right Coronary Artery):** Right Atrioventricular Sulcus & Marginal Branches

---

## 3. Anatomical Vessel Coordinate Mapping

The 3D viewer links machine learning risk estimates directly to real surface vertices on the 3D meshes:

| Vessel Acronym | Full Anatomical Name | Anatomical Course / Territory | Anatomical Mesh Vertex $[X, Y, Z]$ | Focus Rotation ($Y$-axis) |
| :--- | :--- | :--- | :--- | :---: |
| **LAD** | Left Anterior Descending | Anterior Interventricular Groove | `[-0.281, -0.683, 2.406]` | $0.05\text{ rad}$ (Anterior Front) |
| **LCX** | Left Circumflex Artery | Left Atrioventricular Groove | `[-0.901, 0.146, 2.137]` | $0.55\text{ rad}$ (Left Lateral) |
| **RCA** | Right Coronary Artery | Right Atrioventricular Groove | `[2.216, -0.267, 1.163]` | $-0.75\text{ rad}$ (Right Lateral) |

---

## 4. WebGL Performance Budget
- **Target Frame Rate:** $\ge 60\text{ fps}$ on integrated GPUs (Intel Iris Xe / Apple Silicon)
- **Triangle Budget:** $< 150\text{k}$ triangles total
- **Dynamic Optimization:**
  - `frameloop="demand"` with render on interaction / rotation
  - Clamped Device Pixel Ratio (`dpr={[1, 1.5]}`)
  - Three.js Catmull-Rom spline curves for animated blood flow simulation
