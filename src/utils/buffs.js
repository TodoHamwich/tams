// ── Temporary buffs ───────────────────────────────────────────────────────────
// Pure logic (no Foundry globals) for buffs one actor gives to others through a chat card.
//
// Durations (rulebook, ability creation Part 4):
//   Round durations tick at the start of the caster's turn, or at the start of each round once
//   the caster can no longer act. Outside combat one round counts as 10 minutes, including any
//   rounds left when combat ends. Utility durations always run on the world clock.
// Stacking: the same buff refreshes unless the ability is stackable.
// Stat increases (rulebook, "Increase Stats"): one increase per stat at a time, none during that
//   stat's penalty, and when one ends the holder takes half of it as a penalty for double the time.

import { bonusDamageComponents, isItemEquipped, itemAttackBonus, magicArmourPen, ITEM_ATTACK_TARGET } from './magic-items.js';
import { resolveCarryChain } from './inventory.js';

export const BUFF_ATTACH_TARGETS = ["character", "weapon", "item"];

/** Seconds on the world clock that one round is worth outside combat. */
export const SECONDS_PER_ROUND_OUT_OF_COMBAT = 600;

export const BUFF_DURATIONS = {
  "1round": { rounds: 1 },
  "2rounds": { rounds: 2 },
  "3rounds": { rounds: 3 },
  "utility0": { seconds: 1800 },
  "utility1": { seconds: 3600 },
  "utility2": { seconds: 10800 },
  "utility3": { seconds: 21600 },
  "utility4": { seconds: 28800 },
};

const STAT_TARGET = /^stats\.(\w+)/;

/**
 * Whether an ability's buff block does anything once attached to its target.
 * @param {object} buff `ability.system.buff`
 * @returns {boolean}
 */
export function hasBuffEffects(buff) {
  if (!buff) return false;
  const passive = (buff.modifiers ?? []).some(m => m.value) || (buff.resistances ?? []).some(r => r.damageType);
  if (passive) return true;
  if (buff.attachTo === "character") return false;
  return bonusDamageComponents(buff).length > 0 || magicArmourPen(buff) > 0
    || (buff.onHitStatusIds ?? []).some(Boolean);
}

/**
 * The payload a chat card carries, or null if the ability gives no buff. Effects that only work
 * through an item being used are dropped from buffs on a character.
 * @param {string} abilityName
 * @param {object} buff `ability.system.buff`
 * @param {{name: string, uuid: string}} caster
 * @returns {object|null}
 */
export function buffSnapshot(abilityName, buff, caster) {
  if (!buff?.enabled || !hasBuffEffects(buff) || !BUFF_DURATIONS[buff.duration]) return null;
  const onCharacter = buff.attachTo === "character";
  return {
    name: abilityName,
    key: String(abilityName ?? "").trim().toLowerCase(),
    attachTo: BUFF_ATTACH_TARGETS.includes(buff.attachTo) ? buff.attachTo : "character",
    duration: buff.duration,
    stackable: !!buff.stackable,
    casterName: caster?.name ?? "",
    casterUuid: caster?.uuid ?? "",
    modifiers: (buff.modifiers ?? []).filter(m => m.value && !(onCharacter && m.target === ITEM_ATTACK_TARGET))
      .map(m => ({ target: m.target, value: m.value })),
    resistances: (buff.resistances ?? []).filter(r => r.damageType)
      .map(r => ({ damageType: r.damageType, category: r.category, value: r.value, limbs: [...(r.limbs ?? [])] })),
    bonusDamage: onCharacter ? [] : bonusDamageComponents(buff).map(c => ({ damageType: c.damageType, amount: c.damage })),
    onHitStatusIds: onCharacter ? [] : (buff.onHitStatusIds ?? []).filter(Boolean),
    armourPenetration: onCharacter ? 0 : magicArmourPen(buff),
  };
}

