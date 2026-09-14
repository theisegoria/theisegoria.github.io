# OLED teaching model

Generic top-emission RGB OLED, not a reconstruction of a commercial panel. Layer thickness, gaps, colours and particle dimensions are illustrative. Charge movement is a deterministic seven-second diagram, not drift-diffusion physics. Transport/injection layers are grouped; blocking layers, optical interference and detailed circuitry are omitted. RGB controls specify normalized linear sRGB output, encoded for display; they are not measured current, power or luminance.

Primary references (accessed 2026-09-14):
- https://oled.com/oleds/ — electrodes, organic functional layers and emission
- https://news.samsungdisplay.com/4660 — charge injection and OLED structure
- https://global.samsungdisplay.com/30927 — TFT backplane
- https://global.samsungdisplay.com/29626 — encapsulation
- https://www.lgdisplay.com/eng/technology/tandem-woled — white OLED architecture
- https://global.samsungdisplay.com/31428 — blue OLED source and quantum-dot conversion

Geometry is original procedural geometry. Three.js 0.180.0 is bundled under the included MIT license. Editable app source is in source/. Install its pinned dependencies and run npm run build to rebuild the shared app.js. English and Japanese use the same state and model.
