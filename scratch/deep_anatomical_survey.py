import struct, json
import numpy as np

with open('web/public/anatomical_heart_-_codominance.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len).decode('utf-8'))
    chunk2_len, _ = struct.unpack('<I4s', f.read(8))
    bin_data = f.read(chunk2_len)

accessors = data['accessors']
bufferViews = data['bufferViews']
meshes = data['meshes']

all_min = np.array([float('inf')]*3)
all_max = np.array([float('-inf')]*3)
for m in meshes:
    for p in m['primitives']:
        a = accessors[p['attributes']['POSITION']]
        all_min = np.minimum(all_min, a['min'])
        all_max = np.maximum(all_max, a['max'])
model_center = (all_min + all_max) / 2
scale = 0.018

def get_mesh_data(name):
    m = [mesh for mesh in meshes if name in mesh['name']][0]
    p = m['primitives'][0]
    a = accessors[p['attributes']['POSITION']]
    bv = bufferViews[a['bufferView']]
    offset = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    count = a['count']
    raw = np.frombuffer(bin_data[offset : offset + count * 12], dtype=np.float32).reshape(-1, 3)
    coords = (raw - model_center) * scale

    ind_acc = accessors[p['indices']]
    ind_bv = bufferViews[ind_acc['bufferView']]
    ind_offset = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
    ind_count = ind_acc['count']
    dtype = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
    indices = np.frombuffer(bin_data[ind_offset : ind_offset + ind_count * np.dtype(dtype).itemsize], dtype=dtype)
    triangles = indices.reshape(-1, 3)
    return coords, triangles

coords_art, tri_art = get_mesh_data('Arteries2')
coords_hart, tri_hart = get_mesh_data('Hart_basis')
coords_aorta, _ = get_mesh_data('Aorta')
coords_pt, _ = get_mesh_data('Pulmonary_trunk')

# Let's inspect the two arterial components
from collections import defaultdict
adj = defaultdict(set)
for t0, t1, t2 in tri_art:
    adj[t0].add(t1); adj[t0].add(t2)
    adj[t1].add(t0); adj[t1].add(t2)
    adj[t2].add(t0); adj[t2].add(t1)

visited = set()
components = []
for i in range(len(coords_art)):
    if i not in visited:
        comp = []
        queue = [i]
        visited.add(i)
        while queue:
            u = queue.pop()
            comp.append(u)
            for v in adj[u]:
                if v not in visited:
                    visited.add(v)
                    queue.append(v)
        components.append(comp)

components.sort(key=len, reverse=True)
c0 = coords_art[components[0]] # LCA system
c1 = coords_art[components[1]] # RCA system

print("=== 1. LCA (LEFT CORONARY ARTERY) SYSTEM ===")
print(f"Total vertices: {len(c0)}")
# The left main coronary artery emerges from the left aortic sinus:
# Find points closest to Aorta
d_to_aorta = np.min([np.linalg.norm(c0 - pt, axis=1) for pt in coords_aorta[::100]], axis=0)
lm_ostium_idx = np.argmin(d_to_aorta)
print(f"Left Main Ostium: {c0[lm_ostium_idx]}")

# Bifurcation:
# Where does it split into LAD and LCX?
# LAD heads anterior-inferior into the anterior interventricular groove.
# LCX heads lateral-posterior into the left atrioventricular groove.
print("\n--- Identifying LAD trunk along Anterior Interventricular Groove ---")
# LAD follows anterior interventricular groove: between RV and LV down to apex.
# In anterior view (Z > 1.3), Y descending from +0.25 to -2.0.
# Let's trace the medial anterior ridge:
for y in [0.2, 0.0, -0.2, -0.4, -0.6, -0.8, -1.0, -1.2, -1.5, -1.8]:
    pts = c0[(np.abs(c0[:, 1] - y) < 0.06) & (c0[:, 0] > 0.4) & (c0[:, 0] < 0.8) & (c0[:, 2] > 1.2)]
    if len(pts) > 0:
        # get center of the vessel cross section
        center = np.median(pts, axis=0)
        print(f"LAD at Y={y:+.1f}: center=[{center[0]:.3f}, {center[1]:.3f}, {center[2]:.3f}], count={len(pts)}")

print("\n--- Identifying LCX along Left Atrioventricular Groove ---")
# LCX follows the left AV groove: wraps around the base of the left ventricle towards posterior.
# Around Y ~ 0.0 to 0.3, X > 0.8 extending to 1.8, wrapping around Z from 1.3 to -0.5
for x in [0.8, 1.0, 1.2, 1.4, 1.6, 1.8]:
    pts = c0[(np.abs(c0[:, 0] - x) < 0.08) & (c0[:, 1] > -0.2) & (c0[:, 1] < 0.4)]
    if len(pts) > 0:
        center = np.median(pts, axis=0)
        print(f"LCX at X={x:.1f}: center=[{center[0]:.3f}, {center[1]:.3f}, {center[2]:.3f}], count={len(pts)}")

print("\n=== 2. RCA (RIGHT CORONARY ARTERY) SYSTEM ===")
print(f"Total vertices: {len(c1)}")
d_to_aorta1 = np.min([np.linalg.norm(c1 - pt, axis=1) for pt in coords_aorta[::100]], axis=0)
rca_ostium_idx = np.argmin(d_to_aorta1)
print(f"RCA Ostium: {c1[rca_ostium_idx]}")

# RCA follows right atrioventricular groove:
# courses along right coronary sulcus between RA and RV.
for y in [0.3, 0.2, 0.1, 0.0, -0.1, -0.3, -0.5, -0.8, -1.0]:
    pts = c1[(np.abs(c1[:, 1] - y) < 0.06) & (c1[:, 0] < -0.3) & (c1[:, 2] > 1.2)]
    if len(pts) > 0:
        center = np.median(pts, axis=0)
        print(f"RCA at Y={y:+.1f}: center=[{center[0]:.3f}, {center[1]:.3f}, {center[2]:.3f}], count={len(pts)}")
