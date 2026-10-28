# Math encyclopedia lab kit

The topic pages (`/<slug>/` and `/ja/<slug>/`) share one runtime. Each page
loads `math-labs/experience.js` (the kit, `window.Lab`) and `math-labs/app.js`
(the runtime), and the runtime loads `math-labs/topics/<slug>.js`, which
registers one definition per experiment in `window.LabDefs`.

Reference implementations, read them before writing a topic:
`topics/linear-algebra.js`, `topics/markov-chains.js`, `topics/electromagnetism.js`.

## A topic module

```js
'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  D['lab-id'] = {
    render(ctx, v) {        // v = current control values by data-key, all numbers
      ctx.state.anim?.stop(); // only if you start an animator (see below)
      const f = L.fig(ctx.host, { x: [0, 1], y: [0, 1], xlabel: 'x', ylabel: 'y' });
      f.line(L.sample(0, 1, 200, (x) => x * x), { c: 'c1' });
      L.legend(ctx.host, [{ c: 'c1', label: T('y = x²', 'y = x²') }]);
      ctx.readout([{ k: 'max', v: fmt(1), tone: 'key' }], T('Optional one-sentence note.', '任意の一文の注記です。'));
    },
  };
})();
```

The runtime clears `ctx.host` and calls `render` again on every control
change, resize, theme change and reset. Keep render fast (a slider drag calls
it continuously): avoid more than ~60k raster samples or ~3k SVG elements.

### ctx

- `ctx.host` the `.plot` element to draw into; `ctx.out` the readout paragraph
- `ctx.state` an object that survives re-renders (reset empties it). Use it for
  things that are not URL parameters: dragged positions, the animator.
- `ctx.set(key, value, silent)` programmatically change a control (clamped and
  snapped to its step); re-renders unless `silent`. Use it from drag handlers so
  the slider, the URL and the figure stay in sync.
- `ctx.redraw()` re-render without changing controls (after changing ctx.state)
- `ctx.readout(items, note)` items: `{k, v, tone}` with tone `key`, `good`, `warn`
- `ctx.T(en, ja)`, `ctx.ja`

## Kit (`window.Lab`)

- `L.fig(host, opts)` a figure in mathematical coordinates. Options: `x:[x0,x1]`,
  `y:[y0,y1]`, `equal` (square units; the figure narrows rather than distort),
  `aspect` (height/width when not equal, default 0.6), `maxH` (px, default 540),
  `axes:false` for diagrams with no axes/ticks, `grid:false`, `xlabel`, `ylabel`,
  `ticksX`/`ticksY` as `[[value,'label'],...]`, `piX:true` for π ticks.
  Returns `f` with:
  - `f.line(pts, o)`, `f.poly(pts, o)` (closed, filled), `f.area(pts, {base})`,
    `f.seg(a,b,o)`, `f.arrow(a,b,o)`, `f.rect(x,y,w,h,o)`, `f.circle(x,y,r,o)`,
    `f.dot(x,y,o)`, `f.text(x,y,s,o)`, `f.vline(x,o)`, `f.hline(y,o)`
  - style options `o`: `c` colour token, `w` stroke width, `dash` (true or
    '4 3'), `op` opacity, `fill` (true or token), `fo` fill opacity,
    `layer` ('under' | 'main' | 'over'), `arrow` (on line), `r` (dot radius),
    `hollow` (dot), `nostroke` (rect); text: `anchor`, `dx`, `dy`, `math` (italic
    serif, for variables), `small`, `c`
  - `f.raster(fn, {cmap, res})` fills the plot area on a canvas under the SVG.
    `fn(x,y)` returns a number for the colour map (`div` −1..1 diverging, `seq`
    0..1, `warm` 0..1) or an `[r,g,b]` triple directly. `L.cmaps.phase(arg, mag)`
    gives domain-colouring triples.
  - `f.field(fn, {n, c})` arrows of a vector field `fn(x,y) -> [u,v]`
  - `f.stream(fn, seeds, {both, h, steps, stop, c, w, op, flow})` RK4
    streamlines from seed points (`flow:true` animates dashes)
  - `f.handle(x, y, {c, label, onDrag(x,y), bounds:[x0,x1,y0,y1], snap, axis:'x'|'y'})`
    a draggable, keyboard-accessible point. Prefer handles to sliders wherever
    the reader would naturally grab the thing itself.
  - `f.hover(fn)` crosshair tooltip: `fn(x,y)` returns `{x?, y?, text}` or null
  - `f.clear(layer)`, `f.group(layer)`, `f.X(x)`, `f.Y(y)` (to pixels), `f.small`
