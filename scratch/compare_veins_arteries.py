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

def get_mesh_coords(mesh_name):
    m = [mesh for mesh in meshes if mesh_name in mesh['name']][0]
    p = m['primitives'][0]
    a = accessors[p['attributes']['POSITION']]
    bv = bufferViews[a['bufferView']]
    offset = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    count = a['count']
    raw = np.frombuffer(bin_data[offset : offset + count * 12], dtype=np.float32).reshape(-1, 3)
    return (raw - model_center) * scale

coords_art = get_mesh_coords('Arteries2')
coords_veins = get_mesh_coords('Veins')
coords_aorta = get_mesh_coords('Aorta')
coords_pt = get_mesh_coords('Pulmonary_trunk')

print("=== MESH COMPARISON ===")
print(f"Arteries2: count={len(coords_art)}, X=[{coords_art[:,0].min():.2f}, {coords_art[:,0].max():.2f}], Y=[{coords_art[:,1].min():.2f}, {coords_art[:,1].max():.2f}], Z=[{coords_art[:,2].min():.2f}, {coords_art[:,2].max():.2f}]")
print(f"Veins:     count={len(coords_veins)}, X=[{coords_veins[:,0].min():.2f}, {coords_veins[:,0].max():.2f}], Y=[{coords_veins[:,1].min():.2f}, {coords_veins[:,1].max():.2f}], Z=[{coords_veins[:,2].min():.2f}, {coords_veins[:,2].max():.2f}]")
print(f"Aorta:     count={len(coords_aorta)}, X=[{coords_aorta[:,0].min():.2f}, {coords_aorta[:,0].max():.2f}], Y=[{coords_aorta[:,1].min():.2f}, {coords_aorta[:,1].max():.2f}], Z=[{coords_aorta[:,2].min():.2f}, {coords_aorta[:,2].max():.2f}]")

# Where does each connect?
# Arteries should originate from the Aorta!
min_art_to_aorta = np.min([np.min(np.linalg.norm(coords_art - pt, axis=1)) for pt in coords_aorta[::50]])
min_veins_to_aorta = np.min([np.min(np.linalg.norm(coords_veins - pt, axis=1)) for pt in coords_aorta[::50]])
print(f"Closest distance from Arteries2 to Aorta: {min_art_to_aorta:.4f}")
print(f"Closest distance from Veins to Aorta: {min_veins_to_aorta:.4f}")

# Look at our 3 pin candidate positions:
targets = {
    'RCA Candidate': [-0.539, 0.132, 1.648],
    'LAD Candidate': [0.658, -0.632, 1.486],
    'LCX Candidate': [1.453, 0.147, 1.240]
}

for name, t in targets.items():
    d_art = np.min(np.linalg.norm(coords_art - t, axis=1))
    d_vein = np.min(np.linalg.norm(coords_veins - t, axis=1))
    print(f"\n{name} {t}:")
    print(f"  Dist to nearest Arteries2 vertex: {d_art:.4f}")
    print(f"  Dist to nearest Veins vertex:     {d_vein:.4f}")
