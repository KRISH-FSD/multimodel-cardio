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

# 1. LAD: Anterior interventricular groove
# Trace from bifurcation (Y ~ 0.3) to apex (Y ~ -2.0)
lad_targets = [
    [0.77, 0.25, 1.23],
    [0.71, 0.11, 1.28],
    [0.69, -0.12, 1.36],
    [0.68, -0.35, 1.43],
    [0.64, -0.65, 1.48],
    [0.48, -0.92, 1.48],
    [0.72, -1.26, 1.62],
    [0.68, -1.60, 1.52],
    [0.55, -1.95, 1.30],
]

lad_snapped = []
for pt in lad_targets:
    dists = np.linalg.norm(coords - pt, axis=1)
    nearest = coords[np.argmin(dists)]
    lad_snapped.append(nearest.round(3).tolist())

print("LAD SNAPPED SPLINE POINTS:")
print(json.dumps(lad_snapped, indent=2))

# 2. LCX: Left atrioventricular groove (sulcus)
lcx_targets = [
    [0.69, 0.20, 1.20],
    [0.92, 0.24, 1.21],
    [1.15, 0.22, 1.21],
    [1.35, 0.18, 1.21],
    [1.52, 0.12, 1.24],
    [1.70, -0.03, 1.36],
    [1.85, -0.22, 1.31],
]

lcx_snapped = []
for pt in lcx_targets:
    dists = np.linalg.norm(coords - pt, axis=1)
    nearest = coords[np.argmin(dists)]
    lcx_snapped.append(nearest.round(3).tolist())

print("\nLCX SNAPPED SPLINE POINTS:")
print(json.dumps(lcx_snapped, indent=2))

# 3. RCA: Right atrioventricular groove
rca_targets = [
    [-0.45, 0.31, 1.75],
    [-0.55, 0.20, 1.80],
    [-0.56, 0.10, 1.65],
    [-0.54, -0.05, 1.55],
    [-0.52, -0.18, 1.48],
    [-0.42, -0.39, 1.24],
    [-0.55, -0.70, 1.35],
    [-0.60, -0.98, 1.50],
]

rca_snapped = []
for pt in rca_targets:
    dists = np.linalg.norm(coords - pt, axis=1)
    nearest = coords[np.argmin(dists)]
    rca_snapped.append(nearest.round(3).tolist())

print("\nRCA SNAPPED SPLINE POINTS:")
print(json.dumps(rca_snapped, indent=2))
