/**
 * Pure Fatigue math — no Foundry globals, directly unit-testable.
 * See stamina-system-wip.md "This rework's focus: Fatigue" for the design.
 */

export function computeRawStaminaMax(enduranceTotal, mult = 1.0, traitStaminaExtra = 0) {
  const base = Math.max(1, enduranceTotal);
  return Math.floor(base * (mult || 1.0)) + (traitStaminaExtra || 0);
}

export function computeRawResourceMax(statValue, mult = 1.0, bonus = 0) {
  return Math.floor((statValue || 0) * (mult || 1.0)) + (bonus || 0);
}

export function computeFatiguedMax(rawMax, fatigue = 0) {
  return Math.max(0, Math.floor(rawMax) - Math.max(0, fatigue || 0));
}

export function computeShortRestFatigueGain(spentSinceRest = 0) {
  if (!spentSinceRest || spentSinceRest <= 0) return 0;
  return Math.max(1, Math.floor(spentSinceRest / 10));
}

// A single dinner OR sleep tick — isolated as the future cook's-roll hook point.
export function computeLongRestTickHeal(governingStatValue) {
  return Math.floor((governingStatValue || 0) / 10);
}

// One Long Rest use = dinner tick + sleep tick, bundled (confirmed design).
export function computeLongRestFatigueHeal(governingStatValue) {
  return computeLongRestTickHeal(governingStatValue) * 2;
}
