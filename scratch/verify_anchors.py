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

art_mesh = [m for m in meshes if 'Arteries' in m['name']][0]
prim = art_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
bv = bufferViews[pos_acc['bufferView']]
byte_offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)
coords = (raw_coords - model_center) * scale

# Candidate anchor points for LAD, LCX, RCA
candidates = {
    'RCA (Right Coronary Artery - Right AV groove)': [-0.55, 0.10, 1.65],
    'LAD (Left Anterior Descending - Anterior IV groove)': [0.65, -0.45, 1.45],
    'LCX (Left Circumflex - Left AV groove)': [1.45, 0.15, 1.25],
}

print("Verifying nearest vertices to candidate anchors:")
for name, target in candidates.items():
    dists = np.linalg.norm(coords - target, axis=1)
    nearest_idx = np.argmin(dists)
    nearest_pt = coords[nearest_idx]
    print(f"\n{name}:")
    print(f"  Target: {target}")
    print(f"  Closest vertex: {nearest_pt.round(4)}, dist = {dists[nearest_idx]:.4f}")
    # Get 10 closest vertices
    top10 = coords[np.argsort(dists)[:10]]
    print(f"  Cluster centroid: {top10.mean(axis=0).round(4)}")
