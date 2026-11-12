// Keyboard switches: the linear curve is the stated straight line and its work the exact trapezoid; press lies above
// release everywhere; the tactile peak comes before the actuation point; bounce gaps form a geometric series; a long
// enough debounce reports exactly one press, eager with no added delay and deferred late by the debounce time; the
// matrix shows the rectangle ghost without diodes, none with them, and none for keys sharing no wires.
module.exports = (M, { ok, near }) => {
  near(M.spring(0), 30, 1e-12); near(M.spring(2), 45, 1e-12); near(M.spring(4, 60), 80, 1e-12); near(M.fPress(2, 0), 48, 1e-12); near(M.fPress(4, 0), 63, 1e-12); near(M.fRelease(2, 0), 42, 1e-12);
  { const w = M.work(0); near(w.press, 0.01 * (30 * 4 + 7.5 * 8 + 3 * 4), 1e-9); near(w.back, 0.01 * (30 * 4 + 7.5 * 8 - 3 * 4), 1e-9); near(w.lost, 0.24, 1e-9); }
  for (const t of [0, 1, 2]) { for (let x = 0; x <= 4; x += 0.05) ok(M.fPress(x, t) > M.fRelease(x, t), 'pressing takes more force than the key returns'); const w = M.work(t); ok(w.lost > 0 && w.back > 0 && w.press > w.back, 'energy is lost, never gained'); near(M.fPress(0, t), 33, 0.2); near(M.fPress(4, t), 63, 0.2); }
  ok(M.peakBefore(1).x < 2 && M.peakBefore(1).f > M.fPress(2, 1) + 10, 'tactile peak before actuation'); ok(M.peakBefore(2).f > M.peakBefore(1).f, 'clicky peak is higher'); near(M.peakBefore(1).f, 60.5, 0.2); near(M.peakBefore(2).f, 66.4, 0.2);
  ok(M.work(1).lost > M.work(0).lost && M.work(2).lost > M.work(1).lost, 'bumps cost energy'); near(M.peakBefore(1, 45, 1.5).x, M.peakBefore(1).x - 0.5, 0.02);
  const ed = M.bounceEdges(0.8, 0.55); ok(ed.length % 2 === 1 && ed.every((t, i) => i === 0 || t > ed[i - 1]), 'edges ordered, ending closed'); for (let i = 1; i + 3 < ed.length; i += 2) near((ed[i + 3] - ed[i + 2]) / (ed[i + 1] - ed[i]), 0.55, 1e-9);
  { let gaps = 0; for (let i = 1; i + 1 < ed.length; i += 2) gaps += ed[i + 1] - ed[i]; ok(gaps < 0.8 / (1 - 0.55) && gaps > 0.8 / (1 - 0.55) - 0.06, 'open time is the geometric sum, less the cut-off tail'); }
  near(M.settleTime(ed), 5.18, 0.01); ok(M.rawAt(ed, 0.3) && !M.rawAt(ed, 0.9) && M.rawAt(ed, 30), 'closed, open, finally closed'); ok(!M.rawAt(ed, -1), 'open before contact');
  ok(M.debounce(ed, 0, 1000, 0).presses > 1, 'no debounce: several presses'); for (const N of [6, 8, 12]) { const a = M.debounce(ed, N, 1000, 0), b = M.debounce(ed, N, 1000, 1); ok(a.presses === 1 && b.presses === 1, 'one press when the debounce outlasts the bounce'); ok(a.first < 1 && b.first >= N && b.first - a.first >= N - 1, 'eager is immediate, deferred is late by the debounce time'); }
  ok(M.debounce(ed, 3, 1000, 0).presses === 1 && M.debounce(ed, 2, 1000, 0).presses === 2, 'eager threshold near 3 ms'); near(M.debounce(ed, 5, 1000, 1).first, 8.37, 0.01);
  { const w = M.bounceEdges(2, 0.75); near(M.settleTime(w), 13.74, 0.01); ok(M.debounce(w, 5, 1000, 0).presses === 2, 'a worn switch types twice'); ok(M.settleTime(w) > M.settleTime(ed), 'worn switches bounce longer'); }
  const g = M.matrixRead(4, 5, [[1, 0], [1, 1], [2, 1]], false); ok(g.ghosts.length === 1 && g.ghosts[0][0] === 2 && g.ghosts[0][1] === 0 && g.read.size === 4, 'rectangle ghost'); ok(M.matrixRead(4, 5, [[1, 0], [1, 1], [2, 1]], true).ghosts.length === 0, 'diodes remove it');
  ok(M.matrixRead(4, 5, [[0, 0], [1, 1], [2, 2]], false).ghosts.length === 0, 'no shared wires, no ghost'); ok(M.matrixRead(4, 5, [[0, 0], [0, 3]], false).ghosts.length === 0 && M.matrixRead(4, 5, [], false).read.size === 0, 'two keys never ghost');
  ok(M.matrixRead(4, 5, [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]], false).ghosts.length === 4, 'a chain of keys ghosts the whole block');
  ok(M.matrixPins(20) === 9 && M.matrixPins(104) === 21 && M.matrixPins(100) === 20 && M.charliePins(104) === 11 && M.charliePins(20) === 5 && M.charliePins(6) === 3, 'pin counts');
};
