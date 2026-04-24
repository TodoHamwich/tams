import { describe, it, expect, beforeEach } from 'vitest';
import { TAMSWeaponData, TAMSAbilityData } from '../src/models/item.js';

describe('TAMSWeaponData', () => {
  let weaponData;
  let mockActor;

  beforeEach(() => {
    weaponData = new TAMSWeaponData();
    mockActor = {
      system: {
        stats: {
          strength: { total: 20 }
        }
      }
    };
    // Mock parent.actor
    weaponData.parent = { actor: mockActor };
  });

  describe('calculatedDamage', () => {
    it('calculates melee damage correctly for standard weapon', () => {
      weaponData.isRanged = false;
      expect(weaponData.calculatedDamage).toBe(10); // 20 * 0.5
    });

    it('calculates melee damage correctly for heavy weapon', () => {
      weaponData.isRanged = false;
      weaponData.isHeavy = true;
      expect(weaponData.calculatedDamage).toBe(15); // 20 * 0.75
    });

    it('calculates melee damage correctly for two-handed weapon', () => {
      weaponData.isRanged = false;
      weaponData.isTwoHanded = true;
      expect(weaponData.calculatedDamage).toBe(15); // 20 * 0.75
    });

    it('calculates melee damage correctly for heavy two-handed weapon', () => {
      weaponData.isRanged = false;
      weaponData.isHeavy = true;
      weaponData.isTwoHanded = true;
      expect(weaponData.calculatedDamage).toBe(20); // 20 * 1.0
    });

    it('uses explicit attackStat for melee damage scaling', () => {
      weaponData.isRanged = false;
      weaponData.attackStat = "intelligence";
      mockActor.system.stats.intelligence = { total: 40 };
      expect(weaponData.calculatedDamage).toBe(20); // 40 * 0.5
    });

    it('defaults to strength if attackStat is set to "default"', () => {
      weaponData.isRanged = false;
      weaponData.attackStat = "default";
      mockActor.system.stats.strength.total = 20;
      expect(weaponData.calculatedDamage).toBe(10); // 20 * 0.5
    });

    it('uses rangedDamage for ranged weapons', () => {
      weaponData.isRanged = true;
      weaponData.rangedDamage = 25;
      expect(weaponData.calculatedDamage).toBe(25);
    });

    it('calculates melee damage correctly with trait-modified strength', () => {
      weaponData.isRanged = false;
      mockActor.system.stats.strength.total = 30; // Assuming trait bonus is included in total
      expect(weaponData.calculatedDamage).toBe(15); // 30 * 0.5
    });

    it('handles zero strength for melee weapons', () => {
      weaponData.isRanged = false;
      mockActor.system.stats.strength.total = 0;
      expect(weaponData.calculatedDamage).toBe(0);
    });

    it('handles very high strength for melee weapons', () => {
      weaponData.isRanged = false;
      weaponData.isHeavy = true;
      weaponData.isTwoHanded = true;
      mockActor.system.stats.strength.total = 1000;
      expect(weaponData.calculatedDamage).toBe(1000); // 1.0 multiplier
    });
  });
});

describe('TAMSAbilityData', () => {
  let abilityData;

  beforeEach(() => {
    abilityData = new TAMSAbilityData();
  });

  describe('ifStatement and ifCost', () => {
    it('can have ifStatement and ifCost', () => {
      abilityData.ifStatement = "If in cover";
      abilityData.ifCost = 5;
      expect(abilityData.ifStatement).toBe("If in cover");
      expect(abilityData.ifCost).toBe(5);
    });
  });

  describe('calculatedDamage', () => {
    it('returns 0 if not an attack', () => {
      abilityData.isAttack = false;
      expect(abilityData.calculatedDamage).toBe(0);
    });

    it('calculates damage based on stat and multiplier', () => {
      abilityData.isAttack = true;
      abilityData.damageStat = 'strength';
      abilityData.damageMult = 0.5;
      abilityData.damageBonus = 2;
      abilityData.damage = 5;
      abilityData.parent = {
        actor: {
          system: {
            stats: { strength: { total: 20 } }
          }
        }
      };
      expect(abilityData.calculatedDamage).toBe(17); // floor(20 * 0.5) + 2 + 5 = 17
    });

    it('uses custom damage if damageStat is custom', () => {
      abilityData.isAttack = true;
      abilityData.damageStat = 'custom';
      abilityData.damage = 10;
      abilityData.damageBonus = 5;
      abilityData.parent = { actor: {} };
      expect(abilityData.calculatedDamage).toBe(15);
    });
  });
});
