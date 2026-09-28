# Blender mesh helpers shared by the speaker model builders (extracted from the
# automatic-movement builder).  Import with:
#   import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
#   from bl_helpers import *
# Units: the scene is set to millimetres; the exporter writes metres.
import bpy, math, os, json
from mathutils import Vector
TAU = math.tau

def reset_scene():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials): bpy.data.materials.remove(m)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'; sc.unit_settings.length_unit = 'MILLIMETERS'; sc.unit_settings.scale_length = 0.001

# ---------------------------------------------------------------- materials
def mat(name, rgb, metallic=0.0, rough=0.5, emission=None, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1)
        bsdf.inputs['Emission Strength'].default_value = 0.35
    if alpha < 1:
        bsdf.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
    return m


# ---------------------------------------------------------------- mesh helpers
ROOT = None
def make_root(name):
    global ROOT
    ROOT = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(ROOT)
    return ROOT

def new_object(name, verts, faces, material, origin=(0, 0), parent=ROOT, extra=None):
    """verts are absolute (x, y, z); the object's origin is moved to `origin` (x, y, 0)."""
    me = bpy.data.meshes.new(name)
    ox, oy = origin
    me.from_pydata([(x - ox, y - oy, z) for x, y, z in verts], [], faces)
    me.update()
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    ob.location = (ox, oy, 0)
    ob.parent = parent
    bpy.context.collection.objects.link(ob)
    if extra:
        for k, v in extra.items():
            ob[k] = v
    # shade smooth on curved bits is done per face below
    return ob

class Builder:
    """Accumulates verts/faces (with per-face material index) for one object."""
    def __init__(self):
        self.v = []; self.f = []; self.fm = []; self.smooth = []
    def add(self, verts, faces, mi=0, smooth=False):
        base = len(self.v)
        self.v.extend(verts)
        for f in faces:
            self.f.append([i + base for i in f]); self.fm.append(mi); self.smooth.append(smooth)
    def make(self, name, materials, origin=(0, 0), parent=ROOT, extra=None):
        me = bpy.data.meshes.new(name)
        ox, oy = origin
        me.from_pydata([(x - ox, y - oy, z) for x, y, z in self.v], [], self.f)
        for m in materials:
            me.materials.append(m)
        for p, mi, sm in zip(me.polygons, self.fm, self.smooth):
            p.material_index = mi; p.use_smooth = sm
        me.update()
        ob = bpy.data.objects.new(name, me)
        ob.location = (ox, oy, 0)
        ob.parent = parent
        bpy.context.collection.objects.link(ob)
        if extra:
            for k, v in extra.items():
                ob[k] = v
        return ob

def radial_prism(b, cx, cy, R_of, z0, z1, n, rin=0.0, mi=0, smooth=False, phase=0.0):
    """A solid whose outline is r = R(theta) sampled n times, with an optional bore rin.
    Angular sampling means any tooth profile that is a function of angle works."""
    outer = [(cx + R_of(i / n * TAU + phase) * math.cos(i / n * TAU + phase), cy + R_of(i / n * TAU + phase) * math.sin(i / n * TAU + phase)) for i in range(n)]
    verts = []
    for x, y in outer: verts.append((x, y, z1))
    for x, y in outer: verts.append((x, y, z0))
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j, n + i])          # wall
    if rin > 0:
        inner = [(cx + rin * math.cos(i / n * TAU + phase), cy + rin * math.sin(i / n * TAU + phase)) for i in range(n)]
        for x, y in inner: verts.append((x, y, z1))
        for x, y in inner: verts.append((x, y, z0))
        for i in range(n):
            j = (i + 1) % n
            faces.append([2 * n + j, 2 * n + i, i, j])              # top ring
            faces.append([n + i, n + j, 3 * n + j, 3 * n + i])      # bottom ring
            faces.append([3 * n + i, 3 * n + j, 2 * n + j, 2 * n + i])  # bore wall
    else:
        verts.append((cx, cy, z1)); verts.append((cx, cy, z0))
        c1, c0 = 2 * n, 2 * n + 1
        for i in range(n):
            j = (i + 1) % n
            faces.append([c1, i, j]); faces.append([c0, n + j, n + i])
    b.add(verts, faces, mi, smooth)

def cyl(b, cx, cy, r, z0, z1, n=48, rin=0.0, mi=0, smooth=True):
    radial_prism(b, cx, cy, lambda t: r, z0, z1, n, rin, mi, smooth)

def box(b, x0, x1, y0, y1, z0, z1, mi=0):
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]
    b.add(v, f, mi)

def rot_box(b, cx, cy, length, width, ang, z0, z1, mi=0, start=0.0):
    """A bar from cx,cy along angle ang (radians), from `start` to `length`."""
    ca, sa = math.cos(ang), math.sin(ang)
    def pt(u, w): return (cx + ca * u - sa * w, cy + sa * u + ca * w)
    pts = [pt(start, -width / 2), pt(length, -width / 2), pt(length, width / 2), pt(start, width / 2)]
    prism(b, pts, z0, z1, mi)

