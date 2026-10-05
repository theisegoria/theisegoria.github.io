# A 130 mm 12th-generation Uni-Q array (KEF Coda W), reconstructed as a
# three-quarter section from KEF's own published descriptions of the
# architecture (Uni-Q technology page; LS50 Meta / LS50 Wireless II white
# paper; R Series 2018 info sheet; Reference white paper).  What those
# documents state, and this model follows:
#   - 25 mm aluminium dome tweeter seated at the acoustic centre of a 130 mm
#     magnesium/aluminium cone, INSIDE the mid/bass voice coil, on its own
#     neodymium motor nested in the bore of the mid/bass pole
#   - a radial-channel phase plug (a generic finned flare of the "Tangerine"
#     kind) over the dome
#   - the cone profile and a low-profile Z-flex surround forming the tweeter's
#     outer waveguide, finished by a trim ring out to the baffle
#   - flexible decoupling between the cone neck and the voice-coil former
#   - a tweeter gap damper: two wadding rings in a cavity between the
#     midrange and tweeter magnets, fed by the annular gap between the
#     voice coil and the start of the waveguide
#   - a vented dome whose rear wave leaves through a slightly tapered conical
#     duct in the centre poles, with porous material in the duct
#   - an undercut mid/bass pole and aluminium rings (one between magnet and
#     coil, one at the top) to cut inductance modulation; a copper sleeve on
#     the tweeter pole
# Generic construction details every cone driver has, drawn so the section
# reads as a made object (none of them is a KEF-specific claim): rounded and
# chamfered edges on turned and cast parts, mounting screws in the chassis
# flange, ribbed chassis spokes, braided tinsel leads from the coil to a
# terminal block on a spoke, a glue fillet at the cone neck.
# Dimensions KEF does not publish (voice-coil diameters, motor sizes, fin
# count, the rear absorber that terminates the duct in Coda W) are
# representative and are labelled so in the page.  No logos, no trade dress,
# nothing taken from KEF's product mesh.  Axis +Z, front at the top, mm.
#
# v3 (2026-10): every lathed part is one smooth surface with sharp edges set by
# angle (so rounded edges catch light), the cut faces carry their own
# material per component ("section_mid" / "section_tweeter" / "section_damping"),
# named physical materials for the web studio, label anchors in the meta file,
# Draco compression.
import sys, os, math, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from speaker_common import *

OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uniq.glb')
reset_scene(); make_root('uniq'); P = Parts()

# ---------------------------------------------------------------- materials (names are read by the page)
def m(name, rgb, metal=0.0, rough=0.5):
    x = mat(name, rgb, metal, rough); x.use_backface_culling = False; return x
M = {
    'cone':     m('cone_alloy', (0.70, 0.71, 0.72), 1.0, 0.38),
    'dome':     m('dome_alu', (0.86, 0.87, 0.88), 1.0, 0.22),
    'surround': m('surround_rubber', (0.045, 0.045, 0.05), 0.0, 0.7),
    'trim':     m('trim_satin', (0.10, 0.105, 0.115), 0.0, 0.45),
    'decoup':   m('decoupler_rubber', (0.06, 0.06, 0.065), 0.0, 0.8),
    'former':   m('former_kapton', (0.62, 0.38, 0.12), 0.0, 0.35),
    'coil':     m('coil_copper', (0.86, 0.48, 0.28), 1.0, 0.32),
    'spider':   m('spider_cloth', (0.78, 0.66, 0.40), 0.0, 0.85),
    'chassis':  m('chassis_cast', (0.16, 0.165, 0.175), 0.6, 0.48),
    'steel':    m('plate_steel', (0.62, 0.63, 0.65), 1.0, 0.34),
    'ferrite':  m('magnet_ring', (0.20, 0.20, 0.21), 0.2, 0.75),
    'alu':      m('ring_alu', (0.84, 0.85, 0.87), 1.0, 0.28),
    'neo':      m('neo_magnet', (0.78, 0.79, 0.80), 1.0, 0.18),
    'copper':   m('sleeve_copper', (0.88, 0.52, 0.32), 1.0, 0.25),
    'guide':    m('guide_satin', (0.12, 0.125, 0.135), 0.0, 0.4),
    'wadding':  m('wadding', (0.86, 0.84, 0.78), 0.0, 1.0),
    'duct':     m('duct_satin', (0.30, 0.34, 0.40), 0.0, 0.5),
    'screw':    m('screw_black', (0.05, 0.05, 0.055), 1.0, 0.35),
    'tinsel':   m('tinsel_copper', (0.90, 0.60, 0.38), 1.0, 0.4),
    'terminal': m('terminal_brass', (0.85, 0.70, 0.40), 1.0, 0.3),
    'housing':  m('housing_plastic', (0.10, 0.10, 0.11), 0.0, 0.55),
    'glue':     m('glue_bead', (0.55, 0.52, 0.45), 0.0, 0.3),
}
SEC = {c: m('section_' + c, rgb, 0.0, 0.6) for c, rgb in (('mid', (0.36, 0.46, 0.55)), ('tweeter', (0.85, 0.55, 0.25)), ('damping', (0.45, 0.58, 0.44)))}

