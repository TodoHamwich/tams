import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isLethal, lethalThreshold, hasCustomLethality, memberCapacityFromLimb, rescaledLimbValue, dyingThreshold
} from '../src/utils/lethality.js';
import { TAMSActor } from '../src/documents/actor.js';

global.game = {
  i18n: {
    localize: (key) => key,
    format: (key, data) => `${key} ${JSON.stringify(data)}`
  },
  users: { filter: () => [] }
};
global.ChatMessage = { create: async () => {}, getSpeaker: () => ({}) };

// Squad limb: indMax 10, size 5 → max 50.
const squadLimb = (overrides = {}) => ({ max: 50, individualMax: 10, ...overrides });

describe('lethality helpers', () => {
  it('defaults missing fields to lethal ×1', () => {
    expect(isLethal({})).toBe(true);
    expect(lethalThreshold({})).toBe(1);
    expect(hasCustomLethality({ head: {}, thorax: { lethal: true, lethalThreshold: 1 } })).toBe(false);
  });

  it('flags custom lethality when a limb is unchecked or has a raised threshold', () => {
    expect(hasCustomLethality({ head: {}, leftArm: { lethal: false } })).toBe(true);
    expect(hasCustomLethality({ head: {}, thorax: { lethalThreshold: 2 } })).toBe(true);
  });

  it('matches the classic ceil(value / indMax) member count at threshold 1', () => {
    for (const value of [50, 41, 40, 39, 11, 10, 1, 0, -5]) {
      expect(memberCapacityFromLimb(squadLimb(), value, 5)).toBe(Math.max(0, Math.ceil(value / 10)));
    }
  });

  it('never limits members from a non-lethal limb', () => {
    expect(memberCapacityFromLimb(squadLimb({ lethal: false }), -50, 5)).toBe(Infinity);
  });

  it('needs threshold × indMax damage per member on a raised-threshold limb', () => {
    const thorax = squadLimb({ lethalThreshold: 2 });
    expect(memberCapacityFromLimb(thorax, 40, 5)).toBe(5);  // 10 dmg
    expect(memberCapacityFromLimb(thorax, 31, 5)).toBe(5);  // 19 dmg
    expect(memberCapacityFromLimb(thorax, 30, 5)).toBe(4);  // 20 dmg
    expect(memberCapacityFromLimb(thorax, -50, 5)).toBe(0); // 100 dmg
  });

  it('rescales lethal limbs like the classic remainder logic at threshold 1', () => {
    // 5 → 3 members, 23 damage taken: keep the 3 partial damage.
    expect(rescaledLimbValue(squadLimb(), 27, 3, 5)).toBe(27);
    expect(rescaledLimbValue(squadLimb(), 0, 0, 5)).toBe(0);
  });

  it('keeps partial damage modulo threshold × indMax on a raised-threshold limb', () => {
    // 35 damage at threshold 2 (unit 20) → 15 partial damage on the 4 survivors.
    expect(rescaledLimbValue(squadLimb({ lethalThreshold: 2 }), 15, 4, 5)).toBe(25);
  });

  it('scales non-lethal limbs proportionally, clamped to ±newMax', () => {
    expect(rescaledLimbValue(squadLimb({ lethal: false }), 20, 4, 5)).toBe(16);
    expect(rescaledLimbValue(squadLimb({ lethal: false }), -50, 2, 5)).toBe(-20);
  });

  it('puts the individual dying threshold at −(threshold × max)', () => {
    expect(dyingThreshold({ max: 10 })).toBe(-10);
    expect(dyingThreshold({ max: 10, lethalThreshold: 2 })).toBe(-20);
  });
});

function makeLimb(value, max, extra = {}) {
  return { value, max, mult: 1, armor: 0, armorMax: 0, otherArmor: 0, injured: false, criticallyInjured: false, label: "Limb", ...extra };
}

