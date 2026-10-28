# Brief: add one new topic to the math encyclopedia (kit topic, 3D + practice generators)

Repo: /home/claude/theisegoria.github.io (static GitHub Pages site; work only there). A local server
on port 8770 serves the repo root; if `curl -s localhost:8770/ -o /dev/null` fails, start one:
`cd /home/claude/theisegoria.github.io && (setsid python3 -m http.server 8770 >/dev/null 2>&1 &)`.

Two other workers are adding topics at the same time and four more are editing standalone pages, so
follow the coordination rules below exactly.

## Read first
- CLAUDE.md (repo root): house style. No em-dashes anywhere. No AI or process notes on pages.
  Japanese text in です・ます調, natural.
- math-labs/WEEKLY.md sections 2 (files to write), 3 (the visual standard) and 5 (visual QA).
  Ignore its preflight, git, gate and ship steps: the coordinator does those.
- math-labs/KIT.md, especially "Practice questions (generators)" and "3D experiments" (3D scenes
  now render through the photographic studio automatically: HDRI light, contact shadows, glossy
  materials; `S.mat(c, { glass: true, thickness, ior })` gives real glass for shells and spheres).
- The reference topics, built the same way last round: math-labs/additions/034-gravitational-waves.py,
  035-robot-kinematics.py, 036-riemann-surfaces.py, with their topics/, checks/ and questions/ files.

## What you write (slug S, number NNN given in your assignment)
1. math-labs/additions/NNN-S.py (exactly one add_expansion call; real reachable source URL, check with curl)
2. math-labs/topics/S.js (three labs + window.LabModels['S'])
3. math-labs/checks/S.cjs (6+ checks that can fail)
4. math-labs/questions/S.js (three generators per lab, KIT.md standard, `expr` answers where natural, `set` where the controls can show the case)
Lab ids must be unique across all topics (grep math-labs/content.json and math-labs/additions/).
At least one lab is a three.js scene through L.view3d with a 2D view beside it (`lab-row is-wide`), a 2D
fallback, and direct manipulation (S.handle). Mathematical and physical accuracy is non-negotiable.

## Coordination rules
- Do NOT edit any shared file: math-labs/graph.js, tools/math-encyclopedia.json, math-labs/queue.json,
  math-labs/*.js (experience, three3d, practice, app), labs.css, build.py, integrate.py, assets/, tools/,
  KIT.md, WEEKLY.md, other topics. If you need a shared change, describe it in your report.
- Do NOT run git, integrate.py or anything in tools/.
- Build with the lock: `cd /home/claude/theisegoria.github.io && flock /tmp/claude-0/build.lock python3 math-labs/build.py`
  (this generates S/index.html and ja/S/index.html; it rewrites all kit pages, which is fine).
- Wrap every browser run in `flock /tmp/claude-0/shoot.lock ...` (2 shared CPUs).
- The sandbox has no GPU: 3D renders through WebGL 2 on a software rasteriser, and the soft key shadow
  is very slow there. For QA shots pass `--q=shadows=0`, e.g.
  `export NODE_PATH=$(npm root -g); flock /tmp/claude-0/shoot.lock node math-labs/dev/shoot3d.cjs S --q=shadows=0 --out=/tmp/claude-0/shots/S`
  Shoot light, `--dark`, `--ja` and `--width=390`, and LOOK at the PNGs with the Read tool (plots and
  practice cards). Fix and reshoot until labels do not collide, nothing leaves the frame, dark mode is
  legible, Japanese does not overflow and the phone layout stacks.

## Checks (all must pass before you report)
- `node math-labs/verify.cjs` (whole kit, includes your checks file)
- `node math-labs/verify-practice.cjs S` (zero failures)
- No page errors in the shots other than the expected "No available adapters" warning.

## Final report (concise)
- Slug, titles (en/ja), group, the three lab ids with one line each, which went 3D.
- For graph.js: PREREQ entry (existing slugs) and CROSS entry (1 to 3 existing slugs).
- For tools/math-encyclopedia.json: one-sentence hub description en and ja, and which existing entry it should follow in its group.
- Check results, and any shared-kit issues you hit.
