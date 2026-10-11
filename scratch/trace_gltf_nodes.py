import struct, json
import numpy as np

with open('web/public/anatomical_heart_-_codominance.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len).decode('utf-8'))
    chunk2_len, _ = struct.unpack('<I4s', f.read(8))
    bin_data = f.read(chunk2_len)

nodes = data['nodes']

def get_matrix(node):
    if 'matrix' in node:
        return np.array(node['matrix']).reshape((4, 4), order='F')
    m = np.eye(4)
    if 'scale' in node:
        s = np.diag(node['scale'] + [1.0])
        m = m @ s
    if 'translation' in node:
        t = np.eye(4)
        t[:3, 3] = node['translation']
        m = t @ m
    return m

scene_idx = data.get('scene', 0)
root_nodes = data['scenes'][scene_idx]['nodes']
print('Root nodes:', root_nodes)

def print_tree(n_idx, prefix='', parent_matrix=np.eye(4)):
    node = nodes[n_idx]
    local_m = get_matrix(node)
    world_m = parent_matrix @ local_m
    mesh_info = f" (mesh: {node['mesh']})" if 'mesh' in node else ''
    print(f"{prefix}- Node {n_idx}: {node.get('name')}{mesh_info}")
    if 'mesh' in node:
        print(f"{prefix}  Transform matrix:\n{world_m}")
    for child in node.get('children', []):
        print_tree(child, prefix + '  ', world_m)

for r in root_nodes:
    print_tree(r)