A0, A1 = math.pi / 2, 2 * math.pi       # the removed quarter faces +X +Y (the page's hero camera)
NSEG = 72

def rounded_poly(prof, r):
    """Round every corner of a closed (r, z) polygon (radius limited by the edges)."""
    if r <= 0: return prof
    return [(x, z) for (x, z) in rounded(prof, r, 3)]

def rev(b, prof, mi=0, soft=False, n=NSEG, r=0.45, cap_mi=1):
    """Three-quarter revolution of a CLOSED (r, z) polygon, one smooth surface
    (sharp edges are set later by angle), with flat caps on the two cut faces
    in material slot cap_mi.  soft=True skips the corner rounding (thin shells)."""
    prof = prof if soft else rounded_poly(prof, r)
    mm = len(prof); verts = []; faces = []
    for i in range(n + 1):
        a = A0 + (A1 - A0) * i / n; c, s = math.cos(a), math.sin(a)
        for (rr, z) in prof: verts.append((rr * c, rr * s, z))
    for i in range(n):
        for q in range(mm):
            q1 = (q + 1) % mm
            faces.append([i * mm + q, (i + 1) * mm + q, (i + 1) * mm + q1, i * mm + q1])
    b.add(verts, faces, mi, True)
    for a, flip in ((A0, True), (A1, False)):
        pts = [(rr * math.cos(a), rr * math.sin(a), z) for (rr, z) in prof]
        b.add(pts, [list(range(mm))[::-1] if flip else list(range(mm))], cap_mi, False)

def shell(path, t):
    """Closed profile of a sheet of thickness t along a polyline path of (r, z)."""
    out, inn = [], []
    k = len(path)
    for i in range(k):
        a = path[max(0, i - 1)]; c = path[min(k - 1, i + 1)]
        dr, dz = c[0] - a[0], c[1] - a[1]; L = math.hypot(dr, dz) or 1.0
        nr, nz = -dz / L, dr / L
        out.append((path[i][0] + nr * t / 2, path[i][1] + nz * t / 2))
        inn.append((path[i][0] - nr * t / 2, path[i][1] - nz * t / 2))
    return out + inn[::-1]

def add(b, name, mats, comp, ez, label, anchor=None, sharp=38):
    ob = P.add(b, name, list(mats) + [SEC[comp]], comp, (0, 0, ez), label=label)
    try: ob.data.set_sharp_from_angle(angle=math.radians(sharp))
    except Exception as e: print('sharp', e)
    if anchor is not None: P.list[-1]['anchor'] = [round(v, 3) for v in anchor]
    return ob

def cut(rr, z, a=A1):
    """A point on a cut face (default: the +X face, which the hero camera sees)."""
    return (rr * math.cos(a), rr * math.sin(a), z)

