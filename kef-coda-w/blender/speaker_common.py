# Shared pieces for the three speaker builders: partial lathes, swept tubes,
# domes, tori, a part registry that records component grouping and explode
# vectors for the web app, and the material palette.
import bpy, math, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_helpers import *
from mathutils import Vector, Matrix, Euler

# ---------------------------------------------------------------- materials
def palette():
    pal = _palette()
    for k in ('fabric', 'fabric_d', 'horn', 'duct', 'fin', 'cone', 'cone_al', 'spider'):
        pal[k].use_backface_culling = False
    return pal

def _palette():
    return {
        'fabric':   mat('fabric', (0.62, 0.60, 0.57), 0.0, 0.9, alpha=0.42),
        'fabric_d': mat('fabric_dark', (0.16, 0.16, 0.17), 0.0, 0.9, alpha=0.42),
        'shell':    mat('shell', (0.86, 0.85, 0.83), 0.0, 0.45),
        'shell_d':  mat('shell_dark', (0.13, 0.13, 0.14), 0.0, 0.5),
        'plastic':  mat('plastic', (0.22, 0.22, 0.24), 0.0, 0.6),
        'plastic_l':mat('plastic_light', (0.55, 0.55, 0.56), 0.0, 0.6),
        'rubber':   mat('rubber', (0.08, 0.08, 0.09), 0.0, 0.95),
        'cone':     mat('cone', (0.17, 0.17, 0.18), 0.0, 0.7),
        'cone_al':  mat('cone_aluminium', (0.78, 0.79, 0.80), 1.0, 0.35),
        'dome':     mat('dome', (0.82, 0.83, 0.85), 1.0, 0.25),
        'surround': mat('surround', (0.10, 0.10, 0.11), 0.0, 0.85),
        'spider':   mat('spider', (0.72, 0.62, 0.35), 0.0, 0.8),
        'former':   mat('former', (0.45, 0.42, 0.36), 0.0, 0.6),
        'coil':     mat('coil', (0.80, 0.45, 0.22), 1.0, 0.45),
        'magnet':   mat('magnet', (0.28, 0.28, 0.30), 0.3, 0.7),
        'steel':    mat('steel', (0.60, 0.61, 0.63), 1.0, 0.4),
        'basket':   mat('basket', (0.30, 0.31, 0.33), 0.8, 0.5),
        'pcb':      mat('pcb', (0.10, 0.32, 0.20), 0.0, 0.6),
        'chip':     mat('chip', (0.12, 0.12, 0.13), 0.1, 0.5),
        'cap':      mat('capacitor', (0.25, 0.28, 0.45), 0.2, 0.5),
        'mic':      mat('mic', (0.85, 0.35, 0.20), 0.0, 0.5, emission=(0.6, 0.2, 0.1)),
        'horn':     mat('horn', (0.66, 0.66, 0.68), 0.0, 0.5),
        'duct':     mat('duct', (0.35, 0.40, 0.48), 0.0, 0.55),
        'glass':    mat('glass_top', (0.12, 0.12, 0.13), 0.0, 0.15),
        'fin':      mat('fin', (0.55, 0.56, 0.58), 0.0, 0.5),
    }

# ---------------------------------------------------------------- registry
class Parts:
    """Every part is one object with a `component` extra (highlight group), a
    `layer` extra (for cutaway ordering) and an `explode` vector (mm, Blender
    frame) written to the meta file."""
    def __init__(self):
        self.list = []
    def add(self, b, name, materials, component, explode=(0, 0, 0), layer='inner', origin=(0, 0), loc=None, rot=None, label=None, explode_local=False):
        ob = b.make(name, materials, origin=origin, extra={'component': component, 'layer': layer})
        if loc is not None: ob.location = loc
        if rot is not None: ob.rotation_euler = rot
        ex = Vector(explode)
        if explode_local and rot is not None: ex = Euler(rot).to_matrix() @ ex
        self.list.append({'name': name, 'component': component, 'layer': layer, 'explode': [round(v, 3) for v in ex], 'label': label or name})
        return ob
    def meta(self, **extra):
        return {'parts': self.list, **extra}

