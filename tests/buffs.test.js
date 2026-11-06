import { describe, it, expect } from 'vitest';
import {
  hasBuffEffects, buffSnapshot, createBuffEntry, planBuffApplication, applyBuffPlan, stepRounds, stepClock,
  carryToClock, crashFor, advanceBuffs, activeBuffEntries, itemBuffBonusDamage, itemBuffArmourPen,
  itemBuffOnHitStatuses, itemBuffAttackBonus, formatBuffTime,
} from '../src/utils/buffs.js';

const STR = { target: "stats.strength.value", value: 20 };
const caster = { name: "Aria", uuid: "Actor.aria" };
const block = (over = {}) => ({
  enabled: true, attachTo: "character", duration: "2rounds", stackable: false, modifiers: [], resistances: [],
  bonusDamage: [], onHitStatusIds: [], armourPenetration: 0, ...over,
});
const snap = (over = {}, name = "Bless") => buffSnapshot(name, block({ modifiers: [{ target: "allRolls", value: 5 }], ...over }), caster);
const COMBAT = { id: "c1", round: 3 };
const entry = (over = {}, ctx = { id: "b1", combat: COMBAT, now: 0 }) => createBuffEntry(snap(over), ctx);
const turn = (over = {}) => ({ combatId: "c1", round: 4, isCasterTurn: true, casterCanAct: true, ...over });

describe('buffSnapshot', () => {
  it('is null when the ability gives no buff', () => {
    expect(buffSnapshot("X", block({ enabled: false, modifiers: [STR] }), caster)).toBeNull();
    expect(buffSnapshot("X", block(), caster)).toBeNull();
    expect(buffSnapshot("X", null, caster)).toBeNull();
  });

  it('drops item-use effects from a buff on a character', () => {
    const s = buffSnapshot("X", block({
      modifiers: [STR, { target: "itemAttacks", value: 5 }],
      bonusDamage: [{ damageType: "fire", amount: 5 }], onHitStatusIds: ["prone"], armourPenetration: 3,
    }), caster);
    expect(s.modifiers).toEqual([STR]);
    expect(s.bonusDamage).toEqual([]);
    expect(s.onHitStatusIds).toEqual([]);
    expect(s.armourPenetration).toBe(0);
  });

  it('keeps item-use effects on a weapon buff', () => {
    const s = buffSnapshot("X", block({ attachTo: "weapon", bonusDamage: [{ damageType: "fire", amount: 5 }], armourPenetration: 3 }), caster);
    expect(s.bonusDamage).toEqual([{ damageType: "fire", amount: 5 }]);
    expect(s.armourPenetration).toBe(3);
  });

  it('treats item-use effects alone as no effect on a character', () => {
    expect(hasBuffEffects(block({ bonusDamage: [{ damageType: "fire", amount: 5 }] }))).toBe(false);
    expect(hasBuffEffects(block({ attachTo: "weapon", bonusDamage: [{ damageType: "fire", amount: 5 }] }))).toBe(true);
  });
});

describe('createBuffEntry', () => {
  it('counts rounds in combat', () => {
    expect(entry()).toMatchObject({ roundsLeft: 2, combatId: "c1", appliedRound: 3, expiresAt: null, baseRounds: 2 });
  });

  it('turns each round into 10 minutes out of combat', () => {
    expect(entry({}, { id: "b", combat: null, now: 100 })).toMatchObject({ roundsLeft: null, expiresAt: 1300 });
  });

  it('runs utility durations on the clock even in combat', () => {
    expect(entry({ duration: "utility1" })).toMatchObject({ roundsLeft: null, expiresAt: 3600, baseSeconds: 3600 });
  });
});

