// ── Magic item effects ────────────────────────────────────────────────────────
// Pure logic (no Foundry globals) for the `system.magic` block shared by physical items.
//
// Two groups of effects:
//   Passive  — modifiers, resistances, injury check bonus, size grants, granted abilities.
//              Apply while the item is carried (not in an unequipped bag) and, when
//              `requiresEquipped` is set, only while equipped. Requirements must be met.
//   On-use   — bonus damage and on-hit statuses. Apply whenever the item is used to attack
//              (or fired, for ammo), as long as requirements are met.
//
// Identification and curses only change what players SEE, never what applies:
//   - unidentified: players see `unidentifiedName` / `unidentifiedDescription`, no effects.
//   - cursed + not revealed: entries flagged `curse` (and the curse text) are hidden from players.

import { resolveCarryChain } from './inventory.js';
import { professionRank } from './profession.js';

/** Item types that carry a `system.magic` block. */
export const MAGIC_ITEM_TYPES = ["weapon", "armor", "shield", "equipment", "tool", "backpack", "questItem", "ammo"];

/** Item types whose equip state is `system.equipped` (the rest equip by being in hand). */
const EQUIPPED_FLAG_TYPES = ["armor", "shield", "backpack", "equipment", "tool", "questItem"];

export const REQUIREMENT_TYPES = ["stat", "profession", "race", "skill"];

const STAT_KEYS = ["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"];

/**
 * Whether an item's magic block has anything in it at all.
 * @param {object} magic `item.system.magic`
 * @returns {boolean}
 */
export function hasMagicEffects(magic) {
  if (!magic) return false;
  return !!(magic.modifiers?.length || magic.resistances?.length || magic.injuryCheckBonus
    || magic.sizeGrantHP || magic.sizeGrantStealth || magic.sizeGrantCombat
    || magic.grantedAbilities?.length || magic.onHitStatusIds?.length || magic.bonusDamage?.length);
}

/**
 * Whether the item counts as equipped.
 * @param {object} item
 * @returns {boolean}
 */
export function isItemEquipped(item) {
  if (!item?.system) return false;
  if (item.type === "weapon") return item.system.location === "hand";
  if (EQUIPPED_FLAG_TYPES.includes(item.type)) return !!item.system.equipped;
  return false;
}

/**
 * Build the requirement-check context from an actor's items and current stat totals.
 * Stat totals should be taken BEFORE magic modifiers are added, so an item can't
 * satisfy its own requirement.
 * @param {Iterable<object>} items Actor items.
 * @param {Record<string, number>} statTotals Stat key → total.
 * @returns {{stats: Record<string, number>, professions: {name: string, rank: number}[], races: string[], skills: string[]}}
 */
export function buildRequirementContext(items, statTotals = {}) {
  const ctx = { stats: { ...statTotals }, professions: [], races: [], skills: [] };
  for (const item of items ?? []) {
    const s = item.system ?? {};
    if (item.type === "trait" && s.isProfession && s.profession) {
      ctx.professions.push({ name: s.profession.trim().toLowerCase(), rank: professionRank(s.modifiers ?? []) });
    } else if (item.type === "race") {
      ctx.races.push((item.name ?? "").trim().toLowerCase());
    } else if (item.type === "skill") {
      ctx.skills.push((item.name ?? "").trim().toLowerCase());
    }
  }
  return ctx;
}

/**
 * Check one requirement.
 * - stat:       `key` is a stat key, `value` the minimum total.
 * - profession: `key` is the profession name, `value` the minimum rank (0 = any rank).
 * - race:       `key` is the race name.
 * - skill:      `key` is the skill name.
 * Name matches are case-insensitive. A requirement with no key is ignored (counts as met).
 * @param {{type: string, key: string, value: number}} req
 * @param {ReturnType<typeof buildRequirementContext>} ctx
 * @returns {boolean}
 */
export function requirementMet(req, ctx) {
  const key = String(req?.key ?? "").trim().toLowerCase();
  if (!key) return true;
  const value = Number(req.value) || 0;
  switch (req.type) {
    case "stat":
      if (!STAT_KEYS.includes(key)) return true;
      return (ctx.stats[key] ?? 0) >= value;
    case "profession":
      return ctx.professions.some(p => p.name === key && p.rank >= value);
    case "race":
      return ctx.races.includes(key);
    case "skill":
      return ctx.skills.includes(key);
    default:
      return true;
  }
}

/**
 * Requirements on the item that aren't met.
 * @param {object} magic `item.system.magic`
 * @param {ReturnType<typeof buildRequirementContext>} ctx
 * @returns {object[]}
 */
export function unmetRequirements(magic, ctx) {
  return (magic?.requirements ?? []).filter(r => !requirementMet(r, ctx));
}

/**
 * Work out which of an actor's magic items are currently active.
 * @param {Iterable<object>} items Actor items.
 * @param {ReturnType<typeof buildRequirementContext>} ctx
 * @param {{get: Function}} itemsById Lookup for the carry chain.
 * @returns {Record<string, {passive: boolean, onUse: boolean, requirementsMet: boolean}>} keyed by item id
 */
export function computeMagicState(items, ctx, itemsById) {
  const state = {};
  for (const item of items ?? []) {
    if (!MAGIC_ITEM_TYPES.includes(item.type)) continue;
    const magic = item.system?.magic;
    if (!hasMagicEffects(magic)) continue;
    const requirementsMet = unmetRequirements(magic, ctx).length === 0;
    const carried = resolveCarryChain(item, itemsById).carried;
    const equippedOk = !magic.requiresEquipped || item.type === "ammo" || isItemEquipped(item);
    state[item.id] = {
      requirementsMet,
      passive: requirementsMet && carried && equippedOk,
      onUse: requirementsMet,
    };
  }
  return state;
}

/**
 * Whether a viewer should see the item's curse (flagged entries + curse text).
 * @param {object} magic
 * @param {boolean} isGM
 * @returns {boolean}
 */
export function curseVisible(magic, isGM) {
  return isGM || !magic?.cursed || !!magic?.curseRevealed;
}

/**
 * Whether a viewer should see the item's true identity and effects.
 * @param {object} magic
 * @param {boolean} isGM
 * @returns {boolean}
 */
export function identityVisible(magic, isGM) {
  return isGM || magic?.identified !== false;
}

/**
 * Name to show players (viewer-independent: what a chat card everyone sees should use).
 * @param {object} item
 * @param {string} fallback Localized "Unidentified Item" text.
 * @returns {string}
 */
export function publicItemName(item, fallback = "Unidentified Item") {
  const magic = item?.system?.magic;
  if (magic && magic.identified === false) return magic.unidentifiedName?.trim() || fallback;
  return item?.name ?? "";
}

/** Modifier target that only applies to attack rolls made with the item itself. */
export const ITEM_ATTACK_TARGET = "itemAttacks";

/**
 * Attack roll bonus from the item's "Attacks with this item" modifiers (curse entries included).
 * @param {object} magic
 * @returns {number}
 */
export function itemAttackBonus(magic) {
  return (magic?.modifiers ?? [])
    .filter(m => m.target === ITEM_ATTACK_TARGET)
    .reduce((sum, m) => sum + (Number(m.value) || 0), 0);
}

/**
 * Bonus damage components to add to an attack.
 * @param {object} magic
 * @returns {{damageType: string, damage: number}[]}
 */
export function bonusDamageComponents(magic) {
  return (magic?.bonusDamage ?? [])
    .map(c => ({ damageType: c.damageType || "", damage: Math.floor(Number(c.amount) || 0) }))
    .filter(c => c.damage > 0);
}
