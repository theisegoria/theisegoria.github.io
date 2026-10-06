# An original exterior model of a Coda W-class bookshelf speaker, built for the
# page from the public record only: the published size (285 x 168 x 268 mm,
# H x W x D), the 130 mm Uni-Q array on the front baffle, the rear bass port
# and recessed connection panel, the touch controls on the top, and product
# photographs for proportions. Nothing is taken from KEF's own product mesh or
# textures; no logos, wordmarks or printed text; the cabinet wrap is a plain
# woven fabric rather than the product's own ribbed pattern; the connectors
# are generic cut-outs and the phase plug a generic finned flare.
#
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python build_coda.py
# writes ../assets/coda.glb (Draco). Units: mm while building, metres in the GLB.
# Blender -Y is the front (glTF +Z), Z up (glTF +Y).
import bpy, bmesh, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'coda.glb')
H, W, D = 285.0, 168.0, 268.0          # published cabinet size
R_EDGE = 7.0                            # edge radius (photographs: small, even rounding)
DRV_Z = 140.0                           # driver centre above the base
PORT_Z = 222.0                          # rear port centre

for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)

def mat(name, rgb, metal=0.0, rough=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    return m
MATS = {
    'cabinet_fabric': mat('cabinet_fabric', (0.035, 0.05, 0.085), 0, 0.85),
    'baffle_trim':    mat('baffle_trim', (0.02, 0.022, 0.026), 0, 0.55),
    'trim_ring':      mat('trim_ring', (0.03, 0.032, 0.036), 0.2, 0.38),
    'surround_rubber': mat('surround_rubber', (0.018, 0.018, 0.02), 0, 0.7),
    'cone_metal':     mat('cone_metal', (0.16, 0.165, 0.175), 1, 0.42),
    'dome_metal':     mat('dome_metal', (0.55, 0.56, 0.58), 1, 0.3),
    'plug_plastic':   mat('plug_plastic', (0.04, 0.04, 0.045), 0, 0.45),
    'port_plastic':   mat('port_plastic', (0.02, 0.02, 0.022), 0, 0.6),
    'panel_plastic':  mat('panel_plastic', (0.03, 0.031, 0.034), 0, 0.5),
    'connector_metal': mat('connector_metal', (0.75, 0.74, 0.7), 1, 0.25),
    'connector_dark': mat('connector_dark', (0.01, 0.01, 0.012), 0, 0.6),
    'rca_red':        mat('rca_red', (0.45, 0.04, 0.04), 0, 0.4),
    'rca_white':      mat('rca_white', (0.8, 0.8, 0.78), 0, 0.4),
    'touch_gloss':    mat('touch_gloss', (0.015, 0.016, 0.02), 0, 0.12),
    'led':            mat('led', (0.9, 0.95, 1.0), 0, 0.3),
    'foot_rubber':    mat('foot_rubber', (0.02, 0.02, 0.02), 0, 0.9),
}
root = bpy.data.objects.new('coda', None); bpy.context.collection.objects.link(root)

def link(ob, m):
    ob.data.materials.clear(); ob.data.materials.append(MATS[m]); ob.parent = root
    return ob

def smooth(ob, angle=35):
    # smooth shading with hard edges past `angle`, so flat panels stay flat and bevels stay round
    for p in ob.data.polygons: p.use_smooth = True
    ob.data.set_sharp_from_angle(angle=math.radians(angle))

def apply_mods(ob):
    bpy.context.view_layer.objects.active = ob
    for md in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)

