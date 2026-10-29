import { describe, it, expect } from 'vitest';
import { TAMSActor } from '../src/documents/actor.js';

const KEYS = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

function makeActor(limbOverrides = {}, armorZones = {}) {
  const limbs = {};
  for (const k of KEYS) limbs[k] = { value: 10, max: 10, equippedArmorId: "", armor: 0, armorMax: 0, ...limbOverrides[k] };
  const itemLimbs = {};
  for (const k of KEYS) itemLimbs[k] = { value: 0, max: 0, ...armorZones[k] };
  const armor = { id: "arm1", type: "armor", system: { limbs: itemLimbs } };
  const actor = new TAMSActor({ name: "Test", system: { limbs } });
  actor.items = new Map([["arm1", armor]]);
  actor.updates = [];
  actor.updateEmbeddedDocuments = (type, updates) => { actor.updates.push(...updates); };
  return actor;
}

describe("_mirrorLimbArmorToItems", () => {
  it("writes an edited limb armour value back to the selected armour item", () => {
    const actor = makeActor({ thorax: { equippedArmorId: "arm1", armor: 7, armorMax: 10 } }, { thorax: { value: 10, max: 10 } });
    actor._mirrorLimbArmorToItems({ system: { limbs: { thorax: { armor: 7 } } } });
    expect(actor.updates).toEqual([{ _id: "arm1", "system.limbs.thorax.value": 7 }]);
  });

  it("batches several limbs on the same item into one update", () => {
    const actor = makeActor(
      { thorax: { equippedArmorId: "arm1", armor: 5, armorMax: 8 }, stomach: { equippedArmorId: "arm1", armor: 4, armorMax: 10 } },
      { thorax: { value: 10, max: 10 }, stomach: { value: 10, max: 10 } }
    );
    actor._mirrorLimbArmorToItems({ system: { limbs: { thorax: { armor: 5, armorMax: 8 }, stomach: { armor: 4 } } } });
    expect(actor.updates).toEqual([{ _id: "arm1", "system.limbs.thorax.value": 5, "system.limbs.thorax.max": 8, "system.limbs.stomach.value": 4 }]);
  });

  it("skips limbs whose selected item changed in the same update", () => {
    const actor = makeActor({ thorax: { equippedArmorId: "", armor: 0, armorMax: 0 } }, { thorax: { value: 10, max: 10 } });
    actor._mirrorLimbArmorToItems({ system: { limbs: { thorax: { equippedArmorId: "", armor: 0, armorMax: 0 } } } });
    expect(actor.updates).toEqual([]);
  });

  it("does nothing for limbs without a selected armour item or unchanged values", () => {
    const actor = makeActor({ head: { armor: 3 }, thorax: { equippedArmorId: "arm1", armor: 10 } }, { thorax: { value: 10, max: 10 } });
    actor._mirrorLimbArmorToItems({ system: { limbs: { head: { armor: 3 }, thorax: { armor: 10 } } } });
    expect(actor.updates).toEqual([]);
  });
});
