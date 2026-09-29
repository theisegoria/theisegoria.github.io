# A 130 mm 12th-generation Uni-Q array (KEF Coda W), reconstructed as a
# three-quarter section from KEF's own published descriptions of the
# architecture (Uni-Q technology page; LS50 Meta / LS50 Wireless II white
# paper; R Series 2018 info sheet; Reference white paper).  What those
# documents state, and this model follows:
#   - 25 mm aluminium dome tweeter seated at the acoustic centre of a 130 mm
#     magnesium/aluminium cone, INSIDE the mid/bass voice coil, on its own
#     neodymium motor nested in the bore of the mid/bass pole
#   - a radial-channel phase plug ("Tangerine" waveguide) over the dome
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
# Dimensions KEF does not publish (voice-coil diameters, motor sizes, fin
# count, the rear absorber that terminates the duct in Coda W) are
# representative and are labelled so in the page.  No logos, no trade dress,
# nothing taken from KEF's product mesh.  Axis +Z, front at the top, mm.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from speaker_common import *

OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uniq.glb')
reset_scene(); make_root('uniq'); M = palette(); P = Parts()
M['alu'] = mat('aluminium_ring', (0.80, 0.81, 0.83), 1.0, 0.3)
M['copper'] = mat('copper_sleeve', (0.85, 0.50, 0.30), 1.0, 0.35)
M['wadding'] = mat('wadding', (0.86, 0.84, 0.78), 0.0, 1.0)
M['neo'] = mat('neodymium', (0.55, 0.56, 0.58), 0.9, 0.35)
M['guide'] = mat('waveguide', (0.20, 0.21, 0.23), 0.0, 0.45)

A0, A1 = math.pi / 2, 2 * math.pi       # the removed quarter faces +X +Y (the page's hero camera)
NSEG = 60

def rev(b, prof, mi=0, soft=False, n=NSEG):
    """Three-quarter revolution of a CLOSED (r, z) polygon with capped cut faces.
    soft=False: each profile edge gets its own strip, so corners stay crisp and
    only the circumferential direction is smoothed.  soft=True shares vertices
    (for thin curved shells)."""
    m = len(prof)
    if soft:
        lathe_arc(b, prof, A0, A1, n=n, mi=mi, smooth=True, cap=True, close=True); return
    for q in range(m):
        (r0, z0), (r1, z1) = prof[q], prof[(q + 1) % m]
        verts = []; faces = []
        for i in range(n + 1):
            a = A0 + (A1 - A0) * i / n; c, s = math.cos(a), math.sin(a)
            verts += [(r0 * c, r0 * s, z0), (r1 * c, r1 * s, z1)]
        for i in range(n):
            faces.append([2 * i, 2 * (i + 1), 2 * (i + 1) + 1, 2 * i + 1])
        b.add(verts, faces, mi, True)
    for a, rev_ in ((A0, True), (A1, False)):
        pts = [(r * math.cos(a), r * math.sin(a), z) for (r, z) in prof]
        b.add(pts, [list(range(m))[::-1] if rev_ else list(range(m))], mi, False)

def shell(path, t):
    """Closed profile of a sheet of thickness t along a polyline path of (r, z)."""
    out, inn = [], []
    k = len(path)
    for i in range(k):
        a = path[max(0, i - 1)]; c = path[min(k - 1, i + 1)]
        dr, dz = c[0] - a[0], c[1] - a[1]; L = math.hypot(dr, dz) or 1.0
        nr, nz = -dz / L, dr / L                    # left normal (towards +z for an outward path)
        out.append((path[i][0] + nr * t / 2, path[i][1] + nz * t / 2))
        inn.append((path[i][0] - nr * t / 2, path[i][1] - nz * t / 2))
    return out + inn[::-1]

def add(b, name, mats, comp, ez, label, ev=None):
    return P.add(b, name, mats, comp, (0, 0, ez), label=label)

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
# cone (magnesium/aluminium alloy)
path = [(R_NECK + (R_CONE - R_NECK) * i / 24, cone_z(R_NECK + (R_CONE - R_NECK) * i / 24)) for i in range(25)]
b = Builder(); rev(b, shell(path, 0.6), 0, soft=True)
add(b, 'mid_cone', [M['cone_al']], 'mid', 26, 'magnesium/aluminium cone')

