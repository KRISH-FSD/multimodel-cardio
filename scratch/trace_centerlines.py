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
bv = bufferViews[pos_acc['bufferView']]
byte_offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)
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
comp0 = np.array(components[0]) # LCA (LAD + LCX)
comp1 = np.array(components[1]) # RCA
coords0 = coords[comp0]
coords1 = coords[comp1]

print("="*60)
print("1. TRACING RCA (Component 1)")
print("Course: Right atrioventricular sulcus from base to inferior margin")
print("="*60)
# Segment along Y descending
for y_target in [0.35, 0.20, 0.05, -0.15, -0.40, -0.70, -1.00, -1.30]:
    # In RCA, along right sulcus (X < -0.2, anterior facing Z > 1.2)
    pts = coords1[(np.abs(coords1[:, 1] - y_target) < 0.08) & (coords1[:, 0] < -0.2) & (coords1[:, 2] > 1.0)]
    if len(pts) > 0:
        # Cluster/centroid of the main vessel at this slice
        med = np.median(pts, axis=0)
        print(f"RCA y={y_target:+.2f} -> point: [{med[0]:.3f}, {med[1]:.3f}, {med[2]:.3f}] (n={len(pts)})")

print("\n" + "="*60)
print("2. TRACING LCA BIFURCATION, LAD, AND LCX (Component 0)")
print("="*60)
# Look at LCA bifurcation near base (Y ~ 0.3 to 0.4)
lca_top = coords0[coords0[:, 1] > 0.3]
print(f"LCA main stem / bifurcation region (Y > 0.3):")
print(f"  Center: {np.median(lca_top, axis=0).round(3)}")

print("\n-- LAD: Anterior Interventricular Groove towards apex --")
# LAD descends down the anterior groove. In anterior view (Z > 1.3), X ~ 0.3 to 0.7 at upper/mid, curving towards apex
for y_target in [0.25, 0.10, -0.10, -0.35, -0.65, -0.95, -1.25, -1.60, -2.00, -2.40]:
    # Look for anterior interventricular groove
    # In this heart, LAD runs down around X ~ 0.4 to 0.8, anterior surface Z > 1.4
    pts = coords0[(np.abs(coords0[:, 1] - y_target) < 0.08) & (coords0[:, 0] > 0.1) & (coords0[:, 0] < 0.9) & (coords0[:, 2] > 1.2)]
    if len(pts) > 0:
        med = np.median(pts, axis=0)
        print(f"LAD y={y_target:+.2f} -> point: [{med[0]:.3f}, {med[1]:.3f}, {med[2]:.3f}] (n={len(pts)})")

print("\n-- LCX: Left atrioventricular groove (circumflex wrapping laterally X > 0.9) --")
# LCX branches from LCA and courses laterally along the left AV groove under the left auricle (Heartear)
# Heartear is at X in [0.0, 1.66], Y in [-0.18, 1.34].
# LCX runs laterally around Y ~ 0.3 down to -0.2 with X expanding to 1.0, 1.3, 1.6, 1.9
for x_target in [0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9]:
    pts = coords0[(np.abs(coords0[:, 0] - x_target) < 0.08) & (coords0[:, 1] > -0.5) & (coords0[:, 1] < 0.4) & (coords0[:, 2] > 0.8)]
    if len(pts) > 0:
        med = np.median(pts, axis=0)
        print(f"LCX x={x_target:+.2f} -> point: [{med[0]:.3f}, {med[1]:.3f}, {med[2]:.3f}] (n={len(pts)})")