- `L.stage(host, {w, h})` a bare diagram with pixel-like coordinates 0..w, 0..h
- `L.legend(host, [{c, label, dash, kind:'line'|'dot'|'fill'}])`
- `L.animator(host, step, opts)` a Play/Pause bar. `step(dt, t, labelEl)` draws
  the frame at time t; return false to finish. Options: `autoplay` (default true;
  never autoplays under reduced motion), `once` (Play restarts a finished run),
  `initialT` (time of the first frame; use a large value so the static page
  shows the finished result), `duration`, `playLabel`, `restart`.
  Store it in `ctx.state.anim` and call `ctx.state.anim?.stop()` at the start of
  render. Animators pause off-screen automatically. Draw moving parts into
  layers you clear each frame (`f.clear('over')`), static parts once.
- Helpers: `L.sample(lo, hi, n, f)` (f may return a number or `[x,y]`),
  `L.seq(n, f)`, `L.clamp`, `L.fmt(x, digits)` (uses − and ×10ⁿ), `L.ticks`,
  `L.h(tag, className, parent, text)` for HTML, `L.TAU`.
- Layout: `const row = L.h('div','lab-row',ctx.host)`, then
  `L.h('div','lab-col',row)` per column, with `L.h('p','lab-cap',col,'caption')`
  above each figure, for side-by-side figures (they stack on phones).

## Colour tokens

Use tokens, never literal colours, so light and dark both work:
`c1` blue (primary series), `c2` orange (second series, or "attention"),
`c3` teal, `c4` violet, `hl` gold (the one highlighted object: the current
point, the moving particle), `ink`, `muted`, `plate` (figure background),
`pos`/`neg` (warm/cool for signed quantities). A legend for every figure with
more than one series.

## Controls and content

Controls, texts and formulas come from the page HTML, which is generated from
`math-labs/content.json`. Do not edit content.json or the HTML by hand. To
change an experiment's text, formula or controls, write
`math-labs/content-patches/<slug>.json`:

```json
{ "lab-id": {
    "body": ["English text.", "日本語の本文です。"],
    "formula": "\\TeX",
    "params": [["key","English label","日本語ラベル",min,max,step,default],
               ["mode","Mode","モード",0,2,1,0,[["Euler","オイラー"],["RK4","RK4"],["Exact","厳密解"]]]]
} }
```

Only include fields that change. `params` replaces the whole list; keys that
survive should keep their names so shared links keep working. A parameter
with an eighth element becomes a segmented choice (value = min + index·step).
Then run `python3 math-labs/apply_patches.py --slug <slug>` to regenerate that
topic's two pages (it only rewrites the experiment sections).

Writing rules for any text you add, in figures or in patches:
- No em-dashes (—) anywhere. Use commas, colons or full stops.
- Japanese matches these pages' です・ます register.
- Every English string has a Japanese counterpart via `T(en, ja)`.
- No notes about how the page was made, and no AI or tool mentions.
- Keep mathematical claims exact. If a figure is schematic or not to scale,
  say so in a caption. Fix wrong mathematics you find in the existing text.

## Design bar

