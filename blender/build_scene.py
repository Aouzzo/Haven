"""Haven photoreal scene: build in Blender, bake lighting with Cycles, export for the web.

Run headless (Blender 4.2+):
  blender -b -P blender/build_scene.py -- [--samples 512] [--preview-only] [--no-preview]

What it does
  1. Builds the same care wing as safer/public/cinematic/scene3d.js (same coordinates, metres)
     with CC0 Poly Haven textures, models and a dusk sky (run fetch_assets.py first).
  2. Bakes Cycles lighting (direct + indirect, no albedo) into one lightmap per group:
     base, walls, roof, furniture, ground. The web multiplies these with the tiled textures.
  3. Exports each group as GLB (UV0 = texture, UV1 = lightmap) plus trees/shrubs,
     and a path-traced hero still used as the loading poster.
Outputs go to safer/public/assets/photo/ (served by the site) and blender/out/ (scratch).

Coordinates: helpers take three.js coordinates (Y up). Blender is Z up: blender = (x, -z, y).
"""
import bpy, bmesh, math, os, sys, json
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, 'assets')
OUT = os.path.join(HERE, '..', 'safer', 'public', 'assets', 'photo')
SCRATCH = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
os.makedirs(SCRATCH, exist_ok=True)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default
SAMPLES = arg('--samples', 512)
PREVIEW_ONLY = '--preview-only' in argv
NO_PREVIEW = '--no-preview' in argv
LM_SCALE = 2.0   # lightmap stores value / LM_SCALE (sRGB) so values up to 2.0 survive in 8 bits

# Same layout as scene3d.js
FLOOR, WALL_H, T = .3, 2.5, .16
X0, X1, ZN, ZS, CN, CS = -6.6, 6.6, -5.2, 5.2, -1, 1
ROOMS = [(101, -4.4, -3.1), (102, 0, -3.1), (103, 4.4, -3.1), (104, -4.4, 3.1), (105, 0, 3.1), (106, 4.4, 3.1)]
SUN_TARGET_THREE = Vector((-0.45, 0, 0.9)).normalized()   # where we want the low sun (three.js xz direction)

# ---------------------------------------------------------------- setup
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
coll = scene.collection
scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.max_bounces = 6
scene.unit_settings.system = 'METRIC'


def setup_gpu():
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            if any(d.type == kind for d in prefs.devices):
                for d in prefs.devices:
                    d.use = d.type == kind
                scene.cycles.device = 'GPU'
                print('Cycles device:', kind)
                return
        except Exception:
            pass
    print('Cycles device: CPU')
setup_gpu()


def B(x, y, z):
    return Vector((x, -z, y))


# ---------------------------------------------------------------- sky (rolled so the sun sits where we want it)
HDRI = 'kloppenheim_06_puresky'

