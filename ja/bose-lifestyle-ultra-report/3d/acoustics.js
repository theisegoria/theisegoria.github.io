// A geometric ray illustration, independent of speaker DSP and radiation patterns.
export function roomGeometry(product, placement, ceiling) {
  const source = [0, product === 'homepod' ? 0.84 : 0.98, placement === 'open' ? 0 : -0.91];
  const listener = [0, 1.1, 2.2];
  const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));
  let bounce;
  if (product === 'bose') {
    const t = (ceiling - source[1]) / (2 * ceiling - listener[1] - source[1]);
    bounce = [0, ceiling, source[2] + t * (listener[2] - source[2])];
  } else {
    // Image of the receiver across the left wall, x = -1.8 m.
    bounce = [-1.8, (source[1] + listener[1]) / 2, (source[2] + listener[2]) / 2];
  }
  const blocked = product === 'bose' && placement === 'shelf';
  const directLength = distance(source, listener);
  const reflectedLength = distance(source, bounce) + distance(bounce, listener);
  const excess = reflectedLength - directLength;
  let obstruction;
  if (blocked) {
    const t = (1.15 - source[1]) / (bounce[1] - source[1]);
    obstruction = [0, 1.15, source[2] + t * (bounce[2] - source[2])];
  }
  return { source, listener, bounce, directLength, reflectedLength, excess, delayMs: 1000 * excess / 343, blocked, obstruction };
}