/** Start the countdown for a duration: rounds in combat, otherwise the world clock. */
function startCountdown({ rounds = null, seconds = null }, { combat = null, now = 0 }) {
  const countdown = { roundsLeft: null, expiresAt: null, combatId: "", appliedRound: null, lastTickRound: null };
  if (rounds !== null && combat) {
    return { ...countdown, roundsLeft: rounds, combatId: combat.id, appliedRound: combat.round };
  }
  const clockSeconds = rounds !== null ? rounds * SECONDS_PER_ROUND_OUT_OF_COMBAT : seconds;
  return { ...countdown, expiresAt: now + clockSeconds };
}

/**
 * Turn a card payload into an attached buff.
 * @param {object} snapshot From buffSnapshot().
 * @param {{id: string, combat: ?{id: string, round: number}, now: number}} context
 *   `combat` is the running combat involving the caster or recipient, if any.
 * @returns {object}
 */
export function createBuffEntry(snapshot, { id, combat = null, now = 0 }) {
  const { rounds = null, seconds = null } = BUFF_DURATIONS[snapshot.duration] ?? {};
  const { attachTo, duration, ...rest } = snapshot;
  return {
    ...rest, id, isCrash: false, baseRounds: rounds, baseSeconds: seconds,
    ...startCountdown({ rounds, seconds }, { combat, now }),
  };
}

/** Stat keys an entry raises (positive) or lowers (negative). */
function statChanges(entry, sign) {
  return (entry.modifiers ?? []).filter(m => m.value * sign > 0)
    .map(m => m.target?.match(STAT_TARGET)?.[1]).filter(Boolean);
}

/**
 * Decide what applying a buff does.
 * @param {object} snapshot Card payload.
 * @param {object[]} onTarget Buffs on the character or item it is going onto.
 * @param {object[]} onActor Every buff on the recipient, including those on their items.
 * @returns {{action: "add"|"refresh"|"refuse", replaceId?: string, stats?: string[]}}
 */
export function planBuffApplication(snapshot, onTarget, onActor) {
  const same = snapshot.stackable ? null : onTarget.find(b => !b.isCrash && b.key === snapshot.key);
  const blocked = new Set();
  for (const entry of onActor) {
    if (same && entry.id === same.id) continue;
    for (const stat of statChanges(entry, 1)) blocked.add(stat);
    if (entry.isCrash) for (const stat of statChanges(entry, -1)) blocked.add(stat);
  }
  const stats = [...new Set(statChanges(snapshot, 1))].filter(stat => blocked.has(stat));
  if (stats.length) return { action: "refuse", stats };
  return same ? { action: "refresh", replaceId: same.id } : { action: "add" };
}

/**
 * Add or replace an entry following a plan from planBuffApplication().
 * @returns {object[]} The new list.
 */
export function applyBuffPlan(list, entry, plan) {
  if (plan.action === "refresh") return list.map(b => b.id === plan.replaceId ? { ...entry, id: b.id } : b);
  return [...list, entry];
}

/**
 * Tick a round-based buff for a combat turn. Returns the same object when nothing changes.
 * @param {object} entry
 * @param {{combatId: string, round: number, isCasterTurn: boolean, casterCanAct: boolean}} turn
 * @returns {object|null} The entry, or null if it ended.
 */
export function stepRounds(entry, { combatId, round, isCasterTurn, casterCanAct }) {
  if (entry.roundsLeft === null || entry.roundsLeft === undefined || entry.combatId !== combatId) return entry;
  const last = entry.lastTickRound;
  const due = casterCanAct
    ? isCasterTurn && last !== round
    : round > Math.max(last ?? -Infinity, entry.appliedRound ?? -Infinity);
  if (!due) return entry;
  const roundsLeft = entry.roundsLeft - 1;
  return roundsLeft <= 0 ? null : { ...entry, roundsLeft, lastTickRound: round };
}

/**
 * Check a clock-based buff against the world time.
 * @returns {object|null} The entry, or null if it ended.
 */
export function stepClock(entry, now) {
  return (entry.expiresAt !== null && entry.expiresAt !== undefined && entry.expiresAt <= now) ? null : entry;
}

/**
 * Move a round-based buff onto the clock when its combat is over: 10 minutes per round left.
 * @returns {object} The same object if it isn't counting rounds.
 */