def surf(rr, z, a):
    """A point on a revolved surface at angle a."""
    return (rr * math.cos(a), rr * math.sin(a), z)

# ================================================================ key dimensions
R_CONE = 50.0          # cone outer edge; 130 mm nominal array incl. surround and trim (KEF)
R_NECK = 21.8          # cone neck, just outside the mid/bass voice coil
Z_NECK, Z_EDGE = -17.0, -1.0
R_FORMER = 21.0        # mid/bass voice-coil former (inner radius); representative
R_DOME, H_DOME, Z_DOME = 12.5, 4.6, -19.0   # 25 mm dome (KEF); height representative

def cone_z(r):
    u = (r - R_NECK) / (R_CONE - R_NECK)
    return Z_EDGE - (Z_EDGE - Z_NECK) * (1 - u) ** 1.35

# ================================================================ mid/bass: diaphragm side
path = [(R_NECK + (R_CONE - R_NECK) * i / 32, cone_z(R_NECK + (R_CONE - R_NECK) * i / 32)) for i in range(33)]
b = Builder(); rev(b, shell(path, 0.6), 0, soft=True)
add(b, 'mid_cone', [M['cone']], 'mid', 26, 'magnesium/aluminium cone', anchor=surf(40.0, cone_z(40.0) + 0.3, math.radians(200)))
# glue fillet where the cone neck meets the decoupler
b = Builder(); rev(b, [(R_NECK - 0.1, -17.6), (R_NECK + 1.4, -17.2), (R_NECK + 0.2, -16.3)], 0, r=0.3)
add(b, 'mid_glue', [M['glue']], 'mid', 24, 'glue fillet')

# Z-flex surround: a low, narrow fold that keeps the upper surface nearly continuous from cone to trim ring
zpath = [(49.6, -1.05), (50.6, -1.25), (51.3, -2.6), (52.0, -4.0), (52.9, -4.4), (53.8, -3.9), (54.5, -2.3), (55.2, -0.9), (56.4, -0.55), (58.0, -0.5)]
zfine = []
for i in range(len(zpath) - 1):
    for k in range(4):
        t = k / 4; zfine.append((zpath[i][0] + (zpath[i + 1][0] - zpath[i][0]) * t, zpath[i][1] + (zpath[i + 1][1] - zpath[i][1]) * t))
zfine.append(zpath[-1])
for _ in range(3): zfine = [zfine[0]] + [((zfine[i - 1][0] + 2 * zfine[i][0] + zfine[i + 1][0]) / 4, (zfine[i - 1][1] + 2 * zfine[i][1] + zfine[i + 1][1]) / 4) for i in range(1, len(zfine) - 1)] + [zfine[-1]]
b = Builder(); rev(b, shell(zfine, 0.7), 0, soft=True)
add(b, 'mid_surround', [M['surround']], 'mid', 30, 'Z-flex surround', anchor=cut(52.9, -4.4))

# trim ring: continues the waveguide line from the surround out to the baffle
b = Builder(); rev(b, [(56.2, -0.9), (60.0, -0.35), (64.0, 0.45), (67.5, 1.25), (69.0, 1.35), (69.0, -3.6), (57.5, -3.6), (56.2, -1.8)], 0, r=0.6)
add(b, 'trim_ring', [M['trim']], 'mid', 40, 'trim ring', anchor=surf(65.5, 0.9, math.radians(230)))

# cone-neck decoupler: flexible link between cone neck and former
b = Builder(); rev(b, [(R_FORMER + 0.35, -18.8), (22.3, -18.8), (22.3, -16.7), (R_FORMER + 0.35, -16.7)], 0, r=0.25)
add(b, 'mid_decoupler', [M['decoup']], 'mid', 22, 'cone-neck decoupler')

