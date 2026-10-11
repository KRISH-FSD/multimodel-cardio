import struct, json
import numpy as np

with open('web/public/heart0088_coronary_arteries.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len).decode('utf-8'))
    chunk2_len, _ = struct.unpack('<I4s', f.read(8))
    bin_data = f.read(chunk2_len)

accessors = data['accessors']
bufferViews = data['bufferViews']
meshes = data['meshes']

# Bounding box of heart0088
all_min = np.array([float('inf')]*3)
all_max = np.array([float('-inf')]*3)
for m in meshes:
    for p in m['primitives']:
        a = accessors[p['attributes']['POSITION']]
        all_min = np.minimum(all_min, a['min'])
        all_max = np.maximum(all_max, a['max'])

model_center = (all_min + all_max) / 2
scale = 0.03 # Used in <Center scale={0.03}>

print("=== heart0088_coronary_arteries.glb ===")
print("Model Min:", all_min)
print("Model Max:", all_max)
print("Model Center:", model_center)
print(f"Transformed bounds (scale={scale}):")
print("Min:", (all_min - model_center) * scale)
print("Max:", (all_max - model_center) * scale)

for i, m in enumerate(meshes):
    p = m['primitives'][0]
    a = accessors[p['attributes']['POSITION']]
    m_min = (np.array(a['min']) - model_center) * scale
    m_max = (np.array(a['max']) - model_center) * scale
    print(f"Mesh {i} ('{m.get('name')}'): count={a['count']}, X=[{m_min[0]:.2f}, {m_max[0]:.2f}], Y=[{m_min[1]:.2f}, {m_max[1]:.2f}], Z=[{m_min[2]:.2f}, {m_max[2]:.2f}]")