# Z-flex surround: a low, narrow fold that keeps the upper surface nearly continuous from cone to trim ring
zpath = [(49.6, -1.05), (50.6, -1.25), (51.3, -2.6), (52.0, -4.0), (52.9, -4.4), (53.8, -3.9), (54.5, -2.3), (55.2, -0.9), (56.4, -0.55), (58.0, -0.5)]
b = Builder(); rev(b, shell(zpath, 0.7), 0, soft=True)
add(b, 'mid_surround', [M['surround']], 'mid', 30, 'Z-flex surround')

# trim ring: continues the waveguide line from the surround out to the baffle
b = Builder(); rev(b, [(56.2, -0.9), (60.0, -0.35), (64.0, 0.45), (67.5, 1.25), (69.0, 1.35), (69.0, -3.6), (57.5, -3.6), (56.2, -1.8)], 0)
add(b, 'trim_ring', [M['plastic']], 'mid', 40, 'trim ring')

# cone-neck decoupler: flexible link between cone neck and former
b = Builder(); rev(b, [(R_FORMER + 0.35, -18.8), (22.3, -18.8), (22.3, -16.7), (R_FORMER + 0.35, -16.7)], 0)
add(b, 'mid_decoupler', [M['rubber']], 'mid', 22, 'cone-neck decoupler')

# former and voice coil
b = Builder(); rev(b, [(R_FORMER, -35.0), (R_FORMER + 0.35, -35.0), (R_FORMER + 0.35, -17.4), (R_FORMER, -17.4)], 0)
add(b, 'mid_former', [M['former']], 'mid', 16, 'mid/bass voice-coil former')
b = Builder(); rev(b, [(R_FORMER + 0.35, -33.6), (R_FORMER + 0.95, -33.6), (R_FORMER + 0.95, -27.0), (R_FORMER + 0.35, -27.0)], 0)
add(b, 'mid_coil', [M['coil']], 'mid', 16, 'mid/bass voice coil')

# spider
sp = [(R_FORMER + 0.35 + (35.0 - R_FORMER - 0.35) * i / 30, -24.8 + 0.7 * math.sin(i / 30 * math.pi * 7)) for i in range(31)]
b = Builder(); rev(b, shell(sp, 0.4), 0, soft=True)
add(b, 'mid_spider', [M['spider']], 'mid', 12, 'spider')

# chassis: flange, spider shelf, seat on the top plate, spokes (only those outside the cut)
b = Builder()
rev(b, [(55.5, -3.4), (61.0, -3.4), (61.0, -1.0), (57.0, -1.0), (55.5, -1.6)], 0)
rev(b, [(35.0, -26.0), (38.5, -26.0), (38.5, -24.0), (35.0, -24.0)], 0)
rev(b, [(37.0, -27.6), (43.0, -27.6), (43.0, -26.0), (37.0, -26.0)], 0)
for k in range(6):
    a = TAU * k / 6 + math.pi / 6
    if not (A0 + 0.12 < a % TAU < A1 - 0.12) and not (A0 + 0.12 < a + TAU < A1 - 0.12): continue
    c, s = math.cos(a), math.sin(a)
    sweep_rect(b, [(58.0 * c, 58.0 * s, -3.0), (48.0 * c, 48.0 * s, -13.0), (38.5 * c, 38.5 * s, -25.0)], 4.5, 2.2, mi=0)
add(b, 'mid_basket', [M['basket']], 'mid', 8, 'cast chassis')

