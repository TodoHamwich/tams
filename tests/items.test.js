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

    it('uses explicit damageStat for melee damage scaling, overriding attackStat', () => {
      weaponData.isRanged = false;
      weaponData.attackStat = "intelligence";
      weaponData.damageStat = "wisdom";
      mockActor.system.stats.intelligence = { total: 40 };
      mockActor.system.stats.wisdom = { total: 30 };
      expect(weaponData.calculatedDamage).toBe(15); // 30 * 0.5
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

    it('adds damageComponents amounts on top of the stat formula', () => {
      weaponData.isRanged = false;
      weaponData.isHeavy = true;
      weaponData.isTwoHanded = true; // 20 * 1.0 = 20
      weaponData.damageComponents = [
        { damageType: "fire", amount: 6 },
        { damageType: "necrotic", amount: 4.7 },
      ];
      expect(weaponData.calculatedDamage).toBe(30); // 20 + 6 + floor(4.7)
    });
  });

  describe('damageBreakdown', () => {
    it('wraps the legacy single damageType/calculatedDamage into a one-element array', () => {
      weaponData.isRanged = true;
      weaponData.rangedDamage = 25;
      weaponData.damageType = "piercing";
      expect(weaponData.damageBreakdown).toEqual([{ damageType: "piercing", damage: 25 }]);
    });

    it('puts the stat damage in damageType and each component after it', () => {
      weaponData.isRanged = true;
      weaponData.rangedDamage = 25;
      weaponData.damageType = "piercing";
      weaponData.damageComponents = [
        { damageType: "fire", amount: 6 },
        { damageType: "necrotic", amount: 4 },
      ];
      expect(weaponData.damageBreakdown).toEqual([
        { damageType: "piercing", damage: 25 },
        { damageType: "fire", damage: 6 },
        { damageType: "necrotic", damage: 4 },
      ]);
    });

    it('drops a zero stat part when components carry the damage', () => {
      weaponData.isRanged = true;
      weaponData.rangedDamage = 0;
      weaponData.damageComponents = [{ damageType: "fire", amount: 6 }];
      expect(weaponData.damageBreakdown).toEqual([{ damageType: "fire", damage: 6 }]);
    });
  });

  describe('magic bonus damage', () => {
    beforeEach(() => {
      weaponData.damageType = "slashing";
      weaponData.magic = { bonusDamage: [{ damageType: "fire", amount: 5 }] };
      weaponData.parent = { id: "w1", actor: mockActor };
    });

    it('is added on top as its own component while the item is active', () => {
      mockActor.system.magicState = { w1: { onUse: true } };
      expect(weaponData.calculatedDamage).toBe(15); // 10 base + 5 fire
      expect(weaponData.baseDamage).toBe(10);
      expect(weaponData.damageBreakdown).toEqual([
        { damageType: "slashing", damage: 10 },
        { damageType: "fire", damage: 5 },
      ]);
    });

    it('is left out when the requirements are not met', () => {
      mockActor.system.magicState = { w1: { onUse: false } };
      expect(weaponData.calculatedDamage).toBe(10);
      expect(weaponData.damageBreakdown).toEqual([{ damageType: "slashing", damage: 10 }]);
    });
  });
});

