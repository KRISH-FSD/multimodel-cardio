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

art_mesh = [m for m in meshes if 'Arteries' in m['name']][0]
prim = art_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
pos_bv = bufferViews[pos_acc['bufferView']]
pos_offset = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[pos_offset : pos_offset + count * 12], dtype=np.float32).reshape(-1, 3)
coords = (raw_coords - model_center) * scale

ind_acc = accessors[prim['indices']]
ind_bv = bufferViews[ind_acc['bufferView']]
ind_offset = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
ind_count = ind_acc['count']
dtype = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
indices = np.frombuffer(bin_data[ind_offset : ind_offset + ind_count * np.dtype(dtype).itemsize], dtype=dtype)
triangles = indices.reshape(-1, 3)

from collections import defaultdict
adj = defaultdict(set)
for t0, t1, t2 in triangles:
    adj[t0].add(t1); adj[t0].add(t2)
    adj[t1].add(t0); adj[t1].add(t2)
    adj[t2].add(t0); adj[t2].add(t1)

visited = set()
components = []
for i in range(count):
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
comp0 = np.array(components[0]) # LCA
comp1 = np.array(components[1]) # RCA

coords0 = coords[comp0]
coords1 = coords[comp1]

print("=== COMPONENT 0: LCA (LAD + LCX) ===")
# Let's inspect where the LCA starts: highest Y (closest to aorta)
top_idx = np.argmax(coords0[:, 1])
print(f"LCA Ostium / Origin approx: {coords0[top_idx]}")

# In anterior view (Z > 0), LAD is descending along the anterior interventricular sulcus.
# Apex of heart is at minimum Y.
apex_idx = np.argmin(coords0[:, 1])
print(f"LAD lowest Y (near apex): {coords0[apex_idx]}")

# Let's slice coords0 along Y from top to bottom
print("\n--- LCA / LAD anterior descent (Z > 0.8) ---")
for y in np.linspace(coords0[top_idx, 1], coords0[apex_idx, 1], 10):
    mask = (np.abs(coords0[:, 1] - y) < 0.1) & (coords0[:, 2] > 1.0)
    if np.any(mask):
        sub = coords0[mask]
        print(f"y={y:.2f}: X in [{sub[:,0].min():.2f}, {sub[:,0].max():.2f}], Z in [{sub[:,2].min():.2f}, {sub[:,2].max():.2f}], count={len(sub)}")

print("\n--- LCX Circumflex branch (courses towards left atrioventricular groove, higher X, wraps laterally and posteriorly) ---")
for x in [0.8, 1.2, 1.6, 2.0]:
    mask = (coords0[:, 0] > x) & (coords0[:, 1] > -1.5)
    if np.any(mask):
        sub = coords0[mask]
        print(f"X > {x}: Y in [{sub[:,1].min():.2f}, {sub[:,1].max():.2f}], Z in [{sub[:,2].min():.2f}, {sub[:,2].max():.2f}], count={len(sub)}")

print("\n=== COMPONENT 1: RCA ===")
top_rca = np.argmax(coords1[:, 1])
print(f"RCA Origin approx: {coords1[top_rca]}")
for y in np.linspace(coords1[top_rca, 1], coords1[:, 1].min(), 8):
    mask = np.abs(coords1[:, 1] - y) < 0.15
    if np.any(mask):
        sub = coords1[mask]
        print(f"RCA y={y:.2f}: X in [{sub[:,0].min():.2f}, {sub[:,0].max():.2f}], Z in [{sub[:,2].min():.2f}, {sub[:,2].max():.2f}], count={len(sub)}")