describe('planBuffApplication', () => {
  const stat = (value = 20) => ({ modifiers: [{ target: "stats.strength.value", value }] });

  it('adds a new buff', () => {
    expect(planBuffApplication(snap(), [], [])).toEqual({ action: "add" });
  });

  it('refreshes the same buff, matching by name across casters', () => {
    const existing = entry();
    expect(planBuffApplication(snap(), [existing], [existing])).toEqual({ action: "refresh", replaceId: "b1" });
  });

  it('adds a second copy when stackable', () => {
    const existing = entry({ stackable: true });
    expect(planBuffApplication(snap({ stackable: true }), [existing], [existing])).toEqual({ action: "add" });
  });

  it('refuses a second increase to a stat', () => {
    const other = createBuffEntry(snap(stat(), "Rage"), { id: "r", now: 0 });
    expect(planBuffApplication(snap(stat()), [other], [other])).toEqual({ action: "refuse", stats: ["strength"] });
  });

  it('refuses a stackable copy of a stat increase', () => {
    const first = entry({ ...stat(), stackable: true });
    expect(planBuffApplication(snap({ ...stat(), stackable: true }), [first], [first]).action).toBe("refuse");
  });

  it('allows refreshing the same stat increase', () => {
    const first = entry(stat());
    expect(planBuffApplication(snap(stat()), [first], [first]).action).toBe("refresh");
  });

  it('counts increases on the recipient\'s items', () => {
    const onSword = createBuffEntry(snap(stat(), "Rage"), { id: "r", now: 0 });
    expect(planBuffApplication(snap(stat()), [], [onSword]).action).toBe("refuse");
  });

  it('refuses an increase during that stat\'s penalty, even from the same buff', () => {
    const crash = crashFor(entry(stat()), { id: "x", now: 0 });
    expect(planBuffApplication(snap(stat()), [crash], [crash])).toEqual({ action: "refuse", stats: ["strength"] });
  });

  it('allows other stats during a penalty', () => {
    const crash = crashFor(entry(stat()), { id: "x", now: 0 });
    const dex = { modifiers: [{ target: "stats.dexterity.value", value: 10 }] };
    expect(planBuffApplication(snap(dex, "Haste"), [crash], [crash]).action).toBe("add");
  });

  it('does not limit roll bonuses', () => {
    const other = createBuffEntry(snap({}, "Rage"), { id: "r", now: 0 });
    expect(planBuffApplication(snap(), [other], [other]).action).toBe("add");
  });
});

describe('applyBuffPlan', () => {
  it('keeps the id and position on refresh', () => {
    const a = { id: "a" }, b = { id: "b", old: true };
    expect(applyBuffPlan([a, b], { id: "new" }, { action: "refresh", replaceId: "b" })).toEqual([a, { id: "b" }]);
  });
});

describe('stepRounds', () => {
  it('ticks at the start of the caster\'s turn', () => {
    expect(stepRounds(entry(), turn())).toMatchObject({ roundsLeft: 1, lastTickRound: 4 });
  });

  it('can tick on the round it was applied, if the caster\'s turn is still to come', () => {
    expect(stepRounds(entry(), turn({ round: 3 })).roundsLeft).toBe(1);
  });

  it('ends when no rounds are left', () => {
    expect(stepRounds(entry({ duration: "1round" }), turn())).toBeNull();
  });

  it('ignores other actors\' turns', () => {
    const e = entry();
    expect(stepRounds(e, turn({ isCasterTurn: false }))).toBe(e);
  });

  it('does not tick twice in one round', () => {
    const e = stepRounds(entry(), turn());
    expect(stepRounds(e, turn())).toBe(e);
  });

  it('ignores other combats and clock buffs', () => {
    const e = entry();
    expect(stepRounds(e, turn({ combatId: "c2" }))).toBe(e);
    const clock = entry({ duration: "utility1" });
    expect(stepRounds(clock, turn())).toBe(clock);
  });

  describe('when the caster can no longer act', () => {
    const gone = (round) => turn({ round, isCasterTurn: false, casterCanAct: false });

    it('waits for the next round after being applied', () => {
      const e = entry();
      expect(stepRounds(e, gone(3))).toBe(e);
    });

    it('ticks once per round', () => {
      const once = stepRounds(entry({ duration: "3rounds" }), gone(4));
      expect(once).toMatchObject({ roundsLeft: 2, lastTickRound: 4 });
      expect(stepRounds(once, gone(4))).toBe(once);
      expect(stepRounds(once, gone(5)).roundsLeft).toBe(1);
    });

    it('does not tick again in the round the caster already ticked it', () => {
      const ticked = stepRounds(entry({ duration: "3rounds" }), turn({ round: 4 }));
      expect(stepRounds(ticked, gone(4))).toBe(ticked);
    });
  });
});

describe('clock', () => {
  it('ends at the expiry time', () => {
    const e = entry({ duration: "utility1" }, { id: "b", combat: null, now: 0 });
    expect(stepClock(e, 3599)).toBe(e);
    expect(stepClock(e, 3600)).toBeNull();
  });

  it('leaves round buffs alone', () => {
    const e = entry();
    expect(stepClock(e, 999999)).toBe(e);
  });

  it('carries rounds left onto the clock at 10 minutes each', () => {
    expect(carryToClock(entry(), 50)).toMatchObject({ roundsLeft: null, combatId: "", expiresAt: 1250 });
  });

  it('leaves clock buffs alone when carrying', () => {
    const e = entry({ duration: "utility1" });
    expect(carryToClock(e, 50)).toBe(e);
  });
});

