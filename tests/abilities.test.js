import { describe, it, expect, beforeEach } from 'vitest';
import { TAMSAbilityData } from '../src/models/item.js';

// Helper to create a fresh ability with optional overrides
function makeAbility(overrides = {}) {
  const ability = new TAMSAbilityData();
  ability.familiarity = 0;
  ability.upgradePoints = 0;
  ability.bonus = 0;
  ability.cost = 0;
  ability.resource = 'stamina';
  ability.isApex = false;
  ability.isReaction = false;
  ability.uses = { value: 0, max: 0 };
  ability.isAttack = false;
  ability.damage = 0;
  ability.armourPenetration = 0;
  ability.attackStat = 'strength';
  ability.capStat = 'strength';
  ability.damageStat = 'strength';
  ability.damageMult = 0.5;
  ability.damageBonus = 0;
  ability.multiAttack = 1;
  ability.isAoE = false;
  ability.tags = '';
  ability.description = '';
  ability.ifStatement = '';
  ability.ifCost = 0;
  ability.calculator = {
    enabled: false,
    isUtility: false,
    effects: 0,
    guaranteedMax: 0,
    detriments: 0,
    movementDoubleOwn: false,
    movementHalveEnemy: false,
    movementFlat: 0,
    rollBonus: 0,
    ignoreArmor: 0,
    targetingMode: 'normal',
    bodyPart: 'none',
    targetLimb: 'none',
    fireRate: 'single',
    multiAttackHits: 0,
    damageStatFraction: '0',
    stun: 'none',
    healing: 0,
    drType: 'none',
    drValue: 0,
    bypassDodge: false,
    bypassRetaliation: false,
    targetType: 'single',
    aoeRadius: 0,
    range: 0,
    duration: 'instant',
    isStackable: false
  };
  Object.assign(ability, overrides);
  return ability;
}

function mockActor(stats = {}) {
  return {
    system: {
      stats: {
        strength: { total: 20 },
        dexterity: { total: 15 },
        intelligence: { total: 30 },
        wisdom: { total: 25 },
        ...stats
      }
    }
  };
}

// ─── Basic Properties ────────────────────────────────────────────────────────

describe('TAMSAbilityData — basic properties', () => {
  it('defaults to non-apex, non-reaction, non-attack', () => {
    const a = makeAbility();
    expect(a.isApex).toBe(false);
    expect(a.isReaction).toBe(false);
    expect(a.isAttack).toBe(false);
  });

  it('can be set as an apex ability', () => {
    const a = makeAbility({ isApex: true });
    expect(a.isApex).toBe(true);
  });

  it('can be set as a reaction ability', () => {
    const a = makeAbility({ isReaction: true });
    expect(a.isReaction).toBe(true);
  });

  it('can be both apex and reaction', () => {
    const a = makeAbility({ isApex: true, isReaction: true });
    expect(a.isApex).toBe(true);
    expect(a.isReaction).toBe(true);
  });

  it('stores resource type', () => {
    const a = makeAbility({ resource: 'mana' });
    expect(a.resource).toBe('mana');
  });

  it('stores uses value and max', () => {
    const a = makeAbility({ uses: { value: 3, max: 5 } });
    expect(a.uses.value).toBe(3);
    expect(a.uses.max).toBe(5);
  });

  it('stores familiarity, upgradePoints, bonus', () => {
    const a = makeAbility({ familiarity: 2, upgradePoints: 5, bonus: 10 });
    expect(a.familiarity).toBe(2);
    expect(a.upgradePoints).toBe(5);
    expect(a.bonus).toBe(10);
  });

  it('stores ifStatement and ifCost', () => {
    const a = makeAbility({ ifStatement: 'If in cover', ifCost: 3 });
    expect(a.ifStatement).toBe('If in cover');
    expect(a.ifCost).toBe(3);
  });

  it('stores tags and description', () => {
    const a = makeAbility({ tags: 'fire,aoe', description: '<p>Test</p>' });
    expect(a.tags).toBe('fire,aoe');
    expect(a.description).toBe('<p>Test</p>');
  });
});

