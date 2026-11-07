// Interval statistics that run live in the browser. Formulas mirror
// level-3-deep/analyze_deep.py (wilson, mcnemar_exact).

export const Z95 = 1.959964;

// Wilson score interval for k successes in n trials.
export function wilson(k, n, z = Z95) {
  const p = k / n, den = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / den;
  const half = (z / den) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

// Two-sided exact McNemar p: a binomial(b + c, 1/2) test on the discordant pairs.
// Probabilities are built term by term, exact enough for b + c up to 1000.
export function mcnemarExact(b, c) {
  const n = b + c;
  if (n === 0) return 1;
  let term = 2 ** -n, tail = 0;
  for (let i = 0; i <= Math.min(b, c); i++) { tail += term; term *= (n - i) / (i + 1); }
  return Math.min(1, 2 * tail);
}
