var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class StatModifier extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      value: new fields.NumberField({ initial: 10, integer: true }),
      mod: new fields.NumberField({ initial: 0, integer: true }),
      traitBonus: new fields.NumberField({ initial: 0, integer: true }),
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
class TAMSCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      stats: new fields.SchemaField({
        strength: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatStrength" } }),
        dexterity: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatDexterity" } }),
        endurance: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatEndurance" } }),
        wisdom: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatWisdom" } }),
        intelligence: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatIntelligence" } }),
        bravery: new fields.EmbeddedDataField(StatModifier, { initial: { label: "TAMS.StatBravery" } })
      }),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({ initial: 5 }), max: new fields.NumberField({ initial: 5 }), mult: new fields.NumberField({ initial: 0.5 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Head" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({ initial: 10 }), max: new fields.NumberField({ initial: 10 }), mult: new fields.NumberField({ initial: 1 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Thorax" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Stomach" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Left Arm" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Right Arm" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Left Leg" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 7 }), max: new fields.NumberField({ initial: 7 }), mult: new fields.NumberField({ initial: 0.75 }), armor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), armorMax: new fields.NumberField({ initial: 0, min: 0, max: 40 }), otherArmor: new fields.NumberField({ initial: 0, min: 0, max: 40 }), label: new fields.StringField({ initial: "Right Leg" }), injured: new fields.BooleanField({ initial: false }), criticallyInjured: new fields.BooleanField({ initial: false }), equippedArmorId: new fields.StringField({ initial: "" }) })
      }),
      inventory: new fields.SchemaField({
        usedCapacity: new fields.NumberField({ initial: 0 }),
        maxCapacity: new fields.NumberField({ initial: 0 }),
        hasBackpack: new fields.BooleanField({ initial: false }),
        isEncumbered: new fields.BooleanField({ initial: false }),
        equippedBackpackId: new fields.StringField({ initial: "" }),
        color: new fields.StringField({ initial: "#f1c40f" })
      }),
      hp: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 }),
        max: new fields.NumberField({ initial: 0 }),
        color: new fields.StringField({ initial: "#e74c3c" })
      }),
      stamina: new fields.SchemaField({
        value: new fields.NumberField({ initial: 10, min: 0 }),
        max: new fields.NumberField({ initial: 10, min: 0 }),
        mult: new fields.NumberField({ initial: 1 }),
        color: new fields.StringField({ initial: "#66bb6a" })
      }),
      customResources: new fields.ArrayField(new fields.SchemaField({
        name: new fields.StringField({ initial: "New Resource" }),
        nameSecondary: new fields.StringField({ initial: "Secondary" }),
        value: new fields.NumberField({ initial: 0, min: 0 }),
        max: new fields.NumberField({ initial: 0, min: 0 }),
        stat: new fields.StringField({ initial: "endurance" }),
        mult: new fields.NumberField({ initial: 1 }),
        bonus: new fields.NumberField({ initial: 0 }),
        customValue: new fields.NumberField({ initial: 10, min: 0 }),
        color: new fields.StringField({ initial: "#3498db" }),
        isOpposed: new fields.BooleanField({ initial: false }),
        colorSecondary: new fields.StringField({ initial: "#e74c3c" })
      })),
      theme: new fields.StringField({ initial: "default" }),
      physicalNotes: new fields.StringField({ initial: "" }),
      traits: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
      behindMult: new fields.NumberField({ initial: 0.5, min: 0, step: 0.05 }),
      settings: new fields.SchemaField({
        alternateArmour: new fields.BooleanField({ initial: false }),
        isNPC: new fields.BooleanField({ initial: false }),
        npcType: new fields.StringField({ initial: "individual" }),
        npcRank: new fields.StringField({ initial: "mook" }),
        squadSize: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
        enabledCurrencies: new fields.ObjectField({ initial: {} })
      }),
      upgradePoints: new fields.SchemaField({
        stats: new fields.NumberField({ initial: 0 }),
        weapons: new fields.NumberField({ initial: 0 }),
        skills: new fields.NumberField({ initial: 0 }),
        abilities: new fields.NumberField({ initial: 0 }),
        traits: new fields.NumberField({ initial: 0 })
      }),
      specialSkills: new fields.SchemaField({
        dodge: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
        retaliation: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) }),
        perception: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }) })
      }),
      currencies: new fields.ObjectField({ initial: {} })
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
  }
  /**
   * Iterate over traits and calculate bonuses for stats and rolls.
   * @protected
   */
  _prepareTraitModifiers() {
    const statKeys = ["strength", "dexterity", "endurance", "wisdom", "intelligence", "bravery"];
    for (const key of statKeys) {
      if (this.stats[key]) this.stats[key].traitBonus = 0;
    }
    this.traitRollBonus = 0;
    this.traitHPExtra = 0;
    this.traitStaminaExtra = 0;
    this.traitProfessionBonuses = {};
    const traits = this.parent.items.filter((i) => i.type === "trait");
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
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      const individualMax = Math.floor(end * limb.mult);
      limb.max = isSquadOrHorde ? individualMax * squadSize : individualMax;
      limb.individualMax = individualMax;
    }
  }
  /**
   * Sync equipped armor values to limb armor properties.
   * @protected
   */
  _prepareArmorSync() {
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
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
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const limb = this.limbs[key];
      if (!limb) continue;
      totalHp += Number(limb.value) || 0;
      totalMaxHp += Number(limb.max) || 0;
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
    this.stamina.max = Math.floor(baseStamina * (this.stamina.mult || 1)) + (this.traitStaminaExtra || 0);
  }
  /**
   * Update maximum values for custom resources.
   * @protected
   */
  _prepareCustomResources() {
    var _a;
    for (const res of this.customResources) {
      const statVal = res.stat === "custom" ? res.customValue ?? 10 : ((_a = this.stats[res.stat]) == null ? void 0 : _a.total) || 0;
      res.max = Math.floor(statVal * (res.mult || 1)) + (res.bonus || 0);
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
    const allBackpackIds = new Set(this.parent.items.filter((i) => i.type === "backpack").map((i) => i.id));
    for (const item of this.parent.items) {
      const system = item.system;
      const location = system.location;
      if (location === "stowed" || location === "hand" || allBackpackIds.has(location)) {
        let itemSize = 0;
        switch (system.size) {
          case "small":
            itemSize = 1;
            break;
          case "medium":
            itemSize = 10;
            break;
          case "large":
            itemSize = 50;
            break;
        }
        if (item.id !== backpackId) {
          const container2 = this.parent.items.find((i) => i.type === "backpack" && i.id === location);
          if (container2 && container2.system.equipped) {
            itemSize *= container2.system.modifier ?? 0.5;
          } else if (container2 && !container2.system.equipped) {
            itemSize = 0;
          }
        }
        usedUnits += itemSize * (system.quantity || 1);
      }
    }
    this.inventory.usedCapacity = usedUnits;
    const baseCapacity = Math.max(0, Math.floor(end / 10)) * 100;
    const backpackExtra = hasBackpack && backpackItem ? (backpackItem.system.capacity || 0) * 10 : 0;
    this.inventory.maxCapacity = baseCapacity + backpackExtra;
    this.inventory.isEncumbered = this.inventory.usedCapacity > this.inventory.maxCapacity;
    this.backpackPenalties = { strength: 0, dexterity: 0, dodge: 0, attack: 0, movement: 0 };
    const equippedBackpacks = this.parent.items.filter((i) => i.type === "backpack" && i.system.equipped);
    for (const backpack of equippedBackpacks) {
      const pen = backpack.system.penalties;
      if (pen && pen.active) {
        this.backpackPenalties.strength += pen.strength || 0;
        this.backpackPenalties.dexterity += pen.dexterity || 0;
        this.backpackPenalties.dodge += pen.dodge || 0;
        this.backpackPenalties.attack += pen.attack || 0;
        this.backpackPenalties.movement += pen.movement || 0;
      }
    }
  }
}
class TAMSWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({ initial: 0, nullable: true }),
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "hand" }),
      equipped: new fields.BooleanField({ initial: false }),
      isHeavy: new fields.BooleanField({ initial: false }),
      isTwoHanded: new fields.BooleanField({ initial: false }),
      isLight: new fields.BooleanField({ initial: false }),
      isRanged: new fields.BooleanField({ initial: false }),
      isThrown: new fields.BooleanField({ initial: false }),
      hasArmourPen: new fields.BooleanField({ initial: false }),
      armourPenetration: new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: true }),
      rangedDamage: new fields.NumberField({ initial: 0, nullable: true }),
      ammo: new fields.SchemaField({
        current: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        total: new fields.NumberField({ initial: 0, integer: true, min: 0 })
      }),
      fireRate: new fields.StringField({ initial: "1" }),
      fireRateCustom: new fields.NumberField({ initial: 1, nullable: true }),
      attackStat: new fields.StringField({ initial: "default" }),
      consumeAmmo: new fields.BooleanField({ initial: false }),
      special: new fields.StringField({ initial: "" }),
      isAoE: new fields.BooleanField({ initial: false }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
  /**
   * The calculated damage of the weapon, derived from actor stats if melee.
   * @type {number}
   */
  get calculatedDamage() {
    var _a, _b;
    if (this.isRanged) return Math.floor(this.rangedDamage || 0);
    const actor = (_a = this.parent) == null ? void 0 : _a.actor;
    if (!actor) return 0;
    let statKey = "strength";
    if (this.attackStat && this.attackStat !== "default") {
      statKey = this.attackStat;
    } else {
      statKey = this.isLight ? "dexterity" : "strength";
    }
    const statValue = ((_b = actor.system.stats[statKey]) == null ? void 0 : _b.total) || 0;
    let mult = 0.5;
    if (this.isHeavy) mult += 0.25;
    if (this.isTwoHanded) mult += 0.25;
    return Math.floor(statValue * mult);
  }
}
class TAMSSkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({ initial: 0, nullable: true }),
      upgradePoints: new fields.NumberField({ initial: 0, nullable: true }),
      bonus: new fields.NumberField({ initial: 0, nullable: true }),
      stat: new fields.StringField({ initial: "strength" }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSEquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "small" }),
      location: new fields.StringField({ initial: "stowed" }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "large" }),
      location: new fields.StringField({ initial: "stowed" }),
      equipped: new fields.BooleanField({ initial: false }),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({ initial: 0 }), max: new fields.NumberField({ initial: 0 }) })
      }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSConsumableData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "small" }),
      location: new fields.StringField({ initial: "stowed" }),
      uses: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 }),
        max: new fields.NumberField({ initial: 0 })
      }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSToolData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "stowed" }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      armorValue: new fields.NumberField({ initial: 5, integer: true, min: 0 }),
      equipped: new fields.BooleanField({ initial: false }),
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "hand" }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSQuestItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "small" }),
      location: new fields.StringField({ initial: "stowed" }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSBackpackData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      size: new fields.StringField({ initial: "medium" }),
      location: new fields.StringField({ initial: "stowed" }),
      equipped: new fields.BooleanField({ initial: false }),
      capacity: new fields.NumberField({ initial: 10, integer: true, min: 0 }),
      modifier: new fields.NumberField({ initial: 0.5, step: 0.1, min: 0 }),
      penalties: new fields.SchemaField({
        active: new fields.BooleanField({ initial: false }),
        strength: new fields.NumberField({ initial: 0, integer: true }),
        dexterity: new fields.NumberField({ initial: 0, integer: true }),
        dodge: new fields.NumberField({ initial: 0, integer: true }),
        attack: new fields.NumberField({ initial: 0, integer: true }),
        movement: new fields.NumberField({ initial: 0, integer: true })
      }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
class TAMSAbilityData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({ initial: 0, nullable: true }),
      upgradePoints: new fields.NumberField({ initial: 0, nullable: true }),
      bonus: new fields.NumberField({ initial: 0, nullable: true }),
      cost: new fields.NumberField({ initial: 0, nullable: true }),
      resource: new fields.StringField({ initial: "stamina" }),
      isApex: new fields.BooleanField({ initial: false }),
      isReaction: new fields.BooleanField({ initial: false }),
      uses: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0 }),
        max: new fields.NumberField({ initial: 0 })
      }),
      isAttack: new fields.BooleanField({ initial: false }),
      damage: new fields.NumberField({ initial: 0, nullable: true }),
      armourPenetration: new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: true }),
      attackStat: new fields.StringField({ initial: "strength" }),
      capStat: new fields.StringField({ initial: "strength" }),
      damageStat: new fields.StringField({ initial: "strength" }),
      damageMult: new fields.NumberField({ initial: 0.5, step: 0.05, nullable: true }),
      damageBonus: new fields.NumberField({ initial: 0, nullable: true }),
      multiAttack: new fields.NumberField({ initial: 1, nullable: true }),
      isAoE: new fields.BooleanField({ initial: false }),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
      ifStatement: new fields.StringField({ initial: "" }),
      ifCost: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
      calculator: new fields.SchemaField({
        enabled: new fields.BooleanField({ initial: false }),
        isUtility: new fields.BooleanField({ initial: false }),
        effects: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        guaranteedMax: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        detriments: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        movementDoubleOwn: new fields.BooleanField({ initial: false }),
        movementHalveEnemy: new fields.BooleanField({ initial: false }),
        movementFlat: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        rollBonus: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        ignoreArmor: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        bodyPart: new fields.StringField({ initial: "none" }),
        targetLimb: new fields.StringField({ initial: "none" }),
        fireRate: new fields.StringField({ initial: "single" }),
        multiAttackHits: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        damageStatFraction: new fields.NumberField({ initial: 0, step: 0.25, nullable: true }),
        stun: new fields.StringField({ initial: "none" }),
        healing: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        drType: new fields.StringField({ initial: "none" }),
        drValue: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        bypassDodge: new fields.BooleanField({ initial: false }),
        bypassRetaliation: new fields.BooleanField({ initial: false }),
        targetType: new fields.StringField({ initial: "single" }),
        aoeRadius: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        range: new fields.NumberField({ initial: 0, integer: true, nullable: true }),
        duration: new fields.StringField({ initial: "instant" }),
        isStackable: new fields.BooleanField({ initial: false })
      })
    };
  }
  /**
   * The calculated damage of the ability, derived from actor stats if applicable.
   * @type {number}
   */
  get calculatedDamage() {
    var _a, _b;
    if (!this.isAttack) return 0;
    const actor = (_a = this.parent) == null ? void 0 : _a.actor;
    if (!actor) return 0;
    if (this.damageStat === "custom") {
      return (this.damage || 0) + (this.damageBonus || 0);
    }
    const damageStatValue = ((_b = actor.system.stats[this.damageStat]) == null ? void 0 : _b.total) || 0;
    return Math.floor(damageStatValue * this.damageMult) + this.damageBonus + (this.damage || 0);
  }
  /**
   * The calculated resource cost of the ability.
   * @type {number}
   */
  get calculatedCost() {
    const c = this.calculator;
    let cost = 0;
    cost += (c.effects || 0) * 1;
    cost += (c.guaranteedMax || 0) * 2;
    cost -= (c.detriments || 0) * 1;
    if (c.movementDoubleOwn) cost += 2;
    if (c.movementHalveEnemy) cost += 4;
    cost += (c.movementFlat || 0) * 2;
    cost += Math.floor((c.rollBonus || 0) / 5) * 1;
    if (c.ignoreArmor > 0) {
      cost += 1;
      if (c.ignoreArmor > 1) cost += (c.ignoreArmor - 1) * 2;
    }
    if (c.bodyPart !== "none") cost += 2;
    if (c.targetLimb !== "none") cost += 4;
    if (c.fireRate === "burst") cost += 2;
    else if (c.fireRate === "fullAuto") cost += 4;
    cost += (c.multiAttackHits || 0) * 2;
    if (c.damageStatFraction > 0) {
      cost += c.damageStatFraction / 0.25 * 1;
    }
    if (c.stun === "minor") cost += 1;
    else if (c.stun === "major") cost += 2;
    cost += (c.healing || 0) * 1;
    if (c.drType !== "none") {
      cost += (c.drValue || 0) * 1;
    }
    if (c.bypassDodge) cost *= 2;
    if (c.bypassRetaliation) cost *= 2;
    if (c.isUtility && c.targetType === "multiple") {
      cost *= 1.5;
    } else if (c.targetType === "multiple") {
      cost *= 2;
    }
    if (c.aoeRadius >= 1) {
      cost += 2;
      if (c.aoeRadius > 3) cost += c.aoeRadius - 3;
    }
    if (c.isUtility) {
      if (c.range >= 100 && c.range < 1e3) cost += 1;
      else if (c.range >= 1e3 && c.range < 1e4) cost += 2;
      else if (c.range >= 1e4) cost += 3;
    } else {
      if (c.range > 10 && c.range <= 25) cost += 1;
      else if (c.range > 25 && c.range <= 50) cost += 2;
      else if (c.range > 50 && c.range <= 75) cost += 3;
      else if (c.range > 75 && c.range <= 100) cost += 4;
      else if (c.range > 100) {
        cost += 4;
        cost += Math.floor((c.range - 100) / 50);
      }
    }
    if (c.isUtility) {
      if (c.duration === "utility1") cost += 1;
      else if (c.duration === "utility2") cost += 2;
      else if (c.duration === "utility3") cost += 3;
      else if (c.duration === "utility4") cost += 4;
    } else {
      if (c.duration === "1round") cost += 1;
      else if (c.duration === "2rounds") cost += 2;
      else if (c.duration === "3rounds") cost += 4;
    }
    if (c.isStackable) cost *= 2;
    return Math.max(1, Math.floor(cost));
  }
  prepareDerivedData() {
    var _a;
    if ((_a = this.calculator) == null ? void 0 : _a.enabled) {
      this.cost = this.calculatedCost;
    }
  }
}
class TAMSTraitData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      upgradePoints: new fields.NumberField({ initial: 0, integer: true, min: 0, nullable: true }),
      isProfession: new fields.BooleanField({ initial: false }),
      profession: new fields.StringField({ initial: "" }),
      modifiers: new fields.ArrayField(new fields.SchemaField({
        target: new fields.StringField({ initial: "stats.strength.value" }),
        value: new fields.NumberField({ initial: 0 }),
        type: new fields.StringField({ initial: "add" })
      })),
      tags: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
