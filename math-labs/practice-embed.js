'use strict';
/* practice-embed.js: practice cards on pages outside the lab kit.
 *
 * A page includes KaTeX, /math-labs/labs.css, /math-labs/practice.js, its
 * generators (/math-labs/questions/standalone/<page>.js, which fill
 * window.LabQuestions) and this file, all with `defer`, and marks each card:
 *
 *   <div class="practice" data-practice="<id>"><details>...fallback...</details></div>
 *
 * Cards may sit inside a `.math-wrap` (which carries the colour tokens) or
 * inside `.practice-embed`, a lighter wrapper that only sets the tokens.
 * A page that can show a question's case may define
 * window.PracticeHosts[id] = { set(values) {...} }, and the card then offers
 * "Show in the figure".
 */
(() => {
  const go = () => {
    const P = window.Practice; if (!P) return;
    document.querySelectorAll('[data-practice]').forEach((el) => {
      const host = window.PracticeHosts?.[el.dataset.practice];
      if (host && !el.closest('section')?.__getCtx) {
        const sec = el.closest('section') || el.parentElement;
        sec.__getCtx = () => ({ set: (k, v, silent) => { (sec.__pending ||= {})[k] = v; if (!silent) { host.set(sec.__pending); sec.__pending = {}; } } });
      }
    });
    P.mountAll();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