# ---------------------------------------------------------------- geometry
def lathe_arc(b, profile, a0, a1, n=48, mi=0, smooth=True, cx=0.0, cy=0.0, cap=True, close=True):
    """Partial surface of revolution from angle a0 to a1 (radians), with flat caps
    on the two cut faces when cap=True.  profile: list of (r, z); with close=True
    the profile is treated as a closed loop (last point joins the first)."""
    verts = []; m = len(profile)
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        for (r, z) in profile:
            verts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    faces = []
    for i in range(n):
        j = i + 1
        for q in range(m if close else m - 1):
            q1 = (q + 1) % m
            A0, A1, B0, B1 = i * m + q, i * m + q1, j * m + q, j * m + q1
            faces.append([A0, B0, B1, A1])
    b.add(verts, faces, mi, smooth)
    if cap:
        for a in (a0, a1):
            pts = [(cx + r * math.cos(a), cy + r * math.sin(a), z) for (r, z) in profile]
            # a cap is the polygon of the profile in its own plane; only valid when the profile is closed-ish
            base = len(b.v)
            b.v.extend(pts)
            b.f.append([base + k for k in range(m)] if a == a1 else [base + k for k in range(m - 1, -1, -1)])
            b.fm.append(mi); b.smooth.append(False)

def dome(b, cx, cy, z0, r, h, n=48, rings=12, mi=0, thick=0.0):
    """Spherical-cap dome of base radius r and height h sitting on z0 (apex up).
    With thick>0 a shell of that thickness is built (open at the base)."""
    R = (r * r + h * h) / (2 * h)
    zc = z0 + h - R
    prof = []
    for i in range(rings + 1):
        t = i / rings
        a = math.asin(min(1.0, r / R)) * (1 - t)
        prof.append((R * math.sin(a), zc + R * math.cos(a)))
    if thick > 0:
        inner = [((R - thick) * (p[0] / R), zc + (R - thick) * ((p[1] - zc) / R)) for p in prof[:-1]][::-1]
        prof = prof + [(0.0, zc + R - thick)] + inner
    lathe(b, prof, n=n, mi=mi, cx=cx, cy=cy)

def torus_half(b, cx, cy, z0, r_ring, r_tube, n=64, m=10, mi=0, up=True, flat=0.0):
    """Half-torus roll surround (the upper half when up=True) with optional flat lips."""
    prof = []
    if flat > 0: prof.append((r_ring - r_tube - flat, z0))
    for i in range(m + 1):
        a = math.pi * i / m
        prof.append((r_ring - r_tube * math.cos(a), z0 + (r_tube if up else -r_tube) * math.sin(a)))
    if flat > 0: prof.append((r_ring + r_tube + flat, z0))
    lathe(b, prof, n=n, mi=mi, cx=cx, cy=cy)

def sweep(b, path, r, n=18, mi=0, r_of=None, closed_ends=True):
    """Sweep a circle of radius r (or r_of(t) for t in 0..1) along a 3D polyline."""
    P = [Vector(p) for p in path]
    m = len(P)
    frames = []
    up = Vector((0, 0, 1))
    prev_n = None
    for i in range(m):
        if i == 0: t = (P[1] - P[0]).normalized()
        elif i == m - 1: t = (P[-1] - P[-2]).normalized()
        else: t = ((P[i + 1] - P[i]).normalized() + (P[i] - P[i - 1]).normalized()).normalized()
        if prev_n is None:
            ref = up if abs(t.dot(up)) < 0.9 else Vector((1, 0, 0))
            nrm = (ref - t * ref.dot(t)).normalized()
        else:
            nrm = (prev_n - t * prev_n.dot(t)).normalized()
        prev_n = nrm
        bn = t.cross(nrm)
        frames.append((nrm, bn))
    verts = []
    for i in range(m):
        rr = r_of(i / (m - 1)) if r_of else r
        nrm, bn = frames[i]
        for k in range(n):
            a = TAU * k / n
            v = P[i] + nrm * (rr * math.cos(a)) + bn * (rr * math.sin(a))
            verts.append(v.to_tuple())
    faces = []
    for i in range(m - 1):
        for k in range(n):
            j = (k + 1) % n
            faces.append([i * n + k, i * n + j, (i + 1) * n + j, (i + 1) * n + k])
    if closed_ends:
        faces.append([k for k in range(n - 1, -1, -1)])
        faces.append([(m - 1) * n + k for k in range(n)])
    b.add(verts, faces, mi, True)

