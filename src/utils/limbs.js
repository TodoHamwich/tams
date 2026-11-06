/**
 * Hit-location table and missing-limb handling (pure — no Foundry globals).
 *
 * A limb with `missing: true` (an amputation, or a creature without that limb) can never be hit,
 * unless a working prosthetic is fitted to it (`limb.prosthetic`, see prosthetics.js).
 * A location roll that lands on one is rerolled; rolling straight on the remaining limbs' table
 * ranges gives the same odds as rerolling the d100 until it hits a limb that exists.
 */

/** Rulebook d100 hit-location table, low to high. */
export const HIT_TABLE = [
  { key: "rightLeg", label: "Right Leg", weight: 10 }, // 1-10
  { key: "leftLeg",  label: "Left Leg",  weight: 10 }, // 11-20
  { key: "rightArm", label: "Right Arm", weight: 10 }, // 21-30
  { key: "leftArm",  label: "Left Arm",  weight: 10 }, // 31-40
  { key: "stomach",  label: "Stomach",   weight: 15 }, // 41-55
  { key: "thorax",   label: "Thorax",    weight: 40 }, // 56-95
  { key: "head",     label: "Head",      weight: 5 },  // 96-100
];

const LABEL_TO_KEY = Object.fromEntries(HIT_TABLE.map(r => [r.label, r.key]));

/** @returns {boolean} Whether the limb is flagged missing (missing field → false). */
export function isLimbMissing(limb) {
  return limb?.missing === true;
}

/**
 * Whether hits can land on this limb. `isLimbMissing` stays true with a prosthetic fitted, because
 * the flesh limb is still gone: it doesn't bleed or count toward total HP.
 * @returns {boolean}
 */
export function isLimbHittable(limb) {
  if (!isLimbMissing(limb)) return true;
  return !!limb.prosthetic && !limb.prosthetic.destroyed;
}

/**
 * Whether a hit-location label ("Left Arm") names a limb hits can't land on.
 * @param {string} location
 * @param {Record<string, object>} [limbs] `actor.system.limbs`
 */
export function locationIsMissing(location, limbs) {
  const key = LABEL_TO_KEY[location];
  return !!key && !isLimbHittable(limbs?.[key]);
}

/**
 * Table rows for limbs that exist. With no limbs passed, the full table.
 * @param {Record<string, object>} [limbs]
 */
export function presentHitTable(limbs) {
  return HIT_TABLE.filter(r => isLimbHittable(limbs?.[r.key]));
}

/** @returns {number} Sum of the remaining limbs' table ranges (0 if every limb is missing). */
export function presentHitWeight(limbs) {
  return presentHitTable(limbs).reduce((sum, r) => sum + r.weight, 0);
}

/**
 * Location label for a roll of 1..weight over the given limbs' table ranges.
 * With all limbs present and a d100, this is exactly the rulebook table.
 * @param {number} roll
 * @param {Record<string, object>} [limbs]
 * @returns {string|null} null when every limb is missing
 */
export function locationFromRoll(roll, limbs) {
  const table = presentHitTable(limbs);
  let upper = 0;
  for (const row of table) {
    upper += row.weight;
    if (roll <= upper) return row.label;
  }
  return table.at(-1)?.label ?? null;
}
