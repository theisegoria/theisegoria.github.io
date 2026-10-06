# Studio Display sound: reconstruction notes

This is an educational reconstruction of the **2022** Studio Display, with a separate evidence comparison for the **2026** model. It is not Apple CAD, a dimensional scan, a circuit model, or a measured acoustic simulation. Every label in the 3D view names where its shape comes from: Apple specification, fitted to the teardown photo, or inferred / teaching model.

## What determines the model

| Element | Basis | Limits |
| --- | --- | --- |
| Case width and height | Apple: 62.3 cm wide; 36.2 cm high with the VESA adapter | One scene unit represents 10 cm. |
| Case depth | Apple: 3.1 cm deep with the VESA adapter | Modelled at 2.5 cm for the bare enclosure; estimate. Corner radius 9 mm and edge rounding are estimates from product photographs. |
| Glass and panel | 27-inch 5K panel; the 597.7 × 336.2 mm active area follows from the 16:9 diagonal | The border width is derived, not published. The screen shows a neutral gradient; no wallpaper or logo. |
| Perforated top and bottom edges | Product photographs and reviews | Hole pitch about 1.7 mm is an estimate; rendered as a surface map, not individual holes. |
| Tilt stand | Apple: 47.8 cm high and 16.8 cm deep overall | One bent plate; width (18.5 cm), gauge (6.5 mm) and bend radius are estimates from photographs. |
| Side acoustic chambers, fan housings, boards, cables | Outlines traced on iFixit's 1922 × 1081 front-open photograph | The photo establishes visible layout, not depth. Chamber depth 15 mm, estimated. |
| Lower speaker modules | Outlines traced on the photograph: black woofer module (31 × 63 mm) and silver mesh-covered tweeter (23 × 58 mm) at each lower corner | Apple confirms 4 woofers + 2 tweeters. The two drivers drawn back to back inside each woofer module are inferred from Apple's force-cancelling description and patent US10631096B1, not observed. |
| Outlet route | Speakers sit at the lower corners above the perforated bottom edge | The downward arrows are an inference; the photograph does not show the passages. |
| Circuit detail | The board tops sample the licensed photograph | Component heights are estimates. |
| Exploded view | Deliberate separation for inspection | Not an actual disassembly sequence, connection layout, or operating state. |
| Opposed woofer motion (chapter 2) | Ideal matched sinusoidal mechanical reactions; section-cut drivers | Exaggerated motion; the mismatch control varies the second force contribution, not an actual measured fault. |
| Wavefront spacing | λ = 343/f metres | Slowed time and schematic arcs; no pressure-field solution, room response, bass extension or SPL claim. |
| Ear paths | Ideal sources 0.48 m apart, ears 0.18 m apart, forward distance 0.75 m | No head shadow, room reflection, HRTF or proprietary Apple filtering. |
| Optional audio | Three low-level 440 Hz tones panned left, center, right | Ordinary Web Audio stereo through the current output, not an Atmos demonstration or display recording. |

The large circles in the upper interior are **cooling fans** (blowers). The sound system uses the tall side chambers and slim lower modules.

## Rendering

Image-based light from the CC0 Poly Haven HDRI photo_studio_01 (served from /assets/hdri/), physically based materials (anodised aluminium with micro-grain, clearcoated glass, moulded plastic with sheen, stainless mesh, copper windings), soft shadow on a transparent floor, ground-truth ambient occlusion (GTAOPass, switched off while parts are ghosted or the photo overlay is shown, and on narrow screens), 4× MSAA and neutral tone mapping. On desktop the light is then replaced by the 2k version of the same HDRI (gain-mapped JPEG, /assets/textures/studio-hdri-2k/) for sharper strip-light reflections. When the view is still, the image converges over 32 jittered frames (48 on the speaker close-up) to supersampled anti-aliasing, so the perforated edges and mesh stop shimmering, with stochastic screen-space reflections in the display glass and aluminium, re-seeded ambient occlusion and a thin-lens depth of field on the speaker close-up. While the view moves, live quality steps down (ambient occlusion, then pixel ratio) to hold the frame rate. The backdrop follows the site's light and dark paper tokens. Rendering happens on demand; camera presets animate unless reduced motion is requested.

For image author, licensing, changes and exclusions, see [ATTRIBUTION.md](ATTRIBUTION.md). The page and bilingual PDFs contain eight linked research sources. The photo-derived reconstruction is CC BY-NC-SA 3.0.

## Editing

- `models.js`: enclosure, stand, traced interior, speaker modules, outlet arrows, photo overlay, chapter 2 to 4 scenes, and the callout anchors.
- `app.js`: renderer, lighting and post-processing; bilingual controls and callout text; numerical readouts; camera presets; sound and motion lifecycle. The page serves both languages from one URL (`?lang=ja`), and updates the site header's language link to match.
- `content.json`: paired prose, diagram captions and source notes.
- `style.css`: responsive presentation and theme tokens.

Three.js r186 and its add-ons are loaded from the site's `/vendor/three/r186/` through the import map. No build service or API key is required to serve this route.