# ================================================================ mid/bass motor (undercut pole, aluminium rings)
R_BORE = 17.8
b = Builder(); rev(b, [(22.6, -33.0), (42.0, -33.0), (42.0, -27.6), (22.6, -27.6)], 0)
add(b, 'mid_topplate', [M['steel']], 'mid', 4, 'mid/bass top plate')
b = Builder(); rev(b, [(26.0, -41.0), (44.0, -41.0), (44.0, -33.0), (26.0, -33.0)], 0)
add(b, 'mid_magnet', [M['magnet']], 'mid', 1.5, 'mid/bass ring magnet')
b = Builder(); rev(b, [(R_BORE, -45.0), (44.0, -45.0), (44.0, -41.0), (19.6, -41.0), (19.6, -33.6), (20.6, -33.0), (20.6, -26.2), (R_BORE, -26.2)], 0)
add(b, 'mid_backplate', [M['steel']], 'mid', 0, 'back plate and undercut pole')
b = Builder(); rev(b, [(22.4, -41.0), (25.6, -41.0), (25.6, -33.2), (22.4, -33.2)], 0)
add(b, 'mid_ring_low', [M['alu']], 'mid', 2.5, 'aluminium ring, magnet side')
b = Builder(); rev(b, [(R_BORE, -26.2), (20.4, -26.2), (20.4, -25.0), (R_BORE, -25.0)], 0)
add(b, 'mid_ring_top', [M['alu']], 'mid', 6, 'aluminium ring, top of pole')

# ================================================================ tweeter (nested in the mid/bass pole bore)
Rs = (R_DOME ** 2 + H_DOME ** 2) / (2 * H_DOME); ZC = Z_DOME + H_DOME - Rs
def dome_z(r): return ZC + math.sqrt(max(0.0, Rs * Rs - r * r))
dp = [(R_DOME * i / 16, dome_z(R_DOME * i / 16)) for i in range(17)]
b = Builder(); rev(b, shell(dp, 0.3)[:], 0, soft=True)
add(b, 'tweeter_dome', [M['dome']], 'tweeter', 66, '25 mm aluminium dome (vented)')
rp = [(R_DOME + 1.8 * i / 10, Z_DOME + 0.9 * math.sin(math.pi * i / 10)) for i in range(11)]
b = Builder(); rev(b, shell(rp, 0.3), 0, soft=True)
add(b, 'tweeter_surround', [M['surround']], 'tweeter', 66, 'tweeter surround')
# surround support: first part of the waveguide; its outer edge leaves the annular gap to the voice coil
b = Builder(); rev(b, [(14.3, -19.2), (16.5, -18.5), (18.8, -17.8), (20.5, -17.5), (20.5, -18.6), (17.0, -20.0), (15.4, -20.9), (14.3, -20.9)], 0)
add(b, 'tweeter_support', [M['guide']], 'tweeter', 58, 'surround support')
b = Builder(); rev(b, [(12.3, -23.4), (12.65, -23.4), (12.65, -19.05), (12.3, -19.05)], 0)
add(b, 'tweeter_coil', [M['coil']], 'tweeter', 50, 'tweeter voice coil')
# neodymium motor with copper-sleeved pole; the pole bore is the start of the conical duct
b = Builder()
rev(b, [(13.0, -24.6), (14.6, -24.6), (14.6, -21.2), (13.0, -21.2)], 0)                                   # top plate
rev(b, [(5.9, -31.0), (14.6, -31.0), (14.6, -28.6), (11.6, -28.6), (11.6, -21.4), (4.8, -21.4)], 0)        # cup + pole
add(b, 'tweeter_motor', [M['steel']], 'tweeter', 40, 'tweeter plates and pole')
b = Builder(); rev(b, [(12.9, -28.6), (14.6, -28.6), (14.6, -24.6), (12.9, -24.6)], 0)
add(b, 'tweeter_magnet', [M['neo']], 'tweeter', 44, 'neodymium magnet')
b = Builder(); rev(b, [(11.6, -24.0), (11.95, -24.0), (11.95, -21.4), (11.6, -21.4)], 0)
add(b, 'tweeter_sleeve', [M['copper']], 'tweeter', 46, 'copper sleeve on pole')
b = Builder(); rev(b, [(14.6, -33.2), (R_BORE, -33.2), (R_BORE, -31.4), (14.6, -31.4)], 0)
add(b, 'tweeter_mount', [M['plastic']], 'tweeter', 34, 'tweeter mount')