describe('TAMSAbilityData', () => {
  let abilityData;

  beforeEach(() => {
    abilityData = new TAMSAbilityData();
    abilityData.calculator = {
      effects: 0,
      guaranteedMax: 0,
      detriments: 0,
      movementDoubleOwn: false,
      movementHalveEnemy: false,
      movementFlat: 0,
      rollBonus: 0,
      ignoreArmor: 0,
      bodyPart: "none",
      targetLimb: "none",
      fireRate: "single",
      multiAttackHits: 0,
      damageStatFraction: "0",
      stun: "none",
      healing: 0,
      drType: "none",
      drValue: 0,
      bypassDodge: false,
      bypassRetaliation: false,
      isUtility: false,
      targetType: "single",
      aoeRadius: 0,
      range: 0,
      duration: "instant",
      isStackable: false
    };
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

    it('adds damageComponents amounts on top of the formula damage', () => {
      abilityData.isAttack = true;
      abilityData.damageStat = 'custom';
      abilityData.damage = 10;
      abilityData.damageBonus = 0;
      abilityData.damageComponents = [
        { damageType: "slashing", amount: 6 },
        { damageType: "necrotic", amount: 4 },
      ];
      abilityData.parent = { actor: {} };
      expect(abilityData.calculatedDamage).toBe(20);
    });
  });

  describe('damageBreakdown', () => {
    it('wraps the legacy single damageType/calculatedDamage into a one-element array', () => {
      abilityData.isAttack = true;
      abilityData.damageStat = 'custom';
      abilityData.damage = 10;
      abilityData.damageBonus = 0;
      abilityData.damageType = "necrotic";
      abilityData.parent = { actor: {} };
      expect(abilityData.damageBreakdown).toEqual([{ damageType: "necrotic", damage: 10 }]);
    });

    it('puts the formula damage in damageType and each component after it', () => {
      abilityData.isAttack = true;
      abilityData.damageStat = 'custom';
      abilityData.damage = 10;
      abilityData.damageBonus = 0;
      abilityData.damageType = "fire";
      abilityData.damageComponents = [
        { damageType: "slashing", amount: 6 },
        { damageType: "necrotic", amount: 4 },
      ];
      abilityData.parent = { actor: {} };
      expect(abilityData.damageBreakdown).toEqual([
        { damageType: "fire", damage: 10 },
        { damageType: "slashing", damage: 6 },
        { damageType: "necrotic", damage: 4 },
      ]);
    });
  });

  describe('weaponDamageBreakdown (useWeaponDamage)', () => {
    // Flaming sword: 20 Slashing stat damage + a 5 Fire split extra.
    const sword = { system: { statDamage: 20, damageType: "slashing", damageComponents: [{ damageType: "fire", amount: 5 }], magic: {} } };

    it('defaults to the weapon damage unchanged', () => {
      expect(abilityData.weaponDamageBreakdown(sword)).toEqual([
        { damageType: "slashing", damage: 20 },
        { damageType: "fire", damage: 5 },
      ]);
    });

    it('multiplies only the main type (rounded down), then adds the flat bonus', () => {
      abilityData.weaponDamageMult = 1.25; // 20 × 1.25 = 25
      abilityData.damageBonus = 3;
      expect(abilityData.weaponDamageBreakdown(sword)).toEqual([
        { damageType: "slashing", damage: 28 },
        { damageType: "fire", damage: 5 },
      ]);
      abilityData.weaponDamageMult = 1.33; // 26.6 → 26
      abilityData.damageBonus = 0;
      expect(abilityData.weaponDamageBreakdown(sword)[0].damage).toBe(26);
    });

    it("adds the ability's own split extras after the weapon's", () => {
      abilityData.damageComponents = [{ damageType: "radiant", amount: 8 }];
      expect(abilityData.weaponDamageBreakdown(sword)).toEqual([
        { damageType: "slashing", damage: 20 },
        { damageType: "fire", damage: 5 },
        { damageType: "radiant", damage: 8 },
      ]);
    });

    it("ignores the ability's own damageMult (its 0.5 default must not halve weapon damage)", () => {
      abilityData.damageMult = 0.5;
      expect(abilityData.weaponDamageBreakdown(sword)[0].damage).toBe(20);
    });
  });

  describe('calculatedCost targeting', () => {
    it('adds no targeting cost in normal mode defaults', () => {
      expect(abilityData.calculatedCost).toBe(1);
    });

    it('adds +2 when targeting a limb group', () => {
      abilityData.calculator.bodyPart = 'thorax';
      expect(abilityData.calculatedCost).toBe(2);
    });

    it('adds +4 when targeting a specific limb', () => {
      abilityData.calculator.targetLimb = 'leftArm';
      expect(abilityData.calculatedCost).toBe(4);
    });
  });
});