async function tamsUpdateMessage(message, updateData) {
  if (game.user.isGM || message.isAuthor) {
    try {
      return await message.update(updateData);
    } catch (err) {
      console.error("TAMS | Failed to update message", err);
    }
  }
  game.socket.emit("system.tams", {
    type: "updateMessage",
    messageId: message.id,
    updateData
  });
}
async function getHitLocation(rollValue = null) {
  const raw = rollValue ?? (await new Roll("1d100").evaluate()).total;
  if (raw >= 96) return "Head";
  if (raw >= 56) return "Thorax";
  if (raw >= 41) return "Stomach";
  if (raw >= 31) return "Left Arm";
  if (raw >= 21) return "Right Arm";
  if (raw >= 11) return "Left Leg";
  return "Right Leg";
}
async function showCombinedInjuryDialog(target, pendingChecks) {
  let content = `<div class="tams-injury-dialog">
        <p><b>${target.name}</b> ${game.i18n.localize("TAMS.Checks.MustMakeChecks")}:</p>`;
  pendingChecks.forEach((check, i) => {
    if (check.type === "injured") {
      content += `
                <div class="check-row" style="background: rgba(241, 196, 15, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #f39c12; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>${game.i18n.format("TAMS.Checks.InjuryCheck", { loc: check.loc })}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px; background: #f39c12; color: white;">${game.i18n.localize("TAMS.Checks.RollEndurance")}</button>
                </div>`;
    } else if (check.type === "crit") {
      content += `
                <div class="check-row" style="border-bottom: 1px solid #ccc; padding: 5px 0; display: flex; justify-content: space-between; align-items: center;">
                    <label><b>${game.i18n.format("TAMS.Checks.CritCheck", { loc: check.loc })}</b> (DC ${check.dc})</label>
                    <button class="roll-check" data-index="${i}" style="width: 120px; font-size: 11px;">${game.i18n.localize("TAMS.Checks.RollEndurance")}</button>
                </div>`;
    } else if (check.type === "unconscious") {
      content += `
                <div class="check-row" style="background: rgba(52, 152, 219, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #3498db; border-radius: 4px;">
                    <label><b>${game.i18n.localize("TAMS.Checks.UnconsciousCheck")}</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #2980b9; color: white; font-size: 12px;">${game.i18n.localize("TAMS.Checks.RollStayAwake")}</button>
                </div>`;
    } else if (check.type === "survival") {
      content += `
                <div class="check-row" style="background: rgba(231, 76, 60, 0.1); padding: 5px; margin-top: 5px; border: 1px solid #e74c3c; border-radius: 4px;">
                    <label><b>${game.i18n.localize("TAMS.Checks.SurvivalCheck")}</b> (DC ${check.dc})</label>
                    <p style="font-size: 0.8em; margin: 2px 0;">${check.reasons.join("<br>")}</p>
                    <button class="roll-check" data-index="${i}" style="width: 100%; margin-top: 5px; background: #4a0000; color: white; font-size: 12px;">${game.i18n.localize("TAMS.Checks.RollSurvival")}</button>
                </div>`;
    }
  });
  content += `</div>`;
  new Dialog({
    title: game.i18n.format("TAMS.Checks.InjuriesAndSurvival", { name: target.name }),
    content,
    buttons: { close: { label: game.i18n.localize("TAMS.Checks.Close") } },
    render: (html) => {
      html.find(".roll-check").click(async (ev) => {
        const btn = ev.currentTarget;
        const idx = parseInt(btn.dataset.index);
        const check = pendingChecks[idx];
        const end = target.system.stats.endurance.total;
        let bonus = 0;
        const roll = await new Roll("1d100").evaluate();
        const raw = roll.total;
        const capped = Math.min(raw, end);
        const total = capped + bonus;
        const success = total >= check.dc;
        let report = "";
        if (check.type === "injured") {
          report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #f39c12;">${game.i18n.format("TAMS.Checks.EnduranceCheckInjury", { loc: check.loc })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end })}</span><span>${capped}</span></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total: capped, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success">${game.i18n.localize("TAMS.Checks.SuccessNotInjured")}</div>` : `<div class="tams-crit failure" style="background:#fff4cc; color:#856404; border-color:#ffeeba;">${game.i18n.localize("TAMS.Checks.FailedInjured")}</div>`}
                        </div>
                    `;
          if (!success) {
            await target.update({ [`system.limbs.${check.limbKey}.injured`]: true });
          }
        } else if (check.type === "crit") {
          report = `
                        <div class="tams-roll">
                            <h3 class="roll-label">${game.i18n.format("TAMS.Checks.EnduranceCheck", { loc: check.loc })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end })}</span><span>${capped}</span></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total: capped, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success">${game.i18n.localize("TAMS.Checks.Success")}</div>` : `<div class="tams-crit failure">${game.i18n.localize("TAMS.Checks.FailedCrit")}</div>`}
                        </div>
                    `;
          if (!success) {
            await target.update({ [`system.limbs.${check.limbKey}.criticallyInjured`]: true });
          }
        } else if (check.type === "unconscious") {
          report = `
                        <div class="tams-roll" data-actor-uuid="${target.uuid}" data-actor-id="${target.id}" data-dc="${check.dc}" data-raw="${raw}" data-end="${end}" data-reasons='${JSON.stringify(check.reasons)}'>
                            <h3 class="roll-label" style="color: #2980b9;">${game.i18n.format("TAMS.Checks.UnconsciousCheckLabel", { name: target.name })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end })}</span><span>${capped}</span></div>
                            <div class="roll-boost-container"></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total: capped, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success" style="font-size:1.1em; font-weight:bold;">${game.i18n.localize("TAMS.Checks.RemainsConscious")}</div>` : `<div class="tams-crit failure" style="font-size:1.1em;">${game.i18n.localize("TAMS.Checks.FallsUnconscious")}</div>`}
                            <div class="roll-contest-hint"><small>${game.i18n.format("TAMS.Checks.Reasons", { reasons: check.reasons.join(", ") })}</small></div>
                            <div class="roll-row" style="margin-top: 5px;">
                                <button class="tams-boost-unconscious">${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}</button>
                            </div>
                        </div>
                    `;
        } else {
          report = `
                        <div class="tams-roll">
                            <h3 class="roll-label" style="color: #8b0000;">${game.i18n.format("TAMS.Checks.SurvivalCheckLabel", { name: target.name })}</h3>
                            <div class="roll-row"><span>${game.i18n.localize("TAMS.Checks.Dice")}</span><span>${raw}</span></div>
                            <div class="roll-row"><span>${game.i18n.format("TAMS.Checks.Capped", { end })}</span><span>${capped}</span></div>
                            <div class="roll-total">${game.i18n.format("TAMS.Checks.TotalVsDC", { total: capped, dc: check.dc })}</div>
                            ${success ? `<div class="tams-success" style="font-size:1.2em; font-weight:bold;">${game.i18n.localize("TAMS.Checks.Survived")}</div>` : `<div class="tams-crit failure" style="font-size:1.2em;">${game.i18n.localize("TAMS.Checks.FatalInjury")}</div>`}
                        </div>
                    `;
        }
        ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: target }), content: report });
        btn.disabled = true;
        btn.innerText = success ? game.i18n.localize("TAMS.Checks.Pass") : game.i18n.localize("TAMS.Checks.Fail");
        btn.style.background = success ? "#2e7d32" : "#c62828";
      });
    }
  }).render(true);
}
async function tamsRenderChatMessage(message, html, data) {
  const root = html instanceof jQuery ? html[0] : html;
  root.querySelectorAll(".tams-roll").forEach((container2) => {
    container2.querySelectorAll(".tams-behind-toggle").forEach((btn) => {
      btn.style.background = container2.classList.contains("behind-attack") ? "#2e7d32" : "#444";
    });
    container2.querySelectorAll(".tams-unaware-toggle").forEach((btn) => {
      btn.style.background = container2.classList.contains("unaware-defender") ? "#2e7d32" : "#444";
    });
  });
  root.querySelectorAll(".tams-take-damage").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a, _b, _c, _d;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const damageBase = parseInt(btn.dataset.damage);
    const armourPen = parseInt(btn.dataset.armourPen) || 0;
    const multiLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : null;
    const locations = multiLocations || (btn.dataset.location ? [btn.dataset.location] : []);
    let target = null;
    const targetTokenId = btn.dataset.targetTokenId;
    const targetActorId = btn.dataset.targetActorId;
    const targetActorUuid = btn.dataset.targetActorUuid;
    if (targetActorUuid) target = fromUuidSync(targetActorUuid);
    if (!target && targetTokenId) {
      const token = canvas.tokens.get(targetTokenId);
      if (token) target = token.actor;
    }
    if (!target && targetActorId) target = game.actors.get(targetActorId);
    if (!target) target = ((_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor) ?? null;
    if (!target) target = ((_c = [...((_b = game == null ? void 0 : game.user) == null ? void 0 : _b.targets) ?? []][0]) == null ? void 0 : _c.actor) ?? null;
    if (!target) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDamage"));
    const locationMap = {
      "Head": "head",
      "Thorax": "thorax",
      "Stomach": "stomach",
      "Left Arm": "leftArm",
      "Right Arm": "rightArm",
      "Left Leg": "leftLeg",
      "Right Leg": "rightLeg"
    };
    const isAoEHit = btn.dataset.isAoe === "1";
    const forceCrit = btn.dataset.forceCrit === "1";
    const isSquadOrHorde = ((_d = target.system.settings) == null ? void 0 : _d.isNPC) && (target.system.settings.npcType === "squad" || target.system.settings.npcType === "horde");
    let initialMultiplier = 1;
    let squadHtml = "";
    if (isAoEHit && isSquadOrHorde) {
      const typeLabel = target.system.settings.npcType.toUpperCase();
      const currentSize = target.system.settings.squadSize || 1;
      initialMultiplier = target.system.settings.npcType === "squad" ? Math.min(2, currentSize) : Math.min(4, currentSize);
      squadHtml = `
            <div class="form-group" style="margin-bottom: 10px;">
                <label>${game.i18n.format("TAMS.Combat.TargetsHitInSquad", { type: typeLabel, max: currentSize })}</label>
                <input type="number" id="aoe-targets-hit" value="${initialMultiplier}" min="1" max="${currentSize}"/>
                <p style="color: #d35400; font-size: 0.85em;"><i>${game.i18n.localize("TAMS.Combat.EachHitMultipliedHint")}</i></p>
            </div>
          `;
    }
    const defaultDmg = damageBase * initialMultiplier;
    const coverHtml = `
        <div class="form-group" style="margin-bottom: 10px; border-bottom: 1px solid #666; padding-bottom: 10px;">
            <label>${game.i18n.localize("TAMS.Combat.Cover")}</label>
            <div class="flexrow">
                <select id="cover-select">
                    <option value="0">${game.i18n.localize("TAMS.None")}</option>
                    <option value="10">${game.i18n.localize("TAMS.Combat.CoverLight")}</option>
                    <option value="20">${game.i18n.localize("TAMS.Combat.CoverMedium")}</option>
                    <option value="30">${game.i18n.localize("TAMS.Combat.CoverHeavy")}</option>
                    <option value="custom">${game.i18n.localize("TAMS.Combat.CoverCustom")}</option>
                </select>
                <input type="number" id="cover-custom" value="0" style="display:none; width: 60px; margin-left: 5px;"/>
            </div>
        </div>
      `;
    let dialogContent = `<p>${game.i18n.format("TAMS.Combat.ApplyingHitsTo", { count: locations.length, name: target.name })}</p>${squadHtml}${coverHtml}`;
    locations.forEach((loc, i) => {
      const limbKey = locationMap[loc];
      const limb = target.system.limbs[limbKey];
      const armor = Math.floor((limb == null ? void 0 : limb.armor) || 0);
      const armorMax = Math.floor((limb == null ? void 0 : limb.armorMax) || 0);
      dialogContent += `
            <div class="form-group" style="margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                <label>${game.i18n.format("TAMS.Combat.HitLabel", { index: i + 1, location: loc })}</label>
                <div class="flexrow">
                    <span>${game.i18n.localize("TAMS.Combat.DmgShort")} </span><input type="number" class="hit-dmg" data-index="${i}" value="${defaultDmg}" style="width: 50px;"/>
                    <span>${game.i18n.localize("TAMS.Combat.ArmorShort")} ${armor}/${armorMax}</span>
                    <label style="flex: 0 0 auto; margin-left: 10px;">
                        <input type="checkbox" class="hit-in-cover" data-index="${i}"> ${game.i18n.localize("TAMS.Combat.InCover")}
                    </label>
                </div>
            </div>`;
    });
    new Dialog({
      title: game.i18n.format("TAMS.Checks.ApplyDamageTo", { name: target.name }),
      content: dialogContent,
      render: (html2) => {
        const updateDamage = () => {
          const multiplier = isAoEHit && isSquadOrHorde ? parseInt(html2.find("#aoe-targets-hit").val()) || 1 : 1;
          const coverSelect = html2.find("#cover-select").val();
          let coverVal = 0;
          if (coverSelect === "custom") {
            html2.find("#cover-custom").show();
            coverVal = parseInt(html2.find("#cover-custom").val()) || 0;
          } else {
            html2.find("#cover-custom").hide();
            coverVal = parseInt(coverSelect) || 0;
          }
          html2.find(".hit-dmg").each(function() {
            const idx = $(this).data("index");
            const isCovered = html2.find(`.hit-in-cover[data-index="${idx}"]`).is(":checked");
            let effectiveBaseDmg = damageBase;
            if (isCovered) {
              effectiveBaseDmg = Math.max(0, effectiveBaseDmg - coverVal);
            }
            $(this).val(effectiveBaseDmg * multiplier);
          });
        };
        html2.find("#aoe-targets-hit, #cover-select, #cover-custom").on("input change", updateDamage);
        html2.find(".hit-in-cover").on("change", updateDamage);
      },
      buttons: {
        apply: {
          label: game.i18n.localize("TAMS.Checks.ApplyAllHits"),
          callback: async (html2) => {
            const multiplier = isAoEHit && isSquadOrHorde ? parseInt(html2.find("#aoe-targets-hit").val()) || 1 : 1;
            const dmgInputs = html2.find(".hit-dmg");
            const hits = [];
            for (let i = 0; i < locations.length; i++) {
              const totalIncoming = Math.floor(parseFloat(dmgInputs[i].value) || 0);
              const subHits = isAoEHit && isSquadOrHorde ? multiplier : 1;
              let remainingDmg = totalIncoming;
              for (let m = 0; m < subHits; m++) {
                const incoming = Math.floor(remainingDmg / (subHits - m));
                remainingDmg -= incoming;
                if (incoming <= 0 && m > 0) continue;
                const loc = isAoEHit && isSquadOrHorde && (m > 0 || i > 0) ? await getHitLocation() : locations[i];
                hits.push({ location: loc, damage: incoming, armourPen, forceCrit: forceCrit ? "1" : "0" });
              }
            }
            const { pendingChecks, report } = await target.applyDamage(hits, { isAoE: isAoEHit, multiplier });
            ChatMessage.create({ content: report });
            if (pendingChecks.length > 0) showCombinedInjuryDialog(target, pendingChecks);
          }
        }
      },
      default: "apply"
    }).render(true);
  }));
  root.querySelectorAll(".tams-apply-if-cost").forEach((el) => el.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const btn = ev.currentTarget;
    const cost = parseInt(btn.dataset.cost) || 0;
    const resourceKey = btn.dataset.resource || "stamina";
    const actorUuid = btn.dataset.actorUuid;
    const label = btn.dataset.label;
    if (!actorUuid) return;
    const actor = await fromUuid(actorUuid);
    if (!actor) return;
    if (resourceKey === "stamina") {
      const current = actor.system.stamina.value;
      if (current < cost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
      await actor.update({ "system.stamina.value": current - cost });
    } else {
      const idx = parseInt(resourceKey);
      const res = actor.system.customResources[idx];
      if (res) {
        if (res.value < cost) {
          const remaining = cost - res.value;
          const stamina = actor.system.stamina.value;
          if (stamina < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", { resource: res.name }));
          const useBoth = await new Promise((resolve) => {
            new Dialog({
              title: game.i18n.localize("TAMS.Combat.InsufficientResources"),
              content: `<p>${game.i18n.format("TAMS.Combat.InsufficientResourcesContent", { val: res.value, res: res.name, rem: remaining })}</p>`,
              buttons: {
                yes: { label: game.i18n.localize("TAMS.Yes"), callback: () => resolve(true) },
                no: { label: game.i18n.localize("TAMS.No"), callback: () => resolve(false) }
              },
              default: "yes",
              close: () => resolve(false)
            }).render(true);
          });
          if (!useBoth) return;
          const resources = foundry.utils.duplicate(actor.system.customResources);
          resources[idx].value = 0;
          await actor.update({
            "system.customResources": resources,
            "system.stamina.value": stamina - remaining
          });
        } else {
          const resources = foundry.utils.duplicate(actor.system.customResources);
          resources[idx].value -= cost;
          await actor.update({ "system.customResources": resources });
        }
      }
    }
    ui.notifications.info(`Applied cost for: ${label}`);
    btn.disabled = true;
    btn.innerText = "Applied";
  }));
  root.querySelectorAll(".tams-dodge").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a, _b, _c;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const attackerRaw = parseInt(btn.dataset.raw);
    const attackerTotal = parseInt(btn.dataset.total);
    const attackerMulti = parseInt(btn.dataset.multi) || 1;
    const attackerDamage = parseInt(btn.dataset.damage) || 0;
    const attackerArmourPen = parseInt(btn.dataset.armourPen) || 0;
    const firstLocation = btn.dataset.location;
    const attackerLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : firstLocation ? [firstLocation] : [];
    const targetLimb = btn.dataset.targetLimb;
    const isAoEFromData = btn.dataset.isAoe === "1";
    const container2 = btn.closest(".tams-roll");
    const isBehind = (container2 == null ? void 0 : container2.classList.contains("behind-attack")) || false;
    const isUnaware = (container2 == null ? void 0 : container2.classList.contains("unaware-defender")) || false;
    let actor = null;
    const targetTokenId = btn.dataset.targetTokenId;
    const targetActorId = btn.dataset.targetActorId;
    if (targetTokenId) {
      const token = canvas.tokens.get(targetTokenId);
      if (token) actor = token.actor;
    }
    if (!actor && targetActorId) actor = game.actors.get(targetActorId);
    if (!actor) actor = ((_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor) ?? null;
    if (!actor) actor = ((_c = [...((_b = game == null ? void 0 : game.user) == null ? void 0 : _b.targets) ?? []][0]) == null ? void 0 : _c.actor) ?? null;
    if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDodge"));
    const dex = actor.system.stats.dexterity;
    let cap = dex.total;
    if (isBehind) cap = Math.floor(cap * (actor.system.behindMult ?? 0.5));
    if (isUnaware) cap = Math.floor(cap * 0.5);
    const roll = await new Roll("1d100").evaluate();
    const raw = roll.total;
    const capped = Math.min(raw, cap);
    const total = capped;
    let critInfo = "";
    if (raw >= attackerRaw * 2) {
      critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", { raw, attacker: attackerRaw })}</div>`;
    } else if (attackerRaw >= raw * 2) {
      critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", { attacker: attackerRaw, raw })}</div>`;
    }
    let hitsScored = 0;
    let damageInfo = "";
    if (attackerTotal > total) {
      hitsScored = Math.min(1 + Math.floor((attackerTotal - total) / 5), attackerMulti);
      const locations = [];
      const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
      for (let i = 0; i < hitsScored; i++) {
        locations.push(attackerLocations[i] || (targetLimb && targetLimb !== "none" ? limbOptions[targetLimb] : await getHitLocation()));
      }
      damageInfo = `
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-locations='${JSON.stringify(locations)}' data-is-aoe="${isAoEFromData ? "1" : "0"}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
            </div>
          `;
      if (!critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.DodgeFailed", { total: attackerTotal })}</div>`;
    } else {
      if (!critInfo) critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.DodgeSuccess", { total: attackerTotal })}</div>`;
    }
    const msg = `
        <div class="tams-roll" data-actor-uuid="${actor.uuid}" data-actor-id="${actor.id}" data-attacker-total="${attackerTotal}" data-attacker-raw="${attackerRaw}" data-attacker-multi="${attackerMulti}" data-attacker-damage="${attackerDamage}" data-attacker-armour-pen="${attackerArmourPen}" data-first-location="${attackerLocations[0] || ""}" data-target-limb="${targetLimb}" data-raw="${raw}" data-capped="${capped}" data-unaware="${isUnaware ? "1" : "0"}" data-is-aoe="${isAoEFromData ? "1" : "0"}">
          <h3 class="roll-label">${game.i18n.format("TAMS.Combat.DodgeWith", { name: actor.name })} ${isBehind ? "(Behind)" : ""} ${isUnaware ? "(Unaware)" : ""}</h3>
          <div class="roll-crit-info">${critInfo}</div>
          <div class="roll-hits-info">${damageInfo}</div>
          <div class="roll-row"><span>${game.i18n.localize("TAMS.Combat.RawDiceResult")}</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>${game.i18n.format("TAMS.Combat.StatCapLabel", { name: "Dex", value: cap })}</small><span>${capped}</span></div>
          <div class="roll-boost-container"></div>
          <hr>
          <div class="roll-total">${game.i18n.localize("TAMS.Total")}: <b>${total}</b></div>
          ${attackerTotal > total && actor.type === "character" ? `
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-boost-dodge">${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}</button>
            </div>
          ` : ""}
          <div class="roll-contest-hint">
            <small><b>${game.i18n.localize("TAMS.Combat.ContestLabel")}</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>${game.i18n.localize("TAMS.Combat.CritCheckLabel")}</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
        </div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: msg, rolls: [roll] });
  }));
  root.querySelectorAll(".tams-boost-dodge").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const container2 = btn.closest(".tams-roll");
    const attackerTotal = parseInt(container2.dataset.attackerTotal);
    const actorId = container2.dataset.actorId;
    const actorUuid = container2.dataset.actorUuid;
    const raw = parseInt(container2.dataset.raw);
    const capped = parseInt(container2.dataset.capped);
    const actor = fromUuidSync(actorUuid) || game.actors.get(actorId);
    if (!actor) return;
    const isUnawareFromData = container2.dataset.unaware === "1";
    const pointsNeeded = Math.max(0, Math.ceil((attackerTotal - capped) / 5));
    const resources = [{ id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value }];
    actor.system.customResources.forEach((res, idx) => {
      resources.push({ id: idx.toString(), name: res.name, value: res.value });
    });
    const options = resources.map((r) => `<option value="${r.id}">${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
    const spending = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Combat.BoostDodgeTitle"),
        content: `
            <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
            <div class="form-group">
                <label>${game.i18n.localize("TAMS.Combat.PointsSpentMax10")}</label>
                <input type="number" id="res-points" value="${Math.min(pointsNeeded, 10)}" min="0" max="10"/>
                <p><small>${game.i18n.localize("TAMS.Combat.BoostDodgeHint")}</small></p>
                <p><i>${pointsNeeded > 0 ? game.i18n.format("TAMS.Combat.MinToDodge", { points: pointsNeeded }) : game.i18n.localize("TAMS.Combat.AlreadyDodged")}</i></p>
            </div>
            <div class="form-group">
                <label>${game.i18n.localize("TAMS.Combat.UnawareCheckbox")}</label>
                <input type="checkbox" id="unaware" ${isUnawareFromData ? "checked" : ""}/>
            </div>`,
        buttons: {
          go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html2) => {
            const resId2 = html2.find("#res-type").val();
            const res = resources.find((r) => r.id === resId2);
            let requestedPoints = Math.clamp(parseInt(html2.find("#res-points").val()) || 0, 0, 10);
            if (requestedPoints > res.value) requestedPoints = res.value;
            resolve({ resId: resId2, points: requestedPoints, unaware: html2.find("#unaware").is(":checked") });
          } },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "go"
      }).render(true);
    });
    if (!spending) return;
    const { resId, points, unaware } = spending;
    const bonus = points * 5;
    if (points > 0) {
      if (resId === "stamina") {
        await actor.update({ "system.stamina.value": actor.system.stamina.value - points });
      } else {
        const idx = parseInt(resId);
        const customResources = foundry.utils.duplicate(actor.system.customResources);
        customResources[idx].value -= points;
        await actor.update({ "system.customResources": customResources });
      }
    }
    let finalCapped = capped;
    if (unaware) finalCapped = Math.floor(finalCapped * 0.5);
    const total = finalCapped + bonus;
    let critInfo = "";
    let hitsScored = 0;
    let damageInfo = "";
    const attackerMulti = parseInt(container2.dataset.attackerMulti) || 1;
    const attackerRaw = parseInt(container2.dataset.attackerRaw);
    const attackerDamage = parseInt(container2.dataset.attackerDamage) || 0;
    const attackerArmourPen = parseInt(container2.dataset.attackerArmourPen) || 0;
    const firstLocation = container2.dataset.firstLocation;
    const targetLimb = container2.dataset.targetLimb;
    const isAoEFromData = container2.dataset.isAoe === "1";
    if (raw >= attackerRaw * 2) {
      critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", { raw, attacker: attackerRaw })}</div>`;
    } else if (attackerRaw >= raw * 2) {
      critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", { attacker: attackerRaw, raw })}</div>`;
    }
    if (attackerTotal > total) {
      hitsScored = Math.min(1 + Math.floor((attackerTotal - total) / 5), attackerMulti);
      const locations = [firstLocation];
      const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
      for (let i = 1; i < hitsScored; i++) {
        locations.push(targetLimb && targetLimb !== "none" ? limbOptions[targetLimb] : await getHitLocation());
      }
      damageInfo = `
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${locations.join(", ")}</small></div>
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-locations='${JSON.stringify(locations)}' data-is-aoe="${isAoEFromData ? "1" : "0"}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
            </div>
          `;
      if (!critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.DodgeFailed", { total: attackerTotal })}</div>`;
    } else {
      if (!critInfo) critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.DodgeSuccess", { total: attackerTotal })}</div>`;
    }
    const boostHtml = `<div class="roll-row"><small>${game.i18n.localize("TAMS.Combat.BoostLabel")}</small><span>+${bonus}</span></div>`;
    if (unaware) {
      const labelEl = container2.querySelector(".roll-label");
      if (!labelEl.innerText.includes("(Unaware)")) labelEl.innerText += " (Unaware)";
      container2.querySelectorAll(".roll-row")[1].innerHTML = `<span>${game.i18n.format("TAMS.Combat.StatCapLabel", { name: "Unaware", value: finalCapped })}</span><span>${finalCapped}</span>`;
    }
    container2.querySelector(".roll-boost-container").innerHTML = boostHtml;
    container2.querySelector(".roll-total b").innerText = total;
    container2.querySelector(".roll-hits-info").innerHTML = damageInfo;
    container2.querySelector(".roll-crit-info").innerHTML = critInfo;
    const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId;
    btn.remove();
    const message2 = game.messages.get(messageId);
    if (message2) await tamsUpdateMessage(message2, { content: container2.outerHTML });
  }));
  root.querySelectorAll(".tams-retaliate").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a, _b, _c, _d, _e;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const attackerRaw = parseInt(btn.dataset.raw);
    const attackerTotal = parseInt(btn.dataset.total);
    const attackerMulti = parseInt(btn.dataset.multi) || 1;
    const attackerDamage = parseInt(btn.dataset.damage) || 0;
    const attackerArmourPen = parseInt(btn.dataset.armourPen) || 0;
    const isRanged = btn.dataset.isRanged === "1";
    const firstLocation = btn.dataset.location;
    const attackerLocations = btn.dataset.locations ? JSON.parse(btn.dataset.locations) : firstLocation ? [firstLocation] : [];
    const attackerTargetLimb = btn.dataset.targetLimb;
    const isAoEFromData = btn.dataset.isAoe === "1";
    const container2 = btn.closest(".tams-roll");
    const isBehind = (container2 == null ? void 0 : container2.classList.contains("behind-attack")) || false;
    const isUnaware = (container2 == null ? void 0 : container2.classList.contains("unaware-defender")) || false;
    let actor = null;
    const targetTokenId = btn.dataset.targetTokenId;
    const targetActorId = btn.dataset.targetActorId;
    if (targetTokenId) {
      const token = canvas.tokens.get(targetTokenId);
      if (token) actor = token.actor;
    }
    if (!actor && targetActorId) actor = game.actors.get(targetActorId);
    if (!actor) actor = ((_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor) ?? null;
    if (!actor) actor = ((_c = [...((_b = game == null ? void 0 : game.user) == null ? void 0 : _b.targets) ?? []][0]) == null ? void 0 : _c.actor) ?? null;
    if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetRetaliate"));
    const weapons = actor.items.filter((i) => i.type === "weapon" || i.type === "ability" && i.system.isReaction && i.system.isAttack);
    if (!weapons.length) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoValidWeapons"));
    const options = weapons.map((w) => `<option value="${w.id}">${w.name} (${w.type === "ability" ? "Ability" : "Weapon"}, Fam ${w.system.familiarity || 0})</option>`).join("");
    let chosenId = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Combat.ChooseWeaponRetaliate"),
        content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Weapon")}</label><select id="ret-weapon">${options}</select></div>`,
        buttons: { go: { label: game.i18n.localize("TAMS.Combat.RetaliateButton"), callback: (html2) => resolve(html2.find("#ret-weapon").val()) } },
        default: "go"
      }).render(true);
    });
    const weapon = actor.items.get(chosenId);
    if (!weapon) return;
    if (weapon.type === "ability") {
      const cost = parseInt(weapon.system.cost) || 0;
      if (!weapon.system.isApex && cost > 0) {
        const resourceKey = weapon.system.resource;
        if (resourceKey === "stamina") {
          if (actor.system.stamina.value < cost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
          await actor.update({ "system.stamina.value": actor.system.stamina.value - cost });
        } else {
          const idx = parseInt(resourceKey);
          const res = actor.system.customResources[idx];
          if (res) {
            if (res.value < cost) {
              const remaining = cost - res.value;
              if (actor.system.stamina.value < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", { resource: res.name }));
              const useBoth = await new Promise((resolve) => {
                new Dialog({
                  title: game.i18n.localize("TAMS.Combat.InsufficientResources"),
                  content: `<p>${game.i18n.format("TAMS.Combat.InsufficientResourcesContent", { val: res.value, res: res.name, rem: remaining })}</p>`,
                  buttons: { yes: { label: game.i18n.localize("TAMS.Yes"), callback: () => resolve(true) }, no: { label: game.i18n.localize("TAMS.No"), callback: () => resolve(false) } },
                  default: "yes",
                  close: () => resolve(false)
                }).render(true);
              });
              if (!useBoth) return;
              const resources = foundry.utils.duplicate(actor.system.customResources);
              resources[idx].value = 0;
              await actor.update({ "system.customResources": resources, "system.stamina.value": actor.system.stamina.value - remaining });
            } else {
              const resources = foundry.utils.duplicate(actor.system.customResources);
              resources[idx].value -= cost;
              await actor.update({ "system.customResources": resources });
            }
          }
        }
      }
    }
    let cap = 0;
    let balancedBonus = 0;
    if (weapon.type === "weapon") {
      cap = weapon.system.isRanged && !weapon.system.isThrown || weapon.system.isLight ? actor.system.stats.dexterity.total : actor.system.stats.strength.total;
      if (weapon.system.tags.toLowerCase().includes("balanced") && !weapon.system.isRanged) {
        balancedBonus = 10;
      }
    } else {
      cap = ((_d = actor.system.stats[weapon.system.attackStat]) == null ? void 0 : _d.total) || 0;
    }
    if (isBehind) cap = Math.floor(cap * (actor.system.behindMult ?? 0.5));
    if (isUnaware) cap = Math.floor(cap * 0.5);
    const fam = Math.floor(weapon.system.familiarity || 0) + balancedBonus;
    const roll = await new Roll("1d100").evaluate();
    let raw = roll.total;
    const originalRaw = raw;
    let rerolled = false;
    const tags = (weapon.system.tags || "").split(",").map((t) => t.trim().toLowerCase());
    if (tags.includes("reliable") && raw <= 4) {
      const reroll = await new Roll("1d100").evaluate();
      raw = reroll.total;
      rerolled = true;
    }
    const capped = Math.min(raw, cap);
    const total = capped + fam;
    const threshold = isRanged ? 20 : 10;
    const isMutual = Math.abs(attackerTotal - total) <= threshold;
    if (isAoEFromData) return ui.notifications.warn(game.i18n.localize("TAMS.Combat.RetaliateNoAoE"));
    let critInfo = "";
    if (raw >= attackerRaw * 2) critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.Combat.CriticalDodge", { raw, attacker: attackerRaw })}</div>`;
    else if (attackerRaw >= raw * 2) critInfo = `<div class="tams-crit failure">${game.i18n.format("TAMS.Combat.CriticalHitTaken", { attacker: attackerRaw, raw })}</div>`;
    let multiVal = weapon.type === "weapon" ? weapon.system.fireRate === "3" ? 3 : weapon.system.fireRate === "auto" ? 10 : weapon.system.fireRate === "custom" ? weapon.system.fireRateCustom : 1 : weapon.system.multiAttack || 1;
    const damage = weapon.system.calculatedDamage;
    const armourPen = weapon.type === "weapon" && weapon.system.hasArmourPen ? weapon.system.armourPenetration || 0 : weapon.system.armourPenetration || 0;
    const defenderTargetLimb = weapon.type === "ability" && ((_e = weapon.system.calculator) == null ? void 0 : _e.enabled) ? weapon.system.calculator.targetLimb : "none";
    let hitsScored = total >= attackerTotal || isMutual ? Math.min(1 + Math.floor(Math.max(0, total - attackerTotal) / 5), multiVal) : 0;
    let retLocations = [];
    const limbOptions = { "head": "Head", "thorax": "Thorax", "stomach": "Stomach", "leftArm": "Left Arm", "rightArm": "Right Arm", "leftLeg": "Left Leg", "rightLeg": "Right Leg" };
    for (let i = 0; i < hitsScored; i++) {
      retLocations.push(defenderTargetLimb && defenderTargetLimb !== "none" ? limbOptions[defenderTargetLimb] : await getHitLocation(i === 0 ? raw : null));
    }
    let defenseDamageInfo = "";
    let defenseLocations = [];
    if (isMutual || attackerTotal > total) {
      const hitsTaken = Math.min(1 + Math.floor(Math.max(0, attackerTotal - total) / 5), attackerMulti);
      for (let i = 0; i < hitsTaken; i++) {
        defenseLocations.push(attackerLocations[i] || (attackerTargetLimb && attackerTargetLimb !== "none" ? limbOptions[attackerTargetLimb] : await getHitLocation()));
      }
      defenseDamageInfo = `
            <div class="roll-row"><b style="color:${isMutual ? "orange" : "red"};">${isMutual ? game.i18n.format("TAMS.Combat.MutualHit", { threshold }) : game.i18n.localize("TAMS.Combat.FailedToBeatAttack")}</b></div>
            <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsTaken} / ${attackerMulti}</b></div>
            <div class="roll-row"><small>${game.i18n.localize("TAMS.Location")}: ${defenseLocations.join(", ")}</small></div>
            <div class="roll-row" style="margin-bottom: 10px;">
                <button class="tams-take-damage" data-damage="${attackerDamage}" data-armour-pen="${attackerArmourPen}" data-locations='${JSON.stringify(defenseLocations)}' data-is-aoe="${isAoEFromData ? "1" : "0"}">${game.i18n.localize("TAMS.Combat.ApplyHitsToDefender")}</button>
            </div>
          `;
      if (!isMutual && !critInfo) critInfo = `<div class="tams-failure">${game.i18n.format("TAMS.Combat.RetaliateFailed", { total: attackerTotal })}</div>`;
    } else if (!critInfo) {
      critInfo = `<div class="tams-success">${game.i18n.format("TAMS.Combat.RetaliateSuccess", { total: attackerTotal })}</div>`;
    }
    const isRetAoE = !!weapon.system.isAoE;
    const retButtons = hitsScored > 0 && !isMutual ? `
          <button class="tams-take-damage" data-damage="${damage}" data-armour-pen="${armourPen}" data-locations='${JSON.stringify(retLocations)}' data-is-aoe="${isRetAoE ? "1" : "0"}">${game.i18n.localize("TAMS.Checks.ApplyAllHits")}</button>
          <button class="tams-dodge" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isRetAoE ? "1" : "0"}" data-target-limb="${defenderTargetLimb}">${game.i18n.localize("TAMS.Dodge")}</button>
          <button class="tams-retaliate" data-raw="${raw}" data-total="${total}" data-multi="${multiVal}" data-location="${retLocations[0]}" data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isRetAoE ? "1" : "0"}" data-target-limb="${defenderTargetLimb}">${game.i18n.localize("TAMS.Combat.RetaliateButton")}</button>
          <button class="tams-behind-toggle" style="background: #444; color: white;">B</button>
          <button class="tams-unaware-toggle" style="background: #444; color: white;">U</button>
      ` : isMutual ? `<button class="tams-take-damage" data-damage="${damage}" data-armour-pen="${armourPen}" data-locations='${JSON.stringify(retLocations)}' data-is-aoe="${isRetAoE ? "1" : "0"}">${game.i18n.localize("TAMS.Checks.ApplyAllHits")}</button>` : "";
    const msg = `
        <div class="tams-roll" data-attacker-raw="${raw}" data-attacker-total="${total}" data-attacker-multi="${multiVal}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? "1" : "0"}" data-target-limb="${defenderTargetLimb}" data-orig-attacker-raw="${attackerRaw}" data-orig-attacker-total="${attackerTotal}" data-orig-attacker-multi="${attackerMulti}" data-orig-attacker-damage="${attackerDamage}" data-orig-attacker-armour-pen="${attackerArmourPen}" data-orig-first-location="${firstLocation}" data-orig-target-limb="${attackerTargetLimb}" data-is-aoe="${isRetAoE ? "1" : "0"}">
          <h3 class="roll-label">${game.i18n.format("TAMS.Combat.RetaliationWith", { name: actor.name, weapon: weapon.name })} ${isBehind ? "(Behind)" : ""} ${isUnaware ? "(Unaware)" : ""}</h3>
          ${weapon.type === "ability" && weapon.system.description ? `<div class="roll-description">${weapon.system.description}</div>` : ""}
          ${rerolled ? `<div class="roll-row reliable-reroll" style="color: #2c3e50; font-style: italic; font-size: 0.9em; margin-bottom: 4px;">
              ${game.i18n.format("TAMS.Checks.Notifications.ReliableReroll", { original: originalRaw })}
          </div>` : ""}
          ${defenseDamageInfo}
          <hr>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.DmgShort")} ${damage}</b></div>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Combat.HitsTaken")} ${hitsScored} / ${multiVal}</b></div>
          <div class="roll-row"><b>${game.i18n.localize("TAMS.Location")}: ${retLocations[0] || "-"}</b></div>
          ${retLocations.length > 1 ? `<div class="roll-row"><small>Additional: ${retLocations.slice(1).join(", ")}</small></div>` : ""}
          <div class="roll-row" style="gap:6px; flex-wrap: wrap;">${retButtons}</div>
          <div class="roll-row"><span>${game.i18n.localize("TAMS.Combat.RawDiceResult")}</span><span class="roll-value">${raw}</span></div>
          <div class="roll-row"><small>${game.i18n.format("TAMS.Combat.StatCapLabel", { name: "Cap", value: cap })}</small><span>${capped}</span></div>
          <div class="roll-row"><small>${game.i18n.localize("TAMS.Familiarity")}:</small><span>+${fam}</span></div>
          <hr>
          <div class="roll-total">${game.i18n.localize("TAMS.Total")}: <b>${total}</b></div>
          ${critInfo}
          <div class="roll-contest-hint">
            <small><b>${game.i18n.localize("TAMS.Combat.ContestLabel")}</b> Total vs Attacker Total (${attackerTotal})</small><br>
            <small><b>${game.i18n.localize("TAMS.Combat.CritCheckLabel")}</b> Raw vs Attacker Raw (${attackerRaw})</small>
          </div>
        </div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: msg, rolls: [roll] });
  }));
  root.querySelectorAll(".tams-boost-unconscious").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const container2 = btn.closest(".tams-roll");
    const actor = fromUuidSync(container2.dataset.actorUuid) || game.actors.get(container2.dataset.actorId);
    if (!actor) return;
    const dc = parseInt(container2.dataset.dc), raw = parseInt(container2.dataset.raw), end = parseInt(container2.dataset.end);
    const capped = Math.min(raw, end), pointsNeeded = Math.max(0, Math.ceil((dc - capped) / 5));
    const resources = [{ id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value }];
    actor.system.customResources.forEach((res, idx) => resources.push({ id: idx.toString(), name: res.name, value: res.value }));
    const options = resources.map((r) => `<option value="${r.id}">${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
    const spending = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.Combat.BoostUnconsciousTitle"),
        content: `
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.Combat.PointsSpentMax10")}</label>
                        <input type="number" id="res-points" value="${Math.min(pointsNeeded, 10)}" min="0" max="10"/>
                        <p><small>${game.i18n.localize("TAMS.Combat.BoostDodgeHint")}</small></p>
                    </div>`,
        buttons: {
          go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html2) => {
            const resId2 = html2.find("#res-type").val();
            const res = resources.find((r) => r.id === resId2);
            let pts2 = Math.clamp(parseInt(html2.find("#res-points").val()) || 0, 0, 10);
            if (pts2 > res.value) pts2 = res.value;
            resolve({ resId: resId2, pts: pts2 });
          } },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "go"
      }).render(true);
    });
    if (!spending) return;
    const { resId, pts } = spending;
    const bonus = pts * 5, total = capped + bonus, success = total >= dc;
    if (pts > 0) {
      if (resId === "stamina") await actor.update({ "system.stamina.value": actor.system.stamina.value - pts });
      else {
        const customResources = foundry.utils.duplicate(actor.system.customResources);
        customResources[parseInt(resId)].value -= pts;
        await actor.update({ "system.customResources": customResources });
      }
    }
    const resName = resources.find((r) => r.id === resId).name;
    container2.querySelector(".roll-boost-container").innerHTML = `<div class="roll-row"><span>Boost (${resName}):</span><span>+${bonus}</span></div>`;
    container2.querySelector(".roll-total b").innerText = total;
    const statusDiv = container2.querySelector(".tams-success, .tams-crit.failure");
    if (statusDiv) {
      statusDiv.className = success ? "tams-success" : "tams-crit failure";
      statusDiv.innerText = success ? game.i18n.localize("TAMS.Combat.RemainsConscious") : game.i18n.localize("TAMS.Combat.FallsUnconscious");
    }
    const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId;
    btn.remove();
    const message2 = game.messages.get(messageId);
    if (message2) await tamsUpdateMessage(message2, { content: container2.outerHTML });
  }));
  root.querySelectorAll(".tams-boost-roll").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const actor = fromUuidSync(btn.dataset.actorUuid) || game.actors.get(btn.dataset.actorId);
    if (!actor) return;
    const difficulty = parseInt(btn.dataset.difficulty);
    const currentTotal = parseInt(btn.dataset.total);
    const pointsNeeded = Math.max(0, Math.ceil((difficulty - currentTotal) / 5));
    const resources = [{ id: "stamina", name: game.i18n.localize("TAMS.Stamina"), value: actor.system.stamina.value }];
    actor.system.customResources.forEach((res, idx) => resources.push({ id: idx.toString(), name: res.name, value: res.value }));
    const options = resources.map((r) => `<option value="${r.id}">${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
    const spending = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("TAMS.BoostRollTitle"),
        content: `
                    <div class="form-group"><label>${game.i18n.localize("TAMS.Combat.Resource")}</label><select id="res-type">${options}</select></div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.Combat.PointsSpent")}</label>
                        <input type="number" id="res-points" value="${pointsNeeded}" min="0"/>
                        <p><small>${game.i18n.localize("TAMS.Combat.BoostLabel")} (+5/pt)</small></p>
                    </div>`,
        buttons: {
          go: { label: game.i18n.localize("TAMS.Combat.ApplyBoost"), callback: (html2) => {
            const resId2 = html2.find("#res-type").val();
            const res = resources.find((r) => r.id === resId2);
            let pts2 = parseInt(html2.find("#res-points").val()) || 0;
            if (pts2 > res.value) pts2 = res.value;
            resolve({ resId: resId2, pts: pts2 });
          } },
          cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) }
        },
        default: "go"
      }).render(true);
    });
    if (!spending) return;
    const { resId, pts } = spending;
    const bonus = pts * 5;
    const newTotal = currentTotal + bonus;
    const success = newTotal >= difficulty;
    if (pts > 0) {
      if (resId === "stamina") await actor.update({ "system.stamina.value": actor.system.stamina.value - pts });
      else {
        const customResources = foundry.utils.duplicate(actor.system.customResources);
        customResources[parseInt(resId)].value -= pts;
        await actor.update({ "system.customResources": customResources });
      }
    }
    const resName = resources.find((r) => r.id === resId).name;
    const boostContainer = container.querySelector(".roll-boost-container");
    if (boostContainer) {
      boostContainer.innerHTML = `<div class="roll-row"><span>Boost (${resName}):</span><span>+${bonus}</span></div>`;
    }
    const totalEl = container.querySelector(".roll-total b");
    if (totalEl) totalEl.innerText = newTotal;
    const statusDiv = container.querySelector(".tams-failure, .tams-success");
    if (statusDiv) {
      statusDiv.className = success ? "tams-success" : "tams-failure";
      statusDiv.innerHTML = success ? game.i18n.format("TAMS.SuccessVsDiffBoosted", { difficulty, amount: bonus }) : game.i18n.format("TAMS.FailureVsDiff", { difficulty });
    }
    const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId;
    btn.remove();
    const message2 = game.messages.get(messageId);
    if (message2) await tamsUpdateMessage(message2, { content: container.outerHTML });
  }));
  root.querySelectorAll(".tams-block").forEach((el) => el.addEventListener("click", async (ev) => {
    var _a, _b, _c;
    ev.preventDefault();
    const btn = ev.currentTarget;
    const actorUuid = btn.dataset.targetActorUuid;
    const actor = actorUuid ? await fromUuid(actorUuid) : ((_a = canvas.tokens.controlled[0]) == null ? void 0 : _a.actor) || ((_c = [...((_b = game == null ? void 0 : game.user) == null ? void 0 : _b.targets) ?? []][0]) == null ? void 0 : _c.actor);
    if (!actor) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.SelectTargetDodge"));
    const shield = actor.items.find((i) => i.type === "shield" && i.system.equipped);
    if (!shield) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoShield"));
    const locations = JSON.parse(btn.dataset.locations);
    const content = `
            <p>${game.i18n.format("TAMS.Combat.ChooseLimbToBlock", { name: shield.name, armor: shield.system.armorValue })}</p>
            <select id="block-loc">
                ${locations.map((loc, i) => `<option value="${i}">${loc}</option>`).join("")}
            </select>`;
    new Dialog({
      title: game.i18n.localize("TAMS.Combat.ShieldBlock"),
      content,
      buttons: {
        block: {
          label: game.i18n.localize("TAMS.Combat.BlockHit"),
          callback: async (html2) => {
            const idx = parseInt(html2.find("#block-loc").val());
            const locationToBlock = locations[idx];
            const damage = parseInt(btn.dataset.damage);
            const armourPen = parseInt(btn.dataset.armourPen) || 0;
            const shieldArmor = shield.system.armorValue;
            const report = `
                            <div class="tams-roll">
                                <h3 class="roll-label">${game.i18n.format("TAMS.Combat.ShieldBlockWith", { name: actor.name, shield: shield.name })}</h3>
                                <div class="tams-success">${game.i18n.format("TAMS.Combat.BlockReport", { location: locationToBlock, armor: shieldArmor })}</div>
                                <div class="roll-row" style="margin-top: 5px;">
                                    <button class="tams-take-damage" 
                                            data-damage="${damage}" 
                                            data-armour-pen="${armourPen - shieldArmor}" 
                                            data-locations='${JSON.stringify([locationToBlock])}'
                                            data-target-actor-uuid="${actor.uuid}">${game.i18n.localize("TAMS.Combat.TakeDamage")}</button>
                                </div>
                            </div>`;
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: report });
          }
        },
        cancel: { label: game.i18n.localize("TAMS.Cancel") }
      },
      default: "block"
    }).render(true);
  }));
  ["behind", "unaware"].forEach((type) => {
    root.querySelectorAll(`.tams-${type}-toggle`).forEach((el) => el.addEventListener("click", async (ev) => {
      var _a;
      ev.preventDefault();
      const btn = ev.currentTarget, container2 = btn.closest(".tams-roll");
      container2.classList.toggle(`${type === "behind" ? "behind-attack" : "unaware-defender"}`);
      btn.style.background = container2.classList.contains(`${type === "behind" ? "behind-attack" : "unaware-defender"}`) ? "#2e7d32" : "#444";
      const messageId = (_a = btn.closest(".chat-message")) == null ? void 0 : _a.dataset.messageId, message2 = game.messages.get(messageId);
      if (message2) await tamsUpdateMessage(message2, { content: container2.outerHTML });
    }));
  });
  root.querySelectorAll(".tams-squad-crit-roll").forEach((el) => el.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const btn = ev.currentTarget, actor = fromUuidSync(btn.dataset.actorUuid) || game.actors.get(btn.dataset.actorId);
    if (!actor) return;
    const count = parseInt(btn.dataset.count), end = actor.system.stats.endurance.total;
    const dcsAttr = btn.dataset.dcs;
    let dcs = dcsAttr ? dcsAttr.split(",").map(Number) : [];
    let dc = 0;
    if (dcs.length === 0) {
      dc = await new Promise((resolve) => {
        new Dialog({
          title: game.i18n.localize("TAMS.Combat.CritDC"),
          content: `<div class="form-group"><label>${game.i18n.localize("TAMS.Combat.EnterDC")}</label><input type="number" id="dc" value="0"/></div>`,
          buttons: { roll: { label: game.i18n.localize("TAMS.Combat.Roll"), callback: (html2) => resolve(parseInt(html2.find("#dc").val()) || 0) }, cancel: { label: game.i18n.localize("TAMS.Cancel"), callback: () => resolve(null) } },
          default: "roll"
        }).render(true);
      });
      if (dc === null) return;
    }
    let rollResults = [], successCount = 0;
    for (let i = 0; i < count; i++) {
      const currentDc = dcs.length > 0 ? dcs[i] ?? dcs[dcs.length - 1] : dc;
      const raw = (await new Roll("1d100").evaluate()).total, capped = Math.min(raw, end), success = capped >= currentDc;
      if (success) successCount++;
      rollResults.push({ raw, capped, success, dc: currentDc });
    }
    const failureCount = count - successCount;
    const isMook = (actor.system.settings.npcRank || "mook") === "mook";
    const updates = {};
    let needsUpdate = false;
    const currentSize = actor.system.settings.squadSize;
    const newSize = isMook ? currentSize + successCount : currentSize - failureCount;
    if (newSize !== currentSize) {
      updates["system.settings.squadSize"] = newSize;
      needsUpdate = true;
    }
    if (successCount > 0) {
      const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
      for (let key of limbKeys) {
        const limb = actor.system.limbs[key];
        if (!limb) continue;
        const indMax = Math.floor(end * limb.mult);
        const currentVal = updates[`system.limbs.${key}.value`] ?? limb.value;
        updates[`system.limbs.${key}.value`] = currentVal + successCount * indMax;
      }
      needsUpdate = true;
    }
    if (needsUpdate) {
      const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
      for (let key of limbKeys) {
        const limb = actor.system.limbs[key];
        if (!limb) continue;
        const indMax = Math.floor(end * limb.mult);
        const maxForNewSize = newSize * indMax;
        const currentVal = updates[`system.limbs.${key}.value`] ?? limb.value;
        const totalDamage = limb.max - currentVal;
        const remainderDamage = totalDamage % indMax;
        if (currentVal > 0) {
          updates[`system.limbs.${key}.value`] = maxForNewSize - remainderDamage;
        } else {
          updates[`system.limbs.${key}.value`] = Math.max(currentVal, -maxForNewSize);
        }
      }
    }
    if (needsUpdate) await actor.update(updates);
    const displayDc = dcs.length > 0 ? dcs.every((d) => d === dcs[0]) ? dcs[0] : game.i18n.localize("TAMS.Combat.Variable") : dc;
    let resultsHtml = `<div class="tams-roll"><h3 class="roll-label">${game.i18n.format("TAMS.Combat.SquadCritChecks", { name: btn.dataset.name })}</h3><div class="roll-row"><span>Checks:</span><span>${count}</span></div><div class="roll-row"><span>Endurance:</span><span>${end}</span></div><div class="roll-row"><span>Target DC:</span><span>${displayDc}</span></div><hr><div class="squad-crit-list" style="max-height: 200px; overflow-y: auto;">`;
    rollResults.forEach((r, i) => {
      resultsHtml += `<div class="roll-row" style="border-bottom: 1px solid #eee; font-size: 0.9em; padding: 2px 0;"><span style="flex: 1;">${game.i18n.format("TAMS.Combat.SquadCritCheckRow", { i: i + 1, raw: r.raw, capped: r.capped })} (DC ${r.dc})</span><span style="color: ${r.success ? "#2e7d32" : "#c0392b"}; font-weight: bold; min-width: 50px; text-align: right;">${r.success ? game.i18n.localize("TAMS.Combat.Pass") : game.i18n.localize("TAMS.Combat.Fail")}</span></div>`;
    });
    resultsHtml += `</div>`;
    if (successCount > 0) {
      resultsHtml += `<div class="roll-row" style="color: #2e7d32; font-weight: bold; margin-top: 5px; border-top: 1px solid #2e7d32; padding-top: 3px;">${game.i18n.format("TAMS.Combat.SquadMembersRestored", { count: successCount })}</div>`;
    }
    if (!isMook && failureCount > 0) {
      resultsHtml += `<div class="roll-row" style="color: #c0392b; font-weight: bold; margin-top: 5px; border-top: 1px solid #c0392b; padding-top: 3px;">${game.i18n.format("TAMS.Combat.SquadMembersLost", { count: failureCount })}</div>`;
    }
    resultsHtml += `</div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: resultsHtml });
    btn.disabled = true;
    btn.innerText = game.i18n.localize("TAMS.Combat.ChecksRolled");
  }));
}
class TAMSActor extends Actor {
  /**
   * Apply damage to this actor across multiple hits/locations.
   * @param {object[]} hits Array of hit objects: { damage, location, armourPen }
   * @param {object} options Additional options
   * @param {boolean} [options.isAoE=false] Is this an AoE attack?
   * @param {number} [options.multiplier=1] For squads/hordes, how many members were hit by the AoE.
   * @returns {Promise<object>} Result including updates, itemUpdates, pendingChecks, and report.
   */
  async applyDamage(hits, { isAoE = false, multiplier = 1 } = {}) {
    var _a, _b;
    const updates = {};
    const itemUpdates = {};
    const pendingChecks = [];
    const limbDamageReceived = {};
    const originalLimbStatus = {};
    const locationMap = {
      "Head": "head",
      "Thorax": "thorax",
      "Stomach": "stomach",
      "Left Arm": "leftArm",
      "Right Arm": "rightArm",
      "Left Leg": "leftLeg",
      "Right Leg": "rightLeg"
    };
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (let key of limbKeys) {
      originalLimbStatus[key] = {
        value: this.system.limbs[key].value,
        injured: this.system.limbs[key].injured,
        criticallyInjured: this.system.limbs[key].criticallyInjured,
        max: this.system.limbs[key].max
      };
      limbDamageReceived[key] = 0;
    }
    let report = `<b>${this.name}</b> ${game.i18n.localize("TAMS.TakingDamage")}:<br>`;
    const isSquadOrHorde = ((_a = this.system.settings) == null ? void 0 : _a.isNPC) && (this.system.settings.npcType === "squad" || this.system.settings.npcType === "horde");
    const currentSquadSize = this.system.settings.squadSize || 1;
    const limbLosses = {};
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      const incoming = Math.floor(hit.damage || 0);
      const armourPen = hit.armourPen || 0;
      const loc = hit.location;
      const limbKey = locationMap[loc];
      if (!limbKey) continue;
      const limb = this.system.limbs[limbKey];
      const isAltArmor = (_b = this.system.settings) == null ? void 0 : _b.alternateArmour;
      const pendingArmor = updates[`system.limbs.${limbKey}.armor`];
      let armorValue = pendingArmor !== void 0 ? pendingArmor : limb.armor || 0;
      if (isAltArmor) {
        const pendingMax = updates[`system.limbs.${limbKey}.armorMax`];
        const curMax = pendingMax !== void 0 ? pendingMax : limb.armorMax || 0;
        if (curMax <= 0) armorValue = 0;
      }
      const otherArmor = limb.otherArmor || 0;
      const armor = Math.floor(armorValue + otherArmor);
      const effectiveArmor = Math.max(0, armor - armourPen);
      let effective = Math.max(0, incoming - effectiveArmor);
      const blocked = Math.min(incoming, effectiveArmor);
      let overflow = 0;
      if (isSquadOrHorde) {
        const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
        const limbCap = (isAoE ? multiplier : 1) * indMax;
        const currentLimbHpBeforeHit = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
        const cappedEffective = Math.min(effective, limbCap);
        overflow = effective - cappedEffective;
        const totalDamageOfHit = effective;
        effective = cappedEffective;
        if (!limbLosses[limbKey]) limbLosses[limbKey] = [];
        const newLimbHpAfterHit = currentLimbHpBeforeHit - effective;
        const oldSize = Math.max(0, Math.ceil(currentLimbHpBeforeHit / indMax));
        const newSize = Math.max(0, Math.ceil(newLimbHpAfterHit / indMax));
        const lostInThisHit = oldSize - newSize;
        if (lostInThisHit > 0) {
          const damageTakenAlready = limb.max - currentLimbHpBeforeHit;
          const totalDamageOnLimb = damageTakenAlready + totalDamageOfHit;
          const dc = totalDamageOnLimb;
          for (let j = 0; j < lostInThisHit; j++) {
            limbLosses[limbKey].push(dc);
          }
        }
      }
      const currentHp = updates[`system.limbs.${limbKey}.value`] ?? limb.value;
      const newHp = Math.floor(currentHp) - effective;
      updates[`system.limbs.${limbKey}.value`] = newHp;
      limbDamageReceived[limbKey] += effective;
      let lossLabel = "";
      if (armorValue > 0 && effective + overflow < incoming) {
        const key = isAltArmor ? `system.limbs.${limbKey}.armorMax` : `system.limbs.${limbKey}.armor`;
        const pending = updates[key];
        const currentVal = pending !== void 0 ? pending : isAltArmor ? limb.armorMax : limb.armor;
        updates[key] = Math.max(0, (currentVal || 0) - 1);
        lossLabel = isAltArmor ? game.i18n.localize("TAMS.Checks.ArmorHPLost") : game.i18n.localize("TAMS.Checks.ArmorPointLost");
      }
      const penLabel = armourPen > 0 ? game.i18n.format("TAMS.Checks.ArmorPenetrated", { pen: armourPen }) : "";
      const overflowLabel = overflow > 0 ? game.i18n.format("TAMS.Checks.OverflowCapped", { overflow }) : "";
      const lossMsg = lossLabel ? `, ${lossLabel}` : "";
      report += `• ${game.i18n.format("TAMS.Checks.DamageReport", { loc, effective, blocked, penLabel, lossLabel: lossMsg, overflowLabel })}<br>`;
      if (newHp <= -limb.max) {
        if (!limb.injured && !updates[`system.limbs.${limbKey}.injured`]) {
          report += `<b style="color:#f39c12;">!!! ${game.i18n.format("TAMS.Checks.LimbInjuredAuto", { limb: limb.label })} !!!</b><br>`;
        }
        updates[`system.limbs.${limbKey}.injured`] = true;
      }
    }
    if (isSquadOrHorde) {
      let finalSquadSize = currentSquadSize;
      let bottleneckLimb = null;
      const limbKeys2 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
      for (let lk of limbKeys2) {
        const limb = this.system.limbs[lk];
        if (!limb) continue;
        const newLimbVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
        const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
        const potentialSize = Math.max(0, Math.ceil(newLimbVal / indMax));
        if (potentialSize < finalSquadSize) {
          finalSquadSize = potentialSize;
          bottleneckLimb = lk;
        }
      }
      if (finalSquadSize < currentSquadSize) {
        const lostCount = currentSquadSize - finalSquadSize;
        const npcRank = this.system.settings.npcRank || "mook";
        const isMook = npcRank === "mook";
        if (isMook) {
          updates["system.settings.squadSize"] = finalSquadSize;
          report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadLostMembers", { name: this.name, lostCount, finalSquadSize })} !!!</b><br>`;
          const limbKeys3 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
          for (let lk of limbKeys3) {
            const limb = this.system.limbs[lk];
            if (!limb) continue;
            const indMax = limb.individualMax || Math.floor(this.system.stats.endurance.total * limb.mult);
            const newMax = finalSquadSize * indMax;
            const currentVal = updates[`system.limbs.${lk}.value`] ?? limb.value;
            const totalDamage = limb.max - currentVal;
            const remainderDamage = totalDamage % indMax;
            if (currentVal > 0) {
              updates[`system.limbs.${lk}.value`] = newMax - remainderDamage;
            } else {
              updates[`system.limbs.${lk}.value`] = Math.max(currentVal, -newMax);
            }
          }
        } else {
          report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadThreatenedMembers", { name: this.name, lostCount })} !!!</b><br>`;
        }
        if (!isMook) {
          const dcs = bottleneckLimb && limbLosses[bottleneckLimb] ? limbLosses[bottleneckLimb].slice(0, lostCount) : [];
          const dcsAttr = dcs.length > 0 ? ` data-dcs="${dcs.join(",")}"` : "";
          report += `<button class="tams-squad-crit-roll" data-actor-uuid="${this.uuid}" data-count="${lostCount}" data-name="${this.name}"${dcsAttr}>${game.i18n.format("TAMS.Checks.RollForCriticalWounds", { count: lostCount })}</button><br>`;
        }
        if (finalSquadSize === 0 && isMook) {
          report += `<b style="color:#c0392b;">!!! ${game.i18n.format("TAMS.Checks.SquadDestroyed", { name: this.name })} !!!</b><br>`;
        }
      }
    }
    const finalUpdates = { ...updates };
    if (Object.keys(itemUpdates).length > 0) {
      finalUpdates.items = Object.values(itemUpdates);
    }
    await this.update(finalUpdates);
    for (let [limbKey, damage] of Object.entries(limbDamageReceived)) {
      if (damage === 0 && !hits.some((h) => locationMap[h.location] === limbKey && h.forceCrit)) continue;
      const original = originalLimbStatus[limbKey];
      const limb = this.system.limbs[limbKey];
      const currentVal = limb.value;
      if (isSquadOrHorde) continue;
      if (currentVal <= 0 && currentVal > -limb.max && !original.injured && !limb.injured) {
        pendingChecks.push({ type: "injured", loc: limb.label, dc: damage + (original.value < 0 ? Math.abs(original.value) : 0), limbKey });
      }
      if (currentVal <= -limb.max && !original.criticallyInjured && original.value > -limb.max) {
        pendingChecks.push({ type: "crit", loc: limb.label, dc: damage + (original.value < 0 ? Math.abs(original.value) : 0), limbKey });
      } else if (hits.some((h) => locationMap[h.location] === limbKey && h.forceCrit === "1")) {
        if (!original.criticallyInjured) {
          pendingChecks.push({
            type: "crit",
            loc: limb.label,
            dc: Math.max(10, damage + (original.value < 0 ? Math.abs(original.value) : 0)),
            limbKey
          });
        }
      }
    }
    const totalHp = this.system.hp.value;
    const maxHp = this.system.hp.max;
    if (!isSquadOrHorde) {
      let survivalDC = 0;
      let reasons = [];
      let survivalNeeded = false;
      if (totalHp <= -maxHp) {
        survivalNeeded = true;
        survivalDC = Math.abs(totalHp);
        reasons.push(`${game.i18n.localize("TAMS.Checks.ReasonTotalHPBelowNegMax")} (${totalHp} / -${maxHp})`);
      } else if (totalHp < 0) {
        pendingChecks.push({
          type: "unconscious",
          dc: Math.abs(totalHp),
          reasons: [`${game.i18n.localize("TAMS.Checks.ReasonTotalHPNegative")} (${totalHp})`]
        });
      }
      const checkLethal = (key) => {
        const limb = this.system.limbs[key];
        if (limb.value < -limb.max) {
          survivalNeeded = true;
          const dc = Math.abs(limb.value);
          if (dc > survivalDC) survivalDC = dc;
          reasons.push(`${limb.label} ${game.i18n.localize("TAMS.Checks.ReasonLimbBeyondNegMax")} (${limb.value} / -${limb.max})`);
        }
      };
      checkLethal("head");
      checkLethal("thorax");
      if (survivalNeeded) {
        pendingChecks.push({ type: "survival", dc: survivalDC, reasons });
      }
    }
    return { pendingChecks, report };
  }
  /** @override */
  async _preUpdate(updateData, options, user) {
    var _a, _b;
    const res = await super._preUpdate(updateData, options, user);
    if (res === false) return false;
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const key of limbKeys) {
      const armorIdPath = `system.limbs.${key}.equippedArmorId`;
      if (foundry.utils.hasProperty(updateData, armorIdPath)) {
        const newArmorId = foundry.utils.getProperty(updateData, armorIdPath);
        const oldArmorId = this.system.limbs[key].equippedArmorId;
        if (newArmorId !== oldArmorId) {
          if (newArmorId) {
            const armorItem = this.items.get(newArmorId);
            if (armorItem && armorItem.type === "armor") {
              foundry.utils.setProperty(updateData, `system.limbs.${key}.armor`, ((_a = armorItem.system.limbs[key]) == null ? void 0 : _a.value) || 0);
              foundry.utils.setProperty(updateData, `system.limbs.${key}.armorMax`, ((_b = armorItem.system.limbs[key]) == null ? void 0 : _b.max) || 0);
            }
          } else {
            foundry.utils.setProperty(updateData, `system.limbs.${key}.armor`, 0);
            foundry.utils.setProperty(updateData, `system.limbs.${key}.armorMax`, 0);
          }
        }
      }
    }
    const stats = this.system.stats;
    const settings = this.system.settings;
    const oldSquadSize = settings.squadSize || 1;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");
    const hasEndValue = foundry.utils.hasProperty(updateData, "system.stats.endurance.value");
    const hasEndMod = foundry.utils.hasProperty(updateData, "system.stats.endurance.mod");
    const hasSquadSize = foundry.utils.hasProperty(updateData, "system.settings.squadSize");
    if (hasEndValue || hasEndMod || hasSquadSize) {
      const oldEnd = stats.endurance.value + (stats.endurance.mod || 0);
      const newEnd = (hasEndValue ? foundry.utils.getProperty(updateData, "system.stats.endurance.value") : stats.endurance.value) + (hasEndMod ? foundry.utils.getProperty(updateData, "system.stats.endurance.mod") : stats.endurance.mod || 0);
      const newSquadSize = hasSquadSize ? foundry.utils.getProperty(updateData, "system.settings.squadSize") : oldSquadSize;
      if (newEnd !== oldEnd || newSquadSize !== oldSquadSize) {
        const limbKeys2 = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
        for (const key of limbKeys2) {
          const limb = this.system.limbs[key];
          if (!limb) continue;
          const currentPath = `system.limbs.${key}.value`;
          if (foundry.utils.hasProperty(updateData, currentPath)) continue;
          const oldIndMax = Math.floor(oldEnd * limb.mult);
          const newIndMax = Math.floor(newEnd * limb.mult);
          const oldMax = isSquadOrHorde ? oldIndMax * oldSquadSize : oldIndMax;
          const newMax = isSquadOrHorde ? newIndMax * newSquadSize : newIndMax;
          const deltaMax = newMax - oldMax;
          if (deltaMax !== 0) {
            foundry.utils.setProperty(updateData, currentPath, limb.value + deltaMax);
          }
        }
      }
    }
    return res;
  }
}
class TAMSItem extends Item {
  /**
   * System-defined item types.
   * @type {object}
   */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      types: ["weapon", "skill", "ability", "equipment", "armor", "consumable", "tool", "questItem", "backpack", "trait"]
    }, { inplace: false });
  }
}
async function tamsHandleItemTransfer({ itemData, sourceActorUuid, targetActorUuid, newLocation }) {
  let target = await fromUuid(targetActorUuid);
  if (!target) return;
  const targetActor = target instanceof foundry.documents.BaseActor ? target : target.actor;
  if (!targetActor) return;
  const sourceActor = sourceActorUuid ? await fromUuid(sourceActorUuid) : null;
  const itemsToCreate = [];
  const itemsToDelete = [];
  const mainItemData = foundry.utils.duplicate(itemData);
  mainItemData.system.location = newLocation;
  if (mainItemData.system.equipped !== void 0) mainItemData.system.equipped = false;
  const originalId = mainItemData._id;
  delete mainItemData._id;
  itemsToCreate.push(mainItemData);
  let sourceItem = null;
  if (sourceActor && originalId) {
    sourceItem = sourceActor.items.get(originalId);
    if (sourceItem) itemsToDelete.push(sourceItem);
  }
  if (sourceItem && sourceItem.type === "backpack" && sourceItem.system.equipped) {
    const contents = sourceActor.items.filter((i) => i.system.location === "backpack" || i.system.location === sourceItem.id);
    for (let i of contents) {
      const contentData = i.toObject();
      delete contentData._id;
      contentData.system.location = "stowed";
      itemsToCreate.push(contentData);
      itemsToDelete.push(i);
    }
  }
  const created = await targetActor.createEmbeddedDocuments("Item", itemsToCreate);
  if (created.length && itemsToDelete.length) {
    const canDelete = sourceActor && sourceActor.isOwner;
    if (canDelete || game.user.isGM) {
      await sourceActor.deleteEmbeddedDocuments("Item", itemsToDelete.map((i) => i.id));
    }
  }
  return created;
}
async function tamsHandleLootDrop(data, x, y) {
  var _a, _b, _c, _d;
  let item;
  if (data.uuid) item = await fromUuid(data.uuid);
  else if (data.data) item = data.data;
  if (!item) return;
  const actorData = {
    name: `${game.i18n.localize("TAMS.Loot")}: ${item.name || ((_a = item.data) == null ? void 0 : _a.name)}`,
    type: "character",
    img: item.img || ((_b = item.data) == null ? void 0 : _b.img) || "icons/svg/item-bag.svg",
    prototypeToken: {
      name: `${game.i18n.localize("TAMS.Loot")}: ${item.name || ((_c = item.data) == null ? void 0 : _c.name)}`,
      texture: { src: item.img || ((_d = item.data) == null ? void 0 : _d.img) || "icons/svg/item-bag.svg" },
      width: 0.5,
      height: 0.5,
      actorLink: false
    },
    system: {
      settings: {
        isNPC: true,
        npcType: "individual"
      }
    },
    flags: {
      core: {
        sheetClass: "tams.TAMSLootSheet"
      }
    },
    ownership: {
      default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    }
  };
  const actor = await Actor.create(actorData);
  if (!actor) return console.error("TAMS | Failed to create loot actor.");
  const itemsToCreate = [];
  const itemsToDelete = [];
  const mainItemData = typeof item.toObject === "function" ? item.toObject() : item;
  itemsToCreate.push(mainItemData);
  if (item instanceof Item && item.actor) itemsToDelete.push(item);
  if (item instanceof Item && item.type === "backpack" && item.actor && item.system.equipped) {
    const sourceActor = item.actor;
    const backpackContents = sourceActor.items.filter((i) => i.system.location === "backpack" || i.system.location === item.id);
    for (let i of backpackContents) {
      const contentData = i.toObject();
      contentData.system.location = "stowed";
      itemsToCreate.push(contentData);
      itemsToDelete.push(i);
    }
  }
  await actor.createEmbeddedDocuments("Item", itemsToCreate);
  for (let i of itemsToDelete) {
    try {
      await i.delete();
    } catch (err) {
      console.warn(`TAMS | Failed to delete source item ${i.name} after drop on map.`, err);
    }
  }
  const tokenDocument = await actor.getTokenDocument({ x, y });
  return canvas.scene.createEmbeddedDocuments("Token", [tokenDocument.toObject()]);
}
Hooks.on("dropCanvasData", async (canvas2, data) => {
  var _a, _b;
  if (data.type !== "Item") return;
  const item = await Item.fromDropData(data);
  if (!item) return;
  const tokens = canvas2.tokens.getObjectsAt({ x: data.x, y: data.y });
  const targetToken = tokens.find((t) => {
    var _a2;
    return t.actor && t.actor.uuid !== ((_a2 = item.parent) == null ? void 0 : _a2.uuid);
  });
  if (targetToken) {
    if (targetToken.actor.isOwner) {
      return tamsHandleItemTransfer({
        itemData: item.toObject(),
        sourceActorUuid: (_a = item.parent) == null ? void 0 : _a.uuid,
        targetActorUuid: targetToken.actor.uuid,
        newLocation: "stowed"
      });
    } else {
      game.socket.emit("system.tams", {
        type: "transferItem",
        itemData: item.toObject(),
        sourceActorUuid: (_b = item.parent) == null ? void 0 : _b.uuid,
        targetActorUuid: targetToken.actor.uuid,
        newLocation: "stowed"
      });
      ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.GivingItem", { item: item.name, target: targetToken.name }));
      return false;
    }
  }
  if (!game.user.isGM) {
    game.socket.emit("system.tams", {
      type: "createLoot",
      lootData: data,
      x: data.x,
      y: data.y
    });
    ui.notifications.info(game.i18n.localize("TAMS.Checks.Notifications.RequestLootPile"));
    return;
  }
  return tamsHandleLootDrop(data, data.x, data.y);
});
const _TAMSActorSheet = class _TAMSActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @override */
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["tams", "sheet", "actor"],
      position: { width: 600, height: 800 },
      window: { resizable: true, scrollable: [".tab", ".inventory-scroll"] },
      form: { submitOnChange: true, closeOnSubmit: false },
      dragDrop: [{ dragSelector: ".item[data-item-id]", dropSelector: null }],
      actions: {
        itemCreate: _TAMSActorSheet.prototype._onItemCreate,
        itemEdit: _TAMSActorSheet.prototype._onItemEdit,
        itemDelete: _TAMSActorSheet.prototype._onItemDelete,
        roll: _TAMSActorSheet.prototype._onRoll,
        resourceAdd: _TAMSActorSheet.prototype._onResourceAdd,
        resourceDelete: _TAMSActorSheet.prototype._onResourceDelete,
        itemUseCharge: _TAMSActorSheet.prototype._onItemUseCharge,
        itemRecharge: _TAMSActorSheet.prototype._onItemRecharge,
        setTab: _TAMSActorSheet.prototype._onSetTab,
        updateItemField: _TAMSActorSheet.prototype._onUpdateItemField,
        editImage: _TAMSActorSheet.prototype._onEditImage,
        fullHeal: _TAMSActorSheet.prototype._onFullHeal,
        itemGive: _TAMSActorSheet.prototype._onItemGive,
        itemExport: _TAMSActorSheet.prototype._onItemExport,
        toggleLimbMultipliers: _TAMSActorSheet.prototype._onToggleLimbMultipliers
      }
    }, { inplace: false });
  }
  /** @override */
  get title() {
    var _a;
    const actor = this.document;
    const isUnlinkedToken = actor.isToken && !((_a = actor.token) == null ? void 0 : _a.actorLink);
    return isUnlinkedToken ? `[Token] ${actor.name}` : actor.name;
  }
  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const theme = this.document.system.theme || "default";
    this.element.classList.remove("theme-default", "theme-dark", "theme-parchment");
    this.element.classList.add(`theme-${theme}`);
    this.element.querySelectorAll('input[data-action="updateItemField"], select[data-action="updateItemField"]').forEach((el) => {
      el.addEventListener("change", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await this._onUpdateItemField(ev, ev.currentTarget);
      });
    });
  }
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    this._activeTab ?? (this._activeTab = "stats");
    context.actor = this.document;
    context.system = this.document.system;
    context.activeTab = this._activeTab;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;
    if (this._limbMultipliersCollapsed === void 0) this._limbMultipliersCollapsed = true;
    context.limbMultipliersCollapsed = this._limbMultipliersCollapsed;
    this._preparePercentages(context);
    this._prepareItemCollections(context);
    this._prepareSelectOptions(context);
    this._prepareCurrencyData(context);
    this._prepareLimbArmorOptions(context);
    return context;
  }
  /**
   * Calculate percentage values for bars and resources.
   * @param {object} context The context object to modify.
   * @protected
   */
  _preparePercentages(context) {
    const system = this.document.system;
    context.staminaPercentage = Math.clamp(system.stamina.value / (system.stamina.max || 1) * 100, 0, 100);
    context.hpPercentage = Math.clamp(system.hp.value / (system.hp.max || 1) * 100, 0, 100);
    context.capacityPercentage = Math.clamp(system.inventory.usedCapacity / (system.inventory.maxCapacity || 1) * 100, 0, 100);
    context.customResourceData = system.customResources.map((res) => {
      return {
        ...res,
        percentage: Math.clamp(res.value / (res.max || 1) * 100, 0, 100)
      };
    });
  }
  /**
   * Prepare item collections and groupings for the sheet.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareItemCollections(context) {
    const weapons = [];
    const skills = [];
    const abilities = [];
    const inventoryArmor = [];
    const inventoryConsumables = [];
    const inventoryTools = [];
    const inventoryQuestItems = [];
    const inventoryMisc = [];
    const inventoryWeapons = [];
    const inventoryBackpacks = [];
    const traits = [];
    const allItems = [];
    const hasBackpack = !!this.document.system.inventory.hasBackpack;
    for (let i of this.document.items) {
      let isGreyedOut = false;
      if (i.system.location === "backpack") {
        isGreyedOut = !hasBackpack;
      } else if (i.system.location && i.system.location !== "stowed" && i.system.location !== "hand") {
        const container2 = this.document.items.get(i.system.location);
        if (container2 && container2.type === "backpack") {
          isGreyedOut = !container2.system.equipped;
        }
      }
      const itemData = {
        id: i.id,
        uuid: i.uuid,
        name: i.name,
        img: i.img,
        system: i.system,
        type: i.type,
        isGreyedOut,
        isEquipped: i.type === "weapon" && i.system.location === "hand" || ["armor", "backpack", "shield"].includes(i.type) && i.system.equipped
      };
      allItems.push(itemData);
      if (i.type === "weapon") {
        weapons.push(itemData);
        if (i.system.location === "hand") ;
        else inventoryWeapons.push(itemData);
      } else if (i.type === "skill") skills.push(itemData);
      else if (i.type === "ability") abilities.push(itemData);
      else if (i.type === "armor" || i.type === "shield") inventoryArmor.push(itemData);
      else if (i.type === "consumable") inventoryConsumables.push(itemData);
      else if (i.type === "tool") inventoryTools.push(itemData);
      else if (i.type === "questItem") inventoryQuestItems.push(itemData);
      else if (i.type === "backpack") inventoryBackpacks.push(itemData);
      else if (i.type === "trait") traits.push(itemData);
      else if (i.type === "equipment") inventoryMisc.push(itemData);
    }
    const equippedSection = { id: "hand", label: "Equipped / In Hand", items: [], type: "status" };
    const containerSectionMap = {};
    for (const bp of inventoryBackpacks) {
      containerSectionMap[bp.id] = {
        id: bp.id,
        label: bp.name,
        items: [],
        type: "container",
        item: bp,
        isEquipped: bp.system.equipped,
        capacity: bp.system.capacity,
        modifier: bp.system.modifier
      };
    }
    const stowedSection = { id: "stowed", label: "Loose / Stowed", items: [], type: "status" };
    for (const item of allItems) {
      if (["skill", "ability", "trait"].includes(item.type)) continue;
      if (item.isEquipped && item.type !== "backpack") {
        equippedSection.items.push(item);
      } else if (item.system.location && item.system.location !== "stowed" && item.system.location !== "hand") {
        let loc = item.system.location;
        if (loc === "backpack") {
          const firstBP = inventoryBackpacks.find((bp) => bp.system.equipped);
          if (firstBP && containerSectionMap[firstBP.id]) containerSectionMap[firstBP.id].items.push(item);
          else stowedSection.items.push(item);
        } else if (containerSectionMap[loc]) {
          containerSectionMap[loc].items.push(item);
        } else {
          stowedSection.items.push(item);
        }
      } else if (item.type !== "backpack") {
        stowedSection.items.push(item);
      }
    }
    const rawSections = [equippedSection, ...Object.values(containerSectionMap), stowedSection];
    const typeLabels = { weapon: "Weapons", armor: "Armor", consumable: "Consumables", tool: "Tools", questItem: "Quest Items", equipment: "Miscellaneous" };
    const typeOrder = ["Weapons", "Armor", "Consumables", "Tools", "Quest Items", "Miscellaneous"];
    for (const s of rawSections) {
      const groups = {};
      for (const item of s.items) {
        const label = typeLabels[item.type] || "Other";
        if (!groups[label]) groups[label] = { label, items: [] };
        groups[label].items.push(item);
      }
      s.categories = Object.values(groups).sort((a, b) => {
        let indexA = typeOrder.indexOf(a.label);
        let indexB = typeOrder.indexOf(b.label);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });
    }
    context.inventorySections = rawSections.filter((s) => s.items.length > 0 || s.type === "container");
    context.weapons = weapons;
    context.inventoryWeapons = inventoryWeapons;
    context.inventoryArmor = inventoryArmor;
    context.inventoryConsumables = inventoryConsumables;
    context.inventoryTools = inventoryTools;
    context.inventoryQuestItems = inventoryQuestItems;
    context.inventoryBackpacks = inventoryBackpacks;
    context.inventoryMisc = inventoryMisc;
    context.skills = skills;
    context.abilities = abilities;
    context.traits = traits;
  }
  /**
   * Prepare options for select fields.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareSelectOptions(context) {
    context.statOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery",
      "custom": "TAMS.StatCustom"
    };
    context.themeOptions = { "default": "TAMS.ThemeDefault", "dark": "TAMS.ThemeDark", "parchment": "TAMS.ThemeParchment" };
    context.npcTypeOptions = { "individual": "TAMS.NPCTypeIndividual", "squad": "TAMS.NPCTypeSquad", "horde": "TAMS.NPCTypeHorde" };
    context.npcRankOptions = { "mook": "TAMS.NPCRankMook", "elite": "TAMS.NPCRankElite", "boss": "TAMS.NPCRankBoss" };
    context.limbOptions = {
      "none": "TAMS.CalculatorOptions.None",
      "head": "TAMS.HitLocations.Head",
      "thorax": "TAMS.HitLocations.Thorax",
      "stomach": "TAMS.HitLocations.Stomach",
      "leftArm": "TAMS.HitLocations.LeftArm",
      "rightArm": "TAMS.HitLocations.RightArm",
      "leftLeg": "TAMS.HitLocations.LeftLeg",
      "rightLeg": "TAMS.HitLocations.RightLeg"
    };
    context.sizeOptions = { "small": "TAMS.SizeOptions.Small", "medium": "TAMS.SizeOptions.Medium", "large": "TAMS.SizeOptions.Large" };
    const locationOptions = { "hand": "TAMS.LocationOptions.Hand", "stowed": "TAMS.LocationOptions.Stowed", "backpack": "TAMS.LocationOptions.BackpackLegacy" };
    for (const bp of context.inventoryBackpacks || []) {
      locationOptions[bp.id] = game.i18n.format("TAMS.LocationOptions.InContainer", { name: bp.name });
    }
    context.locationOptions = locationOptions;
  }
  /**
   * Prepare currency data and settings.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareCurrencyData(context) {
    const currencySettingsRaw = game.settings.get("tams", "currencies") || "";
    let currencyNames = [];
    try {
      if (currencySettingsRaw.trim().startsWith("[")) {
        currencyNames = JSON.parse(currencySettingsRaw).map((c) => c.name);
      } else {
        currencyNames = currencySettingsRaw.split(",").map((s) => s.trim()).filter((s) => s);
      }
    } catch (e) {
      currencyNames = currencySettingsRaw.split(",").map((s) => s.trim()).filter((s) => s);
    }
    const enabledCurrencies = this.document.system.settings.enabledCurrencies || {};
    context.allCurrencyNames = currencyNames;
    context.currencies = currencyNames.map((name) => ({
      name,
      value: this.document.system.currencies[name] || 0,
      enabled: enabledCurrencies[name] !== false
    }));
  }
  /**
   * Prepare armor options for each limb.
   * @param {object} context The context object to modify.
   * @protected
   */
  _prepareLimbArmorOptions(context) {
    var _a;
    const armorItems = this.document.items.filter((i) => i.type === "armor");
    context.limbArmorOptions = {};
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const limbKey of limbKeys) {
      context.limbArmorOptions[limbKey] = { "": "None" };
      for (const armor of armorItems) {
        if (((_a = armor.system.limbs[limbKey]) == null ? void 0 : _a.max) > 0) {
          context.limbArmorOptions[limbKey][armor.id] = armor.name;
        }
      }
    }
    context.inventory = {
      ...this.document.system.inventory,
      usedMedium: (this.document.system.inventory.usedCapacity / 10).toFixed(1).replace(/\.0$/, ""),
      maxMedium: (this.document.system.inventory.maxCapacity / 10).toFixed(1).replace(/\.0$/, "")
    };
  }
  /**
   * Handle creating a new item on the actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemCreate(event, target) {
    const type = target.dataset.type;
    const itemData = {
      name: `New ${type.capitalize()}`,
      type
    };
    try {
      return await this.document.createEmbeddedDocuments("Item", [itemData]);
    } catch (err) {
      console.error(`TAMS | Failed to create item:`, err);
      ui.notifications.error(game.i18n.format("TAMS.Checks.Notifications.ItemCreationFailed", { type }));
      throw err;
    }
  }
  /**
   * Handle editing an existing item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemEdit(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (item) item.sheet.render(true);
  }
  /**
   * Handle deleting an existing item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemDelete(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    if (event.shiftKey) {
      return item.delete();
    }
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("TAMS.DeleteConfirmTitle"),
      content: game.i18n.format("TAMS.DeleteConfirmContent", { name: item.name }),
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
    if (confirmed) {
      item.delete();
    }
  }
  /**
   * Handle giving an item to another actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemGive(event, target) {
    var _a, _b;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    const tokens = canvas.tokens.placeables.filter((t) => t.actor && t.actor.id !== this.document.id && t.actor.type === "character");
    if (tokens.length === 0) {
      return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoCharactersFound"));
    }
    const myToken = ((_b = this.document.token) == null ? void 0 : _b.object) || canvas.tokens.controlled.find((t) => {
      var _a2;
      return ((_a2 = t.actor) == null ? void 0 : _a2.id) === this.document.id;
    });
    if (myToken) {
      tokens.sort((a, b) => {
        const distA = canvas.grid.measureDistance(myToken.center, a.center);
        const distB = canvas.grid.measureDistance(myToken.center, b.center);
        return distA - distB;
      });
    }
    const options = tokens.map((t) => `<option value="${t.actor.uuid}">${t.name}${t.actor.isToken ? ` (${game.i18n.localize("TAMS.Loot")})` : ""}</option>`).join("");
    const content = `
        <div class="form-group">
            <p>${game.i18n.localize("TAMS.GiveItem")}: <b>${item.name}</b></p>
            <label>${game.i18n.localize("TAMS.Recipient")}</label>
            <select name="recipientUuid" style="width: 100%; margin-bottom: 10px;">
                ${options}
            </select>
        </div>
    `;
    new Dialog({
      title: `${game.i18n.localize("TAMS.GiveItem")}: ${item.name}`,
      content,
      buttons: {
        give: {
          icon: '<i class="fas fa-gift"></i>',
          label: game.i18n.localize("TAMS.Give"),
          callback: async (html) => {
            const recipientUuid = html.find('[name="recipientUuid"]').val();
            const targetActor = await fromUuid(recipientUuid);
            if (!targetActor) return;
            if (targetActor.isOwner) {
              tamsHandleItemTransfer({
                itemData: item.toObject(),
                sourceActorUuid: this.document.uuid,
                targetActorUuid: recipientUuid,
                newLocation: "stowed"
              });
            } else {
              game.socket.emit("system.tams", {
                type: "transferItem",
                itemData: item.toObject(),
                sourceActorUuid: this.document.uuid,
                targetActorUuid: recipientUuid,
                newLocation: "stowed"
              });
              ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.GivingItem", { item: item.name, target: targetActor.name }));
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("TAMS.Cancel")
        }
      },
      default: "give"
    }).render(true);
  }
  /**
   * Handle exporting an item to the sidebar.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemExport(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    if (!game.user.can("ITEM_CREATE")) {
      return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoSidebarPermission"));
    }
    const itemData = item.toObject();
    delete itemData._id;
    delete itemData.folder;
    if (itemData.system.location) itemData.system.location = "stowed";
    if (itemData.system.equipped !== void 0) itemData.system.equipped = false;
    try {
      await Item.create(itemData);
      ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.ItemExported", { item: item.name }));
    } catch (err) {
      console.error("TAMS | Export failed", err);
      ui.notifications.error(game.i18n.format("TAMS.Checks.Notifications.ItemExportFailed", { item: item.name }));
    }
  }
  /**
   * Handle using a charge from an item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemUseCharge(event, target) {
    var _a;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    let { value, max } = item.system.uses || { value: 0, max: 0 };
    let quantity = item.system.quantity;
    if (value > 0) {
      value -= 1;
    } else if (quantity > 0) {
      quantity -= 1;
      value = Math.max(0, max - 1);
    } else {
      ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoChargesLeft", { item: item.name }));
      return;
    }
    await item.update({
      "system.uses.value": value,
      "system.quantity": quantity
    });
  }
  /**
   * Handle recharging an item using resources.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onItemRecharge(event, target) {
    var _a, _b;
    const itemId = target.dataset.itemId || ((_a = target.closest(".item")) == null ? void 0 : _a.dataset.itemId);
    const item = this.document.items.get(itemId);
    if (!item) return;
    const { value, max } = item.system.uses || { value: 0, max: 0 };
    const cost = item.system.cost || 0;
    const resourceId = item.system.resource;
    const isApex = item.system.isApex;
    const doRecharge = async (amount) => {
      amount = parseInt(amount) || 0;
      if (amount <= 0) return;
      const actualAmount = Math.min(amount, max - value);
      if (actualAmount <= 0) return;
      if (!isApex && cost > 0) {
        const totalCost = actualAmount * cost;
        const actor = this.document;
        if (resourceId === "stamina") {
          if (actor.system.stamina.value < totalCost) {
            ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughStaminaRecharge", { item: item.name, cost: totalCost, current: actor.system.stamina.value }));
            return;
          }
          await actor.update({ "system.stamina.value": actor.system.stamina.value - totalCost });
        } else {
          const resIndex = parseInt(resourceId);
          if (!isNaN(resIndex) && actor.system.customResources[resIndex]) {
            const res = actor.system.customResources[resIndex];
            if (res.value < totalCost) {
              ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResourceRecharge", { resource: res.name, item: item.name, cost: totalCost, current: res.value }));
              return;
            }
            await actor.update({ [`system.customResources.${resIndex}.value`]: res.value - totalCost });
          }
        }
      }
      await item.update({ "system.uses.value": value + actualAmount });
    };
    if (event.shiftKey) {
      return doRecharge(max - value);
    }
    const resourceName = resourceId === "stamina" ? game.i18n.localize("TAMS.Stamina") : ((_b = this.document.system.customResources[parseInt(resourceId)]) == null ? void 0 : _b.name) || game.i18n.localize("TAMS.Resource");
    const costInfo = !isApex && cost > 0 ? `<p style="margin: 5px 0;">${game.i18n.format("TAMS.RechargeCostPerCharge", { cost, resource: resourceName })}</p>` : "";
    const content = `
      <div class="form-group">
        <label>${game.i18n.localize("TAMS.RechargeContent")}</label>
        <input type="number" name="amount" value="${max - value}" min="0" max="${max - value}"/>
      </div>
      ${costInfo}
    `;
    new Dialog({
      title: game.i18n.format("TAMS.RechargeTitle", { name: item.name }),
      content,
      buttons: {
        recharge: {
          icon: '<i class="fas fa-bolt"></i>',
          label: game.i18n.localize("TAMS.Recharge"),
          callback: (html) => {
            const amount = html.find('[name="amount"]').val();
            doRecharge(amount);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("TAMS.Cancel")
        }
      },
      default: "recharge"
    }).render(true);
  }
  /**
   * Handle updating an item's field directly from the sheet.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onUpdateItemField(event, target) {
    const itemId = target.dataset.itemId;
    const field = target.dataset.field;
    let value = target.value;
    if (target.type === "number") value = parseFloat(value);
    if (target.type === "checkbox") value = target.checked;
    const item = this.document.items.get(itemId);
    if (item) await item.update({ [field]: value });
  }
  /**
   * Handle changing the actor or item image.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onEditImage(event, target) {
    const attr = target.dataset.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      type: "image",
      current,
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }
  /**
   * Handle fully healing the actor.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onFullHeal(event, target) {
    const updates = {};
    const limbKeys = ["head", "thorax", "stomach", "leftArm", "rightArm", "leftLeg", "rightLeg"];
    for (const id of limbKeys) {
      const limb = this.document.system.limbs[id];
      if (!limb) continue;
      updates[`system.limbs.${id}.value`] = limb.max;
      updates[`system.limbs.${id}.injured`] = false;
      updates[`system.limbs.${id}.criticallyInjured`] = false;
    }
    await this.document.update(updates);
    ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.ActorFullyHealed", { name: this.document.name }));
  }
  /** @override */
  async _onDrop(event) {
    var _a, _b, _c;
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return super._onDrop(event);
    const item = await Item.fromDropData(data);
    if (!item) return;
    const targetEl = event.target.closest(".item[data-item-id], .inventory-section[data-section-id]");
    let newLocation = "";
    if (targetEl) {
      const targetSectionId = targetEl.dataset.sectionId;
      const targetItemId = targetEl.dataset.itemId;
      if (targetSectionId) {
        if (targetSectionId === "hand") newLocation = "hand";
        else if (targetSectionId === "stowed") newLocation = "stowed";
        else newLocation = targetSectionId;
      } else if (targetItemId) {
        const targetItem = this.document.items.get(targetItemId);
        if ((targetItem == null ? void 0 : targetItem.type) === "backpack" && item.id !== targetItem.id) {
          newLocation = targetItem.id;
        } else if (targetItem) {
          newLocation = targetItem.system.location || "stowed";
        }
      }
    }
    const isSameActor = ((_a = item.parent) == null ? void 0 : _a.uuid) === this.document.uuid;
    if (isSameActor) {
      await item.update({ "system.location": newLocation });
      return;
    }
    if (!this.document.isOwner) {
      game.socket.emit("system.tams", {
        type: "transferItem",
        itemData: item.toObject(),
        sourceActorUuid: (_b = item.parent) == null ? void 0 : _b.uuid,
        targetActorUuid: this.document.uuid,
        newLocation
      });
      ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.RequestTransfer", { item: item.name, name: this.document.name }));
      return;
    }
    return tamsHandleItemTransfer({
      itemData: item.toObject(),
      sourceActorUuid: (_c = item.parent) == null ? void 0 : _c.uuid,
      targetActorUuid: this.document.uuid,
      newLocation
    });
  }
  /** @override */
  _onDragStart(event) {
    const li = event.currentTarget;
    if (event.target.classList.contains("content-link")) return;
    const itemId = li.dataset.itemId;
    const item = this.document.items.get(itemId);
    if (item) {
      const dragData = item.toDragData();
      if (dragData) {
        const jsonData = JSON.stringify(dragData);
        event.dataTransfer.setData("text/plain", jsonData);
        event.dataTransfer.setData("application/json", jsonData);
        return;
      }
    }
    return super._onDragStart(event);
  }
  /**
   * Handle rolling a stat or skill check.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onRoll(event, target) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const dataset = target.dataset;
    const item = dataset.itemId ? this.document.items.get(dataset.itemId) : null;
    const tToken = [...((_a = game == null ? void 0 : game.user) == null ? void 0 : _a.targets) ?? []][0] ?? null;
    const tName = (tToken == null ? void 0 : tToken.name) ?? null;
    ((_b = tToken == null ? void 0 : tToken.actor) == null ? void 0 : _b.id) ?? null;
    (tToken == null ? void 0 : tToken.id) ?? null;
    let label = dataset.label || "";
    if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
      if (tName) label = `${label} -> ${tName}`;
    }
    let statValue = isNaN(parseInt(dataset.statValue)) ? 0 : parseInt(dataset.statValue);
    let statMod = (parseInt(dataset.statMod) || 0) + (parseInt(dataset.traitBonus) || 0);
    let familiarity = parseInt(dataset.familiarity) || 0;
    let bonus = 0;
    let statId = dataset.statId;
    const bonusSources = [];
    const statModSources = [];
    const traits = this.document.items.filter((i) => i.type === "trait");
    const addStatModSources = (sId) => {
      statModSources.length = 0;
      const s = this.document.system.stats[sId];
      if (!s) return;
      if (s.mod !== 0) statModSources.push({ label: game.i18n.localize("TAMS.StatMod"), value: s.mod });
      for (const trait of traits) {
        const val = trait.system.modifiers.filter((m) => m.target === `stats.${sId}`).reduce((acc, m) => acc + m.value, 0);
        if (val !== 0) statModSources.push({ label: trait.name, value: val });
      }
      const backpackPen2 = this.document.system.backpackPenalties;
      if (backpackPen2 && (sId === "strength" || sId === "dexterity")) {
        const val = backpackPen2[sId];
        if (val !== 0) statModSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: val });
      }
    };
    const traitRollBonus = this.document.system.traitRollBonus || 0;
    if (traitRollBonus !== 0) {
      bonus += traitRollBonus;
      for (const trait of traits) {
        const val = trait.system.modifiers.filter((m) => m.target === "allRolls").reduce((acc, m) => acc + m.value, 0);
        if (val !== 0) bonusSources.push({ label: trait.name, value: val });
      }
    }
    if (item && item.system.tags) {
      const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
      for (const trait of traits) {
        if (trait.system.isProfession && trait.system.profession) {
          const prof = trait.system.profession.trim().toLowerCase();
          if (tags.includes(prof)) {
            const val = trait.system.modifiers.filter((m) => m.target === "allProfessionRolls").reduce((acc, m) => acc + m.value, 0);
            if (val !== 0) {
              bonus += val;
              bonusSources.push({ label: `${trait.name} (${trait.system.profession})`, value: val });
            }
          }
        }
      }
    }
    if (item && item.system.tags) {
      const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
      if (tags.includes("accurate")) {
        bonus += 5;
        bonusSources.push({ label: game.i18n.localize("TAMS.WeaponTags.Accurate"), value: 5 });
      }
    }
    if (!item && statId === "dodge") {
      const dex = this.document.system.stats.dexterity;
      familiarity = 0;
      bonus = 0;
      statValue = dex.value;
      statMod = dex.mod;
      addStatModSources("dexterity");
    } else if (!item && statId) {
      addStatModSources(statId);
    }
    if (!item) {
      if (statId !== "dodge") familiarity = 0;
    }
    if (item && item.type === "weapon") {
      this.document.system.stats.strength;
      this.document.system.stats.dexterity;
      let usesDex = false;
      if (item.system.attackStat && item.system.attackStat !== "default") {
        statId = item.system.attackStat;
      } else {
        if (item.system.isRanged) {
          usesDex = !item.system.isThrown;
        } else {
          usesDex = !!item.system.isLight;
        }
        statId = usesDex ? "dexterity" : "strength";
      }
      const stat = this.document.system.stats[statId];
      statValue = stat.value;
      addStatModSources(statId);
      statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
      label = `Attacking with ${item.name}`;
    }
    if (item && item.type === "skill") {
      const name = item.name;
      label = name;
      statId = item.system.stat;
      const itemBonus = parseInt(item.system.bonus) || 0;
      if (itemBonus !== 0) {
        bonus += itemBonus;
        bonusSources.push({ label: game.i18n.localize("TAMS.ItemBonus"), value: itemBonus });
      }
      addStatModSources(statId);
      const stat = this.document.system.stats[statId];
      statValue = stat ? stat.value : 0;
      statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
      if (name.includes("(") && name.includes(")")) {
        const confirmed = await new Promise((resolve) => {
          new Dialog({
            title: game.i18n.localize("TAMS.SkillCheckTitle"),
            content: `<p>${game.i18n.format("TAMS.SkillCheckSpecificPrompt", { name })}</p>`,
            buttons: {
              yes: { label: game.i18n.localize("TAMS.YesFullFam"), callback: () => resolve(true) },
              no: { label: game.i18n.localize("TAMS.NoHalfFam"), callback: () => resolve(false) }
            },
            default: "yes"
          }).render(true);
        });
        if (!confirmed) familiarity = Math.floor(familiarity / 2);
      }
    }
    if (item && item.type === "ability") {
      familiarity = parseInt(item.system.familiarity) || 0;
      const itemBonus = parseInt(item.system.bonus) || 0;
      if (itemBonus !== 0) {
        bonus += itemBonus;
        bonusSources.push({ label: game.i18n.localize("TAMS.ItemBonus"), value: itemBonus });
      }
      if (item.system.isAttack) {
        statId = item.system.attackStat;
        addStatModSources(statId);
        const stat = this.document.system.stats[statId];
        statValue = stat ? stat.value : 0;
        statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
        label = game.i18n.format("TAMS.UsingAbilityLabel", { name: item.name });
      } else {
        statId = item.system.capStat || "strength";
        addStatModSources(statId);
        const stat = this.document.system.stats[statId];
        statValue = stat ? stat.value : 0;
        statMod = statModSources.reduce((acc, s) => acc + s.value, 0);
      }
      const cost = ((_c = item.system.calculator) == null ? void 0 : _c.enabled) ? item.system.calculatedCost : parseInt(item.system.cost) || 0;
      const usesMax = parseInt(item.system.uses.max) || 0;
      const usesVal = parseInt(item.system.uses.value) || 0;
      const isLimited = usesMax > 0;
      if (event.shiftKey && isLimited) {
        const missing = usesMax - usesVal;
        const actor = this.document;
        const resources = [{ id: "stamina", name: "Stamina", value: actor.system.stamina.value }];
        actor.system.customResources.forEach((res, idx) => {
          resources.push({ id: idx.toString(), name: res.name, value: res.value });
        });
        const resourceKey = item.system.resource;
        const options = resources.map((r) => `<option value="${r.id}" ${r.id === resourceKey ? "selected" : ""}>${r.name} (${r.value} ${game.i18n.localize("TAMS.AvailableShort")})</option>`).join("");
        new Dialog({
          title: game.i18n.format("TAMS.RefillUses", { name: item.name }),
          content: `
                    <div class="form-group">
                        <label>${game.i18n.format("TAMS.AmountToRefill", { max: missing })}</label>
                        <input type="number" id="refill-amount" value="${missing}" min="1" max="${missing}"/>
                    </div>
                    <div class="form-group">
                        <label>${game.i18n.localize("TAMS.ResourceToSpendLabel")}</label>
                        <select id="refill-resource">${options}</select>
                    </div>
                    <p>${game.i18n.format("TAMS.CostPerUse", { cost })}</p>
                    <p><i>${game.i18n.localize("TAMS.CostMultiplierHint")}</i></p>
                `,
          buttons: {
            refill: {
              label: game.i18n.localize("TAMS.Refill"),
              callback: async (html) => {
                const amount = parseInt(html.find("#refill-amount").val()) || 0;
                const resId = html.find("#refill-resource").val();
                if (amount <= 0) return;
                const totalCost = amount * cost;
                const res = resources.find((r) => r.id === resId);
                if (res.value < totalCost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughToBoost"));
                if (resId === "stamina") {
                  await actor.update({ "system.stamina.value": res.value - totalCost });
                } else {
                  const idx = parseInt(resId);
                  const customResources = foundry.utils.duplicate(actor.system.customResources);
                  customResources[idx].value -= totalCost;
                  await actor.update({ "system.customResources": customResources });
                }
                await item.update({ "system.uses.value": usesVal + amount });
                ui.notifications.info(game.i18n.format("TAMS.Checks.Notifications.RefilledUses", { amount, item: item.name }));
              }
            },
            cancel: { label: game.i18n.localize("TAMS.Cancel") }
          },
          default: "refill"
        }).render(true);
        return;
      }
      if (isLimited) {
        if (usesVal <= 0) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NoUsesLeft"));
        await item.update({ "system.uses.value": usesVal - 1 });
      } else if (!item.system.isApex && cost > 0) {
        const resourceKey = item.system.resource;
        if (resourceKey === "stamina") {
          const current = this.document.system.stamina.value;
          if (current < cost) return ui.notifications.warn(game.i18n.localize("TAMS.Checks.Notifications.NotEnoughStamina"));
          await this.document.update({ "system.stamina.value": current - cost });
        } else {
          const idx = parseInt(resourceKey);
          const res = this.document.system.customResources[idx];
          if (res) {
            if (res.value < cost) {
              const remaining = cost - res.value;
              const stamina = this.document.system.stamina.value;
              if (stamina < remaining) return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NotEnoughResOrStamina", { resource: res.name }));
              const useBoth = await new Promise((resolve) => {
                new Dialog({
                  title: "Insufficient Resources",
                  content: `<p>You only have ${res.value} ${res.name}. Spend ${res.value} ${res.name} and ${remaining} Stamina to use this ability?</p>`,
                  buttons: {
                    yes: { label: "Yes", callback: () => resolve(true) },
                    no: { label: "No", callback: () => resolve(false) }
                  },
                  default: "yes",
                  close: () => resolve(false)
                }).render(true);
              });
              if (!useBoth) return;
              const resources = foundry.utils.duplicate(this.document.system.customResources);
              resources[idx].value = 0;
              await this.document.update({
                "system.customResources": resources,
                "system.stamina.value": stamina - remaining
              });
            } else {
              const resources = foundry.utils.duplicate(this.document.system.customResources);
              resources[idx].value -= cost;
              await this.document.update({ "system.customResources": resources });
            }
          }
        }
      }
    }
    let difficulty = 0;
    if (event.shiftKey) {
      difficulty = await new Promise((resolve) => {
        new Dialog({
          title: "Roll Parameters",
          content: `<div class="form-group"><label>Difficulty / Target Result</label><input type="number" id="diff" value="0"/></div>`,
          buttons: {
            roll: { label: "Roll", callback: (html) => resolve(parseInt(html.find("#diff").val()) || 0) }
          },
          default: "roll"
        }).render(true);
      });
    }
    const roll = await new Roll("1d100").evaluate();
    let rawResult = roll.total;
    let originalResult = rawResult;
    let rerolled = false;
    let isJammed = false;
    if (item && item.system.tags) {
      const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
      if (tags.includes("reliable") && rawResult <= 4) {
        const reroll = await new Roll("1d100").evaluate();
        rawResult = reroll.total;
        rerolled = true;
      }
      if (tags.includes("unreliable") && rawResult <= 4) {
        isJammed = true;
      }
    }
    const effectiveStat = statValue + statMod;
    const cappedResult = Math.min(rawResult, effectiveStat);
    const backpackPen = this.document.system.backpackPenalties;
    if (backpackPen) {
      if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
        const pen = backpackPen.attack || 0;
        if (pen !== 0) {
          bonus += pen;
          bonusSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: pen });
        }
      }
      if (statId === "dodge") {
        const pen = backpackPen.dodge || 0;
        if (pen !== 0) {
          bonus += pen;
          bonusSources.push({ label: game.i18n.localize("TAMS.BackpackPenalty"), value: pen });
        }
      }
    }
    const settings = this.document.system.settings;
    const isSquadOrHorde = settings.isNPC && (settings.npcType === "squad" || settings.npcType === "horde");
    const squadSize = settings.squadSize || 1;
    let squadBonus = 0;
    let maxSquadTargets = 1;
    if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
      item.type === "weapon" ? !!item.system.isRanged : ((_d = item.system.calculator) == null ? void 0 : _d.range) > 10;
      if (isSquadOrHorde) {
        maxSquadTargets = squadSize;
        maxSquadTargets = Math.max(1, maxSquadTargets);
        const actualTargets = [...game.user.targets].slice(0, maxSquadTargets);
        const numTargetsCount = actualTargets.length > 0 ? actualTargets.length : tToken ? 1 : 0;
        if (numTargetsCount > 0 && numTargetsCount < maxSquadTargets) {
          squadBonus = (maxSquadTargets - numTargetsCount) * 5;
        }
      }
    }
    const finalTotal = cappedResult + familiarity + bonus + squadBonus;
    let dcTotal = finalTotal;
    let critInfo = "";
    let success = true;
    let resultText = "";
    let resultClass = "";
    if (isJammed) {
      success = false;
      resultText = "JAMMED";
      resultClass = "failure";
      critInfo = `<div class="tams-crit failure">${game.i18n.localize("TAMS.Checks.Jammed")}</div>`;
    } else if (statId === "bravery") {
      const targetValue = effectiveStat + familiarity + bonus;
      success = rawResult <= targetValue;
      resultText = success ? "SUCCESS" : "FAILURE";
      resultClass = success ? "success" : "failure";
      critInfo = `<div class="tams-crit ${resultClass}">${resultText}</div>`;
    } else if (difficulty > 0) {
      const actor = this.document;
      const canBoost = actor.type === "character";
      if (dcTotal >= difficulty * 2) {
        critInfo = `<div class="tams-crit success">${game.i18n.format("TAMS.CritSuccess", { total: dcTotal, difficulty })}</div>`;
      } else if (dcTotal >= difficulty) {
        critInfo = `<div class="tams-success">${game.i18n.format("TAMS.SuccessVsDiff", { difficulty })}</div>`;
      } else {
        critInfo = `
                <div class="tams-failure">${game.i18n.format("TAMS.FailureVsDiff", { difficulty })}</div>
                <div class="roll-boost-container"></div>
                ${canBoost ? `
                    <div class="roll-row">
                        <button class="tams-boost-roll" 
                                data-difficulty="${difficulty}" 
                                data-total="${dcTotal}" 
                                data-actor-uuid="${actor.uuid}"
                                data-actor-id="${actor.id}">
                            ${game.i18n.localize("TAMS.Checks.SpendResourceToBoost")}
                        </button>
                    </div>
                ` : ""}
            `;
      }
    }
    let damageInfo = "";
    if (item && (item.type === "weapon" || item.type === "ability" && item.system.isAttack)) {
      let damage = item.system.calculatedDamage;
      const isRanged = item.type === "weapon" ? !!item.system.isRanged : ((_e = item.system.calculator) == null ? void 0 : _e.range) > 10;
      const isCrit = difficulty > 0 && dcTotal >= difficulty * 2;
      let forceCrit = false;
      if (item && item.system.tags) {
        const tags = item.system.tags.split(",").map((t) => t.trim().toLowerCase());
        if (isCrit && tags.includes("vicious")) {
          damage = Math.floor(damage * 1.5);
        }
        if (tags.includes("brutal")) {
          forceCrit = true;
        }
      }
      let multiVal = 1;
      if (item.type === "weapon") {
        if (item.system.fireRate === "3") multiVal = 3;
        else if (item.system.fireRate === "auto") multiVal = 10;
        else if (item.system.fireRate === "custom") multiVal = item.system.fireRateCustom || 1;
        if (item.system.consumeAmmo) {
          const currentAmmo = ((_f = item.system.ammo) == null ? void 0 : _f.current) || 0;
          if (currentAmmo < multiVal) {
            if (currentAmmo <= 0) {
              return ui.notifications.warn(game.i18n.format("TAMS.Checks.Notifications.NoChargesLeft", { item: item.name }));
            }
            ui.notifications.info(game.i18n.format("TAMS.Checks.NotEnoughAmmo", { count: currentAmmo }));
            multiVal = currentAmmo;
          }
          await item.update({ "system.ammo.current": Math.max(0, currentAmmo - multiVal) });
        }
      } else if (item.type === "ability") {
        multiVal = item.system.multiAttack || 1;
      }
      const targetLimb = item.type === "ability" && ((_g = item.system.calculator) == null ? void 0 : _g.enabled) ? item.system.calculator.targetLimb : "none";
      let armourPen = 0;
      if (item.type === "weapon" && item.system.hasArmourPen) {
        armourPen = item.system.armourPenetration || 0;
      } else if (item.type === "ability") {
        armourPen = item.system.armourPenetration || 0;
      }
      const isAoE = !!item.system.isAoE || ((_h = item.system.calculator) == null ? void 0 : _h.enabled) && (item.system.calculator.aoeRadius > 0 || item.system.calculator.targetType === "aoe");
      let targets = isAoE ? [...game.user.targets] : tToken ? [tToken] : [];
      if (isSquadOrHorde) {
        targets = [...game.user.targets].slice(0, maxSquadTargets);
        if (targets.length === 0 && tToken) targets = [tToken];
      }
      if (targets.length > 0) {
        let hitLocation;
        if (item.type === "ability" && ((_i = item.system.calculator) == null ? void 0 : _i.enabled) && ((_j = item.system.calculator) == null ? void 0 : _j.targetLimb) && item.system.calculator.targetLimb !== "none") {
          const limbKey = item.system.calculator.targetLimb;
          const limbOptions = {
            "head": "Head",
            "thorax": "Thorax",
            "stomach": "Stomach",
            "leftArm": "Left Arm",
            "rightArm": "Right Arm",
            "leftLeg": "Left Leg",
            "rightLeg": "Right Leg"
          };
          hitLocation = limbOptions[limbKey] || "Thorax";
        } else {
          hitLocation = await getHitLocation(rawResult);
        }
        const pcs = targets.filter((t) => {
          var _a2, _b2, _c2;
          return !((_c2 = (_b2 = (_a2 = t.actor) == null ? void 0 : _a2.system) == null ? void 0 : _b2.settings) == null ? void 0 : _c2.isNPC);
        });
        const npcs = targets.filter((t) => {
          var _a2, _b2, _c2;
          return !!((_c2 = (_b2 = (_a2 = t.actor) == null ? void 0 : _a2.system) == null ? void 0 : _b2.settings) == null ? void 0 : _c2.isNPC);
        });
        damageInfo = `<div class="tams-targets-container">`;
        for (const targetToken of pcs) {
          const targetActor = targetToken.actor;
          const targetName = targetToken.name;
          const targetTokenId = targetToken.id;
          const targetActorId = targetActor == null ? void 0 : targetActor.id;
          const tHits = [];
          for (let i = 0; i < multiVal; i++) {
            tHits.push(i === 0 && !isAoE ? hitLocation : await getHitLocation());
          }
          damageInfo += `
                    <div class="tams-target-block" style="border: 1px solid #7a7971; padding: 5px; margin-bottom: 5px; background: rgba(0,0,0,0.05);">
                        <div class="roll-row"><span>Target:</span><span class="roll-value">${targetName}</span></div>
                        <div class="roll-row"><b>Damage: ${damage}</b></div>
                        <div class="roll-row"><b>Hit Locations: ${tHits.join(", ")}</b></div>
                        <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
                        <div class="roll-row" style="gap:6px; flex-wrap: wrap;">
                          <button class="tams-take-damage" 
                                  data-damage="${damage}" 
                                  data-armour-pen="${armourPen}" 
                                  data-locations='${JSON.stringify(tHits)}' 
                                  data-target-limb="${targetLimb}"
                                  data-is-aoe="${isAoE ? "1" : "0"}"
                                  data-force-crit="${forceCrit ? "1" : "0"}"
                                  data-target-token-id="${targetTokenId || ""}"
                                  data-target-actor-id="${targetActorId || ""}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}">Apply Damage</button>
                          <button class="tams-dodge" 
                                  data-raw="${rawResult}" 
                                  data-total="${finalTotal}" 
                                  data-multi="${multiVal}" 
                                  data-location="${hitLocation}" 
                                  data-damage="${damage}" 
                                  data-armour-pen="${armourPen}" 
                                  data-is-ranged="${isRanged ? "1" : "0"}" 
                                  data-is-aoe="${isAoE ? "1" : "0"}"
                                  data-target-limb="${targetLimb}"
                                  data-target-token-id="${targetTokenId || ""}"
                                  data-target-actor-id="${targetActorId || ""}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}">Dodge</button>
                          <button class="tams-retaliate" 
                                  data-raw="${rawResult}" 
                                  data-total="${finalTotal}" 
                                  data-multi="${multiVal}" 
                                  data-location="${hitLocation}" 
                                  data-damage="${damage}" 
                                  data-armour-pen="${armourPen}" 
                                  data-is-ranged="${isRanged ? "1" : "0"}" 
                                  data-is-aoe="${isAoE ? "1" : "0"}"
                                  data-target-limb="${targetLimb}"
                                  data-target-token-id="${targetTokenId || ""}"
                                  data-target-actor-id="${targetActorId || ""}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}">Retaliate</button>
                          <button class="tams-block"
                                  data-raw="${rawResult}"
                                  data-total="${finalTotal}"
                                  data-multi="${multiVal}"
                                  data-locations='${JSON.stringify(tHits)}'
                                  data-damage="${damage}"
                                  data-armour-pen="${armourPen}"
                                  data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}">Block</button>
                          <button class="tams-behind-toggle" style="background: #444; color: white;">Behind</button>
                          <button class="tams-unaware-toggle" style="background: #444; color: white;">Unaware</button>
                        </div>
                    </div>
                `;
        }
        if (npcs.length > 0) {
          damageInfo += `
            <div class="tams-npc-group" style="border: 1px solid #7a7971; padding: 5px; margin-top: 5px; background: rgba(0,0,0,0.1);">
                <div class="roll-row" style="border-bottom: 1px solid #7a7971; margin-bottom: 3px;"><b>--- NPCs ---</b></div>
                <div class="tams-npc-list" style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px;">
        `;
          for (const targetToken of npcs) {
            const targetActor = targetToken.actor;
            const targetName = targetToken.name;
            const targetTokenId = targetToken.id;
            const targetActorId = targetActor == null ? void 0 : targetActor.id;
            const tHits = [];
            for (let i = 0; i < multiVal; i++) {
              tHits.push(i === 0 && !isAoE ? hitLocation : await getHitLocation());
            }
            damageInfo += `
                <div class="tams-npc-row" style="display: flex; flex-direction: column; background: rgba(255,255,255,0.2); padding: 2px 4px; border-radius: 2px; margin-bottom: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;" title="${targetName}">${targetName}</span>
                        <div class="tams-npc-buttons" style="display: flex; gap: 2px;">
                            <button class="tams-take-damage" title="Apply Damage"
                                    data-damage="${damage}" data-armour-pen="${armourPen}" data-locations='${JSON.stringify(tHits)}' data-target-limb="${targetLimb}"
                                    data-is-aoe="${isAoE ? "1" : "0"}"
                                    data-target-token-id="${targetTokenId || ""}" data-target-actor-id="${targetActorId || ""}" 
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">A</button>
                            <button class="tams-dodge" title="Dodge"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isAoE ? "1" : "0"}" data-target-limb="${targetLimb}"
                                    data-target-token-id="${targetTokenId || ""}" data-target-actor-id="${targetActorId || ""}"
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">D</button>
                            <button class="tams-retaliate" title="Retaliate"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${damage}" data-armour-pen="${armourPen}" data-is-ranged="${isRanged ? "1" : "0"}" data-is-aoe="${isAoE ? "1" : "0"}" data-target-limb="${targetLimb}"
                                    data-target-token-id="${targetTokenId || ""}" data-target-actor-id="${targetActorId || ""}"
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">R</button>
                            <button class="tams-block" title="Block"
                                    data-raw="${rawResult}" data-total="${finalTotal}" data-multi="${multiVal}" data-locations='${JSON.stringify(tHits)}' data-damage="${damage}" data-armour-pen="${armourPen}"
                                    data-target-actor-uuid="${(targetActor == null ? void 0 : targetActor.uuid) || ""}"
                                    style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px;">Sh</button>
                            <button class="tams-behind-toggle" title="Behind" style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px; background: #444; color: white;">B</button>
                            <button class="tams-unaware-toggle" title="Unaware" style="padding: 0 5px; line-height: 1.4; font-size: 0.8em; min-width: 24px; background: #444; color: white;">U</button>
                        </div>
                    </div>
                    <div style="font-size: 0.75em; color: #555;">Locs: ${tHits.join(", ")}</div>
                </div>
            `;
          }
          damageInfo += `</div></div>`;
        }
        damageInfo += `</div>`;
      } else {
        damageInfo = `
                <div class="roll-row"><b>Damage: ${damage}</b></div>
                <div class="roll-row"><b>Max Hits: ${multiVal}</b></div>
                <p><small>No tokens targeted.</small></p>
            `;
      }
    }
    const descriptionHtml = item && (item.type === "ability" || item.type === "skill") && item.system.description ? `<div class="roll-description">${item.system.description}</div>` : "";
    let ifButtonHtml = "";
    if (item && item.type === "ability" && item.system.ifStatement && item.system.ifCost) {
      const ifStatement = item.system.ifStatement;
      const ifCost = item.system.ifCost;
      const ifResource = item.system.resource || "stamina";
      ifButtonHtml = `
            <div class="roll-row" style="margin-top: 5px;">
                <button class="tams-apply-if-cost" 
                        data-cost="${ifCost}" 
                        data-resource="${ifResource}"
                        data-actor-uuid="${this.document.uuid}"
                        data-label="${ifStatement}">
                    ${game.i18n.format("TAMS.ApplyIFCost", { cost: ifCost })}
                </button>
            </div>
            <div class="roll-row-detail" style="margin-bottom: 5px;"><small>${ifStatement}</small></div>
        `;
    }
    const messageContent = `
      <div class="tams-roll">
        <h3 class="roll-label">${label}</h3>
        ${descriptionHtml}
        ${ifButtonHtml}
        ${damageInfo}
        ${rerolled ? `<div class="roll-row reliable-reroll" style="color: #2c3e50; font-style: italic; font-size: 0.9em; margin-bottom: 4px;">
            ${game.i18n.format("TAMS.Checks.Notifications.ReliableReroll", { original: originalResult })}
        </div>` : ""}
        <div class="roll-row"><span>Raw Dice Result:</span><span class="roll-value">${rawResult}</span></div>
        ${statId === "bravery" ? `<div class="roll-row"><small>Target (Bravery):</small><span>${statValue}${familiarity ? " + " + familiarity : ""}${bonus ? " + " + bonus : ""}</span></div>` : `<div class="roll-row"><small>Stat Cap (${statValue}${statMod >= 0 ? "+" : ""}${statMod}):</small><span>${cappedResult}</span></div>
             ${statModSources.length > 0 ? statModSources.map((s) => `<div class="roll-row-detail"><small>${s.label}:</small><span>${s.value >= 0 ? "+" : ""}${s.value}</span></div>`).join("") : ""}
             ${familiarity > 0 ? `<div class="roll-row"><small>Familiarity:</small><span>+${familiarity}</span></div>` : ""}
             ${bonus !== 0 ? `<div class="roll-row"><small>Bonus:</small><span>${bonus >= 0 ? "+" : ""}${bonus}</span></div>` : ""}
             ${bonusSources.length > 0 ? bonusSources.map((s) => `<div class="roll-row-detail"><small>${s.label}:</small><span>${s.value >= 0 ? "+" : ""}${s.value}</span></div>`).join("") : ""}
             ${squadBonus > 0 ? `<div class="roll-row"><small>Squad Bonus:</small><span>+${squadBonus}</span></div>` : ""}`}
        <hr>
        <div class="roll-total">${statId === "bravery" ? "Target to beat" : "Total"}: <b>${statId === "bravery" ? effectiveStat + familiarity + bonus : finalTotal}</b></div>
        ${critInfo}
        <div class="roll-contest-hint">
            ${statId === "bravery" ? `<br><small>Bravery checks are roll-under. Success if Roll <= Target.</small>` : `<br><small><b>Crit Check (Contested):</b> Attacker Raw Dice (${rawResult}) vs 2x Defender Raw Dice.</small>
                 <br><small><b>Crit Check (Static):</b> Total (${finalTotal}) vs 2x Difficulty.</small>`}
        </div>
      </div>
    `;
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.document }),
      content: messageContent,
      rolls: [roll]
    });
  }
  /**
   * Handle toggling the limb multipliers section.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  _onToggleLimbMultipliers(event, target) {
    this._limbMultipliersCollapsed = !this._limbMultipliersCollapsed;
    this.render();
  }
  /**
   * Handle adding a new custom resource.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onResourceAdd(event, target) {
    const resources = [...this.document.system.customResources || []];
    resources.push({
      name: "New Resource",
      nameSecondary: "Secondary",
      value: 0,
      max: 0,
      stat: "endurance",
      mult: 1,
      bonus: 0,
      customValue: 10,
      color: "#3498db",
      isOpposed: false,
      colorSecondary: "#e74c3c"
    });
    return this.document.update({ "system.customResources": resources });
  }
  /**
   * Handle deleting a custom resource.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onResourceDelete(event, target) {
    const index = target.dataset.index;
    const resources = [...this.document.system.customResources || []];
    resources.splice(index, 1);
    return this.document.update({ "system.customResources": resources });
  }
  /**
   * Handle tab switching.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  _onSetTab(event, target) {
    this._activeTab = target.dataset.tab;
    this.render();
  }
};
__publicField(_TAMSActorSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/actor-sheet.html"
  }
});
let TAMSActorSheet = _TAMSActorSheet;
class TAMSLootSheet extends TAMSActorSheet {
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      classes: ["tams", "sheet", "actor", "loot"],
      position: { width: 500, height: 400 }
    }, { inplace: false });
  }
}
__publicField(TAMSLootSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/loot-sheet.html"
  }
});
const _TAMSItemSheet = class _TAMSItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @override */
  static get DEFAULT_OPTIONS() {
    return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
      tag: "form",
      classes: ["tams", "sheet", "item"],
      position: { width: 500, height: 700 },
      window: { resizable: true, scrollable: [".sheet-body"] },
      form: { submitOnChange: true, closeOnSubmit: false },
      actions: {
        editImage: _TAMSItemSheet.prototype._onEditImage,
        modifierCreate: _TAMSItemSheet.prototype._onModifierCreate,
        modifierDelete: _TAMSItemSheet.prototype._onModifierDelete,
        tagToggle: _TAMSItemSheet.prototype._onTagToggle
      }
    }, { inplace: false });
  }
  /** @override */
  get title() {
    return this.document.name;
  }
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.document;
    context.document = this.document;
    context.system = this.document.system;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;
    context.statOptions = {
      "strength": "TAMS.StatStrength",
      "dexterity": "TAMS.StatDexterity",
      "endurance": "TAMS.StatEndurance",
      "wisdom": "TAMS.StatWisdom",
      "intelligence": "TAMS.StatIntelligence",
      "bravery": "TAMS.StatBravery",
      "custom": "TAMS.StatCustom"
    };
    const statOptionsNoCustom = foundry.utils.duplicate(context.statOptions);
    delete statOptionsNoCustom["custom"];
    context.statOptionsNoCustom = statOptionsNoCustom;
    context.weaponStatOptions = {
      "default": "TAMS.Default",
      ...context.statOptions
    };
    delete context.weaponStatOptions["custom"];
    context.limbOptions = {
      "none": "TAMS.CalculatorOptions.None",
      "head": "TAMS.HitLocations.Head",
      "thorax": "TAMS.HitLocations.Thorax",
      "stomach": "TAMS.HitLocations.Stomach",
      "leftArm": "TAMS.HitLocations.LeftArm",
      "rightArm": "TAMS.HitLocations.RightArm",
      "leftLeg": "TAMS.HitLocations.LeftLeg",
      "rightLeg": "TAMS.HitLocations.RightLeg"
    };
    context.sizeOptions = {
      "small": "TAMS.SizeOptions.Small",
      "medium": "TAMS.SizeOptions.Medium",
      "large": "TAMS.SizeOptions.Large"
    };
    const locationOptions = {
      "stowed": "TAMS.LocationOptions.Stowed",
      "backpack": "TAMS.LocationOptions.BackpackLegacy",
      "hand": "TAMS.LocationOptions.Hand"
    };
    if (this.document.actor) {
      const backpacks = this.document.actor.items.filter((i) => i.type === "backpack");
      for (const bp of backpacks) {
        locationOptions[bp.id] = game.i18n.format("TAMS.LocationOptions.InContainer", { name: bp.name });
      }
    }
    context.locationOptions = locationOptions;
    context.modifierTargetOptions = {
      "stats.strength.value": "TAMS.StatStrength",
      "stats.dexterity.value": "TAMS.StatDexterity",
      "stats.endurance.value": "TAMS.StatEndurance",
      "stats.wisdom.value": "TAMS.StatWisdom",
      "stats.intelligence.value": "TAMS.StatIntelligence",
      "stats.bravery.value": "TAMS.StatBravery",
      "hp.max": "TAMS.TotalHPMax",
      "stamina.max": "TAMS.StaminaMax",
      "allRolls": "TAMS.ModifierAllRolls",
      "allProfessionRolls": "TAMS.ModifierAllProfessionRolls"
    };
    if (this.document.type === "weapon") {
      const tags = ["accurate", "reliable", "unreliable", "vicious", "brutal", "balanced", "compact", "reach", "silent"];
      const activeTags = (this.document.system.tags || "").split(",").map((t) => t.trim().toLowerCase());
      context.weaponTags = tags.map((t) => ({
        id: t,
        label: game.i18n.localize(`TAMS.WeaponTags.${t.charAt(0).toUpperCase() + t.slice(1)}`),
        active: activeTags.includes(t)
      }));
    }
    if (this.document.type === "ability") {
      const resources = { "stamina": "TAMS.Stamina" };
      if (this.document.actor) {
        this.document.actor.system.customResources.forEach((res, index) => {
          resources[index.toString()] = res.name;
        });
      }
      context.resourceOptions = resources;
      context.calculatorOptions = {
        bodyParts: {
          "none": "TAMS.CalculatorOptions.None",
          "head": "TAMS.CalculatorOptions.Head",
          "thorax": "TAMS.CalculatorOptions.ThoraxStomach",
          "stomach": "TAMS.CalculatorOptions.ThoraxStomach",
          "arms": "TAMS.CalculatorOptions.ArmsLegs",
          "legs": "TAMS.CalculatorOptions.ArmsLegs"
        },
        fireRates: {
          "single": "TAMS.CalculatorOptions.Single",
          "burst": "TAMS.CalculatorOptions.BurstSemi",
          "auto": "TAMS.CalculatorOptions.FullAuto"
        },
        stunOptions: {
          "none": "TAMS.CalculatorOptions.None",
          "crit": "TAMS.CalculatorOptions.OnCrit",
          "guaranteed": "TAMS.CalculatorOptions.Guaranteed"
        },
        drTypes: {
          "none": "TAMS.CalculatorOptions.None",
          "flat": "TAMS.CalculatorOptions.FlatReduction",
          "specific": "TAMS.CalculatorOptions.SpecificLimbReduction"
        },
        targetTypes: {
          "single": "TAMS.CalculatorOptions.SingleEntity",
          "multiple": "TAMS.CalculatorOptions.MultipleTargets"
        },
        durations: {
          "instant": "TAMS.CalculatorOptions.Instant",
          "1round": "TAMS.CalculatorOptions.Round1",
          "2rounds": "TAMS.CalculatorOptions.Round2",
          "3rounds": "TAMS.CalculatorOptions.Round3",
          "utility1": "TAMS.CalculatorOptions.Utility1",
          "utility2": "TAMS.CalculatorOptions.Utility2",
          "utility3": "TAMS.CalculatorOptions.Utility3",
          "utility4": "TAMS.CalculatorOptions.Utility4"
        },
        damageFractions: {
          "0": "TAMS.CalculatorOptions.DamageFractionNone",
          "0.25": "0.25",
          "0.5": "0.50",
          "0.75": "0.75",
          "1.0": "1.00",
          "1.25": "1.25",
          "1.5": "1.50"
        }
      };
    }
    return context;
  }
  /**
   * Handle editing an image in the item sheet.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onEditImage(event, target) {
    const attr = target.dataset.edit || "img";
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      type: "image",
      current,
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }
  /**
   * Handle creating a new modifier on the item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onModifierCreate(event, target) {
    const modifiers = foundry.utils.duplicate(this.document.system.modifiers || []);
    modifiers.push({ target: "stats.strength.value", value: 0, type: "add" });
    await this.document.update({ "system.modifiers": modifiers });
  }
  /**
   * Handle deleting an existing modifier from the item.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onModifierDelete(event, target) {
    const index = parseInt(target.closest(".modifier-row").dataset.index);
    const modifiers = foundry.utils.duplicate(this.document.system.modifiers || []);
    modifiers.splice(index, 1);
    await this.document.update({ "system.modifiers": modifiers });
  }
  /**
   * Handle toggling a tag on the weapon.
   * @param {Event} event The originating click event.
   * @param {HTMLElement} target The clickable element.
   * @protected
   */
  async _onTagToggle(event, target) {
    const tag = target.dataset.tag;
    const currentTags = this.document.system.tags || "";
    let tagsArray = currentTags ? currentTags.split(",").map((t) => t.trim().toLowerCase()) : [];
    if (tagsArray.includes(tag.toLowerCase())) {
      tagsArray = tagsArray.filter((t) => t.toLowerCase() !== tag.toLowerCase());
    } else {
      tagsArray.push(tag.toLowerCase());
    }
    await this.document.update({ "system.tags": tagsArray.filter((t) => t).join(", ") });
  }
};
__publicField(_TAMSItemSheet, "PARTS", {
  form: {
    template: "systems/tams/templates/item-sheet.html"
  }
});
let TAMSItemSheet = _TAMSItemSheet;
const _TAMSTravelPaceApp = class _TAMSTravelPaceApp extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(options = {}) {
    super(options);
    this.distanceKm = 0;
    this.fmHours = 0;
    this.daysBetweenRest = 0;
    this.warmMealsEnabled = false;
    this.warmMealsValue = 0;
    this.cookUuid = "";
    this.cookDC = 10;
    this.warmMealsResults = [];
    this.membersState = {};
    this.members = [];
    this._focusSelector = null;
  }
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.distanceKm = this.distanceKm;
    context.fmHours = this.fmHours;
    context.daysBetweenRest = this.daysBetweenRest;
    context.warmMealsEnabled = this.warmMealsEnabled;
    context.warmMealsValue = this.warmMealsValue;
    context.cookUuid = this.cookUuid;
    context.cookDC = this.cookDC;
    const mileToKm = 1.60934;
    const memberData = this.members.map((uuid) => {
      var _a, _b;
      const actor = fromUuidSync(uuid);
      if (!actor) return null;
      const state = this.membersState[uuid] || { speed: null, isMounted: false };
      const endurance = ((_b = (_a = actor.system.stats) == null ? void 0 : _a.endurance) == null ? void 0 : _b.value) || 0;
      const end10 = Math.floor(endurance / 10);
      const defaultSpeed = state.isMounted ? 40 : 20;
      const currentSpeed = state.speed !== null && state.speed !== "" ? parseFloat(state.speed) : defaultSpeed;
      const baseSpeedKmPerDay = currentSpeed * mileToKm;
      const adjustedSpeedKmPerDay = baseSpeedKmPerDay * (8 + this.fmHours) / 8;
      return {
        actor,
        uuid,
        state,
        end10,
        currentSpeed,
        baseSpeedKmPerDay,
        adjustedSpeedKmPerDay,
        defaultSpeed
      };
    }).filter((m) => m !== null);
    context.partyCookOptions = memberData.reduce((acc, m) => {
      acc[m.uuid] = m.actor.name;
      return acc;
    }, {});
    const partySpeedKmPerDay = memberData.length > 0 ? Math.min(...memberData.map((m) => m.adjustedSpeedKmPerDay)) : 0;
    const totalTravelDays = partySpeedKmPerDay > 0 ? this.distanceKm / partySpeedKmPerDay : 0;
    let totalElapsedDays = totalTravelDays;
    if (this.daysBetweenRest > 0 && totalTravelDays > 0) {
      const numRests = Math.floor((totalTravelDays - 1e-6) / this.daysBetweenRest);
      totalElapsedDays += numRests;
    }
    context.timeBreakdown = this._formatTime(totalElapsedDays);
    const mealValGlobal = this.warmMealsEnabled ? parseFloat(this.warmMealsValue) || 0 : 0;
    context.members = memberData.map((m) => {
      const staminaPerDay = [];
      let totalStamina = 0;
      if (totalTravelDays > 0) {
        let travelDayCount = 0;
        let daysInCycle = 0;
        const fullTravelDays = Math.floor(totalTravelDays);
        const totalElapsedDaysToIterate = Math.ceil(totalElapsedDays);
        for (let e = 1; e <= totalElapsedDaysToIterate; e++) {
          if (this.daysBetweenRest > 0 && travelDayCount > 0 && travelDayCount % this.daysBetweenRest === 0 && daysInCycle === this.daysBetweenRest) {
            staminaPerDay.push(0);
            daysInCycle = 0;
            continue;
          }
          travelDayCount++;
          daysInCycle++;
          const hasWarmMeal = this.warmMealsEnabled && this.cookUuid && (this.warmMealsResults.length >= travelDayCount ? this.warmMealsResults[travelDayCount - 1] : true);
          const currentMealVal = hasWarmMeal ? parseFloat(this.warmMealsValue) || 0 : 0;
          const bonus = m.end10 + currentMealVal;
          if (travelDayCount <= fullTravelDays) {
            const dailyAccumulatedFM = daysInCycle * this.fmHours;
            const cost = Math.ceil(Math.max(0, dailyAccumulatedFM - bonus));
            staminaPerDay.push(cost);
            totalStamina += cost;
          } else if (travelDayCount > fullTravelDays && travelDayCount <= Math.ceil(totalTravelDays)) {
            const lastDayFraction = totalTravelDays - fullTravelDays;
            if (lastDayFraction > 0) {
              const totalTravelHoursPerDay = 8 + this.fmHours;
              const lastDayHours = lastDayFraction * totalTravelHoursPerDay;
              const lastDayFM = Math.max(0, lastDayHours - 8);
              const dailyAccumulatedFM = (daysInCycle - 1) * this.fmHours + lastDayFM;
              const cost = Math.ceil(Math.max(0, dailyAccumulatedFM - bonus));
              staminaPerDay.push(cost);
              totalStamina += cost;
            }
          }
        }
      }
      let staminaCons = "0";
      let staminaPerRest = 0;
      if (this.daysBetweenRest > 0) {
        for (let d = 1; d <= this.daysBetweenRest; d++) {
          const dailyAccumulatedFM = d * this.fmHours;
          staminaPerRest += Math.ceil(Math.max(0, dailyAccumulatedFM - (m.end10 + mealValGlobal)));
        }
      }
      if (totalStamina > 0) {
        if (staminaPerDay.length <= 5) {
          staminaCons = staminaPerDay.join(", ");
        } else {
          const first = staminaPerDay[0];
          const last = staminaPerDay[staminaPerDay.length - 1];
          staminaCons = `${first} ... ${last} (${game.i18n.localize("TAMS.Total")}: ${totalStamina})`;
        }
      }
      return {
        uuid: m.uuid,
        name: m.actor.name,
        img: m.actor.img,
        speed: m.state.speed,
        isMounted: m.state.isMounted,
        defaultSpeed: m.defaultSpeed,
        currentSpeed: m.currentSpeed,
        staminaCons,
        staminaPerRest,
        staminaPerDay,
        totalStamina,
        end10: m.end10
      };
    });
    return context;
  }
  _formatTime(totalDays) {
    if (totalDays === 0 || isNaN(totalDays)) return null;
    let days = Math.floor(totalDays);
    let fractionalDay = totalDays - days;
    const travelHoursPerDay = 8 + this.fmHours;
    let hours = Math.round(fractionalDay * travelHoursPerDay);
    if (hours >= travelHoursPerDay) {
      days += 1;
      hours -= travelHoursPerDay;
    }
    let months = Math.floor(days / 30);
    days %= 30;
    let weeks = Math.floor(days / 7);
    days %= 7;
    return { months, weeks, days, hours };
  }
  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    html.addEventListener("focusin", (event) => {
      this._storeFocus(event.target);
    }, true);
    html.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("input", (event) => {
        const action = input.dataset.action;
        if (action === "updateValue") this._onUpdateValue(event, input, false);
        else if (action === "updateMember") this._onUpdateMember(event, input, false);
      });
      input.addEventListener("change", (event) => {
        const action = input.dataset.action;
        if (action === "updateValue") this._onUpdateValue(event, input, true);
        else if (action === "updateMember") this._onUpdateMember(event, input, true);
        else if (action === "toggleValue") this._onToggleValue(event, input, true);
      });
    });
    if (this._focusSelector) {
      const el = this.element.querySelector(this._focusSelector);
      if (el) {
        el.focus();
        const supportsSelection = el.type && ["text", "search", "url", "tel", "password"].includes(el.type);
        if (supportsSelection && el.setSelectionRange && this._selectionRange) {
          el.setSelectionRange(this._selectionRange[0], this._selectionRange[1]);
        }
      }
      this._focusSelector = null;
      this._selectionRange = null;
    }
  }
  /* -------------------------------------------- */
  /*  Action Handlers                             */
  /* -------------------------------------------- */
  _onUpdateValue(event, target, render = true) {
    const field = target.dataset.field;
    if (target.type === "number") {
      this[field] = target.value === "" ? 0 : parseFloat(target.value) || 0;
    } else {
      this[field] = target.value;
    }
    if (render) {
      this._storeFocus();
      this.render();
    }
  }
  _onToggleValue(event, target, render = true) {
    const field = target.dataset.field;
    this[field] = target.checked;
    if (render) {
      this._storeFocus();
      this.render();
    }
  }
  _onUpdateMember(event, target, render = true) {
    const actorUuid = target.closest(".member").dataset.actorUuid;
    const field = target.dataset.field;
    if (!this.membersState[actorUuid]) {
      this.membersState[actorUuid] = { speed: null, isMounted: false };
    }
    if (target.type === "checkbox") {
      this.membersState[actorUuid][field] = target.checked;
    } else {
      this.membersState[actorUuid][field] = target.value;
    }
    if (render) {
      this._storeFocus();
      this.render();
    }
  }
  async _onAddMember(event, target) {
    const tokens = canvas.tokens.controlled;
    if (tokens.length === 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectTokensForTravel"));
      return;
    }
    let added = false;
    for (let t of tokens) {
      if (t.actor && !this.members.includes(t.actor.uuid)) {
        this.members.push(t.actor.uuid);
        this.membersState[t.actor.uuid] = { speed: null, isMounted: false };
        added = true;
      }
    }
    if (added) this.render();
  }
  _onRemoveMember(event, target) {
    const actorUuid = target.closest(".member").dataset.actorUuid;
    this.members = this.members.filter((uuid) => uuid !== actorUuid);
    delete this.membersState[actorUuid];
    if (this.cookUuid === actorUuid) this.cookUuid = "";
    this.render();
  }
  async _onMakeCookChecks(event, target) {
    if (!this.warmMealsEnabled) return;
    if (!this.cookUuid) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectCook"));
      return;
    }
    const cookActor = fromUuidSync(this.cookUuid);
    if (!cookActor) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.SelectCook"));
      return;
    }
    if (this.members.length === 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.NoMembersForCook"));
      return;
    }
    if (this.distanceKm <= 0) {
      ui.notifications.warn(game.i18n.localize("TAMS.Notifications.EnterDistance"));
      return;
    }
    const mileToKm = 1.60934;
    const memberSpeeds = this.members.map((uuid) => {
      const state = this.membersState[uuid] || { speed: null, isMounted: false };
      const defaultSpeed = state.isMounted ? 40 : 20;
      return state.speed !== null && state.speed !== "" ? parseFloat(state.speed) : defaultSpeed;
    });
    const partySpeedMiles = memberSpeeds.length > 0 ? Math.min(...memberSpeeds) : 0;
    const adjustedSpeedKmPerDay = partySpeedMiles * mileToKm * (8 + this.fmHours) / 8;
    const totalTravelDays = adjustedSpeedKmPerDay > 0 ? Math.ceil(this.distanceKm / adjustedSpeedKmPerDay) : 0;
    if (totalTravelDays <= 0) return;
    const results = [];
    const dc = this.cookDC || 10;
    const rollSummary = [];
    const skill = cookActor.items.find((i) => {
      if (i.type !== "skill") return false;
      const tags = (i.system.tags || "").split(",").map((t) => t.trim().toLowerCase());
      return tags.includes("cooking");
    });
    const wisdom = cookActor.system.stats.wisdom;
    let statId = "wisdom";
    let statValue = wisdom.value;
    let statMod = wisdom.mod;
    let familiarity = 0;
    let bonus = 0;
    if (skill) {
      statId = skill.system.stat;
      const stat = cookActor.system.stats[statId];
      statValue = stat.value;
      statMod = stat.mod;
      familiarity = parseInt(skill.system.familiarity) || 0;
      bonus = parseInt(skill.system.bonus) || 0;
    }
    for (let d = 1; d <= totalTravelDays; d++) {
      const roll = await new Roll("1d100").evaluate();
      const rawResult = roll.total;
      const cappedResult = Math.min(rawResult, statValue + statMod);
      const total = cappedResult + familiarity + bonus;
      const success = total >= dc;
      results.push(success);
      rollSummary.push(`Day ${d}: ${total} (Roll: ${rawResult}) - ${success ? "Success" : "Failure"}`);
    }
    this.warmMealsResults = results;
    const content = `
      <div class="tams-roll">
        <h3 class="roll-label">${game.i18n.localize("TAMS.MakeCookChecks")}: ${cookActor.name}</h3>
        <p><small>${game.i18n.format("TAMS.CookCheckDescription", { dc })}</small></p>
        <ul style="list-style: none; padding: 0; font-size: 0.9em;">
          ${rollSummary.map((s) => `<li>${s}</li>`).join("")}
        </ul>
      </div>
    `;
    ChatMessage.create({
      user: game.user.id,
      content,
      speaker: ChatMessage.getSpeaker({ actor: cookActor })
    });
    this.render();
  }
  _storeFocus(target = null) {
    var _a;
    target = target || document.activeElement;
    if (!target || !((_a = this.element) == null ? void 0 : _a.contains(target))) return;
    const field = target.dataset.field;
    if (!field) return;
    const member = target.closest(".member");
    if (member) {
      const uuid = member.dataset.actorUuid;
      this._focusSelector = `.member[data-actor-uuid="${uuid}"] [data-field="${field}"]`;
    } else {
      this._focusSelector = `[data-field="${field}"]`;
    }
    const supportsSelection = target.type && ["text", "search", "url", "tel", "password"].includes(target.type);
    if (supportsSelection && target.setSelectionRange) {
      this._selectionRange = [target.selectionStart, target.selectionEnd];
    } else {
      this._selectionRange = null;
    }
  }
  async _onOutputToChat(event, target) {
    const context = await this._prepareContext();
    const { timeBreakdown, members } = context;
    let timeParts = [];
    if (timeBreakdown) {
      if (timeBreakdown.months) timeParts.push(`${timeBreakdown.months} ${game.i18n.localize("TAMS.Months")}`);
      if (timeBreakdown.weeks) timeParts.push(`${timeBreakdown.weeks} ${game.i18n.localize("TAMS.Weeks")}`);
      if (timeBreakdown.days) timeParts.push(`${timeBreakdown.days} ${game.i18n.localize("TAMS.Days")}`);
      if (timeBreakdown.hours) timeParts.push(`${timeBreakdown.hours} ${game.i18n.localize("TAMS.Hours")}`);
    }
    const timeString = timeParts.length > 0 ? timeParts.join(", ") : `0 ${game.i18n.localize("TAMS.Hours")}`;
    let staminaInfo = members.map((m) => {
      const dayBreakdown = m.staminaPerDay.map((cost, i) => cost > 0 ? `${game.i18n.localize("TAMS.Day")} ${i + 1}: ${cost}` : null).filter((d) => d !== null);
      let info = `<li><strong>${m.name}</strong>: ${m.totalStamina} ${game.i18n.localize("TAMS.Stamina")}</li>`;
      if (dayBreakdown.length > 0) {
        info += `<li style="list-style: none; margin-left: 10px; font-size: 0.85em;">${dayBreakdown.join(", ")}</li>`;
      }
      if (m.staminaPerRest) {
        info += `<li style="list-style: none; margin-left: 10px; font-size: 0.8em;">(${game.i18n.localize("TAMS.StaminaPerRest")}: ${m.staminaPerRest})</li>`;
      }
      return info;
    }).join("");
    const content = `
      <div class="tams-roll travel-pace-card">
        <h3 class="roll-label">${game.i18n.localize("TAMS.TravelResults")}</h3>
        <div class="roll-row">
          <span>${game.i18n.localize("TAMS.TravelTimeResult")}:</span>
          <span>${timeString}</span>
        </div>
        <hr>
        <div class="roll-description"><strong>${game.i18n.localize("TAMS.StaminaConsumption")}:</strong></div>
        <ul style="list-style: none; padding: 0; margin: 0;">${staminaInfo}</ul>
      </div>
    `;
    ChatMessage.create({
      user: game.user.id,
      content,
      speaker: ChatMessage.getSpeaker()
    });
  }
};
/** @override */
__publicField(_TAMSTravelPaceApp, "DEFAULT_OPTIONS", {
  tag: "div",
  id: "tams-travel-pace",
  classes: ["tams", "travel-pace"],
  position: { width: 400, height: "auto" },
  window: {
    title: "TAMS.TravelPaceMenu",
    resizable: true,
    icon: "icons/svg/walk.svg"
  },
  actions: {
    addMember: _TAMSTravelPaceApp.prototype._onAddMember,
    removeMember: _TAMSTravelPaceApp.prototype._onRemoveMember,
    makeCookChecks: _TAMSTravelPaceApp.prototype._onMakeCookChecks,
    outputToChat: _TAMSTravelPaceApp.prototype._onOutputToChat
  }
});
/** @override */
__publicField(_TAMSTravelPaceApp, "PARTS", {
  form: {
    template: "systems/tams/templates/travel-pace.html"
  }
});
let TAMSTravelPaceApp = _TAMSTravelPaceApp;
Hooks.once("init", async function() {
  console.log("TAMS | Initializing Todo's Advanced Modular System");
  game.socket.on("system.tams", (data) => {
    if (data.type === "updateMessage" && game.user.isGM) {
      const message = game.messages.get(data.messageId);
      if (message) message.update(data.updateData);
    } else if (data.type === "createLoot" && game.user.isGM) {
      tamsHandleLootDrop(data.lootData, data.x, data.y);
    } else if (data.type === "transferItem" && game.user.isGM) {
      tamsHandleItemTransfer(data);
    }
  });
  game.settings.register("tams", "currencies", {
    name: "TAMS.Currencies",
    hint: "TAMS.SettingsCurrenciesHint",
    scope: "world",
    config: true,
    type: String,
    default: "Gold, Silver, Copper"
  });
  CONFIG.Actor.dataModels.character = TAMSCharacterData;
  CONFIG.Item.dataModels.weapon = TAMSWeaponData;
  CONFIG.Item.dataModels.skill = TAMSSkillData;
  CONFIG.Item.dataModels.ability = TAMSAbilityData;
  CONFIG.Item.dataModels.equipment = TAMSEquipmentData;
  CONFIG.Item.dataModels.armor = TAMSArmorData;
  CONFIG.Item.dataModels.consumable = TAMSConsumableData;
  CONFIG.Item.dataModels.tool = TAMSToolData;
  CONFIG.Item.dataModels.shield = TAMSShieldData;
  CONFIG.Item.dataModels.questItem = TAMSQuestItemData;
  CONFIG.Item.dataModels.backpack = TAMSBackpackData;
  CONFIG.Item.dataModels.trait = TAMSTraitData;
  CONFIG.Item.systemDataModels = CONFIG.Item.dataModels;
  CONFIG.Actor.systemDataModels = CONFIG.Actor.dataModels;
  CONFIG.Actor.documentClass = TAMSActor;
  CONFIG.Item.documentClass = TAMSItem;
  game.tams = {
    travelPace: () => {
      if (!game.tams._travelPaceApp) {
        game.tams._travelPaceApp = new TAMSTravelPaceApp();
      }
      game.tams._travelPaceApp.render(true, { focus: true });
    }
  };
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("tams", TAMSActorSheet, { makeDefault: true });
  foundry.documents.collections.Actors.registerSheet("tams", TAMSLootSheet, {
    types: ["character"],
    makeDefault: false,
    label: "TAMS.LootSheet"
  });
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("tams", TAMSItemSheet, { makeDefault: true });
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("lt", (a, b) => a < b);
  Handlebars.registerHelper("gte", (a, b) => a >= b);
  Handlebars.registerHelper("lte", (a, b) => a <= b);
  Handlebars.registerHelper("or", (...args) => {
    args.pop();
    return args.some((v) => !!v);
  });
  Handlebars.registerHelper("and", (...args) => {
    args.pop();
    return args.every((v) => !!v);
  });
  Handlebars.registerHelper("not", (a) => !a);
  Handlebars.registerHelper("capitalize", (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
  Handlebars.registerHelper("upperCase", (str) => {
    if (!str) return "";
    return str.toUpperCase();
  });
  Hooks.on("renderChatMessage", tamsRenderChatMessage);
});
//# sourceMappingURL=tams.js.map
