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

def get_mesh_data(m_idx):
    m = meshes[m_idx]
    p = m['primitives'][0]
    a = accessors[p['attributes']['POSITION']]
    bv = bufferViews[a['bufferView']]
    offset = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    count = a['count']
    raw = np.frombuffer(bin_data[offset : offset + count * 12], dtype=np.float32).reshape(-1, 3)
    raw_h = np.hstack([raw, np.ones((count, 1))])
    transformed_h = raw_h @ T.T
    coords_transformed = transformed_h[:, :3]

    ind_acc = accessors[p['indices']]
    ind_bv = bufferViews[ind_acc['bufferView']]
    ind_offset = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
    ind_count = ind_acc['count']
    dtype = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
    indices = np.frombuffer(bin_data[ind_offset : ind_offset + ind_count * np.dtype(dtype).itemsize], dtype=dtype)
    triangles = indices.reshape(-1, 3)
    return coords_transformed, triangles

all_pts = []
for m_idx in range(len(meshes)):
    c, _ = get_mesh_data(m_idx)
    all_pts.append(c)
all_pts = np.vstack(all_pts)
box_min = all_pts.min(axis=0)
box_max = all_pts.max(axis=0)
box_center = (box_min + box_max) / 2
scale = 0.018

art_coords_raw, tri_art = get_mesh_data(8)
art_coords = (art_coords_raw - box_center) * scale

from collections import defaultdict
adj = defaultdict(set)
for t0, t1, t2 in tri_art:
    adj[t0].add(t1); adj[t0].add(t2)
    adj[t1].add(t0); adj[t1].add(t2)
    adj[t2].add(t0); adj[t2].add(t1)

visited = set()
components = []
for i in range(len(art_coords)):
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
c0 = art_coords[components[0]]
c1 = art_coords[components[1]]

print("=== Component 0 (LCA system) ===")
print("X range:", c0[:,0].min(), c0[:,0].max())
print("Y range:", c0[:,1].min(), c0[:,1].max())
print("Z range:", c0[:,2].min(), c0[:,2].max())

print("\n=== Component 1 (RCA system) ===")
print("X range:", c1[:,0].min(), c1[:,0].max())
print("Y range:", c1[:,1].min(), c1[:,1].max())
print("Z range:", c1[:,2].min(), c1[:,2].max())