describe('applyTAMSDamage with zombie lethality', () => {
  let actor;
  const zombieLethality = (limbs) => {
    for (const [key, limb] of Object.entries(limbs)) {
      limb.lethal = key === 'head' || key === 'thorax';
      limb.lethalThreshold = key === 'thorax' ? 2 : 1;
    }
  };

  describe('mook squad', () => {
    beforeEach(() => {
      const limbs = {};
      for (const key of ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']) {
        limbs[key] = makeLimb(50, 50, { individualMax: 10 });
      }
      zombieLethality(limbs);
      actor = new TAMSActor({
        name: "Zombies",
        system: {
          stats: { endurance: { total: 10 } },
          limbs,
          hp: { value: 350, max: 350 },
          settings: { isNPC: true, npcType: "squad", npcRank: "mook", squadSize: 5, alternateArmour: false }
        }
      });
      actor.items = { get: vi.fn(), filter: vi.fn(() => []) };
    });

    it('loses no members from arm damage, however much', async () => {
      const hits = Array.from({ length: 10 }, () => ({ damage: 10, location: "Left Arm" }));
      await actor.applyTAMSDamage(hits);
      expect(actor.system.settings.squadSize).toBe(5);
      expect(actor.system.limbs.leftArm.value).toBe(-50); // clamped at -max
    });

    it('loses a member to a headshot for indMax', async () => {
      await actor.applyTAMSDamage([{ damage: 10, location: "Head" }]);
      expect(actor.system.settings.squadSize).toBe(4);
    });

    it('needs 2× indMax on the thorax to lose a member', async () => {
      await actor.applyTAMSDamage([{ damage: 10, location: "Thorax" }]);
      expect(actor.system.settings.squadSize).toBe(5);
      await actor.applyTAMSDamage([{ damage: 10, location: "Thorax" }]);
      expect(actor.system.settings.squadSize).toBe(4);
    });

    it('caps a single thorax hit at one member (2× indMax)', async () => {
      await actor.applyTAMSDamage([{ damage: 100, location: "Thorax" }]);
      expect(actor.system.settings.squadSize).toBe(4);
    });
  });

  describe('individual', () => {
    beforeEach(() => {
      const limbs = {
        head: makeLimb(10, 10), thorax: makeLimb(20, 20), stomach: makeLimb(15, 15),
        leftArm: makeLimb(10, 10), rightArm: makeLimb(10, 10),
        leftLeg: makeLimb(10, 10), rightLeg: makeLimb(10, 10)
      };
      zombieLethality(limbs);
      actor = new TAMSActor({
        name: "Zombie",
        system: {
          stats: { endurance: { total: 20 } },
          limbs,
          hp: { value: -200, max: 95 }, // far below -max: would normally force a survival check
          settings: { isNPC: true, npcType: "individual", alternateArmour: false }
        }
      });
      actor.items = { get: vi.fn(), filter: vi.fn(() => []) };
      actor.statuses = new Set();
    });

    it('skips total-HP unconscious/survival checks', async () => {
      const { pendingChecks } = await actor.applyTAMSDamage([{ damage: 40, location: "Stomach" }]);
      expect(pendingChecks.some(c => c.type === 'survival' || c.type === 'unconscious')).toBe(false);
      expect(actor.getFlag('tams', 'dyingCountdown')).toBeNull();
    });

    it('starts dying when the head drops below -max', async () => {
      await actor.applyTAMSDamage([{ damage: 21, location: "Head" }]);
      expect(actor.getFlag('tams', 'dyingCountdown')).toMatchObject({ limbKey: 'head' });
    });

    it('needs the thorax below -(2 × max) to start dying', async () => {
      await actor.applyTAMSDamage([{ damage: 50, location: "Thorax" }]); // -30, above -40
      expect(actor.getFlag('tams', 'dyingCountdown')).toBeNull();
      await actor.applyTAMSDamage([{ damage: 11, location: "Thorax" }]); // -41
      expect(actor.getFlag('tams', 'dyingCountdown')).toMatchObject({ limbKey: 'thorax' });
    });
  });
});
