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
        enabledCurrencies: new fields.ObjectField({initial: {}})
      }),
      upgradePoints: new fields.SchemaField({
        stats: new fields.NumberField({initial: 0}),
        weapons: new fields.NumberField({initial: 0}),
        skills: new fields.NumberField({initial: 0}),
        abilities: new fields.NumberField({initial: 0}),
        traits: new fields.NumberField({initial: 0})
      }),
      specialSkills: new fields.SchemaField({
        dodge: new fields.SchemaField({ value: new fields.NumberField({initial: 0}) }),
        retaliation: new fields.SchemaField({ value: new fields.NumberField({initial: 0}) }),
        perception: new fields.SchemaField({ value: new fields.NumberField({initial: 0}) })
      }),
      currencies: new fields.ObjectField({initial: {}}),
      downtime: new fields.SchemaField({
        days: new fields.NumberField({initial: 0, min: 0}),
        daysRemaining: new fields.NumberField({initial: 0, min: 0}),
        isSafe: new fields.BooleanField({initial: true}),
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

    const limbKeys = ['head', 'thorax', 'stomach', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      const individualMax = Math.floor(end * limb.mult);
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
    let usedUnits = 0;
    const end = this.stats.endurance.total;
    const hasBackpack = this.inventory.hasBackpack;
    const backpackId = this.inventory.equippedBackpackId;
    const backpackItem = backpackId ? this.parent.items.get(backpackId) : null;
    const allBackpackIds = new Set(this.parent.items.filter(i => i.type === "backpack").map(i => i.id));

    for (const item of this.parent.items) {
      const system = item.system;
      const location = system.location;
      if (location === "stowed" || location === "hand" || allBackpackIds.has(location)) {
        let itemSize = 0;
        switch(system.size) {
          case "small": itemSize = 1; break;
          case "medium": itemSize = 10; break;
          case "large": itemSize = 50; break;
        }

        if (item.id !== backpackId) {
          const container = this.parent.items.find(i => i.type === "backpack" && i.id === location);
          if (container && container.system.equipped) {
            itemSize *= (container.system.modifier ?? 0.5);
          } else if (container && !container.system.equipped) {
            itemSize = 0; // Not carried if backpack is not equipped
          }
        }

        usedUnits += (itemSize * (system.quantity || 1));
      }
    }

    this.inventory.usedCapacity = usedUnits;
    const baseCapacity = Math.max(0, Math.floor(end / 10)) * 100;
    const backpackExtra = (hasBackpack && backpackItem) ? ((backpackItem.system.capacity || 0) * 10) : 0;
    this.inventory.maxCapacity = baseCapacity + backpackExtra;
    this.inventory.isEncumbered = this.inventory.usedCapacity > this.inventory.maxCapacity;

    // Calculate backpack penalties
    this.backpackPenalties = { strength: 0, dexterity: 0, dodge: 0, attack: 0, movement: 0 };
    const equippedBackpacks = this.parent.items.filter(i => i.type === "backpack" && i.system.equipped);
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