def lathe(name, prof, m, cx=0.0, cz=DRV_Z, y0=0.0, n=96, cap=False):
    """Revolve a (r, depth) profile about the driver axis (the Y axis, front at -Y). depth > 0 goes into the cabinet."""
    bm = bmesh.new()
    rings = []
    for i in range(n):
        a = 2 * math.pi * i / n; ca, sa = math.cos(a), math.sin(a)
        rings.append([bm.verts.new((cx + r * ca, y0 + d, cz + r * sa)) for r, d in prof])
    for i in range(n):
        A, B = rings[i], rings[(i + 1) % n]
        for j in range(len(prof) - 1):
            bm.faces.new((A[j], A[j + 1], B[j + 1], B[j]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    link(ob, m); smooth(ob, 40)
    return ob

def rbox(name, w, d, h, r, m, loc, seg=4):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.active_object; ob.name = name; ob.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    if r > 0:
        bv = ob.modifiers.new('bevel', 'BEVEL'); bv.width = r; bv.segments = seg; bv.limit_method = 'ANGLE'
        apply_mods(ob)
    link(ob, m); smooth(ob, 40)
    return ob

def cyl(name, r, depth, m, loc, rot=(math.pi / 2, 0, 0), n=48, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=n, location=loc, rotation=rot)
    ob = bpy.context.active_object; ob.name = name
    if bevel:
        bv = ob.modifiers.new('bevel', 'BEVEL'); bv.width = bevel; bv.segments = 3; bv.limit_method = 'ANGLE'
        apply_mods(ob)
    link(ob, m); smooth(ob, 40)
    return ob

def boolean(target, cutter):
    md = target.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = cutter; md.solver = 'EXACT'
    apply_mods(target); bpy.data.objects.remove(cutter, do_unlink=True)

# ---------------------------------------------------------------- cabinet
cab = rbox('cabinet', W, D, H, R_EDGE, 'cabinet_fabric', (0, 0, H / 2), seg=6)
# driver opening: a shallow round recess the trim ring sits in
cut = cyl('c1', 76.5, 60, 'baffle_trim', (0, -D / 2, DRV_Z), n=128); boolean(cab, cut)
# rear: port mouth and a recessed connection panel
cut = cyl('c2', 30.0, 30, 'baffle_trim', (0, D / 2, PORT_Z), n=96); boolean(cab, cut)
cut = rbox('c3', 128, 12, 104, 6, 'baffle_trim', (0, D / 2, 92)); boolean(cab, cut)
smooth(cab, 40)

# ---------------------------------------------------------------- Uni-Q array (front face at y = -D/2)
F = -D / 2
# trim ring: a broad flat ring with a rolled outer lip, stepping down to the surround
lathe('trim_ring', [(76.0, 9.6), (76.6, 2.0), (76.0, 0.2), (74.6, -0.9), (72.6, -1.2), (68.0, -0.7), (66.6, 0.3), (66.0, 2.2)], 'trim_ring', y0=F)
# Z-flex style surround: a shallow fold below the line of the cone
lathe('surround', [(66.0, 2.2), (65.0, 3.4), (63.0, 4.6), (61.0, 4.0), (59.6, 2.8), (58.4, 3.2)], 'surround_rubber', y0=F)
# cone: shallow, slightly concave flare to the neck
prof = []
for i in range(13):
    t = i / 12; r = 58.4 - t * (58.4 - 17.5); d = 3.2 + 15.0 * (t ** 1.25)
    prof.append((r, d))
lathe('cone', prof, 'cone_metal', y0=F)
# tweeter: support ring, dome, and a generic finned phase plug over it
lathe('tweeter_ring', [(17.5, 18.2), (15.6, 16.8), (13.6, 17.4)], 'plug_plastic', y0=F)
dp = []
for i in range(9):
    a = (i / 8) * math.radians(62); dp.append((14.6 * math.sin(a) / math.sin(math.radians(62)), 18.0 - 6.6 * (math.cos(a) - math.cos(math.radians(62))) / (1 - math.cos(math.radians(62)))))
dp[0] = (0.0, dp[0][1])
lathe('dome', [(r, d) for r, d in reversed(dp)], 'dome_metal', y0=F, n=64)
lathe('plug_hub', [(0.0, 9.6), (2.6, 9.7), (3.6, 10.6), (4.2, 12.4)], 'plug_plastic', y0=F, n=48)
for k in range(8):
    a = 2 * math.pi * k / 8 + math.pi / 8
    fin = rbox('fin', 1.1, 6.0, 10.2, 0.45, 'plug_plastic', (0, 0, 0), seg=2)
    fin.location = (math.cos(a) * 9.2, F + 11.0, DRV_Z + math.sin(a) * 9.2); fin.rotation_euler = (0, math.pi / 2 - a, 0)
    bpy.context.view_layer.objects.active = fin; bpy.ops.object.transform_apply(location=True, rotation=True)
# status LED: a pinhole under the driver
cyl('led', 1.0, 1.2, 'led', (0, F + 0.3, DRV_Z - 84), n=16)

# ---------------------------------------------------------------- top: touch controls (flush gloss strip, generic marks)
TZ = H
rbox('touch_panel', 74, 22, 0.8, 0.35, 'touch_gloss', (0, -D / 2 + 36, TZ + 0.05), seg=2)
for k, x in enumerate([-27, -13.5, 0, 13.5, 27]):
    cyl('touch_mark', 1.4 if k != 2 else 2.2, 0.3, 'led', (x, -D / 2 + 36, TZ + 0.5), rot=(0, 0, 0), n=20)

# ---------------------------------------------------------------- rear: port and connection panel
B = D / 2
lathe('port', [(36.0, 0.0), (35.6, 1.0), (33.0, 1.6), (30.2, 0.6), (29.6, -2.5), (29.0, -40.0)], 'port_plastic', cz=PORT_Z, y0=B, n=96)
# the port tube's walls face inward when the profile runs outward to in from the rear; flip so normals face out of the solid
port = bpy.data.objects['port']
lathe('port_back', [(29.0, -40.0), (0.0, -40.0)], 'connector_dark', cz=PORT_Z, y0=B, n=48)
panel = rbox('rear_panel', 124, 4, 100, 5, 'panel_plastic', (0, B - 4.2, 92))
# generic connectors (no printing): RCA pairs, HDMI, optical, USB-C x2, subwoofer RCA, mains inlet, pairing button
PY = B - 2.2   # the panel's face
def rca(x, z, ring):
    cyl('rca_shell', 4.4, 6, 'connector_metal', (x, PY + 2.0, z), n=32, bevel=0.4)
    cyl('rca_ring', 5.6, 1.2, ring, (x, PY + 0.3, z), n=32, bevel=0.3)
    cyl('rca_pin', 1.4, 7, 'connector_dark', (x, PY + 2.2, z), n=12)
rca(30, 116, 'rca_red'); rca(44, 116, 'rca_white'); rca(30, 98, 'rca_red'); rca(44, 98, 'rca_white'); rca(-44, 98, 'connector_dark')
rbox('hdmi', 15.5, 5, 6.2, 1.2, 'connector_dark', (-40, PY - 1.3, 116))
rbox('optical', 9.5, 5, 8.5, 1.2, 'connector_dark', (-20, PY - 1.3, 116))
rbox('optical_door', 7.0, 1.0, 6.0, 0.8, 'panel_plastic', (-20, PY + 1.3, 116))
rbox('usbc', 9.0, 5, 3.4, 1.6, 'connector_dark', (-2, PY - 1.3, 116))
rbox('usbc_2', 9.0, 5, 3.4, 1.6, 'connector_dark', (12, PY - 1.3, 116))
rbox('speaker_link', 12, 5, 9, 2.0, 'connector_dark', (-18, PY - 1.3, 98))
cyl('ground_post', 3.4, 6, 'connector_metal', (8, PY + 1.5, 98), n=24, bevel=0.4)
rbox('iec_inlet', 24, 6, 18, 2.6, 'connector_dark', (0, PY - 1.8, 64))
cyl('pair_button', 3.0, 2.0, 'panel_plastic', (-44, PY + 0.6, 64), n=24, bevel=0.5)

# ---------------------------------------------------------------- feet
for x in (-W / 2 + 20, W / 2 - 20):
    for y in (-D / 2 + 22, D / 2 - 22):
        cyl('foot', 8.0, 2.0, 'foot_rubber', (x, y, -0.8), rot=(0, 0, 0), n=32, bevel=0.6)

# ---------------------------------------------------------------- join by material, scale to metres, export
bpy.ops.object.select_all(action='DESELECT')
objs = [o for o in bpy.data.objects if o.type == 'MESH']
by = {}
for o in objs: by.setdefault(o.data.materials[0].name, []).append(o)
for name, group in by.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in group: o.select_set(True)
    bpy.context.view_layer.objects.active = group[0]
    if len(group) > 1: bpy.ops.object.join()
    ob = bpy.context.active_object; ob.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # outward normals everywhere (the lathed profiles are not all wound the same way)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
root.scale = (0.001, 0.001, 0.001)
for o in bpy.data.objects:
    if o.type == 'MESH': o.parent = root
bpy.ops.object.select_all(action='SELECT')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=False, export_apply=True, export_yup=True,
                          export_materials='EXPORT', export_normals=True, export_texcoords=True,
                          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                          export_draco_position_quantization=16, export_draco_normal_quantization=12)
print('WROTE', OUT, os.path.getsize(OUT))
