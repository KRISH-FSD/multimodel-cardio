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
veins = (get_mesh_coords(0) - box_center) * scale
aorta = (get_mesh_coords(3) - box_center) * scale
pulm = (get_mesh_coords(6) - box_center) * scale
hart = (get_mesh_coords(1) - box_center) * scale

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
c0 = art[components[0]]
c1 = art[components[1]]

print("=== COMPONENT 0 (LCA system) ===")
# Origin (closest to Aorta)
d0 = np.min([np.linalg.norm(c0 - pt, axis=1) for pt in aorta[::50]], axis=0)
root0 = c0[np.argmin(d0)]
print(f"LCA Root (Aortic Sinus): {root0}")

print("=== COMPONENT 1 (RCA system) ===")
d1 = np.min([np.linalg.norm(c1 - pt, axis=1) for pt in aorta[::50]], axis=0)
root1 = c1[np.argmin(d1)]
print(f"RCA Root (Aortic Sinus): {root1}")

# Now let's trace Component 1 (RCA) in detail!
# Where does Component 1 go?
print("\n--- Tracing Component 1 (RCA) along Y ---")
for y in np.linspace(0.8, -2.5, 15):
    sub = c1[np.abs(c1[:, 1] - y) < 0.12]
    if len(sub) > 0:
        # Check X distribution
        x_min, x_max, x_mean = sub[:,0].min(), sub[:,0].max(), sub[:,0].mean()
        z_min, z_max, z_mean = sub[:,2].min(), sub[:,2].max(), sub[:,2].mean()
        print(f"Y={y:+.2f}: count={len(sub):4d} | X=[{x_min:+.2f}, {x_max:+.2f}], mean={x_mean:+.2f} | Z=[{z_min:+.2f}, {z_max:+.2f}], mean={z_mean:+.2f}")

# Now let's trace Component 0 (LCA) in detail!
print("\n--- Tracing Component 0 (LCA) along Y ---")
for y in np.linspace(0.8, -2.5, 15):
    sub = c0[np.abs(c0[:, 1] - y) < 0.12]
    if len(sub) > 0:
        x_min, x_max, x_mean = sub[:,0].min(), sub[:,0].max(), sub[:,0].mean()
        z_min, z_max, z_mean = sub[:,2].min(), sub[:,2].max(), sub[:,2].mean()
        print(f"Y={y:+.2f}: count={len(sub):4d} | X=[{x_min:+.2f}, {x_max:+.2f}], mean={x_mean:+.2f} | Z=[{z_min:+.2f}, {z_max:+.2f}], mean={z_mean:+.2f}")
