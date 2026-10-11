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

print(f"Arteries count: {len(art)}, Veins count: {len(veins)}")

# In the user screenshot:
# Current pin positions:
# RCA: [-0.539, 0.132, 1.648]
# LCX: [1.453, 0.147, 1.240]
# LAD: [0.658, -0.632, 1.486]
# Notice all 3 pins have Z > 1.2!
# Let's see what is at Z > 1.2:
print("\nAt Z > 1.2:")
art_front = art[art[:, 2] > 1.2]
veins_front = veins[veins[:, 2] > 1.2]
print(f"Arteries with Z > 1.2: {len(art_front)}")
print(f"Veins with Z > 1.2: {len(veins_front)}")

print("\nAt Z < -0.5:")
art_back = art[art[:, 2] < -0.5]
veins_back = veins[veins[:, 2] < -0.5]
print(f"Arteries with Z < -0.5: {len(art_back)}")
print(f"Veins with Z < -0.5: {len(veins_back)}")
