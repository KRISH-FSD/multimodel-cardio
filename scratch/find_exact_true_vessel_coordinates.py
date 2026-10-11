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

aorta_coords_raw, _ = get_mesh_data(3)
aorta_coords = (aorta_coords_raw - box_center) * scale

hart_coords_raw, _ = get_mesh_data(1)
hart_coords = (hart_coords_raw - box_center) * scale

# Find connected components in Arteries2 mesh (LCA system vs RCA system)
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
c0_idx = components[0] # LCA
c1_idx = components[1] # RCA

c0 = art_coords[c0_idx]
c1 = art_coords[c1_idx]

print(f"LCA vertices: {len(c0)}, RCA vertices: {len(c1)}")

# 1. LAD: Anterior interventricular groove
# In anterior view (facing camera, high Z), runs from base (Y ~ 0) down towards apex (Y ~ -1.5, X ~ 0.5-0.7)
print("\n=== LAD candidate points (Anterior IV Groove) ===")
lad_spline = []
for y in np.linspace(0.4, -1.8, 12):
    # filter in LCA component where Z is high (anterior) and X is medial (0.3 to 0.9)
    sub = c0[(np.abs(c0[:, 1] - y) < 0.08) & (c0[:, 0] > 0.3) & (c0[:, 0] < 0.9) & (c0[:, 2] > 1.0)]
    if len(sub) > 0:
        # Frontmost points (highest Z)
        top = sub[np.argsort(-sub[:, 2])][:10]
        pt = top.mean(axis=0)
        lad_spline.append(pt)
        print(f"Y={y:+.2f} -> pt=[{pt[0]:.3f}, {pt[1]:.3f}, {pt[2]:.3f}], n={len(sub)}")

# LAD main anchor at middle of anterior descending groove:
lad_anchor = c0[(np.abs(c0[:, 1] - (-0.6)) < 0.08) & (c0[:, 0] > 0.5) & (c0[:, 0] < 0.8) & (c0[:, 2] > 1.3)]
lad_anchor_pt = lad_anchor[np.argsort(-lad_anchor[:, 2])][0]
print(f"\n>> LAD Anchor: [{lad_anchor_pt[0]:.3f}, {lad_anchor_pt[1]:.3f}, {lad_anchor_pt[2]:.3f}]")

# 2. LCX: Left atrioventricular groove
# Emerges from left main, wraps around lateral/posterior left heart (X > 0.8, Y ~ 0.0 to 0.4)
print("\n=== LCX candidate points (Left AV Groove) ===")
lcx_spline = []
for x in np.linspace(0.6, 1.8, 10):
    sub = c0[(np.abs(c0[:, 0] - x) < 0.08) & (c0[:, 1] > -0.2) & (c0[:, 1] < 0.5)]
    if len(sub) > 0:
        # lateral circumflex branch
        top = sub[np.argsort(-sub[:, 2])][:10]
        pt = top.mean(axis=0)
        lcx_spline.append(pt)
        print(f"X={x:.2f} -> pt=[{pt[0]:.3f}, {pt[1]:.3f}, {pt[2]:.3f}], n={len(sub)}")

# LCX main anchor along left AV groove:
lcx_anchor = c0[(np.abs(c0[:, 0] - 1.4) < 0.08) & (c0[:, 1] > 0.0) & (c0[:, 1] < 0.3)]
lcx_anchor_pt = lcx_anchor[np.argsort(-lcx_anchor[:, 2])][0]
print(f"\n>> LCX Anchor: [{lcx_anchor_pt[0]:.3f}, {lcx_anchor_pt[1]:.3f}, {lcx_anchor_pt[2]:.3f}]")

# 3. RCA: Right atrioventricular groove (Component 1)
print("\n=== RCA candidate points (Right AV Groove) ===")
rca_spline = []
for y in np.linspace(0.4, -1.2, 12):
    sub = c1[(np.abs(c1[:, 1] - y) < 0.08)]
    if len(sub) > 0:
        # RCA on right side (negative X, high Z in anterior view)
        sub_ant = sub[sub[:, 0] < 0.0]
        if len(sub_ant) > 0:
            top = sub_ant[np.argsort(-sub_ant[:, 2])][:10]
            pt = top.mean(axis=0)
            rca_spline.append(pt)
            print(f"Y={y:+.2f} -> pt=[{pt[0]:.3f}, {pt[1]:.3f}, {pt[2]:.3f}], n={len(sub_ant)}")

rca_anchor = c1[(np.abs(c1[:, 1] - 0.1) < 0.08) & (c1[:, 0] < -0.3) & (c1[:, 2] > 1.2)]
rca_anchor_pt = rca_anchor[np.argsort(-rca_anchor[:, 2])][0]
print(f"\n>> RCA Anchor: [{rca_anchor_pt[0]:.3f}, {rca_anchor_pt[1]:.3f}, {rca_anchor_pt[2]:.3f}]")
