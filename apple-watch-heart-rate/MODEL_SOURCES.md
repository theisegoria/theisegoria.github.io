# Model and sources

Created 13 September 2026. All geometry is authored procedurally; no third-party product mesh or Apple imagery is redistributed.

## Evidence

- https://www.apple.com/health/pdf/Heart_Rate_Calorimetry_Activity_on_Apple_Watch_November_2024.pdf: optical principle and representative Series 6+ sensor layout. Page 5 rendered and inspected: four photodiodes, peripheral LED windows, central infrared emitter, split back electrode. The anatomical drawing is a separate teaching model, not Apple's hardware interior.
- https://support.apple.com/en-la/120277: green illumination, infrared background operation, LED sampling, electrical sensor distinction.
- https://support.apple.com/en-la/105002: fit, irregular movement, skin perfusion limitations.
- https://support.apple.com/en-ie/121202: Series 10 42 mm nominal exterior size 36 × 42 × 9.7 mm, crown and side controls, third-generation optical sensor. Official front/side product photo was inspected via the linked tech-specs image.

Asset search found commercial Series 10 meshes (TurboSquid 2292707 / 2299206); no verified freely redistributable manufacturer asset was established. No purchase made. Reconstructed footprint and approximately 9.7 mm total sensor-to-front depth. Band segments are shortened open inspection pieces. Microphone, speaker, crown knurling and nominal corner shapes are approximate. This is a recognisable educational reconstruction, not certified CAD.

## Scientific boundaries

A two-Gaussian periodic pulse drives the trace, arterial colour and small thickness variation. Returned light = baseline minus pulse amplitude plus bounded deterministic trigonometric noise. Green/infrared selection changes the displayed colour, the explanation, the emitter and the drawn depth of the light paths (green shallower, infrared deeper, qualitatively); wavelength-dependent tissue transport is not simulated. Violet represents invisible infrared. The same idealised trace is used for both modes.

The clean estimate samples a ten-second synthetic signal at 500 Hz, finds separated inverted-signal maxima and computes 60 divided by median interval. This is an illustrative algorithm, not Apple's implementation or actual sensor sample rate. All non-still presets deliberately return unreliable as a pedagogical rule, not an empirical accuracy or signal-quality result. The lower trace remains a clean ground-truth reference and is explicitly not a recovered signal. Simulation pulse timing is shared; four-second playback loops replay the same segment.

The watch-to-skin gap is nonphysical inspection separation. Curved ray paths, vessel size, tissue layers, amplitudes, colours and noise are illustrative. Photon motion is not at physical speed. Perfusion presets are not individual predictions. ECG and blood oxygen are described only to distinguish them from PPG.

## Rendering and interaction

Three.js 0.180.0 with local bundled dependencies. PBR materials and RoomEnvironment (Three.js MIT); device pixel ratio capped at 1.8. Rendering pauses when hidden or idle; requestAnimationFrame performs the lightweight idle loop. Reduced motion starts paused and removes camera interpolation. Native controls provide keyboard access to every explanatory state; orbit and zoom add optional inspection. WebGL failure leaves explanations and plots usable. No performance claim on a physical mobile device.

## Visual revision · 6 October 2026

Exterior, rebuilt as lofted procedural geometry (no third-party or manufacturer mesh, no logos or wordmarks):
- Case footprint 36 × 42 mm and 9.7 mm total depth from Apple's Series 10 technical specifications; plan-view corners are a continuous-curvature superellipse blend, and the flank-to-glass shoulder profile is fitted by eye to Apple's published Series 10 product photograph.
- Display: 374 × 446 px at 326 ppi gives an active area of about 29 × 35 mm under an edge-to-edge domed front crystal (glass rendered with physical transmission). The screen shows a generic heart-rate readout drawn by the page, not Apple's interface artwork.
- Digital Crown with 72 fine axial ridges, chamfered face and collar; flush pill-shaped side button; microphone port between them; two speaker slots on the opposite flank; band slots across both case ends. Crown diameter and button length are estimated from the product photograph.
- Rear: aluminium rim rolling under to a domed dark sensor crystal (about 29 mm across), split ring electrode, Fresnel-ringed centre window, four photodiodes on the diagonals, LED windows on the axes and a central infrared emitter, as in Apple's representative sensor diagram (Heart Rate, Calorimetry & Activity, p. 5). Die sizes and window radii are illustrative.
- Sport Band: fluoroelastomer strap about 21 mm wide swept along a wrist-shaped centreline, with pin holes; matte sheen material. Closure details are simplified.

Lighting and rendering: Poly Haven photo_studio_01 HDRI (CC0, served from /assets/hdri/) mixed with four soft-box strips for the image-based light; physical materials (bead-blasted aluminium, transmissive glass, clear-coated sensor crystal, elastomer with sheen, moist tissue with clear coat and sheen); PCF soft shadows on a shadow-catcher floor; GTAO ambient occlusion (desktop only), bloom for emitted light only, MSAA, neutral tone mapping. Effects scale down on phones.

Skin cutaway: a block whose front and side faces are painted cross-sections in the order given by OpenStax A&P 2e §5.1: stratum corneum, epidermis with a melanin-bearing basal layer over a wavy dermal-epidermal junction, papillary dermis with a capillary loop in each dermal papilla, superficial vascular plexus, reticular dermis with collagen bundles and an eccrine sweat gland, deep plexus, and subcutaneous fat lobules with fibrous septa. Depths are enlarged several times (real epidermis is about 0.1 mm, dermis 1 to 2 mm). Cut arterioles widen with each modelled pulse and vessels darken with blood volume; venules barely change.

Light paths: drawn on the cut plane as straight segments between scattering events. Paths that reach a photodiode, paths absorbed in tissue or blood (end markers), and paths that cross an arteriole and are absorbed only while it is filled. Green paths stay in the upper dermis; infrared paths start at the central emitter and reach the deeper plexus. These are a qualitative picture of absorption and scattering, not a Monte Carlo transport result.
