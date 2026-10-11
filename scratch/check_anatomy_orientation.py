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

# Aorta (mesh 3)
# Pulmonary_trunk (mesh 6)
# Veins (mesh 0)
# Arteries2 (mesh 8)
aorta = (get_mesh_coords(3) - box_center) * scale
pulm = (get_mesh_coords(6) - box_center) * scale
veins = (get_mesh_coords(0) - box_center) * scale

print(f"Aorta center:             [{aorta.mean(axis=0)[0]:.3f}, {aorta.mean(axis=0)[1]:.3f}, {aorta.mean(axis=0)[2]:.3f}]")
print(f"Pulmonary trunk center:   [{pulm.mean(axis=0)[0]:.3f}, {pulm.mean(axis=0)[1]:.3f}, {pulm.mean(axis=0)[2]:.3f}]")
print(f"Veins center:             [{veins.mean(axis=0)[0]:.3f}, {veins.mean(axis=0)[1]:.3f}, {veins.mean(axis=0)[2]:.3f}]")

# In default camera view: Camera is at (0, -0.2, 9.8), looking at (0, -0.2, 0).
# So +Z is facing TOWARDS THE CAMERA! -Z is facing AWAY from the camera!
print(f"Pulmonary Z ({pulm.mean(axis=0)[2]:.2f}) vs Aorta Z ({aorta.mean(axis=0)[2]:.2f}):")
if pulm.mean(axis=0)[2] > aorta.mean(axis=0)[2]:
    print(">> Pulmonary trunk is +Z (ANTERIOR / facing camera). The initial view is ANTERIOR (FRONT)!")
else:
    print(">> Pulmonary trunk is -Z. The initial view is POSTERIOR (BACK)!")
