import struct, json

with open('web/public/anatomical_heart_-_codominance.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len).decode('utf-8'))

for i, m in enumerate(data.get('materials', [])):
    pbr = m.get('pbrMetallicRoughness', {})
    name = m.get('name')
    bcf = pbr.get('baseColorFactor')
    bct = pbr.get('baseColorTexture')
    nt = m.get('normalTexture')
    print(f"Material {i}: '{name}', baseColorFactor={bcf}, hasTexture={bct is not None}, hasNormal={nt is not None}")