# former and voice coil (windings are a normal map in the page)
b = Builder(); rev(b, [(R_FORMER, -35.0), (R_FORMER + 0.35, -35.0), (R_FORMER + 0.35, -17.4), (R_FORMER, -17.4)], 0, r=0.1)
add(b, 'mid_former', [M['former']], 'mid', 16, 'mid/bass voice-coil former')
b = Builder(); rev(b, [(R_FORMER + 0.35, -33.6), (R_FORMER + 0.95, -33.6), (R_FORMER + 0.95, -27.0), (R_FORMER + 0.35, -27.0)], 0, r=0.2)
add(b, 'mid_coil', [M['coil']], 'mid', 16, 'mid/bass voice coil', anchor=cut(R_FORMER + 0.95, -30.3))

# spider: a corrugated cloth ring with a rolled inner and outer lip
sp = [(R_FORMER + 0.35 + (35.0 - R_FORMER - 0.35) * i / 56, -24.8 + 0.7 * math.sin(i / 56 * math.pi * 7)) for i in range(57)]
b = Builder(); rev(b, shell(sp, 0.4), 0, soft=True)
add(b, 'mid_spider', [M['spider']], 'mid', 12, 'spider', anchor=surf(30.0, -24.2, math.radians(205)))

# chassis: flange, spider shelf, seat on the top plate, ribbed spokes (only those outside the cut), terminal block
b = Builder()
rev(b, [(55.5, -3.4), (61.0, -3.4), (61.0, -1.0), (57.0, -1.0), (55.5, -1.6)], 0, r=0.5)
rev(b, [(35.0, -26.0), (38.5, -26.0), (38.5, -24.0), (35.0, -24.0)], 0, r=0.4)
rev(b, [(37.0, -27.6), (43.0, -27.6), (43.0, -26.0), (37.0, -26.0)], 0, r=0.4)
SPOKES = []
for k in range(6):
    a = TAU * k / 6 + math.pi / 6
    if not (A0 + 0.12 < a % TAU < A1 - 0.12) and not (A0 + 0.12 < a + TAU < A1 - 0.12): continue
    SPOKES.append(a)
    c, s = math.cos(a), math.sin(a)
    pts = [(58.0 * c, 58.0 * s, -3.0), (53.0 * c, 53.0 * s, -7.6), (48.0 * c, 48.0 * s, -13.0), (43.0 * c, 43.0 * s, -19.2), (38.5 * c, 38.5 * s, -25.0)]
    sweep_rect(b, pts, 4.5, 2.2, mi=0)
    # a stiffening rib along the outside of the spoke: a T section
    rib = [(p[0] * 1.0 + c * 0.9, p[1] * 1.0 + s * 0.9, p[2] - 1.0) for p in pts]
    sweep_rect(b, rib, 1.3, 3.6, mi=0)
# terminal block on the spoke at 210 degrees: a moulded block with two plated tabs
TA = math.radians(210); tc, ts = math.cos(TA), math.sin(TA)
def at(rr, dz, side=0.0):
    return (rr * tc - side * ts, rr * ts + side * tc, dz)
tb = Builder()
blk = [at(46.0, -16.5, -3.4), at(52.0, -16.5, -3.4), at(52.0, -16.5, 3.4), at(46.0, -16.5, 3.4)]
prism(tb, [(p[0], p[1]) for p in blk], -17.0, -12.4, 0)
for side in (-1.8, 1.8):
    q = [at(48.6, 0, side - 0.6), at(51.6, 0, side - 0.6), at(51.6, 0, side + 0.6), at(48.6, 0, side + 0.6)]
    prism(tb, [(p[0], p[1]) for p in q], -12.4, -9.6, 1)
add(tb, 'mid_terminals', [M['housing'], M['terminal']], 'mid', 8, 'terminals')
add(b, 'mid_basket', [M['chassis']], 'mid', 8, 'cast chassis', anchor=surf(58.5, -3.2, math.radians(150)), sharp=50)

