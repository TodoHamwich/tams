import { describe, it, expect, beforeEach } from 'vitest';
import { TAMSActor } from '../src/documents/actor.js';

global.game = {
  i18n: {
    localize: (key) => key,
    format: (key, data) => `${key} ${JSON.stringify(data)}`
  },
  time: { worldTime: 0 }
};

function makeActor(overrides = {}) {
  const system = {
    stats: { endurance: { total: 20 }, intelligence: { total: 10 } },
    stamina: { value: 20, max: 20, mult: 1.0, fatigue: 0, spentSinceRest: 0 },
    customResources: [
      { name: "Mana", stat: "intelligence", mult: 1.0, bonus: 0, value: 10, max: 10, fatigue: 0, spentSinceRest: 0 }
    ],
    restSafe: false,
    traitStaminaExtra: 0,
    ...overrides
  };
  return new TAMSActor({ name: "Test Hero", system });
}

describe('TAMSActor applyResourceSpend', () => {
  let actor;
  beforeEach(() => { actor = makeActor(); });

  it('spends from stamina and tracks spentSinceRest', () => {
    const updates = actor.applyResourceSpend("stamina", 6);
    expect(updates["system.stamina.value"]).toBe(14);
    expect(updates["system.stamina.spentSinceRest"]).toBe(6);
  });

  it('spends from a customResources entry and tracks spentSinceRest', () => {
    const updates = actor.applyResourceSpend(0, 4);
    expect(updates["system.customResources"][0].value).toBe(6);
    expect(updates["system.customResources"][0].spentSinceRest).toBe(4);
  });

  it('merges a split spend (customResource + stamina) into one updates object', () => {
    const updates = {};
    actor.applyResourceSpend(0, 10, updates); // drain Mana to 0
    actor.applyResourceSpend("stamina", 3, updates); // remainder from stamina
    expect(updates["system.customResources"][0].value).toBe(0);
    expect(updates["system.stamina.value"]).toBe(17);
    expect(updates["system.stamina.spentSinceRest"]).toBe(3);
  });

  it('ignores a zero or negative amount', () => {
    const updates = actor.applyResourceSpend("stamina", 0);
    expect(updates).toEqual({});
  });
});

describe('TAMSActor.takeShortRest', () => {
  it('gains fatigue and refills resources that were spent', async () => {
    const actor = makeActor({
      stamina: { value: 5, max: 20, mult: 1.0, fatigue: 0, spentSinceRest: 25 }
    });
    const result = await actor.takeShortRest();
    const staminaResult = result.resources.find(r => r.fatigueGained !== undefined);
    expect(actor.system.stamina.fatigue).toBe(2); // floor(25/10)
    expect(actor.system.stamina.spentSinceRest).toBe(0);
    expect(actor.system.stamina.value).toBe(18); // 20 - 2
  });

  it('does not gain fatigue when nothing was spent', async () => {
    const actor = makeActor();
    await actor.takeShortRest();
    expect(actor.system.stamina.fatigue).toBe(0);
    expect(actor.system.stamina.value).toBe(20);
  });
});

describe('TAMSActor.takeLongRest', () => {
  it('heals fatigue via the bundled dinner+sleep formula', async () => {
    const actor = makeActor({
      stamina: { value: 10, max: 20, mult: 1.0, fatigue: 5, spentSinceRest: 0 }
    });
    const result = await actor.takeLongRest();
    expect(result.blocked).toBe(false);
    // floor(20/10)*2 = 4 healed, 5 - 4 = 1 remaining
    expect(actor.system.stamina.fatigue).toBe(1);
  });

  it('enforces the Unsafe cap of 1 use per rolling 24 hours', async () => {
    const actor = makeActor({
      stamina: { value: 10, max: 20, mult: 1.0, fatigue: 5, spentSinceRest: 0 },
      restSafe: false
    });
    await actor.takeLongRest();
    const second = await actor.takeLongRest();
    expect(second.blocked).toBe(true);
    expect(second.cap).toBe(1);
  });

  it('allows up to 3 uses per rolling 24 hours when Safe', async () => {
    const actor = makeActor({
      stamina: { value: 10, max: 20, mult: 1.0, fatigue: 20, spentSinceRest: 0 },
      restSafe: true
    });
    await actor.takeLongRest();
    await actor.takeLongRest();
    const third = await actor.takeLongRest();
    expect(third.blocked).toBe(false);
    const fourth = await actor.takeLongRest();
    expect(fourth.blocked).toBe(true);
    expect(fourth.cap).toBe(3);
  });
});
