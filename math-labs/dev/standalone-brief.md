# Brief: upgrade the standalone math-encyclopedia pages (practice generators + 3D where it suits)

Repo: /home/claude/theisegoria.github.io (a static GitHub Pages site; work only there). A local server runs on port 8770 serving the repo root (if `curl -s localhost:8770/ -o /dev/null` fails, start one: `cd /home/claude/theisegoria.github.io && (python3 -m http.server 8770 >/dev/null 2>&1 &)`).

These pages are listed in the math encyclopedia but are NOT built by the lab kit: each is its own hand-made app (its own index.html, app.js, style.css, sometimes a vendor folder). Your job is to bring them up to the same standard as the 72 kit topics, which now have three-tier generated practice questions and, where the subject is spatial, beautiful three.js 3D scenes.

READ FIRST: math-labs/KIT.md sections "Practice questions (generators)" and "3D experiments" (and the notes at the end), a reference generator file (math-labs/questions/differential-geometry.js and math-labs/questions/riemann-surfaces.js), and math-labs/practice-embed.js (how practice cards are embedded in non-kit pages). Read CLAUDE.md in the repo root for house style (no em-dashes, no AI/process notes, Japanese register rules).

## For each page assigned to you

1. Read the page(s) fully (HTML, its JS, its content) in both languages where a Japanese edition exists (route_ja in tools/math-encyclopedia.json). Look at it rendered: `cd /home/claude/theisegoria.github.io && export NODE_PATH=$(npm root -g)` then write a tiny Playwright script in your scratch dir, or adapt math-labs/dev/shoot3d.cjs (it only handles kit pages). ALWAYS wrap browser runs in `flock /tmp/claude-0/shoot.lock ...` (the machine has 2 CPUs shared with other workers).

2. PRACTICE: write math-labs/questions/standalone/<page-key>.js (page-key: the slug, or for explore/foo.html use explore-foo). It registers window.LabQuestions[id] = [warmUp, standard, challenge] for 2 to 4 ids per page, one per major theme of the page (ids unique across the whole site; prefix them with the page key). Same standard as KIT.md: varied forms per tier, answers computed in the generator, hints, worked solutions ending with what the result means, `expr` answers wherever the natural answer is a formula, bilingual [en, ja] text (Japanese です・ます, natural), no em-dashes, inline $...$ TeX only. `set` only works if the page defines window.PracticeHosts[id].set(values) (see practice-embed.js); add such a host only where it is easy and meaningful (e.g. the page already has sliders you can drive), otherwise omit `set`.
   Embed the cards in the page (both languages where they exist), near the end of the main content, before any sources/footer block and NOT inside the ISEGORIA shell marker blocks:
   ```html
   <section class="practice-embed" aria-labelledby="pe-h">
     <h2 id="pe-h">Practice</h2>   (ja: 練習問題)
     <p class="pe-lede">One sentence on what to practise; questions are generated fresh at three levels.</p>
     <h3 class="pe-h">Theme name</h3>
     <div class="practice" data-practice="<id>"><details><summary>A short fixed question</summary><p>Its answer.</p></details></div>
     ...
   </section>
   ```
   and in <head> (only those not already present; the page may already load KaTeX from its own vendor folder, which is fine to reuse):
   ```html
   <link rel="stylesheet" href="/analysis-atlas/vendor/katex.min.css">
   <link rel="stylesheet" href="/math-labs/labs.css?v=20261028">
   <script defer src="/analysis-atlas/vendor/katex.min.js"></script>
   <script defer src="/math-labs/practice.js?v=20261028"></script>
   <script defer src="/math-labs/questions/standalone/<page-key>.js?v=20261028"></script>
   <script defer src="/math-labs/practice-embed.js?v=20261028"></script>
   ```
   If the page sets a dark background or its own colour scheme, make sure the cards are legible in light and dark (labs.css tokens use light-dark()).
   If labs.css styles clash with the page (it styles generic classes only under .math-wrap / lab-*, pr-*, practice*), fix it locally in the page's own CSS.

3. 3D: decide whether any part of the page would be genuinely clearer and more beautiful in 3D (solids and their volumes, cones and sections, surfaces, the Riemann sphere, gradient fields on surfaces, etc.). If so, add a three.js scene using the site's lab kit (assets/lab-kit/lab-kit.js mountLab, see CLAUDE.md "Interactive explainers: the lab kit" and how math-labs/three3d.js uses it; you may import math-labs/three3d.js's `create(host, opts)` directly as an ES module: `import { create } from '/math-labs/three3d.js'` with the import map for three r186 in <head> exactly as kit topic pages have it, e.g. copy from /differential-geometry/index.html). Keep the page's existing figures as the fallback when WebGL/WebGPU is unavailable. Do not force 3D where the page is about flat or symbolic things. Mathematical accuracy is non-negotiable.

4. Fix clear mathematical or visual errors you notice on these pages.

Note: math-labs/three3d.js now renders through the photographic studio (HDRI light, contact shadows, glossy materials; `S.mat(c, { glass: true, thickness, ior })` for real glass). The sandbox has no GPU and the soft shadow is very slow there: load pages with `?shadows=0` for screenshots. Another worker is upgrading three3d.js line rendering and 2D anti-aliasing at the same time; if a shared-file change breaks your page, wait a few minutes and retry before reporting it.

## Checks (all must pass)
- `node math-labs/verify-practice.cjs standalone`: zero failures (it checks every file in questions/standalone).
- No console errors on the page (other than the expected "No available adapters" WebGPU warning in this sandbox), in English and Japanese, light and dark, 1100 px and 390 px. LOOK at screenshots of the practice section and any 3D scene with the Read tool.
- No em-dashes in anything you add.

## Hard rules
- Only edit: your pages (and their own JS/CSS/assets), their Japanese editions, and math-labs/questions/standalone/<page-key>.js. Do NOT edit shared files (math-labs/*.js, labs.css, assets/, tools/, build.py, KIT.md, other pages). If you need a shared change, describe it in your report.
- Do NOT run git, build.py, integrate.py or tools/*.py (the coordinator does).
- Do not touch the ISEGORIA marker blocks in pages.

## Final report (concise)
Per page: what practice themes/ids you added (one line each), whether anything went 3D (one line), fixes made, check results, and any shared-kit issues.