Each experiment should show the mechanism, not a decoration of it: the thing a
reader should notice must be visually dominant, labelled on the figure, and
change visibly as they move a control. Good patterns from the references:
direct manipulation (handles), a finished static state with an optional Play
that animates the process, two linked views (a diagram beside its graph), a
highlighted current point on a curve, readouts that quote the quantities the
formula names. Avoid: empty-looking plots, curves squashed into one corner,
decorative randomness, fake physics (draw the real equations), more than four
colours in one figure, labels colliding with data.

## Checking your work

A local server must be running at the repo root (`python3 -m http.server 8770`),
and Playwright is found with `export NODE_PATH=$(npm root -g)`.

```
node math-labs/dev/shoot.cjs <slug>          # English, light
node math-labs/dev/shoot.cjs <slug> --dark   # dark theme
node math-labs/dev/shoot.cjs <slug> --ja     # Japanese
node math-labs/dev/shoot.cjs <slug> --width=390   # phone
node math-labs/dev/shoot.cjs <slug> --q='lab.key=3&lab.other=0'   # extreme values
python3 math-labs/dev/sheet.py /tmp/x.png /tmp/labshots/<slug>-*.png
```

`shoot.cjs` prints each experiment's readout and flags EMPTY plots, drawing
ERRORs, NONFINITE geometry and page errors, and writes one screenshot per
experiment to /tmp/labshots. Look at every screenshot yourself, in light and
dark, and fix what looks wrong before you finish. Also try the extreme values
of every slider (append `?<labid>.<key>=<value>` to the URL, or temporarily
change defaults) and make sure nothing breaks or leaves the frame.
`node math-labs/verify.cjs` must still pass.

## Practice questions (generators)

Every experiment ends with a practice card: three tiers (Warm-up, Standard,
Challenge), a fresh question on every press of "New question", answer
checking, a hint, a worked solution, and "Show in the figure", which sets the
experiment's controls to the question's case. The fixed question in
content.json is only the no-JavaScript fallback.

Generators live in `math-labs/questions/<slug>.js`, one file per topic,
loaded by app.js after the topic module. Reference: `questions/differential-geometry.js`.

```js
'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig, frac, terms, mat } = P.util;
  Q['lab-id'] = [warmUp, standard, challenge];   // exactly three functions (r) => question
})();
```

A generator receives `r`, a seeded random source: `r.int(a, b)`, `r.nz(a, b)`
(non-zero int), `r.real(a, b, decimals)`, `r.step(a, b, step)`, `r.pick(arr)`,
`r.shuffle(arr)`, `r.sample(arr, k)`, `r.sign()`, `r.chance(p)`, `r.u()`.
It must be pure: same seed, same question. It returns:

- `q: [en, ja]` the prompt. Inline TeX in `$...$` (KaTeX); escape backslashes
  in JS strings (`\\frac`). Plain words outside the dollars.
- `a` the answer:
  - `{type:'num', v, tol?, rel?, unit?:[en,ja], show?}` readers may type
    `3/4`, `2pi`, `sqrt(3)/2`, `1.6e-19`. Default tolerance is 0.5% relative;
    set `tol` (absolute) when the prompt asks for decimals, matched to them.
    `show` is TeX for the exact value when it is nicer than the decimal.
  - `{type:'int', v}` exact integers (counts, orders, indices).
  - `{type:'choice', opts:[[en,ja],...], v}` options are shuffled unless
    `fixed:true` (use fixed for yes/no and ordered options). Wrong options
    must be the mistakes people actually make, not filler.
  - `{type:'tuple', v:[...], labels:['$x$','$y$'], tol?}` several numbers.
  - `{type:'expr', v:'6x/(1+9x^4)^(3/2)', vars:['x'], dom?:{x:[lo,hi]}, const?:true, lhs?:[en,ja]}`
    a symbolic answer, checked by evaluating at random points in `dom`
    (default 0.35..2.15, so keep it inside the domain where both sides are
    defined). `const:true` accepts any antiderivative. Use symbolic answers
    wherever the natural answer is a formula: derivatives, densities,
    transforms, solutions of ODEs, closed forms of sums.