# ================================================================ Tangerine-type radial-channel waveguide
NF = 8
def fin_lo(r): return (dome_z(r) if r <= R_DOME else Z_DOME + 0.9) + 0.8
def fin_hi(r): return -11.9 - 5.6 * ((r - 2.2) / 14.8) ** 1.3
b = Builder()
rev(b, [(0.0, -12.6), (2.4, -12.6), (2.4, -11.9), (0.0, -11.6)], 1)                                       # hub
rev(b, [(13.9, -17.95), (17.2, -17.95), (17.2, -17.0), (15.5, -16.75), (13.9, -16.9)], 1)                  # outer ring
for k in range(NF):
    a = TAU * k / NF + math.pi / NF
    if not (A0 + 0.08 < a < A1 - 0.08): continue
    rs = [2.2 + (17.0 - 2.2) * i / 12 for i in range(13)]
    top = [(r, min(fin_hi(r), -16.8) if r > 13.9 else fin_hi(r)) for r in rs]
    bot = [(r, fin_lo(r) if r < 13.9 else -17.9) for r in rs]
    prof = top + bot[::-1]
    ca, sa = math.cos(a), math.sin(a)
    def half(r): return 0.45 + 1.1 * (r - 2.2) / 14.8           # fins thicken outwards: the channels narrow
    left = [(r * ca - half(r) * sa, r * sa + half(r) * ca, z) for r, z in prof]
    right = [(r * ca + half(r) * sa, r * sa - half(r) * ca, z) for r, z in prof]
    n = len(prof)
    faces = [list(range(n)), list(range(2 * n - 1, n - 1, -1))] + [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    b.add(left + right, faces, 1, False)
P.add(b, 'waveguide', [M['guide'], M['guide']], 'tweeter', (0, 0, 80), label='radial-channel waveguide (Tangerine type)')

# ================================================================ damping path
# tweeter gap damper: two wadding rings in the cavity between tweeter and mid/bass magnets
b = Builder(); rev(b, [(14.8, -24.9), (17.6, -24.9), (17.6, -21.6), (14.8, -21.6)], 0); rev(b, [(14.8, -31.2), (17.6, -31.2), (17.6, -27.4), (14.8, -27.4)], 0)
add(b, 'gap_damper', [M['wadding']], 'damping', -8, 'tweeter gap damper')
# conical duct: continues the tweeter pole bore through the mid/bass back plate
b = Builder(); rev(b, [(6.0, -31.0), (7.0, -31.0), (9.6, -52.0), (8.6, -52.0)], 0)
add(b, 'duct', [M['duct']], 'damping', -18, 'conical duct')
b = Builder(); rev(b, [(0.0, -47.0), (8.3, -47.0), (7.5, -38.0), (0.0, -38.0)], 0)
add(b, 'duct_fill', [M['wadding']], 'damping', -24, 'porous fill in the duct')
# rear absorber that terminates the duct (representative)
b = Builder(); rev(b, [(9.7, -45.4), (30.0, -45.4), (30.0, -68.0), (0.0, -68.0), (0.0, -66.8), (28.8, -66.8), (28.8, -46.6), (9.7, -46.6)], 0)
add(b, 'rear_chamber', [M['plastic']], 'damping', -40, 'rear chamber')
b = Builder(); rev(b, [(10.0, -66.6), (28.6, -66.6), (28.6, -53.0), (10.0, -53.0)], 0)
add(b, 'rear_absorber', [M['wadding']], 'damping', -32, 'rear absorber')

size = export_glb(OUT, P.meta(kind='uniq', section_deg=270, r_cone=R_CONE, r_neck=R_NECK, z_tweeter=Z_DOME, z_back=-68.0,
                              provenance='architecture from KEF Uni-Q page and LS50 Meta / R Series / Reference white papers; unpublished dimensions representative'))
print('exported', OUT, size, 'bytes,', len(P.list), 'parts')
