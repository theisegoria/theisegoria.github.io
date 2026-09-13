// NIST Chemistry WebBook, CO2 Henry coefficient convention mol/(kg·bar).
// Approximate ideal dilute pure water; not a SodaStream calibration or total DIC.
export const MOLAR_MASS = 44.0095;
export const AIR_CO2_BAR = 0.00042; // fixed teaching assumption: 420 ppm at 1 bar.
export function henryCoefficient(celsius) {
  if (!Number.isFinite(celsius) || celsius < 4 || celsius > 25) throw new RangeError('Temperature must be 4–25 °C');
  return 0.035 * Math.exp(2400 * (1 / (celsius + 273.15) - 1 / 298.15));
}
export function equilibrium(celsius, pressureBar) {
  if (!Number.isFinite(pressureBar) || pressureBar < 0 || pressureBar > 6) throw new RangeError('CO2 partial pressure must be 0–6 bar');
  return henryCoefficient(celsius) * pressureBar * MOLAR_MASS;
}
export function degas(celsius, initialPressure, progress) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw new RangeError('Progress must be 0–100%');
  const initial = equilibrium(celsius, initialPressure), target = equilibrium(celsius, AIR_CO2_BAR);
  const remaining = target + (initial - target) * (1 - progress / 100);
  return {initial, target, remaining, released:initial - remaining};
}