// ─── calculatedDamage ────────────────────────────────────────────────────────

describe('TAMSAbilityData — calculatedDamage', () => {
  it('returns 0 when isAttack is false', () => {
    const a = makeAbility({ isAttack: false });
    a.parent = { actor: mockActor() };
    expect(a.calculatedDamage).toBe(0);
  });

  it('returns 0 when no parent actor', () => {
    const a = makeAbility({ isAttack: true });
    a.parent = null;
    expect(a.calculatedDamage).toBe(0);
  });

  it('calculates stat-based damage: floor(stat * mult) + bonus + base', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 0.5, damageBonus: 2, damage: 3 });
    a.parent = { actor: mockActor({ strength: { total: 20 } }) };
    expect(a.calculatedDamage).toBe(15); // floor(20*0.5)+2+3
  });

  it('uses damageMult of 1.0 correctly', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 1.0, damageBonus: 0, damage: 0 });
    a.parent = { actor: mockActor({ strength: { total: 20 } }) };
    expect(a.calculatedDamage).toBe(20);
  });

  it('uses damageMult of 0.25 correctly', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 0.25, damageBonus: 0, damage: 0 });
    a.parent = { actor: mockActor({ strength: { total: 20 } }) };
    expect(a.calculatedDamage).toBe(5);
  });

  it('uses custom damageStat (intelligence)', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'intelligence', damageMult: 0.5, damageBonus: 0, damage: 0 });
    a.parent = { actor: mockActor({ intelligence: { total: 40 } }) };
    expect(a.calculatedDamage).toBe(20);
  });

  it('uses "custom" damageStat — returns damage + damageBonus only', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'custom', damage: 10, damageBonus: 5 });
    a.parent = { actor: mockActor() };
    expect(a.calculatedDamage).toBe(15);
  });

  it('handles zero stat gracefully', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 0.5, damageBonus: 0, damage: 0 });
    a.parent = { actor: mockActor({ strength: { total: 0 } }) };
    expect(a.calculatedDamage).toBe(0);
  });

  it('floors fractional stat damage', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 0.5, damageBonus: 0, damage: 0 });
    a.parent = { actor: mockActor({ strength: { total: 15 } }) };
    expect(a.calculatedDamage).toBe(7); // floor(15*0.5)=7
  });

  it('includes armourPenetration as a stored field (not in damage calc)', () => {
    const a = makeAbility({ isAttack: true, armourPenetration: 5, damageStat: 'custom', damage: 10, damageBonus: 0 });
    a.parent = { actor: mockActor() };
    expect(a.armourPenetration).toBe(5);
    expect(a.calculatedDamage).toBe(10);
  });

  it('supports multiAttack field', () => {
    const a = makeAbility({ isAttack: true, multiAttack: 3, damageStat: 'custom', damage: 5, damageBonus: 0 });
    a.parent = { actor: mockActor() };
    expect(a.multiAttack).toBe(3);
    expect(a.calculatedDamage).toBe(5); // multiAttack doesn't multiply calculatedDamage
  });

  it('supports isAoE attack', () => {
    const a = makeAbility({ isAttack: true, isAoE: true, damageStat: 'custom', damage: 8, damageBonus: 0 });
    a.parent = { actor: mockActor() };
    expect(a.isAoE).toBe(true);
    expect(a.calculatedDamage).toBe(8);
  });
});

// ─── calculatedCost — Basic ──────────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost basic', () => {
  it('returns minimum 1 even with no fields set', () => {
    const a = makeAbility();
    expect(a.calculatedCost).toBe(1);
  });

  it('adds +1 per effect', () => {
    const a = makeAbility();
    a.calculator.effects = 3;
    expect(a.calculatedCost).toBe(3);
  });

  it('adds +2 per guaranteedMax', () => {
    const a = makeAbility();
    a.calculator.guaranteedMax = 2;
    expect(a.calculatedCost).toBe(4);
  });

  it('subtracts -1 per detriment', () => {
    const a = makeAbility();
    a.calculator.effects = 5;
    a.calculator.detriments = 2;
    expect(a.calculatedCost).toBe(3);
  });

  it('detriments alone cannot reduce below 1', () => {
    const a = makeAbility();
    a.calculator.detriments = 10;
    expect(a.calculatedCost).toBe(1);
  });
});

