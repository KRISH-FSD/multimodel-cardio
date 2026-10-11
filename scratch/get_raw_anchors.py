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

art_mesh = [m for m in meshes if 'Arteries' in m['name']][0]
prim = art_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
bv = bufferViews[pos_acc['bufferView']]
byte_offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)

all_min = np.array([float('inf')]*3)
all_max = np.array([float('-inf')]*3)
for m in meshes:
    for p in m['primitives']:
        a = accessors[p['attributes']['POSITION']]
        all_min = np.minimum(all_min, a['min'])
        all_max = np.maximum(all_max, a['max'])
model_center = (all_min + all_max) / 2
scale = 0.018

# Find exact vertices closest to our verified target anchors:
# LAD: Anterior Interventricular Groove
lad_target = np.array([0.658, -0.632, 1.486]) / scale + model_center
d_lad = np.linalg.norm(raw_coords - lad_target, axis=1)
lad_idx = np.argmin(d_lad)
raw_lad = raw_coords[lad_idx]
print(f"LAD Raw Vertex: {raw_lad.round(3).tolist()}, Transformed: {((raw_lad - model_center) * scale).round(3).tolist()}")

# LCX: Left Atrioventricular Groove
lcx_target = np.array([1.453, 0.147, 1.240]) / scale + model_center
d_lcx = np.linalg.norm(raw_coords - lcx_target, axis=1)
lcx_idx = np.argmin(d_lcx)
raw_lcx = raw_coords[lcx_idx]
print(f"LCX Raw Vertex: {raw_lcx.round(3).tolist()}, Transformed: {((raw_lcx - model_center) * scale).round(3).tolist()}")

# RCA: Right Atrioventricular Groove
rca_target = np.array([-0.539, 0.132, 1.648]) / scale + model_center
d_rca = np.linalg.norm(raw_coords - rca_target, axis=1)
rca_idx = np.argmin(d_rca)
raw_rca = raw_coords[rca_idx]
print(f"RCA Raw Vertex: {raw_rca.round(3).tolist()}, Transformed: {((raw_rca - model_center) * scale).round(3).tolist()}")
