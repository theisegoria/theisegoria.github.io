// node --test bose-customtune/model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from './model.js';

test('the patent example tones are exact FFT bins at 48 kHz / 1024', () => {
  assert.equal(M.F0, 46.875);
  // the chime is the patent's example list, tone for tone, and every tone is a whole bin
  assert.deepEqual(M.CHIME, M.PATENT_TONES);
  for (const f of M.CHIME) assert.equal(f / M.F0, Math.round(f / M.F0), f);
  assert.ok(M.CHIME.length >= 10 && M.CHIME[0] > 45 && M.CHIME.at(-1) < 17000);
  const hi = M.CHIME.filter((f) => f > 1000);
  // "a plurality" above 1 kHz at a quarter octave or closer; the patent's own
  // 1219 -> 1500 step is wider than that, so not every step has to be.
  let close = 0;
  for (let i = 1; i < hi.length; i++) if (hi[i] / hi[i - 1] <= 2 ** 0.25 + 1e-3) close++;
  assert.ok(close >= hi.length / 2, close);
});

test('the chime period is normalised', () => {
  const p = M.chimePeriod();
  assert.equal(p.length, 1024);
  assert.ok(Math.max(...p.map(Math.abs)) <= 1 + 1e-6);
});

test('the nominal ear needs no correction', () => {
  for (const F of Object.values(M.FORMS)) {
    const ct = M.customTune(F, M.NOMINAL.L, M.NOMINAL.leak, { noiseDb: 0 });
    for (const t of ct.theta) assert.ok(Math.abs(t) < 0.3, t);
  }
});

test('a leak costs bass at the microphone, more in an earbud', () => {
  const o = M.FORMS.overear, e = M.FORMS.earbud;
  assert.ok(M.db(M.G(o, 50, 0.025, 1).gsd) < M.db(M.G(o, 50, 0.025, 0.1).gsd) - 8);
  assert.ok(M.db(M.G(e, 50, 0.025, 1).gsd) < M.db(M.G(e, 50, 0.025, 0.1).gsd) - 20);
});

test('the eardrum sees a quarter-wave peak near c/4l', () => {
  const F = M.FORMS.overear;
  const fq = M.quarterWave(F, 0.025);
  assert.ok(Math.abs(fq - 3430) < 1);
  const fs = M.grid(1500, 6000, 400);
  const peak = fs.reduce((b, f) => (M.db(M.G(F, f, 0.025, 0.1).ged) > M.db(M.G(F, b, 0.025, 0.1).ged) ? f : b));
  assert.ok(Math.abs(peak - fq) / fq < 0.25, peak);
});

test('designed loop: crossover near target, ~45-60 degrees of phase margin', () => {
  for (const F of Object.values(M.FORMS)) {
    const m = M.margins(F, M.NOMINAL.L, M.NOMINAL.leak, null);
    assert.ok(Math.abs(m.fc - F.fc) / F.fc < 0.1, m.fc);
    assert.ok(m.pm > 40 && m.pm < 70, m.pm);
  }
});

test('a short canal in an earbud destabilises the fixed filter and CustomTune rescues it', () => {
  const F = M.FORMS.earbud;
  const before = M.margins(F, 0.018, 0.1, null);
  const ct = M.customTune(F, 0.018, 0.1);
  const after = M.margins(F, 0.018, 0.1, ct.theta);
  assert.ok(before.pm < 0, before.pm);
  assert.ok(after.pm > 30, after.pm);
});

test('a leaky earbud gets bass cancellation back', () => {
  const F = M.FORMS.earbud;
  const ct = M.customTune(F, 0.025, 0.6);
  assert.ok(M.ancBand(F, 0.025, 0.6, ct.theta) < M.ancBand(F, 0.025, 0.6, null) - 2);
});

test('the population EQ fixes a leak and a short canal in an earbud', () => {
  const F = M.FORMS.earbud;
  for (const [L, x] of [[0.025, 0.6], [0.02, 0.1], [0.031, 0.3]]) {
    const b = M.eardrumError(F, L, x, false), a = M.eardrumError(F, L, x, true);
    assert.ok(a < b * 0.6, `${L},${x}: ${b} -> ${a}`);
  }
});

test('over-ear: the EQ fixes the leak but cannot see the canal', () => {
  const F = M.FORMS.overear;
  const bl = M.eardrumError(F, 0.025, 0.8, false), al = M.eardrumError(F, 0.025, 0.8, true);
  assert.ok(al < bl * 0.6, `leak ${bl} -> ${al}`);
  const bc = M.eardrumError(F, 0.031, 0.1, false), ac = M.eardrumError(F, 0.031, 0.1, true);
  assert.ok(ac > bc * 0.6, `canal ${bc} -> ${ac}`);
});
