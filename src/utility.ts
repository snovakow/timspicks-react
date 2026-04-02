export const roundToPercent = (num: number, places: number): string => {
  return (num * 100).toFixed(places) + "%";
};

// Poisson distribution chance of 0 goals: e^(−μ)
// Chance of at least one goal: 1 − e^(−μ)
const poisson = (x: number): number => {
  return 1 - Math.exp(-x);
}

export const poissonChance = (x: number, precision: number): string => {
  const chance = 1 - Math.exp(-x);
  return roundToPercent(chance, precision);
}

export const probabilityToAmerican = (chance: number | null): string => {
  if (chance === null || chance <= 0) return "-";
  const decimal = 1 / chance;
  const american = decimal >= 2
    ? Math.round(100 * (decimal - 1))
    : Math.round(100 / (1 - decimal));
  return (american > 0 ? "+" : "") + american;
};
