/**
 * DataModel for Weapon items.
 */
export class TAMSWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0, nullable: true}),
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "medium"}),
      location: new fields.StringField({initial: "hand"}),
      equipped: new fields.BooleanField({initial: false}),
      isHeavy: new fields.BooleanField({initial: false}),
      isTwoHanded: new fields.BooleanField({initial: false}),
      isLight: new fields.BooleanField({initial: false}),
      isRanged: new fields.BooleanField({initial: false}),
      isThrown: new fields.BooleanField({initial: false}),
      hasArmourPen: new fields.BooleanField({initial: false}),
      armourPenetration: new fields.NumberField({initial: 0, integer: true, min: 0, nullable: true}),
      rangedDamage: new fields.NumberField({initial: 0, nullable: true}),
      ammo: new fields.SchemaField({
        current: new fields.NumberField({initial: 0, integer: true, min: 0}),
        total: new fields.NumberField({initial: 0, integer: true, min: 0})
      }),
      fireRate: new fields.StringField({initial: "1"}),
      fireRateCustom: new fields.NumberField({initial: 1, nullable: true}),
      attackStat: new fields.StringField({initial: "default"}),
      consumeAmmo: new fields.BooleanField({initial: false}),
      special: new fields.StringField({initial: ""}),
      isAoE: new fields.BooleanField({initial: false}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }

  /**
   * The calculated damage of the weapon, derived from actor stats if melee.
   * @type {number}
   */
  get calculatedDamage() {
    // If ranged, damage is player-set and not derived from stats
    if (this.isRanged) return Math.floor(this.rangedDamage || 0);
    const actor = this.parent?.actor;
    if ( !actor ) return 0;
    
    let statKey = "strength";
    if (this.attackStat && this.attackStat !== "default") {
        statKey = this.attackStat;
    } else {
        statKey = this.isLight ? "dexterity" : "strength";
    }

    const statValue = actor.system.stats[statKey]?.total || 0;
    let mult = 0.5;
    if (this.isHeavy) mult += 0.25;
    if (this.isTwoHanded) mult += 0.25;
    return Math.floor(statValue * mult);
  }
}

/**
 * DataModel for Skill items.
 */
export class TAMSSkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0, nullable: true}),
      upgradePoints: new fields.NumberField({initial: 0, nullable: true}),
      bonus: new fields.NumberField({initial: 0, nullable: true}),
      stat: new fields.StringField({initial: "strength"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Equipment items.
 */
export class TAMSEquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "small"}),
      location: new fields.StringField({initial: "stowed"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Armor items.
 */
export class TAMSArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "large"}),
      location: new fields.StringField({initial: "stowed"}),
      equipped: new fields.BooleanField({initial: false}),
      limbs: new fields.SchemaField({
        head: new fields.SchemaField({ value: new fields.NumberField({initial: 0}), max: new fields.NumberField({initial: 0}) }),
        thorax: new fields.SchemaField({ value: new fields.NumberField({initial: 0}), max: new fields.NumberField({initial: 0}) }),
        stomach: new fields.SchemaField({ value: new fields.NumberField({initial: 0}), max: new fields.NumberField({initial: 0}) }),
        leftArm: new fields.SchemaField({ value: new fields.NumberField({initial: 0}), max: new fields.NumberField({initial: 0}) }),
        rightArm: new fields.SchemaField({ value: new fields.NumberField({initial: 0}), max: new fields.NumberField({initial: 0}) }),
        leftLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 0}), max: new fields.NumberField({initial: 0}) }),
        rightLeg: new fields.SchemaField({ value: new fields.NumberField({initial: 0}), max: new fields.NumberField({initial: 0}) })
      }),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Consumable items.
 */
export class TAMSConsumableData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "small"}),
      location: new fields.StringField({initial: "stowed"}),
      uses: new fields.SchemaField({
        value: new fields.NumberField({initial: 0}),
        max: new fields.NumberField({initial: 0})
      }),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Tool items.
 */
export class TAMSToolData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "medium"}),
      location: new fields.StringField({initial: "stowed"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Shield items.
 */
export class TAMSShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      armorValue: new fields.NumberField({initial: 5, integer: true, min: 0}),
      equipped: new fields.BooleanField({initial: false}),
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "medium"}),
      location: new fields.StringField({initial: "hand"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Quest Item items.
 */
export class TAMSQuestItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "small"}),
      location: new fields.StringField({initial: "stowed"}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Backpack items.
 */
export class TAMSBackpackData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      quantity: new fields.NumberField({initial: 1, integer: true, min: 0}),
      size: new fields.StringField({initial: "medium"}),
      location: new fields.StringField({initial: "stowed"}),
      equipped: new fields.BooleanField({initial: false}),
      capacity: new fields.NumberField({initial: 10, integer: true, min: 0}),
      modifier: new fields.NumberField({initial: 0.5, step: 0.1, min: 0}),
      penalties: new fields.SchemaField({
        active: new fields.BooleanField({initial: false}),
        strength: new fields.NumberField({initial: 0, integer: true}),
        dexterity: new fields.NumberField({initial: 0, integer: true}),
        dodge: new fields.NumberField({initial: 0, integer: true}),
        attack: new fields.NumberField({initial: 0, integer: true}),
        movement: new fields.NumberField({initial: 0, integer: true})
      }),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}