// ─── calculatedCost — Movement ───────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost movement', () => {
  it('adds +2 for movementDoubleOwn', () => {
    const a = makeAbility();
    a.calculator.movementDoubleOwn = true;
    expect(a.calculatedCost).toBe(2);
  });

  it('adds +4 for movementHalveEnemy', () => {
    const a = makeAbility();
    a.calculator.movementHalveEnemy = true;
    expect(a.calculatedCost).toBe(4);
  });

  it('adds +2 per movementFlat unit', () => {
    const a = makeAbility();
    a.calculator.movementFlat = 3;
    expect(a.calculatedCost).toBe(6);
  });

  it('stacks all movement bonuses', () => {
    const a = makeAbility();
    a.calculator.movementDoubleOwn = true;
    a.calculator.movementHalveEnemy = true;
    a.calculator.movementFlat = 2;
    expect(a.calculatedCost).toBe(10); // 2+4+4
  });
});

// ─── calculatedCost — Offense ────────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost offense', () => {
  it('adds +1 per 5 rollBonus', () => {
    const a = makeAbility();
    a.calculator.rollBonus = 10;
    expect(a.calculatedCost).toBe(2);
  });

  it('rollBonus below 5 adds nothing', () => {
    const a = makeAbility();
    a.calculator.rollBonus = 4;
    expect(a.calculatedCost).toBe(1);
  });

  it('ignoreArmor=1 adds +1', () => {
    const a = makeAbility();
    a.calculator.ignoreArmor = 1;
    expect(a.calculatedCost).toBe(1);
  });

  it('ignoreArmor=2 adds +3 (1 + 2)', () => {
    const a = makeAbility();
    a.calculator.ignoreArmor = 2;
    expect(a.calculatedCost).toBe(3);
  });

  it('ignoreArmor=3 adds +5 (1 + 2 + 2)', () => {
    const a = makeAbility();
    a.calculator.ignoreArmor = 3;
    expect(a.calculatedCost).toBe(5);
  });

  it('fireRate burst adds +2', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.fireRate = 'burst';
    expect(a.calculatedCost).toBe(3);
  });

  it('fireRate auto adds +4', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.fireRate = 'auto';
    expect(a.calculatedCost).toBe(5);
  });

  it('multiAttackHits adds +2 each', () => {
    const a = makeAbility();
    a.calculator.multiAttackHits = 3;
    expect(a.calculatedCost).toBe(6);
  });

  it('damageStatFraction 0.25 adds +1', () => {
    const a = makeAbility();
    a.calculator.damageStatFraction = '0.25';
    expect(a.calculatedCost).toBe(1);
  });

  it('damageStatFraction 0.5 adds +2', () => {
    const a = makeAbility();
    a.calculator.damageStatFraction = '0.5';
    expect(a.calculatedCost).toBe(2);
  });
});

