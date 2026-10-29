/**
 * Shared per-actor reaction counter. Every reaction taken in combat (Dodge, Retaliate, or a
 * reaction ability) adds 1; it resets at the start of the actor's own turn and when combat ends.
 * A cost-bearing reaction ability costs base × (reactions already taken + 1), per the rulebook's
 * stacking reaction cost (2, 4, 6, 8…). Dodge and Retaliate themselves are free.
 */

const FLAG = 'reactionCount';

/**
 * @param {number} baseCost
 * @param {number} priorReactions  reactions already taken since the actor's last turn
 * @returns {number}
 */
export function stackedReactionCost(baseCost, priorReactions) {
  return baseCost * (Math.max(0, priorReactions || 0) + 1);
}

/** Reactions taken since the actor's last turn. */
export function reactionCount(actor) {
  return actor?.getFlag?.('tams', FLAG) ?? 0;
}

/** Count one reaction, only while the actor is in combat (and the clicking user can write it). */
export async function recordReaction(actor) {
  if (!actor?.inCombat || actor.isOwner === false) return;
  await actor.setFlag('tams', FLAG, reactionCount(actor) + 1);
}

/** Clear the counter (turn start, combat end). */
export async function resetReactions(actor) {
  if (reactionCount(actor) > 0) await actor.setFlag('tams', FLAG, 0);
}

/**
 * Whether a weapon or reaction ability is a melee option. Ranged AoE attacks can only be
 * retaliated against in melee (range itself is left to the table). Abilities count as ranged
 * past 10m, matching the attack card.
 * @param {Item} item
 * @returns {boolean}
 */
export function isMeleeOption(item) {
  if (item.type === 'weapon') return !item.system?.isRanged;
  return !((item.system?.calculator?.range ?? 0) > 10);
}
