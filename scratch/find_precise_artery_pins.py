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

T = np.array([
    [-0.72961658, -0.31839308,  0.60521525, -5.25511599],
    [-0.68000209,  0.24395397, -0.69143593, -4.03157711],
    [ 0.07250376, -0.9160307 , -0.39450082, -2.67525291],
    [ 0.        ,  0.        ,  0.        ,  1.        ]
])

def get_mesh_coords(mesh_idx):
    m = meshes[mesh_idx]
    p = m['primitives'][0]
    a = accessors[p['attributes']['POSITION']]
    bv = bufferViews[a['bufferView']]
    offset = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    count = a['count']
    raw = np.frombuffer(bin_data[offset : offset + count * 12], dtype=np.float32).reshape(-1, 3)
    raw_h = np.hstack([raw, np.ones((count, 1))])
    transformed_h = raw_h @ T.T
    return transformed_h[:, :3]

all_pts = []
for m_idx in range(len(meshes)):
    all_pts.append(get_mesh_coords(m_idx))
all_pts = np.vstack(all_pts)
box_min = all_pts.min(axis=0)
box_max = all_pts.max(axis=0)
box_center = (box_min + box_max) / 2
scale = 0.018

art = (get_mesh_coords(8) - box_center) * scale

# Find connected components in Arteries2 mesh (LCA system vs RCA system)
# using triangles
m = meshes[8]
p = m['primitives'][0]
ind_acc = accessors[p['indices']]
ind_bv = bufferViews[ind_acc['bufferView']]
ind_offset = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
ind_count = ind_acc['count']
dtype = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
triangles = np.frombuffer(bin_data[ind_offset : ind_offset + ind_count * np.dtype(dtype).itemsize], dtype=dtype).reshape(-1, 3)

from collections import defaultdict
adj = defaultdict(set)
for t0, t1, t2 in triangles:
    adj[t0].add(t1); adj[t0].add(t2)
    adj[t1].add(t0); adj[t1].add(t2)
    adj[t2].add(t0); adj[t2].add(t1)

visited = set()
components = []
for i in range(len(art)):
    if i not in visited:
        comp = []
        q = [i]
        visited.add(i)
        while q:
            u = q.pop()
            comp.append(u)
            for v in adj[u]:
                if v not in visited:
                    visited.add(v)
                    q.append(v)
        components.append(comp)

components.sort(key=len, reverse=True)
c0 = art[components[0]] # LCA
c1 = art[components[1]] # RCA

print(f"LCA vertices: {len(c0)}, RCA vertices: {len(c1)}")

# 1. LAD: Anterior Interventricular Groove
# In Three.js coordinates, LAD descends towards apex.
# Let's see the points in LCA where Z > 1.2:
lca_front = c0[c0[:, 2] > 1.2]
print("\n--- LCA front points (Z > 1.2) ---")
print(f"Count: {len(lca_front)}")
print(f"X: [{lca_front[:,0].min():.2f}, {lca_front[:,0].max():.2f}], Y: [{lca_front[:,1].min():.2f}, {lca_front[:,1].max():.2f}], Z: [{lca_front[:,2].min():.2f}, {lca_front[:,2].max():.2f}]")

# Let's inspect LAD slice by slice along Y:
for y_target in [0.2, 0.0, -0.3, -0.6, -0.9, -1.2, -1.5]:
    sub = lca_front[(np.abs(lca_front[:, 1] - y_target) < 0.1) & (lca_front[:, 0] > 0.3)]
    if len(sub) > 0:
        # Highest Z (most prominent anterior surface)
        best = sub[np.argmax(sub[:, 2])]
        print(f"LAD at Y={y_target:.1f}: best=[{best[0]:.3f}, {best[1]:.3f}, {best[2]:.3f}], n={len(sub)}")

# 2. LCX: Left Circumflex Artery
# Branches from left main, wraps into Left Atrioventricular Groove:
print("\n--- LCX along Left AV Groove ---")
for x_target in [0.4, 0.6, 0.8, -0.2, -0.5, -0.8, -1.2]:
    sub = c0[(np.abs(c0[:, 0] - x_target) < 0.1) & (c0[:, 1] > 0.0) & (c0[:, 1] < 0.8)]
    if len(sub) > 0:
        best = sub[np.argmax(sub[:, 2])]
        print(f"LCX at X={x_target:.1f}: best=[{best[0]:.3f}, {best[1]:.3f}, {best[2]:.3f}], n={len(sub)}")

# 3. RCA: Right Atrioventricular Groove (Component 1)
rca_front = c1[c1[:, 2] > 1.2]
print("\n--- RCA front points (Z > 1.2) ---")
print(f"Count: {len(rca_front)}")
print(f"X: [{rca_front[:,0].min():.2f}, {rca_front[:,0].max():.2f}], Y: [{rca_front[:,1].min():.2f}, {rca_front[:,1].max():.2f}], Z: [{rca_front[:,2].min():.2f}, {rca_front[:,2].max():.2f}]")
for y_target in [0.4, 0.2, 0.0, -0.2, -0.5, -0.8]:
    sub = rca_front[np.abs(rca_front[:, 1] - y_target) < 0.1]
    if len(sub) > 0:
        best = sub[np.argmax(sub[:, 2])]
        print(f"RCA at Y={y_target:.1f}: best=[{best[0]:.3f}, {best[1]:.3f}, {best[2]:.3f}], n={len(sub)}")