def sweep_rect(b, path, w, h, mi=0, w_of=None, h_of=None):
    """Sweep a rectangle (w across, h up-ish) along a 3D polyline."""
    P = [Vector(p) for p in path]; m = len(P)
    up = Vector((0, 0, 1)); prev_n = None; frames = []
    for i in range(m):
        if i == 0: t = (P[1] - P[0]).normalized()
        elif i == m - 1: t = (P[-1] - P[-2]).normalized()
        else: t = ((P[i + 1] - P[i]).normalized() + (P[i] - P[i - 1]).normalized()).normalized()
        ref = up if abs(t.dot(up)) < 0.9 else Vector((0, -1, 0))
        nrm = (ref - t * ref.dot(t)).normalized() if prev_n is None else (prev_n - t * prev_n.dot(t)).normalized()
        prev_n = nrm; frames.append((nrm, t.cross(nrm)))
    verts = []
    for i in range(m):
        ww = w_of(i / (m - 1)) if w_of else w
        hh = h_of(i / (m - 1)) if h_of else h
        nrm, bn = frames[i]
        for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            verts.append((P[i] + bn * (sx * ww / 2) + nrm * (sy * hh / 2)).to_tuple())
    faces = []
    for i in range(m - 1):
        for k in range(4):
            j = (k + 1) % 4
            faces.append([i * 4 + k, i * 4 + j, (i + 1) * 4 + j, (i + 1) * 4 + k])
    faces.append([3, 2, 1, 0]); faces.append([(m - 1) * 4 + k for k in range(4)])
    b.add(verts, faces, mi, False)

def rounded_rect(w, d, r, n=8):
    """Racetrack / rounded rectangle outline centred at origin, w along x, d along y."""
    pts = []
    for (cx, cy, a0) in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, math.pi / 2), (-w / 2 + r, -d / 2 + r, math.pi), (w / 2 - r, -d / 2 + r, 3 * math.pi / 2)):
        for i in range(n + 1):
            a = a0 + (math.pi / 2) * i / n
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def loft(b, rings, mi=0, smooth=True, cap0=True, cap1=True):
    """Skin a list of rings (each a list of (x,y,z) with the same count) into a surface."""
    n = len(rings[0]); m = len(rings)
    verts = [v for ring in rings for v in ring]
    faces = []
    for i in range(m - 1):
        for k in range(n):
            j = (k + 1) % n
            faces.append([i * n + k, i * n + j, (i + 1) * n + j, (i + 1) * n + k])
    if cap0: faces.append([k for k in range(n - 1, -1, -1)])
    if cap1: faces.append([(m - 1) * n + k for k in range(n)])
    b.add(verts, faces, mi, smooth)

