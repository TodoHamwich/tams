import { computeEncumbrance } from '../utils/inventory.js';

const SIZE_HP_MULT = { tiny: 0.5, small: 0.75, normal: 1.0, large: 1.5, huge: 2.0, giant: 2.5 };
const SIZE_ORDER = ['tiny', 'small', 'normal', 'large', 'huge', 'giant'];

/**
 * Read the configured capacity mode safely, defaulting to "weight" when the
 * setting (or Foundry's settings API) is unavailable, e.g. during tests.
 * @returns {"weight"|"slots"} The active capacity mode.
 */
function getCapacityMode() {
  try {
    return game.settings.get("tams", "capacityMode") || "weight";
  } catch (e) {
    return "weight";
  }
}

/**
 * Read the configured default slot cost for large items, with a safe fallback.
 * @returns {number} The configured large-item slot cost.
 */
function getLargeSlots() {
  try {
    return game.settings.get("tams", "largeItemSlots") || 2;
  } catch (e) {
    return 2;
  }
}

/**
 * A sub-model for handling stat values and their modifiers.
 * @property {number} value The base value of the stat.
 * @property {number} mod   An optional modifier to the stat.
 * @property {string} label The localization key or display name of the stat.
 */
export class StatModifier extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      value: new fields.NumberField({initial: 10, integer: true}),
      mod: new fields.NumberField({initial: 0, integer: true}),
      traitBonus: new fields.NumberField({initial: 0, integer: true}),
      label: new fields.StringField()
    };
  }

  /**
   * The total value of the stat (base + mod + traitBonus).
   * @type {number}
   */
  get total() {
    return this.value + (this.mod || 0) + (this.traitBonus || 0);
  }
}

/**
 * The DataModel for Character actors.
 */
