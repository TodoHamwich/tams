import { describe, it, expect, beforeEach } from 'vitest';
import { StatModifier, TAMSCharacterData } from '../src/models/character.js';
import { TAMSTraitData } from '../src/models/item.js';

describe('StatModifier', () => {
  it('calculates total correctly', () => {
    const stat = new StatModifier({ value: 10, mod: 2 });
    expect(stat.total).toBe(12);
  });

  it('handles missing mod correctly', () => {
    const stat = new StatModifier({ value: 15 });
    expect(stat.total).toBe(15);
  });
});

describe('TAMSCharacterData', () => {
  let charData;

  beforeEach(() => {
    charData = new TAMSCharacterData();
    charData.stats = {
      endurance: { total: 10 }
    };
    charData.settings = {
      isNPC: false,
      squadSize: 1
    };
    charData.limbs = {
      head: { mult: 0.5, value: 5, max: 0 },
      thorax: { mult: 1.0, value: 10, max: 0 }
    };
    charData.hp = { value: 0, max: 0 };
    charData.stamina = { mult: 1.0, max: 0 };
    charData.customResources = [];
  });

  describe('_prepareLimbMaxHP', () => {
    it('calculates max HP for limbs correctly for individuals', () => {
      charData._prepareLimbMaxHP();
      expect(charData.limbs.head.max).toBe(5);
      expect(charData.limbs.thorax.max).toBe(10);
    });

    it('calculates max HP for squads correctly', () => {
      charData.settings.isNPC = true;
      charData.settings.npcType = 'squad';
      charData.settings.squadSize = 5;
      charData._prepareLimbMaxHP();
      expect(charData.limbs.head.max).toBe(25);
      expect(charData.limbs.thorax.max).toBe(50);
    });
  });

  describe('_prepareTotalHP', () => {
    it('aggregates limb HP correctly', () => {
      charData.limbs.head.value = 3;
      charData.limbs.head.max = 5;
      charData.limbs.thorax.value = 8;
      charData.limbs.thorax.max = 10;
      charData._prepareTotalHP();
      expect(charData.hp.value).toBe(11);
      expect(charData.hp.max).toBe(15);
    });
  });

  describe('_prepareStamina', () => {
    it('calculates max stamina based on endurance', () => {
      charData.stats.endurance.total = 12;
      charData.stamina.mult = 1.5;
      charData._prepareStamina();
      expect(charData.stamina.max).toBe(18);
    });
  });

  describe('_prepareTraitModifiers', () => {
    it('applies stat bonuses from traits', () => {
      const trait1 = {
        type: "trait",
        system: {
          modifiers: [{ target: "stats.strength.value", value: 5 }]
        }
      };
      charData.parent = { items: [trait1] };
      charData.stats.strength = new StatModifier({ value: 10 });
      charData._prepareTraitModifiers();
      expect(charData.stats.strength.traitBonus).toBe(5);
      expect(charData.stats.strength.total).toBe(15);
    });

    it('applies HP and Stamina bonuses from traits', () => {
      const trait1 = {
        type: "trait",
        system: {
          modifiers: [
            { target: "hp.max", value: 10 },
            { target: "stamina.max", value: 5 }
          ]
        }
      };
      charData.parent = { items: [trait1] };
      charData._prepareTraitModifiers();
      expect(charData.traitHPExtra).toBe(10);
      expect(charData.traitStaminaExtra).toBe(5);

      charData.hp = { value: 20, max: 50 };
      charData.limbs = { thorax: { value: 20, max: 50 } };
      charData._prepareTotalHP();
      expect(charData.hp.max).toBe(60);

      charData.stats.endurance = { total: 10 };
      charData.stamina = { mult: 1.0, max: 0 };
      charData._prepareStamina();
      expect(charData.stamina.max).toBe(15);
    });

    it('calculates global and profession roll bonuses', () => {
      const trait1 = {
        type: "trait",
        system: {
          modifiers: [{ target: "allRolls", value: 15 }]
        }
      };
      const trait2 = {
        type: "trait",
        system: {
          isProfession: true,
          profession: "Blacksmith",
          modifiers: [{ target: "allProfessionRolls", value: 10 }]
        }
      };
      charData.parent = { items: [trait1, trait2] };
      charData._prepareTraitModifiers();
      expect(charData.traitRollBonus).toBe(15);
      expect(charData.traitProfessionBonuses["blacksmith"]).toBe(10);
    });

    it('handles multiple traits modifying the same stat', () => {
      const trait1 = { type: "trait", system: { modifiers: [{ target: "stats.strength.value", value: 5 }] } };
      const trait2 = { type: "trait", system: { modifiers: [{ target: "stats.strength.value", value: 3 }] } };
      charData.parent = { items: [trait1, trait2] };
      charData.stats.strength = new StatModifier({ value: 10 });
      charData._prepareTraitModifiers();
      expect(charData.stats.strength.traitBonus).toBe(8);
      expect(charData.stats.strength.total).toBe(18);
    });

    it('handles negative modifiers correctly', () => {
      const trait1 = { type: "trait", system: { modifiers: [{ target: "stats.strength.value", value: -5 }] } };
      charData.parent = { items: [trait1] };
      charData.stats.strength = new StatModifier({ value: 10 });
      charData._prepareTraitModifiers();
      expect(charData.stats.strength.traitBonus).toBe(-5);
      expect(charData.stats.strength.total).toBe(5);
    });

    it('handles multiple targets in a single trait', () => {
      const trait1 = {
        type: "trait",
        system: {
          modifiers: [
            { target: "stats.strength.value", value: 2 },
            { target: "stats.dexterity.value", value: 3 },
            { target: "allRolls", value: 5 }
          ]
        }
      };
      charData.parent = { items: [trait1] };
      charData.stats.strength = new StatModifier({ value: 10 });
      charData.stats.dexterity = new StatModifier({ value: 10 });
      charData._prepareTraitModifiers();
      expect(charData.stats.strength.traitBonus).toBe(2);
      expect(charData.stats.dexterity.traitBonus).toBe(3);
      expect(charData.traitRollBonus).toBe(5);
    });

    it('handles multiple professions and overlapping bonuses', () => {
      const trait1 = {
        type: "trait",
        system: {
          isProfession: true,
          profession: "Blacksmith",
          modifiers: [{ target: "allProfessionRolls", value: 10 }]
        }
      };
      const trait2 = {
        type: "trait",
        system: {
          isProfession: true,
          profession: "Miner",
          modifiers: [{ target: "allProfessionRolls", value: 5 }]
        }
      };
      const trait3 = {
        type: "trait",
        system: {
          isProfession: true,
          profession: "Blacksmith",
          modifiers: [{ target: "allProfessionRolls", value: 2 }]
        }
      };
      charData.parent = { items: [trait1, trait2, trait3] };
      charData._prepareTraitModifiers();
      expect(charData.traitProfessionBonuses["blacksmith"]).toBe(12);
      expect(charData.traitProfessionBonuses["miner"]).toBe(5);
    });
  });

  describe('_prepareInventoryCapacity and backpackPenalties', () => {
    it('calculates backpack penalties correctly', () => {
      const backpack1 = {
        id: "bp1",
        type: "backpack",
        system: {
          equipped: true,
          penalties: {
            active: true,
            strength: -5,
            dexterity: -10,
            dodge: -15,
            attack: -2,
            movement: -1
          }
        }
      };
      const backpack2 = {
        id: "bp2",
        type: "backpack",
        system: {
          equipped: false,
          penalties: { active: true, strength: -100 }
        }
      };
      const items = [backpack1, backpack2];
      items.get = (id) => items.find(i => i.id === id);
      charData.parent = { items };
      charData.inventory = { equippedBackpackId: "bp1", hasBackpack: true };
      charData.stats.endurance.total = 10;
      charData._prepareInventoryCapacity();
      expect(charData.backpackPenalties.strength).toBe(-5);
      expect(charData.backpackPenalties.dexterity).toBe(-10);
      expect(charData.backpackPenalties.dodge).toBe(-15);
      expect(charData.backpackPenalties.attack).toBe(-2);
      expect(charData.backpackPenalties.movement).toBe(-1);
    });

    it('sums penalties from multiple equipped backpacks', () => {
      const backpack1 = {
        id: "bp1",
        type: "backpack",
        system: {
          equipped: true,
          penalties: { active: true, attack: -5 }
        }
      };
      const backpack2 = {
        id: "bp2",
        type: "backpack",
        system: {
          equipped: true,
          penalties: { active: true, attack: -3 }
        }
      };
      const items = [backpack1, backpack2];
      items.get = (id) => items.find(i => i.id === id);
      charData.parent = { items };
      charData.inventory = { equippedBackpackId: "bp1", hasBackpack: true };
      charData.stats.endurance.total = 10;
      charData._prepareInventoryCapacity();
      expect(charData.backpackPenalties.attack).toBe(-8);
    });

    it('ignores penalties from inactive or unequipped backpacks', () => {
      const backpack1 = {
        id: "bp1",
        type: "backpack",
        system: {
          equipped: true,
          penalties: { active: false, attack: -5 }
        }
      };
      const backpack2 = {
        id: "bp2",
        type: "backpack",
        system: {
          equipped: false,
          penalties: { active: true, attack: -3 }
        }
      };
      const items = [backpack1, backpack2];
      items.get = (id) => items.find(i => i.id === id);
      charData.parent = { items };
      charData.inventory = { equippedBackpackId: "bp1", hasBackpack: true };
      charData.stats.endurance.total = 10;
      charData._prepareInventoryCapacity();
      expect(charData.backpackPenalties.attack).toBe(0);
    });

    it('calculates used capacity correctly for different item sizes', () => {
      const item1 = { id: "i1", system: { location: "stowed", size: "small", quantity: 5 } };
      const item2 = { id: "i2", system: { location: "stowed", size: "medium", quantity: 2 } };
      const item3 = { id: "i3", system: { location: "stowed", size: "large", quantity: 1 } };
      const items = [item1, item2, item3];
      items.get = (id) => items.find(i => i.id === id);
      charData.parent = { items };
      charData.inventory = { equippedBackpackId: "", hasBackpack: false };
      charData.stats.endurance.total = 10;
      charData._prepareInventoryCapacity();
      // small: 1 * 5 = 5
      // medium: 10 * 2 = 20
      // large: 50 * 1 = 50
      // total = 75
      expect(charData.inventory.usedCapacity).toBe(75);
    });

    it('applies backpack weight reduction to stowed items', () => {
      const backpack = {
        id: "bp1",
        type: "backpack",
        system: { equipped: true, modifier: 0.5, capacity: 10, location: "stowed", size: "medium", quantity: 1 }
      };
      const item1 = { id: "i1", system: { location: "bp1", size: "large", quantity: 1 } };
      const items = [backpack, item1];
      items.get = (id) => items.find(i => i.id === id);
      charData.parent = { items };
      charData.inventory = { equippedBackpackId: "bp1", hasBackpack: true };
      charData.stats.endurance.total = 10;
      charData._prepareInventoryCapacity();
      // backpack itself (if stowed/hand): medium = 10
      // item1 in backpack: large = 50. reduction 0.5 -> 25.
      // total = 35
      expect(charData.inventory.usedCapacity).toBe(35);
    });
  });

  describe('_prepareArmorSync', () => {
    it('does NOT reset armor when no armor is equipped', () => {
      charData.limbs.head = { armor: 10, armorMax: 10, equippedArmorId: "" };
      charData.parent = { items: { get: () => null } };
      charData._prepareArmorSync();
      expect(charData.limbs.head.armor).toBe(10);
      expect(charData.limbs.head.armorMax).toBe(10);
      expect(charData.limbs.head.hasEquippedArmor).toBe(false);
    });

    it('syncs armor only from specifically assigned and equipped items', () => {
      const armorItem = {
        id: "armor1",
        type: "armor",
        system: {
          equipped: true,
          limbs: {
            head: { value: 5, max: 5 },
            thorax: { value: 3, max: 3 }
          }
        }
      };
      charData.parent = { items: { get: (id) => id === "armor1" ? armorItem : null } };
      charData.limbs.head = { equippedArmorId: "armor1", armor: 0, armorMax: 0 };
      charData.limbs.thorax = { equippedArmorId: "", armor: 2, armorMax: 2 };

      charData._prepareArmorSync();

      expect(charData.limbs.head.armor).toBe(5);
      expect(charData.limbs.head.armorMax).toBe(5);
      expect(charData.limbs.head.hasEquippedArmor).toBe(true);

      expect(charData.limbs.thorax.armor).toBe(2);
      expect(charData.limbs.thorax.armorMax).toBe(2);
      expect(charData.limbs.thorax.hasEquippedArmor).toBe(false);
    });

    it('resets armor to 0 when assigned item is unequipped', () => {
      const armorItem = {
        id: "armor1",
        type: "armor",
        system: { equipped: false, limbs: { head: { value: 5, max: 5 } } }
      };
      charData.parent = { items: { get: (id) => id === "armor1" ? armorItem : null } };
      charData.limbs.head = { equippedArmorId: "armor1", armor: 10, armorMax: 10 };

      charData._prepareArmorSync();

      expect(charData.limbs.head.armor).toBe(0);
      expect(charData.limbs.head.armorMax).toBe(0);
      expect(charData.limbs.head.hasEquippedArmor).toBe(false);
    });
  });
});
