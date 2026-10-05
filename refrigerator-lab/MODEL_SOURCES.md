# Refrigerator lab: source and model record

Published 14 September 2026; 3D model revised 6 October 2026. English original with a Japanese edition.

## Scope and geometry

Original procedural top-freezer refrigerator teaching model. It is not a replica, manufacturer CAD, measured reconstruction, or service diagram. A product-specific asset is not appropriate to the generic request. Cabinet proportions (approximately 0.78 × 1.88 × 0.72 m), rear exposed condenser, one freezer evaporator and hinged compartment doors are chosen to make a representative layout inspectable. No third-party geometry, photographs or product artwork are redistributed. Three.js is MIT-licensed; bundled license comments are preserved.

Geometry represents the enamelled wrapper and toe-kick grille, levelling feet, glass shelves with trims, two crisper drawers, door liners with magnetic gaskets, door bins and bar handles, hinges, the freezer evaporator cover with return slots, the fresh-food air duct and LED light, a blank rating plate, the hermetic compressor on rubber grommets with its drip tray, the rear wire-on-tube condenser, filter-drier, capillary coil, the capillary and suction line running together up the back, the finned freezer evaporator and its fan. Finishes are chosen to resemble common appliance materials (white enamel with clear coat, ABS liner, glass, clear polystyrene bins, black painted condenser, copper tube, aluminium fins); they are not taken from any one product. Piping paths, coil rows and fin counts are illustrative. The glow marks the selected stage; in a stage close-up the other circuit parts fade back.

Refrigerant markers: colour follows an illustrative temperature scale (blue cold, amber warm liquid, red hot vapour); small solid beads stand for liquid and larger translucent bubbles for vapour, so the share of bubbles shows vapour quality. The quality and temperature profiles along each component are qualitative (desuperheating then condensing in the condenser, flashing near the capillary outlet, boiling across the evaporator, superheat in the suction line). Marker spacing is denser where the model moves slowly (liquid) and sparser where it moves fast (vapour); the speed itself is arbitrary. No claim of computational fluid dynamics, flow speed, refrigerant charge, or measured performance. The see-through cabinet in the circuit view is an explicitly nonphysical inspection view. The door slider is an inspection control, separate from the energy model's daily opening count.

Rendering: image-based light from a CC0 studio HDRI (Poly Haven, studio_small_09), a soft shadow and contact shadow, ground-truth ambient occlusion and multisampled anti-aliasing.

## Primary references

1. Danfoss, How a refrigerator works: https://www.danfoss.com/en/about-danfoss/our-businesses/cooling/the-fridge-how-it-works/: four component functions and refrigerant state changes.
2. Whirlpool, Parts of a refrigerator: https://www.whirlpool.com/blog/kitchen/parts-of-a-refrigerator.html: cabinet and support-system layout; component descriptions. Generic geometry, not a Whirlpool replica.
3. OpenStax, University Physics Volume 2, §4.3: https://openstax.org/books/university-physics-volume-2/pages/4-3-refrigerators-and-heat-pumps: heat/work balance, definition of refrigerator COP.
4. OpenStax, §4.5: https://openstax.org/books/university-physics-volume-2/pages/4-5-the-carnot-cycle: reversible refrigerator COP TC/(TH−TC), absolute temperatures.
5. US DOE, Refrigerator on-demand deicing: https://www.energy.gov/cmei/buildings/articles/higher-efficiency-demand-flexible-refrigerator-demand-micro-vibrational: conventional resistance-heater defrost and its energy penalty.

No refrigerant-specific property table is used. Qualitative pressure and phase labels do not imply measured pressure or exact temperature. Pressure losses in heat exchangers, superheat, subcooling, suction-line heat exchange, humidity, latent infiltration load and variable-speed control are not numerically resolved.

## Energy model

Two fixed-temperature compartments at 4°C (fresh food) and user-selected freezer target. Steady-state teaching model:

- Tevap = Tfreezer − 7°C; Tcond = Troom + 10°C + 15°C × restriction.
- COP = 0.36 × (Tevap + 273.15)/(Tcond − Tevap). The factor 0.36 is an illustrative fraction of the Carnot bound, not a measured efficiency.
- Qconduction = [0.6 W/K × (Troom − 4°C) + 0.3 W/K × (Troom − Tfreezer)] / relative insulation thickness.
- Qdoor = openings/day × 1800 J/opening / 86400 s/day. No humidity or detailed air exchange calculation.
- Qload = Qconduction + Qdoor + 4 W of fixed cabinet loads.
- Wcompressor = Qload / COP. Qrejected = Qload + Wcompressor, with exact balance before rounding.
- Example on-cycle compressor input = 110 W; cooling capacity = 110 W × COP. Duty = Qload/capacity, capped at 1; allowed controls remain below capacity.
- Daily electricity = (Wcompressor + 3 W auxiliary fans) × 24 h / 1000.
- The 3 W auxiliary input also becomes heat in the room but is outside the displayed compressor-cycle balance.

This is not an energy-label estimate, engineering sizing method, calibrated appliance simulation or temperature-dependent material model.

## Thermostat model

Independent single-compartment example, not driven by the energy sliders.

C dT/dt = UA (Troom − T) + Qevent − u Qcool.

C = 9000 J/K; UA = 1.2 W/K; Troom = 25°C; Qcool = 105 W; initial T = 4°C; initial u = 0. Thermostat switches u to 1 at T ≥ 5°C and 0 at T ≤ 3°C. The optional disturbance adds 180 W from 7200 to 7500 seconds. Explicit Euler with fixed 1-second steps; 6-hour duration; samples every minute. Illustrative time scale, no compressor minimum-run delay or frost model. Validation checks energy balance, COP trends, capacity headroom, hysteresis bounds and step-size agreement.
