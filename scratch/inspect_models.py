import struct
import json
import numpy as np

def inspect_glb(glb_path):
    print("=" * 60)
    print("INSPECTING:", glb_path)
    print("=" * 60)
    with open(glb_path, 'rb') as f:
        magic, version, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
        json_data = json.loads(f.read(chunk_len).decode('utf-8'))
        chunk2_len, chunk2_type = struct.unpack('<I4s', f.read(8))
        bin_data = f.read(chunk2_len)

    accessors = json_data.get('accessors', [])
    buffer_views = json_data.get('bufferViews', [])
    meshes = json_data.get('meshes', [])
    nodes = json_data.get('nodes', [])
    materials = json_data.get('materials', [])

    print(f"Total Nodes: {len(nodes)}, Meshes: {len(meshes)}, Materials: {len(materials)}")
    print("Materials list:")
    for idx, mat in enumerate(materials):
        print(f"  [{idx}] {mat.get('name')}")

    print("\nMeshes & Primitives:")
    for m_idx, mesh in enumerate(meshes):
        print(f"\nMesh [{m_idx}]: '{mesh.get('name')}'")
        for p_idx, prim in enumerate(mesh.get('primitives', [])):
            pos_acc_idx = prim.get('attributes', {}).get('POSITION')
            mat_idx = prim.get('material')
            mat_name = materials[mat_idx].get('name') if mat_idx is not None and mat_idx < len(materials) else 'None'
            if pos_acc_idx is not None:
                acc = accessors[pos_acc_idx]
                count = acc.get('count')
                min_val = acc.get('min')
                max_val = acc.get('max')
                print(f"  Primitive {p_idx}: Material='{mat_name}', Vertices={count}, BoundingBox: Min={min_val}, Max={max_val}")

    print("\nNode Hierarchy:")
    for n_idx, node in enumerate(nodes):
        name = node.get('name')
        mesh_idx = node.get('mesh')
        children = node.get('children', [])
        trans = node.get('translation')
        rot = node.get('rotation')
        scale = node.get('scale')
        matrix = node.get('matrix')
        print(f"  Node [{n_idx}] '{name}': Mesh={mesh_idx}, Children={children}, T={trans}, R={rot}, S={scale}")

inspect_glb('web/public/anatomical_heart_-_codominance.glb')
inspect_glb('web/public/heart0088_coronary_arteries.glb')
