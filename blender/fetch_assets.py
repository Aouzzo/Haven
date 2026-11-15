"""Download the CC0 Poly Haven assets used by build_scene.py into blender/assets/ (git-ignored).
Run: python blender/fetch_assets.py
Poly Haven assets are CC0 (https://polyhaven.com/license). Credit: "Assets from Poly Haven".
"""
import json, os, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
UA = {'User-Agent': 'haven-hackathon-site/1.0'}
TEXTURES = {  # name -> resolution
    'painted_plaster_wall': '1k', 'grey_roof_tiles_02': '1k', 'wood_floor': '1k', 'laminate_floor_02': '1k',
    'rustic_stone_wall_02': '1k', 'leafy_grass': '1k', 'precast_stone_paving': '1k', 'brown_planks_03': '1k',
    'fabric_pattern_07': '1k', 'concrete_floor_02': '1k',
}
MODELS = {'tree_small_02': '1k', 'shrub_01': '1k', 'shrub_04': '1k', 'potted_plant_02': '1k',
          'modern_arm_chair_01': '1k', 'painted_wooden_nightstand': '1k'}
HDRI = 'kloppenheim_06_puresky'


def get(url, dest):
    if os.path.exists(dest):
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(dest + '.part', 'wb') as f:
        f.write(r.read())
    os.replace(dest + '.part', dest)
    print('got', os.path.relpath(dest, ROOT))


def files(asset):
    return json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.polyhaven.com/files/{asset}', headers=UA)))


for name, res in TEXTURES.items():
    f = files(name)
    maps = {'Diffuse': 'diff', 'nor_gl': 'nor', 'Rough': 'rough'}
    for key, short in maps.items():
        entry = f.get(key, {}).get(res, {})
        fmt = 'jpg' if 'jpg' in entry else 'png' if 'png' in entry else None
        if fmt:
            get(entry[fmt]['url'], os.path.join(ROOT, 'textures', name, f'{short}.{fmt}'))

for name, res in MODELS.items():
    g = files(name)['gltf'][res]['gltf']
    base = os.path.join(ROOT, 'models', name)
    get(g['url'], os.path.join(base, os.path.basename(g['url'])))
    for rel, inc in g.get('include', {}).items():
        get(inc['url'], os.path.join(base, rel))

h = files(HDRI)
get(h['hdri']['4k']['hdr']['url'], os.path.join(ROOT, 'hdri', f'{HDRI}_4k.hdr'))
get(h['hdri']['1k']['hdr']['url'], os.path.join(ROOT, 'hdri', f'{HDRI}_1k.hdr'))
get(h['tonemapped']['url'], os.path.join(ROOT, 'hdri', f'{HDRI}_tonemapped.jpg'))
print('done')
