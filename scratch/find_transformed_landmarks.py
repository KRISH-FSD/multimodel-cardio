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

# Transform matrix of the mesh nodes in Three.js scene:
T = np.array([
    [-0.72961658, -0.31839308,  0.60521525, -5.25511599],
    [-0.68000209,  0.24395397, -0.69143593, -4.03157711],
    [ 0.07250376, -0.9160307 , -0.39450082, -2.67525291],
    [ 0.        ,  0.        ,  0.        ,  1.        ]
])

def get_mesh_transformed(mesh_idx):
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

# Compute true bounding box across all meshes in scene
all_pts = []
for m_idx in range(len(meshes)):
    pts = get_mesh_transformed(m_idx)
    all_pts.append(pts)

all_pts = np.vstack(all_pts)
box_min = all_pts.min(axis=0)
box_max = all_pts.max(axis=0)
box_center = (box_min + box_max) / 2
print("Three.js Box3 min:", box_min)
print("Three.js Box3 max:", box_max)
print("Three.js Box3 center:", box_center)

scale = 0.018
# When Drei <Center scale={0.018}> is used:
# Final Three.js position of any transformed point P is:
# (P - box_center) * scale
print("\n--- Center offset (-box_center * scale) ---:", -box_center * scale)

# Now let's inspect Arteries2 (mesh index 8) in <Center> coordinates:
art_pts = (get_mesh_transformed(8) - box_center) * scale
print(f"\nArteries2 in Center coordinates: count={len(art_pts)}")
print(f"X range: [{art_pts[:,0].min():.3f}, {art_pts[:,0].max():.3f}]")
print(f"Y range: [{art_pts[:,1].min():.3f}, {art_pts[:,1].max():.3f}]")
print(f"Z range: [{art_pts[:,2].min():.3f}, {art_pts[:,2].max():.3f}]")

# Let's inspect Veins (mesh index 0) in <Center> coordinates:
vein_pts = (get_mesh_transformed(0) - box_center) * scale
print(f"\nVeins in Center coordinates: count={len(vein_pts)}")
print(f"X range: [{vein_pts[:,0].min():.3f}, {vein_pts[:,0].max():.3f}]")
print(f"Y range: [{vein_pts[:,1].min():.3f}, {vein_pts[:,1].max():.3f}]")
print(f"Z range: [{vein_pts[:,2].min():.3f}, {vein_pts[:,2].max():.3f}]")

# Now let's compare our current surfacePos to Arteries2 and Veins in this true Three.js coordinate system!
curr_pins = {
    'RCA': [-0.539, 0.132, 1.648],
    'LCX': [1.453, 0.147, 1.240],
    'LAD': [0.658, -0.632, 1.486]
}
for name, pos in curr_pins.items():
    pos = np.array(pos)
    d_art = np.linalg.norm(art_pts - pos, axis=1).min()
    d_vein = np.linalg.norm(vein_pts - pos, axis=1).min()
    print(f"\nCurrent {name} pin {pos}:")
    print(f"  Distance to true Arteries2 in Three.js: {d_art:.4f}")
    print(f"  Distance to true Veins in Three.js:     {d_vein:.4f}")