- `sol: [[en, ja], ...]` the worked solution, 2 to 5 steps, each a full
  sentence with the numbers substituted. The final "Answer:" line is added
  automatically. The last step should say what the result means.
- `hint: [en, ja]` optional; the idea, not the answer.
- `set: {key: value}` optional; control values (keys from the experiment's
  params, inside their ranges and on their steps) that put this case on the
  figure. Use it whenever the question's case is reachable by the controls.

Writing the three tiers:
- Warm-up: one idea, one step: read off, recall the definition, a single
  substitution. Still generated (vary the numbers and the form).
- Standard: the experiment's own formula used properly, 2 to 3 steps, the
  kind of thing the readout computes.
- Challenge: reasoning, not just arithmetic: a symbolic answer, an inverse
  problem (find the parameter that produces an effect), a limiting case, a
  classification with a justification, or two ideas combined.
- Each tier should draw from more than one question form where the topic
  allows (pick a form with `r.int(0, k)`), so pressing "New question" ten
  times does not feel like the same question.
- Numbers chosen so the arithmetic is clean where exactness matters and
  realistic where physics matters (real constants, sensible magnitudes,
  `sig()` for significant figures).
- Compute every answer in the generator from first principles; never
  hard-code an answer. Where the topic module exports a model
  (`window.LabModels[slug]`), you may cross-check against it in the checks
  file, but generators must not depend on topic modules (they load separately).
- Japanese in です・ます, same register as the pages; no em-dashes in either language.

Check with `node math-labs/verify-practice.cjs <slug>`: it runs every tier
for 120 seeds and fails on exceptions, NaN, a missing language, TeX that
KaTeX cannot render, an answer its own checker rejects, `set` keys that do
not exist or fall outside their range, or too little variety.

## 3D experiments

`math-labs/three3d.js` adds a three.js scene to an experiment, through the
site's lab-kit runtime (WebGPU, WebGL 2 fallback). Use it where the object is
genuinely three-dimensional and depth carries meaning: surfaces and their
curvature, curves in space, rotations and orientation, fields and flows in
space, orbitals and densities in 3D, lattices and crystals, mechanisms,
spacetime with one space dimension as a sheet, or a function of two
variables whose shape (not just its values) is the point. Do not use it for
graphs of one variable, tables, 2D diagrams, or anything that reads better
flat. A painter's-algorithm SVG pseudo-3D figure is the clearest sign a lab
should move to 3D. Reference: `topics/differential-geometry.js`
(`geodesic-surface`, `gaussian`).

```js
D['lab-id'] = {
  three: true,                      // the runtime keeps the scene between renders
  render(ctx, v) {
    const st = ctx.state;
    if (!st.frame || !st.frame.isConnected) {          // build containers once
      ctx.host.replaceChildren();
      st.frame = L.h('div', '', ctx.host);
      st.v3 = L.h('div', '', st.frame);                // or a .lab-row with a 2D column beside it
      st.leg = L.h('div', '', st.frame);
    }
    L.view3d(ctx, v, {
      host: st.v3, aspect: 0.62, maxH: 520, camera: [5, -6, 4], target: [0, 0, 0], fov: 35,
      init(S) { st.flat = false; /* build meshes once; keep references on st */ },
      update(S, v) { /* move/recompute from v; also redraw 2D side panels, legend, readout */ },
      fallback(ctx, v) { st.flat = true; /* draw the old 2D figure into st.v3 */ },
    });
    if (!st.__v3 && !st.flat) { /* still loading: draw side panels and readout now */ }
  },
};
```

Always keep a 2D fallback (the previous figure is ideal): it runs when the
browser has neither WebGPU nor WebGL 2, and with `?flat` in the URL.
Coordinates are mathematical with **Z up**. `S` provides:

