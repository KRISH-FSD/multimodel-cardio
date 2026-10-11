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
aorta = (get_mesh_coords(3) - box_center) * scale

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
print(f"Total components found: {len(components)}")
for i, comp in enumerate(components[:4]):
    c = art[comp]
    print(f"\nComponent {i}: count={len(c)}")
    print(f"  X: [{c[:,0].min():.3f}, {c[:,0].max():.3f}], mean={c[:,0].mean():.3f}")
    print(f"  Y: [{c[:,1].min():.3f}, {c[:,1].max():.3f}], mean={c[:,1].mean():.3f}")
    print(f"  Z: [{c[:,2].min():.3f}, {c[:,2].max():.3f}], mean={c[:,2].mean():.3f}")
    # Distance to Aorta (coronary ostium should originate at aorta)
    min_d = np.min([np.min(np.linalg.norm(c - pt, axis=1)) for pt in aorta[::50]])
    print(f"  Min dist to Aorta: {min_d:.4f}")

# Check our 3 current pin positions and see which component they belong to!
pins = {
    'LCX Pin': np.array([-0.876, 0.012, 2.225]),
    'RCA Pin': np.array([0.853, 0.146, 1.903]),
    'LAD Pin': np.array([0.614, -0.856, 1.375])
}
for name, p in pins.items():
    for i, comp in enumerate(components[:2]):
        c = art[comp]
        d = np.linalg.norm(c - p, axis=1).min()
        print(f"{name} distance to Component {i}: {d:.6f}")