// ─── calculatedCost — Targeting ──────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost targeting', () => {
  it('bodyPart set adds +2', () => {
    const a = makeAbility();
    a.calculator.bodyPart = 'thorax';
    expect(a.calculatedCost).toBe(2);
  });

  it('bodyPart "none" adds nothing', () => {
    const a = makeAbility();
    a.calculator.bodyPart = 'none';
    expect(a.calculatedCost).toBe(1);
  });

  it('targetLimb set adds +4', () => {
    const a = makeAbility();
    a.calculator.targetLimb = 'leftArm';
    expect(a.calculatedCost).toBe(4);
  });

  it('targetType multiple doubles cost (non-utility)', () => {
    const a = makeAbility();
    a.calculator.effects = 3;
    a.calculator.targetType = 'multiple';
    expect(a.calculatedCost).toBe(6); // 3 * 2
  });

  it('targetType multiple with isUtility multiplies by 1.5', () => {
    const a = makeAbility();
    a.calculator.effects = 4;
    a.calculator.isUtility = true;
    a.calculator.targetType = 'multiple';
    expect(a.calculatedCost).toBe(6); // floor(4 * 1.5)
  });

  it('aoeRadius 1 adds +2', () => {
    const a = makeAbility();
    a.calculator.aoeRadius = 1;
    expect(a.calculatedCost).toBe(2);
  });

  it('aoeRadius 3 adds +2 (no extra)', () => {
    const a = makeAbility();
    a.calculator.aoeRadius = 3;
    expect(a.calculatedCost).toBe(2);
  });

  it('aoeRadius 5 adds +4 (2 base + 2 extra)', () => {
    const a = makeAbility();
    a.calculator.aoeRadius = 5;
    expect(a.calculatedCost).toBe(4);
  });
});

// ─── calculatedCost — Effects ────────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost effects', () => {
  it('stun crit adds +1', () => {
    const a = makeAbility();
    a.calculator.stun = 'crit';
    expect(a.calculatedCost).toBe(1);
  });

  it('stun guaranteed adds +2', () => {
    const a = makeAbility();
    a.calculator.stun = 'guaranteed';
    expect(a.calculatedCost).toBe(2);
  });

  it('healing adds +1 per point', () => {
    const a = makeAbility();
    a.calculator.healing = 4;
    expect(a.calculatedCost).toBe(4);
  });

  it('drType set with drValue adds drValue cost', () => {
    const a = makeAbility();
    a.calculator.drType = 'fire';
    a.calculator.drValue = 3;
    expect(a.calculatedCost).toBe(3);
  });

  it('drType "none" adds nothing even with drValue', () => {
    const a = makeAbility();
    a.calculator.drType = 'none';
    a.calculator.drValue = 5;
    expect(a.calculatedCost).toBe(1);
  });
});

// ─── calculatedCost — Multipliers ────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost multipliers', () => {
  it('bypassDodge doubles cost', () => {
    const a = makeAbility();
    a.calculator.effects = 3;
    a.calculator.bypassDodge = true;
    expect(a.calculatedCost).toBe(6);
  });

  it('bypassRetaliation doubles cost', () => {
    const a = makeAbility();
    a.calculator.effects = 3;
    a.calculator.bypassRetaliation = true;
    expect(a.calculatedCost).toBe(6);
  });

  it('both bypass flags quadruple cost', () => {
    const a = makeAbility();
    a.calculator.effects = 3;
    a.calculator.bypassDodge = true;
    a.calculator.bypassRetaliation = true;
    expect(a.calculatedCost).toBe(12);
  });

  it('isStackable doubles final cost', () => {
    const a = makeAbility();
    a.calculator.effects = 3;
    a.calculator.isStackable = true;
    expect(a.calculatedCost).toBe(6);
  });

  it('bypassDodge + isStackable: quadruples cost', () => {
    const a = makeAbility();
    a.calculator.effects = 2;
    a.calculator.bypassDodge = true;
    a.calculator.isStackable = true;
    expect(a.calculatedCost).toBe(8); // 2 * 2 (dodge) * 2 (stackable)
  });
});

// ─── calculatedCost — Range ──────────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost range (combat)', () => {
  it('range 0-10 adds nothing', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.range = 10;
    expect(a.calculatedCost).toBe(1);
  });

  it('range 11-25 adds +1', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.range = 25;
    expect(a.calculatedCost).toBe(2);
  });

  it('range 26-50 adds +2', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.range = 50;
    expect(a.calculatedCost).toBe(3);
  });

  it('range 51-75 adds +3', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.range = 75;
    expect(a.calculatedCost).toBe(4);
  });

  it('range 76-100 adds +4', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.range = 100;
    expect(a.calculatedCost).toBe(5);
  });

  it('range 150 adds +4 + floor((150-100)/50)=+1 = +5', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.range = 150;
    expect(a.calculatedCost).toBe(6);
  });

  it('range 200 adds +4 + floor(100/50)=+2 = +6', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.range = 200;
    expect(a.calculatedCost).toBe(7);
  });
});

