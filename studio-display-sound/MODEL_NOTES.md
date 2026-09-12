# Studio Display sound: reconstruction notes

This is an educational reconstruction of the **2022** Studio Display, with a separate evidence comparison for the **2026** model. It is not Apple CAD, a dimensional scan, a circuit model, or a measured acoustic simulation.

## What determines the model

| Element | Basis | Limits |
| --- | --- | --- |
| Case width | Apple's 62.3 cm specification | One scene unit represents 10 cm; thickness and stand details are approximate. |
| Side acoustic chambers, fan housings, boards, cables | Traced outlines in iFixit's 1922 × 1081 front-open photograph | The photo establishes visible layout, not depth. |
| Surface detail | Licensed iFixit photograph mapped separately onto outward-facing component surfaces | The picture contains its own lighting; plain material mode removes the photograph. Reverse faces use plain materials. |
| Raised components | Visible outline and a conservative estimated height | No hidden circuit routing or exact component dimensions are asserted. |
| Woofer and tweeter regions | Visible lower assemblies and the documented 4 + 2 architecture | Hidden opposed members are blue conceptual markers, shown only during separation. |
| Exploded view | Deliberate separation for inspection | Not an actual disassembly sequence, connection layout, or operating state. |
| Opposed woofer motion | Ideal matched sinusoidal mechanical reactions | Exaggerated motion; the mismatch control varies the second force contribution, not an actual measured fault. |
| Wavefront spacing | λ = 343/f metres | Slowed time and schematic arcs; no pressure-field solution, room response, bass extension or SPL claim. |
| Ear paths | Ideal sources 0.48 m apart, ears 0.18 m apart, forward distance 0.75 m | No head shadow, room reflection, HRTF or proprietary Apple filtering. |
| Optional audio | Three low-level 440 Hz tones panned left, center, right | Ordinary Web Audio stereo through the current output, not an Atmos demonstration or display recording. |

The large circles in the upper interior are **cooling fans**. The sound system uses the tall side chambers and slim lower assemblies.

For image author, licensing, changes and exclusions, see [ATTRIBUTION.md](ATTRIBUTION.md). The page and bilingual PDFs contain eight linked research sources. The photo-derived reconstruction is CC BY-NC-SA 3.0.

## Interaction and verification

Checked on 13 September 2026 in a real browser with a rendered WebGL canvas. Inspected the full internal view, speaker close-up, separated assemblies, plain/reference surfaces, component focus, force pair and spatial paths. English desktop and Japanese narrow-screen controls were exercised. A 390-pixel viewport had no horizontal document overflow. Motion starts only on request and can be paused or scrubbed; hidden pages stop motion and audio. Rendering otherwise occurs on demand with capped pixel density.

Verified readouts: 20% mismatch → 0.20 F₀; 100 Hz → 3.43 m and 5.51 times display width; centered listener → 159 μs left-source interaural arrival difference. Out-of-range WebMCP stage requests were rejected. Tested optional audio start/stop state without evaluating acoustic playback quality. Browser error and warning log was empty during final checks.

All 14 PDF pages were rendered and visually inspected; standalone guides contain 7 pages each, the combined guide 14. Each language has six matching chapters and eight research sources. Source links and companion-page links are embedded. Reading content is also present in the initial HTML. A WebGL fallback is implemented but was not forced during browser validation.

## Editing

- `reference-internals.js`: traced coordinates, estimated depth, source UV mapping, component selection and separation.
- `models.js`: product housing and independent physics teaching scenes.
- `app.js`: bilingual controls, numerical readouts, camera presets, sound and motion lifecycle.
- `content.json`: paired prose, diagram captions and source notes.
- `style.css`: responsive presentation.

Three.js 0.180.0 and its controls/environment helper are vendored locally with the MIT license. No build service or API key is required to serve this route.
