import { describe, it, expect, beforeEach } from 'vitest';
import { TAMSActor } from '../src/documents/actor.js';

global.game = {
  i18n: {
    localize: (key) => key,
    format: (key, data) => `${key} ${JSON.stringify(data)}`
  },
  time: { worldTime: 0 },
  users: { filter: () => [] }
};
global.ChatMessage = { create: async () => {}, getSpeaker: () => ({}) };

function makeLimb(value, max) {
  return { value, max, equippedArmorId: "", armor: 0, armorMax: 0 };
}

function makeActor(overrides = {}) {
  const system = {
    stats: {
      strength: { total: 10 }, dexterity: { total: 10 }, endurance: { total: 20 },
      wisdom: { total: 10 }, intelligence: { total: 10 }, bravery: { total: 10 }
    },
    settings: { isNPC: false, npcType: "individual", squadSize: 1 },
    stamina: { value: 20, max: 20, mult: 1.0, fatigue: 0, spentSinceRest: 0 },
    customResources: [],
    traitStaminaExtra: 0,
    limbs: {
      head: makeLimb(10, 10), thorax: makeLimb(20, 20), stomach: makeLimb(15, 15),
      leftArm: makeLimb(10, 10), rightArm: makeLimb(10, 10),
      leftLeg: makeLimb(10, 10), rightLeg: makeLimb(10, 10)
    },
    ...overrides
  };
  const actor = new TAMSActor({ name: "Test Hero", system });
  actor.statuses = new Set();
  return actor;
}

describe('TAMSActor dying countdown recovery', () => {
  let actor;
  beforeEach(() => {
    actor = makeActor();
    actor._flags['tams.dyingCountdown'] = { turnsLeft: 3, limbKey: 'thorax' };
    actor.statuses.add('unconscious');
  });

  it('clears the countdown when the tracked limb heals back above -max', async () => {
    const updateData = { 'system.limbs.thorax.value': 5 };
    await actor._preUpdate(updateData, {}, {});
    expect(actor.getFlag('tams', 'dyingCountdown')).toBeNull();
    expect(actor.toggleStatusEffect).toHaveBeenCalledWith('unconscious', { active: false });
  });

  it('clears the countdown exactly at the -max boundary', async () => {
    const updateData = { 'system.limbs.thorax.value': -20 };
    await actor._preUpdate(updateData, {}, {});
    expect(actor.getFlag('tams', 'dyingCountdown')).toBeNull();
  });

  it('leaves the countdown alone while still below -max', async () => {
    const updateData = { 'system.limbs.thorax.value': -25 };
    await actor._preUpdate(updateData, {}, {});
    expect(actor.getFlag('tams', 'dyingCountdown')).toEqual({ turnsLeft: 3, limbKey: 'thorax' });
    expect(actor.toggleStatusEffect).not.toHaveBeenCalled();
  });

  it('ignores updates that do not touch the tracked limb', async () => {
    const updateData = { 'system.limbs.head.value': 999 };
    await actor._preUpdate(updateData, {}, {});
    expect(actor.getFlag('tams', 'dyingCountdown')).toEqual({ turnsLeft: 3, limbKey: 'thorax' });
  });

  it('does nothing when there is no active countdown', async () => {
    const clean = makeActor();
    await clean._preUpdate({ 'system.limbs.thorax.value': 5 }, {}, {});
    expect(clean.getFlag('tams', 'dyingCountdown')).toBeNull();
    expect(clean.toggleStatusEffect).not.toHaveBeenCalled();
  });
});