def load_rolled_hdr(path, name):
    img = bpy.data.images.load(path)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    lum = px[h // 2:, :, :3].mean(axis=2)          # top half (row 0 = bottom)
    r, c = np.unravel_index(np.argmax(lum), lum.shape)
    u0, v0 = (c + .5) / w, (r + h // 2 + .5) / h
    target = Vector((SUN_TARGET_THREE.x, 0, SUN_TARGET_THREE.z))
    bt = Vector((target.x, -target.z, 0))           # blender xy
    u_t = -math.atan2(bt.y, bt.x) / (2 * math.pi) + .5
    shift = int(round((u_t - u0) * w))
    px = np.roll(px, shift, axis=1)
    out = bpy.data.images.new(name, w, h, float_buffer=True)
    out.pixels.foreach_set(px.ravel())
    elev = (v0 - .5) * math.pi
    return out, shift / w, elev

hdr, roll_frac, sun_elev = load_rolled_hdr(os.path.join(A, 'hdri', f'{HDRI}_4k.hdr'), 'sky')
az_t = math.atan2(SUN_TARGET_THREE.z, SUN_TARGET_THREE.x)
sun_three = Vector((math.cos(sun_elev) * math.cos(az_t), math.sin(sun_elev), math.cos(sun_elev) * math.sin(az_t)))
print('sky sun elevation deg', math.degrees(sun_elev), 'roll', roll_frac)
# A golden sun lamp in the same direction as the sky's sun, a little higher for longer, crisper shadows.
SUN_ELEV = math.radians(13)
sun_three = Vector((math.cos(SUN_ELEV) * math.cos(az_t), math.sin(SUN_ELEV), math.cos(SUN_ELEV) * math.sin(az_t)))
sl = bpy.data.lights.new('sun', 'SUN'); sl.energy = 5.0; sl.color = (1.0, .64, .38); sl.angle = math.radians(.8)
so = bpy.data.objects.new('sun', sl); coll.objects.link(so)
so.rotation_euler = (-B(*sun_three)).to_track_quat('-Z', 'Y').to_euler()

world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wn.clear()
env = wn.new('ShaderNodeTexEnvironment'); env.image = hdr
bg = wn.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 0.75
wo = wn.new('ShaderNodeOutputWorld')
world.node_tree.links.new(env.outputs['Color'], bg.inputs['Color'])
world.node_tree.links.new(bg.outputs['Background'], wo.inputs['Surface'])

# Write rolled sky images for the web (1k HDR for lighting, tonemapped JPG for the background).
def save_rolled(src, dst, fmt):
    img = bpy.data.images.load(src)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = np.roll(px.reshape(h, w, 4), int(round(roll_frac * w)), axis=1)
    out = bpy.data.images.new(os.path.basename(dst), w, h, float_buffer=(fmt == 'HDR'))
    out.pixels.foreach_set(px.ravel())
    out.filepath_raw = dst
    out.file_format = fmt
    if fmt == 'JPEG':
        scene.render.image_settings.quality = 88
    out.save()
save_rolled(os.path.join(A, 'hdri', f'{HDRI}_1k.hdr'), os.path.join(OUT, 'sky_1k.hdr'), 'HDR')

def save_sky_jpg(dst, w=4096):
    # Linear HDR -> sRGB JPG (clipped, no tone curve). The browser applies the same tone mapping as the scene.
    sw, sh = hdr.size
    px = np.empty(sw * sh * 4, dtype=np.float32)
    hdr.pixels.foreach_get(px)
    px = px.reshape(sh, sw, 4)
    step = max(1, sw // w)
    px = px[::step, ::step]
    rgb = np.clip(px[..., :3], 0, 1)
    rgb = np.where(rgb <= .0031308, 12.92 * rgb, 1.055 * np.power(rgb, 1 / 2.4) - .055)
    h2, w2 = rgb.shape[:2]
    img = bpy.data.images.new('skyjpg', w2, h2, float_buffer=False)
    img.colorspace_settings.name = 'Non-Color'
    img.pixels.foreach_set(np.concatenate([rgb, np.ones((h2, w2, 1), np.float32)], axis=2).astype(np.float32).ravel())
    img.filepath_raw = dst
    img.file_format = 'JPEG'
    img.save()
save_sky_jpg(os.path.join(OUT, 'sky.jpg'))

# ---------------------------------------------------------------- materials
def tex_path(name, kind='diff'):
    d = os.path.join(A, 'textures', name)
    for ext in ('jpg', 'png'):
        p = os.path.join(d, f'{kind}.{ext}')
        if os.path.exists(p):
            return p
    return None

def tint_texture(src_name, dst_name, mul):
    src = tex_path(src_name)
    d = os.path.join(A, 'textures', dst_name)
    os.makedirs(d, exist_ok=True)
    img = bpy.data.images.load(src)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    px[..., :3] = np.clip(px[..., :3] * np.array(mul, np.float32), 0, 1)
    out = bpy.data.images.new(dst_name, w, h); out.pixels.foreach_set(px.ravel())
    out.filepath_raw = os.path.join(d, 'diff.jpg'); out.file_format = 'JPEG'; out.save()
tint_texture('leafy_grass', 'grass_tinted', (0.9, 1.0, 0.7))

MATS = {}
def mat(name, tex=None, color=(.8, .8, .8), rough=.8, uvscale=1.0, emit=None, emit_strength=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = rough
    if tex:
        uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'tex'
        it = nt.nodes.new('ShaderNodeTexImage')
        it.image = bpy.data.images.load(tex_path(tex), check_existing=True)
        nt.links.new(uv.outputs['UV'], it.inputs['Vector'])
        nt.links.new(it.outputs['Color'], p.inputs['Base Color'])
    else:
        p.inputs['Base Color'].default_value = (*color, 1)
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = emit_strength
    m['uvscale'] = uvscale
    MATS[name] = m
    return m

M = dict(
    plaster=mat('plaster', 'painted_plaster_wall', uvscale=2.0),
    trim=mat('trim', 'brown_planks_03', uvscale=1.2),
    stone=mat('stone', 'rustic_stone_wall_02', uvscale=1.6),
    roof=mat('roof', 'grey_roof_tiles_02', uvscale=1.6, rough=.7),
    wood=mat('wood_floor', 'wood_floor', uvscale=1.8),
    corridor=mat('corridor', 'laminate_floor_02', uvscale=1.8),
    grass=mat('grass', 'grass_tinted', uvscale=2.5),
    paving=mat('paving', 'precast_stone_paving', uvscale=1.2),
    concrete=mat('concrete', 'concrete_floor_02', uvscale=2.0),
    rug=mat('rug', None, color=(.70, .58, .45)),
    glass=mat('glass', None, color=(.9, .8, .6), rough=.1, emit=(1.0, .72, .42), emit_strength=2.2),
    shade=mat('lampshade', None, color=(1, .95, .85), emit=(1.0, .78, .5), emit_strength=6.0),
    frame=mat('bedframe', None, color=(.42, .29, .19), rough=.6),
    pillow=mat('pillow', None, color=(.93, .91, .87)),
    soil=mat('soil', None, color=(.16, .11, .08), rough=1),
    metal=mat('metal', None, color=(.25, .25, .26), rough=.4),
)
BLANKETS = [mat(f'blanket{i}', None, color=c) for i, c in enumerate([(.55, .62, .52), (.75, .64, .48), (.5, .58, .68), (.7, .52, .48), (.6, .64, .5), (.74, .7, .6)])]

# ---------------------------------------------------------------- geometry helpers
def new_obj(name, bm, material, grp):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    o.data.materials.append(material)
    o['grp'] = grp
    return o

def box(name, w, h, d, x, y, z, material, grp, bevel=0.0, rx=0.0, ry=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    o = new_obj(name, bm, material, grp)
    o.scale = (w, d, h)
    o.rotation_euler = (rx, 0, ry)
    o.location = B(x, y, z)
    if bevel:
        mod = o.modifiers.new('bevel', 'BEVEL'); mod.width = bevel; mod.segments = 2; mod.limit_method = 'ANGLE'
    return o

def cyl(name, r, h, x, y, z, material, grp, seg=24, axis='y', r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    o = new_obj(name, bm, material, grp)
    if axis == 'x':
        o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == 'z':
        o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = B(x, y, z)
    return o

INSTANCES = {}
MODEL_CACHE = {}
def import_model(name, grp, x, y, z, rot_y=0.0, scale=1.0):
    if grp in ('plants', 'trees'):
        INSTANCES.setdefault(name, []).append([x, y, z, rot_y, scale])
    d = os.path.join(A, 'models', name)
    if name in MODEL_CACHE and grp in ('plants', 'trees'):
        objs = []
        for src in MODEL_CACHE[name]:
            c = src.copy()          # linked duplicate: shares mesh data
            coll.objects.link(c)
            objs.append(c)
        for c in objs:
            c.parent = None
    else:
        gltf = [f for f in os.listdir(d) if f.endswith('.gltf')][0]
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(d, gltf))
        objs = [o for o in bpy.data.objects if o not in before]
        if grp in ('plants', 'trees'):
            MODEL_CACHE[name] = [o for o in objs if o.type == 'MESH']
            print('model', name, 'tris', sum(len(o.data.polygons) for o in objs if o.type == 'MESH'))
            objs = MODEL_CACHE[name]
            for o in objs:
                o.parent = None
    root = bpy.data.objects.new(f'{name}_root', None)
    coll.objects.link(root)
    for o in objs:
        if o.parent is None:
            o.parent = root
        if o.type == 'MESH':
            o['grp'] = grp
            if o.data.uv_layers:
                o.data.uv_layers[0].name = 'tex'
            for slot in o.material_slots:
                if slot.material:
                    slot.material['uvscale'] = 0   # keep the model's own UVs
    if grp == 'furniture':
        for o in objs:
            if o.type == 'MESH' and len(o.data.polygons) > 3000:
                d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = .22
    root.location = B(x, y, z)
    root.rotation_euler = (0, 0, rot_y)
    root.scale = (scale, scale, scale)
    return objs

# ---------------------------------------------------------------- building
box('plinth', 14, FLOOR, 10.9, 0, FLOOR / 2, 0, M['stone'], 'base')
for i, (n, x, z) in enumerate(ROOMS):
    box(f'floor{n}', 4.4 - T, .04, 4.2 - T, x, FLOOR + .02, z, M['wood'], 'base')
box('corridor', 13.2, .04, 2, 0, FLOOR + .02, 0, M['corridor'], 'base')

def wall(axis, fixed, a0, a1, holes=(), material=None):
    material = material or M['plaster']
    def seg(a, b, y0, y1, m=material, th=T, grp='walls', name='wall'):
        L, h, c, y = b - a, y1 - y0, (a + b) / 2, FLOOR + (y0 + y1) / 2
        if axis == 'x':
            return box(name, L, h, th, c, y, fixed, m, grp)
        return box(name, th, h, L, fixed, y, c, m, grp)
    cur = a0
    for hole in sorted(holes, key=lambda h: h['c']):
        a, b = hole['c'] - hole['w'] / 2, hole['c'] + hole['w'] / 2
        if a > cur:
            seg(cur, a, 0, WALL_H)
        if hole['y0'] > 0:
            seg(a, b, 0, hole['y0'])
            g = seg(a, b, hole['y0'], hole['y1'], M['glass'], .03, name='glass')
            g.visible_shadow = False
            # frame, mullion and sill
            ft = .07
            seg(a - ft, a, hole['y0'], hole['y1'], M['trim'], T + .05, name='frame')
            seg(b, b + ft, hole['y0'], hole['y1'], M['trim'], T + .05, name='frame')
            seg(a - ft, b + ft, hole['y1'], hole['y1'] + ft, M['trim'], T + .05, name='frame')
            seg((a + b) / 2 - .025, (a + b) / 2 + .025, hole['y0'], hole['y1'], M['trim'], .06, name='mullion')
            seg(a - .12, b + .12, hole['y0'] - .07, hole['y0'], M['stone'], T + .14, name='sill')
        else:
            seg(a - .06, a, 0, hole['y1'], M['trim'], T + .04, name='doorframe')
            seg(b, b + .06, 0, hole['y1'], M['trim'], T + .04, name='doorframe')
            seg(a - .06, b + .06, hole['y1'], hole['y1'] + .08, M['trim'], T + .04, name='doorframe')
        seg(a, b, hole['y1'], WALL_H)
        cur = b
    if a1 > cur:
        seg(cur, a1, 0, WALL_H)

win = lambda c, w=1.7: dict(c=c, w=w, y0=.8, y1=2.0)
door = lambda c, w=.95: dict(c=c, w=w, y0=0, y1=2.1)
south = [r for r in ROOMS if r[2] > 0]; north = [r for r in ROOMS if r[2] < 0]
wall('x', ZS, X0 - T / 2, X1 + T / 2, [win(r[1]) for r in south])
wall('x', ZN, X0 - T / 2, X1 + T / 2, [win(r[1]) for r in north])
wall('z', X0, ZN, ZS, [win(3.1, 1.4), win(-3.1, 1.4)])
wall('z', X1, ZN, ZS, [win(3.1, 1.4), win(-3.1, 1.4), door(0, 1.4)])
wall('x', CN, X0, X1, [door(r[1]) for r in north])
wall('x', CS, X0, X1, [door(r[1]) for r in south])
for x in (-2.2, 2.2):
    wall('z', x, ZN, CN); wall('z', x, CS, ZS)
for x, z in ((X0, ZN), (X0, ZS), (X1, ZN), (X1, ZS)):
    box('post', .3, WALL_H, .3, x, FLOOR + WALL_H / 2, z, M['trim'], 'walls', bevel=.02)
for z, s in ((ZS + .03, 1), (ZN - .03, -1)):
    box('stoneband', 13.5, .5, .26, 0, FLOOR + .25, z, M['stone'], 'walls', bevel=.03)
for x in (X0 - .03, X1 + .03):
    box('stoneband', .26, .5, 10.7, x, FLOOR + .25, 0, M['stone'], 'walls', bevel=.03)

# Porch (east entrance)
box('porchdeck', 2.2, .12, 3.0, X1 + 1.1, FLOOR - .06, 0, M['paving'], 'base')
box('porchroof', 1.9, .14, 2.8, X1 + .95, FLOOR + 2.32, 0, M['roof'], 'base', bevel=.02)
box('porchbeam', .18, .2, 2.7, X1 + 1.75, FLOOR + 2.2, 0, M['trim'], 'base', bevel=.015)
for z in (-1.2, 1.2):
    box('porchpost', .16, 2.3, .16, X1 + 1.75, FLOOR + 1.1, z, M['trim'], 'base', bevel=.015)
for z in (-.95, .95):
    box('lantern', .14, .24, .14, X1 + .14, FLOOR + 1.65, z, M['glass'], 'base')
    lp = bpy.data.lights.new('lantern', 'POINT'); lp.energy = 25; lp.color = (1, .72, .45); lp.shadow_soft_size = .05
    lo = bpy.data.objects.new('lantern_light', lp); coll.objects.link(lo); lo.location = B(X1 + .3, FLOOR + 1.65, z)

# Roof
RB = FLOOR + WALL_H
bm = bmesh.new()
verts = [bm.verts.new(B(sx * 6.7, RB + yy, zz)) for sx in (-1, 1) for (zz, yy) in ((-5.5, 0), (5.5, 0), (0, 2.2))]
bm.faces.new((verts[0], verts[1], verts[2]))
bm.faces.new((verts[5], verts[4], verts[3]))
bm.faces.new((verts[0], verts[3], verts[4], verts[1]))
bm.faces.new((verts[1], verts[4], verts[5], verts[2]))
bm.faces.new((verts[2], verts[5], verts[3], verts[0]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
prism = new_obj('roofprism', bm, M['plaster'], 'roof')
slope = math.atan2(2.2, 5.5)
for s in (1, -1):
    box('roofpanel', 14.2, .16, 6.55, 0, RB + 1.2, s * 3, M['roof'], 'roof', rx=s * slope)
box('ridge', 14.4, .16, .24, 0, RB + 2.3, 0, M['trim'], 'roof', bevel=.02)
box('chimney', .7, 1.6, .7, 3, RB + 2.05, -1.5, M['stone'], 'roof', bevel=.02)
box('chimneycap', .85, .1, .85, 3, RB + 2.9, -1.5, M['concrete'], 'roof')
for s in (1, -1):
    box('fascia', 14.3, .24, .05, 0, RB - .08, s * 6.08, M['trim'], 'roof')
    cyl('gutter', .065, 14.3, 0, RB - .14, s * 6.16, M['metal'], 'roof', axis='x', seg=12)

# ---------------------------------------------------------------- furniture
for i, (n, rx, rz) in enumerate(ROOMS):
    s = 1 if rz > 0 else -1
    X = lambda lx: rx + lx
    Z = lambda lz: rz + lz * s
    g = 'furniture'
    box('bedframe', 1.25, .3, 2.0, X(-1.2), FLOOR + .19, Z(.05), M['frame'], g, bevel=.02)
    box('mattress', 1.15, .16, 1.9, X(-1.2), FLOOR + .42, Z(.08), M['pillow'], g, bevel=.04)
    box('blanket', 1.2, .08, 1.35, X(-1.2), FLOOR + .52, Z(.35), BLANKETS[i], g, bevel=.035)
    box('pillow', .9, .13, .36, X(-1.2), FLOOR + .56, Z(-.68), M['pillow'], g, bevel=.06)
    box('headboard', 1.3, .9, .07, X(-1.2), FLOOR + .5, Z(-1.03), M['frame'], g, bevel=.02)
    rug = cyl('rug', .9, .015, X(.55), FLOOR + .05, Z(.3), M['rug'], g, seg=48)
    rug.scale = (1, .75, 1)
    cyl('lampbase', .06, .3, X(-.25), FLOOR + .74, Z(-1.1), M['metal'], g, seg=16)
    cyl('lampshade', .16, .2, X(-.25), FLOOR + .94, Z(-1.1), M['shade'], g, seg=24, r2=.1)
    import_model('painted_wooden_nightstand', g, X(-.25), FLOOR + .04, Z(-1.1), rot_y=0 if s < 0 else math.pi)
    import_model('modern_arm_chair_01', g, X(1.2), FLOOR + .04, Z(1.2), rot_y=(math.pi if s > 0 else 0) + .5)
    import_model('potted_plant_02', g, X(1.6), FLOOR + .04, Z(-1.4))
    # ceiling light and bedside lamp
    al = bpy.data.lights.new(f'ceiling{n}', 'AREA'); al.energy = 55; al.size = 1.2; al.color = (1, .78, .55)
    ao = bpy.data.objects.new(f'ceiling{n}', al); coll.objects.link(ao); ao.location = B(rx, FLOOR + 2.4, rz)
    pl = bpy.data.lights.new(f'lamp{n}', 'POINT'); pl.energy = 18; pl.color = (1, .7, .42); pl.shadow_soft_size = .08
    po = bpy.data.objects.new(f'lamp{n}', pl); coll.objects.link(po); po.location = B(X(-.25), FLOOR + .95, Z(-1.1))
for x in (-4.4, 0, 4.4):
    al = bpy.data.lights.new('hall', 'AREA'); al.energy = 30; al.size = .8; al.color = (1, .8, .6)
    ao = bpy.data.objects.new('hall', al); coll.objects.link(ao); ao.location = B(x, FLOOR + 2.4, 0)

# ---------------------------------------------------------------- landscape
bm = bmesh.new()
bmesh.ops.create_circle(bm, cap_ends=True, segments=128, radius=24)
bmesh.ops.triangulate(bm, faces=bm.faces)
ground = new_obj('ground', bm, M['grass'], 'ground')
bm = bmesh.new()
bmesh.ops.create_circle(bm, cap_ends=True, segments=64, radius=400)
far = new_obj('farground', bm, M['grass'], 'none')
far.location = (0, 0, -.02)
for i in range(16):
    t = i / 15
    x, z = X1 + 1.9 + t * 12, math.sin(t * math.pi * .9) * 3.2 + t * 6
    box('stepstone', 1.4, .06, 1.0, x, .03, z, M['paving'], 'ground', bevel=.02, ry=.35 + t * .4)
for i in range(3):
    x = -4.4 + i * 4.4
    box('planter', 2.9, .3, .75, x, .15, ZS + 1.0, M['stone'], 'ground', bevel=.03)
    box('soil', 2.75, .02, .6, x, .3, ZS + 1.0, M['soil'], 'ground')
    for k in range(3):
        import_model('shrub_04', 'plants', x - .9 + k * .9, .3, ZS + 1.0, rot_y=k * 1.7, scale=1.6)
SHRUBS = [(X1 + 2.3, 1.9), (X1 + 2.3, -1.9), (X0 - 1.1, 4.4), (X0 - 1.1, -3.5), (-2.2, ZN - 1.2), (3.6, ZN - 1.2)]
for k, (x, z) in enumerate(SHRUBS):
    import_model('shrub_04', 'plants', x, 0, z, rot_y=k * 1.1, scale=2.6)
TREES = [(-14, -11), (11, -15), (-21, 4), (21, -5), (-8, -19), (4, -21), (-25, -9), (-18, 15), (25, 8), (-11, 12), (16, -10), (-3, -14), (8, -11), (-17, -3), (28, -14), (-30, 2)]
for k, (x, z) in enumerate(TREES):
    import_model('tree_small_02', 'trees', x, 0, z, rot_y=k * 2.3, scale=1.0 + (k % 3) * .15)
# distant tree line (behind the building from the hero view)
import random
random.seed(4)
for k in range(46):
    a = math.radians(random.uniform(105, 345)); r = random.uniform(38, 70)
    import_model('tree_small_02', 'trees', math.cos(a) * r, 0, math.sin(a) * r, rot_y=random.uniform(0, 6.3), scale=random.uniform(1.1, 1.8))

# ---------------------------------------------------------------- camera (matches the web hero camera)
cam = bpy.data.cameras.new('cam')
cam.sensor_fit = 'VERTICAL'
cam.angle_y = math.radians(36)
co = bpy.data.objects.new('cam', cam); coll.objects.link(co)
scene.camera = co
def look(pos, target):
    co.location = B(*pos)
    d = B(*target) - co.location
    co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
look((15.5, 5, 23.5), (-2.6, 1.5, .5))

bpy.context.view_layer.update()

def world_uvs_obj(o):
    me = o.data
    mats = [m for m in me.materials]
    if not any(m and m.get('uvscale', 0) for m in mats):
        return
    if 'tex' not in me.uv_layers:
        me.uv_layers.new(name='tex')
    mw = o.matrix_world
    nm = mw.to_3x3().inverted().transposed()
    bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv['tex']
    for f in bm.faces:
        m = mats[f.material_index] if f.material_index < len(mats) else None
        sc = m.get('uvscale', 0) if m else 0
        if not sc:
            continue
        n = (nm @ f.normal); ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            p = mw @ l.vert.co
            u, v = ((p.y, p.z), (p.x, p.z), (p.x, p.y))[ax]
            l[uv].uv = (u / sc, v / sc)
    bm.to_mesh(me); bm.free()

for o in scene.objects:
    if o.type == 'MESH':
        world_uvs_obj(o)

# ---------------------------------------------------------------- preview render
def render_preview(path, samples=256, w=1920, h=1080):
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    for vt in ('AgX', 'Filmic', 'Standard'):
        try:
            scene.view_settings.view_transform = vt
            break
        except TypeError:
            pass
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = -.2
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 88
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    scene.cycles.samples = SAMPLES

if not NO_PREVIEW:
    render_preview(os.path.join(OUT, 'hero_poster.jpg'))
if PREVIEW_ONLY:
    sys.exit(0)

# ---------------------------------------------------------------- bake
def select_only(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]

def join_group(grp):
    objs = [o for o in scene.objects if o.type == 'MESH' and o.get('grp') == grp]
    select_only(objs)
    bpy.ops.object.convert(target='MESH')          # applies modifiers, keeps world placement
    for o in bpy.context.selected_objects:
        o.parent = None if o.parent is None else o.parent
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = grp
    for slot in o.material_slots:          # give each group its own material copies
        if slot.material:
            slot.material = slot.material.copy()
            slot.material.name = slot.material.name.split('.')[0] + '@' + grp
    return o

def world_uvs(o):
    me = o.data
    if 'tex' not in me.uv_layers:
        me.uv_layers.new(name='tex')
    bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv['tex']
    for f in bm.faces:
        m = me.materials[f.material_index] if f.material_index < len(me.materials) else None
        sc = m.get('uvscale', 1.0) if m else 1.0
        if not sc:
            continue
        n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            p = l.vert.co
            u, v = ((p.y, p.z), (p.x, p.z), (p.x, p.y))[ax]
            l[uv].uv = (u / sc, v / sc)
    bm.to_mesh(me); bm.free()
    # make sure 'tex' is the first UV map
    names = [l.name for l in me.uv_layers]
    if names[0] != 'tex':
        print('warning: tex is not UV0 on', o.name, names)

def lightmap_uvs(o):
    me = o.data
    lm = me.uv_layers.new(name='lm')
    me.uv_layers.active = lm
    select_only([o])
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.004, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')

def srgb(x):
    return np.where(x <= .0031308, 12.92 * x, 1.055 * np.power(np.maximum(x, 0), 1 / 2.4) - .055)

def bake(o, res, name):
    img = bpy.data.images.new(f'lm_{name}', res, res, float_buffer=True)
    nodes = []
    for slot in o.material_slots:
        m = slot.material
        if not m:
            continue
        nt = m.node_tree
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'lm'
        it = nt.nodes.new('ShaderNodeTexImage'); it.image = img
        nt.links.new(uvn.outputs['UV'], it.inputs['Vector'])
        nt.nodes.active = it
        nodes.append((nt, uvn, it))
    select_only([o])
    o.data.uv_layers.active = o.data.uv_layers['lm']
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=16, use_clear=True)
    for nt, uvn, it in nodes:
        nt.nodes.remove(uvn); nt.nodes.remove(it)
    px = np.empty(res * res * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(res, res, 4)
    rgb = srgb(np.clip(px[..., :3] / LM_SCALE, 0, 1))
    outimg = bpy.data.images.new(f'lm_{name}_8', res, res, float_buffer=False)
    outimg.colorspace_settings.name = 'Non-Color'
    outimg.pixels.foreach_set(np.concatenate([rgb, np.ones((res, res, 1), np.float32)], axis=2).ravel())
    outimg.filepath_raw = os.path.join(OUT, f'lm_{name}.jpg')
    outimg.file_format = 'JPEG'
    scene.render.image_settings.quality = 90
    outimg.save()
    LM_IMAGES[o.name] = outimg
    return float(np.mean(px[..., :3]))

LM_IMAGES = {}
def hook_lightmap(o):
    outimg = LM_IMAGES[o.name]
    # Hook the lightmap into each material's emission through the 'lm' UV so the glTF exporter
    # keeps UV1 (it drops UV maps no material uses). The web uses it as a light map, not emission.
    for slot in o.material_slots:
        m = slot.material
        if not m or m.name.split('@')[0].split('.')[0] in ('glass', 'lampshade'):
            continue
        nt = m.node_tree
        p = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not p:
            continue
        for inp in ('Normal', 'Roughness', 'Metallic'):   # web only uses base colour (+ alpha)
            for l in list(p.inputs[inp].links):
                nt.links.remove(l)
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'lm'
        it = nt.nodes.new('ShaderNodeTexImage'); it.image = outimg
        nt.links.new(uvn.outputs['UV'], it.inputs['Vector'])
        nt.links.new(it.outputs['Color'], p.inputs['Emission Color'])
        p.inputs['Emission Strength'].default_value = 1.0


def export(o, name, materials=True):
    select_only([o])
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f'{name}.glb'), export_format='GLB', use_selection=True,
                              export_apply=True, export_texcoords=True, export_normals=True, export_yup=True,
                              export_materials='EXPORT' if materials else 'NONE', export_image_format='JPEG',
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10,
                              export_draco_texcoord_quantization=12)

scene.cycles.samples = SAMPLES
manifest = {'lmScale': LM_SCALE, 'sun': list(sun_three), 'groups': {}}
for grp, res in (('base', 2048), ('walls', 2048), ('roof', 1024), ('furniture', 2048), ('ground', 2048)):
    o = join_group(grp)
    world_uvs(o)
    lightmap_uvs(o)
    print('baking', grp, len(o.data.polygons), 'faces')
    mean = bake(o, res, grp)
    manifest['groups'][grp] = {'lightmap': f'lm_{grp}.jpg', 'model': f'{grp}.glb', 'mean': mean}
for grp in manifest['groups']:
    o = bpy.data.objects[grp]
    hook_lightmap(o)
    export(o, grp)

# Plants and trees: one copy of each model is exported with its own materials and cloned in the
# browser at the positions below (rendered live, not baked; they still cast baked shadows).
manifest['instances'] = {}
def render_tree_sprite(name, places):
    # Transparent side-view cutout of one tree, used as a camera-facing sprite in the browser.
    for o in scene.objects:
        o.hide_render = True
    objs = [o for o in import_model(name, 'export', 0, 0, 0) if o.type == 'MESH']
    for o in objs:
        o.hide_render = False
    for o in scene.objects:
        if o.type == 'LIGHT' and o.data.type == 'SUN':
            o.hide_render = False
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    xs = [p.x for p in pts]; zs = [p.z for p in pts]
    w = max(max(xs) - min(xs), max(p.y for p in pts) - min(p.y for p in pts)); h = max(zs) - min(zs)
    cam.type = 'ORTHO'; cam.sensor_fit = 'AUTO'
    cam.ortho_scale = max(w, h) * 1.02
    cx = (max(xs) + min(xs)) / 2
    co.location = Vector((cx, -60, min(zs) + h / 2)); co.rotation_euler = (math.pi / 2, 0, 0)
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = 1024
    scene.cycles.samples = 96; scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = os.path.join(OUT, f'{name}_sprite.png')
    bpy.ops.render.render(write_still=True)
    side = max(w, h) * 1.02
    return {'sprite': f'{name}_sprite.png', 'places': places, 'size': side, 'baseOffset': (side - h) / 2 / side}

for name, places in INSTANCES.items():
    if name.startswith('tree'):
        continue
    for o in list(scene.objects):
        o.select_set(False)
    objs = import_model(name, 'export', 0, 0, 0)
    meshes = [o for o in objs if o.type == 'MESH']
    select_only(meshes)
    for o in meshes:
        for slot in o.material_slots:
            m = slot.material
            p = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if m else None
            for inp in (('Normal', 'Roughness', 'Metallic') if p else ()):
                for l in list(p.inputs[inp].links):
                    m.node_tree.links.remove(l)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f'{name}.glb'), export_format='GLB', use_selection=True,
                              export_apply=True, export_image_format='JPEG', export_draco_mesh_compression_enable=True)
    manifest['instances'][name] = {'model': f'{name}.glb', 'places': places,
                                   'tris': sum(len(o.data.polygons) for o in meshes)}

for name, places in INSTANCES.items():
    if name.startswith('tree'):
        manifest['instances'][name] = render_tree_sprite(name, places)

with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=1)
print('DONE', json.dumps(manifest))