# mounting screws through the flange (three in the kept part; hidden under the trim ring until separated)
b = Builder()
for a in (math.radians(135), math.radians(225), math.radians(315)):
    cx, cy = 58.3 * math.cos(a), 58.3 * math.sin(a)
    prof = [(0.0, -0.55), (1.0, -0.55), (1.7, -0.75), (2.1, -1.0), (2.1, -1.55), (1.1, -1.6), (1.1, -9.0), (0.9, -9.6), (0.0, -9.7)]
    lathe(b, [(r_, z_) for (r_, z_) in prof], n=28, mi=0, cx=cx, cy=cy)
    # hex socket: a dark recess drawn as a shallow hexagonal prism
    radial_prism(b, cx, cy, lambda t: 0.62, -0.62, -0.5, 6, mi=1)
add(b, 'mid_screws', [M['screw'], M['ferrite']], 'mid', 20, 'flange screws', sharp=50)

# braided tinsel leads from the coil to the terminals, riding over the spider
b = Builder()
for side in (-1.8, 1.8):
    a0 = TA + math.radians(-6 if side < 0 else 6)
    pts = []
    for i in range(25):
        t = i / 24
        rr = (R_FORMER + 1.2) + (50.1 - R_FORMER - 1.2) * t
        z = -26.4 + 3.4 * math.sin(math.pi * min(1.0, t * 1.6))
        if rr > 37.0: z = max(z, -25.0 + (rr - 38.5) * (22.0 / 19.5) + 2.6)      # ride over the spoke
        z = min(z, -10.0)
        aa = a0 + (TA - a0) * t
        pts.append((rr * math.cos(aa) - side * math.sin(TA) * t, rr * math.sin(aa) + side * math.cos(TA) * t, z))
    for _ in range(4):
        pts = [pts[0]] + [tuple((pts[i - 1][k] + 2 * pts[i][k] + pts[i + 1][k]) / 4 for k in range(3)) for i in range(1, len(pts) - 1)] + [pts[-1]]
    sweep(b, pts, 0.42, n=10, mi=0)
add(b, 'mid_leads', [M['tinsel']], 'mid', 12, 'tinsel leads')

# ================================================================ mid/bass motor (undercut pole, aluminium rings)
R_BORE = 17.8
b = Builder(); rev(b, [(22.6, -33.0), (42.0, -33.0), (42.0, -27.6), (22.6, -27.6)], 0, r=0.5)
add(b, 'mid_topplate', [M['steel']], 'mid', 4, 'mid/bass top plate')
b = Builder(); rev(b, [(26.0, -41.0), (44.0, -41.0), (44.0, -33.0), (26.0, -33.0)], 0, r=0.7)
add(b, 'mid_magnet', [M['ferrite']], 'mid', 1.5, 'mid/bass ring magnet', anchor=cut(38.0, -37.0))
b = Builder(); rev(b, [(R_BORE, -45.0), (44.0, -45.0), (44.0, -41.0), (19.6, -41.0), (19.6, -33.6), (20.6, -33.0), (20.6, -26.2), (R_BORE, -26.2)], 0, r=0.5)
add(b, 'mid_backplate', [M['steel']], 'mid', 0, 'back plate and undercut pole', anchor=cut(34.0, -43.0))
b = Builder(); rev(b, [(22.4, -41.0), (25.6, -41.0), (25.6, -33.2), (22.4, -33.2)], 0, r=0.3)
add(b, 'mid_ring_low', [M['alu']], 'mid', 2.5, 'aluminium ring, magnet side')
b = Builder(); rev(b, [(R_BORE, -26.2), (20.4, -26.2), (20.4, -25.0), (R_BORE, -25.0)], 0, r=0.2)
add(b, 'mid_ring_top', [M['alu']], 'mid', 6, 'aluminium ring, top of pole')

