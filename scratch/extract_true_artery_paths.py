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

# Component separation
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
c_lca = art[components[0]] # LCA system
c_rca = art[components[1]] # RCA system

print("=== EXAMINING LCA (Left Coronary Artery) ===")
# In LCA:
# LAD runs down anterior interventricular groove towards apex
# Let's find the main LAD centerline points from base to apex:
# In c_lca, LAD is on anterior face (Z > 1.2), medial side (X > 0.3)
lad_pts = []
for y in [0.2, 0.0, -0.2, -0.4, -0.6, -0.8, -1.0, -1.3, -1.6]:
    sub = c_lca[(np.abs(c_lca[:, 1] - y) < 0.1) & (c_lca[:, 0] > 0.25) & (c_lca[:, 0] < 0.85) & (c_lca[:, 2] > 1.1)]
    if len(sub) > 0:
        top = sub[np.argsort(-sub[:, 2])][:8]
        pt = top.mean(axis=0)
        lad_pts.append(pt)
        print(f"LAD at Y={y:+.1f}: [{pt[0]:.3f}, {pt[1]:.3f}, {pt[2]:.3f}]")

print("\n=== EXAMINING LCX (Left Circumflex Artery) ===")
# LCX branches from left main and courses around left atrioventricular groove (lateral left: negative X)
lcx_pts = []
for x in [-0.2, -0.4, -0.6, -0.8, -1.0, -1.2, -1.4]:
    sub = c_lca[(np.abs(c_lca[:, 0] - x) < 0.1) & (c_lca[:, 1] > -0.2) & (c_lca[:, 1] < 0.6) & (c_lca[:, 2] > 1.0)]
    if len(sub) > 0:
        top = sub[np.argsort(-sub[:, 2])][:8]
        pt = top.mean(axis=0)
        lcx_pts.append(pt)
        print(f"LCX at X={x:+.1f}: [{pt[0]:.3f}, {pt[1]:.3f}, {pt[2]:.3f}]")

print("\n=== EXAMINING RCA (Right Coronary Artery) ===")
# RCA courses along right atrioventricular groove (positive X, Z > 1.2)
rca_pts = []
for y in [0.4, 0.2, 0.0, -0.2, -0.4, -0.6, -0.8, -1.0]:
    sub = c_rca[(np.abs(c_rca[:, 1] - y) < 0.1) & (c_rca[:, 0] > 0.4) & (c_rca[:, 2] > 1.2)]
    if len(sub) > 0:
        top = sub[np.argsort(-sub[:, 2])][:8]
        pt = top.mean(axis=0)
        rca_pts.append(pt)
        print(f"RCA at Y={y:+.1f}: [{pt[0]:.3f}, {pt[1]:.3f}, {pt[2]:.3f}]")
