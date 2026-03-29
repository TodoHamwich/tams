import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TAMSActor } from '../src/documents/actor.js';

// Mock Foundry globals
global.game = {
  i18n: {
    localize: (key) => key,
    format: (key, data) => `${key} ${JSON.stringify(data)}`
  }
};

describe('TAMSActor applyDamage', () => {
  let actor;

  beforeEach(() => {
    const system = {
      stats: { endurance: { total: 10 } },
      limbs: {
        head: { value: 5, max: 5, mult: 0.5, armor: 0, armorMax: 0, injured: false, criticallyInjured: false },
        thorax: { value: 10, max: 10, mult: 1.0, armor: 0, armorMax: 0, injured: false, criticallyInjured: false },
        stomach: { value: 7, max: 7, mult: 0.75, armor: 0, armorMax: 0, injured: false, criticallyInjured: false },
        leftArm: { value: 7, max: 7, mult: 0.75, armor: 0, armorMax: 0, injured: false, criticallyInjured: false },
        rightArm: { value: 7, max: 7, mult: 0.75, armor: 0, armorMax: 0, injured: false, criticallyInjured: false },
        leftLeg: { value: 7, max: 7, mult: 0.75, armor: 0, armorMax: 0, injured: false, criticallyInjured: false },
        rightLeg: { value: 7, max: 7, mult: 0.75, armor: 0, armorMax: 0, injured: false, criticallyInjured: false }
      },
      hp: { value: 50, max: 50 },
      settings: { isNPC: false, alternateArmour: false }
    };
    actor = new TAMSActor({ name: "Test Hero", system });
    actor.items = {
      get: vi.fn(),
      filter: vi.fn(() => [])
    };
  });

  it('applies basic damage correctly to a limb', async () => {
    const hits = [{ damage: 3, location: "Thorax", armourPen: 0 }];
    await actor.applyDamage(hits);
    
    expect(actor.system.limbs.thorax.value).toBe(7); // 10 - 3
  });

  it('reduces damage by armor', async () => {
    actor.system.limbs.thorax.armor = 2;
    const hits = [{ damage: 5, location: "Thorax", armourPen: 0 }];
    await actor.applyDamage(hits);
    
    // 5 damage - 2 armor = 3 effective damage. 10 - 3 = 7
    expect(actor.system.limbs.thorax.value).toBe(7);
  });

  it('applies armor penetration', async () => {
    actor.system.limbs.thorax.armor = 5;
    const hits = [{ damage: 10, location: "Thorax", armourPen: 3 }];
    await actor.applyDamage(hits);
    
    // 5 armor - 3 pen = 2 effective armor. 10 damage - 2 armor = 8 effective. 10 - 8 = 2.
    expect(actor.system.limbs.thorax.value).toBe(2);
  });

  describe('Squads and Hordes', () => {
    beforeEach(() => {
      actor.system.settings.isNPC = true;
      actor.system.settings.npcType = "squad";
      actor.system.settings.squadSize = 5;
      // Recalculate limb max for squad
      for (const limb of Object.values(actor.system.limbs)) {
        limb.individualMax = Math.floor(10 * limb.mult);
        limb.max = limb.individualMax * 5;
        limb.value = limb.max;
        limb.label = "Test Limb";
      }
    });

    it('caps damage per hit for squads (non-AoE)', async () => {
      // Thorax individual max is 10. Squad thorax max is 50.
      // Hit for 25 damage. Should be capped at 10.
      const hits = [{ damage: 25, location: "Thorax", armourPen: 0 }];
      await actor.applyDamage(hits);
      
      expect(actor.system.limbs.thorax.value).toBe(40); // 50 - 10
    });

    it('does not cap damage for squads in AoE (with multiplier)', async () => {
      // AoE with multiplier 3. Cap should be 3 * individualMax = 30.
      // Hit for 25 damage. Should NOT be capped as 25 < 30.
      const hits = [{ damage: 25, location: "Thorax", armourPen: 0 }];
      await actor.applyDamage(hits, { isAoE: true, multiplier: 3 });
      
      expect(actor.system.limbs.thorax.value).toBe(25); // 50 - 25
    });

    it('caps AoE damage if it exceeds multiplier * individualMax', async () => {
        // AoE with multiplier 2. Cap should be 2 * 10 = 20.
        // Hit for 25 damage. Capped at 20.
        const hits = [{ damage: 25, location: "Thorax", armourPen: 0 }];
        await actor.applyDamage(hits, { isAoE: true, multiplier: 2 });
        
        expect(actor.system.limbs.thorax.value).toBe(30); // 50 - 20
    });

    it('accumulates damage across multiple hits to the same limb and caps correctly', async () => {
        // Individual max 10.
        // Hit 1: 7 damage. Effective 7. Accumulated 7.
        // Hit 2: 8 damage. Remaining cap 3. Effective 3. Accumulated 10.
        const hits = [
            { damage: 7, location: "Thorax", armourPen: 0 },
            { damage: 8, location: "Thorax", armourPen: 0 }
        ];
        await actor.applyDamage(hits);
        expect(actor.system.limbs.thorax.value).toBe(40); // 50 - 10
    });

    it('calculates the new squad DC formula correctly', async () => {
        // Elite Squad (not Mook, to get the button/DCs)
        actor.system.settings.npcRank = "elite";
        // indMax = 10. Max = 50.
        // Already took 10 damage. currentLimbHpBeforeHit = 40.
        actor.system.limbs.thorax.value = 40;
        
        // Hit for 20 damage. 
        // effective = 10 (capped by indMax).
        // totalDamageOfHit = 20 (before capping).
        const hits = [{ damage: 20, location: "Thorax", armourPen: 0 }];
        const result = await actor.applyDamage(hits);
        
        // indMax = 10.
        // damageTakenAlready = 50 - 40 = 10.
        // totalDamageOfHit = 20.
        // New DC = 10 (already) + 20 (new) = 30.
        
        // Check if report contains the correct DC in data-dcs
        expect(result.report).toContain('data-dcs="30"');
    });

    it('does not include the Roll for Critical Wounds button for Mooks', async () => {
        actor.system.settings.npcRank = "mook";
        actor.system.limbs.thorax.value = 40;
        const hits = [{ damage: 20, location: "Thorax", armourPen: 0 }];
        const result = await actor.applyDamage(hits);
        
        expect(result.report).not.toContain('tams-squad-crit-roll');
    });
  });

  describe('Survival and Injury Checks', () => {
    it('triggers an unconscious check if total HP is negative', async () => {
        // Mock total HP being negative after the update
        // Since we don't have full derivation, we manually set it
        actor.system.hp.value = -5;
        const hits = [{ damage: 1, location: "Thorax", armourPen: 0 }];
        const result = await actor.applyDamage(hits);
        
        expect(result.pendingChecks).toContainEqual(expect.objectContaining({ type: "unconscious" }));
    });

    it('triggers a survival check if total HP is below negative max HP', async () => {
        actor.system.hp.value = -60;
        actor.system.hp.max = 50;
        const hits = [{ damage: 1, location: "Thorax", armourPen: 0 }];
        const result = await actor.applyDamage(hits);
        
        expect(result.pendingChecks).toContainEqual(expect.objectContaining({ type: "survival" }));
    });

    it('triggers an injury check if a limb is damaged and not already injured', async () => {
        actor.system.limbs.leftArm.label = "Left Arm";
        const hits = [{ damage: 8, location: "Left Arm", armourPen: 0 }];
        const result = await actor.applyDamage(hits);
        
        expect(result.pendingChecks).toContainEqual(expect.objectContaining({ type: "injured", limbKey: "leftArm" }));
    });

    it('triggers a critical injury check if a limb is damaged and already injured', async () => {
        actor.system.limbs.leftArm.label = "Left Arm";
        actor.system.limbs.leftArm.injured = true;
        actor.system.limbs.leftArm.value = 0;
        const hits = [{ damage: 10, location: "Left Arm", armourPen: 0 }];
        const result = await actor.applyDamage(hits);
        
        expect(result.pendingChecks).toContainEqual(expect.objectContaining({ type: 'crit', limbKey: "leftArm" }));
    });

    it('forces a critical injury check with forceCrit: "1" (Brutal tag)', async () => {
        actor.system.limbs.thorax.label = "Thorax";
        // Limb is not injured, but forceCrit is "1"
        const hits = [{ damage: 5, location: "Thorax", armourPen: 0, forceCrit: "1" }];
        const result = await actor.applyDamage(hits);
        
        expect(result.pendingChecks).toContainEqual(expect.objectContaining({ type: 'crit', limbKey: "thorax" }));
    });
  });
});