/**
 * DataModel for Ability items.
 */
export class TAMSAbilityData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      familiarity: new fields.NumberField({initial: 0, nullable: true}),
      upgradePoints: new fields.NumberField({initial: 0, nullable: true}),
      bonus: new fields.NumberField({initial: 0, nullable: true}),
      cost: new fields.NumberField({initial: 0, nullable: true}),
      resource: new fields.StringField({initial: "stamina"}),
      isApex: new fields.BooleanField({initial: false}),
      isReaction: new fields.BooleanField({initial: false}),
      uses: new fields.SchemaField({
        value: new fields.NumberField({initial: 0}),
        max: new fields.NumberField({initial: 0})
      }),
      isAttack: new fields.BooleanField({initial: false}),
      damage: new fields.NumberField({initial: 0, nullable: true}),
      armourPenetration: new fields.NumberField({initial: 0, integer: true, min: 0, nullable: true}),
      attackStat: new fields.StringField({initial: "strength"}),
      capStat: new fields.StringField({initial: "strength"}),
      damageStat: new fields.StringField({initial: "strength"}),
      damageMult: new fields.NumberField({initial: 0.5, step: 0.05, nullable: true}),
      damageBonus: new fields.NumberField({initial: 0, nullable: true}),
      multiAttack: new fields.NumberField({initial: 1, nullable: true}),
      isAoE: new fields.BooleanField({initial: false}),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""}),
      ifStatement: new fields.StringField({initial: ""}),
      ifCost: new fields.NumberField({initial: 0, integer: true, nullable: true}),
      calculator: new fields.SchemaField({
        enabled: new fields.BooleanField({initial: false}),
        isUtility: new fields.BooleanField({initial: false}),
        effects: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        guaranteedMax: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        detriments: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        movementDoubleOwn: new fields.BooleanField({initial: false}),
        movementHalveEnemy: new fields.BooleanField({initial: false}),
        movementFlat: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        rollBonus: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        ignoreArmor: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        bodyPart: new fields.StringField({initial: "none"}),
        targetLimb: new fields.StringField({initial: "none"}),
        fireRate: new fields.StringField({initial: "single"}),
        multiAttackHits: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        damageStatFraction: new fields.StringField({initial: "0"}),
        stun: new fields.StringField({initial: "none"}),
        healing: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        drType: new fields.StringField({initial: "none"}),
        drValue: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        bypassDodge: new fields.BooleanField({initial: false}),
        bypassRetaliation: new fields.BooleanField({initial: false}),
        targetType: new fields.StringField({initial: "single"}),
        aoeRadius: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        range: new fields.NumberField({initial: 0, integer: true, nullable: true}),
        duration: new fields.StringField({initial: "instant"}),
        isStackable: new fields.BooleanField({initial: false})
      })
    };
  }

  /**
   * The calculated damage of the ability, derived from actor stats if applicable.
   * @type {number}
   */
  get calculatedDamage() {
    if ( !this.isAttack ) return 0;
    const actor = this.parent?.actor;
    if ( !actor ) return 0;

    if (this.damageStat === "custom") {
      return (this.damage || 0) + (this.damageBonus || 0);
    }

    const damageStatValue = actor.system.stats[this.damageStat]?.total || 0;
    return Math.floor(damageStatValue * this.damageMult) + this.damageBonus + (this.damage || 0);
  }

  /**
   * The calculated resource cost of the ability, derived from calculator fields.
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
    else if (c.fireRate === "auto") cost += 4;
    cost += (c.multiAttackHits || 0) * 2;
    const dsf = parseFloat(c.damageStatFraction) || 0;
    if (dsf > 0) cost += (dsf / 0.25) * 1;
    if (c.stun === "crit") cost += 1;
    else if (c.stun === "guaranteed") cost += 2;
    cost += (c.healing || 0) * 1;
    if (c.drType !== "none") cost += (c.drValue || 0) * 1;
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
      if (c.range >= 100 && c.range < 1000) cost += 1;
      else if (c.range >= 1000 && c.range < 10000) cost += 2;
      else if (c.range >= 10000) cost += 3;
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
    if (this.calculator?.enabled) {
      this.cost = this.calculatedCost;
    }
  }
}

/**
 * DataModel for Trait items.
 */
export class TAMSTraitData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      upgradePoints: new fields.NumberField({initial: 0, integer: true, min: 0, nullable: true}),
      isProfession: new fields.BooleanField({initial: false}),
      profession: new fields.StringField({initial: ""}),
      modifiers: new fields.ArrayField(new fields.SchemaField({
        target: new fields.StringField({initial: "stats.strength.value"}),
        value: new fields.NumberField({initial: 0}),
        type: new fields.StringField({initial: "add"})
      })),
      tags: new fields.StringField({initial: ""}),
      description: new fields.HTMLField({initial: ""})
    };
  }
}
