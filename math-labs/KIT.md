# Math encyclopedia lab kit

The 30 topic pages (`/<slug>/` and `/ja/<slug>/`) share one runtime. Each page
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