# ================================================================ tweeter (nested in the mid/bass pole bore)
Rs = (R_DOME ** 2 + H_DOME ** 2) / (2 * H_DOME); ZC = Z_DOME + H_DOME - Rs
def dome_z(r): return ZC + math.sqrt(max(0.0, Rs * Rs - r * r))
dp = [(R_DOME * i / 24, dome_z(R_DOME * i / 24)) for i in range(25)]
b = Builder(); rev(b, shell(dp, 0.3)[:], 0, soft=True)
add(b, 'tweeter_dome', [M['dome']], 'tweeter', 66, '25 mm aluminium dome (vented)', anchor=cut(7.0, dome_z(7.0) + 0.1))
rp = [(R_DOME + 1.8 * i / 14, Z_DOME + 0.9 * math.sin(math.pi * i / 14)) for i in range(15)]
b = Builder(); rev(b, shell(rp, 0.3), 0, soft=True)
add(b, 'tweeter_surround', [M['surround']], 'tweeter', 66, 'tweeter surround')
b = Builder(); rev(b, [(14.3, -19.2), (16.5, -18.5), (18.8, -17.8), (20.5, -17.5), (20.5, -18.6), (17.0, -20.0), (15.4, -20.9), (14.3, -20.9)], 0, r=0.3)
add(b, 'tweeter_support', [M['guide']], 'tweeter', 58, 'surround support')
b = Builder(); rev(b, [(12.3, -23.4), (12.65, -23.4), (12.65, -19.05), (12.3, -19.05)], 0, r=0.1)
add(b, 'tweeter_coil', [M['coil']], 'tweeter', 50, 'tweeter voice coil', anchor=cut(12.65, -21.5))
b = Builder()
rev(b, [(13.0, -24.6), (14.6, -24.6), (14.6, -21.2), (13.0, -21.2)], 0, r=0.3)
rev(b, [(5.9, -31.0), (14.6, -31.0), (14.6, -28.6), (11.6, -28.6), (11.6, -21.4), (4.8, -21.4)], 0, r=0.35)
add(b, 'tweeter_motor', [M['steel']], 'tweeter', 40, 'tweeter plates and pole', anchor=cut(9.0, -26.0))
b = Builder(); rev(b, [(12.9, -28.6), (14.6, -28.6), (14.6, -24.6), (12.9, -24.6)], 0, r=0.2)
add(b, 'tweeter_magnet', [M['neo']], 'tweeter', 44, 'neodymium magnet', anchor=cut(13.75, -26.6))
b = Builder(); rev(b, [(11.6, -24.0), (11.95, -24.0), (11.95, -21.4), (11.6, -21.4)], 0, r=0.08)
add(b, 'tweeter_sleeve', [M['copper']], 'tweeter', 46, 'copper sleeve on pole')
b = Builder(); rev(b, [(14.6, -33.2), (R_BORE, -33.2), (R_BORE, -31.4), (14.6, -31.4)], 0, r=0.3)
add(b, 'tweeter_mount', [M['housing']], 'tweeter', 34, 'tweeter mount')

# ================================================================ radial-channel waveguide (generic finned flare)
NF = 8
def fin_lo(r): return (dome_z(r) if r <= R_DOME else Z_DOME + 0.9) + 0.8
def fin_hi(r): return -11.9 - 5.6 * ((r - 2.2) / 14.8) ** 1.3
b = Builder()
rev(b, [(0.0, -12.6), (2.4, -12.6), (2.4, -11.9), (0.0, -11.6)], 0, r=0.25)
rev(b, [(13.9, -17.95), (17.2, -17.95), (17.2, -17.0), (15.5, -16.75), (13.9, -16.9)], 0, r=0.25)
FINA = []
for k in range(NF):
    a = TAU * k / NF + math.pi / NF
    if not (A0 + 0.08 < a < A1 - 0.08): continue
    FINA.append(a)
    rs = [2.2 + (17.0 - 2.2) * i / 16 for i in range(17)]
    top = [(r, min(fin_hi(r), -16.8) if r > 13.9 else fin_hi(r)) for r in rs]
    bot = [(r, fin_lo(r) if r < 13.9 else -17.9) for r in rs]
    prof = top + bot[::-1]
    ca, sa = math.cos(a), math.sin(a)
    def half(r): return 0.45 + 1.1 * (r - 2.2) / 14.8           # fins thicken outwards: the channels narrow
    # each fin is a slab with a rounded top edge: three offset layers across its thickness
    layers = []
    for u, dz in ((-1.0, -0.0), (-0.6, 0.18), (0.0, 0.26), (0.6, 0.18), (1.0, 0.0)):
        layers.append([(r * ca - u * half(r) * sa, r * sa + u * half(r) * ca, z + (dz if j < len(top) else 0.0)) for j, (r, z) in enumerate(prof)])
    n = len(prof)
    verts = [v for L in layers for v in L]
    faces = []
    for li in range(len(layers) - 1):
        for i in range(n):
            j = (i + 1) % n
            faces.append([li * n + i, li * n + j, (li + 1) * n + j, (li + 1) * n + i])
    faces.append(list(range(n))[::-1]); faces.append([(len(layers) - 1) * n + i for i in range(n)])
    b.add(verts, faces, 0, True)
