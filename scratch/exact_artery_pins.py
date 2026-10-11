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

art_mesh = [m for m in meshes if 'Arteries' in m['name']][0]
prim = art_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
bv = bufferViews[pos_acc['bufferView']]
byte_offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)
coords = (raw_coords - model_center) * scale

# 1. LAD main descending trunk:
# In the 3D model, look at vertices along the main anterior interventricular groove
# In anterior view (Z > 1.3), near Y ~ -0.6 to -1.0
print("--- Finding LAD main trunk points ---")
for y_target in [-0.4, -0.6, -0.8, -1.0]:
    pts = coords[(np.abs(coords[:, 1] - y_target) < 0.08) & (coords[:, 2] > 1.5)]
    # We want the main prominent anterior artery
    if len(pts) > 0:
        # Sort by Z descending (most anterior / forward facing)
        top_pts = pts[np.argsort(-pts[:, 2])][:10]
        mean_pt = top_pts.mean(axis=0)
        print(f"LAD y={y_target:.1f} -> X={mean_pt[0]:.3f}, Y={mean_pt[1]:.3f}, Z={mean_pt[2]:.3f}")

print("\n--- Finding LCX circumflex points ---")
# LCX runs along the left atrioventricular groove (X > 0.5, Y ~ 0.0 to 0.4, Z > 1.0)
for y_target in [0.3, 0.1, -0.1, -0.3]:
    pts = coords[(np.abs(coords[:, 1] - y_target) < 0.08) & (coords[:, 0] > 0.6) & (coords[:, 2] > 1.2)]
    if len(pts) > 0:
        top_pts = pts[np.argsort(-pts[:, 2])][:10]
        mean_pt = top_pts.mean(axis=0)
        print(f"LCX y={y_target:.1f} -> X={mean_pt[0]:.3f}, Y={mean_pt[1]:.3f}, Z={mean_pt[2]:.3f}")

print("\n--- Finding RCA points ---")
# RCA runs along the right groove (X < -0.3, Y ~ 0.4 down to -0.6, Z > 1.5)
for y_target in [0.3, 0.1, -0.1, -0.3]:
    pts = coords[(np.abs(coords[:, 1] - y_target) < 0.08) & (coords[:, 0] < -0.3) & (coords[:, 2] > 1.5)]
    if len(pts) > 0:
        top_pts = pts[np.argsort(-pts[:, 2])][:10]
        mean_pt = top_pts.mean(axis=0)
        print(f"RCA y={y_target:.1f} -> X={mean_pt[0]:.3f}, Y={mean_pt[1]:.3f}, Z={mean_pt[2]:.3f}")
