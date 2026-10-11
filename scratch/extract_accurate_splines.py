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

# 1. LAD splines:
lad_splines = []
for y in [-0.25, -0.45, -0.68, -0.85, -1.05, -1.25, -1.45, -1.75]:
    sub = c0[(np.abs(c0[:, 1] - y) < 0.1) & (c0[:, 0] > -0.6) & (c0[:, 0] < 0.2) & (c0[:, 2] > 2.0)]
    if len(sub) > 0:
        top = sub[np.argsort(-sub[:, 2])][:5]
        pt = np.round(top.mean(axis=0), 3).tolist()
        lad_splines.append(pt)

# 2. LCX splines:
lcx_splines = []
for y in [0.45, 0.30, 0.15, -0.05, -0.25, -0.45, -0.65]:
    sub = c0[(np.abs(c0[:, 1] - y) < 0.1) & (c0[:, 0] < -0.6) & (c0[:, 2] > 1.8)]
    if len(sub) > 0:
        top = sub[np.argsort(-sub[:, 2])][:5]
        pt = np.round(top.mean(axis=0), 3).tolist()
        lcx_splines.append(pt)

# 3. RCA splines:
rca_splines = []
for y in [0.45, 0.25, 0.05, -0.15, -0.35, -0.60, -0.85, -1.10]:
    sub = c1[(np.abs(c1[:, 1] - y) < 0.1) & (c1[:, 0] > 1.4) & (c1[:, 2] > 0.8)]
    if len(sub) > 0:
        top = sub[np.argsort(-sub[:, 2])][:5]
        pt = np.round(top.mean(axis=0), 3).tolist()
        rca_splines.append(pt)

print("LAD_SPLINES =", lad_splines)
print("LCX_SPLINES =", lcx_splines)
print("RCA_SPLINES =", rca_splines)
