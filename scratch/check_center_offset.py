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

# In Three.js, Box3().setFromObject(scene) computes the bounding box across all meshes
all_min = np.array([float('inf')]*3)
all_max = np.array([float('-inf')]*3)
for m in meshes:
    for p in m['primitives']:
        a = accessors[p['attributes']['POSITION']]
        all_min = np.minimum(all_min, a['min'])
        all_max = np.maximum(all_max, a['max'])

center = (all_min + all_max) / 2
print("all_min:", all_min)
print("all_max:", all_max)
print("center:", center)
print("scale: 0.018")

# If an object is inside <Center scale={0.018}>:
# In Three.js, <Center> does:
# group.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
# or children are scaled and offset: (v - center) * scale
print("Offset (-center * scale):", -center * 0.018)
