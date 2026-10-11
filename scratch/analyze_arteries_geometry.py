import struct
import json
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

# Calculate bounding box of the whole scene to find model_center matching <Center> in React Three Fiber
all_min = np.array([float('inf')]*3)
all_max = np.array([float('-inf')]*3)
for m in meshes:
    for p in m['primitives']:
        a = accessors[p['attributes']['POSITION']]
        all_min = np.minimum(all_min, a['min'])
        all_max = np.maximum(all_max, a['max'])

model_center = (all_min + all_max) / 2
scale = 0.018

print(f"Overall Model Min: {all_min}, Max: {all_max}")
print(f"Model Center: {model_center}")
print(f"Scale: {scale}")

# Get Arteries2 mesh
art_mesh = [m for m in meshes if 'Arteries' in m['name']][0]
prim = art_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
pos_bv = bufferViews[pos_acc['bufferView']]
pos_offset = pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']
raw_coords = np.frombuffer(bin_data[pos_offset : pos_offset + count * 12], dtype=np.float32).reshape(-1, 3)

# Transform raw coords into scene coordinates (world coordinates inside <group ref={heartGroupRef}>):
# <Center scale={0.018} position={[0, 0, 0]}> transforms coords by: (raw - model_center) * scale
coords = (raw_coords - model_center) * scale

indices_acc_idx = prim.get('indices')
if indices_acc_idx is not None:
    ind_acc = accessors[indices_acc_idx]
    ind_bv = bufferViews[ind_acc['bufferView']]
    ind_offset = ind_bv.get('byteOffset', 0) + ind_acc.get('byteOffset', 0)
    ind_count = ind_acc['count']
    # componentType 5123 = UNSIGNED_SHORT (uint16), 5125 = UNSIGNED_INT (uint32)
    dtype = np.uint16 if ind_acc['componentType'] == 5123 else np.uint32
    indices = np.frombuffer(bin_data[ind_offset : ind_offset + ind_count * np.dtype(dtype).itemsize], dtype=dtype)
    print(f"Indices count: {len(indices)}, Triangles: {len(indices)//3}")
else:
    indices = None
    print("No indices found (unindexed mesh)")

print(f"\nArteries2 Transformed Scene Coords:")
print(f"X: min={coords[:,0].min():.3f}, max={coords[:,0].max():.3f}")
print(f"Y: min={coords[:,1].min():.3f}, max={coords[:,1].max():.3f}")
print(f"Z: min={coords[:,2].min():.3f}, max={coords[:,2].max():.3f}")

# Connected components analysis using graph / BFS on triangles
if indices is not None:
    triangles = indices.reshape(-1, 3)
    from collections import defaultdict
    adj = defaultdict(set)
    for t0, t1, t2 in triangles:
        adj[t0].add(t1); adj[t0].add(t2)
        adj[t1].add(t0); adj[t1].add(t2)
        adj[t2].add(t0); adj[t2].add(t1)

    visited = set()
    components = []
    for i in range(count):
        if i not in visited:
            comp = []
            queue = [i]
            visited.add(i)
            while queue:
                u = queue.pop()
                comp.append(u)
                for v in adj[u]:
                    if v not in visited:
                        visited.add(v)
                        queue.append(v)
            components.append(comp)

    components.sort(key=len, reverse=True)
    print(f"\nNumber of connected components in Arteries2: {len(components)}")
    for c_i, comp in enumerate(components[:10]):
        comp_coords = coords[comp]
        print(f"Component {c_i}: {len(comp)} vertices")
        print(f"  X: [{comp_coords[:,0].min():.2f}, {comp_coords[:,0].max():.2f}], Y: [{comp_coords[:,1].min():.2f}, {comp_coords[:,1].max():.2f}], Z: [{comp_coords[:,2].min():.2f}, {comp_coords[:,2].max():.2f}]")
