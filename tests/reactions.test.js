import { describe, it, expect } from 'vitest';
import { stackedReactionCost, reactionCount, recordReaction, resetReactions, isMeleeOption } from '../src/utils/reactions.js';

function mockActor({ inCombat = true, count } = {}) {
  const flags = count === undefined ? {} : { reactionCount: count };
  return {
    inCombat,
    getFlag: (scope, key) => flags[key],
    setFlag: async (scope, key, value) => { flags[key] = value; },
  };
}

describe('stackedReactionCost', () => {
  it('stacks base cost per reaction already taken (2, 4, 6, 8…)', () => {
    expect([0, 1, 2, 3].map(n => stackedReactionCost(2, n))).toEqual([2, 4, 6, 8]);
  });

  it('treats a missing count as zero', () => {
    expect(stackedReactionCost(3, undefined)).toBe(3);
  });
});

describe('reaction counter', () => {
  it('counts Dodge/Retaliate/abilities in one shared tally while in combat', async () => {
    const actor = mockActor();
    await recordReaction(actor); // dodge
    await recordReaction(actor); // retaliate
    expect(reactionCount(actor)).toBe(2);
    expect(stackedReactionCost(2, reactionCount(actor))).toBe(6);
  });

  it('does not count outside combat', async () => {
    const actor = mockActor({ inCombat: false });
    await recordReaction(actor);
    expect(reactionCount(actor)).toBe(0);
  });

  it('resets to zero', async () => {
    const actor = mockActor({ count: 3 });
    await resetReactions(actor);
    expect(reactionCount(actor)).toBe(0);
  });
});

describe('isMeleeOption', () => {
  it('treats non-ranged weapons as melee', () => {
    expect(isMeleeOption({ type: 'weapon', system: { isRanged: false } })).toBe(true);
    expect(isMeleeOption({ type: 'weapon', system: { isRanged: true } })).toBe(false);
  });

  it('treats abilities as ranged only past 10m', () => {
    expect(isMeleeOption({ type: 'ability', system: { calculator: { range: 0 } } })).toBe(true);
    expect(isMeleeOption({ type: 'ability', system: { calculator: { range: 10 } } })).toBe(true);
    expect(isMeleeOption({ type: 'ability', system: { calculator: { range: 36 } } })).toBe(false);
  });
});
