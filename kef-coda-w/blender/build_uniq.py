# Generic coincident (coaxial) driver sized to KEF's published Coda W figures (130 mm array, 25 mm dome): a mid/bass cone with a dome tweeter
# mounted at its apex on the pole piece, behind a finned waveguide.  Original
# geometry in the Uni-Q idiom, not KEF's design.  Axis +Z, front at the top.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from speaker_common import *

OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uniq.glb')
reset_scene(); make_root('uniq'); M = palette(); P = Parts()

R_CONE, DEPTH, R_VC = 52.0, 21.0, 20.0
Z_FL = 0.0
cone_driver(P, M, 'mid', 'mid', 0, 0, z_flange=Z_FL, r_cone=R_CONE, depth=DEPTH, r_vc=R_VC, motor_h=30, magnet_r=46,
            dust_cap=False, cone_mat='cone_al', basket_spokes=6, explode_up=1.5, label='mid/bass', pole_bore=17.2)

# trim ring on the front of the basket flange
b = Builder(); lathe(b, [(R_CONE + 2.5, Z_FL + 0.2), (R_CONE + 9.0, Z_FL + 0.2), (R_CONE + 9.0, Z_FL + 2.2), (R_CONE + 4.0, Z_FL + 2.6), (R_CONE + 2.5, Z_FL + 1.2)], n=72, mi=0)
P.add(b, 'trim_ring', [M['plastic']], 'mid', (0, 0, 34), label='trim ring')

# tweeter on the pole piece, at the apex of the cone
Z_T = Z_FL - 1.6 - DEPTH + 1.5
dome_tweeter(P, M, 'tweeter', 'tweeter', r_dome=12.5, faceplate_r=15.5, explode=(0, 0, 70), loc=(0, 0, Z_T), rot=None, label='tweeter')

# finned waveguide: a shallow flare around the tweeter with radial fins
b = Builder()
lathe(b, [(14.5, Z_T - 0.2), (17.0, Z_T + 0.6), (20.5, Z_T + 2.4), (24.0, Z_T + 4.4), (24.0, Z_T + 3.2), (20.0, Z_T + 1.3), (16.6, Z_T - 0.4), (14.5, Z_T - 1.2)], n=64, mi=0)
FINS = 10
for k in range(FINS):
    a = TAU * k / FINS + 0.15
    rz = [(14.8, Z_T + 0.2), (17.0, Z_T + 2.4), (20.5, Z_T + 4.6), (23.8, Z_T + 6.4), (23.8, Z_T + 4.2), (20.5, Z_T + 2.2), (17.0, Z_T + 0.4), (14.8, Z_T - 0.3)]
    t = 0.9
    ca, sa = math.cos(a), math.sin(a)
    left = [(r * ca - t / 2 * sa, r * sa + t / 2 * ca, z) for r, z in rz]
    right = [(r * ca + t / 2 * sa, r * sa - t / 2 * ca, z) for r, z in rz]
    verts = left + right; n = len(rz)
    faces = [list(range(n)), list(range(2 * n - 1, n - 1, -1))] + [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    b.add(verts, faces, 1, False)
P.add(b, 'waveguide', [M['horn'], M['fin']], 'tweeter', (0, 0, 85), label='finned waveguide')

# terminals on the back plate
b = Builder()
zb = None
for ob in bpy.data.objects:
    if ob.name == 'mid_backplate':
        zb = min(v.co.z for v in ob.data.vertices)
for x in (-8, 8):
    box(b, x - 3, x + 3, 40, 48, zb + 0.5, zb + 4, mi=0); cyl(b, x, 44, 1.2, zb - 6, zb + 0.5, 12, mi=1)
P.add(b, 'terminals', [M['plastic'], M['steel']], 'mid', (0, 0, -20), label='terminals')

size = export_glb(OUT, P.meta(kind='uniq', r_cone=R_CONE, depth=DEPTH, z_tweeter=Z_T, z_back=zb))
print('exported', OUT, size, 'bytes,', len(P.list), 'parts')