export class TAMSCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      stats: new fields.SchemaField({
        strength: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatStrength"}}),
        dexterity: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatDexterity"}}),
        endurance: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatEndurance"}}),
        wisdom: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatWisdom"}}),
        intelligence: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatIntelligence"}}),
        bravery: new fields.EmbeddedDataField(StatModifier, {initial: {label: "TAMS.StatBravery"}})
      }),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({initial: 5}), max: new fields.NumberField({initial: 5}), mult: new fields.NumberField({initial: 0.5}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), otherArmor: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Head"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}), equippedArmorId: new fields.StringField({initial: ""}) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({initial: 10}), max: new fields.NumberField({initial: 10}), mult: new fields.NumberField({initial: 1.0}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), otherArmor: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Thorax"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}), equippedArmorId: new fields.StringField({initial: ""}) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), otherArmor: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Stomach"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}), equippedArmorId: new fields.StringField({initial: ""}) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), otherArmor: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Left Arm"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}), equippedArmorId: new fields.StringField({initial: ""}) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), otherArmor: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Right Arm"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}), equippedArmorId: new fields.StringField({initial: ""}) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), otherArmor: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Left Leg"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}), equippedArmorId: new fields.StringField({initial: ""}) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 7}), max: new fields.NumberField({initial: 7}), mult: new fields.NumberField({initial: 0.75}), armor: new fields.NumberField({initial: 0, min: 0, max: 40}), armorMax: new fields.NumberField({initial: 0, min: 0, max: 40}), otherArmor: new fields.NumberField({initial: 0, min: 0, max: 40}), label: new fields.StringField({initial: "Right Leg"}), injured: new fields.BooleanField({initial: false}), criticallyInjured: new fields.BooleanField({initial: false}), equippedArmorId: new fields.StringField({initial: ""}) })
      }),
      inventory: new fields.SchemaField({
        usedCapacity: new fields.NumberField({initial: 0}),
        maxCapacity: new fields.NumberField({initial: 0}),
        usedSlots: new fields.NumberField({initial: 0}),
        maxSlots: new fields.NumberField({initial: 0}),
        hasBackpack: new fields.BooleanField({initial: false}),
        isEncumbered: new fields.BooleanField({initial: false}),
        equippedBackpackId: new fields.StringField({initial: ""}),
        color: new fields.StringField({initial: "#f1c40f"})
      }),
      hp: new fields.SchemaField({
        value: new fields.NumberField({initial: 0}),
        max: new fields.NumberField({initial: 0}),
        color: new fields.StringField({initial: "#e74c3c"})
      }),
      tempDR: new fields.NumberField({initial: 0, integer: true, min: 0}),
      stamina: new fields.SchemaField({
        value: new fields.NumberField({initial: 10, min: 0}),
        max: new fields.NumberField({initial: 10, min: 0}),
        mult: new fields.NumberField({initial: 1.0}),
        color: new fields.StringField({initial: "#66bb6a"})
      }),
      customResources: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({initial: "New Resource"}),
        nameSecondary: new fields.StringField({initial: "Secondary"}),
        value: new fields.NumberField({initial: 0, min: 0}),
        max: new fields.NumberField({initial: 0, min: 0}),
        stat: new fields.StringField({initial: "endurance"}),
        mult: new fields.NumberField({initial: 1.0}),
        bonus: new fields.NumberField({initial: 0}),
        customValue: new fields.NumberField({initial: 10, min: 0}),
        color: new fields.StringField({initial: "#3498db"}),
        isOpposed: new fields.BooleanField({initial: false}),
        colorSecondary: new fields.StringField({initial: "#e74c3c"})
      })),
      theme: new fields.StringField({initial: "default"}),
      physicalNotes: new fields.StringField({initial: ""}),
      traits: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""}),
      behindMult: new fields.NumberField({initial: 0.5, min: 0, step: 0.05}),
      settings: new fields.SchemaField({
        alternateArmour: new fields.BooleanField({initial: false}),
        isNPC: new fields.BooleanField({initial: false}),
        npcType: new fields.StringField({initial: "individual"}),
        npcRank: new fields.StringField({initial: "mook"}),
        squadSize: new fields.NumberField({initial: 1, integer: true, min: 0}),
        creatureSize: new fields.StringField({initial: "normal"}),
        effectiveHPSize: new fields.StringField({initial: ""}),
        effectiveStealthSize: new fields.StringField({initial: ""}),
        effectiveCombatSize: new fields.StringField({initial: ""}),
        enabledCurrencies: new fields.ObjectField({initial: {}})
      }),
      upgradePoints: new fields.SchemaField({
        stats: new fields.NumberField({initial: 0}),
        weapons: new fields.NumberField({initial: 0}),
        skills: new fields.NumberField({initial: 0}),
        abilities: new fields.NumberField({initial: 0}),
        traits: new fields.NumberField({initial: 0})
      }),
      currencies: new fields.ObjectField({initial: {}}),
      downtime: new fields.SchemaField({
        days: new fields.NumberField({initial: 0, min: 0}),
        daysRemaining: new fields.NumberField({initial: 0, min: 0}),
        isSafe: new fields.BooleanField({initial: true}),
        isTended: new fields.BooleanField({initial: false}),
        isBedRest: new fields.BooleanField({initial: false}),
        notes: new fields.HTMLField({initial: ""}),
        trackers: new fields.SchemaField({
          ability: new fields.NumberField({initial: 0, integer: true, min: 0}),
          skill: new fields.NumberField({initial: 0, integer: true, min: 0}),
          weapon: new fields.NumberField({initial: 0, integer: true, min: 0}),
          statistic: new fields.NumberField({initial: 0, integer: true, min: 0}),
          crafting: new fields.NumberField({initial: 0, integer: true, min: 0}),
          resting: new fields.NumberField({initial: 0, integer: true, min: 0}),
          healing: new fields.NumberField({initial: 0, integer: true, min: 0}),
          working: new fields.NumberField({initial: 0, integer: true, min: 0})
        })
      }),
      resistances: new fields.ArrayField(new fields.SchemaField({
        damageType: new fields.StringField({initial: ""}),
        category: new fields.StringField({initial: "resistance"}),
        value: new fields.NumberField({initial: 0, integer: true, min: 0})
      })),
      honor: new fields.SchemaField({
        valor:    new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 }),
        justice:  new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 }),
        devotion: new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 }),
        renown:   new fields.NumberField({ initial: 0, integer: true, min: -100, max: 100 })
      })
    };
  }

  /** @override */
  prepareDerivedData() {
    this._prepareTraitModifiers();
    this._prepareLimbMaxHP();
    this._prepareArmorSync();
    this._prepareTotalHP();
    this._prepareStamina();
    this._prepareCustomResources();
    this._prepareInventoryCapacity();
    this._prepareDowntime();
  }

  /**
   * Iterate over traits and calculate bonuses for stats and rolls.
   * @protected
   */
  _prepareTraitModifiers() {
    // Reset trait bonuses
    const statKeys = ['strength', 'dexterity', 'endurance', 'wisdom', 'intelligence', 'bravery'];
    for (const key of statKeys) {
      if (this.stats[key]) this.stats[key].traitBonus = 0;
    }
    this.traitRollBonus = 0;
    this.traitHPExtra = 0;
    this.traitStaminaExtra = 0;
    this.traitProfessionBonuses = {};
    this.abilityPassiveBonuses = {};
    this.abilityTypeBonus = { all: 0, weapon: 0, skill: 0, ability: 0 };

    const traits = this.parent.items.filter(i => i.type === "trait");
    for (const trait of traits) {
      const system = trait.system;
      for (const mod of system.modifiers) {
        if (mod.target.startsWith("stats.")) {
          const statKey = mod.target.split(".")[1];
          if (this.stats[statKey]) {
            this.stats[statKey].traitBonus += mod.value;
          }
        } else if (mod.target === "hp.max") {
          this.traitHPExtra += mod.value;
        } else if (mod.target === "stamina.max") {
          this.traitStaminaExtra += mod.value;
        } else if (mod.target === "allRolls") {
          this.traitRollBonus += mod.value;
        } else if (mod.target === "allProfessionRolls") {
          if (system.isProfession && system.profession) {
            const p = system.profession.trim().toLowerCase();
            this.traitProfessionBonuses[p] = (this.traitProfessionBonuses[p] || 0) + mod.value;
          }
        }
      }
    }

    // Compute effective sizes from character settings and size grants on traits/abilities.
    // Takes the highest size category found across all sources.
    const baseSize = this.settings.creatureSize || 'normal';
    const bestSize = (a, b) => SIZE_ORDER.indexOf(a) >= SIZE_ORDER.indexOf(b) ? a : b;

    let hpSize      = this.settings.effectiveHPSize      || baseSize;
    let stealthSize = this.settings.effectiveStealthSize || baseSize;
    let combatSize  = this.settings.effectiveCombatSize  || baseSize;

    for (const item of this.parent.items) {
      if (item.type !== "trait" && item.type !== "ability") continue;
      const s = item.system;
      if (s.sizeGrantHP)      hpSize      = bestSize(hpSize,      s.sizeGrantHP);
      if (s.sizeGrantStealth) stealthSize = bestSize(stealthSize, s.sizeGrantStealth);
      if (s.sizeGrantCombat)  combatSize  = bestSize(combatSize,  s.sizeGrantCombat);
    }

    this.effectiveHPSize      = hpSize;
    this.effectiveStealthSize = stealthSize;
    this.effectiveCombatSize  = combatSize;

    // Accumulate passive roll bonuses from abilities.
    for (const item of this.parent.items) {
      if (item.type !== "ability") continue;
      if (!item.system.isPassive || !item.system.passiveEnabled) continue;
      const val = item.system.passiveBonus || 0;
      if (!val) continue;
      const tag = item.system.passiveTag?.trim().toLowerCase();
      if (tag) {
        this.abilityPassiveBonuses[tag] = (this.abilityPassiveBonuses[tag] || 0) + val;
      } else {
        const rollType = item.system.passiveRollType || 'all';
        if (rollType in this.abilityTypeBonus) this.abilityTypeBonus[rollType] += val;
      }
    }
  }

  /**
   * Recompute max HP for each limb based on Endurance and NPC settings.
   * @protected
   */
  _prepareLimbMaxHP() {
    const end = this.stats.endurance.total;
    const settings = this.settings;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");
    const squadSize = settings.squadSize || 1;
    const sizeMult = SIZE_HP_MULT[this.effectiveHPSize || settings.creatureSize] ?? 1.0;

    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      const individualMax = Math.floor(end * limb.mult * sizeMult);
      limb.max = isSquadOrHorde ? (individualMax * squadSize) : individualMax;
      limb.individualMax = individualMax;
    }
  }

  /**
   * Sync equipped armor values to limb armor properties.
   * @protected
   */
  _prepareArmorSync() {
    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      limb.hasEquippedArmor = false;
      if (limb.equippedArmorId) {
        const armor = this.parent.items.get(limb.equippedArmorId);
        if (armor && armor.type === "armor" && armor.system.equipped) {
          limb.hasEquippedArmor = true;
        }
      }
    }
  }

  /**
   * Aggregate total HP from individual limb values.
   * @protected
   */
  _prepareTotalHP() {
    let totalHp = 0;
    let totalMaxHp = 0;
    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      totalHp += (Number(limb.value) || 0);
      totalMaxHp += (Number(limb.max) || 0);
    }
    this.hp.value = totalHp;
    this.hp.max = totalMaxHp + (this.traitHPExtra || 0);
  }

  /**
   * Calculate stamina maximum based on Endurance.
   * @protected
   */
  _prepareStamina() {
    const end = this.stats.endurance.total;
    const baseStamina = Math.max(1, end);
    this.stamina.max = Math.floor(baseStamina * (this.stamina.mult || 1.0)) + (this.traitStaminaExtra || 0);
  }

  /**
   * Update maximum values for custom resources.
   * @protected
   */
  _prepareCustomResources() {
    for (const res of this.customResources) {
      const statVal = res.stat === "custom" ? (res.customValue ?? 10) : (this.stats[res.stat]?.total || 0);
      res.max = Math.floor(statVal * (res.mult || 1.0)) + (res.bonus || 0);
    }
  }

  /**
   * Calculate used and maximum inventory capacity.
   * @protected
   */
  _prepareInventoryCapacity() {
    const end = this.stats.endurance.total;

    // Automatically find equipped backpack
    const equippedBackpacks = this.parent.items.filter(i => i.type === "backpack" && i.system.equipped);
    this.inventory.hasBackpack = equippedBackpacks.length > 0;
    this.inventory.equippedBackpackId = equippedBackpacks[0]?.id || "";

    const mode = getCapacityMode();
    const largeSlots = getLargeSlots();
    const options = {
      itemsById: this.parent.items,
      endurance: end,
      equippedBackpackId: this.inventory.equippedBackpackId,
      largeSlots
    };

    // Always compute weight figures (used for the weight-mode display) and, when
    // in slot mode, compute the slot figures too. Encumbrance follows the active mode.
    const weight = computeEncumbrance(this.parent.items, { ...options, mode: "weight" });
    this.inventory.usedCapacity = weight.used;
    this.inventory.maxCapacity = weight.max;

    if (mode === "slots") {
      const slots = computeEncumbrance(this.parent.items, { ...options, mode: "slots" });
      this.inventory.usedSlots = slots.used;
      this.inventory.maxSlots = slots.max;
      this.inventory.isEncumbered = slots.isEncumbered;
    } else {
      this.inventory.usedSlots = 0;
      this.inventory.maxSlots = 0;
      this.inventory.isEncumbered = weight.isEncumbered;
    }

    // Calculate backpack penalties
    this.backpackPenalties = { strength: 0, dexterity: 0, dodge: 0, attack: 0, movement: 0 };
    for (const backpack of equippedBackpacks) {
      const pen = backpack.system.penalties;
      if (pen && pen.active) {
        this.backpackPenalties.strength += (pen.strength || 0);
        this.backpackPenalties.dexterity += (pen.dexterity || 0);
        this.backpackPenalties.dodge += (pen.dodge || 0);
        this.backpackPenalties.attack += (pen.attack || 0);
        this.backpackPenalties.movement += (pen.movement || 0);
      }
    }
  }

  /**
   * Calculate downtime days remaining.
   * @protected
   */
  _prepareDowntime() {
    const downtime = this.downtime;
    if (!downtime) return;

    const trackers = downtime.trackers || {};
    const usedDays = Object.values(trackers).reduce((sum, val) => sum + (Number(val) || 0), 0);
    downtime.daysRemaining = Math.max(0, downtime.days - usedDays);
  }
}
