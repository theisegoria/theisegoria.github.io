# Brief: upgrade math-encyclopedia topics (3D where it suits + practice generators)

You are upgrading topics of the math/physics/engineering encyclopedia on Ben Haire's personal site (a static GitHub Pages site). Repo clone: /home/claude/theisegoria.github.io (work only there). A local server is already running on port 8770 serving the repo root (if `curl -s localhost:8770/ -o /dev/null` fails, start one: `cd /home/claude/theisegoria.github.io && (python3 -m http.server 8770 >/dev/null 2>&1 &)`).

READ FIRST, fully: math-labs/KIT.md (especially the two new sections at the end, "Practice questions (generators)" and "3D experiments"), then the two references:
- math-labs/questions/differential-geometry.js (generator reference)
- math-labs/topics/differential-geometry.js, labs `geodesic-surface` and `gaussian` (3D reference: containers built once, view3d with init/update/fallback, 2D panel beside it, legend/readout outside the canvas)
- three topics built entirely in the new style, good further references: math-labs/topics/gravitational-waves.js, robot-kinematics.js, riemann-surfaces.js with their questions/*.js (3D with animators, handles on planes and spheres, 2D panels linked to the 3D view).
- skim math-labs/three3d.js and math-labs/practice.js for the exact APIs.

## Your job, for each topic assigned to you

1. Read its topic module math-labs/topics/<slug>.js, its content (python3 -c "import json;d=json.load(open('math-labs/content.json'));t=[x for x in d if x['slug']=='<slug>'][0];print(json.dumps(t,ensure_ascii=False,indent=1))") and its content patch math-labs/content-patches/<slug>.json if present (patch fields override content.json; `params` there is authoritative). Look at the current page (screenshots, below) so you know what the reader sees.
2. PRACTICE: write math-labs/questions/<slug>.js with exactly three generators (warm-up, standard, challenge) for EVERY experiment of the topic, to the standard in KIT.md. These replace the old single fixed question. Make them genuinely good teaching: varied forms per tier, clean numbers where exactness matters, realistic physical values where physics matters, correct mathematics computed from first principles in the generator, solutions that explain and end with what the result means, hints that give the idea not the answer, symbolic (`expr`) answers wherever the natural answer is a formula, `set` to show the case in the figure whenever the controls can reach it (respect each param's range and step), multiple-choice distractors that are real misconceptions. Japanese in です・ます, natural (not word-for-word), no em-dashes (—) anywhere, no mention of AI or how anything was made.
3. 3D: decide, lab by lab, whether 3D would genuinely make it clearer and more beautiful (see "3D experiments" in KIT.md: real 3D objects, surfaces whose shape matters, rotations, space curves, fields in space, densities/orbitals, lattices, mechanisms; painter's-algorithm fake-3D SVG is the strongest signal). Convert the ones that qualify; leave the rest 2D. Most topics will have 0 to 2 labs that qualify; do not force it. A converted lab must keep: its controls and URL parameters (or remove a control only if 3D orbiting makes it redundant, via the content patch), its readout and legend, its 2D panels where they carry information, and a fallback that draws the previous 2D figure. Make the 3D beautiful: good camera framing, the important object visually dominant, sensible materials, labels on the 3-4 things that matter, direct manipulation with S.handle where the reader would grab something, animation via S.animate where the process is the point (finished state under reduced motion). Mathematical/physical accuracy is non-negotiable: draw the real equations.
   You may also fix clear visual or mathematical problems you notice in 2D labs of your topics, but the two jobs above come first.
4. Rows with a 3D figure beside a 2D graph can use the class `lab-row is-wide` (stacks on phones). If you change controls or text, edit math-labs/content-patches/<slug>.json (see KIT.md "Controls and content") and regenerate that topic's two pages with `python3 math-labs/apply_patches.py --slug <slug>`. If you do not change content, do not run it.

## Checks (all must pass before you finish)

- `node math-labs/verify-practice.cjs <slug>` for each of your slugs: zero failures.
- `node math-labs/verify.cjs` must still pass (it loads topic modules for the models; do not break `window.LabModels` exports).
- `node -e "new Function(require('fs').readFileSync('math-labs/topics/<slug>.js','utf8'))"` syntax check after edits.
- Screenshots: ALWAYS run through the lock, because the machine has 2 CPUs shared by many workers:
  `cd /home/claude/theisegoria.github.io && export NODE_PATH=$(npm root -g) && flock /tmp/claude-0/shoot.lock timeout 240 node math-labs/dev/shoot3d.cjs <slug> --out=/tmp/claude-0/shots/<slug>`
  add `--dark`, `--ja`, `--width=390` for the other views. It prints, per lab, the backend ([webgl2] means the 3D path ran; [2d] for 2D labs), the readout, the current practice question, and any console errors. LOOK at the PNGs with the Read tool: <slug>-<lab>.png (the figure) and <slug>-<lab>-practice.png (the practice card). Check light and dark and Japanese at least once per converted lab, and phone width once. Fix anything ugly, cut off, overlapping, unreadable, or wrong. Console errors must be zero (the "No available adapters" warning is expected: the sandbox has no WebGPU, so lab-kit uses WebGL 2).
  To try a practice question in a specific tier/seed, open the page with ?<labid>.q=<tier 0-2>-<seed>, e.g. --q=gaussian.q=2-17.

## Hard rules

- Only create/edit these files for YOUR slugs: math-labs/questions/<slug>.js, math-labs/topics/<slug>.js, math-labs/content-patches/<slug>.json, math-labs/checks/<slug>.cjs (if it exists and you change a model), and the two pages <slug>/index.html and ja/<slug>/index.html via apply_patches.py only.
- Do NOT edit shared files (math-labs/practice.js, three3d.js, experience.js, app.js, labs.css, build.py, KIT.md, verify*.cjs, anything in assets/ or tools/), other topics' files, or anything else. If the shared kit lacks something you need or has a bug, work around it locally in your topic and describe the issue precisely in your final report.
- Do NOT run math-labs/build.py, integrate.py, or any tools/*.py, and do NOT run git at all. The coordinating session builds, commits and pushes.
- Keep every page in both languages working. No em-dashes. No notes about how things were made.

## Final report (your last message, concise)

Per slug: which labs went 3D (one line each on what the scene shows) and which stayed 2D and why in a few words; a one-line summary of the generators per lab (forms per tier, answer types used); check results (practice-check count, verify.cjs pass); any kit bugs or limitations you hit, with file/line and a suggested fix.
