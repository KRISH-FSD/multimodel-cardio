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

all_min = np.array([float('inf')]*3)
all_max = np.array([float('-inf')]*3)
for m in meshes:
    for p in m['primitives']:
        a = accessors[p['attributes']['POSITION']]
        all_min = np.minimum(all_min, a['min'])
        all_max = np.maximum(all_max, a['max'])
model_center = (all_min + all_max) / 2
scale = 0.018

def get_mesh_data(name):
    m = [mesh for mesh in meshes if name in mesh['name']][0]
    p = m['primitives'][0]
    a = accessors[p['attributes']['POSITION']]
    bv = bufferViews[a['bufferView']]
    offset = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    count = a['count']
    raw = np.frombuffer(bin_data[offset : offset + count * 12], dtype=np.float32).reshape(-1, 3)
    coords = (raw - model_center) * scale

    ind_acc = accessors[p['indices']]
    ind_bv = bufferViews[ind_acc['bufferView']]
    ind_offset = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
    ind_count = ind_acc['count']
    dtype = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
    indices = np.frombuffer(bin_data[ind_offset : ind_offset + ind_count * np.dtype(dtype).itemsize], dtype=dtype)
    triangles = indices.reshape(-1, 3)
    return coords, triangles

coords_art, tri_art = get_mesh_data('Arteries2')
coords_vein, tri_vein = get_mesh_data('Veins')

print(f"Arteries2: {len(coords_art)} verts, {len(tri_art)} tris")
print(f"Veins:     {len(coords_vein)} verts, {len(tri_vein)} tris")

# In the screenshot, look at the big blue vessel running horizontally across the middle of the heart!
# What are its coordinates?
# In anterior view (Z > 1.0, Y ~ -0.2 to 0.4, X ~ -1.5 to 1.5)
sub_vein = coords_vein[(coords_vein[:, 2] > 1.2) & (coords_vein[:, 1] > -0.5) & (coords_vein[:, 1] < 0.5)]
print(f"Veins in anterior transverse area (Z > 1.2, -0.5 < Y < 0.5): {len(sub_vein)} verts")
if len(sub_vein) > 0:
    print(f"  X span: [{sub_vein[:,0].min():.2f}, {sub_vein[:,0].max():.2f}]")
    print(f"  Y span: [{sub_vein[:,1].min():.2f}, {sub_vein[:,1].max():.2f}]")
    print(f"  Z span: [{sub_vein[:,2].min():.2f}, {sub_vein[:,2].max():.2f}]")

sub_art = coords_art[(coords_art[:, 2] > 1.2) & (coords_art[:, 1] > -0.5) & (coords_art[:, 1] < 0.5)]
print(f"Arteries2 in anterior transverse area (Z > 1.2, -0.5 < Y < 0.5): {len(sub_art)} verts")
if len(sub_art) > 0:
    print(f"  X span: [{sub_art[:,0].min():.2f}, {sub_art[:,0].max():.2f}]")
    print(f"  Y span: [{sub_art[:,1].min():.2f}, {sub_art[:,1].max():.2f}]")
    print(f"  Z span: [{sub_art[:,2].min():.2f}, {sub_art[:,2].max():.2f}]")