# ---------------------------------------------------------------- driver kit
def cone_driver(P, M, prefix, comp, cx, cy, z_flange, r_cone, depth, r_vc, motor_h, magnet_r, n=72,
                dust_cap=True, cone_mat='cone', basket_spokes=6, explode_up=1.0, label=None, loc=None, rot=None, pole_bore=0.0):
    """A complete generic cone driver on a vertical axis, diaphragm facing +Z, flange at z_flange.
    Returns the objects.  Parts: basket, cone, dust cap, surround, spider, former+coil, magnet, plates."""
    ex = lambda k: (0, 0, k * explode_up)
    lab = lambda s: (label + ' ' + s) if label else s
    # surround (half roll)
    b = Builder(); torus_half(b, cx, cy, z_flange - 1.0, r_cone + 3.0, 3.0, n=n, mi=0, flat=1.2)
    P.add(b, prefix + '_surround', [M['surround']], comp, ex(18), label=lab('surround'), loc=loc, rot=rot, explode_local=True)
    # cone: from the surround inner edge down to the voice coil former
    b = Builder()
    prof = [(r_cone, z_flange - 1.0), (r_cone * 0.97, z_flange - 1.6)]
    for i in range(1, 7):
        t = i / 6
        r = r_cone * 0.97 + (r_vc - r_cone * 0.97) * t
        z = z_flange - 1.6 - depth * (t ** 1.15)
        prof.append((r, z))
    prof += [(r_vc - 0.6, z_flange - 1.6 - depth), (r_vc - 0.6, z_flange - 2.0 - depth), (r_vc * 1.02 + 0.2, z_flange - 2.0 - depth + 0.5)]
    prof2 = [(r_cone * 0.97 - 0.6, z_flange - 2.2)]
    for i in range(1, 7):
        t = i / 6
        r = r_cone * 0.97 + (r_vc - r_cone * 0.97) * t - 0.6
        z = z_flange - 1.6 - depth * (t ** 1.15) - 0.7
        prof2.append((r, z))
    lathe(b, prof + prof2[::-1][1:], n=n, mi=0)
    P.add(b, prefix + '_cone', [M[cone_mat]], comp, ex(16), label=lab('cone'), loc=loc, rot=rot, explode_local=True)
    if dust_cap:
        b = Builder(); dome(b, cx, cy, z_flange - 1.6 - depth + 0.4, r_vc * 1.15, r_vc * 0.55, n=n, mi=0, thick=0.5)
        P.add(b, prefix + '_dustcap', [M['dome']], comp, ex(16), label=lab('dust cap'), loc=loc, rot=rot, explode_local=True)
    # former + coil
    z_top = z_flange - 2.0 - depth
    b = Builder(); cyl(b, cx, cy, r_vc, z_top - motor_h * 0.55, z_top + 0.3, n, rin=r_vc - 0.35, mi=0)
    P.add(b, prefix + '_former', [M['former']], comp, ex(9), label=lab('voice coil former'), loc=loc, rot=rot, explode_local=True)
    b = Builder(); cyl(b, cx, cy, r_vc + 0.45, z_top - motor_h * 0.55, z_top - motor_h * 0.55 + motor_h * 0.28, n, rin=r_vc, mi=0)
    P.add(b, prefix + '_coil', [M['coil']], comp, ex(9), label=lab('voice coil'), loc=loc, rot=rot, explode_local=True)
    # spider: a corrugated flat ring under the cone
    b = Builder()
    prof = []
    r0, r1 = r_vc + 0.5, r_cone * 0.55
    zs = z_top - 1.5
    for i in range(25):
        t = i / 24
        prof.append((r0 + (r1 - r0) * t, zs + 0.8 * math.sin(t * math.pi * 6)))
    prof2 = [(r, z - 0.35) for (r, z) in prof][::-1]
    lathe(b, prof + prof2, n=n, mi=0)
    P.add(b, prefix + '_spider', [M['spider']], comp, ex(12), label=lab('spider'), loc=loc, rot=rot, explode_local=True)
    # basket: flange ring, spokes down to the motor, lower ring
    b = Builder()
    cyl(b, cx, cy, r_cone + 6.0, z_flange - 2.4, z_flange, n, rin=r_cone + 2.5, mi=0)
    z_low = z_top - motor_h * 0.55 - 1.0
    cyl(b, cx, cy, magnet_r * 0.72 + 2.5, z_low - 2.0, z_low, n, rin=r_vc + 1.5, mi=0)
    for k in range(basket_spokes):
        a = TAU * k / basket_spokes + 0.2
        top = Vector((cx + (r_cone + 4.5) * math.cos(a), cy + (r_cone + 4.5) * math.sin(a), z_flange - 1.5))
        bot = Vector((cx + (magnet_r * 0.72 + 1.5) * math.cos(a), cy + (magnet_r * 0.72 + 1.5) * math.sin(a), z_low - 1.0))
        sweep_rect(b, [top.to_tuple(), (top * 0.55 + bot * 0.45).to_tuple(), bot.to_tuple()], 3.2, 2.4, mi=0)
    P.add(b, prefix + '_basket', [M['basket']], comp, ex(14), label=lab('basket'), loc=loc, rot=rot, explode_local=True)
    # motor: top plate, magnet ring, back plate with pole piece
    gap = 0.9
    b = Builder(); cyl(b, cx, cy, magnet_r * 0.72, z_low - 2.0 - 3.0, z_low - 2.0, n, rin=r_vc + gap, mi=0)
    P.add(b, prefix + '_topplate', [M['steel']], comp, ex(5), label=lab('top plate'), loc=loc, rot=rot, explode_local=True)
    b = Builder(); cyl(b, cx, cy, magnet_r, z_low - 2.0 - 3.0 - motor_h * 0.5, z_low - 2.0 - 3.0, n, rin=r_vc + gap + 2.5, mi=0)
    P.add(b, prefix + '_magnet', [M['magnet']], comp, ex(2), label=lab('magnet'), loc=loc, rot=rot, explode_local=True)
    b = Builder()
    zb = z_low - 2.0 - 3.0 - motor_h * 0.5
    cyl(b, cx, cy, magnet_r, zb - 3.0, zb, n, rin=pole_bore, mi=0)
    cyl(b, cx, cy, r_vc - 0.35 - gap, zb, z_top - motor_h * 0.55 + motor_h * 0.28 + 1.0, n, rin=pole_bore, mi=0)   # pole piece
    P.add(b, prefix + '_backplate', [M['steel']], comp, ex(0), label=lab('back plate and pole piece'), loc=loc, rot=rot, explode_local=True)

