/**
 * Per-limb lethality math (pure — no Foundry globals).
 *
 * Each limb carries `lethal` (default true) and `lethalThreshold` (default 1).
 * - Squads/hordes: a member dies once `threshold × individualMax` damage lands on a lethal limb.
 *   Non-lethal limbs keep tracking HP but never remove members.
 * - Individuals: a lethal limb below `−(threshold × max)` starts the dying countdown.
 * With every limb at the defaults, all of this reproduces the standard rules exactly.
 */

/** @returns {boolean} Whether this limb can kill (missing field → true). */
export function isLethal(limb) {
  return limb?.lethal !== false;
}

/** @returns {number} The limb's lethal threshold multiplier (missing/invalid → 1). */
export function lethalThreshold(limb) {
  const t = Number(limb?.lethalThreshold);
  return t > 0 ? t : 1;
}

/**
 * True when any limb deviates from the standard lethality (unchecked, or threshold ≠ 1).
 * @param {Record<string, object>} limbs
 */
export function hasCustomLethality(limbs) {
  return Object.values(limbs ?? {}).some(l => l && (!isLethal(l) || lethalThreshold(l) !== 1));
}

/**
 * HP of a single squad member's share of a limb that must be lost to kill that member.
 * @param {object} limb Limb with `individualMax`.
 */
export function memberLethalUnit(limb) {
  return lethalThreshold(limb) * (limb.individualMax || 0);
}

/**
 * How many squad members this limb's current HP can still support.
 * At threshold 1 this equals the classic `ceil(value / individualMax)`.
 * @param {object} limb Limb with `max` (squad max for the current size) and `individualMax`.
 * @param {number} value The limb's current (possibly pending) HP.
 * @param {number} currentSize Squad size that `limb.max` was computed for.
 * @returns {number} Members supported; Infinity for a non-lethal limb.
 */
export function memberCapacityFromLimb(limb, value, currentSize) {
  if (!isLethal(limb)) return Infinity;
  const unit = memberLethalUnit(limb);
  if (unit <= 0) return currentSize;
  const damage = Math.max(0, limb.max - value);
  return Math.max(0, currentSize - Math.floor(damage / unit));
}

/**
 * The limb's new current HP after the squad size changes from `oldSize` (which `limb.max`
 * reflects) to `newSize`.
 * - Lethal limbs keep only the partial damage on the surviving members (damage % unit).
 * - Non-lethal limbs scale proportionally, clamped to ≥ −newMax.
 * @param {object} limb Limb with `max` (for oldSize) and `individualMax`.
 * @param {number} value The limb's current (possibly pending) HP.
 * @param {number} newSize
 * @param {number} oldSize
 */
export function rescaledLimbValue(limb, value, newSize, oldSize) {
  const indMax = limb.individualMax || 0;
  const newMax = newSize * indMax;
  if (!isLethal(limb)) {
    const scaled = oldSize > 0 ? Math.round(value * newSize / oldSize) : value;
    return Math.min(newMax, Math.max(-newMax, scaled));
  }
  // Classic behavior: a limb already at/below 0 means the squad is wiped on that limb.
  if (newSize <= 0 || value <= 0 && lethalThreshold(limb) === 1) return Math.max(value, -newMax);
  const unit = memberLethalUnit(limb);
  const remainder = unit > 0 ? Math.max(0, limb.max - value) % unit : 0;
  return newMax - remainder;
}

/**
 * HP below which a lethal limb starts the dying countdown on an individual.
 * @param {object} limb Limb with `max`.
 */
export function dyingThreshold(limb) {
  return -(lethalThreshold(limb) * (limb.max || 0));
}
