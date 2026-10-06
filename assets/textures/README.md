# Shared surface textures

Real scanned surfaces used by the site's 3D explainers where a scan reads more like a
photograph than a procedural map (brush streaks with their smudges, leather grain, a
weave, moulded-plastic grain, paper). Every set here is CC0 1.0 (public domain) from
[ambientCG](https://ambientcg.com) or [Poly Haven](https://polyhaven.com); none comes
from a manufacturer. Sets are reduced to 512 to 1024 px and recompressed (JPEG or
WebP). Normal maps are tangent-space, OpenGL convention; roughness maps are greyscale.

They are tiled with UVs in real units: a page that passes `createStudio({ unit })`
(metres per scene unit) gets each scan at its true physical size (`SCANS[name].size`
in `/assets/lab-kit/studio-look.js`), so a brush streak on a 40 mm watch case and on
a 300 mm speaker cabinet has the same real pitch.

| Folder | Source | Maps |
| --- | --- | --- |
| `brushed_steel/` | ambientCG Metal009 (brushed metal) | normal, roughness (mean rescaled to 0.5) |
| `circular_brushed/` | ambientCG Metal051A (circular brushed metal) | normal, roughness |
| `leather_black/` | ambientCG Leather026 | normal, roughness |
| `fabric_weave/` | ambientCG Fabric030 | normal, roughness |
| `acg-metal009-brushed/` | ambientCG Metal009 | normal, roughness |
| `acg-metal028-powder/` | ambientCG Metal028 (powder-coated steel) | normal, roughness |
| `acg-paper001/` | ambientCG Paper001 | colour, normal, roughness |
| `acg-plastic010-grain/` | ambientCG Plastic010 | normal, roughness |
| `acg-rubber004/` | ambientCG Rubber004 | normal, roughness |
| `pr2-bead-blast-aluminium/` | ambientCG Metal012 | normal (from displacement), roughness |
| `pr2-brushed-steel/` | ambientCG Metal009 | normal (from displacement), roughness |
| `pr2-elastomer/` | ambientCG Rubber004 | normal, roughness |
| `pr2-smudge/` | ambientCG Smear003 | roughness |
| `pr2-textured-plastic/` | ambientCG Plastic013A | normal, roughness, height |
| `ph-beige-wall-001/` | Poly Haven beige_wall_001 | normal, roughness |
| `ph-concrete-floor-01/` | Poly Haven concrete_floor_01 | colour, normal, roughness |
| `ph-concrete-pavers/` | Poly Haven concrete_pavers | colour, normal, roughness |
| `ph-laminate-floor-02/` | Poly Haven laminate_floor_02 | colour, normal, roughness |
| `ph-large-red-bricks/` | Poly Haven large_red_bricks | colour, normal, roughness |
| `pr2-hdri-2k/` | Poly Haven photo_studio_01, studio_small_09 (2k .hdr) | HDR environment |
| `studio-hdri-2k/` | Poly Haven photo_studio_01, studio_small_09, photo_studio_loft_hall | 2k HDR as base JPEG + gain map |

The studio HDRIs that `studio-look.js` loads live in `/assets/hdri/` (see its README).
