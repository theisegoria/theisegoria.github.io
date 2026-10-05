# OLED teaching model

Generic top-emission RGB AMOLED, not a reconstruction of a commercial panel. Layer thickness, gaps, colours and particle dimensions are illustrative. Charge movement is a deterministic seven-second diagram, not drift-diffusion physics. Transport/injection layers are grouped; blocking layers, optical interference and detailed circuitry are omitted. RGB controls specify normalized linear sRGB output, encoded for display; they are not measured current, power or luminance.

Primary references (accessed 2026-09-14):
- https://oled.com/oleds/: electrodes, organic functional layers and emission
- https://news.samsungdisplay.com/4660: charge injection and OLED structure
- https://global.samsungdisplay.com/30927: TFT backplane
- https://global.samsungdisplay.com/29626: encapsulation
- https://www.lgdisplay.com/eng/technology/tandem-woled: white OLED architecture
- https://global.samsungdisplay.com/31428: blue OLED source and quantum-dot conversion

Geometry is original procedural geometry. Three.js 0.180.0 is bundled under the included MIT license. Editable app source is in source/. Install its pinned dependencies and run npm run build to rebuild the shared app.js. English and Japanese use the same state and model.

## Visual revision · 6 October 2026

The stack now runs, bottom to top: substrate (flexible polyimide in many phone panels), TFT backplane, reflective anode with pixel-defining layer, hole transport, emissive layer, electron transport, semitransparent cathode, thin-film encapsulation (inorganic / organic / inorganic), circular polariser and cover glass. This follows the top-emission AMOLED structure described in references 1 to 4; touch electrodes and optically clear adhesives are named but not drawn.

Subpixels use a diamond-type arrangement: red and blue on a checkerboard of lattice sites, green at the cell centres, so green has twice the density of red or blue. Shapes (red and blue diamonds, blue largest; green ellipses at alternating 45 degree angles) are representative of published phone-panel micrographs in general, not any specific product. The backplane shows one transistor island with its gate, one storage capacitor and one via per subpixel, plus gate and data lines; real pixel circuits have more transistors.

Rendering: Poly Haven studio_small_09 HDRI (CC0, /assets/hdri/) with soft-box strips for image-based light; physical materials (transmissive cover glass with a slight edge tint, metallic semitransparent cathode, polyimide with clear coat, reflective silver anodes); per-subpixel emission with bloom; light shafts show top emission through the layers above. AgX tone mapping, MSAA. The colour view adds a viewing-distance control: the camera steps back and an acuity blur merges the subpixels, standing in for the eye's limited resolution.

Charge view: the stack narrows to a column around one green subpixel. One highlighted electron-hole pair and five fainter pairs share the seven-second schematic cycle; the highlighted photon exits straight up, the others at small angles.