describe('crashFor', () => {
  const stat = { modifiers: [STR] };

  it('applies the rulebook example: +20 becomes -10 for double the time', () => {
    const utility = entry({ ...stat, duration: "utility1" }, { id: "b", now: 0 });
    expect(crashFor(utility, { id: "x", now: 100 })).toMatchObject({
      isCrash: true, modifiers: [{ target: STR.target, value: -10 }], expiresAt: 7300, baseSeconds: 7200,
    });
  });

  it('doubles rounds in combat', () => {
    expect(crashFor(entry(stat), { id: "x", combat: COMBAT, now: 0 })).toMatchObject({ roundsLeft: 4, combatId: "c1" });
  });

  it('rounds half down', () => {
    const crash = crashFor(entry({ modifiers: [{ target: STR.target, value: 5 }] }), { id: "x", now: 0 });
    expect(crash.modifiers[0].value).toBe(-2);
  });

  it('only penalizes stat increases', () => {
    expect(crashFor(entry(), { id: "x", now: 0 })).toBeNull();
    const mixed = entry({ modifiers: [STR, { target: "allRolls", value: 5 }] });
    expect(crashFor(mixed, { id: "x", now: 0 }).modifiers).toHaveLength(1);
  });

  it('does not crash from a crash', () => {
    const crash = crashFor(entry(stat), { id: "x", now: 0 });
    expect(crashFor(crash, { id: "y", now: 0 })).toBeNull();
  });
});

describe('advanceBuffs', () => {
  it('splits kept and ended, and reports changes', () => {
    const a = { id: "a" }, b = { id: "b" }, c = { id: "c" };
    const r = advanceBuffs([a, b, c], e => e === b ? null : e === c ? { ...c, x: 1 } : e);
    expect(r.kept).toEqual([a, { id: "c", x: 1 }]);
    expect(r.ended).toEqual([b]);
    expect(r.changed).toBe(true);
  });

  it('reports no change', () => {
    expect(advanceBuffs([{ id: "a" }], e => e).changed).toBe(false);
  });
});

describe('activeBuffEntries', () => {
  const buff = { id: "i" };
  const item = (over) => ({ id: "w", type: "weapon", system: { buffs: [buff], location: "hand", ...over } });
  const lookup = { get: () => null };

  it('includes buffs on the actor', () => {
    expect(activeBuffEntries([{ id: "a" }], [], lookup)).toEqual([{ id: "a" }]);
  });

  it('includes buffs on an equipped item', () => {
    expect(activeBuffEntries([], [item()], lookup)).toEqual([buff]);
  });

  it('skips buffs on an item that is not equipped', () => {
    expect(activeBuffEntries([], [item({ location: "stowed" })], lookup)).toEqual([]);
  });
});

describe('item buff effects', () => {
  const system = { buffs: [
    { bonusDamage: [{ damageType: "fire", amount: 5 }], armourPenetration: 2, onHitStatusIds: ["prone"], modifiers: [{ target: "itemAttacks", value: 5 }] },
    { bonusDamage: [{ damageType: "cold", amount: 3 }], armourPenetration: 1, onHitStatusIds: ["", "stunned"], modifiers: [{ target: "allRolls", value: 9 }] },
  ] };

  it('adds them up', () => {
    expect(itemBuffBonusDamage(system)).toEqual([{ damageType: "fire", damage: 5 }, { damageType: "cold", damage: 3 }]);
    expect(itemBuffArmourPen(system)).toBe(3);
    expect(itemBuffOnHitStatuses(system)).toEqual(["prone", "stunned"]);
    expect(itemBuffAttackBonus(system)).toBe(5);
  });

  it('copes with items that have no buffs', () => {
    expect(itemBuffBonusDamage({})).toEqual([]);
    expect(itemBuffArmourPen({})).toBe(0);
    expect(itemBuffOnHitStatuses({})).toEqual([]);
    expect(itemBuffAttackBonus({})).toBe(0);
  });
});

describe('formatBuffTime', () => {
  it('formats minutes and hours', () => {
    expect(formatBuffTime(30)).toBe("1m");
    expect(formatBuffTime(2700)).toBe("45m");
    expect(formatBuffTime(3600)).toBe("1h");
    expect(formatBuffTime(4800)).toBe("1h 20m");
  });
});
