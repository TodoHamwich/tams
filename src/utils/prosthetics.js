/**
 * Prosthetic limbs (pure — no Foundry globals).
 *
 * A prosthetic is an Equipment item with `system.prosthetic.enabled`. It is fitted while equipped,
 * carried and set to a limb the actor has marked Missing. Its HP lives on the item and never counts
 * toward total HP. It is broken at 0 HP (its effects stop) and destroyed at negative its max HP
 * (it can no longer be hit). Damage past that point is lost, and never reaches the character.
 */

import { resolveCarryChain } from './inventory.js';

/** @returns {boolean} Whether the item is set up as a prosthetic. */
export function isProsthetic(item) {
  return item?.type === "equipment" && item.system?.prosthetic?.enabled === true;
}

/**
 * @param {{value: number, max: number}} hp
 * @returns {{broken: boolean, destroyed: boolean}}
 */
export function prostheticCondition(hp) {
  const value = Number(hp?.value) || 0;
  const max = Number(hp?.max) || 0;
  return { broken: value <= 0, destroyed: max > 0 && value <= -max };
}

/**
 * HP after a hit. Stops at negative max, so a destroyed prosthetic absorbs the rest of the hit.
 * @param {{value: number, max: number}} hp
 * @param {number} damage
 * @returns {{value: number, broken: boolean, destroyed: boolean}}
 */
export function prostheticAfterDamage(hp, damage) {
  const max = Number(hp?.max) || 0;
  const value = Math.max(-max, Math.floor(Number(hp?.value) || 0) - Math.max(0, Math.floor(Number(damage) || 0)));
  return { value, ...prostheticCondition({ value, max }) };
}

/**
 * Work out which prosthetics are fitted. A limb takes one: a working one ahead of a destroyed one,
 * then the first in item order.
 * @param {Iterable<object>} items Actor items.
 * @param {Record<string, object>} limbs `actor.system.limbs`
 * @param {{get: Function}} itemsById Lookup for the carry chain.
 * @returns {{byLimb: Record<string, object>, byItem: Record<string, {fitted: boolean, active: boolean, reason: string|null}>}}
 *   `reason` is why an equipped prosthetic isn't fitted: noLimb, noHp, limbPresent or limbTaken.
 *   `active` means fitted and not broken, which is when its effects apply.
 */
export function fitProsthetics(items, limbs, itemsById) {
  const byLimb = {}, byItem = {};
  const prosthetics = [...(items ?? [])].filter(isProsthetic);
  const withDestroyedLast = [
    ...prosthetics.filter(i => !prostheticCondition(i.system.prosthetic.hp).destroyed),
    ...prosthetics.filter(i => prostheticCondition(i.system.prosthetic.hp).destroyed),
  ];

  for (const item of withDestroyedLast) {
    const { limb: limbKey, hp } = item.system.prosthetic;
    const unfitted = (reason) => { byItem[item.id] = { fitted: false, active: false, reason }; };

    if (!item.system.equipped || !resolveCarryChain(item, itemsById).carried) { unfitted(null); continue; }
    if (!limbKey || !limbs?.[limbKey]) { unfitted("noLimb"); continue; }
    if (!((Number(hp?.max) || 0) > 0)) { unfitted("noHp"); continue; }
    if (limbs[limbKey].missing !== true) { unfitted("limbPresent"); continue; }
    if (byLimb[limbKey]) { unfitted("limbTaken"); continue; }

    const condition = prostheticCondition(hp);
    byLimb[limbKey] = {
      itemId: item.id,
      name: item.displayName ?? item.name,
      value: Number(hp.value) || 0,
      max: Number(hp.max) || 0,
      ...condition,
    };
    byItem[item.id] = { fitted: true, active: !condition.broken, reason: null };
  }
  return { byLimb, byItem };
}