def dome_tweeter(P, M, prefix, comp, r_dome=9.5, n=48, faceplate_r=None, explode=(0, 0, 12), loc=None, rot=None, label=None):
    """A generic dome tweeter built at the origin on +Z, then placed with loc/rot."""
    lab = lambda s: (label + ' ' + s) if label else s
    fp = faceplate_r or r_dome * 1.8
    b = Builder(); dome(b, 0, 0, 0.0, r_dome, r_dome * 0.36, n=n, mi=0, thick=0.35)
    P.add(b, prefix + '_dome', [M['dome']], comp, explode, loc=loc, rot=rot, label=lab('dome'))
    b = Builder(); torus_half(b, 0, 0, 0.0, r_dome + 1.0, 1.0, n=n, mi=0)
    P.add(b, prefix + '_surround', [M['surround']], comp, explode, loc=loc, rot=rot, label=lab('surround'))
    b = Builder(); cyl(b, 0, 0, fp, -2.0, 0.0, n, rin=r_dome + 2.2, mi=0)
    P.add(b, prefix + '_faceplate', [M['plastic']], comp, tuple(e * 0.8 for e in explode), loc=loc, rot=rot, label=lab('faceplate'))
    b = Builder(); cyl(b, 0, 0, r_dome, -6.0, -0.2, n, rin=r_dome - 0.4, mi=0)
    P.add(b, prefix + '_coil', [M['coil']], comp, tuple(e * 0.5 for e in explode), loc=loc, rot=rot, label=lab('voice coil'))
    b = Builder()
    cyl(b, 0, 0, fp * 0.95, -12.0, -2.0, n, rin=r_dome + 0.8, mi=0)          # top plate
    cyl(b, 0, 0, fp * 0.95, -18.0, -12.0, n, rin=r_dome + 3.5, mi=1)         # magnet
    cyl(b, 0, 0, fp * 0.95, -21.0, -18.0, n, mi=0)                            # back plate
    cyl(b, 0, 0, r_dome - 1.4, -18.0, -2.5, n, mi=0)                          # pole
    P.add(b, prefix + '_motor', [M['steel'], M['magnet']], comp, (0, 0, 0), loc=loc, rot=rot, label=lab('magnet and plates'))

def board(P, M, name, comp, cx, cy, z, r=None, w=None, d=None, explode=(0, 0, 0), chips=6, seed=1, label=None):
    """A generic circuit board: round (r) or rectangular (w×d), with a few components."""
    import random
    rnd = random.Random(seed)
    b = Builder()
    if r: cyl(b, cx, cy, r, z, z + 1.6, 64, mi=0)
    else: box(b, cx - w / 2, cx + w / 2, cy - d / 2, cy + d / 2, z, z + 1.6, mi=0)
    for i in range(chips):
        if r:
            a = rnd.uniform(0, TAU); rr = rnd.uniform(0.15, 0.7) * r
            x, y = cx + rr * math.cos(a), cy + rr * math.sin(a)
        else:
            x, y = cx + rnd.uniform(-0.35, 0.35) * w, cy + rnd.uniform(-0.35, 0.35) * d
        if i % 3 == 2: cyl(b, x, y, rnd.uniform(3, 5), z + 1.6, z + 1.6 + rnd.uniform(5, 9), 24, mi=2)
        else:
            s = rnd.uniform(5, 12); box(b, x - s / 2, x + s / 2, y - s * 0.7 / 2, y + s * 0.7 / 2, z + 1.6, z + 1.6 + rnd.uniform(1.5, 3.5), mi=1)
    P.add(b, name, [M['pcb'], M['chip'], M['cap']], comp, explode, label=label or name)