add(b, 'waveguide', [M['guide']], 'tweeter', 80, 'radial-channel waveguide', anchor=(9.0 * math.cos(FINA[len(FINA) // 2]), 9.0 * math.sin(FINA[len(FINA) // 2]), fin_hi(9.0) + 0.2), sharp=55)

# ================================================================ damping path
b = Builder(); rev(b, [(14.8, -24.9), (17.6, -24.9), (17.6, -21.6), (14.8, -21.6)], 0, r=0.6); rev(b, [(14.8, -31.2), (17.6, -31.2), (17.6, -27.4), (14.8, -27.4)], 0, r=0.6)
add(b, 'gap_damper', [M['wadding']], 'damping', -8, 'tweeter gap damper', anchor=cut(16.2, -29.3))
b = Builder(); rev(b, [(6.0, -31.0), (7.0, -31.0), (9.6, -52.0), (8.6, -52.0)], 0, r=0.15)
add(b, 'duct', [M['duct']], 'damping', -18, 'conical duct', anchor=cut(8.0, -42.0))
b = Builder(); rev(b, [(0.0, -47.0), (8.3, -47.0), (7.5, -38.0), (0.0, -38.0)], 0, r=0.5)
add(b, 'duct_fill', [M['wadding']], 'damping', -24, 'porous fill in the duct')
b = Builder(); rev(b, [(9.7, -45.4), (30.0, -45.4), (30.0, -68.0), (0.0, -68.0), (0.0, -66.8), (28.8, -66.8), (28.8, -46.6), (9.7, -46.6)], 0, r=0.5)
add(b, 'rear_chamber', [M['housing']], 'damping', -40, 'rear chamber', anchor=surf(30.0, -58.0, math.radians(200)))
b = Builder(); rev(b, [(10.0, -66.6), (28.6, -66.6), (28.6, -53.0), (10.0, -53.0)], 0, r=1.2)
add(b, 'rear_absorber', [M['wadding']], 'damping', -32, 'rear absorber', anchor=cut(20.0, -60.0))

# ================================================================ export (Draco; the page decodes it)
for ob in bpy.data.objects:
    if ob.type == 'MESH': ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=False, export_apply=True, export_yup=True,
                          export_materials='EXPORT', export_extras=True, export_normals=True, export_texcoords=False,
                          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                          export_draco_position_quantization=16, export_draco_normal_quantization=12)
meta = P.meta(kind='uniq', version=3, section_deg=270, r_cone=R_CONE, r_neck=R_NECK, z_tweeter=Z_DOME, z_back=-68.0,
              section_materials={c: 'section_' + c for c in SEC},
              provenance='architecture from KEF Uni-Q page and LS50 Meta / R Series / Reference white papers; unpublished dimensions and generic construction details (screws, leads, terminals, rib) representative')
json.dump(meta, open(os.path.splitext(OUT)[0] + '-meta.json', 'w'), indent=1)
print('exported', OUT, os.path.getsize(OUT), 'bytes,', len(P.list), 'parts')