describe('TAMSAbilityData — calculatedCost range (utility)', () => {
  it('utility range <100 adds nothing', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.range = 99;
    expect(a.calculatedCost).toBe(1);
  });

  it('utility range 100-999 adds +1', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.range = 500;
    expect(a.calculatedCost).toBe(2);
  });

  it('utility range 1000-9999 adds +2', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.range = 5000;
    expect(a.calculatedCost).toBe(3);
  });

  it('utility range 10000+ adds +3', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.range = 10000;
    expect(a.calculatedCost).toBe(4);
  });
});

// ─── calculatedCost — Duration ───────────────────────────────────────────────

describe('TAMSAbilityData — calculatedCost duration (combat)', () => {
  it('instant duration adds nothing', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.duration = 'instant';
    expect(a.calculatedCost).toBe(1);
  });

  it('1round adds +1', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.duration = '1round';
    expect(a.calculatedCost).toBe(2);
  });

  it('2rounds adds +2', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.duration = '2rounds';
    expect(a.calculatedCost).toBe(3);
  });

  it('3rounds adds +4', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.duration = '3rounds';
    expect(a.calculatedCost).toBe(5);
  });
});

describe('TAMSAbilityData — calculatedCost duration (utility)', () => {
  it('utility1 adds +1', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.duration = 'utility1';
    expect(a.calculatedCost).toBe(2);
  });

  it('utility2 adds +2', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.duration = 'utility2';
    expect(a.calculatedCost).toBe(3);
  });

  it('utility3 adds +3', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.duration = 'utility3';
    expect(a.calculatedCost).toBe(4);
  });

  it('utility4 adds +4', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 1;
    a.calculator.duration = 'utility4';
    expect(a.calculatedCost).toBe(5);
  });
});

// ─── Complex / Realistic Ability Builds ──────────────────────────────────────

