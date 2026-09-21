// Checks the claims the Kuru Toga page makes from its own model.
// Run: node --test tests/kuru-toga-model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../kuru-toga/model.js';

const lineWidth = (rate, turn, strokes = 700, d = 0.5, hold = 60) => {
  const tip = M.makeTip({ radius: d / 2 });
  const volume = Math.PI * (d / 2) ** 2 * rate / 1000;
  const w = [];
  for (let i = 0; i < strokes; i++) w.push(M.wearStroke(tip, { holdDeg: hold, volume, turnDeg: turn }).lineWidth);
  const tail = w.slice(-120);
  return { um: 1000 * tail.reduce((a, b) => a + b) / tail.length, tip, w };
};

test('one press and lift is one tooth', () => {
  assert.equal(M.degreesPerStroke(40), 9);
  assert.equal(M.degreesPerStroke(20), 18);
  assert.equal(M.engineState(0.499, 40).turned.toFixed(3), '4.500');
  assert.ok(Math.abs(M.engineState(0.9999, 40).turned - 9) < 1e-3);
  assert.equal(M.engineState(0.2, 40).driving, 'upper');
  assert.equal(M.engineState(0.7, 40).driving, 'lower');
});

test('the flat on a fixed lead is d / sin(theta) long', () => {
  assert.equal(M.flatMajorAxis(0.5, 60).toFixed(2), '0.58');
});

test('a fixed lead wears to its full width', () => {
  assert.ok(Math.abs(lineWidth(2, 0).um - 500) < 5);
});

test('a turning lead converges on a cone of half angle equal to the hold angle', () => {
  for (const hold of [40, 60]) {
    const tip = M.makeTip({ radius: 0.25 });
    const volume = Math.PI * 0.25 ** 2 * 0.25 / 1000;
    for (let i = 0; i < 700; i++) M.wearStroke(tip, { holdDeg: hold, volume, turnDeg: 9 });
    assert.ok(Math.abs(M.coneHalfAngle(tip) - hold) < 2.5, `hold ${hold}: ${M.coneHalfAngle(tip)}`);
  }
});

test('the steady-state table on the page', () => {
  // [lead used per stroke in um, 9 degree width, 18 degree width] as printed
  for (const [rate, w9, w18] of [[0.25, 164, 125], [1, 318, 241], [2, 416, 330], [4, 490, 416], [8, 500, 490]]) {
    assert.ok(Math.abs(lineWidth(rate, 9).um - w9) < 12, `9 deg at ${rate}`);
    assert.ok(Math.abs(lineWidth(rate, 18).um - w18) < 12, `18 deg at ${rate}`);
  }
});
