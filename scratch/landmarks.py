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

# Bounding box of entire scene
all_min = np.array([float('inf')]*3)
all_max = np.array([float('-inf')]*3)
for m in meshes:
    for p in m['primitives']:
        a = accessors[p['attributes']['POSITION']]
        all_min = np.minimum(all_min, a['min'])
        all_max = np.maximum(all_max, a['max'])

model_center = (all_min + all_max) / 2
scale = 0.018

# Also inspect all mesh names and their bounding boxes in scene coords
print("Meshes and their scene bounds:")
for m in meshes:
    p = m['primitives'][0]
    a = accessors[p['attributes']['POSITION']]
    m_min = (np.array(a['min']) - model_center) * scale
    m_max = (np.array(a['max']) - model_center) * scale
    print(f"Mesh '{m['name']}': X=[{m_min[0]:.2f}, {m_max[0]:.2f}], Y=[{m_min[1]:.2f}, {m_max[1]:.2f}], Z=[{m_min[2]:.2f}, {m_max[2]:.2f}]")

art_mesh = [m for m in meshes if 'Arteries' in m['name']][0]
prim = art_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
bv = bufferViews[pos_acc['bufferView']]
byte_offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)
coords = (raw_coords - model_center) * scale

# Also get Auricle/Heartear bounds
heartear_mesh = [m for m in meshes if 'Heartear' in m['name']][0]
p_h = heartear_mesh['primitives'][0]
a_h = accessors[p_h['attributes']['POSITION']]
h_min = (np.array(a_h['min']) - model_center) * scale
h_max = (np.array(a_h['max']) - model_center) * scale
print(f"\nHeartear (Left Auricle) bounds: X=[{h_min[0]:.2f}, {h_max[0]:.2f}], Y=[{h_min[1]:.2f}, {h_max[1]:.2f}], Z=[{h_min[2]:.2f}, {h_max[2]:.2f}]")

# And Pulmonary Trunk
pt_mesh = [m for m in meshes if 'Pulmonary' in m['name']][0]
p_pt = pt_mesh['primitives'][0]
a_pt = accessors[p_pt['attributes']['POSITION']]
pt_min = (np.array(a_pt['min']) - model_center) * scale
pt_max = (np.array(a_pt['max']) - model_center) * scale
print(f"Pulmonary Trunk bounds: X=[{pt_min[0]:.2f}, {pt_min[0]:.2f}], Y=[{pt_min[1]:.2f}, {pt_min[1]:.2f}], Z=[{pt_min[2]:.2f}, {pt_min[2]:.2f}]")