describe('TAMSAbilityData — realistic ability builds', () => {
  it('Apex ability: no cost calculation needed, just flags', () => {
    const a = makeAbility({ isApex: true, isReaction: false });
    expect(a.isApex).toBe(true);
    expect(a.calculatedCost).toBe(1); // calculator not used for apex
  });

  it('Reaction ability: basic 1-effect stamina cost', () => {
    const a = makeAbility({ isReaction: true, resource: 'stamina' });
    a.calculator.effects = 1;
    expect(a.isReaction).toBe(true);
    expect(a.calculatedCost).toBe(1);
  });

  it('Simple attack ability: strength-based, no extras', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 0.5, damageBonus: 0, damage: 0 });
    a.parent = { actor: mockActor({ strength: { total: 30 } }) };
    expect(a.calculatedDamage).toBe(15);
  });

  it('Heavy melee ability: high damage mult, armour pen', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 1.0, damageBonus: 5, damage: 0, armourPenetration: 3 });
    a.parent = { actor: mockActor({ strength: { total: 40 } }) };
    expect(a.calculatedDamage).toBe(45); // floor(40*1.0)+5
    expect(a.armourPenetration).toBe(3);
  });

  it('Sniper ability: long range, single target, high cost', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'dexterity', damageMult: 0.5, damageBonus: 0, damage: 0 });
    a.parent = { actor: mockActor({ dexterity: { total: 50 } }) };
    a.calculator.effects = 2;
    a.calculator.range = 200;
    a.calculator.ignoreArmor = 2;
    // cost: 2 + 6(range) + 3(ignoreArmor) = 11
    expect(a.calculatedCost).toBe(11);
    expect(a.calculatedDamage).toBe(25);
  });

  it('AoE burst ability: multiple targets, burst fire, aoe radius', () => {
    const a = makeAbility();
    a.calculator.effects = 2;
    a.calculator.fireRate = 'burst';
    a.calculator.targetType = 'multiple';
    a.calculator.aoeRadius = 5;
    // cost before multiply: 2+2+4 = 8; *2 (multiple) = 16
    expect(a.calculatedCost).toBe(16);
  });

  it('Utility heal ability: healing + duration + utility range', () => {
    const a = makeAbility({ resource: 'mana' });
    a.calculator.isUtility = true;
    a.calculator.healing = 5;
    a.calculator.duration = 'utility2';
    a.calculator.range = 500;
    // cost: 5 + 2 + 1 = 8
    expect(a.calculatedCost).toBe(8);
  });

  it('Stun + bypass dodge ability: expensive combo', () => {
    const a = makeAbility();
    a.calculator.effects = 2;
    a.calculator.stun = 'guaranteed';
    a.calculator.bypassDodge = true;
    // cost: (2+2)*2 = 8
    expect(a.calculatedCost).toBe(8);
  });

  it('Multi-hit auto-fire ability', () => {
    const a = makeAbility({ isAttack: true, multiAttack: 4, damageStat: 'custom', damage: 5, damageBonus: 0 });
    a.parent = { actor: mockActor() };
    a.calculator.fireRate = 'auto';
    a.calculator.multiAttackHits = 3;
    // cost: 4 + 6 = 10
    expect(a.calculatedCost).toBe(10);
    expect(a.calculatedDamage).toBe(5);
  });

  it('Stackable movement ability: doubles final cost', () => {
    const a = makeAbility();
    a.calculator.movementDoubleOwn = true;
    a.calculator.movementFlat = 2;
    a.calculator.isStackable = true;
    // cost before stackable: 2+4=6; *2=12
    expect(a.calculatedCost).toBe(12);
  });

  it('Limb-targeting attack with DR', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'custom', damage: 8, damageBonus: 0 });
    a.parent = { actor: mockActor() };
    a.calculator.targetLimb = 'leftArm';
    a.calculator.drType = 'fire';
    a.calculator.drValue = 2;
    // cost: 4+2 = 6
    expect(a.calculatedCost).toBe(6);
    expect(a.calculatedDamage).toBe(8);
  });

  it('Full-featured combat ability: all multipliers', () => {
    const a = makeAbility({ isAttack: true, damageStat: 'strength', damageMult: 0.5, damageBonus: 10, damage: 0 });
    a.parent = { actor: mockActor({ strength: { total: 40 } }) };
    a.calculator.effects = 3;
    a.calculator.guaranteedMax = 1;
    a.calculator.stun = 'crit';
    a.calculator.bypassDodge = true;
    a.calculator.bypassRetaliation = true;
    a.calculator.isStackable = true;
    // cost: (3+2+1)*2*2*2 = 48
    expect(a.calculatedCost).toBe(48);
    expect(a.calculatedDamage).toBe(30); // floor(40*0.5)+10
  });

  it('Utility ability with multiple targets at 1.5x', () => {
    const a = makeAbility();
    a.calculator.isUtility = true;
    a.calculator.effects = 4;
    a.calculator.targetType = 'multiple';
    // cost: floor(4 * 1.5) = 6
    expect(a.calculatedCost).toBe(6);
  });

  it('Ability with detriments reducing cost to minimum 1', () => {
    const a = makeAbility();
    a.calculator.effects = 1;
    a.calculator.detriments = 5;
    expect(a.calculatedCost).toBe(1);
  });

  it('Ability with capStat set (non-attack)', () => {
    const a = makeAbility({ isAttack: false, capStat: 'intelligence' });
    expect(a.capStat).toBe('intelligence');
    expect(a.calculatedDamage).toBe(0);
  });

  it('Ability with uses tracking', () => {
    const a = makeAbility({ uses: { value: 2, max: 5 }, resource: 'stamina', cost: 3 });
    expect(a.uses.value).toBe(2);
    expect(a.uses.max).toBe(5);
    expect(a.cost).toBe(3);
  });
});