export function carryToClock(entry, now) {
  if (entry.roundsLeft === null || entry.roundsLeft === undefined) return entry;
  return {
    ...entry, roundsLeft: null, combatId: "", appliedRound: null, lastTickRound: null,
    expiresAt: now + entry.roundsLeft * SECONDS_PER_ROUND_OUT_OF_COMBAT,
  };
}

/**
 * The penalty left behind when a stat increase ends: half the increase, rounded down, for double
 * the original duration.
 * @param {object} entry The buff that ended.
 * @param {{id: string, combat: ?{id: string, round: number}, now: number}} context
 * @returns {object|null} A new entry, or null if there's nothing to penalize.
 */
export function crashFor(entry, { id, combat = null, now = 0 }) {
  if (entry.isCrash) return null;
  const modifiers = (entry.modifiers ?? [])
    .filter(m => m.value > 0 && STAT_TARGET.test(m.target ?? ""))
    .map(m => ({ target: m.target, value: -Math.floor(m.value / 2) }))
    .filter(m => m.value < 0);
  if (!modifiers.length) return null;
  const rounds = entry.baseRounds === null || entry.baseRounds === undefined ? null : entry.baseRounds * 2;
  const seconds = entry.baseSeconds === null || entry.baseSeconds === undefined ? null : entry.baseSeconds * 2;
  return {
    id, key: `crash:${entry.key}`, name: entry.name, casterName: entry.casterName, casterUuid: entry.casterUuid,
    isCrash: true, stackable: false, baseRounds: rounds, baseSeconds: seconds,
    modifiers, resistances: [], bonusDamage: [], onHitStatusIds: [], armourPenetration: 0,
    ...startCountdown({ rounds, seconds }, { combat, now }),
  };
}

/**
 * Run a step over a list of buffs.
 * @param {object[]} list
 * @param {(entry: object) => object|null} step
 * @returns {{kept: object[], ended: object[], changed: boolean}}
 */
export function advanceBuffs(list, step) {
  const kept = [], ended = [];
  let changed = false;
  for (const entry of list ?? []) {
    const next = step(entry);
    if (next === null) { ended.push(entry); changed = true; continue; }
    if (next !== entry) changed = true;
    kept.push(next);
  }
  return { kept, ended, changed };
}

/**
 * Buffs currently affecting an actor's stats and resistances: everything on the actor, plus
 * buffs on items that are carried and equipped (ammo only has to be carried).
 * @param {object[]} actorBuffs `actor.system.buffs`
 * @param {Iterable<object>} items
 * @param {{get: Function}} itemsById Lookup for the carry chain.
 * @returns {object[]}
 */
export function activeBuffEntries(actorBuffs, items, itemsById) {
  const active = [...(actorBuffs ?? [])];
  for (const item of items ?? []) {
    if (!item.system?.buffs?.length) continue;
    if (!resolveCarryChain(item, itemsById).carried) continue;
    if (item.type === "ammo" || isItemEquipped(item)) active.push(...item.system.buffs);
  }
  return active;
}

/** Bonus damage from the buffs on an item, added when the item is used. */
export function itemBuffBonusDamage(system) {
  return (system?.buffs ?? []).flatMap(b => bonusDamageComponents(b));
}

/** Armour Penetration from the buffs on an item, added when the item is used. */
export function itemBuffArmourPen(system) {
  return (system?.buffs ?? []).reduce((sum, b) => sum + magicArmourPen(b), 0);
}

/** On-hit statuses from the buffs on an item. */
export function itemBuffOnHitStatuses(system) {
  return (system?.buffs ?? []).flatMap(b => b.onHitStatusIds ?? []).filter(Boolean);
}

/** "Attacks with this item" bonus from the buffs on an item. */
export function itemBuffAttackBonus(system) {
  return (system?.buffs ?? []).reduce((sum, b) => sum + itemAttackBonus(b), 0);
}

/**
 * Short text for time left on the clock, such as "1h 20m" or "45m". Under a minute rounds up.
 * @param {number} seconds
 * @returns {string}
 */
export function formatBuffTime(seconds) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
