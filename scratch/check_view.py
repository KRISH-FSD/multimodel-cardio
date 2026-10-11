import struct, json, numpy as np

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

# Find Arteries mesh
art_mesh = [m for m in meshes if 'Arteries' in m['name']][0]
prim = art_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
bv = bufferViews[pos_acc['bufferView']]
byte_offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)
coords = (raw_coords - model_center) * scale

print(f"X bounds: {coords[:,0].min():.2f} to {coords[:,0].max():.2f}")
print(f"Y bounds: {coords[:,1].min():.2f} to {coords[:,1].max():.2f}")
print(f"Z bounds: {coords[:,2].min():.2f} to {coords[:,2].max():.2f}")

# Let's inspect points for RCA around Y ~ -0.2 to -0.6
rca_mask = (coords[:, 0] < -0.3) & (coords[:, 1] > -0.8) & (coords[:, 1] < 0.2) & (coords[:, 2] > 1.2)
print("RCA candidate mean:", np.round(coords[rca_mask].mean(axis=0), 3))

# LCX candidate around Y ~ -0.2 to 0.2
lcx_mask = (coords[:, 0] > 0.8) & (coords[:, 1] > -0.4) & (coords[:, 1] < 0.4) & (coords[:, 2] > 1.0)
print("LCX candidate mean:", np.round(coords[lcx_mask].mean(axis=0), 3))

# LAD candidate around Y ~ -0.5 to -1.0
lad_mask = (coords[:, 0] > 0.2) & (coords[:, 0] < 0.7) & (coords[:, 1] > -1.0) & (coords[:, 1] < -0.3) & (coords[:, 2] > 1.4)
print("LAD candidate mean:", np.round(coords[lad_mask].mean(axis=0), 3))
