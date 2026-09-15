# Writing Lab — sources, modeling, and evidence

Researched 2026-09-15. Private Sites delivery; no GitHub Pages publication requested.

## Product identity and references
- Mitsubishi Pencil, 2024-03-08: https://digitalpr.jp/r/84393 — SXN-LS-05/07 single-color pens, 0.5 and 0.7 mm ball sizes, black ink, rubber forebody through the nose, quiet knock, matching molded clip, SXR-L-5/7 refills. Manufacturer reference image: https://digitalpr.jp/simg/2212/84393/642_450_2024030609395765e7bb5d05d32.jpg . Only the right-hand single-color models were used as the reconstruction reference, not the 4&1 models at left. Three finishes shared by both sizes are exposed.
- Mitsubishi Pencil, 2023-02-15: https://digitalpr.jp/r/67927 — DIVE M5-5000 1P, Abyss Blue, 0.5 mm, cap initial feed, magnetic closure, rotation, five feed settings. Capped photo: https://digitalpr.jp/simg/2212/67927/715_400_2023021015571563e5eacb85f84.jpg ; uncapped profile: https://digitalpr.jp/simg/2212/67927/650_200_2023021015574263e5eae63acac.png ; adjustment: https://digitalpr.jp/simg/2212/67927/500_268_2023021015573863e5eae272e0c.jpg . Distinct black grip and short stepped nose, blue faceted body, dark clip and endcaps, silver collars and engine window are reconstructed.
- Care: https://www.mpuni.co.jp/customer/ans_211b.html . No disassembly instructions invented.

Reference photos were inspected locally but not redistributed. No usable exact manufacturer CAD/GLB was located in the targeted search. All delivered geometry is original procedural work. Dimensions are NOT claimed: Japanese listing dimensions and UNI Singapore SXN-LS dimensions disagree. Scale is consistent for presentation but not a measurement interface. Clip curves, markings, facets and small details approximate the photographic evidence. Assembled and separated cap positions are inspection states. Cap interior is not reconstructed as verified engineering.

## Chemistry
- Manufacturer annual report, fiscal year 2024, research and development section: https://www.mpuni.co.jp/news/images/news/0327yuhou.pdf . Search-index text explicitly states viscosity was lowered further compared with conventional JETSTREAM to reduce writing resistance. Direct web-tool PDF retrieval returned HTTP 403; the indexed manufacturer excerpt was corroborated by repeated exact-text search. No numerical viscosity or formula is asserted.
- Mitsubishi Pencil patent US7071245B2: https://patents.google.com/patent/US7071245B2/en . Older oil-based ink architecture: colorant, solvent, soluble resin. This is background chemistry, NOT evidence that its named solvents, percentages or additives constitute Lite touch. No specific molecule or recipe is assigned to the product. Ingredient graphics are symbols, not concentration, scale or molecular dynamics.
- IUPAC dynamic viscosity: https://goldbook.iupac.org/terms/view/D01877 ; simple shear https://goldbook.iupac.org/terms/view/S05676 . Normalized Newtonian fixed-gradient illustration: stress ratio equals viscosity ratio. Real ink rheology and writing resistance are more complex. Slider values are intentionally generic, with no baseline assigned to either commercial ink.

## Mechanical models
- Ball transfers ink; simplified no-slip rolling marker rotation is distance / radius. Ball diameter slider is not a prediction of deposited line width. No friction reduction percentage invented.
- DIVE rotation uses an exaggerated 24-degree teaching step; no product gear count or verified stroke-to-rotation ratio is asserted. Feed events are selected independently and do not purport to happen every four strokes or on a measured timer. Five settings have monotonic illustrative displacement, not calibrated mm. Cap preparation is distinct from magnetic closure.
- No batteries, motor, sharpening blade or proprietary internals invented.

## Runtime
React 19, R3F 9, Three.js 0.179, Drei 10. PBR and local generated light cards, no external scene assets, demand rendering, bounded DPR 1.6. No continuous simulation or animation timers. Mobile touch orbit has an explicit toggle; on coarse-pointer devices it starts disabled to permit page scrolling. Camera presets and diagrams remain keyboard/touch-operable.

## Final exterior fidelity pass
See FIDELITY.md for exact variants, additional manufacturer profiles, measured image ratios and remaining reconstruction limits. DIVE cap length, rounded hexagonal geometry, forward shoulder, clip, grip segmentation, adjustment assembly and engine-window placement were corrected. JETSTREAM forebody, clip and button proportions were refined. No manufacturer photographs or purchased geometry are redistributed.