- `S.surface(fn(u, v) -> [x, y, z], {u:[a,b], v:[a,b], nu, nv, c, colour(u, v, p) -> THREE.Color, wire, wireEvery, opacity, rough, metal, coat})` with `.update(fn)`
- `S.graph(f(x, y), {x, y, nu, nv, zRange, cmap, colour, wire})` z = f(x, y), with `.update(f)`
- `S.tube(points | fn(t), {r, c, closed, t:[a,b], n, glow})` with `.update(points)`
- `S.lines(segments, {c, opacity})`, `S.polyline(points, o)` thin lines, many at once, `.update(...)`
- `S.arrow(from, vec, {c, r, glow})` with `.set(from, vec)`; `S.sphere(p, r, {c})` with `.at(p)`
- `S.points(pts, {c, r, max, colours, radii})` instanced spheres, `.update(pts, colours, radii)`
- `S.axes({len, names, neg, only})`, `S.floor({size, n, z})`, `S.disc(c, n, r)`, `S.box(size, c)`
- `S.label(text, p, {math, small, c, align:'end'|'middle'})` DOM text pinned to a point, `.set(p, text)`
- `S.handle(p, {plane:[n, q] | sphere:[c, r], bounds, onDrag(vec3) -> p?, c, label})` direct
  manipulation in 3D; onDrag may return the constrained point. Prefer it to sliders where the
  reader would grab the thing itself; call `ctx.set` or `ctx.redraw()` from it.
- `S.mat(token, opts)`, `S.colour(token)`, `S.cmap.seq|warm|div|phase` (THREE.Color),
  `S.cols` theme colours, `S.THREE`, `S.scene`, `S.camera`, `S.add(obj)`
- `S.animate((dt, t) => more)` per-frame callback; return false to stop. Respect `S.reduced()`:
  under reduced motion draw the finished state instead of animating.
- `S.invalidate()` after changing anything by hand (the helpers do it for you).

Rendering is on demand: frames are drawn only when something changes, the
reader drags, or an animation runs. Budget: under ~200k triangles and
~40 tubes per scene; surfaces rarely need more than 140 × 140. Colours come
from the same tokens as the 2D kit, so light and dark both work; the theme
switch rebuilds the scene. Labels sparingly: the three or four things a reader
must identify. Readouts, legends and captions stay HTML, outside the canvas.

Check with `node math-labs/dev/shoot3d.cjs <slug>` (prints the backend:
webgl2 in the sandbox, webgpu on a real GPU) and look at every screenshot,
light and dark, at 1100 and 390 px width.

Notes from the upgrade:
- `S.label(text, p, {occlude: true})` hides a label while a mesh is between it and the camera.
- `S.handle(p, {facing: true})` drags in the plane through the handle facing the camera.
- `S.points` with `colours` uses a white base material, so the colours come through unmultiplied.
- The view3d `aspect` is fixed when the scene is created; read `ctx.host.clientWidth` before calling view3d if a phone needs a taller aspect.
- Practice text supports inline `$...$` only, not `$$...$$`; write arrays inline.
- `expr` answers are checked at random real points, so avoid `!` and binomials in them.
- `handle.setPlane(normal, point)` moves a handle's drag plane; `S.look(position, target)` re-aims the camera.
- `S.surface(..., {side: THREE.FrontSide | THREE.BackSide})` draws one face only (two-coloured ribbons).
- A `fallback` must not call `ctx.redraw()` synchronously; defer it with `setTimeout`.
- `handle.setColour(token)`, `label.show(bool)`; `S.look(pos, target, true)` also makes that the Reset view position.
- view3d always uses the newest options when the 3D module finishes loading, so `update` may close over `v`.
- `S.settle(ms)` keeps rendering while shaders compile (scenes now also settle each time they scroll into view); `S.light(k)` scales every light, for surfaces painted with colour maps; `S.arrow(..., {opacity})`; `handle.enable(bool)`.
- Answers with `unit: ['%', '%']` accept a typed % sign.