def prism(b, pts, z0, z1, mi=0):
    """Extrude a simple polygon (list of (x, y), any winding) between z0 and z1."""
    # ensure CCW
    area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    if area < 0: pts = pts[::-1]
    n = len(pts)
    verts = [(x, y, z1) for x, y in pts] + [(x, y, z0) for x, y in pts]
    faces = [list(range(n)), list(range(2 * n - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j, n + i])
    b.add(verts, faces, mi)

def polyline_band(b, pts, width, z0, z1, mi=0, cap=True):
    """A lever: a polyline thickened to `width` (constant), extruded."""
    left = []; right = []
    n = len(pts)
    for i in range(n):
        p = Vector(pts[i])
        d1 = (Vector(pts[i]) - Vector(pts[i - 1])).normalized() if i > 0 else None
        d2 = (Vector(pts[i + 1]) - Vector(pts[i])).normalized() if i < n - 1 else None
        d = (d1 if d2 is None else d2 if d1 is None else (d1 + d2).normalized())
        nrm = Vector((-d.y, d.x))
        # widen at corners so width stays roughly constant
        k = 1.0 if (d1 is None or d2 is None) else 1.0 / max(0.4, abs(nrm.dot(Vector((-d1.y, d1.x)))))
        left.append((p + nrm * width / 2 * k).to_tuple()); right.append((p - nrm * width / 2 * k).to_tuple())
    prism(b, left + right[::-1], z0, z1, mi)

def ring_sector(b, cx, cy, r0, r1, a0, a1, z0, z1, n=32, mi=0):
    pts = [(cx + r1 * math.cos(a0 + (a1 - a0) * i / n), cy + r1 * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    pts += [(cx + r0 * math.cos(a1 - (a1 - a0) * i / n), cy + r0 * math.sin(a1 - (a1 - a0) * i / n)) for i in range(n + 1)]
    prism(b, pts, z0, z1, mi)

# tooth profiles as functions of angle -----------------------------------------
def wheel_teeth(z, r_pitch, module=None, addendum=None, dedendum=None):
    """Cycloid-like wheel teeth: r(theta) for z teeth on pitch radius r_pitch."""
    module = module or 2 * r_pitch / z
    ad = addendum if addendum is not None else 1.0 * module
    dd = dedendum if dedendum is not None else 1.1 * module
    def R(t):
        u = (t * z / TAU) % 1.0          # 0..1 across one pitch
        u = abs(u - 0.5) * 2             # 0 at tooth centre, 1 at gap centre
        if u < 0.32:                     # rounded tip
            return r_pitch + ad * math.sqrt(max(0.0, 1 - (u / 0.32) ** 2)) * 0.95 + ad * 0.05
        if u < 0.55:                     # flank
            return r_pitch + ad * 0.05 - (dd + ad * 0.05) * ((u - 0.32) / 0.23) ** 1.4
        return r_pitch - dd              # root
    return R

def pinion_leaves(z, r_pitch):
    module = 2 * r_pitch / z
    ad = 0.75 * module; dd = 1.0 * module
    def R(t):
        u = abs(((t * z / TAU) % 1.0) - 0.5) * 2
        if u < 0.42:
            return r_pitch + ad * math.sqrt(max(0.0, 1 - (u / 0.42) ** 2))
        if u < 0.62:
            return r_pitch - dd * ((u - 0.42) / 0.20) ** 1.2
        return r_pitch - dd
    return R

def club_teeth(z, r_out):
    """Swiss lever escape wheel: club teeth whose steep locking face leads when the
    wheel turns in the +theta direction (the direction the train drives it)."""
    def R(t):
        u = (t * z / TAU) % 1.0
        if u < 0.58:  return r_out * 0.78                                        # gap
        if u < 0.84:  return r_out * (0.78 + 0.22 * ((u - 0.58) / 0.26) ** 1.2)  # back slope up to the club
        if u < 0.94:  return r_out                                               # club (impulse plane)
        return r_out * (1 - 0.14 * ((u - 0.94) / 0.06))                          # steep locking face (leads)
    return R

def ratchet_teeth(z, r_out, depth):
    def R(t):
        u = (t * z / TAU) % 1.0
        if u < 0.08:
            return r_out - depth + depth * (u / 0.08)      # steep face the click holds against
        return r_out - depth * ((u - 0.08) / 0.92)          # long sloping back
    return R

def column_profile(ncol, r_out, r_in):
    def R(t):
        u = (t * ncol / TAU) % 1.0
        return r_out if u < 0.5 else r_in
    return R

def spoked_wheel(b, cx, cy, z_teeth, r_pitch, z0, z1, rim=0.55, spokes=5, hub=0.75, bore=0.35, mi=0, spoke_w=0.5, module=None):
    """A crossed-out wheel: toothed rim + hub + spokes."""
    R = wheel_teeth(z_teeth, r_pitch, module)
    n = max(z_teeth * 6, 200)
    radial_prism(b, cx, cy, R, z0, z1, n, rin=r_pitch - rim - (module or 2 * r_pitch / z_teeth) * 1.1, mi=mi)
    cyl(b, cx, cy, hub, z0, z1, 32, rin=bore, mi=mi)
    for k in range(spokes):
        a = TAU * k / spokes + 0.3
        rot_box(b, cx, cy, r_pitch - rim - 0.2, spoke_w, a, z0 + 0.01, z1 - 0.01, mi, start=hub - 0.1)

def solid_wheel(b, cx, cy, z_teeth, r_pitch, z0, z1, bore=0.3, mi=0, module=None):
    radial_prism(b, cx, cy, wheel_teeth(z_teeth, r_pitch, module), z0, z1, max(z_teeth * 6, 160), rin=bore, mi=mi)

def pinion(b, cx, cy, leaves, r_pitch, z0, z1, mi=0):
    radial_prism(b, cx, cy, pinion_leaves(leaves, r_pitch), z0, z1, leaves * 16, mi=mi)

def arbor(b, cx, cy, r, z0, z1, mi=0):
    cyl(b, cx, cy, r, z0, z1, 20, mi=mi)

def heart_cam(b, cx, cy, size, z0, z1, mi=0, ang=0.0):
    """A heart-piece: two lobes and a notch, r(theta) form, notch at angle `ang`."""
    def R(t):
        u = ((t - ang) / TAU) % 1.0          # 0 at the notch
        s = abs(u - 0.5) * 2                 # 1 at notch, 0 at the tip
        return size * (0.35 + 0.65 * (1 - s) ** 0.85 + 0.12 * math.sin(math.pi * (1 - s)))
    radial_prism(b, cx, cy, R, z0, z1, 96, mi=mi)

def jewel(b, cx, cy, z0, z1, r=0.45, mi_ruby=0, mi_ring=1):
    cyl(b, cx, cy, r, z0, z1, 24, mi=mi_ruby)
    cyl(b, cx, cy, r + 0.28, z0 - 0.02, z1 - 0.06, 24, rin=r, mi=mi_ring)

def screw(b, cx, cy, z_head, r=0.5, mi=0, mi_slot=1, up=True):
    z0, z1 = (z_head, z_head + 0.25) if up else (z_head - 0.25, z_head)
    cyl(b, cx, cy, r, z0, z1, 20, mi=mi)
    zs0, zs1 = (z1 - 0.05, z1 + 0.005) if up else (z0 - 0.005, z0 + 0.05)
    rot_box(b, cx, cy, r * 0.85, 0.12, 0.7, zs0, zs1, mi_slot, start=-r * 0.85)


def rounded(pts, r=0.8, n=6):
    out = []
    k = len(pts)
    for i in range(k):
        p0, p1, p2 = Vector(pts[i - 1]), Vector(pts[i]), Vector(pts[(i + 1) % k])
        d0 = (p0 - p1).normalized(); d2 = (p2 - p1).normalized()
        rr = min(r, (p0 - p1).length / 2.2, (p2 - p1).length / 2.2)
        a = p1 + d0 * rr; c = p1 + d2 * rr
        for j in range(n + 1):
            t = j / n
            q = (1 - t) ** 2 * a + 2 * (1 - t) * t * p1 + t ** 2 * c
            out.append(q.to_tuple())
    return out

def lathe(b, profile, z_axis=True, n=64, mi=0, smooth=True, cx=0.0, cy=0.0):
    """Surface of revolution about the Z axis through (cx, cy): profile is a list of (r, z) points, r >= 0,
    ordered along the meridian.  Produces a closed strip (no caps unless the profile starts/ends at r = 0)."""
    verts = []; m = len(profile)
    for i in range(n):
        a = TAU * i / n
        for (r, z) in profile:
            verts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    faces = []
    for i in range(n):
        j = (i + 1) % n
        for q in range(m - 1):
            a0, a1, b0, b1 = i * m + q, i * m + q + 1, j * m + q, j * m + q + 1
            faces.append([a0, b0, b1, a1])
    b.add(verts, faces, mi, smooth)

def export_glb(path, meta=None):
    for ob in bpy.data.objects:
        if ob.type == 'MESH': ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=False, export_apply=True, export_yup=True,
                              export_materials='EXPORT', export_extras=True, export_normals=True, export_texcoords=False)
    if meta is not None:
        json.dump(meta, open(os.path.splitext(path)[0] + '-meta.json', 'w'), indent=1)
    return os.path.getsize(path)
