# Model and sources

Created 13 September 2026. All geometry is authored procedurally; no third-party product mesh or Apple imagery is redistributed.

## Evidence

- https://www.apple.com/health/pdf/Heart_Rate_Calorimetry_Activity_on_Apple_Watch_November_2024.pdf — optical principle and representative Series 6+ sensor layout. Page 5 rendered and inspected: four photodiodes, peripheral LED windows, central infrared emitter, split back electrode. The anatomical drawing is a separate teaching model, not Apple's hardware interior.
- https://support.apple.com/en-la/120277 — green illumination, infrared background operation, LED sampling, electrical sensor distinction.
- https://support.apple.com/en-la/105002 — fit, irregular movement, skin perfusion limitations.
- https://support.apple.com/en-ie/121202 — Series 10 42 mm nominal exterior size 36 × 42 × 9.7 mm, crown and side controls, third-generation optical sensor. Official front/side product photo was inspected via the linked tech-specs image.

Asset search found commercial Series 10 meshes (TurboSquid 2292707 / 2299206); no verified freely redistributable manufacturer asset was established. No purchase made. Reconstructed footprint and approximately 9.7 mm total sensor-to-front depth. Band segments are shortened open inspection pieces. Microphone, speaker, crown knurling and nominal corner shapes are approximate. This is a recognisable educational reconstruction, not certified CAD.

## Scientific boundaries

A two-Gaussian periodic pulse drives the trace, arterial colour and small thickness variation. Returned light = baseline minus pulse amplitude plus bounded deterministic trigonometric noise. Green/infrared selection changes the displayed wavelength colour and explanation; wavelength-dependent tissue transport is not simulated. Violet represents invisible infrared. The same idealised trace is used for both modes.

The clean estimate samples a ten-second synthetic signal at 500 Hz, finds separated inverted-signal maxima and computes 60 divided by median interval. This is an illustrative algorithm, not Apple's implementation or actual sensor sample rate. All non-still presets deliberately return unreliable as a pedagogical rule, not an empirical accuracy or signal-quality result. The lower trace remains a clean ground-truth reference and is explicitly not a recovered signal. Simulation pulse timing is shared; four-second playback loops replay the same segment.

The watch-to-skin gap is nonphysical inspection separation. Curved ray paths, vessel size, tissue layers, amplitudes, colours and noise are illustrative. Photon motion is not at physical speed. Perfusion presets are not individual predictions. ECG and blood oxygen are described only to distinguish them from PPG.

## Rendering and interaction

Three.js 0.180.0 with local bundled dependencies. PBR materials and RoomEnvironment (Three.js MIT); device pixel ratio capped at 1.8. Rendering pauses when hidden or idle; requestAnimationFrame performs the lightweight idle loop. Reduced motion starts paused and removes camera interpolation. Native controls provide keyboard access to every explanatory state; orbit and zoom add optional inspection. WebGL failure leaves explanations and plots usable. No performance claim on a physical mobile device.
